/**
 * EDUCORE-OMEGA File Storage Service
 * 
 * PRODUCTION VERSION: Integrates with Supabase Storage
 * All file operations are logged and permission-gated.
 */

import { supabase, isAnalyticsEnabled } from './supabaseClient';
import { auditService } from './auditService';
import { rbacService } from './rbacService';
import { UserRole } from '../types';

const BUCKET_NAME = 'academic-files';

// Matches 'academic_files' table in DB
export interface FileMetadata {
    id: string;
    name: string;
    storage_path: string;
    mime_type: string;
    size_bytes: number;
    uploaded_by: string; // was owner_id
    class: string;       // was assigned_to_class (split)
    section: string;     // new
    subject: string;     // new
    assigned_to_student?: string; // Added via hotfix
    timetable_period_id?: string;
    created_at: string;
}

// Check if storage is available
const isStorageAvailable = (): boolean => isAnalyticsEnabled && supabase !== null;

export const fileStorageService = {
    /**
     * Check if storage is available
     */
    isAvailable: (): boolean => isStorageAvailable(),

    /**
     * Upload a file to storage
     * Optionally link to a timetable period for class/subject association
     */
    uploadFile: async (
        file: File,
        assignedToClass: string, // "Class-Section" e.g. "9-A"
        subject: string,         // e.g. "Mathematics"
        assignedToStudent?: string,
        timetablePeriodId?: string
    ): Promise<{ success: boolean; data?: FileMetadata; error?: string }> => {
        const currentUser = rbacService.getCurrentUser();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        // Check permission
        if (!rbacService.hasPermission('files:upload', 'create')) {
            await auditService.logAccessDenied(
                currentUser.id,
                currentUser.name,
                currentUser.role.toString(),
                'files:upload',
                'TEACHER'
            );
            return { success: false, error: 'Permission denied. Only teachers and admins can upload files.' };
        }

        if (!isStorageAvailable()) {
            return { success: false, error: 'Storage Unavailable' };
        }

        try {
            // Parse Class-Section
            const [className, sectionName] = assignedToClass.split('-');
            if (!className || !sectionName) {
                return { success: false, error: 'Invalid class format. Expected "Class-Section" (e.g. 10-A)' };
            }

            const timestamp = Date.now();
            const storagePath = `${currentUser.role}/${currentUser.id}/${timestamp}_${file.name}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase!.storage
                .from(BUCKET_NAME)
                .upload(storagePath, file);

            if (uploadError) throw uploadError;

            // Save metadata to database (academic_files table)
            const { data: metadata, error: metaError } = await supabase!
                .from('academic_files')
                .insert([{
                    name: file.name,
                    storage_path: storagePath,
                    mime_type: file.type,
                    size_bytes: file.size,
                    uploaded_by: currentUser.id, // mapped from owner_id
                    class: className,
                    section: sectionName,
                    subject: subject,
                    assigned_to_student: assignedToStudent || null,
                    timetable_period_id: timetablePeriodId,
                }])
                .select()
                .single();

            if (metaError) throw metaError;

            // Audit log
            await auditService.logAccess(
                currentUser.id,
                currentUser.name,
                currentUser.role.toString(),
                'CREATE',
                'file',
                metadata.id,
                `Uploaded file: ${file.name}`
            );

            return { success: true, data: metadata as FileMetadata };
        } catch (err: any) {
            console.error('[FILE STORAGE] Upload failed:', err);
            return { success: false, error: err.message || 'Upload failed' };
        }
    },

    /**
     * Get a signed URL for file download
     */
    getSignedUrl: async (fileId: string): Promise<{ success: boolean; url?: string; error?: string }> => {
        const currentUser = rbacService.getCurrentUser();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        if (!isStorageAvailable()) {
            return { success: false, error: 'Storage Unavailable' };
        }

        try {
            // Get file metadata first
            const { data: file, error: fileError } = await supabase!
                .from('academic_files')
                .select('*')
                .eq('id', fileId)
                .single();

            if (fileError) throw fileError;

            // SECURITY: Enforce RBAC for download action
            if (!rbacService.hasPermission('files:download', 'read')) {
                if (file.uploaded_by !== currentUser.id) {
                    await auditService.logAccessDenied(
                        currentUser.id,
                        currentUser.name,
                        currentUser.role.toString(),
                        'files:download',
                        'READ'
                    );
                    return { success: false, error: 'Permission denied. Role cannot download files.' };
                }
            }

            // Generate signed URL (valid for 1 hour)
            const { data, error } = await supabase!.storage
                .from(BUCKET_NAME)
                .createSignedUrl(file.storage_path, 3600);

            if (error) throw error;

            // Audit log
            await auditService.logAccess(
                currentUser.id,
                currentUser.name,
                currentUser.role.toString(),
                'VIEW',
                'file',
                fileId,
                `Downloaded file: ${file.name}`
            );

            return { success: true, url: data.signedUrl };
        } catch (err: any) {
            console.error('[FILE STORAGE] Get URL failed:', err);
            return { success: false, error: err.message || 'Failed to get download URL' };
        }
    },

    /**
     * List files for a class (for students and parents)
     */
    listFilesForClass: async (classId: string): Promise<FileMetadata[]> => {
        if (!isStorageAvailable()) {
            return [];
        }

        try {
            const [className, sectionName] = classId.split('-');

            const { data, error } = await supabase!
                .from('academic_files')
                .select('*')
                .eq('class', className)
                .eq('section', sectionName)
                .is('assigned_to_student', null) // Only general class files
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as FileMetadata[] || [];
        } catch (err) {
            console.error('[FILE STORAGE] List files failed:', err);
            return [];
        }
    },

    /**
     * List files for a specific student (including personal + class files)
     */
    listFilesForStudent: async (studentId: string, classId?: string): Promise<FileMetadata[]> => {
        if (!isStorageAvailable()) {
            return [];
        }

        try {
            let query = supabase!.from('academic_files').select('*');

            if (classId) {
                const [className, sectionName] = classId.split('-');
                // Get files assigned to this student OR their class
                query = query.or(`assigned_to_student.eq.${studentId},and(class.eq.${className},section.eq.${sectionName})`);
            } else {
                query = query.eq('assigned_to_student', studentId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return data as FileMetadata[] || [];
        } catch (err) {
            console.error('[FILE STORAGE] List student files failed:', err);
            return [];
        }
    },

    /**
     * List all files (admin only)
     */
    listAllFiles: async (): Promise<FileMetadata[]> => {
        const currentUser = rbacService.getCurrentUser();
        if (!currentUser || !rbacService.hasPermission('files:upload', 'admin')) {
            return [];
        }

        if (!isStorageAvailable()) {
            return [];
        }

        try {
            const { data, error } = await supabase!
                .from('academic_files')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            return data as FileMetadata[] || [];
        } catch (err) {
            console.error('[FILE STORAGE] List all files failed:', err);
            return [];
        }
    },

    /**
     * Delete a file (admin only)
     */
    deleteFile: async (fileId: string): Promise<{ success: boolean; error?: string }> => {
        const currentUser = rbacService.getCurrentUser();
        if (!currentUser || !rbacService.hasPermission('files:upload', 'delete')) {
            return { success: false, error: 'Permission denied' };
        }

        if (!isStorageAvailable()) {
            return { success: false, error: 'Storage Unavailable' };
        }

        try {
            // Get file metadata first
            const { data: file, error: fileError } = await supabase!
                .from('academic_files')
                .select('*')
                .eq('id', fileId)
                .single();

            if (fileError) throw fileError;

            // Delete from storage
            const { error: storageError } = await supabase!.storage
                .from(BUCKET_NAME)
                .remove([file.storage_path]);

            if (storageError) throw storageError;

            // Delete metadata
            const { error: metaError } = await supabase!
                .from('academic_files')
                .delete()
                .eq('id', fileId);

            if (metaError) throw metaError;

            // Audit log
            await auditService.logAccess(
                currentUser.id,
                currentUser.name,
                currentUser.role.toString(),
                'DELETE',
                'file',
                fileId,
                `Deleted file: ${file.name}`
            );

            return { success: true };
        } catch (err: any) {
            console.error('[FILE STORAGE] Delete failed:', err);
            return { success: false, error: err.message || 'Delete failed' };
        }
    },

    /**
     * Get demo files for testing
     */
    getDemoFiles: (): FileMetadata[] => [],
};

export default fileStorageService;

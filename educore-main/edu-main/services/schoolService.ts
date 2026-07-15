/**
 * EDUCORE-OMEGA School Structure Service
 * 
 * PRODUCTION VERSION: Full Supabase persistence
 * Manages Classes, Sections, and Subjects (Normalized Schema)
 */

import { supabase, isAnalyticsEnabled } from './supabaseClient';
import { auditService } from './auditService';
import { rbacService } from './rbacService';

// ============================================
// TYPES (Updated to match Refactored Schema)
// ============================================

export interface SchoolClass {
    id: string;
    grade_level: string; // Changed from number to string to match DB
    section: string;
    status: 'active' | 'archived';
    created_at: string;
}

export interface Subject {
    id: string;
    class_id: string; // Foreign Key to classes
    name: string;
    code: string;
    status: 'active' | 'archived';
    created_at: string;
}

export interface TeacherAssignment {
    id: string;
    subject_id: string;
    teacher_id: string;
    assigned_by: string;
    assigned_at: string;
}

export interface ClassAssignment {
    id: string;
    class_id: string;
    subject_id?: string; // Optional: can assign "Class Teacher" without a specific subject if desired, or link to Subject
    teacher_id: string;
    is_primary: boolean;
    assigned_by: string;
    created_at: string;
}

// Demo fallback data (Legacy support removed for clarity, or updated)
// ... keeping minimal demo data for fallbacks if needed, but updated structure

// ============================================
// SERVICE
// ============================================

// ============================================
// SERVICE
// ============================================

const isPersistenceAvailable = (): boolean => {
    return isAnalyticsEnabled && supabase !== null;
};

export const schoolService = {
    // ────────────────────────────────────────
    // CLASSES
    // ────────────────────────────────────────

    /**
     * Get all classes (Admin/Teachers) or User's class (Student)
     */
    async getClasses(): Promise<{ data: SchoolClass[]; error?: string }> {
        if (!isPersistenceAvailable()) return { data: [], error: 'DB Unavailable' };

        try {
            const { data, error } = await supabase!
                .from('classes')
                .select('*')
                .order('grade_level', { ascending: true })
                .order('section', { ascending: true });

            if (error) throw error;
            return { data: data as SchoolClass[] };
        } catch (err: any) {
            console.error('[SCHOOL] Failed to fetch classes:', err);
            return { data: [], error: err.message };
        }
    },

    /**
     * Create a new Class (Admin Only)
     */
    async createClass(
        classData: { grade_level: string; section: string },
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; data?: SchoolClass; error?: string }> {
        // RBAC Check
        try {
            rbacService.enforce('school:classes', 'create');
        } catch (e: any) {
            return { success: false, error: e.message };
        }

        try {
            const { data, error } = await supabase!
                .from('classes')
                .insert([{ ...classData, status: 'active' }])
                .select()
                .single();

            if (error) throw error;

            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'CREATE',
                entity: 'school:class',
                entity_id: data.id,
                severity: 'success',
                details: `Created Class: ${classData.grade_level}-${classData.section}`
            });

            return { success: true, data: data as SchoolClass };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    // ────────────────────────────────────────
    // SUBJECTS
    // ────────────────────────────────────────

    /**
     * Get Subjects for a specific Class
     */
    async getSubjectsByClass(classId: string): Promise<{ data: Subject[]; error?: string }> {
        if (!isPersistenceAvailable()) return { data: [], error: 'DB Unavailable' };

        try {
            const { data, error } = await supabase!
                .from('subjects')
                .select('*')
                .eq('class_id', classId)
                .order('name', { ascending: true });

            if (error) throw error;
            return { data: data as Subject[] };
        } catch (err: any) {
            return { data: [], error: err.message };
        }
    },

    /**
     * Create a Subject linked to a Class (Admin Only)
     */
    async createSubject(
        subjectData: { class_id: string; name: string; code: string },
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; data?: Subject; error?: string }> {
        // RBAC Check
        try {
            rbacService.enforce('school:subjects', 'create');
        } catch (e: any) {
            return { success: false, error: e.message };
        }

        try {
            const { data, error } = await supabase!
                .from('subjects')
                .insert([{ ...subjectData, status: 'active' }])
                .select()
                .single();

            if (error) throw error;

            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'CREATE',
                entity: 'school:subject',
                entity_id: data.id,
                severity: 'success',
                details: `Created Subject: ${subjectData.name} (${subjectData.code})`
            });

            return { success: true, data: data as Subject };
        } catch (err: any) {
            // Handle Unique Constraint Violation (Grade + Section)
            if (err.code === '23505') return { success: false, error: 'Subject already exists in this class.' };
            return { success: false, error: err.message };
        }
    },

    /**
     * Get All Subjects (Admin View)
     */
    async getSubjects(): Promise<{ data: Subject[]; error?: string }> {
        if (!isPersistenceAvailable()) return { data: [], error: 'DB Unavailable' };

        try {
            const { data, error } = await supabase!
                .from('subjects')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return { data: data as Subject[] };
        } catch (err: any) {
            return { data: [], error: err.message };
        }
    },

    // ────────────────────────────────────────
    // CLASS TEACHER ASSIGNMENTS (Phase 2)
    // ────────────────────────────────────────

    /**
     * Assign a Teacher to a Class (e.g. Class Teacher)
     */
    async assignClassTeacher(
        classId: string,
        teacherId: string,
        isPrimary: boolean,
        subjectId: string | null,
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; error?: string }> {
        // RBAC Check
        try {
            rbacService.enforce('teacher:assignments', 'create');
        } catch (e: any) {
            return { success: false, error: e.message };
        }

        try {
            const { data, error } = await supabase!
                .from('class_teacher_assignments')
                .upsert({
                    class_id: classId,
                    teacher_id: teacherId,
                    subject_id: subjectId, // Can be null if just "Class Teacher" role, but schema might require it per UNIQUE constraint logic. 
                    // Schema UNIQUE(class_id, subject_id, teacher_id). If subject_id is nullable, this works.
                    is_primary: isPrimary,
                    assigned_by: actorId
                }, { onConflict: 'class_id,subject_id,teacher_id' })
                .select()
                .single();

            if (error) throw error;

            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'CREATE',
                entity: 'teacher:assignments',
                entity_id: data.id,
                severity: 'success',
                details: `Assigned Teacher ${teacherId} to Class ${classId} (Primary: ${isPrimary})`
            });

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Get Assignments for a Class
     */
    async getClassAssignments(classId: string): Promise<{ data: ClassAssignment[]; error?: string }> {
        if (!isPersistenceAvailable()) return { data: [], error: 'DB Unavailable' };

        try {
            const { data, error } = await supabase!
                .from('class_teacher_assignments')
                .select(`
                    *,
                    teacher:teachers(id, name, email, phone),
                    subject:subjects(id, name, code)
                `)
                .eq('class_id', classId)
                .order('is_primary', { ascending: false }); // Show Class Teachers first

            if (error) throw error;
            return { data: data as any[] };
        } catch (err: any) {
            return { data: [], error: err.message };
        }
    },

    /**
     * Get Classes Assigned to a Teacher
     */
    async getTeacherAssignments(teacherId: string): Promise<{ data: any[]; error?: string }> {
        if (!isPersistenceAvailable()) return { data: [], error: 'DB Unavailable' };

        try {
            // Join with classes table to get details
            const { data, error } = await supabase!
                .from('class_teacher_assignments')
                .select(`
                    *,
                    class:classes(id, grade_level, section),
                    subject:subjects(id, name)
                `)
                .eq('teacher_id', teacherId);

            if (error) throw error;

            // Transform into cleaner structure if needed
            return { data: data || [] };
        } catch (err: any) {
            console.error('[SCHOOL] Failed to fetch teacher assignments:', err);
            return { data: [], error: err.message };
        }
    },

    /**
     * Remove a Class Teacher Assignment
     */
    async removeClassAssignment(
        assignmentId: string,
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            rbacService.enforce('teacher:assignments', 'delete');

            const { error } = await supabase!
                .from('class_teacher_assignments')
                .delete()
                .eq('id', assignmentId);

            if (error) throw error;

            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'DELETE',
                entity: 'teacher:assignments',
                entity_id: assignmentId,
                severity: 'warning',
                details: 'Removed Teacher Assignment'
            });

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    // ────────────────────────────────────────
    // TEACHER ASSIGNMENTS (Subject Level - Legacy/Specific)
    // ────────────────────────────────────────

    /**
     * Assign a Teacher to a Subject (Admin Only)
     */
    async assignTeacherToSubject(
        subjectId: string,
        teacherId: string,
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; error?: string }> {
        // RBAC Check
        try {
            rbacService.enforce('teacher:assignments', 'create'); // Using teacher:assignments per matrix
        } catch (e: any) {
            return { success: false, error: e.message };
        }

        try {
            // Check if assignment exists? Unique constraint on subject_id handles this.
            const { data, error } = await supabase!
                .from('subject_teacher_assignments')
                .upsert({
                    subject_id: subjectId,
                    teacher_id: teacherId,
                    assigned_by: actorId,
                    assigned_at: new Date().toISOString()
                }, { onConflict: 'subject_id' }) // Upsert allows changing teacher
                .select()
                .single();

            if (error) throw error;

            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'UPDATE', // UPSERT is effectively an update of assignment
                entity: 'teacher:assignments',
                entity_id: data.id,
                severity: 'success',
                details: `Assigned Teacher ${teacherId} to Subject ${subjectId}`
            });

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Delete a Class (Admin Only)
     */
    async deleteClass(
        id: string,
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            rbacService.enforce('school:classes', 'delete');

            const { error } = await supabase!.from('classes').delete().eq('id', id);
            if (error) throw error;

            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'DELETE',
                entity: 'school:class',
                entity_id: id,
                severity: 'warning',
                details: 'Deleted Class'
            });

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Delete a Subject (Admin Only)
     */
    async deleteSubject(
        id: string,
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            rbacService.enforce('school:subjects', 'delete');

            const { error } = await supabase!.from('subjects').delete().eq('id', id);
            if (error) throw error;

            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'DELETE',
                entity: 'school:subject',
                entity_id: id,
                severity: 'warning',
                details: 'Deleted Subject'
            });

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }
};

export default schoolService;

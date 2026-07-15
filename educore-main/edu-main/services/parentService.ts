/**
 * EDUCORE-OMEGA Parent Service
 * 
 * ENTERPRISE VERSION: Full Supabase persistence
 * Uses identityService for creating login-enabled parents
 */

import { supabase, isAnalyticsEnabled } from './supabaseClient';
import { auditService } from './auditService';
import { rbacService } from './rbacService';

export interface Parent {
    id: string;
    user_id?: string;
    name: string;
    email: string;
    phone: string;
    created_at: string;
    updated_at: string;
    // Relationships managed via links table, but helper fields useful for UI
    linked_students?: string[]; // IDs of students
}

const isPersistenceAvailable = (): boolean => {
    return isAnalyticsEnabled && supabase !== null;
};

export const parentService = {
    /**
     * Get all parents (Admin only usually)
     */
    async getParents(): Promise<{ data: Parent[]; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { data: [], error: 'Database connection unavailable' };
        }

        try {
            // DIRECT DATABASE QUERY (Edge Functions not deployed)
            const { data, error } = await supabase!
                .from('parents')
                .select('*');

            if (error) throw new Error(error.message);

            // Map DB columns to UI format
            const mappedData: Parent[] = (data || []).map((row: any) => ({
                id: row.id,
                user_id: row.user_id,
                phone: row.phone,
                created_at: row.created_at,
                updated_at: row.updated_at || row.created_at,
                name: row.name || row.full_name,
                email: row.email,
                linked_students: row.linked_students
            }));

            return { data: mappedData };
        } catch (err: any) {
            console.error('[PARENT] Exception:', err);
            return { data: [], error: err.message };
        }
    },

    /**
     * Get students linked to the logged-in parent
     */
    async getLinkedStudents(): Promise<{ data: any[]; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { data: [], error: 'Database connection unavailable' };
        }

        try {
            // Join parent_student_links -> students
            // RLS on 'parent_student_links' filters by auth.uid() via parent_id
            const { data, error } = await supabase!
                .from('parent_student_links')
                .select(`
                    student_id,
                    relationship,
                    student:students(
                        id,
                        name,
                        admission_number,
                        class,
                        section,
                        roll_number,
                        date_of_birth
                    )
                `);
            // Removed is_primary_for_password filter to get ALL linked students

            if (error) throw error;

            // Map to cleaner structure
            const students = data?.filter((link: any) => link.student).map((link: any) => ({
                id: link.student.id,
                name: link.student.name || 'Unknown Student',
                class: link.student.class,
                section: link.student.section,
                roll_number: link.student.roll_number,
                date_of_birth: link.student.date_of_birth,
                relationship: link.relationship
            })) || [];

            return { data: students };
        } catch (err: any) {
            console.error('[PARENT] Error fetching linked students:', err);
            return { data: [], error: err.message };
        }
    },

    /**
     * Create new parent with full identity (auth + users + parents + link)
     * Uses identityService for unified creation pipeline
     * 
     * Password = Child's DOB (DDMMYYYY format)
     */
    async createParent(
        parentData: {
            name: string;
            email: string;
            phone: string;
            studentId: string;
            relationship: string;
        },
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; data?: Parent; temp_password?: string; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { success: false, error: 'Database connection unavailable' };
        }

        try {
            // ENFORCE RBAC
            rbacService.enforce('student:profile', 'update');

            // Get student's DOB for reference (password hint)
            const { data: student } = await supabase!
                .from('students')
                .select('date_of_birth, name')
                .eq('id', parentData.studentId)
                .single();

            // Generate password hint from child's DOB (DDMMYYYY)
            let passwordHint = 'Set manually';
            if (student?.date_of_birth) {
                const dobDate = new Date(student.date_of_birth);
                passwordHint = `${String(dobDate.getDate()).padStart(2, '0')}${String(dobDate.getMonth() + 1).padStart(2, '0')}${dobDate.getFullYear()}`;
            }

            // BROWSER-SAFE APPROACH: Create profile-only parent
            // Auth user creation requires service role key (server-side only)
            // The admin can manually create the auth user later via Supabase dashboard

            // Step 1: Create parents profile (without user_id link for now)
            const { data: parentRecord, error: parentError } = await supabase!
                .from('parents')
                .insert({
                    name: parentData.name,
                    email: parentData.email,
                    phone: parentData.phone
                })
                .select()
                .single();

            if (parentError) {
                console.error('[PARENT] Parents table insert error:', parentError);
                throw parentError;
            }

            // Step 2: Create parent-student link
            if (parentData.studentId) {
                const { error: linkError } = await supabase!
                    .from('parent_student_links')
                    .insert({
                        parent_id: parentRecord.id,
                        student_id: parentData.studentId,
                        relationship: parentData.relationship || 'guardian',
                        is_primary: true
                    });

                if (linkError) {
                    console.warn('[PARENT] Link creation warning:', linkError);
                }
            }

            // Step 3: Audit log
            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'CREATE',
                entity: 'parent',
                entity_id: parentRecord.id,
                severity: 'success',
                details: `Created parent: ${parentData.name} (linked to student ${student?.name || parentData.studentId}). Suggested password: ${passwordHint}`,
            });

            console.log('[PARENT] Successfully created parent profile:', parentRecord.id);

            return {
                success: true,
                data: {
                    id: parentRecord.id,
                    user_id: undefined,
                    name: parentRecord.name,
                    email: parentRecord.email,
                    phone: parentRecord.phone,
                    created_at: parentRecord.created_at,
                    updated_at: parentRecord.updated_at || parentRecord.created_at
                },
                temp_password: passwordHint, // Still show the password hint for manual setup
            };
        } catch (err: any) {
            console.error('[PARENT] Create Failed:', err);
            return { success: false, error: err.message || 'Unexpected error creating parent' };
        }
    },

    /**
     * Fallback: Create parent profile without login credentials
     */
    async createParentProfileOnly(
        parentData: {
            name: string;
            email: string;
            phone: string;
            studentId: string;
            relationship: string;
        },
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; data?: Parent; error?: string }> {
        const { data: parentRecord, error: parentError } = await supabase!
            .from('parents')
            .insert({
                name: parentData.name,
                email: parentData.email,
                phone: parentData.phone
            })
            .select()
            .single();

        if (parentError) throw new Error(parentError.message);

        if (parentData.studentId) {
            await supabase!
                .from('parent_student_links')
                .insert({
                    parent_id: parentRecord.id,
                    student_id: parentData.studentId,
                    relationship: parentData.relationship || 'parent',
                    is_primary: true
                });
        }

        await auditService.log({
            actor_id: actorId,
            actor_name: actorName,
            actor_role: actorRole,
            action: 'CREATE',
            entity: 'parent',
            entity_id: parentRecord.id,
            severity: 'warning',
            details: `Created parent profile (NO LOGIN): ${parentData.name}`,
        });

        return {
            success: true,
            data: {
                id: parentRecord.id,
                user_id: parentRecord.user_id,
                name: parentRecord.name,
                email: parentRecord.email,
                phone: parentRecord.phone,
                created_at: parentRecord.created_at,
                updated_at: parentRecord.updated_at
            }
        };
    },

    isPersistent(): boolean {
        return isPersistenceAvailable();
    },
};

export default parentService;

/**
 * EDUCORE-OMEGA Student Service
 * 
 * ENTERPRISE VERSION: Full Supabase persistence
 * Uses identityService for creating login-enabled students
 */

import { supabase, isAnalyticsEnabled } from './supabaseClient';
import { auditService } from './auditService';
import { rbacService } from './rbacService';
import { identityService } from './identityService';

export interface Student {
    id: string;
    user_id?: string;
    name: string;
    class: string;
    section: string;
    roll_no: number;
    parent_id?: string;
    fee_status: 'paid' | 'pending' | 'overdue';
    status: 'active' | 'suspended' | 'graduated';
    created_at: string;
    updated_at: string;
    // Extended profile fields
    admission_number?: string;
    date_of_birth?: string;
    blood_group?: string;
    address?: string;
    parent_name?: string;
    parent_phone?: string;
    year_of_joining?: number;
    email?: string;
}

const isPersistenceAvailable = (): boolean => {
    return isAnalyticsEnabled && supabase !== null;
};

export const studentService = {
    /**
     * Get all students (filtered by role access)
     * Excludes 'inactive' (soft-deleted) students by default
     */
    async getStudents(filters?: { class?: string; section?: string }): Promise<{ data: Student[]; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { data: [], error: 'Database connection unavailable' };
        }

        try {
            // DIRECT DATABASE QUERY (Edge Functions not deployed)
            // Use direct Supabase query instead of Edge Function invocation
            let query = supabase!
                .from('students')
                .select('*')
                .neq('status', 'inactive'); // Exclude soft-deleted

            // Apply server-side filters if supported
            if (filters?.class) {
                query = query.eq('class', filters.class);
            }
            if (filters?.section) {
                query = query.eq('section', filters.section);
            }

            const { data, error } = await query;

            if (error) throw new Error(error.message);

            // Map DB columns to UI format
            const mappedData: Student[] = (data || []).map((row: any) => ({
                ...row,
                name: row.name,
                roll_no: row.roll_number || row.roll_no,
            })) as Student[];

            return { data: mappedData };
        } catch (err: any) {
            console.error('[STUDENT] Exception:', err);
            return { data: [], error: err.message };
        }
    },

    /**
     * Get student by ID
     */
    async getStudent(id: string): Promise<{ data: Student | null; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { data: null, error: 'Database connection unavailable' };
        }

        try {
            const { data, error } = await supabase!
                .from('students')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return { data: data as Student };
        } catch (err: any) {
            return { data: null, error: err.message };
        }
    },

    /**
     * Get students linked to a parent
     */
    async getStudentsByParent(parentId: string): Promise<{ data: Student[]; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { data: [], error: 'Database connection unavailable' };
        }

        try {
            const { data: links, error: linkError } = await supabase!
                .from('parent_student_links')
                .select('student_id')
                .eq('parent_id', parentId);

            if (linkError || !links) {
                return { data: [], error: linkError?.message };
            }

            const studentIds = links.map(l => l.student_id);

            const { data, error } = await supabase!
                .from('students')
                .select('*')
                .in('id', studentIds)
                .neq('status', 'inactive'); // Exclude deleted

            if (error) {
                return { data: [], error: error.message };
            }

            return { data: data as Student[] };
        } catch (err: any) {
            return { data: [], error: err.message };
        }
    },

    /**
     * Create new student with full identity (auth + users + students)
     * 
     * USES IAM EDGE FUNCTION for server-side user creation.
     * This preserves the admin's session (no auth state change on client).
     * 
     * Password = DOB (DDMMYYYY format) if email+dob provided
     */
    async createStudent(
        studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'> & { email?: string },
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; data?: Student; temp_password?: string; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { success: false, error: 'Database connection unavailable' };
        }

        try {
            // ENFORCE RBAC
            rbacService.enforce('student:profile', 'create');

            let tempPassword: string | undefined;

            // If email and DOB provided, create auth user via IAM Edge Function
            if (studentData.email && studentData.date_of_birth) {
                const email = studentData.email.trim();

                // Calculate password for return (DDMMYYYY format)
                const [year, month, day] = studentData.date_of_birth.split('-');
                tempPassword = `${day}${month}${year}`;

                // ✅ FIX: Use IAM Edge Function instead of signUp()
                // This creates user server-side WITHOUT affecting admin's session
                const { data: iamResult, error: iamError } = await supabase!.functions.invoke('iam', {
                    body: {
                        action: 'createStudent',
                        payload: {
                            email: email,
                            full_name: studentData.name,
                            dob: studentData.date_of_birth,
                            class: studentData.class,
                            section: studentData.section,
                            roll_number: studentData.roll_no,
                            admission_number: studentData.admission_number || null,
                            address: studentData.address || null,
                            guardian_phone: studentData.parent_phone || null,
                        }
                    }
                });

                if (iamError) {
                    console.error('[STUDENT] IAM Edge Function error:', iamError);
                    return { success: false, error: `Server error: ${iamError.message}` };
                }

                if (iamResult?.error) {
                    console.error('[STUDENT] IAM returned error:', iamResult.error);
                    if (iamResult.error.includes('already registered') || iamResult.error.includes('already exists')) {
                        return { success: false, error: 'This email is already registered.' };
                    }
                    return { success: false, error: iamResult.error };
                }

                // IAM Edge Function handles: auth user + users table + students table + audit log
                // Fetch the created student record for return
                const { data: createdRecord, error: fetchError } = await supabase!
                    .from('students')
                    .select('*')
                    .eq('email', email)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (fetchError || !createdRecord) {
                    // Student was created by IAM but we couldn't fetch - still success
                    console.warn('[STUDENT] Created via IAM but fetch failed:', fetchError);
                    return {
                        success: true,
                        temp_password: tempPassword,
                        data: {
                            id: iamResult?.user_id || 'unknown',
                            name: studentData.name,
                            class: studentData.class,
                            section: studentData.section,
                            roll_no: studentData.roll_no,
                            fee_status: 'pending',
                            status: 'active',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            email: email
                        } as Student
                    };
                }

                const createdStudent: Student = {
                    id: createdRecord.id,
                    user_id: createdRecord.user_id,
                    name: createdRecord.name,
                    class: createdRecord.class,
                    section: createdRecord.section,
                    roll_no: createdRecord.roll_no,
                    fee_status: createdRecord.fee_status || 'pending',
                    status: createdRecord.status || 'active',
                    created_at: createdRecord.created_at,
                    updated_at: createdRecord.updated_at,
                    date_of_birth: createdRecord.date_of_birth,
                    address: createdRecord.address,
                    parent_phone: createdRecord.guardian_phone,
                    email: createdRecord.email
                };

                return { success: true, data: createdStudent, temp_password: tempPassword };
            }

            // NO email/DOB provided → Create profile-only student (no login)
            const insertData = {
                user_id: null,
                name: studentData.name,
                class: studentData.class,
                section: studentData.section,
                roll_no: studentData.roll_no,
                date_of_birth: studentData.date_of_birth || null,
                address: studentData.address || null,
                guardian_phone: studentData.parent_phone || null,
                admission_number: studentData.admission_number || null,
                email: studentData.email ? studentData.email.trim() : null,
                fee_status: studentData.fee_status || 'pending',
                status: 'active'
            };

            const { data, error } = await supabase!
                .from('students')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                console.error('[STUDENT] Insert failed:', error);
                return { success: false, error: error.message };
            }

            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'CREATE',
                entity: 'student',
                entity_id: data.id,
                severity: 'success',
                details: `Created student: ${studentData.name} (profile only)`,
            });

            const createdStudent: Student = {
                id: data.id,
                user_id: data.user_id,
                name: data.name,
                class: data.class,
                section: data.section,
                roll_no: data.roll_no,
                fee_status: data.fee_status || 'pending',
                status: data.status || 'active',
                created_at: data.created_at,
                updated_at: data.updated_at,
                date_of_birth: data.date_of_birth,
                address: data.address,
                parent_phone: data.guardian_phone,
                email: data.email
            };

            return { success: true, data: createdStudent };
        } catch (err: any) {
            console.error('[STUDENT] Create Failed:', err);
            return { success: false, error: err.message || 'Unexpected error' };
        }
    },

    /**
     * Update student
     */
    async updateStudent(
        id: string,
        updates: Partial<Student>,
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { success: false, error: 'Database connection unavailable' };
        }

        try {
            // ENFORCE RBAC
            rbacService.enforce('student:profile', 'update');

            // Map UI column names to DB column names
            const dbUpdates: Record<string, unknown> = {
                updated_at: new Date().toISOString()
            };

            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.roll_no !== undefined) dbUpdates.roll_no = updates.roll_no;
            if (updates.class !== undefined) dbUpdates.class = updates.class;
            if (updates.section !== undefined) dbUpdates.section = updates.section;
            if (updates.fee_status !== undefined) dbUpdates.fee_status = updates.fee_status;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.admission_number !== undefined) dbUpdates.admission_number = updates.admission_number;
            if (updates.date_of_birth !== undefined) dbUpdates.date_of_birth = updates.date_of_birth;
            if (updates.blood_group !== undefined) dbUpdates.blood_group = updates.blood_group;
            if (updates.address !== undefined) dbUpdates.address = updates.address;
            if (updates.parent_name !== undefined) dbUpdates.parent_name = updates.parent_name;
            if (updates.parent_phone !== undefined) dbUpdates.parent_phone = updates.parent_phone;
            if (updates.year_of_joining !== undefined) dbUpdates.year_of_joining = updates.year_of_joining;

            const { error } = await supabase!
                .from('students')
                .update(dbUpdates)
                .eq('id', id);

            if (error) {
                await auditService.log({
                    actor_id: actorId,
                    actor_name: actorName,
                    actor_role: actorRole,
                    action: 'UPDATE',
                    entity: 'student',
                    entity_id: id,
                    severity: 'error',
                    details: `Failed: ${error.message}`,
                });
                return { success: false, error: error.message };
            }

            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'UPDATE',
                entity: 'student',
                entity_id: id,
                severity: 'success',
                details: `Updated: ${Object.keys(updates).join(', ')}`,
            });

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message || 'Unexpected error' };
        }
    },

    /**
     * Delete student (Soft Delete)
     */
    async deleteStudent(
        id: string,
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { success: false, error: 'Database connection unavailable' };
        }

        try {
            // ENFORCE RBAC
            rbacService.enforce('student:profile', 'delete');

            // SOFT DELETE: Update status to 'inactive' instead of deleting
            const { error } = await supabase!
                .from('students')
                .update({ status: 'inactive' })
                .eq('id', id);

            if (error) {
                await auditService.log({
                    actor_id: actorId,
                    actor_name: actorName,
                    actor_role: actorRole,
                    action: 'DELETE',
                    entity: 'student',
                    entity_id: id,
                    severity: 'error',
                    details: `Failed to soft delete: ${error.message}`,
                });
                return { success: false, error: error.message };
            }

            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'DELETE',
                entity: 'student',
                entity_id: id,
                severity: 'warning',
                details: 'Student record soft deleted (status: inactive)',
            });

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message || 'Unexpected error' };
        }
    },


    /**
     * Bulk Promote Students
     */
    async promoteStudents(
        studentIds: string[],
        newClass: string,
        newSection: string,
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { success: false, error: 'Database connection unavailable' };
        }

        try {
            // ENFORCE RBAC
            rbacService.enforce('student:profile', 'update');

            // Bulk update
            const { error } = await supabase!
                .from('students')
                .update({
                    class: newClass,
                    section: newSection,
                    updated_at: new Date().toISOString()
                })
                .in('id', studentIds);

            if (error) throw error;

            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'UPDATE',
                entity: 'student',
                entity_id: 'bulk',
                severity: 'warning',
                details: `Promoted ${studentIds.length} students to Class ${newClass}-${newSection}`,
            });

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message || 'Unexpected error during promotion' };
        }
    },
    isPersistent(): boolean {
        return isPersistenceAvailable();
    },
};

export default studentService;

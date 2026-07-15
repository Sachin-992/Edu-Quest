/**
 * EDUCORE-OMEGA Teacher Management Service
 * 
 * PRODUCTION VERSION: Full Supabase persistence
 * Manages Teacher records with audit logging
 */

import { supabase, isAnalyticsEnabled } from './supabaseClient';
import { auditService } from './auditService';
import { rbacService } from './rbacService';
import { identityService } from './identityService';

// ============================================
// TYPES
// ============================================

export interface Teacher {
    id: string;
    user_id?: string;
    name: string;
    email: string;
    phone?: string;
    subject: string;
    classes: string[];
    experience_years: number;
    status: 'active' | 'leave' | 'resigned';
    join_date: string;
    created_at: string;
    updated_at: string;
    // Extended fields
    qualification?: string;
    employee_id?: string;
    designation?: string;
    address?: string;
    date_of_birth?: string;
    blood_group?: string;
}

// ============================================
// SERVICE
// ============================================

const isPersistenceAvailable = (): boolean => {
    return isAnalyticsEnabled && supabase !== null;
};

export const teacherService = {
    async getTeachers(): Promise<{ data: Teacher[]; error?: string }> {
        // HARD FAILURE if DB is missing (Production Rule)
        if (!isPersistenceAvailable()) {
            return { data: [], error: 'Database connection unavailable' };
        }

        try {
            // DIRECT DATABASE QUERY (Edge Functions not deployed)
            const { data, error } = await supabase!
                .from('teachers')
                .select('*')
                .neq('status', 'inactive'); // Exclude soft-deleted

            if (error) throw new Error(error.message);

            return { data: data as Teacher[] };
        } catch (err: any) {
            console.error('[TEACHER] Exception:', err);
            return { data: [], error: err.message };
        }
    },

    /**
     * Get Teacher Profile by Linked User ID
     */
    async getTeacherProfile(userId: string, email?: string): Promise<{ data?: Teacher; error?: string }> {
        if (!isPersistenceAvailable()) return { error: 'DB Unavailable' };

        try {
            // Priority 1: Try by user_id
            let { data, error } = await supabase!
                .from('teachers')
                .select('*')
                .eq('user_id', userId)
                .single();

            // Priority 2: If failed, try by email (if provided)
            // This handles cases where userId might be AuthUID but DB expects AppID
            if (!data && email) {
                console.log('[TEACHER] Profile not found by ID, trying email:', email);
                const { data: emailData, error: emailError } = await supabase!
                    .from('teachers')
                    .select('*')
                    .eq('email', email)
                    .single();

                if (emailData) {
                    data = emailData;
                    error = null;
                }
            }

            if (data) return { data: data as Teacher };
            return { error: error?.message || 'Profile not found' };
        } catch (err: any) {
            return { error: err.message };
        }
    },

    /**
     * Create new teacher with full identity (auth + users + teachers)
     * DIRECT DB VERSION - No Edge Functions required
     * 
     * Password = DOB (DDMMYYYY format) if email+dob provided
     */
    async createTeacher(
        teacherData: Omit<Teacher, 'id' | 'created_at' | 'updated_at'>,
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; data?: Teacher; temp_password?: string; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { success: false, error: 'Database connection unavailable' };
        }

        try {
            // ENFORCE RBAC
            rbacService.enforce('teacher:profile', 'create');

            let userId: string | undefined;
            let tempPassword: string | undefined;

            // If email and DOB provided, create auth user + users record
            if (teacherData.email && teacherData.date_of_birth) {
                const dobDate = new Date(teacherData.date_of_birth);
                tempPassword = `${String(dobDate.getDate()).padStart(2, '0')}${String(dobDate.getMonth() + 1).padStart(2, '0')}${dobDate.getFullYear()}`;

                // 1. Create Supabase Auth user
                const { data: authData, error: authError } = await supabase!.auth.signUp({
                    email: teacherData.email,
                    password: tempPassword,
                    options: {
                        data: {
                            role: 'teacher',
                            name: teacherData.name
                        }
                    }
                });

                if (authError) {
                    console.error('[TEACHER] Auth creation failed:', authError);
                    return { success: false, error: `Auth failed: ${authError.message}` };
                }

                if (authData.user) {
                    // 2. Create users table record
                    const { error: userError } = await supabase!
                        .from('users')
                        .insert({
                            auth_id: authData.user.id,
                            email: teacherData.email,
                            name: teacherData.name,
                            role: 'teacher',
                            status: 'active',
                            first_login: true
                        });

                    if (userError) {
                        console.error('[TEACHER] Users table insert failed:', userError);
                    }

                    // Get the users table ID for linking
                    const { data: userRow } = await supabase!
                        .from('users')
                        .select('id')
                        .eq('auth_id', authData.user.id)
                        .single();

                    userId = userRow?.id;
                }
            }

            // 3. Create teacher profile
            const insertData = {
                user_id: userId || null,
                name: teacherData.name,
                email: teacherData.email,
                phone: teacherData.phone || null,
                subject: teacherData.subject,
                classes: teacherData.classes || [],
                experience_years: teacherData.experience_years || 0,
                qualification: teacherData.qualification || null,
                employee_id: teacherData.employee_id || null,
                designation: teacherData.designation || 'Teacher',
                date_of_birth: teacherData.date_of_birth || null,
                blood_group: teacherData.blood_group || null,
                address: teacherData.address || null,
                status: 'active',
                join_date: teacherData.join_date || new Date().toISOString().split('T')[0]
            };

            const { data, error } = await supabase!
                .from('teachers')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                console.error('[TEACHER] Insert failed:', error);
                return { success: false, error: error.message };
            }

            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'CREATE',
                entity: 'teacher',
                entity_id: data.id,
                severity: 'success',
                details: `Created teacher: ${teacherData.name}${tempPassword ? ' (with login)' : ' (profile only)'}`,
            });

            const createdTeacher: Teacher = {
                id: data.id,
                user_id: data.user_id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                subject: data.subject,
                classes: data.classes || [],
                experience_years: data.experience_years || 0,
                status: data.status || 'active',
                join_date: data.join_date,
                created_at: data.created_at,
                updated_at: data.updated_at,
                qualification: data.qualification,
                employee_id: data.employee_id,
                designation: data.designation,
                date_of_birth: data.date_of_birth
            };

            return { success: true, data: createdTeacher, temp_password: tempPassword };

        } catch (err: any) {
            console.error('[TEACHER] Create Failed:', err);
            return { success: false, error: err.message || 'Unexpected error creating teacher' };
        }
    },

    async updateTeacher(
        id: string,
        updates: Partial<Teacher>,
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { success: false, error: 'Database connection unavailable' };
        }

        try {
            // ENFORCE RBAC
            rbacService.enforce('teacher:profile', 'update');

            // Map UI column names to DB column names
            const dbUpdates: Record<string, unknown> = {
                updated_at: new Date().toISOString()
            };

            // if (updates.name !== undefined) dbUpdates.full_name = updates.name; // Removed: Schema uses 'name'
            // better yet, map to "name" as per schema
            if (updates.name !== undefined) dbUpdates.name = updates.name;

            if (updates.email !== undefined) dbUpdates.email = updates.email;
            if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
            if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
            if (updates.classes !== undefined) dbUpdates.classes = updates.classes;
            if (updates.experience_years !== undefined) dbUpdates.experience_years = updates.experience_years;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.join_date !== undefined) dbUpdates.join_date = updates.join_date;
            if (updates.qualification !== undefined) dbUpdates.qualification = updates.qualification;

            // Extended fields
            if (updates.employee_id !== undefined) dbUpdates.employee_id = updates.employee_id;
            if (updates.designation !== undefined) dbUpdates.designation = updates.designation;
            if (updates.address !== undefined) dbUpdates.address = updates.address;
            if (updates.date_of_birth !== undefined) dbUpdates.date_of_birth = updates.date_of_birth;
            if (updates.blood_group !== undefined) dbUpdates.blood_group = updates.blood_group;

            const { error } = await supabase!
                .from('teachers')
                .update(dbUpdates)
                .eq('id', id);

            if (error) {
                await auditService.log({
                    actor_id: actorId,
                    actor_name: actorName,
                    actor_role: actorRole,
                    action: 'UPDATE',
                    entity: 'teacher',
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
                entity: 'teacher',
                entity_id: id,
                severity: 'success',
                details: `Updated: ${Object.keys(updates).join(', ')}`,
            });

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message || 'Unexpected error' };
        }
    },

    async deleteTeacher(
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
            rbacService.enforce('teacher:profile', 'delete');

            // SOFT DELETE: Update status to 'inactive'
            const { error } = await supabase!
                .from('teachers')
                .update({ status: 'inactive' })
                .eq('id', id);

            if (error) {
                await auditService.log({
                    actor_id: actorId,
                    actor_name: actorName,
                    actor_role: actorRole,
                    action: 'DELETE',
                    entity: 'teacher',
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
                entity: 'teacher',
                entity_id: id,
                severity: 'warning',
                details: 'Teacher soft deleted (status: inactive)',
            });

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message || 'Unexpected error' };
        }
    },

    isPersistent(): boolean {
        return isPersistenceAvailable();
    },
};

export default teacherService;

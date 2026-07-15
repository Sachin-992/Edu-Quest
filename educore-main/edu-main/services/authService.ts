/**
 * EDUCORE-OMEGA Production Authentication Service
 * 
 * PRODUCTION VERSION: Real Supabase Auth Integration
 * - User creation with temp password
 * - First-login detection
 * - Password reset flow
 * - Session management
 * - Audit logging
 */

import { supabase, adminSupabase, isAnalyticsEnabled } from './supabaseClient';

// ============================================
// TYPES
// ============================================

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    status: 'active' | 'inactive' | 'suspended';
    first_login: boolean;
    created_at: string;
}

export interface CreateUserData {
    email: string;
    password: string;
    role: UserRole;
    profileData: {
        full_name: string;
        [key: string]: unknown;
    };
}

export interface AuthResult {
    success: boolean;
    user?: AuthUser;
    error?: string;
    requiresPasswordReset?: boolean;
}

// ============================================
// AUDIT LOGGING
// ============================================

const logAudit = async (
    action: string,
    entityType?: string,
    entityId?: string,
    details?: Record<string, unknown>,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
) => {
    if (!supabase) return;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        const userRecord = user ? await getUserFromDB(user.id) : null;

        await supabase.from('audit_logs').insert({
            actor_id: user?.id,
            actor_email: user?.email,
            actor_role: userRecord?.role,
            action,
            entity_type: entityType,
            entity_id: entityId,
            details,
            severity
        });
    } catch (err) {
        console.error('[AUDIT] Failed to log:', err);
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getUserFromDB = async (userId: string): Promise<AuthUser | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .single();

    if (error || !data) return null;
    return data as AuthUser;
};

const generateTempPassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// ============================================
// AUTHENTICATION SERVICE
// ============================================

export const authService = {
    /**
     * Check if Supabase Auth is available
     */
    isAvailable: (): boolean => {
        return isAnalyticsEnabled && supabase !== null;
    },

    /**
     * Sign in with email and password
     * 
     * SELF-HEALING IDENTITY SYSTEM:
     * - If auth succeeds but users record missing → AUTO-REPAIR
     * - If role/status invalid → AUTO-FIX
     * - Admin NEVER blocked due to configuration
     * - All repairs are logged for audit
     */
    signIn: async (email: string, password: string): Promise<AuthResult> => {
        if (!supabase) {
            return { success: false, error: 'Authentication service unavailable' };
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                await logAudit('LOGIN_FAILURE', 'auth', undefined, { email, reason: error.message }, 'warning');
                return { success: false, error: error.message };
            }

            if (!data.user) {
                return { success: false, error: 'No user returned from auth' };
            }

            // Get user record from database
            let userRecord = await getUserFromDB(data.user.id);

            // ═══════════════════════════════════════════════════════════
            // SELF-HEALING IDENTITY SYSTEM (SEV-1 FIX)
            // ═══════════════════════════════════════════════════════════
            if (!userRecord) {
                console.warn('[AUTH] IDENTITY_REPAIR: Missing users record for auth_id:', data.user.id);

                // Attempt auto-repair: create users record from auth.users metadata
                const repairResult = await authService.repairIdentity(data.user);

                if (repairResult.success && repairResult.user) {
                    userRecord = repairResult.user;
                    await logAudit('IDENTITY_REPAIRED', 'auth', data.user.id, {
                        action: 'AUTO_CREATED_USERS_RECORD',
                        email: data.user.email,
                        role: userRecord.role
                    }, 'warning');
                } else {
                    // Only if repair fails AND this is not an admin, block
                    // Admins should NEVER be blocked - create minimal record
                    const isLikelyAdmin = data.user.email?.includes('admin') ||
                        data.user.user_metadata?.role === 'admin';

                    if (isLikelyAdmin) {
                        // EMERGENCY ADMIN REPAIR
                        const emergencyResult = await authService.emergencyAdminRepair(data.user);
                        if (emergencyResult.success && emergencyResult.user) {
                            userRecord = emergencyResult.user;
                            await logAudit('EMERGENCY_ADMIN_REPAIR', 'auth', data.user.id, {
                                action: 'ADMIN_IDENTITY_RESTORED',
                                email: data.user.email
                            }, 'critical');
                        }
                    }

                    if (!userRecord) {
                        await logAudit('IDENTITY_REPAIR_FAILED', 'auth', data.user.id, {
                            reason: repairResult.error
                        }, 'error');
                        // Sign out to prevent session with no identity
                        await supabase.auth.signOut();
                        return { success: false, error: 'Unable to initialize your account. Please contact administrator.' };
                    }
                }
            }

            // Auto-fix status if somehow inactive but should be active
            if (userRecord.status !== 'active') {
                if (userRecord.role === 'admin') {
                    // Admins are NEVER inactive without explicit action
                    await supabase.from('users').update({ status: 'active' }).eq('id', userRecord.id);
                    userRecord.status = 'active';
                    await logAudit('ADMIN_STATUS_REPAIRED', 'auth', userRecord.id, {
                        action: 'AUTO_ACTIVATED_ADMIN'
                    }, 'warning');
                } else {
                    await supabase.auth.signOut();
                    return { success: false, error: 'Your account is currently suspended. Please contact administrator.' };
                }
            }

            // Auto-fix missing role (should never happen with DB constraints, but belt-and-suspenders)
            if (!userRecord.role) {
                await logAudit('IDENTITY_INVALID', 'auth', userRecord.id, {
                    reason: 'Missing role - blocked at DB level'
                }, 'error');
                await supabase.auth.signOut();
                return { success: false, error: 'Account role not configured. Please contact administrator.' };
            }

            await logAudit('LOGIN_SUCCESS', 'auth', userRecord.id, { role: userRecord.role });

            return {
                success: true,
                user: userRecord,
                requiresPasswordReset: userRecord.first_login
            };
        } catch (err) {
            console.error('[AUTH] Sign in error:', err);
            return { success: false, error: 'Authentication failed' };
        }
    },

    /**
     * Sign out current user
     */
    signOut: async (): Promise<void> => {
        if (!supabase) return;

        await logAudit('LOGOUT', 'auth');
        await supabase.auth.signOut();
    },

    /**
     * Get current authenticated user
     */
    getCurrentUser: async (): Promise<AuthUser | null> => {
        if (!supabase) return null;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            return await getUserFromDB(user.id);
        } catch (err) {
            console.error('[AUTH] Get current user error:', err);
            return null;
        }
    },

    /**
     * Get current session
     */
    getSession: async () => {
        if (!supabase) return null;
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SELF-HEALING IDENTITY METHODS (SEV-1 FIX)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Repair missing identity record from auth.users metadata
     * Called automatically when auth succeeds but users record is missing
     */
    repairIdentity: async (authUser: { id: string; email?: string; user_metadata?: Record<string, any> }): Promise<{
        success: boolean;
        user?: AuthUser;
        error?: string;
    }> => {
        if (!supabase) {
            return { success: false, error: 'Database not available' };
        }

        try {
            console.log('[AUTH] Attempting identity repair for:', authUser.email);

            // Extract role from metadata if available
            const metadata = authUser.user_metadata || {};
            const role = metadata.role || metadata.user_role;
            const name = metadata.name || metadata.full_name || authUser.email?.split('@')[0] || 'User';

            // If no role in metadata, we cannot auto-repair (except for admins)
            if (!role) {
                console.warn('[AUTH] Cannot repair identity - no role in metadata');
                return { success: false, error: 'No role information available for repair' };
            }

            // Validate role
            const validRoles = ['admin', 'teacher', 'student', 'parent'];
            if (!validRoles.includes(role)) {
                return { success: false, error: `Invalid role in metadata: ${role}` };
            }

            // Create the users record
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert({
                    auth_id: authUser.id,
                    email: authUser.email,
                    name: name,
                    role: role,
                    status: 'active',
                    first_login: true,
                    created_by: 'SYSTEM_IDENTITY_REPAIR'
                })
                .select()
                .single();

            if (insertError) {
                console.error('[AUTH] Identity repair failed:', insertError);
                return { success: false, error: insertError.message };
            }

            console.log('[AUTH] Identity repaired successfully:', newUser.id);
            return { success: true, user: newUser as AuthUser };

        } catch (err: any) {
            console.error('[AUTH] Identity repair exception:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * EMERGENCY: Create admin record when all else fails
     * Only called for users who appear to be admins (by email pattern or explicit metadata)
     * This is a last-resort recovery mechanism
     */
    emergencyAdminRepair: async (authUser: { id: string; email?: string; user_metadata?: Record<string, any> }): Promise<{
        success: boolean;
        user?: AuthUser;
        error?: string;
    }> => {
        if (!supabase) {
            return { success: false, error: 'Database not available' };
        }

        try {
            console.warn('[AUTH] EMERGENCY ADMIN REPAIR for:', authUser.email);

            // Create admin users record
            const { data: adminUser, error: insertError } = await supabase
                .from('users')
                .insert({
                    auth_id: authUser.id,
                    email: authUser.email,
                    name: authUser.user_metadata?.name || 'System Administrator',
                    role: 'admin',
                    status: 'active',
                    first_login: false,
                    created_by: 'EMERGENCY_ADMIN_REPAIR'
                })
                .select()
                .single();

            if (insertError) {
                // Check if it's a duplicate - maybe record exists with wrong auth_id
                if (insertError.code === '23505') {
                    // Try to find and link existing record
                    const { data: existingByEmail } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', authUser.email)
                        .single();

                    if (existingByEmail) {
                        // Update auth_id to fix the link
                        const { data: fixed, error: fixError } = await supabase
                            .from('users')
                            .update({ auth_id: authUser.id, status: 'active' })
                            .eq('email', authUser.email)
                            .select()
                            .single();

                        if (!fixError && fixed) {
                            console.log('[AUTH] Admin auth_id relinked successfully');
                            return { success: true, user: fixed as AuthUser };
                        }
                    }
                }

                // 🚨 RLS FALLBACK: Try RPC if direct insert failed (likely permission denied)
                console.warn('[AUTH] Emergency insert failed, attempting RPC fallback...');
                const { data: rpcResult, error: rpcError } = await supabase.rpc('repair_identity_rpc', {
                    p_role: 'admin',
                    p_name: authUser.user_metadata?.name || 'System Administrator'
                });

                if (rpcResult && rpcResult.success) {
                    console.log('[AUTH] Emergency admin repair successful via RPC');

                    // IF RPC returned the user object, use it directly (Bypasses RLS read block)
                    if (rpcResult.user) {
                        return { success: true, user: rpcResult.user as AuthUser };
                    }

                    // Fallback to read (might fail due to RLS)
                    const repairedUser = await getUserFromDB(authUser.id);
                    if (repairedUser) return { success: true, user: repairedUser };
                }

                console.error('[AUTH] Emergency admin repair failed:', insertError);

                // FORCE SUCCESS for Admin even if DB read fails (Last Resort)
                // We construct a synthetic user object to allow the UI to load
                // The DB record exists (RPC success), we just can't read it.
                if (rpcResult && rpcResult.success) {
                    return {
                        success: true,
                        user: {
                            id: authUser.id, // Temporary fallback
                            auth_id: authUser.id,
                            email: authUser.email!,
                            role: 'admin',
                            status: 'active',
                            name: authUser.user_metadata?.name || 'Admin',
                            first_login: false,
                            created_at: new Date().toISOString()
                        } as AuthUser
                    };
                }

                return { success: false, error: 'Account repair failed' };
            }

            console.log('[AUTH] Emergency admin repair successful:', adminUser.id);
            return { success: true, user: adminUser as AuthUser };

        } catch (err: any) {
            console.error('[AUTH] Emergency admin repair exception:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * ADMIN ONLY: Create a new user with temporary password
     * Note: Using signUp instead of admin.createUser (requires service role key)
     * For production, users can login after email confirmation OR use manual Supabase Dashboard creation
     */
    createUser: async (userData: CreateUserData, creatorId: string): Promise<{
        success: boolean;
        userId?: string;
        tempPassword?: string;
        error?: string;
    }> => {
        if (!supabase) {
            return { success: false, error: 'Database not available' };
        }

        // Generate temp password if not provided
        const tempPassword = userData.password || generateTempPassword();

        try {
            // Use the service-role admin client to create the auth user.
            // This DOES NOT affect the currently logged-in admin's session at all.
            const adminClient = adminSupabase || supabase;
            if (!adminClient) {
                return { success: false, error: 'Database not available' };
            }

            const { data: authData, error: authError } = await (adminClient as any).auth.admin.createUser({
                email: userData.email,
                password: tempPassword,
                email_confirm: true,   // auto-confirm so student can log in immediately
                user_metadata: {
                    role: userData.role,
                    full_name: userData.profileData.full_name,
                    name: userData.profileData.full_name
                }
            });

            if (authError) {
                await logAudit('USER_CREATE', 'user', undefined, { email: userData.email, error: authError.message }, 'error');
                return { success: false, error: authError.message };
            }

            // admin.createUser returns { user } not { session, user }
            const createdAuthUser = authData?.user;
            if (!createdAuthUser) {
                return { success: false, error: 'Failed to create auth user' };
            }

            const authUserId = createdAuthUser.id;

            // Use service-role client for ALL remaining DB operations — bypasses RLS completely
            const db = adminSupabase || supabase!;

            // 2. Wait for trigger to fire
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 3. Get internal users.id (trigger should have created this row)
            const { data: userRow } = await db
                .from('users')
                .select('id')
                .eq('auth_id', authUserId)
                .maybeSingle();

            let internalUserId: string;
            if (!userRow) {
                // Trigger didn't fire — create manually with service role
                const { data: inserted, error: insertErr } = await db
                    .from('users')
                    .upsert({
                        auth_id: authUserId,
                        email: userData.email,
                        name: userData.profileData.full_name,
                        role: userData.role,
                        status: 'active',
                        first_login: true
                    }, { onConflict: 'auth_id' })
                    .select('id')
                    .single();

                if (insertErr || !inserted) {
                    console.error('[AUTH] Could not create users row:', insertErr?.message);
                    return { success: false, error: `Failed to create user record: ${insertErr?.message}` };
                }
                internalUserId = inserted.id;
            } else {
                internalUserId = userRow.id;
            }

            // 4. Create role-specific profile (service role — no RLS)
            // Use insert, falling back to delete+insert if a duplicate exists.
            // This works even if the UNIQUE constraint hasn't been created yet.
            let profileError: string | null = null;

            const safeInsert = async (table: string, row: Record<string, unknown>) => {
                const { error: e1 } = await db.from(table).insert(row);
                if (!e1) return null;
                // If duplicate key, delete the old row and re-insert
                if (e1.code === '23505' || (e1.message || '').includes('unique')) {
                    await db.from(table).delete().eq('user_id', row.user_id as string);
                    const { error: e2 } = await db.from(table).insert(row);
                    return e2 ? e2.message : null;
                }
                // If no unique constraint exists for upsert, still try to insert
                if ((e1.message || '').includes('ON CONFLICT')) {
                    // No constraint yet — just insert (first time should always succeed)
                    const { error: e3 } = await db.from(table).insert(row);
                    return e3 ? e3.message : null;
                }
                return e1.message;
            };

            if (userData.role === 'student') {
                profileError = await safeInsert('students', {
                    user_id: internalUserId,
                    name: userData.profileData.full_name,
                    full_name: userData.profileData.full_name,
                    email: userData.email,
                    class: userData.profileData.class || '1',
                    section: userData.profileData.section || 'A',
                    roll_number: userData.profileData.roll_number || null,
                    roll_no: userData.profileData.roll_no || 
                             (userData.profileData.roll_number ? parseInt(String(userData.profileData.roll_number).replace(/\D/g, '')) || 0 : 0),
                    admission_number: userData.profileData.admission_number || `ADM${Date.now()}`,
                    fee_status: 'pending',
                    status: 'active'
                });

            } else if (userData.role === 'teacher') {
                profileError = await safeInsert('teachers', {
                    user_id: internalUserId,
                    name: userData.profileData.full_name,
                    full_name: userData.profileData.full_name,
                    email: userData.email,
                    subject: (userData.profileData.subjects as string[])?.join(', ') || 'General',
                    experience_years: 0,
                    status: 'active',
                    join_date: new Date().toISOString().split('T')[0]
                });

            } else if (userData.role === 'parent') {
                profileError = await safeInsert('parents', {
                    user_id: internalUserId,
                    name: userData.profileData.full_name,
                    full_name: userData.profileData.full_name,
                    email: userData.email,
                    phone: String(userData.profileData.phone || '')
                });
            }


            if (profileError) {
                console.error('[AUTH] Profile creation failed:', profileError);
                // Return failure so admin knows — user exists in auth but profile is missing
                return { success: false, error: `User created in Auth but profile failed: ${profileError}` };
            }

            // 5. Auto-create user_preferences row
            try {
                await db.from('user_preferences').upsert({
                    user_id: internalUserId,
                    language_preference: 'en'
                }, { onConflict: 'user_id' });
            } catch (_) { /* non-fatal */ }

            // 6. Log success
            await logAudit('USER_CREATE', 'user', internalUserId, {
                email: userData.email,
                role: userData.role,
                name: userData.profileData.full_name
            });

            return {
                success: true,
                userId: internalUserId,
                tempPassword
            };
        } catch (err) {
            console.error('[AUTH] Create user error:', err);
            return { success: false, error: 'Failed to create user' };
        }
    },

    /**
     * ADMIN ONLY: Create student profile directly (without auth user)
     * Use this for Student Profiles module
     */
    createStudentProfile: async (studentData: {
        full_name: string;
        class: string;
        section: string;
        roll_no: number;
        admission_number?: string;
        fee_status?: string;
        status?: string;
    }): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> => {
        if (!supabase) {
            return { success: false, error: 'Database not available' };
        }

        try {
            const { data, error } = await supabase.from('students').insert({
                name: studentData.full_name,
                class: studentData.class,
                section: studentData.section,
                roll_no: studentData.roll_no,
                admission_number: studentData.admission_number || `ADM${Date.now()}`,
                fee_status: studentData.fee_status || 'pending',
                status: studentData.status || 'active'
            }).select().single();

            if (error) {
                return { success: false, error: error.message };
            }

            await logAudit('STUDENT_CREATE', 'student', data.id, { name: studentData.full_name });
            return { success: true, data };
        } catch (err) {
            return { success: false, error: 'Failed to create student' };
        }
    },

    /**
     * ADMIN ONLY: Create teacher profile directly (without auth user)
     */
    createTeacherProfile: async (teacherData: {
        full_name: string;
        email: string;
        subject?: string;
        phone?: string;
    }): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> => {
        if (!supabase) {
            return { success: false, error: 'Database not available' };
        }

        try {
            const { data, error } = await supabase.from('teachers').insert({
                name: teacherData.full_name,
                email: teacherData.email,
                subject: teacherData.subject || 'General',
                classes: [],
                experience_years: 0,
                status: 'active',
                join_date: new Date().toISOString().split('T')[0]
            }).select().single();

            if (error) {
                return { success: false, error: error.message };
            }

            await logAudit('TEACHER_CREATE', 'teacher', data.id, { name: teacherData.full_name });
            return { success: true, data };
        } catch (err) {
            return { success: false, error: 'Failed to create teacher' };
        }
    },

    /**
     * ADMIN ONLY: Create parent profile directly (without auth user)
     */
    createParentProfile: async (parentData: {
        full_name: string;
        email: string;
        phone?: string;
    }): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> => {
        if (!supabase) {
            return { success: false, error: 'Database not available' };
        }

        try {
            const { data, error } = await supabase.from('parents').insert({
                name: parentData.full_name,
                email: parentData.email,
                phone: parentData.phone || ''
            }).select().single();

            if (error) {
                return { success: false, error: error.message };
            }

            await logAudit('PARENT_CREATE', 'parent', data.id, { name: parentData.full_name });
            return { success: true, data };
        } catch (err) {
            return { success: false, error: 'Failed to create parent' };
        }
    },

    /**
     * Reset password (for first login or forgot password)
     */
    resetPassword: async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
        if (!supabase) {
            return { success: false, error: 'Auth service unavailable' };
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                await logAudit('PASSWORD_RESET', 'auth', undefined, { error: error.message }, 'error');
                return { success: false, error: error.message };
            }

            // Mark first_login as false
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('users').update({ first_login: false }).eq('id', user.id);
                await logAudit('PASSWORD_RESET', 'auth', user.id, { first_login_complete: true });
            }

            return { success: true };
        } catch (err) {
            console.error('[AUTH] Reset password error:', err);
            return { success: false, error: 'Failed to reset password' };
        }
    },

    /**
     * ADMIN ONLY: Link parent to student(s)
     */
    linkParentToStudent: async (parentId: string, studentId: string, relationship: string = 'parent'): Promise<{ success: boolean; error?: string }> => {
        if (!supabase) {
            return { success: false, error: 'Database not available' };
        }

        try {
            const { error } = await supabase.from('parent_student_links').insert({
                parent_id: parentId,
                student_id: studentId,
                relationship
            });

            if (error) {
                await logAudit('STUDENT_LINK', 'parent_student_link', undefined, { parentId, studentId, error: error.message }, 'error');
                return { success: false, error: error.message };
            }

            await logAudit('STUDENT_LINK', 'parent_student_link', undefined, { parentId, studentId, relationship });
            return { success: true };
        } catch (err) {
            return { success: false, error: 'Failed to link parent to student' };
        }
    },

    /**
     * ADMIN ONLY: Unlink parent from student
     */
    unlinkParentFromStudent: async (parentId: string, studentId: string): Promise<{ success: boolean; error?: string }> => {
        if (!supabase) {
            return { success: false, error: 'Database not available' };
        }

        try {
            const { error } = await supabase
                .from('parent_student_links')
                .delete()
                .eq('parent_id', parentId)
                .eq('student_id', studentId);

            if (error) {
                return { success: false, error: error.message };
            }

            await logAudit('STUDENT_UNLINK', 'parent_student_link', undefined, { parentId, studentId });
            return { success: true };
        } catch (err) {
            return { success: false, error: 'Failed to unlink' };
        }
    },

    /**
     * ADMIN ONLY: Get all users
     */
    getAllUsers: async (): Promise<AuthUser[]> => {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[AUTH] Get all users error:', error);
            return [];
        }

        return data as AuthUser[];
    },

    /**
     * ADMIN ONLY: Update user status
     */
    updateUserStatus: async (userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<{ success: boolean; error?: string }> => {
        if (!supabase) {
            return { success: false, error: 'Database not available' };
        }

        const { error } = await supabase
            .from('users')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (error) {
            return { success: false, error: error.message };
        }

        await logAudit('USER_UPDATE', 'user', userId, { status });
        return { success: true };
    },

    /**
     * Subscribe to auth state changes
     */
    onAuthStateChange: (callback: (user: AuthUser | null) => void) => {
        if (!supabase) return () => { };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const userRecord = await getUserFromDB(session.user.id);
                callback(userRecord);
            } else {
                callback(null);
            }
        });

        return () => subscription.unsubscribe();
    }
};

export default authService;

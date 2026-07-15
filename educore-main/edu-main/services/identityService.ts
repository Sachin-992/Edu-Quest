/**
 * EDUCORE-OMEGA Identity Service
 * 
 * UNIFIED IDENTITY CREATION PIPELINE
 * All user creation must flow through this service.
 * 
 * This service calls the Edge Function `/functions/v1/iam` which:
 * 1. Creates auth.users (Supabase Auth)
 * 2. Creates users table row
 * 3. Creates domain profile (students/teachers/parents)
 * 4. Sets password = DOB
 * 5. Enforces password policy
 * 
 * NO MODULE SHOULD CREATE USERS DIRECTLY.
 */

import { supabase, isAnalyticsEnabled } from './supabaseClient';
import { auditService } from './auditService';

// ============================================
// TYPES
// ============================================

export interface CreateStudentPayload {
    email: string;
    name: string;
    dob: string; // YYYY-MM-DD format
    class: string;
    section: string;
    roll_no: number;
    admission_number?: string;
    address?: string;
    parent_phone?: string;
}

export interface CreateTeacherPayload {
    email: string;
    name: string;
    dob: string; // YYYY-MM-DD format
    subject: string;
    phone?: string;
    experience_years?: number;
    qualification?: string;
    employee_id?: string;
    designation?: string;
}

export interface CreateParentPayload {
    email: string;
    name: string;
    phone?: string;
    student_id: string; // Link to existing student
    relationship?: 'father' | 'mother' | 'guardian' | 'other';
}

export interface CreateAdminPayload {
    email: string;
    name: string;
    password: string; // Admin can set custom password
}

export interface IdentityResult {
    success: boolean;
    user_id?: string;
    temp_password?: string;
    error?: string;
}

// ============================================
// EDGE FUNCTION URL
// ============================================

const getEdgeFunctionUrl = (): string | null => {
    if (!supabase) return null;
    // @ts-ignore - accessing internal URL
    const supabaseUrl = supabase.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) return null;
    return `${supabaseUrl}/functions/v1/super-task`;
};

// ============================================
// IDENTITY SERVICE
// ============================================

export const identityService = {
    /**
     * Create a student with full identity (auth + users + students)
     * Password = DOB (DDMMYYYY format)
     */
    async createStudent(payload: CreateStudentPayload): Promise<IdentityResult> {
        if (!isAnalyticsEnabled || !supabase) {
            return { success: false, error: 'Database connection unavailable' };
        }

        const url = getEdgeFunctionUrl();
        if (!url) {
            return { success: false, error: 'Edge Function URL not configured' };
        }

        try {
            // Get current session for authorization
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.access_token) {
                console.error('[IDENTITY] No access token available');
                return { success: false, error: 'Not authenticated - please log in again' };
            }

            console.log('[IDENTITY] Calling Edge Function:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.session.access_token}`,
                },
                body: JSON.stringify({
                    action: 'createStudent',
                    payload: {
                        email: payload.email,
                        full_name: payload.name,
                        dob: payload.dob,
                        class_id: payload.class, // Will be mapped in Edge Function
                        roll_number: payload.roll_no,
                        admission_number: payload.admission_number,
                        address: payload.address,
                        guardian_phone: payload.parent_phone,
                        // Additional fields for direct student table
                        class: payload.class,
                        section: payload.section,
                    },
                }),
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                console.error('[IDENTITY] Edge Function Error:', result);
                return { success: false, error: result.error || `Server error: ${response.status} ${response.statusText}` };
            }

            // Calculate temporary password (DOB in DDMMYYYY format)
            const dobDate = new Date(payload.dob);
            const tempPassword = `${String(dobDate.getDate()).padStart(2, '0')}${String(dobDate.getMonth() + 1).padStart(2, '0')}${dobDate.getFullYear()}`;

            return {
                success: true,
                user_id: result.user_id,
                temp_password: tempPassword,
            };
        } catch (err: any) {
            console.error('[IDENTITY] createStudent failed:', err);
            return { success: false, error: err.message || 'Network error calling identity service' };
        }
    },

    /**
     * Create a teacher with full identity (auth + users + teachers)
     * Password = DOB (DDMMYYYY format), must change on first login
     */
    async createTeacher(payload: CreateTeacherPayload): Promise<IdentityResult> {
        if (!isAnalyticsEnabled || !supabase) {
            return { success: false, error: 'Database connection unavailable' };
        }

        const url = getEdgeFunctionUrl();
        if (!url) {
            return { success: false, error: 'Edge Function URL not configured' };
        }

        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.access_token) {
                console.error('[IDENTITY] No access token available');
                return { success: false, error: 'Not authenticated - please log in again' };
            }

            console.log('[IDENTITY] Calling Edge Function (createTeacher):', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.session.access_token}`,
                },
                body: JSON.stringify({
                    action: 'createTeacher',
                    payload: {
                        email: payload.email,
                        full_name: payload.name,
                        dob: payload.dob,
                        subject: payload.subject,
                        phone: payload.phone,
                        experience_years: payload.experience_years || 0,
                        qualification: payload.qualification,
                        employee_id: payload.employee_id,
                        designation: payload.designation,
                    },
                }),
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                console.error('[IDENTITY] Edge Function Error:', result);
                return { success: false, error: result.error || `Server error: ${response.status} ${response.statusText}` };
            }

            const dobDate = new Date(payload.dob);
            const tempPassword = `${String(dobDate.getDate()).padStart(2, '0')}${String(dobDate.getMonth() + 1).padStart(2, '0')}${dobDate.getFullYear()}`;

            return {
                success: true,
                user_id: result.user_id,
                temp_password: tempPassword,
            };
        } catch (err: any) {
            console.error('[IDENTITY] createTeacher failed:', err);
            return { success: false, error: err.message || 'Network error calling identity service' };
        }
    },

    /**
     * Create a parent with full identity (auth + users + parents + link)
     * Password = Child's DOB (DDMMYYYY format)
     */
    async createParent(payload: CreateParentPayload): Promise<IdentityResult> {
        if (!isAnalyticsEnabled || !supabase) {
            return { success: false, error: 'Database connection unavailable' };
        }

        const url = getEdgeFunctionUrl();
        if (!url) {
            return { success: false, error: 'Edge Function URL not configured' };
        }

        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.access_token) {
                console.error('[IDENTITY] No access token available');
                return { success: false, error: 'Not authenticated' };
            }

            // First, fetch the student's DOB
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('date_of_birth, name')
                .eq('id', payload.student_id)
                .single();

            if (studentError || !student) {
                return { success: false, error: 'Student not found' };
            }

            if (!student.date_of_birth) {
                return { success: false, error: 'Student DOB not set - required for parent password' };
            }

            console.log('[IDENTITY] Calling Edge Function (createParent):', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.session.access_token}`,
                },
                body: JSON.stringify({
                    action: 'createParent',
                    payload: {
                        email: payload.email,
                        full_name: payload.name,
                        phone: payload.phone,
                        student_id: payload.student_id,
                        child_dob: student.date_of_birth,
                        relationship: payload.relationship || 'guardian',
                    },
                }),
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                console.error('[IDENTITY] Edge Function Error:', result);
                return { success: false, error: result.error || `Server error: ${response.status} ${response.statusText}` };
            }

            const dobDate = new Date(student.date_of_birth);
            const tempPassword = `${String(dobDate.getDate()).padStart(2, '0')}${String(dobDate.getMonth() + 1).padStart(2, '0')}${dobDate.getFullYear()}`;

            return {
                success: true,
                user_id: result.user_id,
                temp_password: tempPassword,
            };
        } catch (err: any) {
            console.error('[IDENTITY] createParent failed:', err);
            return { success: false, error: err.message || 'Network error calling identity service' };
        }
    },

    /**
     * Create an admin (custom password allowed)
     * Only super admins can create other admins
     */
    async createAdmin(payload: CreateAdminPayload): Promise<IdentityResult> {
        if (!isAnalyticsEnabled || !supabase) {
            return { success: false, error: 'Database connection unavailable' };
        }

        // Admin creation is handled via direct Supabase admin API
        // This is a special case - not via Edge Function for security
        return { success: false, error: 'Admin creation requires direct database access' };
    },

    /**
     * Check if identity service is available
     */
    isAvailable(): boolean {
        return isAnalyticsEnabled && supabase !== null && getEdgeFunctionUrl() !== null;
    },

    /**
     * Get Edge Function URL for debugging
     */
    getEndpointUrl(): string | null {
        return getEdgeFunctionUrl();
    },
};

export default identityService;

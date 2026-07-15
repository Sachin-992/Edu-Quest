/**
 * EDUCORE-OMEGA Feedback Service
 * 
 * PRODUCTION VERSION: Supabase-backed, RBAC-enforced, XSS-sanitized
 * 
 * SECURITY:
 * - user_id is ALWAYS set server-side by DB trigger (never from client)
 * - Role/status never accepted from frontend on submit
 * - XSS sanitization on all text fields
 * - Ownership validated via RLS
 * - Rate limited: 5 submissions/hour (DB trigger)
 */

import { supabase } from './supabaseClient';
import { rbacService } from './rbacService';
import { auditService } from './auditService';

// ============================================================
// TYPES
// ============================================================

export type FeedbackCategory = 'academic' | 'teacher' | 'infrastructure' | 'complaint' | 'suggestion' | 'general';
export type FeedbackStatus = 'open' | 'under_review' | 'resolved' | 'archived';

export interface Feedback {
    id: string;
    user_id: string;
    user_role: string;
    category: FeedbackCategory;
    title: string;
    description: string;
    rating: number | null;
    status: FeedbackStatus;
    admin_response: string | null;
    admin_notes?: string | null;   // Only present for admin queries
    responded_by: string | null;
    responded_at: string | null;
    is_anonymous: boolean;
    created_at: string;
    updated_at: string;
    subject_id?: string | null;
    teacher_id?: string | null;
    subject?: { name: string } | null;
    teacher?: { name: string } | null;
}

export interface FeedbackSubmission {
    category: FeedbackCategory;
    title: string;
    description: string;
    rating?: number;
    is_anonymous?: boolean;
    subject_id?: string | null;
    teacher_id?: string | null;
}

export interface FeedbackStats {
    total: number;
    open: number;
    under_review: number;
    resolved: number;
    archived: number;
    resolved_today: number;
    avg_resolution_hours: number | null;
}

// ============================================================
// XSS SANITIZATION
// ============================================================

const DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<form\b[^>]*>/gi,
    /on\w+\s*=/gi,          // onerror=, onclick=, onload=, etc.
    /javascript\s*:/gi,
    /data\s*:\s*text\/html/gi,
    /expression\s*\(/gi,
    /url\s*\(\s*['"]?\s*javascript/gi,
];

function sanitizeText(input: string): string {
    let sanitized = input;

    // Strip dangerous HTML patterns
    for (const pattern of DANGEROUS_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }

    // Escape remaining HTML entities
    sanitized = sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return sanitized.trim();
}

function validateSubmission(data: FeedbackSubmission): { valid: boolean; error?: string } {
    const validCategories: FeedbackCategory[] = ['academic', 'teacher', 'infrastructure', 'complaint', 'suggestion', 'general'];

    if (!data.title || data.title.trim().length === 0) {
        return { valid: false, error: 'Title is required' };
    }
    if (data.title.length > 200) {
        return { valid: false, error: 'Title must be 200 characters or less' };
    }
    if (!data.description || data.description.trim().length === 0) {
        return { valid: false, error: 'Description is required' };
    }
    if (data.description.length > 2000) {
        return { valid: false, error: 'Description must be 2000 characters or less' };
    }
    if (!validCategories.includes(data.category)) {
        return { valid: false, error: 'Invalid feedback category' };
    }
    if (data.rating !== undefined && data.rating !== null) {
        if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
            return { valid: false, error: 'Rating must be between 1 and 5' };
        }
    }
    return { valid: true };
}

// ============================================================
// VALID STATUS TRANSITIONS
// ============================================================

const VALID_TRANSITIONS: Record<FeedbackStatus, FeedbackStatus[]> = {
    'open': ['under_review', 'resolved', 'archived'],
    'under_review': ['resolved', 'archived', 'open'],
    'resolved': ['archived', 'open'],
    'archived': ['open'],  // Can reopen if needed
};

// ============================================================
// SERVICE
// ============================================================

export const feedbackService = {

    /**
     * Submit new feedback (Student/Parent only)
     * user_id and user_role are set by the DB trigger — NOT from client
     */
    async submitFeedback(
        data: FeedbackSubmission,
        userRole: 'student' | 'parent'
    ): Promise<{ success: boolean; data?: Feedback; error?: string }> {
        try {
            // RBAC check
            if (!rbacService.hasPermission('feedback:submit', 'create')) {
                return { success: false, error: 'Permission denied: cannot submit feedback' };
            }

            // Validate
            const validation = validateSubmission(data);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            if (!supabase) {
                return { success: false, error: 'Database not configured' };
            }

            // Sanitize
            const sanitizedTitle = sanitizeText(data.title);
            const sanitizedDescription = sanitizeText(data.description);

            // Insert — user_id is overridden by DB trigger
            const { data: result, error } = await supabase
                .from('feedback')
                .insert({
                    user_role: userRole,  // Validated server-side to match auth
                    category: data.category,
                    title: sanitizedTitle,
                    description: sanitizedDescription,
                    rating: data.rating || null,
                    is_anonymous: data.is_anonymous || false,
                    subject_id: data.subject_id || null,
                    teacher_id: data.teacher_id || null,
                })
                .select()
                .single();

            if (error) {
                // Check for rate limit error
                if (error.message?.includes('Rate limit')) {
                    return { success: false, error: 'You can submit a maximum of 5 feedback entries per hour. Please try again later.' };
                }
                console.error('[FeedbackService] Submit error:', error);
                return { success: false, error: error.message };
            }

            // Audit log
            const user = rbacService.getCurrentUser();
            if (user) {
                auditService.logAccess(
                    user.id, user.name, user.role,
                    'CREATE', 'feedback', result.id,
                    `Feedback submitted: ${sanitizedTitle}`
                );
            }

            return { success: true, data: result };
        } catch (err: any) {
            console.error('[FeedbackService] Submit error:', err);
            return { success: false, error: err.message || 'Failed to submit feedback' };
        }
    },

    /**
     * Get current user's own feedback (Student/Parent)
     * RLS enforces user_id = auth.uid()
     */
    async getMyFeedback(options?: {
        page?: number;
        pageSize?: number;
        status?: FeedbackStatus;
        category?: FeedbackCategory;
    }): Promise<{ data: Feedback[]; total: number; error?: string }> {
        try {
            if (!supabase) {
                return { data: [], total: 0, error: 'Database not configured' };
            }

            const page = options?.page || 1;
            const pageSize = options?.pageSize || 20;
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from('feedback')
                .select('id, user_id, user_role, category, title, description, rating, status, admin_response, responded_at, is_anonymous, created_at, updated_at, subject_id, teacher_id, subject:subjects(name), teacher:teachers(name)', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            // Filters
            if (options?.status) {
                query = query.eq('status', options.status);
            }
            if (options?.category) {
                query = query.eq('category', options.category);
            }

            const { data, error, count } = await query;

            if (error) {
                console.error('[FeedbackService] getMyFeedback error:', error);
                return { data: [], total: 0, error: error.message };
            }

            return { data: data || [], total: count || 0 };
        } catch (err: any) {
            console.error('[FeedbackService] getMyFeedback error:', err);
            return { data: [], total: 0, error: err.message };
        }
    },

    /**
     * Get ALL feedback (Admin only)
     * RLS policy allows admins to read all rows
     */
    async getAllFeedback(options?: {
        page?: number;
        pageSize?: number;
        status?: FeedbackStatus;
        category?: FeedbackCategory;
        search?: string;
    }): Promise<{ data: Feedback[]; total: number; error?: string }> {
        try {
            if (!rbacService.hasPermission('feedback:manage', 'read')) {
                return { data: [], total: 0, error: 'Permission denied' };
            }

            if (!supabase) {
                return { data: [], total: 0, error: 'Database not configured' };
            }

            const page = options?.page || 1;
            const pageSize = options?.pageSize || 25;
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from('feedback')
                .select('*, subject:subjects(name), teacher:teachers(name)', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (options?.status) {
                query = query.eq('status', options.status);
            }
            if (options?.category) {
                query = query.eq('category', options.category);
            }
            if (options?.search) {
                query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
            }

            const { data, error, count } = await query;

            if (error) {
                console.error('[FeedbackService] getAllFeedback error:', error);
                return { data: [], total: 0, error: error.message };
            }

            return { data: data || [], total: count || 0 };
        } catch (err: any) {
            console.error('[FeedbackService] getAllFeedback error:', err);
            return { data: [], total: 0, error: err.message };
        }
    },

    /**
     * Update feedback status (Admin only)
     * Valid transitions enforced client + server side
     */
    async updateStatus(
        feedbackId: string,
        newStatus: FeedbackStatus,
        adminNotes?: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const currentUser = rbacService.getCurrentUser();
            const isTeacher = currentUser?.role === 'teacher';
            if (!rbacService.hasPermission('feedback:manage', 'update') && !isTeacher) {
                return { success: false, error: 'Permission denied' };
            }

            if (!supabase) {
                return { success: false, error: 'Database not configured' };
            }

            // Fetch current status for transition validation
            const { data: current, error: fetchErr } = await supabase
                .from('feedback')
                .select('status')
                .eq('id', feedbackId)
                .single();

            if (fetchErr || !current) {
                return { success: false, error: 'Feedback not found' };
            }

            const currentStatus = current.status as FeedbackStatus;
            const allowed = VALID_TRANSITIONS[currentStatus];
            if (!allowed || !allowed.includes(newStatus)) {
                return { success: false, error: `Invalid transition: ${currentStatus} → ${newStatus}` };
            }

            const updatePayload: Record<string, unknown> = { status: newStatus };
            if (adminNotes !== undefined) {
                updatePayload.admin_notes = sanitizeText(adminNotes);
            }

            const { error } = await supabase
                .from('feedback')
                .update(updatePayload)
                .eq('id', feedbackId);

            if (error) {
                return { success: false, error: error.message };
            }

            // Audit
            const user = rbacService.getCurrentUser();
            if (user) {
                auditService.logAccess(
                    user.id, user.name, user.role,
                    'UPDATE', 'feedback', feedbackId,
                    `Status changed: ${currentStatus} → ${newStatus}`
                );
            }

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Respond to feedback (Admin only)
     */
    async respondToFeedback(
        feedbackId: string,
        response: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const currentUser = rbacService.getCurrentUser();
            const isTeacher = currentUser?.role === 'teacher';
            if (!rbacService.hasPermission('feedback:manage', 'update') && !isTeacher) {
                return { success: false, error: 'Permission denied' };
            }

            if (!supabase) {
                return { success: false, error: 'Database not configured' };
            }

            if (!response || response.trim().length === 0) {
                return { success: false, error: 'Response cannot be empty' };
            }

            const sanitizedResponse = sanitizeText(response);

            // Get current auth user for responded_by
            const { data: { user: authUser } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('feedback')
                .update({
                    admin_response: sanitizedResponse,
                    responded_by: authUser?.id || null,
                    responded_at: new Date().toISOString(),
                })
                .eq('id', feedbackId);

            if (error) {
                return { success: false, error: error.message };
            }

            // Audit
            const user = rbacService.getCurrentUser();
            if (user) {
                auditService.logAccess(
                    user.id, user.name, user.role,
                    'UPDATE', 'feedback', feedbackId,
                    'Admin responded to feedback'
                );
            }

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Get doubts assigned to a specific teacher
     */
    async getTeacherDoubts(
        teacherId: string,
        options?: {
            page?: number;
            pageSize?: number;
            status?: FeedbackStatus;
        }
    ): Promise<{ data: Feedback[]; total: number; error?: string }> {
        try {
            if (!supabase) {
                return { data: [], total: 0, error: 'Database not configured' };
            }

            const page = options?.page || 1;
            const pageSize = options?.pageSize || 20;
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from('feedback')
                .select(`
                    id, user_id, user_role, category, title, description, rating, status, admin_response, responded_at, is_anonymous, created_at, updated_at, subject_id, teacher_id,
                    subject:subjects(name)
                `, { count: 'exact' })
                .eq('teacher_id', teacherId)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (options?.status) {
                query = query.eq('status', options.status);
            }

            const { data, error, count } = await query;

            if (error) {
                console.error('[FeedbackService] getTeacherDoubts error:', error);
                return { data: [], total: 0, error: error.message };
            }

            return { data: data || [], total: count || 0 };
        } catch (err: any) {
            console.error('[FeedbackService] getTeacherDoubts error:', err);
            return { data: [], total: 0, error: err.message };
        }
    },

    /**
     * Get feedback statistics (Admin dashboard metrics)
     */
    async getFeedbackStats(): Promise<{ data: FeedbackStats | null; error?: string }> {
        try {
            if (!rbacService.hasPermission('feedback:manage', 'read')) {
                return { data: null, error: 'Permission denied' };
            }

            if (!supabase) {
                return { data: null, error: 'Database not configured' };
            }

            // Fetch all feedback for stats (efficient with indexed status column)
            const { data: all, error } = await supabase
                .from('feedback')
                .select('id, status, created_at, responded_at');

            if (error) {
                return { data: null, error: error.message };
            }

            const items = all || [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const stats: FeedbackStats = {
                total: items.length,
                open: items.filter(f => f.status === 'open').length,
                under_review: items.filter(f => f.status === 'under_review').length,
                resolved: items.filter(f => f.status === 'resolved').length,
                archived: items.filter(f => f.status === 'archived').length,
                resolved_today: items.filter(f =>
                    f.status === 'resolved' && f.responded_at && new Date(f.responded_at) >= today
                ).length,
                avg_resolution_hours: null,
            };

            // Calculate average resolution time
            const resolvedWithTimes = items.filter(f => f.status === 'resolved' && f.responded_at);
            if (resolvedWithTimes.length > 0) {
                const totalHours = resolvedWithTimes.reduce((sum, f) => {
                    const created = new Date(f.created_at).getTime();
                    const resolved = new Date(f.responded_at).getTime();
                    return sum + (resolved - created) / (1000 * 60 * 60);
                }, 0);
                stats.avg_resolution_hours = Math.round(totalHours / resolvedWithTimes.length * 10) / 10;
            }

            return { data: stats };
        } catch (err: any) {
            return { data: null, error: err.message };
        }
    },
};

export default feedbackService;

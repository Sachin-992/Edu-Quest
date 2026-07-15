/**
 * EDUCORE-OMEGA Supabase Database Service
 * 
 * Database persistence layer for production use.
 * Handles students, teachers, attendance, marks, and audit logs.
 */

import { supabase, isAnalyticsEnabled } from './supabaseClient';
import { auditService } from './auditService';

// Types for database entities
export interface DBStudent {
    id: string;
    name: string;
    class: string;
    section: string;
    roll_no: number;
    parent_id?: string;
    fee_status: 'paid' | 'pending' | 'overdue';
    status: 'active' | 'suspended' | 'graduated';
    created_at: string;
    updated_at: string;
}

export interface DBTeacher {
    id: string;
    name: string;
    subject: string;
    classes: string[];
    experience_years: number;
    status: 'active' | 'leave' | 'resigned';
    created_at: string;
}

export interface DBAttendance {
    id: string;
    student_id: string;
    date: string;
    status: 'present' | 'absent' | 'late';
    marked_by: string;
    created_at: string;
}

export interface DBMarks {
    id: string;
    student_id: string;
    subject: string;
    exam_type: string;
    marks: number;
    max_marks: number;
    grade: string;
    entered_by: string;
    created_at: string;
}

export const databaseService = {
    /**
     * Check if Supabase is available
     */
    isAvailable: (): boolean => {
        return isAnalyticsEnabled && supabase !== null;
    },

    // ============================================
    // STUDENTS
    // ============================================

    getStudents: async (classFilter?: string): Promise<DBStudent[]> => {
        if (!databaseService.isAvailable()) return [];

        try {
            let query = supabase!.from('students').select('*');
            if (classFilter) {
                query = query.eq('class', classFilter);
            }
            const { data, error } = await query.order('roll_no');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching students:', error);
            return [];
        }
    },

    getStudentById: async (id: string): Promise<DBStudent | null> => {
        if (!databaseService.isAvailable()) return null;

        try {
            const { data, error } = await supabase!
                .from('students')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching student:', error);
            return null;
        }
    },

    createStudent: async (student: Omit<DBStudent, 'id' | 'created_at' | 'updated_at'>): Promise<DBStudent | null> => {
        if (!databaseService.isAvailable()) return null;

        try {
            const { data, error } = await supabase!
                .from('students')
                .insert([student])
                .select()
                .single();

            if (error) throw error;
            auditService.logAccess('system', 'System', 'ADMIN', 'CREATE', 'student:profile', data.id);
            return data;
        } catch (error) {
            console.error('Error creating student:', error);
            return null;
        }
    },

    updateStudent: async (id: string, updates: Partial<DBStudent>): Promise<DBStudent | null> => {
        if (!databaseService.isAvailable()) return null;

        try {
            const { data, error } = await supabase!
                .from('students')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            auditService.logAccess('system', 'System', 'ADMIN', 'UPDATE', 'student:profile', id);
            return data;
        } catch (error) {
            console.error('Error updating student:', error);
            return null;
        }
    },

    // ============================================
    // ATTENDANCE
    // ============================================

    getAttendance: async (date: string, classFilter?: string): Promise<DBAttendance[]> => {
        if (!databaseService.isAvailable()) return [];

        try {
            const { data, error } = await supabase!
                .from('attendance')
                .select('*, students(name, class)')
                .eq('date', date)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching attendance:', error);
            return [];
        }
    },

    markAttendance: async (records: Omit<DBAttendance, 'id' | 'created_at'>[]): Promise<boolean> => {
        if (!databaseService.isAvailable()) return false;

        try {
            const { error } = await supabase!
                .from('attendance')
                .upsert(records, { onConflict: 'student_id,date' });

            if (error) throw error;
            auditService.logAccess('system', 'System', 'TEACHER', 'CREATE', 'student:attendance');
            return true;
        } catch (error) {
            console.error('Error marking attendance:', error);
            return false;
        }
    },

    // ============================================
    // MARKS
    // ============================================

    getMarks: async (studentId?: string, subject?: string): Promise<DBMarks[]> => {
        if (!databaseService.isAvailable()) return [];

        try {
            let query = supabase!.from('marks').select('*, students(name, class)');

            if (studentId) query = query.eq('student_id', studentId);
            if (subject) query = query.eq('subject', subject);

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching marks:', error);
            return [];
        }
    },

    saveMarks: async (marks: Omit<DBMarks, 'id' | 'created_at'>[]): Promise<boolean> => {
        if (!databaseService.isAvailable()) return false;

        try {
            const { error } = await supabase!
                .from('marks')
                .insert(marks);

            if (error) throw error;
            auditService.logAccess('system', 'System', 'TEACHER', 'CREATE', 'student:marks');
            return true;
        } catch (error) {
            console.error('Error saving marks:', error);
            return false;
        }
    },

    // ============================================
    // AUDIT LOGS (Persistence)
    // ============================================

    saveAuditLog: async (log: Record<string, unknown>): Promise<boolean> => {
        if (!databaseService.isAvailable()) return false;

        try {
            const { error } = await supabase!
                .from('audit_logs')
                .insert([log]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving audit log:', error);
            return false;
        }
    },

    getAuditLogs: async (limit = 100): Promise<Record<string, unknown>[]> => {
        if (!databaseService.isAvailable()) return [];

        try {
            const { data, error } = await supabase!
                .from('audit_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            return [];
        }
    },

    // ============================================
    // REAL-TIME SUBSCRIPTIONS
    // ============================================

    subscribeToStudents: (callback: (students: DBStudent[]) => void) => {
        if (!databaseService.isAvailable()) return () => { };

        const subscription = supabase!
            .channel('students-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
                databaseService.getStudents().then(callback);
            })
            .subscribe();

        // Return unsubscribe function
        return () => {
            subscription.unsubscribe();
        };
    },

    subscribeToAttendance: (date: string, callback: (attendance: DBAttendance[]) => void) => {
        if (!databaseService.isAvailable()) return () => { };

        const subscription = supabase!
            .channel('attendance-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
                databaseService.getAttendance(date).then(callback);
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    },
};

export default databaseService;

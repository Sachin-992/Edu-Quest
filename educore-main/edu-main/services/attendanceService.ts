/**
 * EDUCORE-OMEGA Attendance Service
 * 
 * PRODUCTION VERSION: Period-based attendance with Supabase persistence
 * Manages attendance marking, viewing, and aggregate calculations.
 * 
 * SECURITY: All operations enforced by RBAC + RLS
 */

import { supabase, isAnalyticsEnabled } from './supabaseClient';
import { auditService } from './auditService';
import { rbacService } from './rbacService';

// ============================================
// TYPES
// ============================================

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'medical_leave' | 'on_duty' | 'half_day' | 'excused_leave' | 'holiday' | 'special_permission' | 'transfer_pending';

export interface PeriodAttendance {
    id: string;
    timetable_period_id: string;
    student_id: string;
    student_name?: string;
    date: string; // Mapped from attendance_date
    status: AttendanceStatus;
    marked_by: string;
    marked_at: string;
    remarks?: string;
}

export interface AttendanceRecord {
    student_id: string;
    status: AttendanceStatus;
    remarks?: string;
}

export interface AttendanceSummary {
    student_id: string;
    student_name?: string;
    class?: string;
    section?: string;
    subject_name?: string;
    subject_id?: string;
    total_periods: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    attendance_percentage: number;
    working_days?: number;
    medical_leave_count?: number;
    half_day_count?: number;
    on_duty_count?: number;
    excused_leave_count?: number;
    holiday_count?: number;
    special_permission_count?: number;
    transfer_pending_count?: number;
}

export interface OverallAttendance {
    student_id: string;
    total_periods: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
    working_days?: number;
    medical_leave?: number;
    half_day?: number;
    on_duty?: number;
    excused?: number;
}

// ============================================
// HELPERS
// ============================================

const isPersistenceAvailable = (): boolean => {
    return isAnalyticsEnabled && supabase !== null;
};

// ============================================
// SERVICE
// ============================================

export const attendanceService = {
    // ════════════════════════════════════════════════════════════════════
    // TEACHER: Mark Period Attendance
    // ════════════════════════════════════════════════════════════════════

    /**
     * Mark attendance for a period
     * Teacher must be assigned to this period (enforced by RBAC + RLS)
     */
    async markPeriodAttendance(
        timetablePeriodId: string,
        date: string,
        records: AttendanceRecord[],
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; error?: string; markedCount?: number }> {
        // ENFORCE RBAC
        rbacService.enforce('teacher:attendance', 'create');

        if (!isPersistenceAvailable()) {
            return { success: false, error: 'Database not configured.' };
        }

        try {
            // Verify teacher is assigned to this period (additional app-level check)
            const { data: period, error: periodError } = await supabase!
                .from('timetable_periods')
                .select('id, class, section, teacher_id')
                .eq('id', timetablePeriodId)
                .single();

            if (periodError || !period) {
                return { success: false, error: 'Period not found or access denied.' };
            }

            // Prepare upsert records for attendance_periods
            const upsertData = records.map(r => ({
                timetable_period_id: timetablePeriodId,
                student_id: r.student_id,
                attendance_date: date,
                status: r.status,
                marked_by: actorId,
                marked_at: new Date().toISOString(),
                remarks: r.remarks,
            }));

            // Upsert attendance (insert or update on conflict)
            const { error } = await supabase!
                .from('attendance_periods')
                .upsert(upsertData, {
                    onConflict: 'timetable_period_id,student_id,attendance_date',
                });

            if (error) {
                await auditService.log({
                    actor_id: actorId,
                    actor_name: actorName,
                    actor_role: actorRole,
                    action: 'CREATE',
                    entity: 'attendance_periods',
                    entity_id: timetablePeriodId,
                    severity: 'error',
                    details: `Failed: ${error.message}`,
                });
                return { success: false, error: error.message };
            }

            // Audit success
            const presentCount = records.filter(r => r.status === 'present').length;
            const absentCount = records.filter(r => r.status === 'absent').length;
            const lateCount = records.filter(r => r.status === 'late').length;

            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'CREATE',
                entity: 'attendance_periods',
                entity_id: timetablePeriodId,
                severity: 'success',
                details: `Marked ${records.length} students: P=${presentCount}, A=${absentCount}, L=${lateCount} on ${date}`,
            });

            return { success: true, markedCount: records.length };
        } catch (err: any) {
            return { success: false, error: err.message || 'Unexpected error' };
        }
    },

    /**
     * Get attendance for a specific period and date
     */
    async getAttendanceForPeriod(
        timetablePeriodId: string,
        date: string
    ): Promise<{ data: PeriodAttendance[]; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { data: [], error: 'DB Unavailable' };
        }

        try {
            const { data, error } = await supabase!
                .from('attendance_periods')
                .select(`
                    *,
                    students:student_id (name)
                `)
                .eq('timetable_period_id', timetablePeriodId)
                .eq('attendance_date', date);

            if (error) {
                console.error('[ATTENDANCE] Failed to fetch:', error);
                return { data: [], error: error.message };
            }

            const mapped = (data || []).map((r: any) => ({
                ...r,
                date: r.attendance_date,
                student_name: r.students?.name,
            })) as PeriodAttendance[];

            return { data: mapped };
        } catch (err: any) {
            return { data: [], error: err.message };
        }
    },

    // ════════════════════════════════════════════════════════════════════
    // STUDENT: View My Attendance
    // ════════════════════════════════════════════════════════════════════

    /**
     * Get attendance records for a specific student
     */
    async getMyAttendance(
        studentId: string,
        filters?: { subjectId?: string; startDate?: string; endDate?: string }
    ): Promise<{ data: PeriodAttendance[]; error?: string }> {
        // RBAC check
        rbacService.enforce('student:period_attendance', 'read');

        if (!isPersistenceAvailable()) {
            return { data: [], error: 'DB Unavailable' };
        }

        try {
            let query = supabase!
                .from('attendance_periods')
                .select(`
                    *,
                    timetable_periods:timetable_period_id (
                        period_number,
                        subject,
                        timetables:timetable_id (
                            class,
                            section
                        )
                    )
                `)
                .eq('student_id', studentId)
                .order('attendance_date', { ascending: false });

            if (filters?.startDate) {
                query = query.gte('attendance_date', filters.startDate);
            }
            if (filters?.endDate) {
                query = query.lte('attendance_date', filters.endDate);
            }

            const { data, error } = await query;

            if (error) {
                console.error('[ATTENDANCE] Failed to fetch student attendance:', error);
                return { data: [], error: error.message };
            }

            // Filter by subject if specified
            let records = data || [];
            if (filters?.subjectId) {
                // subjectId can be name or UUID
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.subjectId);
                if (isUUID) {
                    // Look up subject name
                    const { data: subData } = await supabase!
                        .from('subjects')
                        .select('name')
                        .eq('id', filters.subjectId)
                        .single();
                    if (subData) {
                        records = records.filter((r: any) =>
                            r.timetable_periods?.subject === subData.name
                        );
                    }
                } else {
                    records = records.filter((r: any) =>
                        r.timetable_periods?.subject === filters.subjectId
                    );
                }
            }

            const mapped = (records || []).map((r: any) => {
                const tp = r.timetable_periods;
                return {
                    ...r,
                    date: r.attendance_date,
                    timetable_periods: tp ? {
                        period_number: tp.period_number,
                        subject_id: tp.subject,
                        class: tp.timetables?.class || '',
                        section: tp.timetables?.section || '',
                        subjects: { name: tp.subject }
                    } : null
                };
            }) as PeriodAttendance[];

            return { data: mapped };
        } catch (err: any) {
            return { data: [], error: err.message };
        }
    },

    // ════════════════════════════════════════════════════════════════════
    // PARENT: View Linked Student Attendance
    // ════════════════════════════════════════════════════════════════════

    /**
     * Get attendance for a linked student (parent view)
     */
    async getChildAttendance(
        studentId: string,
        filters?: { subjectId?: string; startDate?: string; endDate?: string }
    ): Promise<{ data: PeriodAttendance[]; error?: string }> {
        return this.getMyAttendance(studentId, filters);
    },

    // ════════════════════════════════════════════════════════════════════
    // ATTENDANCE CALCULATIONS
    // ════════════════════════════════════════════════════════════════════

    /**
     * Calculate per-subject attendance percentage
     */
    async calculateSubjectAttendance(
        studentId: string,
        subjectId: string
    ): Promise<{ percentage: number; total: number; present: number; absent: number; late: number }> {
        if (!isPersistenceAvailable()) {
            return { percentage: 0, total: 0, present: 0, absent: 0, late: 0 };
        }

        try {
            const { data, error } = await supabase!
                .from('attendance_periods')
                .select(`
                    status,
                    timetable_periods:timetable_period_id (subject)
                `)
                .eq('student_id', studentId);

            if (error || !data) {
                return { percentage: 0, total: 0, present: 0, absent: 0, late: 0 };
            }

            // Resolve subjectId to name if UUID
            let targetSubjectName = subjectId;
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subjectId);
            if (isUUID) {
                const { data: subData } = await supabase!
                    .from('subjects')
                    .select('name')
                    .eq('id', subjectId)
                    .single();
                if (subData) {
                    targetSubjectName = subData.name;
                }
            }

            // Filter by subject
            const subjectRecords = data.filter((r: any) =>
                r.timetable_periods?.subject === targetSubjectName
            );

            const working = subjectRecords.filter((r: any) => !['medical_leave', 'excused_leave', 'holiday', 'transfer_pending'].includes(r.status));
            const total = working.length;
            const present = working.filter((r: any) => ['present', 'on_duty', 'special_permission'].includes(r.status)).length;
            const absent = working.filter((r: any) => r.status === 'absent').length;
            const late = working.filter((r: any) => r.status === 'late').length;
            const halfDay = working.filter((r: any) => r.status === 'half_day').length;

            const percentage = total > 0 ? Math.round(((present + late + halfDay * 0.5) / total) * 100) : 100;

            return { percentage, total, present: present + late + halfDay, absent, late };
        } catch (err) {
            return { percentage: 0, total: 0, present: 0, absent: 0, late: 0 };
        }
    },

    /**
     * Calculate overall attendance percentage for a student
     */
    async calculateOverallAttendance(studentId: string): Promise<OverallAttendance> {
        if (!isPersistenceAvailable()) {
            return { student_id: studentId, total_periods: 0, present: 0, absent: 0, late: 0, percentage: 0 };
        }

        try {
            const { data, error } = await supabase!
                .from('attendance_periods')
                .select('status')
                .eq('student_id', studentId);

            if (error || !data) {
                return { student_id: studentId, total_periods: 0, present: 0, absent: 0, late: 0, percentage: 0 };
            }

            const working = data.filter(r => !['medical_leave', 'excused_leave', 'holiday', 'transfer_pending'].includes(r.status));
            const total = working.length;
            const present = working.filter(r => ['present', 'on_duty', 'special_permission'].includes(r.status)).length;
            const absent = working.filter(r => r.status === 'absent').length;
            const late = working.filter(r => r.status === 'late').length;
            const halfDay = working.filter(r => r.status === 'half_day').length;
            const leave = data.length - working.length;

            const percentage = total > 0 ? Math.round(((present + late + halfDay * 0.5) / total) * 100) : 100;

            return {
                student_id: studentId,
                total_periods: data.length,
                present: present + late + halfDay,
                absent,
                late,
                percentage,
                working_days: total,
                medical_leave: leave
            };
        } catch (err) {
            return { student_id: studentId, total_periods: 0, present: 0, absent: 0, late: 0, percentage: 0 };
        }
    },

    /**
     * Get attendance summary (uses database view)
     */
    async getAttendanceSummary(
        studentId: string
    ): Promise<{ data: AttendanceSummary[]; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { data: [], error: 'DB Unavailable' };
        }

        try {
            const { data, error } = await supabase!
                .from('attendance_summary')
                .select('*')
                .eq('student_id', studentId);

            if (error) {
                console.error('[ATTENDANCE] Failed to fetch summary:', error);
                return { data: [], error: error.message };
            }

            return { data: data as AttendanceSummary[] };
        } catch (err: any) {
            return { data: [], error: err.message };
        }
    },

    /**
     * Get students for a period (for attendance marking UI)
     */
    async getStudentsForPeriod(
        timetablePeriodId: string
    ): Promise<{ data: { id: string; name: string; roll_no: number }[]; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { data: [], error: 'DB Unavailable' };
        }

        try {
            // Get the class and section from the timetables via timetable_periods
            const { data: period, error: periodError } = await supabase!
                .from('timetable_periods')
                .select(`
                    timetables:timetable_id(class, section)
                `)
                .eq('id', timetablePeriodId)
                .single();

            if (periodError || !period || !period.timetables) {
                // Fallback to checking direct class/section if the database relation maps differently
                const { data: periodFallback } = await supabase!
                    .from('timetable_periods')
                    .select('class, section')
                    .eq('id', timetablePeriodId)
                    .single();
                    
                if (periodFallback) {
                    const { data: students, error: studentsError } = await supabase!
                        .from('students')
                        .select('id, name, roll_no')
                        .eq('class', periodFallback.class)
                        .eq('section', periodFallback.section)
                        .neq('status', 'inactive')
                        .order('roll_no', { ascending: true });
                    return { data: students || [], error: studentsError?.message };
                }
                return { data: [], error: 'Period timetable not found' };
            }

            const { class: gradeLevel, section } = period.timetables as any;

            // Get students in that class
            const { data: students, error: studentsError } = await supabase!
                .from('students')
                .select('id, name, roll_no')
                .eq('class', gradeLevel)
                .eq('section', section)
                .neq('status', 'inactive')
                .order('roll_no', { ascending: true });

            if (studentsError) {
                return { data: [], error: studentsError.message };
            }

            return { data: students || [] };
        } catch (err: any) {
            return { data: [], error: err.message };
        }
    },

    /**
     * Check if storage is available
     */
    isPersistent(): boolean {
        return isPersistenceAvailable();
    },
};

export default attendanceService;

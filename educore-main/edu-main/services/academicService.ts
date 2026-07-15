/**
 * EDUCORE-OMEGA Academic Service
 * 
 * PRODUCTION VERSION: Writes to Supabase database
 * All academic data is persistent and audited.
 */

import { supabase, isAnalyticsEnabled } from './supabaseClient';
import { auditService } from './auditService';
import { rbacService } from './rbacService';
import { notificationService } from './notificationService';

// Types
export interface Assignment {
    id: string;
    title: string;
    description?: string;
    subject_id?: string;
    teacher_id?: string;
    class_id?: string;
    due_date?: string;
    max_marks: number;
    type: 'Homework' | 'Project' | 'Exam';
    submission_mode?: 'online' | 'offline';
    allow_late_submission?: boolean;
    created_at?: string;
}

export interface AttendanceRecord {
    id: string;
    student_id: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'medical_leave' | 'on_duty' | 'half_day' | 'excused_leave' | 'holiday' | 'special_permission' | 'transfer_pending';
    marked_by?: string;
    created_at?: string;
    remarks?: string;
}

export interface MarksRecord {
    id: string;
    student_id: string;
    subject: string;
    exam_type: string;
    marks: number;
    max_marks: number;
    grade?: string;
    entered_by?: string;
    created_at?: string;
}

export interface RemarkRecord {
    id: string;
    student_id: string;
    teacher_id?: string;
    type: 'academic' | 'behavior' | 'counselling';
    content: string;
    created_at?: string;
}

// Check if database is available
const isPersistenceAvailable = (): boolean => isAnalyticsEnabled && supabase !== null;

export const academicService = {
    /**
     * Check if persistence is available
     */
    isPersistent: (): boolean => isPersistenceAvailable(),

    // ============================================
    // STUDENT OPERATIONS
    // ============================================

    // ============================================
    // STUDENT VIEW OPERATIONS
    // ============================================

    /**
     * Get Attendance Stats for a Student
     */
    getAttendanceStats: async (studentId: string): Promise<{ present: number; total: number; percentage: number; error?: string }> => {
        if (!isPersistenceAvailable()) return { present: 0, total: 0, percentage: 0 };

        const { data, error } = await supabase!
            .from('attendance_summary')
            .select('*')
            .eq('student_id', studentId);

        if (error) {
            console.error('[ACADEMIC] Error fetching attendance stats:', error);
            return { present: 0, total: 0, percentage: 0, error: error.message };
        }

        // Aggregate across subjects if multiple rows exist (though summary is usually subject-wise)
        // For dashboard "Total", we sum them up?
        // Or if the implementation has a 'summary' row.
        // Let's sum up for overall view
        const totalPeriods = data?.reduce((acc, curr) => acc + curr.total_periods, 0) || 0;
        const attendedPeriods = data?.reduce((acc, curr) => acc + curr.attended_periods, 0) || 0;
        const percentage = totalPeriods > 0 ? Number(((attendedPeriods / totalPeriods) * 100).toFixed(1)) : 0;

        return { present: attendedPeriods, total: totalPeriods, percentage };
    },

    /**
     * Get Detailed Attendance Records for a Student (for monthly/daily view)
     * Uses SECURITY DEFINER function to bypass RLS safely
     */
    getAttendanceDetails: async (studentId: string): Promise<AttendanceRecord[]> => {
        if (!isPersistenceAvailable()) return [];

        // Use the SECURITY DEFINER function that handles role-based access
        const { data, error } = await supabase!
            .rpc('get_my_attendance_details');

        if (error) {
            console.error('[ACADEMIC] Error fetching attendance details:', error);
            // Fallback to direct query (in case function doesn't exist yet)
            const { data: fallbackData, error: fallbackError } = await supabase!
                .from('attendance_periods')
                .select('id, student_id, attendance_date, status, marked_at')
                .eq('student_id', studentId)
                .order('attendance_date', { ascending: false });

            if (fallbackError) {
                console.error('[ACADEMIC] Fallback also failed:', fallbackError);
                return [];
            }

            return (fallbackData || []).map(row => ({
                id: row.id,
                student_id: row.student_id,
                date: row.attendance_date,
                status: row.status,
                created_at: row.marked_at
            }));
        }

        // Map to standard AttendanceRecord format
        return (data || []).map(row => ({
            id: row.id,
            student_id: row.student_id,
            date: row.attendance_date,
            status: row.status,
            created_at: row.marked_at
        }));
    },

    /**
     * Get Marks/Results for a Student
     */
    getStudentMarks: async (studentId: string): Promise<MarksRecord[]> => {
        if (!isPersistenceAvailable()) return [];

        // Simplified query - fetch marks directly without joins
        // The marks table already has subject (text) and exam_type (text) columns
        const { data, error } = await supabase!
            .from('marks')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[ACADEMIC] Error fetching marks:', error);
            return [];
        }

        // Return data as-is since subject and exam_type are already text fields
        return data || [];
    },

    /**
     * Get Homework/Assignments for Student (from both assignments and daily_homework tables)
     * This fetches teacher-created assignments and daily homework for the student's class
     */
    getStudentHomework: async (classId: string, date?: string): Promise<any[]> => {
        console.log('[STUDENT_HOMEWORK] Fetching for classId:', classId);
        if (!isPersistenceAvailable()) return [];

        try {
            // Fetch from assignments table
            let assignmentsQuery = supabase!
                .from('assignments')
                .select('*')
                .eq('class_id', classId)
                .order('due_date', { ascending: false });

            if (date) {
                assignmentsQuery = assignmentsQuery.eq('due_date', date);
            }

            // Fetch from daily_homework table
            let homeworkQuery = supabase!
                .from('daily_homework')
                .select('*')
                .eq('class_id', classId)
                .order('homework_date', { ascending: false });

            if (date) {
                homeworkQuery = homeworkQuery.eq('homework_date', date);
            }

            const [assignmentsResult, homeworkResult] = await Promise.all([
                assignmentsQuery,
                homeworkQuery
            ]);

            console.log('[STUDENT_HOMEWORK] Assignments result:', assignmentsResult);
            console.log('[STUDENT_HOMEWORK] Homework result:', homeworkResult);

            // Combine results - assignments get priority display
            const assignments = (assignmentsResult.data || []).map((a: any) => ({
                ...a,
                source: 'assignment',
                display_title: a.title,
                display_date: a.due_date
            }));

            const homework = (homeworkResult.data || []).map((h: any) => ({
                ...h,
                source: 'homework',
                title: h.content ? h.content.substring(0, 50) + (h.content.length > 50 ? '...' : '') : 'Homework',
                display_title: h.content,
                display_date: h.homework_date,
                due_date: h.homework_date,
                subject_name: h.subject_id ? h.subject_id.charAt(0).toUpperCase() + h.subject_id.slice(1) : 'Unknown'
            }));

            return [...assignments, ...homework];
        } catch (error) {
            console.error('Error fetching student homework:', error);
            return [];
        }
    },

    /**
     * Get students (from DB only)
     */
    getStudents: async (classFilter?: string): Promise<{ data: any[]; error?: string }> => {
        if (!isPersistenceAvailable()) {
            return { data: [], error: 'Database connection unavailable' };
        }

        try {
            let query = supabase!.from('students').select('*');
            if (classFilter) {
                const [cls, section] = classFilter.split('-');
                query = query.eq('class', cls).eq('section', section);
            }
            const { data, error } = await query.order('roll_no', { ascending: true });

            if (error) throw error;
            return { data: data || [] };
        } catch (err: any) {
            console.error('[ACADEMIC] Error fetching students:', err);
            return { data: [], error: err.message };
        }
    },

    // ============================================
    // GOVERNANCE ACTIONS (Edge Function)
    // ============================================

    /**
     * Mark Attendance (Direct DB Insert)
     */
    markAttendance: async (
        periodId: string, // UUID of timetable_period
        records: { student_id: string; status: string; remarks?: string }[],
        teacherId: string,
        customDate?: string
    ): Promise<{ success: boolean; error?: string }> => {
        if (!isPersistenceAvailable()) return { success: false, error: 'DB Unavailable' };

        try {
            const attendanceDate = customDate || new Date().toISOString().split('T')[0];
            const insertData = records.map(r => ({
                student_id: r.student_id,
                timetable_period_id: periodId,
                attendance_date: attendanceDate,
                status: r.status,
                marked_by: teacherId,
                marked_at: new Date().toISOString(),
                remarks: r.remarks || null
            }));

            const { error } = await supabase!
                .from('attendance_periods')
                .upsert(insertData, { onConflict: 'student_id, timetable_period_id, attendance_date' });

            if (error) throw error;

            await auditService.logAccess(
                teacherId, 'Teacher', 'TEACHER', 'CREATE', 'attendance',
                periodId, `Marked attendance for ${records.length} students`
            );
            return { success: true };
        } catch (err: any) {
            console.error('[ACADEMIC] Attendance failed:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Save Marks (Direct DB Insert)
     */
    saveMarks: async (
        examId: string,
        records: { student_id: string; subject: string; marks: number; max_marks: number }[],
        teacherId: string
    ): Promise<{ success: boolean; error?: string }> => {
        if (!isPersistenceAvailable()) return { success: false, error: 'DB Unavailable' };

        try {
            const insertData = records.map(r => ({
                student_id: r.student_id,
                subject: r.subject,
                exam_type: examId, // Using examId as exam_type for now
                marks: r.marks,
                max_marks: r.max_marks,
                entered_by: teacherId
            }));

            const { error } = await supabase!
                .from('marks')
                .insert(insertData);

            if (error) throw error;

            await auditService.logAccess(
                teacherId, 'Teacher', 'TEACHER', 'CREATE', 'marks',
                examId, `Saved marks for ${records.length} students`
            );
            return { success: true };
        } catch (err: any) {
            console.error('[ACADEMIC] Save Marks failed:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Create Notice (Direct DB Insert)
     */
    createNotice: async (
        classId: string | null,
        type: 'homework' | 'announcement' | 'exam',
        title: string,
        content: string
    ): Promise<{ success: boolean; error?: string }> => {
        if (!isPersistenceAvailable()) return { success: false, error: 'DB Unavailable' };

        try {
            // 1. Create the notice
            const { data: notice, error } = await supabase!
                .from('notices')
                .insert([{ class_id: classId, type, title, content }])
                .select()
                .single();

            if (error) throw error;

            // 2. Generate Notifications for Students & Parents
            if (classId) {
                // A. Get Class Details (Grade & Section)
                const { data: classDetails, error: classInfoError } = await supabase!
                    .from('classes')
                    .select('grade_level, section')
                    .eq('id', classId)
                    .single();

                if (classDetails) {
                    // B. Get Students in this class
                    // Using the grade_level and section from the safely fetched class details
                    const { data: students, error: studentsError } = await supabase!
                        .from('students')
                        .select('id, user_id')
                        .eq('class', classDetails.grade_level)
                        .eq('section', classDetails.section);

                    if (studentsError) console.error("Error fetching students for notices:", studentsError);

                    if (students && students.length > 0) {
                        const notificationsToInsert: any[] = [];
                        const studentIds = students.map(s => s.id);

                        // C. Prepare Student Notifications
                        students.forEach(s => {
                            if (s.user_id) {
                                notificationsToInsert.push({
                                    user_id: s.user_id,
                                    type: type === 'homework' ? 'info' : type === 'exam' ? 'warning' : 'announcement',
                                    category: type === 'homework' ? 'academic' : type === 'exam' ? 'academic' : 'announcement',
                                    priority: type === 'exam' ? 'high' : 'normal',
                                    title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}: ${title}`,
                                    message: content.length > 100 ? content.substring(0, 100) + '...' : content,
                                    read: false,
                                    dismissed: false,
                                    metadata: { source_id: notice.id, source_type: 'notice' },
                                    target_role: 'student'
                                });
                            }
                        });

                        // D. Get Parents of these students
                        const { data: parents, error: parentsError } = await supabase!
                            .from('parent_student_links')
                            .select(`
                                student_id,
                                parent:parents!inner (
                                    user_id
                                )
                            `)
                            .in('student_id', studentIds);

                        if (parentsError) console.error("Error fetching parents for notices:", parentsError);

                        // E. Prepare Parent Notifications
                        if (parents && parents.length > 0) {
                            parents.forEach((p: any) => {
                                if (p.parent?.user_id) {
                                    notificationsToInsert.push({
                                        user_id: p.parent.user_id,
                                        type: 'info',
                                        category: 'academic',
                                        priority: 'normal',
                                        title: `New Notice for your Child: ${title}`,
                                        message: content.length > 100 ? content.substring(0, 100) + '...' : content,
                                        read: false,
                                        dismissed: false,
                                        metadata: { source_id: notice.id, source_type: 'notice', student_id: p.student_id },
                                        target_role: 'parent'
                                    });
                                }
                            });
                        }

                        // F. Batch Insert All Notifications
                        if (notificationsToInsert.length > 0) {
                            const { error: insertError } = await supabase!.from('notifications').insert(notificationsToInsert);
                            if (insertError) console.error("Error batch inserting notifications:", insertError);
                        }
                    }
                } else {
                    console.error("Could not find class details for notification:", classInfoError);
                }
            } else {
                // School-wide: handled separately or via broadcast in future
            }

            return { success: true };
        } catch (err: any) {
            console.error('Error creating notice:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Get Remarks for a Class (Teacher View)
     */
    getStudentRemarks: async (classId: string): Promise<any[]> => {
        if (!isPersistenceAvailable()) return [];

        try {
            // Get all students in the class first
            // We need to know which students are in this class to filter remarks or just show empty slots
            const { data: students } = await academicService.getStudents(classId); // We assume getStudents can filter by classId if we implement that, or we do manual filter.

            // Actually, let's just query the remarks table joined with students
            // But we need to filter by class. 
            // Join: remarks -> students -> classes

            // First get student IDs for this class
            const { data: classStudents } = await supabase!
                .from('students')
                .select('id')
                .eq('class', (await supabase!.from('classes').select('grade_level').eq('id', classId).single()).data?.grade_level)
                .eq('section', (await supabase!.from('classes').select('section').eq('id', classId).single()).data?.section);

            const studentIds = classStudents?.map(s => s.id) || [];

            if (studentIds.length === 0) return [];

            const { data, error } = await supabase!
                .from('remarks')
                .select('*')
                .in('student_id', studentIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Error fetching remarks:', err);
            return [];
        }
    },

    /**
     * Save Student Remark (Teacher Only)
     */
    saveStudentRemark: async (
        studentId: string,
        content: string,
        category: string = 'general'
    ): Promise<{ success: boolean; error?: string }> => {
        if (!isPersistenceAvailable()) return { success: false, error: 'DB Unavailable' };

        try {
            const { error } = await supabase!
                .from('remarks')
                .insert({
                    student_id: studentId,
                    content,
                    category,
                    is_private: true, // Always private for now
                    teacher_id: (await supabase!.auth.getUser()).data.user?.id // Ideally get teacher profile ID
                });

            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            console.error('Error saving remark:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Get Notices for a class (or all for admin/teacher view)
     */
    getNotices: async (classId?: string): Promise<any[]> => {
        if (!isPersistenceAvailable()) return [];
        let query = supabase!.from('notices').select('*').order('created_at', { ascending: false });
        // RLS handles visibility, but we can filter client side or via query if needed
        if (classId) {
            query = query.or(`class_id.eq.${classId},class_id.is.null`);
        }
        const { data, error } = await query;
        if (error) {
            console.error('Error fetching notices:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Get Homework for a class
     */
    getHomework: async (classId: string, date?: string): Promise<any[]> => {
        console.log('[HOMEWORK] Fetching for classId:', classId);
        if (!isPersistenceAvailable()) return [];
        let query = supabase!
            .from('daily_homework')
            .select('*')
            .eq('class_id', classId)
            .order('homework_date', { ascending: false });

        if (date) {
            query = query.eq('homework_date', date);
        }

        const { data, error } = await query;
        console.log('[HOMEWORK] Fetch result:', { data, error });

        if (error) {
            console.error('Error fetching homework:', error);
            return [];
        }
        // Map subject name from subject_id (stored as lowercase name)
        return (data || []).map((item: any) => ({
            ...item,
            subject_name: item.subject_id ? item.subject_id.charAt(0).toUpperCase() + item.subject_id.slice(1) : 'Unknown'
        }));
    },

    /**
     * Update Daily Homework (Direct DB Upsert)
     */
    updateHomework: async (
        classId: string,
        subjectId: string,
        content: string,
        date?: string
    ): Promise<{ success: boolean; error?: string }> => {
        console.log('[HOMEWORK] Saving:', { classId, subjectId, content, date });
        if (!isPersistenceAvailable()) return { success: false, error: 'DB Unavailable' };

        try {
            const homeworkDate = date || new Date().toISOString().split('T')[0];
            // Use INSERT instead of UPSERT to avoid unique constraint issues
            const { data, error } = await supabase!
                .from('daily_homework')
                .insert([{
                    class_id: classId,
                    subject_id: subjectId,
                    content,
                    homework_date: homeworkDate
                }])
                .select();

            console.log('[HOMEWORK] Save result:', { data, error });

            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            console.error('[HOMEWORK] Save error:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Delete Homework entry
     */
    deleteHomework: async (homeworkId: string): Promise<{ success: boolean; error?: string }> => {
        if (!isPersistenceAvailable()) return { success: false, error: 'DB Unavailable' };

        try {
            const { error } = await supabase!
                .from('daily_homework')
                .delete()
                .eq('id', homeworkId);

            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Get Timetable for a Class (New Method)
     */
    getClassTimetable: async (cls: string, section: string): Promise<any[]> => {
        if (!isPersistenceAvailable()) return [];

        const { data, error } = await supabase!
            .from('timetables')
            .select(`
                id, academic_year, status,
                periods:timetable_periods(
                    id, day_of_week, period_number, subject, start_time, end_time,
                    teacher:teachers(name)
                )
            `)
            .eq('class', cls)
            .eq('section', section)
            .eq('status', 'published')
            .single();

        if (error) {
            console.error('[ACADEMIC] Timetable fetch failed:', error);
            return [];
        }
        return data?.periods || [];
    },

    /**
     * Get Timetable Periods for Teacher (Today)
     */
    getTodayPeriods: async (teacherId: string): Promise<any[]> => {
        console.log('[getTodayPeriods] Fetching for teacher ID:', teacherId);

        // This is a read operation, can be direct DB
        const dayOfWeek = new Date().getDay() || 7; // 1=Mon, 7=Sun

        // Step 1: Get periods for this teacher (use left join to include draft timetables)
        let { data: periods, error } = await supabase!
            .from('timetable_periods')
            .select(`
                id, period_number, start_time, end_time, subject, day_of_week, teacher_id,
                timetable:timetables(id, status, class_id)
            `)
            .eq('teacher_id', teacherId);

        console.log('[getTodayPeriods] Query result for teacher:', { periods, error, teacherId });

        // If no periods found for this specific teacher, try getting periods by matching teacher name
        if ((!periods || periods.length === 0) && !error) {
            console.log('[getTodayPeriods] No periods with teacher_id, checking teacher profile...');

            // Get teacher name first
            const { data: teacher } = await supabase!
                .from('teachers')
                .select('name')
                .eq('id', teacherId)
                .single();

            console.log('[getTodayPeriods] Teacher name:', teacher?.name);

            // Get all periods (for debugging)
            const { data: allPeriods } = await supabase!
                .from('timetable_periods')
                .select(`
                    id, period_number, start_time, end_time, subject, day_of_week, teacher_id,
                    timetable:timetables(id, status, class_id)
                `)
                .limit(50);

            console.log('[getTodayPeriods] All periods in DB:', allPeriods);
        }

        if (error) {
            console.error('Error fetching periods:', error);
            return [];
        }

        if (!periods || periods.length === 0) {
            console.log('[getTodayPeriods] No periods found for this teacher');
            return [];
        }

        // Step 2: Get class info for each unique class_id
        const classIds = [...new Set(periods.map((p: any) => p.timetable?.class_id).filter(Boolean))];

        const { data: classes } = await supabase!
            .from('classes')
            .select('id, grade_level, section')
            .in('id', classIds);

        const classMap = new Map((classes || []).map((c: any) => [c.id, c]));

        // Step 3: Transform to expected format
        return periods.map((p: any) => {
            const timetable = p.timetable;
            const classInfo = classMap.get(timetable?.class_id);
            return {
                ...p,
                timetable: {
                    ...timetable,
                    class: classInfo?.grade_level || '',
                    section: classInfo?.section || ''
                }
            };
        });
    },

    /**
     * Get Active Exams
     */
    getActiveExams: async (): Promise<any[]> => {
        const { data } = await supabase!
            .from('exams')
            .select('*')
            .neq('status', 'draft')
            .order('start_date', { ascending: true }); // sort by date
        return data || [];
    },

    /**
     * Get ALL Exams (Admin View - includes drafts)
     */
    getAllExams: async (): Promise<any[]> => {
        if (!isPersistenceAvailable()) return [];
        const { data } = await supabase!
            .from('exams')
            .select('*')
            .order('created_at', { ascending: false });
        return data || [];
    },

    /**
     * Create Exam (Admin)
     */
    createExam: async (
        title: string,
        startDate: string,
        endDate: string
    ): Promise<{ success: boolean; error?: string }> => {
        // RBAC Check implicitly handled by RLS but explicit check good practice
        if (!isPersistenceAvailable()) return { success: false, error: 'DB Connection Error' };

        const { error } = await supabase!.from('exams').insert([{
            title,
            start_date: startDate,
            end_date: endDate,
            status: 'draft' // Default to draft
        }]);

        if (error) {
            console.error('Create Exam Failed:', error);
            return { success: false, error: error.message };
        }
        return { success: true };
    },

    /**
     * Update Exam Status (Publish/Close)
     */
    updateExamStatus: async (
        examId: string,
        status: 'draft' | 'active' | 'completed' | 'published'
    ): Promise<{ success: boolean; error?: string }> => {
        if (!isPersistenceAvailable()) return { success: false, error: 'DB Connection Error' };

        const { error } = await supabase!
            .from('exams')
            .update({ status })
            .eq('id', examId);

        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    },

    /**
     * Update Exam Details (Title, Dates)
     */
    updateExam: async (
        examId: string,
        title: string,
        startDate: string,
        endDate: string
    ): Promise<{ success: boolean; error?: string }> => {
        if (!isPersistenceAvailable()) return { success: false, error: 'DB Connection Error' };

        const currentUser = rbacService.getCurrentUser();

        const { error } = await supabase!
            .from('exams')
            .update({
                title,
                start_date: startDate,
                end_date: endDate
            })
            .eq('id', examId);

        if (error) {
            console.error('Update Exam Failed:', error);
            return { success: false, error: error.message };
        }

        await auditService.logAccess(
            currentUser?.id || 'admin',
            currentUser?.name || 'Admin',
            'ADMIN',
            'UPDATE',
            'exam',
            examId,
            `Updated exam: ${title}`
        );

        return { success: true };
    },

    /**
     * Delete Exam
     */
    deleteExam: async (examId: string): Promise<{ success: boolean; error?: string }> => {
        if (!isPersistenceAvailable()) return { success: false, error: 'DB Connection Error' };

        const currentUser = rbacService.getCurrentUser();

        const { error } = await supabase!
            .from('exams')
            .delete()
            .eq('id', examId);

        if (error) {
            console.error('Delete Exam Failed:', error);
            return { success: false, error: error.message };
        }

        await auditService.logAccess(
            currentUser?.id || 'admin',
            currentUser?.name || 'Admin',
            'ADMIN',
            'DELETE',
            'exam',
            examId,
            `Deleted exam ID: ${examId}`
        );

        return { success: true };
    },

    // ============================================
    // ASSIGNMENT OPERATIONS
    // ============================================

    /**
     * Create assignment (PERSISTS TO DATABASE)
     */
    createAssignment: async (
        assignment: Omit<Assignment, 'id' | 'created_at'>
    ): Promise<{ success: boolean; data?: Assignment; error?: string }> => {
        // RBAC ENFORCEMENT (CRITICAL)
        rbacService.enforce('teacher:assignments', 'create');

        const currentUser = rbacService.getCurrentUser();

        if (!isPersistenceAvailable()) {
            return { success: false, error: 'Database connection unavailable' };
        }

        try {
            const { data, error } = await supabase!
                .from('assignments')
                .insert([assignment])
                .select()
                .single();

            if (error) throw error;

            await auditService.logAccess(
                currentUser?.id || 'unknown',
                currentUser?.name || 'Teacher',
                'TEACHER',
                'CREATE',
                'assignment',
                data.id,
                `Created assignment: ${assignment.title}`
            );

            return { success: true, data: data as Assignment };
        } catch (err: any) {
            console.error('[ACADEMIC] Assignment creation failed:', err);
            return { success: false, error: err.message || 'Database write failed' };
        }
    },

    /**
     * Get assignments for a class
     */
    getAssignmentsForClass: async (classId: string): Promise<Assignment[]> => {
        console.log('[ASSIGNMENTS] Fetching for classId:', classId);
        if (!isPersistenceAvailable()) {
            return [];
        }

        try {
            const { data, error } = await supabase!
                .from('assignments')
                .select('*')
                .eq('class_id', classId)
                .order('created_at', { ascending: false });

            console.log('[ASSIGNMENTS] Fetch result:', { data, error });
            if (error) throw error;
            return data as Assignment[] || [];
        } catch (err) {
            console.error('[ACADEMIC] Error fetching assignments:', err);
            return [];
        }
    },

    /**
     * Delete an assignment
     */
    deleteAssignment: async (assignmentId: string): Promise<{ success: boolean; error?: string }> => {
        if (!isPersistenceAvailable()) return { success: false, error: 'DB Unavailable' };

        try {
            const { error } = await supabase!
                .from('assignments')
                .delete()
                .eq('id', assignmentId);

            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    // ============================================
    // REMARKS OPERATIONS
    // ============================================

    /**
     * Save a remark (PERSISTS TO DATABASE)
     */
    saveRemark: async (
        studentId: string,
        type: 'academic' | 'behavior' | 'counselling',
        content: string,
        teacherId: string
    ): Promise<{ success: boolean; error?: string }> => {
        // RBAC ENFORCEMENT (CRITICAL)
        rbacService.enforce('student:remarks', 'create');

        const currentUser = rbacService.getCurrentUser();

        if (!isPersistenceAvailable()) {
            return { success: false, error: 'Database connection unavailable' };
        }

        try {
            const { error } = await supabase!.from('remarks').insert([{
                student_id: studentId,
                teacher_id: teacherId,
                type,
                content,
            }]);

            if (error) throw error;

            await auditService.logAccess(
                teacherId,
                currentUser?.name || 'Teacher',
                'TEACHER',
                'CREATE',
                'remark',
                studentId,
                `Added ${type} remark`
            );

            return { success: true };
        } catch (err: any) {
            console.error('[ACADEMIC] Remark save failed:', err);
            return { success: false, error: err.message || 'Database write failed' };
        }
    },

    /**
     * Get remarks for a student
     */
    getRemarks: async (studentId: string): Promise<RemarkRecord[]> => {
        if (!isPersistenceAvailable()) return [];

        try {
            const { data, error } = await supabase!
                .from('remarks')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as RemarkRecord[] || [];
        } catch (err) {
            console.error('[ACADEMIC] Error fetching remarks:', err);
            return [];
        }
    },

    // ============================================
    // RESOURCES OPERATIONS
    // ============================================

    /**
     * Get resources for a class/subject
     */
    getResources: async (classId: string, subjectId?: string): Promise<{ data: any[]; error?: string }> => {
        if (!isPersistenceAvailable()) return { data: [], error: 'DB Unavailable' };

        try {
            let gradeLevel = '';
            let sectionName = '';

            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classId);

            if (isUUID) {
                const { data: classData } = await supabase!
                    .from('classes')
                    .select('grade_level, section')
                    .eq('id', classId)
                    .single();
                if (classData) {
                    gradeLevel = String(classData.grade_level);
                    sectionName = classData.section;
                }
            } else {
                const [cls, section] = classId.includes('-') ? classId.split('-') : [classId, 'A'];
                gradeLevel = cls;
                sectionName = section;
            }

            let query = supabase!
                .from('academic_files')
                .select('*')
                .eq('class', gradeLevel)
                .eq('section', sectionName);

            if (subjectId) {
                const isSubjectUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subjectId);
                if (isSubjectUUID) {
                    const { data: subjectData } = await supabase!
                        .from('subjects')
                        .select('name')
                        .eq('id', subjectId)
                        .single();
                    if (subjectData) {
                        query = query.eq('subject', subjectData.name);
                    }
                } else {
                    query = query.eq('subject', subjectId);
                }
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            // Map response for frontend compatibility
            const mapped = (data || []).map((file: any) => ({
                ...file,
                subjects: { name: file.subject },
                classes: { grade_level: file.class, section: file.section }
            }));

            return { data: mapped };
        } catch (err: any) {
            return { data: [], error: err.message };
        }
    },

    /**
     * Get Signed URL for download
     */
    getDownloadUrl: async (path: string): Promise<{ url?: string; error?: string }> => {
        try {
            const { data, error } = await supabase!.storage
                .from('academic-files')
                .createSignedUrl(path, 3600); // 1 hour validity

            if (error) throw error;
            return { url: data.signedUrl };
        } catch (err: any) {
            console.error('Download URL generation failed:', err);
            return { error: err.message };
        }
    },

    /**
     * Upload a resource file (Direct Storage + DB)
     */
    uploadResource: async (
        file: File,
        classId: string,  // Can be "6-A" (grade-section) or UUID
        subjectName: string, // Subject name like "Science", "Mathematics"
        actorId: string,
        unit?: string
    ): Promise<{ success: boolean; error?: string }> => {
        if (!isPersistenceAvailable()) return { success: false, error: 'DB Unavailable' };

        try {
            // Determine if classId is already a UUID or needs lookup
            let actualClassId: string;
            let gradeLevel: string;
            let section: string;

            // Check if classId looks like a UUID (36 chars with dashes)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classId);

            if (isUUID) {
                actualClassId = classId;
                // Fetch grade_level and section for the file path
                const { data: classData } = await supabase!
                    .from('classes')
                    .select('grade_level, section')
                    .eq('id', classId)
                    .single();
                gradeLevel = classData?.grade_level || 'unknown';
                section = classData?.section || 'A';
            } else {
                // Parse "6-A" format and look up UUID
                gradeLevel = classId.split('-')[0];
                section = classId.split('-')[1] || 'A';

                const { data: classData, error: lookupError } = await supabase!
                    .from('classes')
                    .select('id')
                    .eq('grade_level', gradeLevel)
                    .eq('section', section)
                    .single();

                if (lookupError || !classData) {
                    throw new Error(`Class not found: ${gradeLevel}-${section}`);
                }
                actualClassId = classData.id;
            }

            // Look up subject_id from subjects table for this class
            let actualSubjectId: string | null = null;

            // Check if subjectName is already a UUID
            const isSubjectUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subjectName);

            if (isSubjectUUID) {
                actualSubjectId = subjectName;
            } else {
                // Look up subject by name for this class
                const { data: subjectData } = await supabase!
                    .from('subjects')
                    .select('id')
                    .eq('class_id', actualClassId)
                    .ilike('name', subjectName)
                    .single();

                if (subjectData) {
                    actualSubjectId = subjectData.id;
                } else {
                    // Subject not found - try to create it or use a default
                    // For now, create the subject if it doesn't exist
                    const { data: newSubject, error: createErr } = await supabase!
                        .from('subjects')
                        .insert([{
                            class_id: actualClassId,
                            name: subjectName,
                            code: subjectName.substring(0, 3).toUpperCase()
                        }])
                        .select('id')
                        .single();

                    if (createErr) {
                        console.error('Failed to create subject:', createErr);
                        throw new Error(`Subject "${subjectName}" not found for this class`);
                    }
                    actualSubjectId = newSubject.id;
                }
            }

            const filePath = `resources/${gradeLevel}-${section}/${subjectName}/${Date.now()}_${file.name}`;

            // Upload to Storage
            const { error: uploadError } = await supabase!.storage
                .from('academic-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Record in academic_files table (using class, section, subject text columns)
            const payload: any = {
                name: file.name,
                storage_path: filePath,
                mime_type: file.type,
                size_bytes: file.size,
                class: String(gradeLevel),
                section: section,
                subject: subjectName,
                uploaded_by: actorId
            };

            if (unit !== undefined && unit.trim() !== '') {
                payload.unit = unit.trim();
            }

            const { error: dbError } = await supabase!
                .from('academic_files')
                .insert([payload]);

            if (dbError) {
                // Code 42703 = column does not exist in postgres (unit column missing)
                if (dbError.code === '42703') {
                    console.warn('[ACADEMIC] unit column missing in academic_files table. Retrying upload without unit...');
                    const { unit: _, ...fallbackPayload } = payload;
                    const { error: retryError } = await supabase!
                        .from('academic_files')
                        .insert([fallbackPayload]);
                    
                    if (retryError) throw retryError;
                } else {
                    throw dbError;
                }
            }

            await auditService.logAccess(
                actorId, 'Teacher', 'TEACHER', 'CREATE', 'academic_file',
                file.name, `Uploaded resource: ${file.name}${unit ? ` for unit: ${unit}` : ''}`
            );

            return { success: true };
        } catch (err: any) {
            console.error('Upload Failed:', err);
            return { success: false, error: err.message };
        }
    },

    // ════════════════════════════════════════════════════════════════════
    // ADVANCED ATTENDANCE INTELLIGENCE METHODS
    // ════════════════════════════════════════════════════════════════════

    getClassAttendanceSummary: async (grade: string, section: string): Promise<any[]> => {
        if (!isPersistenceAvailable()) return [];
        try {
            // Get all active students in this class/section
            const { data: students, error: stdError } = await supabase!
                .from('students')
                .select('id, name, roll_no, admission_number')
                .eq('class', grade)
                .eq('section', section)
                .neq('status', 'inactive')
                .order('roll_no', { ascending: true });

            if (stdError || !students) return [];

            const studentIds = students.map(s => s.id);
            if (studentIds.length === 0) return [];

            // Get summary percentages/counts
            const { data: summaries, error: sumError } = await supabase!
                .from('attendance_summary')
                .select('*')
                .in('student_id', studentIds);

            const summaryMap = new Map((summaries || []).map(s => [s.student_id, s]));

            return students.map(s => {
                const sum = summaryMap.get(s.id) || {
                    working_days: 0,
                    present_count: 0,
                    absent_count: 0,
                    late_count: 0,
                    half_day_count: 0,
                    medical_leave_count: 0,
                    excused_leave_count: 0,
                    on_duty_count: 0,
                    holiday_count: 0,
                    special_permission_count: 0,
                    transfer_pending_count: 0,
                    attended_periods: 0,
                    attendance_percentage: 100.0
                };
                return {
                    ...s,
                    ...sum,
                    percentage: sum.attendance_percentage
                };
            });
        } catch (err) {
            console.error('[ACADEMIC] getClassAttendanceSummary failed:', err);
            return [];
        }
    },

    getTeacherAttendanceSummary: async (teacherId: string): Promise<any> => {
        if (!isPersistenceAvailable()) return null;
        try {
            // Get all periods for this teacher
            const { data: periods } = await supabase!
                .from('timetable_periods')
                .select('id, subject')
                .eq('teacher_id', teacherId);
                
            const periodIds = (periods || []).map(p => p.id);
            if (periodIds.length === 0) {
                return {
                    totalClassesHandled: 0,
                    totalEntries: 0,
                    averageAttendance: 100.0,
                    subjectStats: []
                };
            }

            // Get all attendance entries marked in these periods
            const { data: logs } = await supabase!
                .from('attendance_periods')
                .select('timetable_period_id, status')
                .in('timetable_period_id', periodIds);

            const totalEntries = logs?.length || 0;
            const working = logs?.filter(r => !['medical_leave', 'excused_leave', 'holiday', 'transfer_pending'].includes(r.status)) || [];
            const present = working.filter(r => ['present', 'late', 'on_duty', 'special_permission'].includes(r.status)).length + 
                            working.filter(r => r.status === 'half_day').length * 0.5;
            
            const averageAttendance = working.length > 0 ? Math.round((present / working.length) * 100) : 100;

            // Group by subject
            const subjectMap: Record<string, { total: number; present: number; name: string }> = {};
            (periods || []).forEach(p => {
                if (!subjectMap[p.subject]) {
                    subjectMap[p.subject] = { total: 0, present: 0, name: p.subject };
                }
            });

            (logs || []).forEach(r => {
                const period = (periods || []).find(p => p.id === r.timetable_period_id);
                if (period) {
                    const sub = period.subject;
                    if (!['medical_leave', 'excused_leave', 'holiday', 'transfer_pending'].includes(r.status)) {
                        subjectMap[sub].total += 1;
                        if (['present', 'late', 'on_duty', 'special_permission'].includes(r.status)) {
                            subjectMap[sub].present += 1;
                        } else if (r.status === 'half_day') {
                            subjectMap[sub].present += 0.5;
                        }
                    }
                }
            });

            const subjectStats = Object.values(subjectMap).map(s => ({
                subject: s.name,
                percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 100
            }));

            return {
                totalClassesHandled: periodIds.length,
                totalEntries,
                averageAttendance,
                subjectStats
            };
        } catch (err) {
            console.error('[ACADEMIC] getTeacherAttendanceSummary failed:', err);
            return null;
        }
    },

    getSchoolAttendanceSummary: async (): Promise<any> => {
        if (!isPersistenceAvailable()) return null;
        try {
            const todayStr = new Date().toISOString().split('T')[0];

            // Total active students
            const { count } = await supabase!
                .from('students')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'inactive');

            // Today's counts
            const { data: todayLogs } = await supabase!
                .from('attendance_periods')
                .select('status')
                .eq('attendance_date', todayStr);

            const presentToday = todayLogs?.filter(r => ['present', 'on_duty', 'special_permission'].includes(r.status)).length || 0;
            const absentToday = todayLogs?.filter(r => r.status === 'absent').length || 0;
            const lateToday = todayLogs?.filter(r => r.status === 'late').length || 0;
            const leaveToday = todayLogs?.filter(r => ['medical_leave', 'excused_leave'].includes(r.status)).length || 0;
            const halfDayToday = todayLogs?.filter(r => r.status === 'half_day').length || 0;

            const workingToday = presentToday + absentToday + lateToday + halfDayToday;
            const presentTodayWeighted = presentToday + lateToday + halfDayToday * 0.5;
            const rateToday = workingToday > 0 ? Math.round((presentTodayWeighted / workingToday) * 100) : 100;

            // Trend logs
            const { data: allLogs } = await supabase!
                .from('attendance_periods')
                .select('status, attendance_date')
                .order('attendance_date', { ascending: true });

            const dateTrends: Record<string, { date: string; present: number; total: number }> = {};
            (allLogs || []).forEach(r => {
                if (!dateTrends[r.attendance_date]) {
                    dateTrends[r.attendance_date] = { date: r.attendance_date, present: 0, total: 0 };
                }
                if (!['medical_leave', 'excused_leave', 'holiday', 'transfer_pending'].includes(r.status)) {
                    dateTrends[r.attendance_date].total += 1;
                    if (['present', 'late', 'on_duty', 'special_permission'].includes(r.status)) {
                        dateTrends[r.attendance_date].present += 1;
                    } else if (r.status === 'half_day') {
                        dateTrends[r.attendance_date].present += 0.5;
                    }
                }
            });

            const dailyTrends = Object.values(dateTrends).map(t => ({
                date: t.date,
                percentage: t.total > 0 ? Math.round((t.present / t.total) * 100) : 100
            }));

            return {
                totalStudents: count || 0,
                presentToday: presentToday + halfDayToday,
                absentToday,
                lateToday,
                leaveToday,
                attendanceRate: rateToday,
                dailyTrends
            };
        } catch (err) {
            console.error('[ACADEMIC] getSchoolAttendanceSummary failed:', err);
            return null;
        }
    },
    
    /**
     * Get subject-wise marks entry list for a specific exam, subject, class and section.
     */
    getSubjectMarks: async (
        examId: string,
        subject: string,
        className: string,
        sectionName: string
    ): Promise<any[]> => {
        if (!isPersistenceAvailable()) return [];

        try {
            // 1. Fetch students in this class/section
            const shortClass = className.replace('Class ', '').split(' - ')[0];
            const { data: students, error: studentError } = await supabase!
                .from('students')
                .select('id, name, roll_no')
                .eq('class', shortClass)
                .eq('section', sectionName)
                .order('roll_no', { ascending: true });

            if (studentError) throw studentError;
            if (!students || students.length === 0) return [];

            // 2. Fetch existing marks for this combo
            const { data: existingMarks, error: marksError } = await supabase!
                .from('marks')
                .select('*')
                .eq('exam_type', examId)
                .eq('subject', subject)
                .eq('class', shortClass)
                .eq('section', sectionName);

            if (marksError) throw marksError;

            // Map existing marks by student_id
            const marksMap: Record<string, any> = {};
            if (existingMarks) {
                existingMarks.forEach(m => {
                    marksMap[m.student_id] = m;
                });
            }

            // Merge students with marks
            return students.map(s => {
                const m = marksMap[s.id];
                return {
                    student_id: s.id,
                    student_name: s.name,
                    roll_no: s.roll_no,
                    marks_id: m?.id || null,
                    marks: m?.marks !== undefined && m?.marks !== null ? m.marks : '',
                    max_marks: m?.max_marks || 100,
                    pass_mark: m?.pass_mark || 35,
                    status: m?.status || 'Present',
                    remarks: m?.remarks || '',
                    grade: m?.grade || '',
                    result_status: m?.result_status || 'Pending Verification'
                };
            });
        } catch (err) {
            console.error('[ACADEMIC] getSubjectMarks failed:', err);
            return [];
        }
    },

    /**
     * Save/Submit subject-wise marks entry list.
     */
    saveSubjectMarks: async (
        examId: string,
        subject: string,
        className: string,
        sectionName: string,
        records: {
            student_id: string;
            marks: number | string;
            max_marks: number;
            pass_mark: number;
            status: string;
            remarks: string;
        }[],
        status: 'draft' | 'submitted',
        teacherId: string
    ): Promise<{ success: boolean; error?: string }> => {
        if (!isPersistenceAvailable()) return { success: false, error: 'DB Unavailable' };

        try {
            const shortClass = className.replace('Class ', '').split(' - ')[0];

            // 1. Prepare data for marks table
            const insertData = records.map(r => {
                const obtained = r.status === 'Present' ? Number(r.marks || 0) : 0;
                const pct = r.max_marks > 0 ? (obtained / r.max_marks) * 100 : 0;
                
                // Calculate grade
                let grade = 'F';
                if (r.status === 'Present') {
                    if (pct >= 90) grade = 'A+';
                    else if (pct >= 75) grade = 'A';
                    else if (pct >= 60) grade = 'B';
                    else if (pct >= 45) grade = 'C';
                    else if (pct >= 35) grade = 'D';
                }

                // Calculate result status
                let resStatus = 'Fail';
                if (r.status !== 'Present') {
                    resStatus = r.status; // Absent, Medical Leave, etc.
                } else if (obtained >= r.pass_mark) {
                    resStatus = 'Pass';
                }

                return {
                    student_id: r.student_id,
                    subject,
                    exam_type: examId,
                    marks: obtained,
                    max_marks: r.max_marks,
                    pass_mark: r.pass_mark,
                    status: r.status,
                    result_status: resStatus,
                    grade,
                    remarks: r.remarks || null,
                    class: shortClass,
                    section: sectionName,
                    approval_status: status,
                    entered_by: teacherId
                };
            });

            // 2. Clear existing entries for this combo to prevent duplicates
            await supabase!
                .from('marks')
                .delete()
                .eq('exam_type', examId)
                .eq('subject', subject)
                .eq('class', shortClass)
                .eq('section', sectionName);

            // 3. Insert new marks
            const { error: insertError } = await supabase!
                .from('marks')
                .insert(insertData);

            if (insertError) throw insertError;

            // 4. Update approvals table
            const { error: approvalError } = await supabase!
                .from('exam_marks_approvals')
                .upsert({
                    exam_id: examId,
                    class: shortClass,
                    section: sectionName,
                    subject,
                    teacher_id: teacherId,
                    status,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'exam_id,class,section,subject' });

            if (approvalError) throw approvalError;

            await auditService.logAccess(
                teacherId, 'Teacher', 'TEACHER', 'CREATE', 'marks',
                examId, `Saved marks as ${status} for ${records.length} students in ${className}-${sectionName} (${subject})`
            );

            return { success: true };
        } catch (err: any) {
            console.error('[ACADEMIC] saveSubjectMarks failed:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Get all marks approvals for the Admin review panel.
     */
    getMarksApprovals: async (): Promise<any[]> => {
        if (!isPersistenceAvailable()) return [];

        try {
            const { data, error } = await supabase!
                .from('exam_marks_approvals')
                .select(`
                    *,
                    exams(title),
                    users:teacher_id(name)
                `)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('[ACADEMIC] getMarksApprovals failed:', err);
            return [];
        }
    },

    /**
     * Approve or Reject marks submissions.
     */
    approveRejectMarks: async (
        approvalId: string,
        status: 'approved' | 'rejected',
        rejectionReason: string | null,
        releaseAt: string | null
    ): Promise<{ success: boolean; error?: string }> => {
        if (!isPersistenceAvailable()) return { success: false, error: 'DB Unavailable' };

        try {
            // 1. Fetch details of the approval entry
            const { data: approval, error: fetchError } = await supabase!
                .from('exam_marks_approvals')
                .select('*')
                .eq('id', approvalId)
                .single();

            if (fetchError || !approval) throw fetchError || new Error('Approval record not found');

            // 2. Update approvals record
            const { error: updateError } = await supabase!
                .from('exam_marks_approvals')
                .update({
                    status,
                    rejection_reason: rejectionReason,
                    release_at: releaseAt,
                    updated_at: new Date().toISOString()
                })
                .eq('id', approvalId);

            if (updateError) throw updateError;

            // 3. Update marks table records
            const { error: marksError } = await supabase!
                .from('marks')
                .update({
                    approval_status: status,
                    release_at: releaseAt
                })
                .eq('exam_type', approval.exam_id)
                .eq('subject', approval.subject)
                .eq('class', approval.class)
                .eq('section', approval.section);

            if (marksError) throw marksError;

            // 4. Run calculations if approved
            if (status === 'approved') {
                const { error: rankError } = await supabase!.rpc('calculate_exam_rankings', { p_exam_id: approval.exam_id });
                if (rankError) console.error('Failed to run rankings calculation:', rankError);

                // Send portal notification to students
                await notificationService.broadcast(
                    'student',
                    `Results Published: ${approval.subject}`,
                    `Results for ${approval.subject} in your class have been approved and published.`,
                    { category: 'academic', priority: 'high' }
                );
            }

            return { success: true };
        } catch (err: any) {
            console.error('[ACADEMIC] approveRejectMarks failed:', err);
            return { success: false, error: err.message };
        }
    },

    // Compatibility Wrappers (Optional, if old code calls get/save directly)
    // ...
};

export default academicService;

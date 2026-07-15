import { supabase, isAnalyticsEnabled } from './supabaseClient';
import { auditService } from './auditService';
import { rbacService } from './rbacService';

export interface Timetable {
    id: string;
    class_id: string;
    academic_year: string;
    status: 'draft' | 'published' | 'archived';
    created_at: string;
    created_by?: string;
}

export interface TimetablePeriod {
    id: string;
    timetable_id: string;
    day_of_week: string;
    period_number: number;
    subject_id?: string;
    activity_label?: string; // Manual Entry
    teacher_id?: string;
    start_time: string;
    end_time: string;
    room_number?: string;
    subject?: { name: string; code: string };
    teacher?: { name: string };
}

const isPersistenceAvailable = (): boolean => {
    return isAnalyticsEnabled && supabase !== null;
};

export const timetableService = {
    /**
     * Get Timetable for a Class
     */
    async getTimetableByClass(classId: string): Promise<{ data: Timetable | null; error?: string }> {
        if (!isPersistenceAvailable()) return { data: null, error: 'DB Unavailable' };

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

            const { data, error } = await supabase!
                .from('timetables')
                .select('*')
                .eq('class', gradeLevel)
                .eq('section', sectionName)
                .single();

            if (error && error.code !== 'PGRST116') { // Ignore "Row not found"
                throw error;
            }

            const mapped = data ? {
                ...data,
                class_id: classId
            } : null;

            return { data: mapped as Timetable | null };
        } catch (err: any) {
            return { data: null, error: err.message };
        }
    },

    /**
     * Create or Get Draft Timetable for Class
     */
    async createTimetable(
        classId: string,
        actorId: string
    ): Promise<{ data: Timetable | null; error?: string }> {
        try {
            // RBAC check (optional - don't block if not configured)
            try {
                rbacService.enforce('school:timetables', 'create');
            } catch (rbacErr) {
                console.warn('[TimetableService] RBAC check skipped:', rbacErr);
            }

            // Check existing
            const existing = await timetableService.getTimetableByClass(classId);
            if (existing.data) return existing;

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

            const { data, error } = await supabase!
                .from('timetables')
                .insert([{
                    class: gradeLevel,
                    section: sectionName,
                    status: 'draft',
                    created_by: actorId
                }])
                .select()
                .single();

            if (error) throw error;

            await auditService.log({
                actor_id: actorId,
                actor_name: 'Admin',
                actor_role: 'admin',
                action: 'CREATE',
                entity: 'timetable',
                entity_id: data.id,
                severity: 'info',
                details: `Created draft timetable for class ${classId}`
            });

            const mapped = data ? {
                ...data,
                class_id: classId
            } : null;

            return { data: mapped as Timetable | null };
        } catch (err: any) {
            return { data: null, error: err.message };
        }
    },

    /**
     * Get Periods for a Timetable
     */
    async getPeriods(timetableId: string): Promise<{ data: TimetablePeriod[]; error?: string }> {
        try {
            const { data, error } = await supabase!
                .from('timetable_periods')
                .select(`
                    *,
                    teacher:teachers(name)
                `)
                .eq('timetable_id', timetableId)
                .order('day_of_week') // Need custom sort for days usually, but this groups them
                .order('period_number');

            if (error) throw error;

            // Map subject text column for frontend compatibility
            const mapped = (data || []).map((p: any) => ({
                ...p,
                subject: p.subject ? { name: p.subject, code: p.subject.substring(0, 4).toUpperCase() } : null
            }));

            return { data: mapped as any[] };
        } catch (err: any) {
            return { data: [], error: err.message };
        }
    },

    /**
     * UPSERT a Period Slot (Phase 6 Logic)
     */
    async savePeriod(
        period: {
            timetable_id: string;
            day_of_week: string;
            period_number: number;
            subject_id?: string;
            activity_label?: string;
            teacher_id?: string;
            start_time: string;
            end_time: string;
            room_number?: string;
        },
        actorId: string
    ): Promise<{ success: boolean; error?: string }> {
        // Phase 6 Validation: Exact Mutual Exclusion
        const hasSubject = !!period.subject_id;
        const hasActivity = !!period.activity_label;

        if (hasSubject && hasActivity) {
            return { success: false, error: 'Cannot have both Subject and Activity.' };
        }
        if (!hasSubject && !hasActivity) {
            return { success: false, error: 'Must specify either Subject or Manual Activity.' };
        }
        if (hasSubject && !period.teacher_id) {
            return { success: false, error: 'Teacher is required when Subject is selected.' };
        }

        try {
            // RBAC check (optional - don't block if not configured)
            try {
                rbacService.enforce('school:timetables', 'update');
            } catch (rbacErr) {
                console.warn('[TimetableService] RBAC check skipped:', rbacErr);
            }

            // Determine if using legacy 'subject' column or new logic
            let subjectName = 'Subject';
            if (period.subject_id) {
                const { data: subData } = await supabase!
                    .from('subjects')
                    .select('name')
                    .eq('id', period.subject_id)
                    .single();
                if (subData) {
                    subjectName = subData.name;
                }
            } else if (period.activity_label) {
                subjectName = period.activity_label;
            }

            const upsertData = {
                timetable_id: period.timetable_id,
                day_of_week: period.day_of_week,
                period_number: period.period_number,
                teacher_id: period.teacher_id || null,
                subject: subjectName,
                start_time: period.start_time,
                end_time: period.end_time,
                room_number: period.room_number || null
            };

            const { error } = await supabase!
                .from('timetable_periods')
                .upsert(upsertData, { onConflict: 'timetable_id,day_of_week,period_number' });

            if (error) throw error;

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Publish Timetable
     */
    async publishTimetable(
        timetableId: string,
        actorId: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            rbacService.enforce('school:timetables', 'publish');

            const { error } = await supabase!
                .from('timetables')
                .update({ status: 'published', updated_at: new Date().toISOString() })
                .eq('id', timetableId);

            if (error) throw error;

            await auditService.log({
                actor_id: actorId,
                actor_name: 'Admin',
                actor_role: 'admin',
                action: 'PUBLISH',
                entity: 'timetable',
                entity_id: timetableId,
                severity: 'success',
                details: 'Published timetable'
            });

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }
};

import React, { useState, useEffect } from 'react';
import { schoolService, SchoolClass, Subject } from '../../../services/schoolService';
import { timetableService, Timetable, TimetablePeriod } from '../../../services/timetableService'; // You'll need to create this service next or I will.
import { teacherService, Teacher } from '../../../services/teacherService';
import { Calendar, Save, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { rbacService } from '../../../services/rbacService';
import { notificationService } from '../../../services/notificationService';
import { useTranslation } from 'react-i18next';
import { translateSubject } from '../../../utils/translateSubject';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export const TimetableManagement = () => {
    const { t, i18n } = useTranslation();
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [timetable, setTimetable] = useState<Timetable | null>(null);
    const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);

    // Edit State
    const [editingSlot, setEditingSlot] = useState<{ day: string, period: number } | null>(null);
    const [slotForm, setSlotForm] = useState({
        subjectId: '',
        teacherId: '',
        activityLabel: '',
        entryType: 'subject' as 'subject' | 'activity',
        startTime: '09:00',
        endTime: '10:00'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            loadTimetableData(selectedClass);
        }
    }, [selectedClass]);

    const loadInitialData = async () => {
        const [clsRes, teachRes] = await Promise.all([
            schoolService.getClasses(),
            teacherService.getTeachers(),
            // schoolService.getSubjects() // We might need global subjects or verify logic later
        ]);
        if (clsRes.data) setClasses(clsRes.data);
        if (teachRes.data) setTeachers(teachRes.data);
    };

    const loadTimetableData = async (classId: string) => {
        console.log('[Timetable] loadTimetableData called for classId:', classId);
        setLoading(true);
        try {
            // 1. Get Subjects for this class (with fallback to global subjects)
            const subjRes = await schoolService.getSubjectsByClass(classId);
            console.log('[Timetable] Subjects for class:', subjRes);
            if (subjRes.data && subjRes.data.length > 0) {
                setSubjects(subjRes.data);
            } else {
                // Fallback: Load all global subjects if class-specific not found
                const globalSubjRes = await schoolService.getSubjects();
                console.log('[Timetable] Global subjects fallback:', globalSubjRes);
                if (globalSubjRes.data) setSubjects(globalSubjRes.data);
            }

            // 2. Get or Create Timetable
            const user = rbacService.getCurrentUser();
            console.log('[Timetable] Current user:', user);

            let ttRes = await timetableService.getTimetableByClass(classId);
            console.log('[Timetable] getTimetableByClass result:', ttRes);

            if (!ttRes.data) {
                // Auto-create draft if missing
                console.log('[Timetable] No timetable found, creating new one...');
                const actorId = user?.id || 'admin';
                ttRes = await timetableService.createTimetable(classId, actorId);
                console.log('[Timetable] createTimetable result:', ttRes);

                if (ttRes.error) {
                    console.error('[Timetable] Failed to create timetable:', ttRes.error);
                    alert(t('timetable.failedCreate', 'Failed to create timetable: {{error}}', { error: ttRes.error }));
                }
            }

            if (ttRes.data) {
                console.log('[Timetable] Setting timetable:', ttRes.data);
                setTimetable(ttRes.data);
                const pRes = await timetableService.getPeriods(ttRes.data.id);
                console.log('[Timetable] Periods:', pRes);
                if (pRes.data) setPeriods(pRes.data);
            } else {
                console.error('[Timetable] No timetable data available');
                setTimetable(null);
            }
        } catch (err: any) {
            console.error('[Timetable] loadTimetableData error:', err);
            alert(t('timetable.failedLoad', 'Error loading timetable: {{error}}', { error: err.message }));
        } finally {
            setLoading(false);
        }
    };

    const getPeriod = (day: string, pNum: number) => {
        return periods.find(p => p.day_of_week === day && p.period_number === pNum);
    };

    const handleSlotClick = (day: string, pNum: number) => {
        const existing = getPeriod(day, pNum);
        setEditingSlot({ day, period: pNum });
        if (existing) {
            // Determine type based on data
            const isActivity = !!existing.activity_label;
            setSlotForm({
                subjectId: existing.subject_id || '',
                teacherId: existing.teacher_id || '',
                activityLabel: existing.activity_label || '',
                entryType: isActivity ? 'activity' : 'subject',
                startTime: existing.start_time,
                endTime: existing.end_time
            });
        } else {
            // Default to Subject
            setSlotForm({
                subjectId: '',
                teacherId: '',
                activityLabel: '',
                entryType: 'subject',
                startTime: '09:00',
                endTime: '10:00'
            });
        }
    };

    const saveSlot = async () => {
        console.log('[Timetable] saveSlot called', { timetable, editingSlot, slotForm });

        if (!timetable) {
            alert(t('timetable.noTimetableSelectClass', 'Error: No timetable found. Please select a class first.'));
            return;
        }
        if (!editingSlot) {
            alert(t('timetable.noSlotSelected', 'Error: No slot selected.'));
            return;
        }

        const isSubject = slotForm.entryType === 'subject';
        // Validate
        if (isSubject && (!slotForm.subjectId || !slotForm.teacherId)) {
            alert(t('timetable.selectSubjectAndTeacher', 'Please select both Subject and Teacher.'));
            return;
        }
        if (!isSubject && !slotForm.activityLabel) {
            alert(t('timetable.enterActivityName', 'Please enter an Activity name.'));
            return;
        }

        const user = rbacService.getCurrentUser();
        // Construct payload based on type
        const payload: any = {
            timetable_id: timetable.id,
            day_of_week: editingSlot.day,
            period_number: editingSlot.period,
            start_time: slotForm.startTime,
            end_time: slotForm.endTime,
            subject_id: isSubject ? slotForm.subjectId : null,
            teacher_id: isSubject ? slotForm.teacherId : null,
            activity_label: !isSubject ? slotForm.activityLabel : null
        };

        console.log('[Timetable] Saving period with payload:', payload);

        try {
            const res = await timetableService.savePeriod(payload, user?.id || 'admin');
            console.log('[Timetable] savePeriod response:', res);

            if (!res.success) {
                alert(t('timetable.saveError', 'Save Error: {{error}}', { error: res.error }));
                return;
            }

            setEditingSlot(null);
            loadTimetableData(selectedClass); // Refresh
        } catch (err: any) {
            console.error('[Timetable] Save exception:', err);
            alert(t('timetable.saveException', 'Exception: {{error}}', { error: err.message }));
        }
    };

    const handlePublish = async () => {
        if (!timetable) return;
        if (!window.confirm(t('timetable.confirmPublish', 'Are you sure you want to publish this timetable? Students and Teachers will be able to see it immediately.'))) return;

        const user = rbacService.getCurrentUser();
        const { success, error } = await timetableService.publishTimetable(timetable.id, user?.id || 'admin');

        if (success) {
            // Broadcast to Class Students
            const foundClass = classes.find(c => c.id === selectedClass);
            const className = foundClass ? t('timetable.classWithSection', { grade: foundClass.grade_level, section: foundClass.section }) : '';

            await Promise.all([
                notificationService.broadcast(
                    'student',
                    t('timetable.notificationStudentTitle', 'Timetable Published: {{className}}', { className }),
                    t('timetable.notificationStudentBody', 'The timetable for {{className}} is now live. Check your dashboard for the new schedule.', { className }),
                    { category: 'academic', priority: 'normal' }
                ),
                notificationService.broadcast(
                    'teacher',
                    t('timetable.notificationTeacherTitle', 'Timetable Update: {{className}}', { className }),
                    t('timetable.notificationTeacherBody', 'A new timetable has been published for {{className}}.', { className }),
                    { category: 'academic', priority: 'normal' }
                )
            ]);

            alert(t('timetable.publishSuccess', 'Timetable published and notifications sent!'));
            loadTimetableData(selectedClass);
        } else {
            alert(t('timetable.failedPublish', 'Failed to publish: {{error}}', { error }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">{t('timetable.title')}</h2>
                <div className="flex gap-4">
                    <select
                        className="p-2 border rounded-md min-w-[200px]"
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                    >
                        <option value="">{t('timetable.selectClass')}</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>
                                {t('timetable.classWithSection', { grade: c.grade_level, section: c.section })}
                            </option>
                        ))}
                    </select>
                    {timetable && (
                        <div className={`px-3 py-1 flex items-center rounded-full text-sm font-bold border ${timetable.status === 'published' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                            {t('examManagement.' + timetable.status, { defaultValue: timetable.status }).toUpperCase()}
                        </div>
                    )}
                </div>
            </div>

            {!selectedClass && (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-500">{t('timetable.selectClassToManage')}</h3>
                </div>
            )}

            {selectedClass && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="p-4 w-20">{t('timetable.dayPeriod')}</th>
                                    {PERIODS.map(p => (
                                        <th key={p} className="p-4 text-center border-l border-slate-200">
                                            {t('timetable.periodNumber', { number: p })}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {DAYS.map(day => (
                                    <tr key={day} className="hover:bg-slate-50">
                                        <td className="p-4 font-semibold text-slate-600 border-r border-slate-200">
                                            {t('days.' + day.toLowerCase())}
                                        </td>
                                        {PERIODS.map(p => {
                                            const slot = getPeriod(day, p);
                                            const isEditing = editingSlot?.day === day && editingSlot?.period === p;

                                            if (isEditing) {
                                                return (
                                                    <td key={p} className="p-2 border-l border-slate-200 bg-indigo-50 min-w-[200px] align-top">
                                                        <div className="space-y-2">
                                                            {/* Entry Type Toggle */}
                                                            <div className="flex rounded-md shadow-sm" role="group">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSlotForm(prev => ({ ...prev, entryType: 'subject' }))}
                                                                    className={`px-2 py-1 text-[10px] font-medium border rounded-l-md w-1/2 ${slotForm.entryType === 'subject' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                                                >
                                                                    {t('forms.subject')}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSlotForm(prev => ({ ...prev, entryType: 'activity' }))}
                                                                    className={`px-2 py-1 text-[10px] font-medium border rounded-r-md w-1/2 ${slotForm.entryType === 'activity' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                                                >
                                                                    {t('timetable.manual')}
                                                                </button>
                                                            </div>

                                                            {/* Conditional Inputs */}
                                                            {slotForm.entryType === 'subject' ? (
                                                                <>
                                                                    <select
                                                                        className="w-full text-xs p-1 rounded border"
                                                                        value={slotForm.subjectId}
                                                                        onChange={e => setSlotForm({ ...slotForm, subjectId: e.target.value })}
                                                                        autoFocus
                                                                    >
                                                                        <option value="">{t('timetable.selectSubject')}</option>
                                                                        {subjects.map(s => <option key={s.id} value={s.id}>{translateSubject(s.name, i18n.language)}</option>)}
                                                                    </select>
                                                                    <select
                                                                        className="w-full text-xs p-1 rounded border"
                                                                        value={slotForm.teacherId}
                                                                        onChange={e => setSlotForm({ ...slotForm, teacherId: e.target.value })}
                                                                    >
                                                                        <option value="">{t('timetable.selectTeacher')}</option>
                                                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                                    </select>
                                                                </>
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    className="w-full text-xs p-1 rounded border"
                                                                    placeholder={t('timetable.activityPlaceholder')}
                                                                    value={slotForm.activityLabel}
                                                                    onChange={e => setSlotForm({ ...slotForm, activityLabel: e.target.value })}
                                                                    autoFocus
                                                                />
                                                            )}

                                                            <div className="flex items-center gap-1 mt-2 mb-2">
                                                                <Clock size={12} className="text-slate-400" />
                                                                <input
                                                                    type="time"
                                                                    value={slotForm.startTime}
                                                                    onChange={e => setSlotForm({ ...slotForm, startTime: e.target.value })}
                                                                    className="w-16 text-[10px] p-1 border rounded text-center"
                                                                />
                                                                <span className="text-slate-400 text-[10px]">-</span>
                                                                <input
                                                                    type="time"
                                                                    value={slotForm.endTime}
                                                                    onChange={e => setSlotForm({ ...slotForm, endTime: e.target.value })}
                                                                    className="w-16 text-[10px] p-1 border rounded text-center"
                                                                />
                                                            </div>
                                                            <div className="flex gap-1 justify-end mt-2">
                                                                <button onClick={() => setEditingSlot(null)} className="px-2 py-1 text-xs bg-white border rounded hover:bg-slate-50">{t('common.cancel')}</button>
                                                                <button
                                                                    onClick={saveSlot}
                                                                    className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                                                    disabled={slotForm.entryType === 'subject' ? (!slotForm.subjectId || !slotForm.teacherId) : !slotForm.activityLabel}
                                                                >
                                                                    {t('common.save')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td
                                                    key={p}
                                                    className={`p-2 border-l border-slate-200 cursor-pointer transition-colors ${slot ? 'bg-white hover:bg-indigo-50' : 'bg-slate-50/50 hover:bg-slate-100'}`}
                                                    onClick={() => handleSlotClick(day, p)}
                                                >
                                                    {slot ? (
                                                        <div className="text-center">
                                                            <div className="font-bold text-indigo-700 text-xs truncate max-w-[120px]">
                                                                {slot.activity_label || 
                                                                  (typeof slot.subject === 'object' && slot.subject !== null ? translateSubject(slot.subject.name, i18n.language) : translateSubject(slot.subject, i18n.language)) || 
                                                                  t('forms.subject')}
                                                            </div>
                                                            <div className="text-xs text-slate-500 truncate max-w-[120px]">
                                                                {slot.activity_label ? t('timetable.physicalActivity') : (slot.teacher?.name || t('timetable.teacherFallback'))}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-center gap-1">
                                                                <Clock size={10} /> {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-12 flex items-center justify-center text-slate-300">
                                                            <span className="text-xs">+ {t('common.add')}</span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {timetable?.status === 'draft' && (
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={handlePublish}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
                            >
                                <CheckCircle size={18} /> {t('timetable.publishTimetable')}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

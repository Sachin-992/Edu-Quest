import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { timetableService, Timetable, TimetablePeriod } from '../services/timetableService';
import { Calendar, Clock, MapPin, User, BookOpen, AlertCircle } from 'lucide-react';
import { translateSubject, translateClassName } from '../utils/translateSubject';

interface TimetableDisplayProps {
    classId?: string;
    teacherId?: string;
    className?: string;
}

// Day keys (in DB) matched to i18n keys
const DAY_KEYS = [
    { db: 'Monday',    i18n: 'days.monday' },
    { db: 'Tuesday',   i18n: 'days.tuesday' },
    { db: 'Wednesday', i18n: 'days.wednesday' },
    { db: 'Thursday',  i18n: 'days.thursday' },
    { db: 'Friday',    i18n: 'days.friday' },
    { db: 'Saturday',  i18n: 'days.saturday' },
];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export const TimetableDisplay: React.FC<TimetableDisplayProps> = ({ classId, teacherId, className }) => {
    const { t, i18n } = useTranslation();
    const [timetable, setTimetable] = useState<Timetable | null>(null);
    const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (classId) loadClassTimetable();
    }, [classId, teacherId]);

    const loadClassTimetable = async () => {
        if (!classId) return;
        setLoading(true);
        setError('');
        try {
            const { data, error } = await timetableService.getTimetableByClass(classId);
            if (error) {
                if (error !== 'Row not found') setError(t('timetable.noTimetableAvailable'));
            } else if (data) {
                if (data.status !== 'published') {
                    setError(t('timetable.timetableNotPublished'));
                } else {
                    setTimetable(data);
                    const pRes = await timetableService.getPeriods(data.id);
                    if (pRes.data) setPeriods(pRes.data);
                }
            } else {
                setError(t('timetable.noTimetableAvailable'));
            }
        } catch (err) {
            setError(t('timetable.failedToLoad'));
        } finally {
            setLoading(false);
        }
    };

    const getPeriod = (day: string, pNum: number) =>
        periods.find(p => p.day_of_week === day && p.period_number === pNum);

    if (!classId && !teacherId) return (
        <div className="text-center p-4 text-slate-400">{t('timetable.selectClassFirst')}</div>
    );

    if (loading) return (
        <div className="flex items-center justify-center p-12 text-slate-500">
            <Clock className="animate-spin mr-2" />
            {t('timetable.loadingSchedule')}
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <AlertCircle size={32} className="mb-2 text-slate-300" />
            <p>{error}</p>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center">
                        <Calendar className="mr-2 text-indigo-600" size={20} />
                        {t('timetable.weeklySchedule')}{className ? ` - ${translateClassName(className, i18n.language)}` : ''}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{t('timetable.academicYear')}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                    {t('timetable.published')}
                </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                <table className="text-sm text-left" style={{ minWidth: '900px' }}>
                    <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
                        <tr>
                            <th className="p-4 w-24 border-r border-slate-200 bg-slate-100/50 sticky left-0 z-10">
                                {t('timetable.day')}
                            </th>
                            {PERIODS.map(p => (
                                <th key={p} className="p-4 text-center border-l border-slate-200 min-w-[140px]">
                                    {t('timetable.periodNumber', { number: p })}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {DAY_KEYS.map(({ db, i18n }) => (
                            <tr key={db} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50 sticky left-0 z-10">
                                    {t(i18n)}
                                </td>
                                {PERIODS.map(p => {
                                    const slot = getPeriod(db, p);
                                    return (
                                        <td key={p} className="p-2 border-l border-slate-200">
                                            {slot ? (
                                                <div className="bg-white p-2 rounded border border-slate-100 shadow-sm hover:shadow-md transition-shadow group h-full">
                                                    <div className="font-bold text-indigo-700 text-xs flex items-center mb-1">
                                                        <BookOpen size={12} className="mr-1 opacity-70" />
                                                        {translateSubject(
                                                            slot.activity_label || 
                                                            (typeof slot.subject === 'object' && slot.subject !== null ? slot.subject.name : slot.subject) || 
                                                            '',
                                                            i18n.language
                                                        ) || t('common.subject', 'Subject')}
                                                    </div>
                                                    <div className="text-xs text-slate-600 flex items-center mb-1">
                                                        <User size={12} className="mr-1 opacity-70" />
                                                        {slot.activity_label
                                                            ? t('timetable.physicalActivity')
                                                            : (slot.teacher?.name || t('timetable.teacherFallback'))}
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-50 mt-1">
                                                        <span className="flex items-center bg-slate-100 px-1 rounded">
                                                            <Clock size={10} className="mr-1" />
                                                            {slot.start_time.slice(0, 5)}
                                                        </span>
                                                        {slot.room_number && (
                                                            <span className="flex items-center" title="Room">
                                                                <MapPin size={10} className="mr-1" />
                                                                {slot.room_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-20 flex items-center justify-center text-slate-200 text-xs italic">
                                                    {t('timetable.free')}
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
        </div>
    );
};

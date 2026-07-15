import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BarChart3, TrendingUp, Users, BookOpen, Award, Clock,
    ArrowUp, ArrowDown, Loader2, Calendar, FileText,
    ChevronDown, ChevronUp, GraduationCap, LayoutGrid, Filter,
    RefreshCw, Star, AlertTriangle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, Legend,
    PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { supabase } from '../../../services/supabaseClient';
import { studentService } from '../../../services/studentService';
import { teacherService } from '../../../services/teacherService';
import { academicService } from '../../../services/academicService';
import { translateSubject, translateClassName } from '../../../utils/translateSubject';

// ─── Types ───────────────────────────────────────────────────────
interface MarkRow {
    student_id: string;
    subject: string;
    exam_type: string;
    marks: number;
    max_marks: number;
    created_at: string;
}
interface AttRow {
    status: string;
    attendance_date: string;
    student_id?: string;
}
interface StudentRow {
    id: string;
    name: string;
    class: string;
    section: string;
    created_at: string;
}
interface ExamRow {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    status: string;
}

// ─── Constants ───────────────────────────────────────────────────
const PALETTE = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6',
                 '#06b6d4','#ec4899','#14b8a6','#f97316','#84cc16'];

const GRADE_COLORS: Record<string, string> = {
    'A+': '#10b981', 'A': '#4ade80', 'B': '#4f46e5',
    'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444',
};

// ─── Helpers ─────────────────────────────────────────────────────
/** Safe percentage: (n/d)*100 capped at 100 */
const pct = (n: number, d: number) =>
    d > 0 ? Math.min(Math.round((n / d) * 1000) / 10, 100) : 0;

/** Derive a grade letter from a percentage */
const grade = (p: number) =>
    p >= 90 ? 'A+' : p >= 75 ? 'A' : p >= 60 ? 'B' : p >= 45 ? 'C' : p >= 35 ? 'D' : 'F';

const monthLabel = (d: string) =>
    new Date(d).toLocaleString('en-US', { month: 'short', year: '2-digit' });

const yearLabel = (d: string) =>
    new Date(d).getFullYear().toString();

// ─── Sub-components ───────────────────────────────────────────────
const StatCard: React.FC<{
    icon: React.ReactNode; value: string; label: string;
    sub?: string; gradient: string; trend?: 'up'|'down'|null;
}> = ({ icon, value, label, sub, gradient, trend }) => (
    <div className={`${gradient} rounded-2xl p-6 text-white relative overflow-hidden shadow-lg`}>
        <div className="absolute -right-4 -bottom-4 opacity-10 text-[80px] select-none">{icon}</div>
        <div className="flex items-start justify-between mb-3 relative z-10">
            <div className="p-2 bg-white/20 rounded-xl">{icon}</div>
            {trend === 'up' && <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full font-semibold"><ArrowUp size={12}/>Good</span>}
            {trend === 'down' && <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full font-semibold"><ArrowDown size={12}/>Low</span>}
        </div>
        <p className="text-4xl font-black relative z-10">{value}</p>
        <p className="font-semibold mt-1 opacity-90 relative z-10">{label}</p>
        {sub && <p className="text-xs mt-1 opacity-70 relative z-10">{sub}</p>}
    </div>
);

const SectionHeader: React.FC<{
    icon: React.ReactNode; title: string; badge?: string;
    open: boolean; onToggle: () => void;
}> = ({ icon, title, badge, open, onToggle }) => (
    <div className="flex items-center justify-between cursor-pointer select-none" onClick={onToggle}>
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">{icon}</span>
            {title}
            {badge && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">{badge}</span>}
        </h3>
        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
    </div>
);

const ProgressBar: React.FC<{ value: number; color?: string; height?: string }> = ({
    value, color = '#4f46e5', height = 'h-2.5'
}) => (
    <div className={`w-full bg-slate-100 rounded-full ${height} overflow-hidden`}>
        <div
            className={`${height} rounded-full transition-all duration-700`}
            style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
        />
    </div>
);

const GradeBadge: React.FC<{ value: number }> = ({ value }) => {
    const g = grade(value);
    const color = GRADE_COLORS[g] || '#94a3b8';
    return (
        <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: color }}>
            {g}
        </span>
    );
};

// ─── Main Component ───────────────────────────────────────────────
export const AnalyticsDashboard: React.FC = () => {
    const { t, i18n } = useTranslation();

    // Raw data
    const [isLoading, setIsLoading] = useState(true);
    const [marks, setMarks] = useState<MarkRow[]>([]);
    const [attendance, setAttendance] = useState<AttRow[]>([]);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [exams, setExams] = useState<ExamRow[]>([]);
    const [teacherCount, setTeacherCount] = useState(0);

    // Active tab
    const [tab, setTab] = useState<'overview'|'subject'|'class'|'year'>('overview');

    // Section collapse
    const [open, setOpen] = useState<Record<string, boolean>>({
        subjChart: true, subjTable: true,
        classChart: true, classTable: true,
        yearChart: true, yearTable: true,
        scoreDistribution: true, radarChart: true,
    });
    const toggle = (k: string) => setOpen(p => ({ ...p, [k]: !p[k] }));

    // Filters
    const [filterClass, setFilterClass] = useState('all');
    const [filterSubject, setFilterSubject] = useState('all');
    const [filterYear, setFilterYear] = useState('all');
    const [filterExam, setFilterExam] = useState('all');

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setIsLoading(true);
        try {
            await Promise.all([loadMarks(), loadAttendance(), loadStudents(), loadExams(), loadTeachers()]);
        } catch (e) {
            console.error('Analytics load failed:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMarks = async () => {
        if (!supabase) return;
        const { data } = await supabase.from('marks')
            .select('student_id, subject, exam_type, marks, max_marks, created_at')
            .order('created_at', { ascending: true });
        setMarks((data as MarkRow[]) || []);
    };

    const loadAttendance = async () => {
        if (!supabase) return;
        // correct table: attendance_periods (not period_attendance)
        const { data } = await supabase.from('attendance_periods')
            .select('status, attendance_date, student_id');
        setAttendance((data as AttRow[]) || []);
    };

    const loadStudents = async () => {
        const { data } = await studentService.getStudents();
        setStudents((data as StudentRow[]) || []);
    };

    const loadExams = async () => {
        const data = await academicService.getAllExams();
        setExams(data || []);
    };

    const loadTeachers = async () => {
        const { data } = await teacherService.getTeachers();
        setTeacherCount(data?.length || 0);
    };

    // ── Derived lookups ──────────────────────────────────────────
    const studentMap = useMemo(() => {
        const m: Record<string, StudentRow> = {};
        students.forEach(s => { m[s.id] = s; });
        return m;
    }, [students]);

    const examTitleMap = useMemo(() => {
        const m: Record<string, string> = {};
        exams.forEach(e => { m[e.id] = e.title; });
        return m;
    }, [exams]);

    const allClasses = useMemo(() =>
        Array.from(new Set(students.map(s => s.class).filter(Boolean))).sort(),
    [students]);

    const allSubjects = useMemo(() =>
        Array.from(new Set(marks.map(m => m.subject).filter(Boolean))).sort(),
    [marks]);

    const allYears = useMemo(() =>
        Array.from(new Set(marks.map(m => m.created_at ? yearLabel(m.created_at) : null).filter(Boolean))).sort(),
    [marks]);

    // ── Filtered marks ───────────────────────────────────────────
    const filteredMarks = useMemo(() => {
        return marks.filter(m => {
            const s = studentMap[m.student_id];
            if (filterClass !== 'all' && s?.class !== filterClass) return false;
            if (filterSubject !== 'all' && m.subject !== filterSubject) return false;
            if (filterYear !== 'all' && m.created_at && yearLabel(m.created_at) !== filterYear) return false;
            if (filterExam !== 'all' && m.exam_type !== filterExam) return false;
            return true;
        });
    }, [marks, studentMap, filterClass, filterSubject, filterYear, filterExam]);

    const filteredAtt = useMemo(() => {
        return attendance.filter(a => {
            if (filterClass !== 'all') {
                const s = studentMap[a.student_id || ''];
                if (s?.class !== filterClass) return false;
            }
            if (filterYear !== 'all' && a.attendance_date && yearLabel(a.attendance_date) !== filterYear) return false;
            return true;
        });
    }, [attendance, studentMap, filterClass, filterYear]);

    // ── Overall Stats ────────────────────────────────────────────
    const overallStats = useMemo(() => {
        const totalAtt = filteredAtt.length;
        const present = filteredAtt.filter(a => a.status === 'present' || a.status === 'late').length;
        const attRate = pct(present, totalAtt);

        const totalPct = filteredMarks.reduce((acc, m) => acc + pct(m.marks, m.max_marks), 0);
        const avgMarks = filteredMarks.length > 0
            ? Math.round((totalPct / filteredMarks.length) * 10) / 10 : 0;
        const passing = filteredMarks.filter(m => pct(m.marks, m.max_marks) >= 35).length;
        const passRate = pct(passing, filteredMarks.length);

        return { attRate, avgMarks, passRate };
    }, [filteredAtt, filteredMarks]);

    // ── Subject-wise ─────────────────────────────────────────────
    const subjectData = useMemo(() => {
        const map: Record<string, { total: number; count: number; passing: number; scores: number[] }> = {};
        filteredMarks.forEach(m => {
            const subj = m.subject || 'Unknown';
            if (!map[subj]) map[subj] = { total: 0, count: 0, passing: 0, scores: [] };
            const p = pct(m.marks, m.max_marks);
            map[subj].total += p;
            map[subj].count++;
            if (p >= 35) map[subj].passing++;
            map[subj].scores.push(p);
        });
        return Object.entries(map)
            .map(([subject, v]) => ({
                subject,
                avg: Math.round(v.total / v.count),
                count: v.count,
                passRate: pct(v.passing, v.count),
                highest: Math.round(Math.max(...v.scores)),
                lowest: Math.round(Math.min(...v.scores)),
            }))
            .sort((a, b) => b.avg - a.avg);
    }, [filteredMarks]);

    // ── Class-wise ───────────────────────────────────────────────
    const classData = useMemo(() => {
        const map: Record<string, {
            markTotal: number; markCount: number;
            attPresent: number; attTotal: number;
            passing: number; studentIds: Set<string>;
        }> = {};

        filteredMarks.forEach(m => {
            const cls = studentMap[m.student_id]?.class;
            if (!cls) return;
            if (!map[cls]) map[cls] = { markTotal: 0, markCount: 0, attPresent: 0, attTotal: 0, passing: 0, studentIds: new Set() };
            const p = pct(m.marks, m.max_marks);
            map[cls].markTotal += p;
            map[cls].markCount++;
            if (p >= 35) map[cls].passing++;
            map[cls].studentIds.add(m.student_id);
        });

        filteredAtt.forEach(a => {
            const cls = studentMap[a.student_id || '']?.class;
            if (!cls) return;
            if (!map[cls]) map[cls] = { markTotal: 0, markCount: 0, attPresent: 0, attTotal: 0, passing: 0, studentIds: new Set() };
            map[cls].attTotal++;
            if (a.status === 'present' || a.status === 'late') map[cls].attPresent++;
        });

        // Also include classes that only have attendance
        filteredAtt.forEach(a => {
            const cls = studentMap[a.student_id || '']?.class;
            if (cls && !map[cls]) {
                map[cls] = { markTotal: 0, markCount: 0, attPresent: 0, attTotal: 0, passing: 0, studentIds: new Set() };
            }
        });

        return Object.entries(map)
            .map(([cls, v]) => ({
                class: cls,
                avgMarks: v.markCount > 0 ? Math.round(v.markTotal / v.markCount) : 0,
                attRate: pct(v.attPresent, v.attTotal),
                passRate: pct(v.passing, v.markCount),
                studentCount: v.studentIds.size || students.filter(s => s.class === cls).length,
                markCount: v.markCount,
            }))
            .sort((a, b) => a.class.localeCompare(b.class));
    }, [filteredMarks, filteredAtt, studentMap, students]);

    // ── Year-wise ────────────────────────────────────────────────
    const yearData = useMemo(() => {
        const mMap: Record<string, { total: number; count: number; passing: number }> = {};
        const aMap: Record<string, { present: number; total: number }> = {};

        filteredMarks.forEach(m => {
            if (!m.created_at) return;
            const y = yearLabel(m.created_at);
            if (!mMap[y]) mMap[y] = { total: 0, count: 0, passing: 0 };
            const p = pct(m.marks, m.max_marks);
            mMap[y].total += p;
            mMap[y].count++;
            if (p >= 35) mMap[y].passing++;
        });

        filteredAtt.forEach(a => {
            if (!a.attendance_date) return;
            const y = yearLabel(a.attendance_date);
            if (!aMap[y]) aMap[y] = { present: 0, total: 0 };
            aMap[y].total++;
            if (a.status === 'present' || a.status === 'late') aMap[y].present++;
        });

        const years = new Set([...Object.keys(mMap), ...Object.keys(aMap)]);
        return Array.from(years)
            .map(year => ({
                year,
                avgMarks: mMap[year]?.count > 0
                    ? Math.round(mMap[year].total / mMap[year].count) : 0,
                attRate: pct(aMap[year]?.present || 0, aMap[year]?.total || 0),
                passRate: pct(mMap[year]?.passing || 0, mMap[year]?.count || 0),
                totalEntries: mMap[year]?.count || 0,
            }))
            .sort((a, b) => a.year.localeCompare(b.year));
    }, [filteredMarks, filteredAtt]);

    // ── Month-wise trend (for overview) ──────────────────────────
    const monthlyTrend = useMemo(() => {
        const mMap: Record<string, { mTotal: number; mCount: number; aPresent: number; aTotal: number }> = {};
        filteredMarks.forEach(m => {
            if (!m.created_at) return;
            const mk = monthLabel(m.created_at);
            if (!mMap[mk]) mMap[mk] = { mTotal: 0, mCount: 0, aPresent: 0, aTotal: 0 };
            mMap[mk].mTotal += pct(m.marks, m.max_marks);
            mMap[mk].mCount++;
        });
        filteredAtt.forEach(a => {
            if (!a.attendance_date) return;
            const mk = monthLabel(a.attendance_date);
            if (!mMap[mk]) mMap[mk] = { mTotal: 0, mCount: 0, aPresent: 0, aTotal: 0 };
            mMap[mk].aTotal++;
            if (a.status === 'present' || a.status === 'late') mMap[mk].aPresent++;
        });
        return Object.entries(mMap)
            .map(([month, v]) => ({
                month,
                marks: v.mCount > 0 ? Math.round(v.mTotal / v.mCount) : 0,
                attendance: pct(v.aPresent, v.aTotal),
            }))
            .slice(-8);
    }, [filteredMarks, filteredAtt]);

    // ── Score distribution buckets ───────────────────────────────
    const scoreBuckets = useMemo(() => [
        { label: '90–100%', range: [90, 100], color: '#10b981', count: 0 },
        { label: '75–89%', range: [75, 89], color: '#4f46e5', count: 0 },
        { label: '60–74%', range: [60, 74], color: '#06b6d4', count: 0 },
        { label: '45–59%', range: [45, 59], color: '#f59e0b', count: 0 },
        { label: '35–44%', range: [35, 44], color: '#f97316', count: 0 },
        { label: 'Below 35%', range: [0, 34], color: '#ef4444', count: 0 },
    ].map(b => {
        const c = filteredMarks.filter(m => {
            const p = pct(m.marks, m.max_marks);
            return p >= b.range[0] && p <= b.range[1];
        }).length;
        return { ...b, count: c, pct: pct(c, filteredMarks.length) };
    }), [filteredMarks]);

    // ── Radar data for subject spread ────────────────────────────
    const radarData = useMemo(() =>
        subjectData.slice(0, 7).map(s => ({
            subject: translateSubject(s.subject, 'en').length > 10
                ? translateSubject(s.subject, 'en').slice(0, 9) + '…'
                : translateSubject(s.subject, 'en'),
            avg: s.avg,
        })),
    [subjectData]);

    const hasData = marks.length > 0 || attendance.length > 0;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="text-slate-500 font-medium">{t('analyticsDashboard.loadingAnalytics')}</p>
            </div>
        );
    }

    // ── Tabs ─────────────────────────────────────────────────────
    const tabs = [
        { key: 'overview', label: t('analyticsDashboard.overview'), icon: <LayoutGrid size={15}/> },
        { key: 'subject',  label: t('analyticsDashboard.subjectWise'), icon: <BookOpen size={15}/> },
        { key: 'class',    label: t('analyticsDashboard.classWise'), icon: <GraduationCap size={15}/> },
        { key: 'year',     label: t('analyticsDashboard.yearWise'), icon: <Calendar size={15}/> },
    ] as const;

    return (
        <div className="space-y-5">

            {/* ── Tabs ─────────────────────────────────────────── */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-fit flex-wrap">
                {tabs.map(tb => (
                    <button
                        key={tb.key}
                        onClick={() => setTab(tb.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            tab === tb.key
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {tb.icon}{tb.label}
                    </button>
                ))}
            </div>

            {/* ── Global Filters ────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <Filter size={15} className="text-indigo-500 flex-shrink-0" />
                <span className="text-sm font-bold text-slate-600">{t('analyticsDashboard.filters')}:</span>
                {[
                    { key: 'class',   allLabel: t('analyticsDashboard.allClasses'),   val: filterClass,   set: setFilterClass,   opts: allClasses.map(c => ({ v: c, l: `${t('analyticsDashboard.class')} ${c}` })) },
                    { key: 'subject', allLabel: t('analyticsDashboard.allSubjects'),  val: filterSubject, set: setFilterSubject, opts: allSubjects.map(s => ({ v: s, l: s })) },
                    { key: 'year',    allLabel: t('analyticsDashboard.allYears'),     val: filterYear,    set: setFilterYear,    opts: allYears.map(y => ({ v: y, l: y })) },
                    { key: 'exam',    allLabel: t('analyticsDashboard.allExams'),     val: filterExam,    set: setFilterExam,    opts: exams.map(e => ({ v: e.id, l: e.title })) },
                ].map(f => (
                    <select
                        key={f.key}
                        value={f.val}
                        onChange={e => f.set(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 bg-white text-slate-700 font-medium"
                    >
                        <option value="all">{f.allLabel}</option>
                        {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                ))}
                <button
                    onClick={() => { setFilterClass('all'); setFilterSubject('all'); setFilterYear('all'); setFilterExam('all'); }}
                    className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-all border border-slate-200"
                >
                    <RefreshCw size={13}/> {t('analyticsDashboard.reset')}
                </button>
            </div>

            {/* ── Stat Cards ────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Users size={22}/>}
                    value={`${overallStats.attRate}%`}
                    label={t('analyticsDashboard.studentAttendance')}
                    sub={`${filteredAtt.length} ${t('analyticsDashboard.entries')}`}
                    gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                    trend={overallStats.attRate >= 90 ? 'up' : overallStats.attRate > 0 && overallStats.attRate < 75 ? 'down' : null}
                />
                <StatCard
                    icon={<Award size={22}/>}
                    value={`${overallStats.avgMarks}%`}
                    label={t('analyticsDashboard.averageMarks')}
                    sub={`${filteredMarks.length} ${t('analyticsDashboard.entries')}`}
                    gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                    trend={null}
                />
                <StatCard
                    icon={<TrendingUp size={22}/>}
                    value={`${overallStats.passRate}%`}
                    label="Pass Rate"
                    sub="≥35% threshold"
                    gradient="bg-gradient-to-br from-purple-500 to-pink-600"
                    trend={overallStats.passRate >= 80 ? 'up' : overallStats.passRate > 0 && overallStats.passRate < 50 ? 'down' : null}
                />
                <StatCard
                    icon={<Clock size={22}/>}
                    value={`${students.length}`}
                    label="Total Students"
                    sub={`${teacherCount} teachers`}
                    gradient="bg-gradient-to-br from-amber-500 to-orange-500"
                    trend={null}
                />
            </div>

            {/* ── No Data ───────────────────────────────────────── */}
            {!hasData && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-10 text-center">
                    <AlertTriangle size={36} className="text-amber-400 mx-auto mb-3" />
                    <p className="text-amber-800 font-semibold">{t('analyticsDashboard.noAnalyticsData')}</p>
                    <p className="text-amber-600 text-sm mt-1">{t('analyticsDashboard.startRecording')}</p>
                </div>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* ── OVERVIEW TAB ─────────────────────────────────── */}
            {/* ══════════════════════════════════════════════════ */}
            {tab === 'overview' && hasData && (
                <div className="space-y-5">
                    {/* Monthly Trend */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <SectionHeader
                            icon={<TrendingUp size={16}/>}
                            title="Monthly Attendance & Marks Trend"
                            open={open.yearChart}
                            onToggle={() => toggle('yearChart')}
                        />
                        {open.yearChart && (
                            <div className="mt-5">
                                {monthlyTrend.length === 0 ? (
                                    <p className="text-slate-400 text-center py-10">No trend data yet</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <LineChart data={monthlyTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <Tooltip formatter={(v: number) => `${v}%`}
                                                contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                                            <Line type="monotone" dataKey="attendance" name="Attendance %" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            <Line type="monotone" dataKey="marks" name="Avg Marks %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Score Distribution + Radar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Score Buckets */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <SectionHeader
                                icon={<BarChart3 size={16}/>}
                                title="Score Distribution"
                                open={open.scoreDistribution}
                                onToggle={() => toggle('scoreDistribution')}
                            />
                            {open.scoreDistribution && (
                                <div className="mt-4 space-y-3">
                                    {filteredMarks.length === 0 ? (
                                        <p className="text-slate-400 text-center py-6">No marks data</p>
                                    ) : scoreBuckets.map(b => (
                                        <div key={b.label}>
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="font-medium text-slate-700">{b.label}</span>
                                                <span className="font-bold text-slate-800">
                                                    {b.count}
                                                    <span className="text-slate-400 font-normal ml-1 text-xs">({b.pct}%)</span>
                                                </span>
                                            </div>
                                            <ProgressBar value={b.pct} color={b.color} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Radar Chart */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <SectionHeader
                                icon={<Star size={16}/>}
                                title="Subject Performance Radar"
                                open={open.radarChart}
                                onToggle={() => toggle('radarChart')}
                            />
                            {open.radarChart && (
                                <div className="mt-2">
                                    {radarData.length < 2 ? (
                                        <p className="text-slate-400 text-center py-10">Need ≥2 subjects for radar</p>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={210}>
                                            <RadarChart data={radarData}>
                                                <PolarGrid stroke="#e2e8f0" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                                                <Radar name="Avg %" dataKey="avg" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} strokeWidth={2} />
                                                <Tooltip formatter={(v: number) => `${v}%`} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* ── SUBJECT-WISE TAB ──────────────────────────────── */}
            {/* ══════════════════════════════════════════════════ */}
            {tab === 'subject' && (
                <div className="space-y-5">
                    {/* Bar Chart */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <SectionHeader
                            icon={<BookOpen size={16}/>}
                            title="Subject-wise Average Marks"
                            badge={`${subjectData.length} subjects`}
                            open={open.subjChart}
                            onToggle={() => toggle('subjChart')}
                        />
                        {open.subjChart && (
                            <div className="mt-5">
                                {subjectData.length === 0 ? (
                                    <p className="text-slate-400 text-center py-10">No marks data found</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart
                                            data={subjectData.map((s, i) => ({ ...s, fill: PALETTE[i % PALETTE.length] }))}
                                            margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} angle={-35} textAnchor="end" />
                                            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <Tooltip
                                                formatter={(v: number, name: string) => [`${v}%`, name]}
                                                contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '40px' }} />
                                            <Bar dataKey="avg" name="Avg Marks %" radius={[6, 6, 0, 0]}
                                                fill="#4f46e5"
                                                label={{ position: 'top', fontSize: 10, fill: '#64748b', formatter: (v: number) => `${v}%` }}
                                            >
                                                {subjectData.map((_, i) => (
                                                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Subject Detail Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <SectionHeader
                                icon={<FileText size={16}/>}
                                title={t('analyticsDashboard.subjectDetail')}
                                open={open.subjTable}
                                onToggle={() => toggle('subjTable')}
                            />
                        </div>
                        {open.subjTable && (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead className="bg-gradient-to-r from-slate-50 to-indigo-50">
                                        <tr>
                                            {['#','Subject','Entries','Avg Marks','Pass Rate','Highest','Lowest','Grade'].map(h => (
                                                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {subjectData.length === 0 ? (
                                            <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">{t('analyticsDashboard.noMarksData')}</td></tr>
                                        ) : subjectData.map((s, i) => (
                                            <tr key={s.subject} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="px-5 py-4">
                                                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                                        style={{ backgroundColor: PALETTE[i % PALETTE.length] }}>
                                                        {i + 1}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 font-semibold text-slate-800">{translateSubject(s.subject, i18n.language)}</td>
                                                <td className="px-5 py-4 text-slate-600 text-sm">{s.count}</td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <ProgressBar value={s.avg} color={PALETTE[i % PALETTE.length]} height="h-2" />
                                                        <span className="font-bold text-sm text-slate-800 w-10 text-right">{s.avg}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`font-bold text-sm ${s.passRate >= 75 ? 'text-green-600' : s.passRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                        {s.passRate}%
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-green-600 font-bold text-sm">{s.highest}%</td>
                                                <td className="px-5 py-4 text-red-500 font-bold text-sm">{s.lowest}%</td>
                                                <td className="px-5 py-4"><GradeBadge value={s.avg} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* ── CLASS-WISE TAB ────────────────────────────────── */}
            {/* ══════════════════════════════════════════════════ */}
            {tab === 'class' && (
                <div className="space-y-5">
                    {/* Class Chart */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <SectionHeader
                            icon={<GraduationCap size={16}/>}
                            title="Class-wise Attendance & Marks"
                            badge={`${classData.length} classes`}
                            open={open.classChart}
                            onToggle={() => toggle('classChart')}
                        />
                        {open.classChart && (
                            <div className="mt-5">
                                {classData.length === 0 ? (
                                    <p className="text-slate-400 text-center py-10">No class data found</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart
                                            data={classData.map(c => ({ ...c, name: `Cls ${c.class}` }))}
                                            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <Tooltip
                                                formatter={(v: number) => `${v}%`}
                                                contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                                            <Bar dataKey="attRate" name="Attendance %" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="avgMarks" name="Avg Marks %" fill="#10b981" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="passRate" name="Pass Rate %" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Class Cards */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600"><LayoutGrid size={16}/></span>
                                Class Performance Cards
                            </h3>
                        </div>
                        {classData.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                                <GraduationCap size={36} className="text-slate-300 mx-auto mb-3"/>
                                <p className="text-slate-500">No class data available. Ensure students are assigned to classes.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {classData.map((cls, i) => (
                                    <div key={cls.class}
                                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-base">{translateClassName(cls.class, i18n.language)}</h4>
                                                <p className="text-slate-500 text-xs mt-0.5">{cls.studentCount} students</p>
                                            </div>
                                            <GradeBadge value={cls.avgMarks} />
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
                                                    <span>Attendance</span>
                                                    <span className={`font-bold ${cls.attRate >= 90 ? 'text-green-600' : cls.attRate >= 75 ? 'text-amber-600' : cls.attRate > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                        {cls.attRate > 0 ? `${cls.attRate}%` : '–'}
                                                    </span>
                                                </div>
                                                <ProgressBar value={cls.attRate} color="#4f46e5" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
                                                    <span>Avg Marks</span>
                                                    <span className={`font-bold ${cls.avgMarks >= 75 ? 'text-green-600' : cls.avgMarks >= 50 ? 'text-amber-600' : cls.avgMarks > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                        {cls.avgMarks > 0 ? `${cls.avgMarks}%` : '–'}
                                                    </span>
                                                </div>
                                                <ProgressBar value={cls.avgMarks} color="#10b981" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
                                                    <span>Pass Rate</span>
                                                    <span className={`font-bold ${cls.passRate >= 80 ? 'text-green-600' : cls.passRate >= 60 ? 'text-amber-600' : cls.passRate > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                        {cls.passRate > 0 ? `${cls.passRate}%` : '–'}
                                                    </span>
                                                </div>
                                                <ProgressBar value={cls.passRate} color="#8b5cf6" />
                                            </div>
                                        </div>
                                        {cls.markCount === 0 && (
                                            <p className="text-xs text-slate-400 mt-3 text-center">No marks recorded yet</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Class Detail Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <SectionHeader
                                icon={<FileText size={16}/>}
                                title="Class-wise Detailed Table"
                                open={open.classTable}
                                onToggle={() => toggle('classTable')}
                            />
                        </div>
                        {open.classTable && (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[560px]">
                                    <thead className="bg-gradient-to-r from-slate-50 to-indigo-50">
                                        <tr>
                                            {['Class','Students','Marks Entries','Avg Marks','Attendance','Pass Rate','Grade'].map(h => (
                                                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {classData.length === 0 ? (
                                            <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">No class data</td></tr>
                                        ) : classData.map(cls => (
                                            <tr key={cls.class} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="px-5 py-4 font-bold text-slate-800">{translateClassName(cls.class, i18n.language)}</td>
                                                <td className="px-5 py-4 text-slate-600 text-sm">{cls.studentCount}</td>
                                                <td className="px-5 py-4 text-slate-600 text-sm">{cls.markCount}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`font-bold ${cls.avgMarks >= 75 ? 'text-green-600' : cls.avgMarks >= 50 ? 'text-amber-600' : cls.avgMarks > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                        {cls.avgMarks > 0 ? `${cls.avgMarks}%` : '–'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`font-bold ${cls.attRate >= 90 ? 'text-green-600' : cls.attRate >= 75 ? 'text-amber-600' : cls.attRate > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                        {cls.attRate > 0 ? `${cls.attRate}%` : '–'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`font-bold ${cls.passRate >= 75 ? 'text-green-600' : cls.passRate >= 50 ? 'text-amber-600' : cls.passRate > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                        {cls.passRate > 0 ? `${cls.passRate}%` : '–'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {cls.avgMarks > 0 ? <GradeBadge value={cls.avgMarks} /> : <span className="text-slate-400 text-xs">–</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* ── YEAR-WISE TAB ─────────────────────────────────── */}
            {/* ══════════════════════════════════════════════════ */}
            {tab === 'year' && (
                <div className="space-y-5">
                    {/* Year Chart */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <SectionHeader
                            icon={<Calendar size={16}/>}
                            title="Year-wise Academic Performance"
                            badge={`${yearData.length} year${yearData.length !== 1 ? 's' : ''}`}
                            open={open.yearChart}
                            onToggle={() => toggle('yearChart')}
                        />
                        {open.yearChart && (
                            <div className="mt-5">
                                {yearData.length === 0 ? (
                                    <p className="text-slate-400 text-center py-10">No year data available</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={yearData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#64748b' }} />
                                            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <Tooltip
                                                formatter={(v: number) => `${v}%`}
                                                contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                                            <Bar dataKey="avgMarks" name="Avg Marks %" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="attRate" name="Attendance %" fill="#10b981" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="passRate" name="Pass Rate %" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Year Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {yearData.length === 0 ? (
                            <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-10 text-center">
                                <Calendar size={36} className="text-slate-300 mx-auto mb-3"/>
                                <p className="text-slate-500">No yearly data available</p>
                            </div>
                        ) : yearData.map((y, i) => (
                            <div key={y.year}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-indigo-200 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="font-black text-slate-800 text-2xl">{y.year}</h4>
                                        <p className="text-slate-500 text-xs">{y.totalEntries} mark entries</p>
                                    </div>
                                    {y.avgMarks > 0 && <GradeBadge value={y.avgMarks} />}
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Avg Marks', val: y.avgMarks, color: '#4f46e5' },
                                        { label: 'Attendance', val: y.attRate, color: '#10b981' },
                                        { label: 'Pass Rate', val: y.passRate, color: '#f59e0b' },
                                    ].map(stat => (
                                        <div key={stat.label}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-500 font-medium">{stat.label}</span>
                                                <span className="font-bold text-slate-800">
                                                    {stat.val > 0 ? `${stat.val}%` : '–'}
                                                </span>
                                            </div>
                                            <ProgressBar value={stat.val} color={stat.color} />
                                        </div>
                                    ))}
                                </div>
                                {/* Trend indicator */}
                                {i > 0 && y.avgMarks > 0 && yearData[i-1].avgMarks > 0 && (
                                    <div className={`mt-4 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg w-fit ${
                                        y.avgMarks > yearData[i-1].avgMarks
                                            ? 'bg-green-50 text-green-700'
                                            : y.avgMarks < yearData[i-1].avgMarks
                                                ? 'bg-red-50 text-red-700'
                                                : 'bg-slate-50 text-slate-500'
                                    }`}>
                                        {y.avgMarks > yearData[i-1].avgMarks
                                            ? <><ArrowUp size={12}/>+{y.avgMarks - yearData[i-1].avgMarks}% vs {yearData[i-1].year}</>
                                            : y.avgMarks < yearData[i-1].avgMarks
                                                ? <><ArrowDown size={12}/>{y.avgMarks - yearData[i-1].avgMarks}% vs {yearData[i-1].year}</>
                                                : 'Stable'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Year Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <SectionHeader
                                icon={<FileText size={16}/>}
                                title="Year-wise Detailed Table"
                                open={open.yearTable}
                                onToggle={() => toggle('yearTable')}
                            />
                        </div>
                        {open.yearTable && (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-slate-50 to-indigo-50">
                                        <tr>
                                            {['Year','Mark Entries','Avg Marks','Attendance','Pass Rate','Grade','YoY Trend'].map(h => (
                                                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {yearData.length === 0 ? (
                                            <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">No year data</td></tr>
                                        ) : yearData.map((y, i) => (
                                            <tr key={y.year} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="px-5 py-4 font-bold text-slate-800 text-lg">{y.year}</td>
                                                <td className="px-5 py-4 text-slate-600">{y.totalEntries}</td>
                                                <td className="px-5 py-4 font-bold text-indigo-700">{y.avgMarks > 0 ? `${y.avgMarks}%` : '–'}</td>
                                                <td className="px-5 py-4 font-bold text-emerald-700">{y.attRate > 0 ? `${y.attRate}%` : '–'}</td>
                                                <td className="px-5 py-4 font-bold text-amber-700">{y.passRate > 0 ? `${y.passRate}%` : '–'}</td>
                                                <td className="px-5 py-4">{y.avgMarks > 0 ? <GradeBadge value={y.avgMarks}/> : <span className="text-slate-400">–</span>}</td>
                                                <td className="px-5 py-4">
                                                    {i > 0 && y.avgMarks > 0 && yearData[i-1].avgMarks > 0 ? (
                                                        y.avgMarks > yearData[i-1].avgMarks
                                                            ? <span className="flex items-center gap-1 text-green-600 font-semibold text-sm"><ArrowUp size={14}/>+{y.avgMarks - yearData[i-1].avgMarks}%</span>
                                                            : y.avgMarks < yearData[i-1].avgMarks
                                                                ? <span className="flex items-center gap-1 text-red-600 font-semibold text-sm"><ArrowDown size={14}/>{y.avgMarks - yearData[i-1].avgMarks}%</span>
                                                                : <span className="text-slate-400 text-sm">Stable</span>
                                                    ) : <span className="text-slate-400 text-sm">—</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Footer ───────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 text-center">
                <p className="text-sm text-indigo-700 font-medium">
                    {t('analyticsDashboard.lastUpdated')}{' '}
                    {new Date().toLocaleString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN')}
                </p>
            </div>
        </div>
    );
};

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Award, Lock, CheckCircle2, Clock, Calendar, ChevronDown,
    ChevronUp, TrendingUp, TrendingDown, BarChart2, BookOpen,
    AlertCircle, Star, Shield, Download
} from 'lucide-react';
import { academicService } from '../../services/academicService';
import { translateSubject, translateExamTitle } from '../../utils/translateSubject';
import { supabase } from '../../services/supabaseClient';
import { pdfExportService } from '../../services/pdfExportService';

interface MarksGradesPageProps {
    studentId: string;
    studentProfile?: any;
}

// ── Grade helpers ─────────────────────────────────────────────────
const getGrade = (pct: number) => {
    if (pct >= 90) return { grade: 'A+', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' };
    if (pct >= 75) return { grade: 'A',  color: 'text-green-600',   bg: 'bg-green-50 border-green-200',     dot: 'bg-green-500' };
    if (pct >= 60) return { grade: 'B',  color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',       dot: 'bg-blue-500' };
    if (pct >= 45) return { grade: 'C',  color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',     dot: 'bg-amber-500' };
    if (pct >= 35) return { grade: 'D',  color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200',   dot: 'bg-orange-500' };
    return             { grade: 'F',  color: 'text-red-600',     bg: 'bg-red-50 border-red-200',         dot: 'bg-red-500' };
};

const safePct = (marks: number, max: number) =>
    max > 0 ? Math.min(Math.round((marks / max) * 100), 100) : 0;

// ── Bar component ─────────────────────────────────────────────────
const ScoreBar: React.FC<{ value: number; color?: string }> = ({ value, color = '#6366f1' }) => (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
            className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${value}%`, backgroundColor: color }}
        />
    </div>
);

// ── Exam status badge ──────────────────────────────────────────────
const ExamBadge: React.FC<{ status: string; t: any }> = ({ status, t }) => {
    const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
        published:  { label: t('studentPortal.resultsReleased'), cls: 'bg-green-100 text-green-700 border-green-200',  icon: <CheckCircle2 size={12} /> },
        completed:  { label: t('studentPortal.examCompleted'),   cls: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: <CheckCircle2 size={12} /> },
        active:     { label: t('studentPortal.examActive'),      cls: 'bg-amber-100 text-amber-700 border-amber-200',   icon: <Clock size={12} /> },
        draft:      { label: t('studentPortal.examDraft'),       cls: 'bg-slate-100 text-slate-600 border-slate-200',   icon: <Calendar size={12} /> },
    };
    const cfg = map[status] || map.draft;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${cfg.cls}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
};

// ── Main component ────────────────────────────────────────────────
const MarksGradesPage: React.FC<MarksGradesPageProps> = ({ studentId, studentProfile: initialProfile }) => {
    const { t, i18n } = useTranslation();
    const [marks, setMarks] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'exam' | 'month' | 'year'>('all');
    const [expandedExam, setExpandedExam] = useState<string | null>(null);
    const [studentProfile, setStudentProfile] = useState<any>(initialProfile || null);

    useEffect(() => {
        loadData();
    }, [studentId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [marksData, examsData] = await Promise.all([
                academicService.getStudentMarks(studentId),
                academicService.getAllExams(),
            ]);
            setMarks(marksData || []);
            setExams(examsData || []);
            
            if (!studentProfile) {
                const { data } = await supabase!.from('students').select('*').eq('id', studentId).single();
                if (data) {
                    setStudentProfile(data);
                }
            }
        } catch (e) {
            console.error('Failed to load marks:', e);
        } finally {
            setLoading(false);
        }
    };

    // Map examId → exam object
    const examMap = useMemo(() => {
        const m: Record<string, any> = {};
        exams.forEach(e => { m[e.id] = e; });
        return m;
    }, [exams]);

    // Group marks by exam (exam_type stores the exam id)
    const groupedByExam = useMemo(() => {
        const groups: Record<string, any[]> = {};
        marks.forEach(m => {
            const key = m.exam_type || 'unknown';
            if (!groups[key]) groups[key] = [];
            groups[key].push(m);
        });
        return groups;
    }, [marks]);

    // Build exam summaries with release status
    const examSummaries = useMemo(() => {
        return Object.entries(groupedByExam).map(([examId, subjects]) => {
            const exam = examMap[examId];
            const isReleased = exam?.status === 'published' || exam?.status === 'completed';
            const totalMarks = subjects.reduce((s, m) => s + (m.marks || 0), 0);
            const totalMax = subjects.reduce((s, m) => s + (m.max_marks || 0), 0);
            const pct = safePct(totalMarks, totalMax);
            const passed = subjects.filter(m => safePct(m.marks, m.max_marks) >= 35).length;
            const failed = subjects.length - passed;
            const date = exam?.start_date || null;
            return {
                examId,
                exam,
                isReleased,
                subjects,
                totalMarks,
                totalMax,
                pct,
                passed,
                failed,
                date,
                title: exam?.title || 'Examination',
                status: exam?.status || 'draft',
                endDate: exam?.end_date,
            };
        }).sort((a, b) => {
            // Most recent first
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
    }, [groupedByExam, examMap]);

    // Filter by month/year
    const monthLabel = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN', { month: 'long', year: 'numeric' });
    };
    const yearLabel = (dateStr: string) => new Date(dateStr).getFullYear().toString();

    // Overall stats (released only)
    const releasedExams = examSummaries.filter(e => e.isReleased);
    const overallPct = releasedExams.length > 0
        ? Math.round(releasedExams.reduce((s, e) => s + e.pct, 0) / releasedExams.length)
        : 0;
    const totalPassed = releasedExams.reduce((s, e) => s + e.passed, 0);
    const totalFailed = releasedExams.reduce((s, e) => s + e.failed, 0);
    const overallGrade = getGrade(overallPct);

    // Group for month/year view
    const groupedByMonth = useMemo(() => {
        const m: Record<string, typeof examSummaries> = {};
        examSummaries.forEach(e => {
            if (!e.date) return;
            const key = monthLabel(e.date);
            if (!m[key]) m[key] = [];
            m[key].push(e);
        });
        return m;
    }, [examSummaries, i18n.language]);

    const groupedByYear = useMemo(() => {
        const m: Record<string, typeof examSummaries> = {};
        examSummaries.forEach(e => {
            if (!e.date) return;
            const key = yearLabel(e.date);
            if (!m[key]) m[key] = [];
            m[key].push(e);
        });
        return m;
    }, [examSummaries]);

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-sm">{t('common.loading')}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-5 pb-8">
            {/* ── Page Header ───────────────────────────────────── */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -right-4 -bottom-10 w-28 h-28 bg-white/5 rounded-full" />
                <div className="flex items-start justify-between relative z-10">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight mb-1">
                            {t('studentPortal.academicMarksGrades')}
                        </h2>
                        <p className="text-white/70 text-sm">{t('studentPortal.performanceSummary')}</p>
                    </div>
                    <div className="text-right">
                        <div className={`text-5xl font-black ${overallPct > 0 ? 'text-white' : 'text-white/40'}`}>
                            {overallPct > 0 ? `${overallPct}%` : '--'}
                        </div>
                        <p className="text-white/70 text-xs mt-1">{t('studentPortal.overallScore')}</p>
                    </div>
                </div>
                {/* Overall stat row */}
                {releasedExams.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-5 relative z-10">
                        <div className="bg-white/15 rounded-xl p-3 text-center">
                            <p className="text-2xl font-black">{releasedExams.length}</p>
                            <p className="text-white/70 text-xs">{t('studentPortal.examWise')}</p>
                        </div>
                        <div className="bg-white/15 rounded-xl p-3 text-center">
                            <p className="text-2xl font-black text-emerald-300">{totalPassed}</p>
                            <p className="text-white/70 text-xs">{t('studentPortal.passedSubjects')}</p>
                        </div>
                        <div className="bg-white/15 rounded-xl p-3 text-center">
                            <p className="text-2xl font-black text-red-300">{totalFailed}</p>
                            <p className="text-white/70 text-xs">{t('studentPortal.failedSubjects')}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Filter Tabs ──────────────────────────────────── */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-fit">
                {([
                    { key: 'all',   label: t('studentPortal.allResults'), icon: <BarChart2 size={14}/> },
                    { key: 'exam',  label: t('studentPortal.examWise'),  icon: <BookOpen size={14}/> },
                    { key: 'month', label: t('studentPortal.monthWise'), icon: <Calendar size={14}/> },
                    { key: 'year',  label: t('studentPortal.yearWise'),  icon: <TrendingUp size={14}/> },
                ] as const).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                            filter === tab.key
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ── No Data ──────────────────────────────────────── */}
            {examSummaries.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                    <Award className="mx-auto mb-4 text-slate-200" size={56} />
                    <h3 className="font-bold text-slate-700 text-lg mb-2">{t('studentPortal.noResultsYet')}</h3>
                    <p className="text-slate-400 text-sm">{t('studentPortal.noResultsMsg')}</p>
                </div>
            )}

            {/* ── ALL / EXAM view ──────────────────────────────── */}
            {(filter === 'all' || filter === 'exam') && examSummaries.map(summary => (
                <ExamCard
                    key={summary.examId}
                    summary={summary}
                    expanded={expandedExam === summary.examId}
                    onToggle={() => setExpandedExam(expandedExam === summary.examId ? null : summary.examId)}
                    t={t}
                    language={i18n.language}
                    studentProfile={studentProfile}
                />
            ))}

            {/* ── MONTH view ──────────────────────────────────── */}
            {filter === 'month' && Object.entries(groupedByMonth).map(([month, summaries]) => (
                <div key={month} className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-indigo-500" />
                        <h3 className="font-bold text-slate-700">{month}</h3>
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-xs text-slate-400">{t('studentPortal.examsCount', { count: summaries.length })}</span>
                    </div>
                    {summaries.map(summary => (
                        <ExamCard
                            key={summary.examId}
                            summary={summary}
                            expanded={expandedExam === summary.examId}
                            onToggle={() => setExpandedExam(expandedExam === summary.examId ? null : summary.examId)}
                            t={t}
                            language={i18n.language}
                            studentProfile={studentProfile}
                        />
                    ))}
                </div>
            ))}

            {/* ── YEAR view ───────────────────────────────────── */}
            {filter === 'year' && Object.entries(groupedByYear).sort((a, b) => Number(b[0]) - Number(a[0])).map(([year, summaries]) => {
                const yearPct = summaries.filter(s => s.isReleased).length > 0
                    ? Math.round(summaries.filter(s => s.isReleased).reduce((s, e) => s + e.pct, 0) / summaries.filter(s => s.isReleased).length)
                    : 0;
                const yg = getGrade(yearPct);
                return (
                    <div key={year} className="space-y-3">
                        {/* Year summary card */}
                        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-4 text-white flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-xs font-medium mb-1">{t('studentPortal.yearWise')}</p>
                                <h3 className="text-xl font-black">{year}</h3>
                                <p className="text-white/60 text-xs mt-1">{t('studentPortal.examsCount', { count: summaries.length })}</p>
                            </div>
                            {yearPct > 0 ? (
                                <div className="text-right">
                                    <p className={`text-4xl font-black ${yg.color.replace('text-', 'text-')}`} style={{ color: 'white' }}>{yearPct}%</p>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${yg.bg} ${yg.color}`}>{yg.grade}</span>
                                </div>
                            ) : (
                                <Shield className="text-white/30" size={36} />
                            )}
                        </div>
                        {summaries.map(summary => (
                            <ExamCard
                                key={summary.examId}
                                summary={summary}
                                expanded={expandedExam === summary.examId}
                                onToggle={() => setExpandedExam(expandedExam === summary.examId ? null : summary.examId)}
                                t={t}
                                language={i18n.language}
                                studentProfile={studentProfile}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

// ── Exam Card ─────────────────────────────────────────────────────
interface ExamCardProps {
    summary: {
        examId: string; exam: any; isReleased: boolean; subjects: any[];
        totalMarks: number; totalMax: number; pct: number;
        passed: number; failed: number; date: string | null;
        title: string; status: string; endDate?: string;
    };
    expanded: boolean;
    onToggle: () => void;
    t: any;
    language: string;
    studentProfile?: any;
}

const ExamCard: React.FC<ExamCardProps> = ({ summary, expanded, onToggle, t, language, studentProfile }) => {
    const { isReleased, subjects, pct, passed, failed, title, status, date, endDate } = summary;
    const g = getGrade(pct);

    const schoolRank = subjects.find(s => s.school_rank !== null && s.school_rank !== undefined)?.school_rank;
    const classRank = subjects.find(s => s.class_rank !== null && s.class_rank !== undefined)?.class_rank;
    const sectionRank = subjects.find(s => s.section_rank !== null && s.section_rank !== undefined)?.section_rank;

    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const handleDownloadReportCard = (e: React.MouseEvent) => {
        e.stopPropagation();
        pdfExportService.exportReportCard({
            studentName: studentProfile?.name || 'Student',
            studentNameTamil: studentProfile?.name_tamil || '',
            rollNo: studentProfile?.roll_no || '—',
            admissionNo: studentProfile?.admission_number || '—',
            className: studentProfile?.class || '—',
            section: studentProfile?.section || '—',
            academicYear: '2026',
            examTitle: title,
            schoolRank,
            classRank,
            sectionRank,
            subjects: subjects.map(s => ({
                name: s.subject,
                nameTamil: translateSubject(s.subject, 'ta'),
                marks: s.marks,
                maxMarks: s.max_marks,
                grade: s.grade,
                remarks: s.remarks || '—',
                remarksTamil: s.remarks || '—',
                subjectRank: s.subject_rank
            }))
        }, language as 'en' | 'ta' | 'bilingual');
    };

    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
            isReleased ? 'border-slate-200' : 'border-dashed border-slate-300'
        }`}>
            {/* Card header */}
            <button
                onClick={onToggle}
                className="w-full text-left p-5 hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <ExamBadge status={status} t={t} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">{translateExamTitle(title, language)}</h3>
                        {date && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <Calendar size={11} />
                                {formatDate(date)}{endDate && endDate !== date ? ` – ${formatDate(endDate)}` : ''}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                        {isReleased ? (
                            <div className="text-right">
                                <p className={`text-3xl font-black ${g.color}`}>{pct}%</p>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${g.bg} ${g.color}`}>
                                    {g.grade}
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Lock size={20} className="text-slate-400" />
                                </div>
                                <span className="text-xs text-slate-400 text-center w-16 leading-tight">
                                    {t('studentPortal.resultsLocked')}
                                </span>
                            </div>
                        )}
                        <div className="text-slate-400">
                            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                    </div>
                </div>

                {/* Mini summary bar — only when released and collapsed */}
                {isReleased && !expanded && (
                    <div className="mt-3">
                        <ScoreBar value={pct} color={pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'} />
                        <div className="flex justify-between mt-1 text-xs text-slate-400">
                            <span>{subjects.length} {t('studentPortal.totalSubjects')}</span>
                            <span className="text-emerald-600 font-semibold">{passed} ✓</span>
                            {failed > 0 && <span className="text-red-500 font-semibold">{failed} ✗</span>}
                        </div>
                    </div>
                )}
            </button>

            {/* Expanded: subject breakdown */}
            {expanded && (
                <div className="border-t border-slate-100">
                    {!isReleased ? (
                        /* LOCKED State */
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Lock size={28} className="text-slate-400" />
                            </div>
                            <h4 className="font-bold text-slate-600 mb-2">{t('studentPortal.resultsLocked')}</h4>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto">{t('studentPortal.resultsLockedMsg')}</p>
                            <div className="mt-4 inline-flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
                                <AlertCircle size={13} />
                                {t('studentPortal.examActive')}&nbsp;—&nbsp;{t('common.viewOnly')}
                            </div>
                        </div>
                    ) : (
                        /* RELEASED State */
                        <div className="p-5 space-y-4">
                            {/* Summary stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: t('studentPortal.overallScore'), value: `${pct}%`, color: g.color, icon: <Star size={14}/> },
                                    { label: t('studentPortal.totalSubjects'), value: subjects.length, color: 'text-slate-700', icon: <BookOpen size={14}/> },
                                    { label: t('studentPortal.passedSubjects'), value: passed, color: 'text-emerald-600', icon: <CheckCircle2 size={14}/> },
                                    { label: t('studentPortal.failedSubjects'), value: failed, color: failed > 0 ? 'text-red-500' : 'text-slate-400', icon: <AlertCircle size={14}/> },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                                        <div className={`flex justify-center mb-1 ${stat.color}`}>{stat.icon}</div>
                                        <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Rankings Block */}
                            {(schoolRank || classRank || sectionRank) && (
                                <div className="grid grid-cols-3 gap-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-4 shadow-sm">
                                    <div className="text-center border-r border-white/10">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                                            {t('examManagement.schoolRank', 'School Rank')}
                                        </p>
                                        <p className="text-xl font-extrabold text-indigo-300 mt-1">
                                            {schoolRank ? `#${schoolRank}` : '—'}
                                        </p>
                                    </div>
                                    <div className="text-center border-r border-white/10">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                                            {t('examManagement.classRank', 'Class Rank')}
                                        </p>
                                        <p className="text-xl font-extrabold text-green-300 mt-1">
                                            {classRank ? `#${classRank}` : '—'}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                                            {t('examManagement.sectionRank', 'Section Rank')}
                                        </p>
                                        <p className="text-xl font-extrabold text-amber-300 mt-1">
                                            {sectionRank ? `#${sectionRank}` : '—'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Subject breakdown */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                        <BarChart2 size={14} className="text-indigo-500" />
                                        {t('studentPortal.scoreBreakdown')}
                                    </h4>
                                    <button
                                        onClick={handleDownloadReportCard}
                                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors active:scale-95"
                                    >
                                        <Download size={12} />
                                        <span>{t('examManagement.downloadPDF', 'Report Card')}</span>
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {subjects.map((m, i) => {
                                        const sp = safePct(m.marks, m.max_marks);
                                        const sg = getGrade(sp);
                                        return (
                                            <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <span className="font-semibold text-slate-800">
                                                            {translateSubject(m.subject, language)}
                                                        </span>
                                                        <span className={`ml-2 inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full border ${sg.bg} ${sg.color}`}>
                                                            {sg.grade}
                                                        </span>
                                                        {m.subject_rank && (
                                                            <span className="ml-2 text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
                                                                {t('examManagement.subjectRank', 'Subject Rank')}: #{m.subject_rank}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-lg font-black ${sg.color}`}>{sp}%</span>
                                                        <p className="text-xs text-slate-400">{m.marks}/{m.max_marks}</p>
                                                    </div>
                                                </div>
                                                <ScoreBar
                                                    value={sp}
                                                    color={sp >= 75 ? '#10b981' : sp >= 50 ? '#f59e0b' : sp >= 35 ? '#f97316' : '#ef4444'}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>


                            {/* Grade categories legend */}
                            <div className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-xl p-4 border border-slate-100">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                                    {t('studentPortal.scoreBreakdown')} — {t('common.status')}
                                </h4>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {[
                                        { grade: 'A+', range: '≥90%', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: t('studentPortal.gradeA') },
                                        { grade: 'A',  range: '75-89%', color: 'text-green-600',   bg: 'bg-green-50 border-green-200' },
                                        { grade: 'B',  range: '60-74%', color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
                                        { grade: 'C',  range: '45-59%', color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
                                        { grade: 'D',  range: '35-44%', color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200' },
                                        { grade: 'F',  range: '<35%',  color: 'text-red-600',     bg: 'bg-red-50 border-red-200',    label: t('studentPortal.gradeF') },
                                    ].map(g => (
                                        <div key={g.grade} className={`flex flex-col items-center p-2 rounded-lg border text-center ${g.bg}`}>
                                            <span className={`font-black text-base ${g.color}`}>{g.grade}</span>
                                            <span className="text-xs text-slate-400">{g.range}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MarksGradesPage;

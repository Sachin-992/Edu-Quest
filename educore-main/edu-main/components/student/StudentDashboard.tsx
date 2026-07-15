import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Calendar,
    Award,
    FileText,
    Download,
    Clock,
    CheckCircle,
    LogOut,
    TrendingUp,
    Eye,
    Menu,
    X,
    MessageSquare,
    Send,
    Star,
    AlertCircle,
    Archive,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { academicService, Assignment } from '../../services/academicService';
import { schoolService } from '../../services/schoolService';
import { feedbackService, type Feedback, type FeedbackCategory, type FeedbackStatus, type FeedbackSubmission } from '../../services/feedbackService';
import { attendanceService } from '../../services/attendanceService';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import NotificationCenter from '../NotificationCenter';
import ThemeToggle from '../ThemeToggle';
import { TimetableDisplay } from '../TimetableDisplay';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import { CLASSES } from '../ClassSelector';
import { translateSubject, translateClassName } from '../../utils/translateSubject';
import MarksGradesPage from './MarksGradesPage';
import { supabase } from '../../services/supabaseClient';



interface StudentDashboardProps {
    userName: string;
    role: string;
    studentClass?: string; // Now always fetched dynamically
    rollNo?: number; // Now always fetched dynamically
    onLogout: () => void;
}

// Motivational quotes for thought-of-the-day
const DAILY_QUOTES = [
    { 
        en: { quote: "Education is the passport to the future.", author: "Malcolm X" },
        ta: { quote: "கல்வி என்பது எதிர்காலத்திற்கான கடவுச்சீட்டு.", author: "மால்கம் எக்ஸ்" }
    },
    { 
        en: { quote: "Learn deeply. Grow honestly.", author: "EDUCORE-OMEGA" },
        ta: { quote: "ஆழமாகக் கற்றுக்கொள். நேர்மையாக வளர்.", author: "எடுகோர்-ஒமேகா" }
    },
    { 
        en: { quote: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
        ta: { quote: "கற்றலின் சிறந்த அம்சம் அதை உங்களிடமிருந்து யாரும் பறிக்க முடியாது என்பதாகும்.", author: "பி.பி. கிங்" }
    },
    { 
        en: { quote: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
        ta: { quote: "அறிவில் முதலீடு செய்வதே சிறந்த பலனைத் தரும்.", author: "பெஞ்சமின் பிராங்க்ளின்" }
    },
];

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
    userName,
    role,
    onLogout
}) => {
    const { t, i18n } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'marks' | 'homework' | 'downloads' | 'timetable' | 'feedback' | 'eduquest'>('overview');
    
    // Feedback / Doubts state
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackLoaded, setFeedbackLoaded] = useState(false);
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [feedbackForm, setFeedbackForm] = useState<FeedbackSubmission>({
        category: 'academic',
        title: '',
        description: '',
        rating: undefined,
        is_anonymous: false,
        subject_id: '',
        teacher_id: '',
    });
    const [subjectsList, setSubjectsList] = useState<any[]>([]);
    const [classAssignments, setClassAssignments] = useState<any[]>([]);

    const [assignments, setAssignments] = useState<any[]>([]);
    const [marks, setMarks] = useState<any[]>([]);
    const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0, percentage: 0 });
    const [attendanceDetails, setAttendanceDetails] = useState<any[]>([]); // Raw daily records
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null); // Which month is expanded
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [notices, setNotices] = useState<any[]>([]);
    const [downloads, setDownloads] = useState<any[]>([]);
    const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
    // Exams section removed from student portal (admin-only feature)
    const [loading, setLoading] = useState(true);
    const [studentClassId, setStudentClassId] = useState<string | null>(null); // Dynamic Class ID
    const [studentProfile, setStudentProfile] = useState<any>(null); // Dynamic Profile Data
    const [profileError, setProfileError] = useState<string | null>(null); // Error state

    const handleTabClick = async (itemId: string) => {
        if (itemId === 'eduquest') {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            const eduQuestBase = import.meta.env.VITE_EDUQUEST_URL || 
                (window.location.origin.includes('localhost:') || window.location.origin.includes('127.0.0.1:') 
                    ? window.location.origin.replace(/:\d+$/, ':8080') 
                    : `${window.location.origin}/quest`);
            
            if (session) {
                const url = `${eduQuestBase}/login?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`;
                window.open(url, '_blank');
            } else {
                window.open(`${eduQuestBase}/login`, '_blank');
            }
            return;
        }
        setActiveTab(itemId as any);
    };

    const groupedDownloads = React.useMemo(() => {
        const groups: Record<string, Record<string, any[]>> = {};

        downloads.forEach(file => {
            const subjectName = translateSubject(file.subjects?.name || file.subject || 'General', i18n.language);
            const unitName = file.unit ? file.unit.trim() : '';

            if (!groups[subjectName]) {
                groups[subjectName] = {};
            }

            const unitKey = unitName || t('studentPortal.generalNotes', { defaultValue: 'General Notes' });
            if (!groups[subjectName][unitKey]) {
                groups[subjectName][unitKey] = [];
            }

            groups[subjectName][unitKey].push(file);
        });

        return groups;
    }, [downloads, i18n.language, t]);

    const getRiskStyles = (pct: number) => {
        if (pct >= 90) return { text: t('attendanceIntel.risk.safe', { defaultValue: 'On Track' }), color: 'text-green-600 bg-green-50 border-green-200', barColor: 'bg-green-500' };
        if (pct >= 80) return { text: t('attendanceIntel.risk.low', { defaultValue: 'At Risk' }), color: 'text-yellow-600 bg-yellow-50 border-yellow-200', barColor: 'bg-yellow-500' };
        if (pct >= 75) return { text: t('attendanceIntel.risk.medium', { defaultValue: 'Medium Risk' }), color: 'text-orange-600 bg-orange-50 border-orange-200', barColor: 'bg-orange-500' };
        return { text: t('attendanceIntel.risk.critical', { defaultValue: 'Critical Risk' }), color: 'text-red-600 bg-red-50 border-red-200', barColor: 'bg-red-500' };
    };

    const subjectAttendanceStats = React.useMemo(() => {
        const statsMap: Record<string, { subjectId: string; subjectName: string; conducted: number; attended: number; missed: number; percentage: number }> = {};
        
        attendanceDetails.forEach(record => {
            const period = record.timetable_periods;
            const subjectId = period?.subject_id || 'general';
            const subjectName = period?.subjects?.name || period?.subject_id || 'General';
            
            if (!statsMap[subjectId]) {
                statsMap[subjectId] = {
                    subjectId,
                    subjectName,
                    conducted: 0,
                    attended: 0,
                    missed: 0,
                    percentage: 100
                };
            }
            
            const stats = statsMap[subjectId];
            const isWorking = !['medical_leave', 'excused_leave', 'holiday', 'transfer_pending'].includes(record.status);
            
            if (isWorking) {
                stats.conducted += 1;
                const isAttended = ['present', 'on_duty', 'special_permission', 'late'].includes(record.status);
                const isHalfDay = record.status === 'half_day';
                if (isAttended) {
                    stats.attended += 1;
                } else if (isHalfDay) {
                    stats.attended += 0.5;
                } else {
                    stats.missed += 1;
                }
            }
        });
        
        return Object.values(statsMap).map(stats => {
            stats.percentage = stats.conducted > 0 ? Math.round((stats.attended / stats.conducted) * 100) : 100;
            return stats;
        });
    }, [attendanceDetails]);

    const studentMonthlyTrends = React.useMemo(() => {
        const monthlyData: Record<string, { monthKey: string; monthLabel: string; present: number; working: number }> = {};
        
        attendanceDetails.forEach(record => {
            const date = new Date(record.date);
            if (isNaN(date.getTime())) return;
            
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-US', { month: 'short', year: 'numeric' });
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    monthKey,
                    monthLabel,
                    present: 0,
                    working: 0
                };
            }
            
            const month = monthlyData[monthKey];
            const isWorking = !['medical_leave', 'excused_leave', 'holiday', 'transfer_pending'].includes(record.status);
            
            if (isWorking) {
                month.working += 1;
                const isAttended = ['present', 'on_duty', 'special_permission', 'late'].includes(record.status);
                const isHalfDay = record.status === 'half_day';
                if (isAttended) {
                    month.present += 1;
                } else if (isHalfDay) {
                    month.present += 0.5;
                }
            }
        });
        
        return Object.keys(monthlyData)
            .sort()
            .map(key => {
                const item = monthlyData[key];
                const percentage = item.working > 0 ? Math.round((item.present / item.working) * 100) : 100;
                return {
                    month: item.monthLabel,
                    percentage
                };
            });
    }, [attendanceDetails, i18n.language]);

    const aiInsights = React.useMemo(() => {
        const insights: string[] = [];
        const workingDays = attendanceDetails.filter(r => !['medical_leave', 'excused_leave', 'holiday', 'transfer_pending'].includes(r.status)).length;
        const presentC = attendanceDetails.filter(r => r.status === 'present').length;
        const lateC = attendanceDetails.filter(r => r.status === 'late').length;
        const odC = attendanceDetails.filter(r => r.status === 'on_duty').length;
        const spC = attendanceDetails.filter(r => r.status === 'special_permission').length;
        const hdC = attendanceDetails.filter(r => r.status === 'half_day').length;
        const presentDays = presentC + lateC + odC + spC + hdC * 0.5;
        const attendPct = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 100;

        if (attendPct < 75) {
            insights.push(t('attendanceIntel.ai.riskStudent', { studentName: studentProfile?.name || userName, pct: attendPct, defaultValue: `Student ${studentProfile?.name || userName} is at risk due to attendance below ${attendPct}%.` }));
        }
        
        if (studentMonthlyTrends.length >= 2) {
            const currentMonth = studentMonthlyTrends[studentMonthlyTrends.length - 1];
            const prevMonth = studentMonthlyTrends[studentMonthlyTrends.length - 2];
            const diff = prevMonth.percentage - currentMonth.percentage;
            if (diff > 0) {
                insights.push(t('attendanceIntel.ai.dropped', { pct: diff, defaultValue: `Attendance dropped by ${diff}% this month.` }));
            }
        }
        
        if (subjectAttendanceStats.length >= 2) {
            const sortedSubjects = [...subjectAttendanceStats].sort((a, b) => a.percentage - b.percentage);
            const lowestSub = sortedSubjects[0];
            const highestSub = sortedSubjects[sortedSubjects.length - 1];
            if (lowestSub.percentage < highestSub.percentage) {
                insights.push(t('attendanceIntel.ai.lowerSubject', {
                    lower: translateSubject(lowestSub.subjectName, i18n.language),
                    higher: translateSubject(highestSub.subjectName, i18n.language),
                    defaultValue: `${translateSubject(lowestSub.subjectName, i18n.language)} attendance is lower than ${translateSubject(highestSub.subjectName, i18n.language)}.`
                }));
            }
        }
        
        if (insights.length === 0) {
            insights.push(i18n.language?.startsWith('ta')
                ? "உங்கள் வருகைப்பதிவு சிறப்பாக உள்ளது. தொடர்ந்து இதேபோல் பராமரிக்கவும்!"
                : "Your attendance is exemplary. Keep up the consistent effort!");
        }
        
        return insights;
    }, [attendanceDetails, studentMonthlyTrends, subjectAttendanceStats, studentProfile, userName, i18n.language, t]);

    const selectedQuoteObj = DAILY_QUOTES[new Date().getDate() % DAILY_QUOTES.length];
    const dailyQuote = i18n.language?.startsWith('ta') ? selectedQuoteObj.ta : selectedQuoteObj.en;

    // Load feedback / doubts data when tab is selected
    useEffect(() => {
        if (activeTab !== 'feedback') return;

        if (studentClassId && subjectsList.length === 0) {
            schoolService.getSubjectsByClass(studentClassId).then(res => {
                setSubjectsList(res.data || []);
            });
            schoolService.getClassAssignments(studentClassId).then(res => {
                setClassAssignments(res.data || []);
            });
        }

        if (feedbackLoaded) return;
        setFeedbackLoading(true);
        feedbackService.getMyFeedback().then(res => {
            setFeedbackList(res.data);
        }).catch(err => {
            console.error('[Feedback] Load error:', err);
        }).finally(() => {
            setFeedbackLoading(false);
            setFeedbackLoaded(true);
        });
    }, [activeTab, feedbackLoaded, studentClassId]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // In a real app, we need the actual student ID UUID. 
                // For now, let's assume valid auth context or fetch "myself"
                // Ideally academicService should have 'getProfile()' or we assume we query by current auth user.
                // The service methods I added (getAttendanceStats etc.) take studentId.
                // WE NEED A WAY TO GET CURRENT STUDENT ID.
                // Fortunately, `academicService.getStudents` could be used, or `supabase.auth.getUser()`.
                // For this demo, we will use a workaround or fetch 'myself' logic if available.
                // Actually, I added get_my_student_id() in SQL. 
                // Let's add a helper to academicService to resolve 'my' ID or we can just call methods that rely on RLS if they don't explicitly need ID.
                // Wait, getAttendanceStats(studentId) needs ID in WHERE clause.

                // Hack: We will look up the student based on the current user context. 
                // Or better, let's fetch "my student profile" first.
                // I'll assume for now we can get it or we might need to add `getMyProfile` to academicService quickly.

                // Let's try to fetch students list (filtered by self via RLS policy 'students_self_select')
                // This is a clever trick: RLS will only return MY record.
                const { data: students } = await academicService.getStudents();
                const myProfile = students && students.length > 0 ? students[0] : null;

                if (myProfile) {
                    setStudentProfile(myProfile); // Save profile to state
                    setProfileError(null);
                    const studentId = myProfile.id;
                    const legacyClassString = `${myProfile.class}-${myProfile.section}`;

                    // NEW LOGIC: Resolve actual Class UUID from DB
                    let matchingClass: any = null;
                    try {
                        const { data: allClasses } = await schoolService.getClasses();
                        matchingClass = allClasses.find(c =>
                            c.grade_level === myProfile.class &&
                            c.section === myProfile.section
                        );

                        if (matchingClass) {
                            setStudentClassId(matchingClass.id);
                        } else {
                            console.warn(`Class not found for ${legacyClassString}`);
                        }
                    } catch (err) {
                        console.error('Failed to resolve class ID:', err);
                    }

                    // Use string format class_id for homework/assignments (matches teacher's format)
                    const classIdStr = `${myProfile.class}-${myProfile.section}`;
                    const classUuid = matchingClass?.id || null;
                    const [
                        fetchedAssignments,
                        fetchedAttendance,
                        fetchedAttendanceDetails,
                        fetchedMarks,
                        fetchedNotices,
                    ] = await Promise.all([
                        academicService.getStudentHomework(classIdStr), // Use string format like "1-A"
                        academicService.getAttendanceStats(studentId),
                        attendanceService.getMyAttendance(studentId).then(res => res.data || []), // Query period details with subjects
                        academicService.getStudentMarks(studentId),
                        academicService.getNotices(),
                    ]);

                    setAssignments(fetchedAssignments || []);
                    setAttendanceStats(fetchedAttendance);
                    setAttendanceDetails(fetchedAttendanceDetails || []);
                    setMarks(fetchedMarks);
                    setNotices(fetchedNotices);

                    // Fetch Class Resources
                    const { data: resources } = await academicService.getResources(classIdStr);
                    setDownloads(resources);

                } else {
                    setProfileError(t('studentPortal.noStudentProfileFound'));
                }
            } catch (e) {
                console.error("Dashboard Load Error", e);
                setProfileError(t('studentPortal.failedToLoadProfile'));
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="flex min-h-dvh items-center justify-center">{t('studentPortal.loadingStudentPortal')}</div>;

    // Show error if profile couldn't be loaded
    if (profileError) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-slate-50">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">{t('studentPortal.profileError')}</h2>
                    <p className="text-slate-600 mb-6">{profileError}</p>
                    <p className="text-xs text-slate-400 mb-4">Logged in as: {userName}</p>
                    <button
                        onClick={onLogout}
                        className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        {t('studentPortal.signOutTryAgain')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-dvh overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Desktop Sidebar - Always visible on lg+ screens */}
            <aside className="hidden lg:flex w-64 bg-gradient-to-b from-blue-900 to-indigo-900 text-white flex-col shadow-2xl z-30">
                {/* Sidebar Header */}
                <div className="p-6 border-b border-blue-700/50">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <BookOpen size={24} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-lg">{t('dashboard.student')}</span>
                            <p className="text-[10px] text-blue-300 uppercase tracking-widest">EDUCORE-OMEGA</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    <p className="px-6 text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Menu</p>
                    {[
                        { id: 'overview', label: t('dashboard.overview'), icon: <TrendingUp size={20} /> },
                        { id: 'attendance', label: t('studentPortal.myAttendance'), icon: <Calendar size={20} /> },
                        { id: 'timetable', label: t('studentPortal.myTimetable'), icon: <Clock size={20} /> },
                        { id: 'marks', label: t('studentPortal.myMarks'), icon: <Award size={20} /> },
                        { id: 'homework', label: t('studentPortal.assignedHomework'), icon: <FileText size={20} /> },
                        { id: 'downloads', label: t('studentPortal.downloads'), icon: <Download size={20} /> },
                        { id: 'feedback', label: t('studentPortal.myFeedback'), icon: <MessageSquare size={20} /> },
                        { id: 'eduquest', label: 'EduQuest Learning', icon: <Award size={20} /> },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={`w-full flex items-center space-x-3 px-6 py-3 transition-all duration-200 border-l-4 ${activeTab === item.id
                                ? 'bg-blue-600/30 border-blue-400 text-white'
                                : 'border-transparent text-blue-200 hover:bg-blue-700/30 hover:text-white'
                                }`}
                        >
                            <span className={activeTab === item.id ? 'text-blue-300' : ''}>{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-blue-700/50">
                    <div className="flex items-center space-x-3 mb-4 bg-blue-800/30 p-3 rounded-lg">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{studentProfile?.name || userName}</p>
                            <p className="text-[10px] text-blue-300">{studentProfile ? translateClassName(`${studentProfile.class}-${studentProfile.section}`, i18n.language) : '...'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center space-x-2 bg-red-900/30 text-red-300 hover:bg-red-900/50 p-3 rounded-lg transition-colors border border-red-800/30"
                    >
                        <LogOut size={16} />
                        <span className="text-sm font-semibold">{t('common.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Sidebar - Mobile (Slide-out) */}
            <aside className={`fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-blue-900 to-indigo-900 text-white flex flex-col shadow-2xl z-50 transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 text-blue-300 hover:text-white"
                >
                    <X size={24} />
                </button>

                {/* Sidebar Header */}
                <div className="p-6 border-b border-blue-700/50">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <BookOpen size={24} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-lg">{t('dashboard.student')}</span>
                            <p className="text-[10px] text-blue-300 uppercase tracking-widest">EDUCORE-OMEGA</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    <p className="px-6 text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Menu</p>
                    {[
                        { id: 'overview', label: t('dashboard.overview'), icon: <TrendingUp size={20} /> },
                        { id: 'attendance', label: t('studentPortal.myAttendance'), icon: <Calendar size={20} /> },
                        { id: 'timetable', label: t('studentPortal.myTimetable'), icon: <Clock size={20} /> },
                        { id: 'marks', label: t('studentPortal.myMarks'), icon: <Award size={20} /> },
                        { id: 'homework', label: t('studentPortal.assignedHomework'), icon: <FileText size={20} /> },
                        { id: 'downloads', label: t('studentPortal.downloads'), icon: <Download size={20} /> },
                        { id: 'feedback', label: t('studentPortal.myFeedback'), icon: <MessageSquare size={20} /> },
                        { id: 'eduquest', label: 'EduQuest Learning', icon: <Award size={20} /> },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => { handleTabClick(item.id); setSidebarOpen(false); }}
                            className={`w-full flex items-center space-x-3 px-6 py-3 transition-all duration-200 border-l-4 ${activeTab === item.id
                                ? 'bg-blue-600/30 border-blue-400 text-white'
                                : 'border-transparent text-blue-200 hover:bg-blue-700/30 hover:text-white'
                                }`}
                        >
                            <span className={activeTab === item.id ? 'text-blue-300' : ''}>{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-blue-700/50">
                    <div className="flex items-center space-x-3 mb-4 bg-blue-800/30 p-3 rounded-lg">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{studentProfile?.name || userName}</p>
                            <p className="text-[10px] text-blue-300">{studentProfile ? translateClassName(`${studentProfile.class}-${studentProfile.section}`, i18n.language) : '...'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center space-x-2 bg-red-900/30 text-red-300 hover:bg-red-900/50 p-3 rounded-lg transition-colors border border-red-800/30"
                    >
                        <LogOut size={16} />
                        <span className="text-sm font-semibold">{t('common.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-blue-100 px-4 py-3 flex items-center justify-between shadow-sm z-20">
                    <div className="flex items-center space-x-3">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                <BookOpen className="text-white" size={20} />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg text-slate-800 leading-tight">{t('dashboard.student')}</h1>
                                <p className="text-[10px] text-blue-600 font-medium">EDUCORE-OMEGA • {t('common.viewOnly', { defaultValue: 'View Only' })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-2 lg:space-x-4">
                        <LanguageSwitcher />
                        <ThemeToggle />
                        <NotificationCenter />
                        <div className="hidden md:block bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase border border-green-100">
                            ● {t('overviewDashboard.online')}
                        </div>
                        <div className="hidden lg:block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                            {new Date().toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        {/* Desktop Only - User Info & Logout */}
                        <div className="hidden lg:flex items-center space-x-3">
                            <div className="text-right">
                                <span className="text-sm font-medium text-slate-700 block">{studentProfile?.name || userName}</span>
                                <span className="text-xs text-slate-400">{t('forms.class')}: {studentProfile ? `${studentProfile.class}-${studentProfile.section}` : '...'}</span>
                            </div>
                            <button onClick={onLogout} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Motivational Banner */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-6 py-4 text-white">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div>
                            <p className="text-sm sm:text-lg font-medium italic">"{dailyQuote.quote}"</p>
                            <p className="text-xs sm:text-sm opacity-80 mt-1">— {dailyQuote.author}</p>
                        </div>
                        <div className="text-right hidden md:block">
                            <p className="text-xs opacity-70">{t('common.thoughtOfTheDay')}</p>
                            <p className="text-sm font-semibold">{new Date().toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <div className="max-w-5xl mx-auto">
                        {/* TAB: OVERVIEW */}
                        {
                            activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Stats Cards - 2 cols on mobile */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 text-xs sm:text-sm">{t('studentPortal.myAttendance')}</span>
                                                <Calendar className="text-green-500 w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">{attendanceStats.percentage}%</p>
                                            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">{attendanceStats.present}/{attendanceStats.total} {t('studentPortal.total', { defaultValue: 'days' })}</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 text-xs sm:text-sm">{t('studentPortal.status')}</span>
                                                <Award className="text-amber-500 w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">{t('studentPortal.open', { defaultValue: 'Active' })}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">{t('studentPortal.academicYear')}</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 text-xs sm:text-sm">{t('studentPortal.pending')}</span>
                                                <Clock className="text-orange-500 w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">{assignments.length}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">{t('studentPortal.assignmentsDue')}</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 text-xs sm:text-sm">{t('studentPortal.downloads')}</span>
                                                <Download className="text-blue-500 w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">{downloads.length}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">{t('studentPortal.filesAvailable')}</p>
                                        </div>
                                    </div>

                                    {/* Quick Subject View */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                                        <h3 className="font-bold text-slate-800 mb-4">{t('studentPortal.recentResults')}</h3>
                                        <div className="space-y-3">
                                            {marks.slice(0, 5).map((mark, idx) => {
                                                const safePct = mark.max_marks > 0
                                                    ? Math.min(Math.round((mark.marks / mark.max_marks) * 100), 100)
                                                    : 0;
                                                const gradeLabel = safePct >= 90 ? 'A+' : safePct >= 75 ? 'A' : safePct >= 60 ? 'B' : safePct >= 45 ? 'C' : safePct >= 35 ? 'D' : 'F';
                                                return (
                                                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                                                        <div>
                                                            <span className="font-medium text-slate-700 block">{translateSubject(mark.subject, i18n.language)}</span>
                                                            <span className="text-xs text-slate-400">{safePct}% {t('studentPortal.score', { defaultValue: 'score' })}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-20 bg-slate-200 rounded-full h-1.5">
                                                                <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${safePct}%` }} />
                                                            </div>
                                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                                                gradeLabel === 'A+' || gradeLabel === 'A' ? 'bg-green-100 text-green-700' :
                                                                gradeLabel === 'B' ? 'bg-blue-100 text-blue-700' :
                                                                gradeLabel === 'C' || gradeLabel === 'D' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>{gradeLabel}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {marks.length === 0 && <p className="text-slate-500 text-sm">{t('studentPortal.noMarksRecorded')}</p>}
                                        </div>
                                    </div>

                                    {/* Upcoming Exams Section REMOVED - exams are managed by admin only */}
                                </div>
                            )
                        }

                        {/* TAB: ATTENDANCE - Advanced Attendance Intelligence */}
                        {
                            activeTab === 'attendance' && (() => {
                                // ── Education-grade calculations from attendanceDetails ──
                                const statusCounts: Record<string, number> = {};
                                const excludeFromWorking = ['medical_leave', 'excused_leave', 'holiday', 'transfer_pending'];
                                attendanceDetails.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
                                const presentC = statusCounts['present'] || 0;
                                const absentC = statusCounts['absent'] || 0;
                                const lateC = statusCounts['late'] || 0;
                                const mlC = statusCounts['medical_leave'] || 0;
                                const odC = statusCounts['on_duty'] || 0;
                                const hdC = statusCounts['half_day'] || 0;
                                const elC = statusCounts['excused_leave'] || 0;
                                const holC = statusCounts['holiday'] || 0;
                                const spC = statusCounts['special_permission'] || 0;
                                const tpC = statusCounts['transfer_pending'] || 0;
                                const leaveTotal = mlC + elC;
                                const workingDays = attendanceDetails.filter(r => !excludeFromWorking.includes(r.status)).length;
                                const presentDays = presentC + lateC + odC + spC + hdC * 0.5;
                                const attendPct = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 100;

                                // ── Status color map ──
                                const statusColorMap: Record<string, string> = {
                                    present: 'bg-green-100 border-green-300 text-green-700',
                                    absent: 'bg-red-100 border-red-300 text-red-700',
                                    late: 'bg-amber-100 border-amber-300 text-amber-700',
                                    medical_leave: 'bg-blue-100 border-blue-300 text-blue-700',
                                    on_duty: 'bg-teal-100 border-teal-300 text-teal-700',
                                    half_day: 'bg-yellow-100 border-yellow-300 text-yellow-700',
                                    excused_leave: 'bg-indigo-100 border-indigo-300 text-indigo-700',
                                    holiday: 'bg-purple-100 border-purple-300 text-purple-700',
                                    special_permission: 'bg-cyan-100 border-cyan-300 text-cyan-700',
                                    transfer_pending: 'bg-gray-100 border-gray-300 text-gray-600',
                                };
                                const statusDotColor: Record<string, string> = {
                                    present: 'bg-green-500', absent: 'bg-red-500', late: 'bg-amber-500',
                                    medical_leave: 'bg-blue-500', on_duty: 'bg-teal-500', half_day: 'bg-yellow-500',
                                    excused_leave: 'bg-indigo-500', holiday: 'bg-purple-500',
                                    special_permission: 'bg-cyan-500', transfer_pending: 'bg-gray-500',
                                };

                                // ── Calendar helpers ──
                                const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                                const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                                const calendarMonthLabel = new Date(calendarYear, calendarMonth).toLocaleDateString(
                                    i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN', { month: 'long', year: 'numeric' }
                                );
                                const dayHeaders = Array.from({ length: 7 }, (_, i) =>
                                    new Date(2026, 0, 4 + i).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN', { weekday: 'short' })
                                );
                                const calendarDateMap: Record<number, any> = {};
                                attendanceDetails.forEach(r => {
                                    const d = new Date(r.date);
                                    if (d.getMonth() === calendarMonth && d.getFullYear() === calendarYear) {
                                        calendarDateMap[d.getDate()] = r;
                                    }
                                });

                                // ── Monthly accordion grouping (upgraded for all 10 statuses) ──
                                const groupedByMonth: { [key: string]: { records: any[]; label: string; counts: Record<string, number> } } = {};
                                attendanceDetails.forEach(record => {
                                    const date = new Date(record.date);
                                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                                    const monthLabel = date.toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN', { month: 'long', year: 'numeric' });
                                    if (!groupedByMonth[monthKey]) {
                                        groupedByMonth[monthKey] = { records: [], label: monthLabel, counts: {} };
                                    }
                                    groupedByMonth[monthKey].records.push(record);
                                    groupedByMonth[monthKey].counts[record.status] = (groupedByMonth[monthKey].counts[record.status] || 0) + 1;
                                });
                                const monthKeys = Object.keys(groupedByMonth).sort().reverse();

                                return (
                                    <div className="space-y-6 animate-fadeIn">
                                        {/* ── 1. KPI Stats Cards ── */}
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
                                                <p className="text-2xl sm:text-3xl font-bold text-green-600">{Math.round(presentDays)}</p>
                                                <p className="text-[11px] text-slate-500 mt-1 font-semibold">{t('attendanceIntel.kpi.presentDays')}</p>
                                            </div>
                                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
                                                <p className="text-2xl sm:text-3xl font-bold text-red-600">{absentC}</p>
                                                <p className="text-[11px] text-slate-500 mt-1 font-semibold">{t('attendanceIntel.kpi.absentDays')}</p>
                                            </div>
                                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
                                                <p className="text-2xl sm:text-3xl font-bold text-amber-600">{lateC}</p>
                                                <p className="text-[11px] text-slate-500 mt-1 font-semibold">{t('attendanceIntel.kpi.lateDays')}</p>
                                            </div>
                                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
                                                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{leaveTotal}</p>
                                                <p className="text-[11px] text-slate-500 mt-1 font-semibold">{t('attendanceIntel.kpi.leaveDays')}</p>
                                            </div>
                                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center col-span-2 sm:col-span-1">
                                                <p className={`text-2xl sm:text-3xl font-bold ${attendPct >= 90 ? 'text-green-600' : attendPct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{attendPct}%</p>
                                                <p className="text-[11px] text-slate-500 mt-1 font-semibold">{t('attendanceIntel.kpi.attendanceRate')}</p>
                                            </div>
                                        </div>

                                        {/* ── 2. Low Attendance Alert & AI Insights ── */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                            {/* Risk Alert Card */}
                                            <div className={`lg:col-span-1 p-5 rounded-xl border flex flex-col justify-between ${
                                                attendPct >= 90 ? 'bg-green-50 border-green-200 text-green-800' :
                                                attendPct >= 80 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                                                attendPct >= 75 ? 'bg-orange-50 border-orange-200 text-orange-800' :
                                                'bg-red-50 border-red-200 text-red-800'
                                            }`}>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <AlertCircle className="w-5 h-5" />
                                                        <span className="font-bold text-sm uppercase tracking-wider">{t('attendanceIntel.kpi.riskLevel')}</span>
                                                    </div>
                                                    <h4 className="text-xl font-bold mt-2">
                                                        {attendPct >= 90 ? t('attendanceIntel.risk.safe') :
                                                         attendPct >= 80 ? t('attendanceIntel.risk.low') :
                                                         attendPct >= 75 ? t('attendanceIntel.risk.medium') :
                                                         t('attendanceIntel.risk.critical')}
                                                    </h4>
                                                    <p className="text-xs mt-1.5 opacity-90">
                                                        {attendPct < 75 ? t('attendanceIntel.risk.warning') : t('attendanceIntel.risk.atRiskList')}
                                                    </p>
                                                </div>
                                                <div className="w-full bg-slate-200/50 rounded-full h-2 mt-4 overflow-hidden">
                                                    <div className={`h-full rounded-full ${
                                                        attendPct >= 90 ? 'bg-green-500' :
                                                        attendPct >= 80 ? 'bg-yellow-500' :
                                                        attendPct >= 75 ? 'bg-orange-500' :
                                                        'bg-red-500'
                                                    }`} style={{ width: `${attendPct}%` }} />
                                                </div>
                                            </div>

                                            {/* AI Insights Card */}
                                            <div className="lg:col-span-2 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-xl p-5 text-white shadow-md border border-slate-800">
                                                <div className="flex items-center space-x-2.5 mb-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg shadow-sm">
                                                        💡
                                                    </div>
                                                    <h3 className="text-sm font-bold uppercase tracking-wider">{t('attendanceIntel.ai.title')}</h3>
                                                </div>
                                                <ul className="space-y-2 text-xs">
                                                    {aiInsights.map((insight, idx) => (
                                                        <li key={idx} className="flex items-start space-x-2">
                                                            <span className="text-amber-400 flex-shrink-0 font-bold">•</span>
                                                            <span className="font-medium opacity-90 leading-relaxed">{insight}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* ── 3. Subject-wise breakdown & Recharts monthly line graph ── */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                            {/* Subject Table */}
                                            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center">
                                                    <BookOpen className="mr-2 text-indigo-600" size={18} />
                                                    {t('attendanceIntel.portal.subjectStats')}
                                                </h3>
                                                {subjectAttendanceStats.length === 0 ? (
                                                    <p className="text-slate-500 text-xs py-8 text-center">{t('studentPortal.noAttendanceRecords')}</p>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                                                                    <th className="py-2">{t('teacherManagement.subject')}</th>
                                                                    <th className="py-2 text-center">{t('attendanceIntel.analytics.conducted')}</th>
                                                                    <th className="py-2 text-center">{t('attendanceIntel.analytics.attended')}</th>
                                                                    <th className="py-2 text-center">{t('attendanceIntel.analytics.missed')}</th>
                                                                    <th className="py-2 text-right">{t('attendanceIntel.kpi.attendanceRate')}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-50 text-xs text-slate-600">
                                                                {subjectAttendanceStats.map((sub, idx) => {
                                                                    const risk = getRiskStyles(sub.percentage);
                                                                    return (
                                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                                            <td className="py-2.5 font-semibold text-slate-700">
                                                                                {translateSubject(sub.subjectName, i18n.language)}
                                                                            </td>
                                                                            <td className="py-2.5 text-center font-medium">{sub.conducted}</td>
                                                                            <td className="py-2.5 text-center font-medium text-green-600">{sub.attended}</td>
                                                                            <td className="py-2.5 text-center font-medium text-red-500">{sub.missed}</td>
                                                                            <td className="py-2.5 text-right">
                                                                                <div className="flex flex-col items-end">
                                                                                    <span className={`font-bold ${risk.color.split(' ')[0]}`}>{sub.percentage}%</span>
                                                                                    <div className="w-16 bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                                                                                        <div className={`h-full rounded-full ${risk.barColor}`} style={{ width: `${sub.percentage}%` }} />
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Trend Line Chart */}
                                            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col">
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center">
                                                    <TrendingUp className="mr-2 text-indigo-600" size={18} />
                                                    {t('attendanceIntel.analytics.trends')}
                                                </h3>
                                                <div className="flex-1 min-h-[200px] flex items-center justify-center">
                                                    {studentMonthlyTrends.length === 0 ? (
                                                        <div className="text-slate-400 text-xs">{t('studentPortal.noAttendanceRecords')}</div>
                                                    ) : (
                                                        <ResponsiveContainer width="100%" height={200}>
                                                            <LineChart data={studentMonthlyTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                                                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                                                <Tooltip
                                                                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                                                                    formatter={(value: any) => [`${value}%`, t('attendanceIntel.kpi.attendanceRate')]}
                                                                />
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="percentage"
                                                                    stroke="#4f46e5"
                                                                    strokeWidth={2.5}
                                                                    activeDot={{ r: 5 }}
                                                                    dot={{ r: 3, strokeWidth: 1.5, fill: '#fff' }}
                                                                />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── 4. Monthly Calendar Grid & Status Legend ── */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                            {/* Calendar Grid */}
                                            <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                                                <div className="flex items-center justify-between mb-4">
                                                    <button onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); } else { setCalendarMonth(m => m - 1); } }} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                                        <ChevronLeft size={16} className="text-slate-600" />
                                                    </button>
                                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{calendarMonthLabel}</h3>
                                                    <button onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); } else { setCalendarMonth(m => m + 1); } }} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                                        <ChevronRight size={16} className="text-slate-600" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-7 gap-1">
                                                    {dayHeaders.map((dh, i) => (
                                                        <div key={i} className="text-center text-[9px] font-bold text-slate-400 uppercase py-1">{dh}</div>
                                                    ))}
                                                    {Array.from({ length: firstDay }, (_, i) => (
                                                        <div key={`empty-${i}`} />
                                                    ))}
                                                    {Array.from({ length: daysInMonth }, (_, i) => {
                                                        const dayNum = i + 1;
                                                        const rec = calendarDateMap[dayNum];
                                                        const cellColor = rec ? (statusColorMap[rec.status] || 'bg-slate-50 border-slate-200 text-slate-500') : 'bg-slate-50/50 border-slate-100 text-slate-400';
                                                        return (
                                                            <div key={dayNum} className={`p-1 rounded-lg border text-center min-h-[48px] flex flex-col justify-center ${cellColor}`}>
                                                                <p className="text-xs font-bold leading-none">{dayNum}</p>
                                                                {rec && <p className="text-[7px] font-semibold mt-1 leading-none truncate">{t('attendanceIntel.status.' + rec.status)}</p>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Status Legend */}
                                            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col justify-center">
                                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">{t('attendanceIntel.portal.monthlyCalendar')}</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {Object.entries(statusDotColor).map(([status, dotColor]) => (
                                                        <div key={status} className="flex items-center gap-2">
                                                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
                                                            <span className="text-[11px] text-slate-600 truncate">{t('attendanceIntel.status.' + status)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── 5. Monthly Accordion ── */}
                                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">{t('studentPortal.monthlyBreakdown')}</h3>
                                            {monthKeys.length === 0 ? (
                                                <div className="text-center text-slate-500 py-8">
                                                    <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
                                                    <p className="text-xs">{t('studentPortal.noAttendanceRecords')}</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2.5">
                                                    {monthKeys.map(monthKey => {
                                                        const month = groupedByMonth[monthKey];
                                                        const mc = month.counts;
                                                        const mWorking = month.records.filter(r => !excludeFromWorking.includes(r.status)).length;
                                                        const mPresent = (mc['present'] || 0) + (mc['late'] || 0) + (mc['on_duty'] || 0) + (mc['special_permission'] || 0) + (mc['half_day'] || 0) * 0.5;
                                                        const mPct = mWorking > 0 ? Math.round((mPresent / mWorking) * 100) : 100;
                                                        const isExpanded = expandedMonth === monthKey;

                                                        return (
                                                            <div key={monthKey} className="border border-slate-150 rounded-xl overflow-hidden shadow-sm">
                                                                <button
                                                                    onClick={() => setExpandedMonth(isExpanded ? null : monthKey)}
                                                                    className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors"
                                                                >
                                                                    <div className="flex items-center space-x-2.5">
                                                                        <Calendar className="text-indigo-600" size={18} />
                                                                        <span className="font-bold text-xs text-slate-700">{month.label}</span>
                                                                    </div>
                                                                    <div className="flex items-center space-x-3">
                                                                        <div className="hidden sm:flex items-center space-x-1.5 text-[10px]">
                                                                            {(mc['present'] || 0) > 0 && <span className="text-green-600 font-bold">{mc['present']}P</span>}
                                                                            {(mc['absent'] || 0) > 0 && <span className="text-red-600 font-bold">{mc['absent']}A</span>}
                                                                            {(mc['late'] || 0) > 0 && <span className="text-amber-600 font-bold">{mc['late']}L</span>}
                                                                            {(mc['medical_leave'] || 0) > 0 && <span className="text-blue-600 font-bold">{mc['medical_leave']}ML</span>}
                                                                            {(mc['on_duty'] || 0) > 0 && <span className="text-teal-600 font-bold">{mc['on_duty']}OD</span>}
                                                                            {(mc['half_day'] || 0) > 0 && <span className="text-yellow-600 font-bold">{mc['half_day']}HD</span>}
                                                                        </div>
                                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${mPct >= 90 ? 'bg-green-100 text-green-700' : mPct >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{mPct}%</span>
                                                                        <span className="text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                                                                    </div>
                                                                </button>
                                                                {isExpanded && (
                                                                    <div className="p-4 bg-white border-t border-slate-150">
                                                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                                                                            {month.records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(record => {
                                                                                const d = new Date(record.date);
                                                                                const dayNum = d.getDate();
                                                                                const dayName = d.toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN', { weekday: 'short' });
                                                                                const cellColor = statusColorMap[record.status] || 'bg-slate-100 border-slate-300 text-slate-600';
                                                                                return (
                                                                                    <div key={record.id} className={`p-2 rounded-lg border text-center ${cellColor}`}>
                                                                                        <p className="text-base font-bold">{dayNum}</p>
                                                                                        <p className="text-[9px] uppercase font-semibold">{dayName}</p>
                                                                                        <p className="text-[8px] font-bold mt-1 truncate">{t('attendanceIntel.status.' + record.status)}</p>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()
                        }

                        {/* TAB: MARKS */}
                        {
                            activeTab === 'marks' && studentProfile && (
                                <MarksGradesPage studentId={studentProfile.id} />
                            )
                        }

                        {/* TAB: HOMEWORK - VIEW ONLY */}
                        {
                            activeTab === 'homework' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                            <FileText className="mr-3 text-blue-600" />
                                            {t('studentPortal.assignedHomework')}
                                        </h2>
                                        <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                                            {t('studentPortal.viewOnlyMode')}
                                        </div>
                                    </div>

                                    {assignments.length > 0 ? assignments.map(assignment => (
                                        <div key={assignment.id} className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-slate-200">
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                <div className="flex-1 w-full">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">
                                                            {translateSubject(assignment.subject_name || assignment.subject_id || 'Subject', i18n.language)}
                                                        </span>
                                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                                                            {assignment.type || 'Homework'}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-800 leading-tight">{assignment.title}</h3>
                                                    <p className="text-slate-600 mt-2 text-sm">{assignment.description}</p>
                                                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                                        <span className="flex items-center"><Clock size={14} className="mr-1" /> {t('studentPortal.due')} {assignment.due_date || assignment.homework_date || 'N/A'}</span>
                                                        <span className="flex items-center"><Award size={14} className="mr-1" /> {t('studentPortal.marksLabel')} {assignment.max_marks || 'N/A'}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => alert(`Opening details for: ${assignment.title}`)}
                                                    className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
                                                >
                                                    <Eye size={18} />
                                                    <span>{t('studentPortal.viewDetails')}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                                            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                                            <h3 className="text-lg font-semibold text-slate-600 mb-2">{t('studentPortal.noAssignmentsYet')}</h3>
                                            <p className="text-slate-500 text-sm">{t('studentPortal.noHomeworkForClass')}</p>
                                        </div>
                                    )}

                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center text-sm text-blue-700">
                                        {t('studentPortal.homeworkSubmissionNote')}
                                    </div>
                                </div>
                            )
                        }

                        {/* TAB: DOWNLOADS */}
                        {
                            activeTab === 'downloads' && (
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4">
                                        <Download className="mr-3 text-blue-600" />
                                        {t('studentPortal.downloadableResources')}
                                    </h2>
                                    <div className="space-y-4 mt-6">
                                        {Object.keys(groupedDownloads).length > 0 ? (
                                            Object.entries(groupedDownloads).map(([subject, units]) => {
                                                const isExpanded = !!expandedSubjects[subject];
                                                const totalFiles = Object.values(units).reduce((acc, files) => acc + files.length, 0);

                                                return (
                                                    <div key={subject} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden transition-all shadow-sm">
                                                        {/* Subject Header Accordion Toggle */}
                                                        <button
                                                            onClick={() => setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] }))}
                                                            className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-lg shadow-sm">
                                                                    📚
                                                                </div>
                                                                <div className="text-left">
                                                                    <h3 className="font-bold text-slate-800 text-base">{subject}</h3>
                                                                    <p className="text-xs text-slate-500">
                                                                        {totalFiles} {totalFiles === 1 ? t('studentPortal.file', { defaultValue: 'file' }) : t('studentPortal.files', { defaultValue: 'files' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-slate-400">
                                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                            </div>
                                                        </button>

                                                        {/* Expanded Units & Files */}
                                                        {isExpanded && (
                                                            <div className="p-4 space-y-5 bg-slate-50/50">
                                                                {Object.entries(units).map(([unit, files]) => (
                                                                    <div key={unit} className="space-y-2.5">
                                                                        {/* Unit Header */}
                                                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center">
                                                                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                                                            {unit}
                                                                        </h4>
                                                                        
                                                                        {/* Files List under Unit */}
                                                                        <div className="space-y-2">
                                                                            {files.map(file => (
                                                                                <div key={file.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all gap-4">
                                                                                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                                                                                        <div className="w-9 h-9 bg-red-50 rounded-lg flex-shrink-0 flex items-center justify-center">
                                                                                            <FileText className="text-red-500" size={18} />
                                                                                        </div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="font-semibold text-slate-700 text-sm truncate">{file.name}</p>
                                                                                            <p className="text-xs text-slate-400">
                                                                                                {(file.size_bytes / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN')}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={async () => {
                                                                                            try {
                                                                                                const { url, error } = await academicService.getDownloadUrl(file.storage_path);
                                                                                                if (url) {
                                                                                                    window.open(url, '_blank');
                                                                                                } else {
                                                                                                    alert(t('studentPortal.failedDownloadLink') + ' ' + error);
                                                                                                }
                                                                                            } catch (err) {
                                                                                                alert(t('studentPortal.downloadError'));
                                                                                            }
                                                                                        }}
                                                                                        className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                                                                    >
                                                                                        <Download size={14} />
                                                                                        <span>{t('studentPortal.download')}</span>
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                                <FileText size={48} className="mx-auto mb-2 opacity-25" />
                                                <p className="text-slate-500">{t('studentPortal.noDownloadsAvailable')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        }

                        {/* TAB: TIMETABLE */}
                        {
                            activeTab === 'timetable' && (
                                <div className="space-y-4">
                                    {/* Note: In real app, we need to map studentClass string "6-A" to actual DB ID. 
                                For demo, we might need a lookup or just rely on the component handling the string if we update it.
                                Actually TimetableDisplay takes classId (UUID). 
                                HACK: For demo, we'll try to find the ID from the CLASSES constant if available, or fetch it.
                                Phase 3 Simplification: We will pause here and assume we need a way to get the class ID.
                                Let's pass the class string name and let the component (or a wrapper) resolve it?
                                No, TimetableDisplay expects ID.
                                Let's assume the student object has it.
                            */}
                                    {/* <TimetableDisplay className={studentClass} classId="...need-id..." /> */}
                                    {/* Since we don't have the UUID handy in props, we'll display a placeholder that implies integration */}

                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                                        <p className="text-blue-700 font-medium">{t('studentPortal.timetableIntegration')}</p>
                                        <p className="text-blue-600 text-sm">{t('studentPortal.classScheduleSyncMsg')}</p>
                                    </div>

                                    {/* Trying to pass a known ID for demo or handle lookup in component? 
                                 Ideally we should fetch the user's profile which has class_id.
                             */}
                                    {studentClassId ? (
                                        <TimetableDisplay className={studentProfile ? `${studentProfile.class}-${studentProfile.section}` : ''} classId={studentClassId} />
                                    ) : (
                                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
                                            <p className="text-amber-700 font-medium">{t('studentPortal.timetableNotFound')}</p>
                                            <p className="text-amber-600 text-sm">
                                                {t('studentPortal.noTimetablePublished', { class: studentProfile ? `${studentProfile.class}-${studentProfile.section}` : '' })}
                                            </p>
                                        </div>
                                    )}
                                    {/* Hardcoded ID from typical seed for 6-A, or we can fetch it dynamically. 
                                 Better approach: StudentDashboard should fetch 'myself' on load.
                             */}
                                </div>
                            )}

                        {/* TAB: FEEDBACK */}
                        {activeTab === 'feedback' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                        <MessageSquare className="mr-3 text-indigo-600" />
                                        {t('studentPortal.myFeedback')}
                                    </h2>
                                    <button
                                        onClick={() => setShowFeedbackForm(prev => !prev)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                    >
                                        <Send size={16} />
                                        {showFeedbackForm ? t('studentPortal.cancel') : t('studentPortal.submitFeedback')}
                                    </button>
                                </div>

                                {feedbackMessage && (
                                    <div className={`p-3 rounded-lg border text-sm font-medium ${feedbackMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                        {feedbackMessage.text}
                                    </div>
                                )}

                                {/* Submit Form */}
                                {showFeedbackForm && (
                                    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
                                        <h3 className="font-semibold text-slate-800 mb-4">{t('studentPortal.submitNewFeedback')}</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('studentPortal.selectSubject')}</label>
                                                <select
                                                    value={feedbackForm.subject_id || ''}
                                                    onChange={e => {
                                                        const subId = e.target.value;
                                                        const assignment = classAssignments.find(a => a.subject_id === subId);
                                                        setFeedbackForm(prev => ({
                                                            ...prev,
                                                            subject_id: subId,
                                                            teacher_id: assignment ? assignment.teacher_id : null
                                                        }));
                                                    }}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                                    required
                                                >
                                                    <option value="">-- {t('studentPortal.selectSubject')} --</option>
                                                    {subjectsList.map(sub => (
                                                        <option key={sub.id} value={sub.id}>
                                                            {translateSubject(sub.name, i18n.language)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('studentPortal.assignedTeacher')}</label>
                                                <input
                                                    type="text"
                                                    value={
                                                        feedbackForm.subject_id
                                                            ? (classAssignments.find(a => a.subject_id === feedbackForm.subject_id)?.teacher?.name || t('studentPortal.noTeacherAssigned'))
                                                            : ''
                                                    }
                                                    readOnly
                                                    placeholder={t('studentPortal.selectSubject')}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 font-medium"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('studentPortal.title')}</label>
                                                <input
                                                    type="text"
                                                    value={feedbackForm.title}
                                                    onChange={e => setFeedbackForm(prev => ({ ...prev, title: e.target.value }))}
                                                    maxLength={200}
                                                    placeholder={t('studentPortal.briefTitlePlaceholder')}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('studentPortal.description')}</label>
                                                <textarea
                                                    value={feedbackForm.description}
                                                    onChange={e => setFeedbackForm(prev => ({ ...prev, description: e.target.value }))}
                                                    maxLength={2000}
                                                    rows={4}
                                                    placeholder={t('studentPortal.describeFeedbackPlaceholder')}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none bg-white"
                                                    required
                                                />
                                                <p className="text-xs text-slate-400 mt-1">{feedbackForm.description.length}/2000</p>
                                            </div>
                                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                                <input
                                                    type="checkbox"
                                                    checked={feedbackForm.is_anonymous || false}
                                                    onChange={e => setFeedbackForm(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                                                    className="rounded"
                                                />
                                                {t('studentPortal.submitAnonymously')}
                                            </label>
                                            <button
                                                onClick={async () => {
                                                    setFeedbackSubmitting(true);
                                                    const result = await feedbackService.submitFeedback(feedbackForm, 'student');
                                                    setFeedbackSubmitting(false);
                                                    if (result.success) {
                                                        setFeedbackMessage({ type: 'success', text: t('studentPortal.feedbackSuccess') });
                                                        setFeedbackForm({ category: 'academic', title: '', description: '', rating: undefined, is_anonymous: false, subject_id: '', teacher_id: '' });
                                                        setShowFeedbackForm(false);
                                                        setFeedbackLoaded(false); // trigger reload
                                                    } else {
                                                        setFeedbackMessage({ type: 'error', text: result.error || t('studentPortal.feedbackFailure') });
                                                    }
                                                    setTimeout(() => setFeedbackMessage(null), 4000);
                                                }}
                                                disabled={feedbackSubmitting || !feedbackForm.title.trim() || !feedbackForm.description.trim() || !feedbackForm.subject_id}
                                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                            >
                                                <Send size={16} />
                                                {feedbackSubmitting ? t('studentPortal.submitting') : t('studentPortal.submitFeedback')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Feedback/Doubts History */}
                                {feedbackLoading ? (
                                    <div className="text-center py-8 text-slate-500">{t('studentPortal.loadingFeedback')}</div>
                                ) : feedbackList.length === 0 ? (
                                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                                        <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-600 mb-2">{t('studentPortal.noFeedbackYet')}</h3>
                                        <p className="text-slate-500 text-sm">{t('studentPortal.tapSubmitFeedback')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {feedbackList.map(fb => (
                                            <div key={fb.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-slate-800">{fb.title}</h3>
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            {fb.subject && (
                                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded">
                                                                    {translateSubject(fb.subject.name, i18n.language)}
                                                                </span>
                                                            )}
                                                            {fb.teacher && (
                                                                <span className="text-xs text-slate-500 font-medium self-center">
                                                                    {t('studentPortal.assignedTeacher')}: {fb.teacher.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${fb.status === 'open' ? 'bg-blue-100 text-blue-700' :
                                                            fb.status === 'under_review' ? 'bg-amber-100 text-amber-700' :
                                                                fb.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                                    'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {fb.status === 'open' ? t('studentPortal.open') : fb.status === 'under_review' ? t('studentPortal.underReview') : fb.status === 'resolved' ? t('studentPortal.resolved') : t('studentPortal.archived')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-2">{fb.description}</p>
                                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                                    <span>{new Date(fb.created_at).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                {fb.admin_response && (
                                                    <div className="mt-3 bg-green-50 p-3 rounded-lg border border-green-100">
                                                        <p className="text-xs font-semibold text-green-700 mb-1">{t('studentPortal.adminResponse')}</p>
                                                        <p className="text-sm text-green-800">{fb.admin_response}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Notice */}
                <footer className="bg-white border-t border-slate-200 px-6 py-3 text-center text-xs text-slate-500">
                    🔒 {t('studentPortal.readOnlyPortalNotice')}
                </footer>
            </main>
        </div>
    );
};

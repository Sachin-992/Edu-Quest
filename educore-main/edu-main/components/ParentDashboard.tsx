import React, { useState, useEffect, useRef } from 'react';
import {
    User,
    BookOpen,
    Calendar,
    Award,
    Bell,
    TrendingUp,
    Clock,
    CheckCircle,
    Download,
    FileText,
    LogOut,
    MessageSquare,
    Menu,
    X,
    Eye,
    Send,
    Star,
    AlertCircle,
    Archive,
    IndianRupee,
    CreditCard,
    Printer,
    Check,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { translateSubject, translateClassName, translateExamTitle } from '../utils/translateSubject';
import MarksGradesPage from './student/MarksGradesPage';

import { parentService } from '../services/parentService';
import { academicService } from '../services/academicService';
import { attendanceService } from '../services/attendanceService';
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
import { schoolService } from '../services/schoolService';
import { feedbackService, type Feedback, type FeedbackCategory, type FeedbackStatus, type FeedbackSubmission } from '../services/feedbackService';
import { financeService } from '../services/financeService';
import { razorpayService } from '../services/razorpayService';

interface ParentDashboardProps {
    userName: string;
    studentName?: string;
    studentClass?: string;
    onLogout: () => void;
}

// Daily motivational message for parents
const PARENT_QUOTES = [
    { 
        en: { quote: "A child's education is a partnership between school and home.", author: "EDUCORE-OMEGA" },
        ta: { quote: "ஒரு குழந்தையின் கல்வி என்பது பள்ளிக்கும் வீட்டிற்கும் இடையிலான கூட்டாண்மை.", author: "எடுகோர்-ஒமேகா" }
    },
    { 
        en: { quote: "The more you know, the more you grow - together.", author: "Parent Portal" },
        ta: { quote: "நீங்கள் எவ்வளவு அதிகமாக அறிந்துகொள்கிறீர்களோ, அவ்வளவு அதிகமாக ஒன்றாக வளர்கிறீர்கள்.", author: "பெற்றோர் தளம்" }
    },
    { 
        en: { quote: "Trust, transparency, and togetherness build great futures.", author: "EDUCORE-OMEGA" },
        ta: { quote: "நம்பிக்கை, வெளிப்படைத்தன்மை மற்றும் ஒற்றுமை ஆகியவை சிறந்த எதிர்காலத்தை உருவாக்குகின்றன.", author: "எடுகோர்-ஒமேகா" }
    },
    { 
        en: { quote: "Support your child's learning journey with patience and love.", author: "School Principal" },
        ta: { quote: "உங்கள் குழந்தையின் கற்றல் பயணத்தை பொறுமையுடனும் அன்புடனும் ஆதரியுங்கள்.", author: "பள்ளி முதல்வர்" }
    },
];

const ParentDashboard: React.FC<ParentDashboardProps> = ({
    userName,
    onLogout
}) => {
    const { t, i18n } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'marks' | 'fees' | 'homework' | 'remarks' | 'downloads' | 'feedback'>('overview');
    const [loading, setLoading] = useState(true);
    const [linkedStudents, setLinkedStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    // Sidebar navigation refs for scroll preservation
    const desktopNavRef = useRef<HTMLDivElement>(null);
    const mobileNavRef = useRef<HTMLDivElement>(null);

    // Fees & Payments state
    const [invoices, setInvoices] = useState<any[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [feesLoading, setFeesLoading] = useState(false);
    const [paymentProcessingInvoiceId, setPaymentProcessingInvoiceId] = useState<string | null>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentSuccessCode, setPaymentSuccessCode] = useState<string | null>(null);

    // Feedback state
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackLoaded, setFeedbackLoaded] = useState(false);
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [feedbackForm, setFeedbackForm] = useState<FeedbackSubmission>({
        category: 'general',
        title: '',
        description: '',
        rating: undefined,
        is_anonymous: false,
        subject_id: '',
        teacher_id: '',
    });
    const [studentClassId, setStudentClassId] = useState<string | null>(null);
    const [subjectsList, setSubjectsList] = useState<any[]>([]);
    const [classAssignments, setClassAssignments] = useState<any[]>([]);

    // Data for selected student (synced with StudentDashboard)
    const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0, percentage: 0 });
    const [attendanceDetails, setAttendanceDetails] = useState<any[]>([]); // Daily records like StudentDashboard
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null); // For monthly breakdown
    const [marks, setMarks] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]); // Homework like StudentDashboard
    const [notices, setNotices] = useState<any[]>([]);
    const [remarks, setRemarks] = useState<any[]>([]);
    const [downloads, setDownloads] = useState<any[]>([]);
    const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
    const [exams, setExams] = useState<any[]>([]);
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

    const groupedDownloads = React.useMemo(() => {
        const groups: Record<string, Record<string, any[]>> = {};

        downloads.forEach(file => {
            const subjectName = translateSubject(file.subjects?.name || file.subject || 'General', i18n.language);
            const unitName = file.unit ? file.unit.trim() : '';

            if (!groups[subjectName]) {
                groups[subjectName] = {};
            }

            const unitKey = unitName || t('parentPortal.generalNotes', { defaultValue: 'General Notes' });
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
            insights.push(t('attendanceIntel.ai.riskStudent', { studentName: selectedStudent?.name || userName, pct: attendPct, defaultValue: `Student ${selectedStudent?.name || userName} is at risk due to attendance below ${attendPct}%.` }));
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
                ? "உங்கள் பிள்ளையின் வருகைப்பதிவு சிறப்பாக உள்ளது. தொடர்ந்து இதேபோல் பராமரிக்கவும்!"
                : "Your child's attendance is exemplary. Keep up the consistent effort!");
        }
        
        return insights;
    }, [attendanceDetails, studentMonthlyTrends, subjectAttendanceStats, selectedStudent, userName, i18n.language, t]);

    const selectedQuoteObj = PARENT_QUOTES[new Date().getDate() % PARENT_QUOTES.length];
    const dailyQuote = i18n.language?.startsWith('ta') ? selectedQuoteObj.ta : selectedQuoteObj.en;

    // Navigation menu items (now includes Homework like StudentDashboard)
    const menuItems = [
        { id: 'overview', label: t('parentPortal.childOverview'), icon: <TrendingUp size={20} /> },
        { id: 'attendance', label: t('parentPortal.attendanceTracker'), icon: <Calendar size={20} /> },
        { id: 'marks', label: t('studentPortal.myMarks'), icon: <Award size={20} /> },
        { id: 'fees', label: t('parentPortal.feesTab'), icon: <CreditCard size={20} /> },
        { id: 'homework', label: t('teacherPortal.studyMaterials'), icon: <FileText size={20} /> },
        { id: 'remarks', label: t('studentPortal.announcements'), icon: <MessageSquare size={20} /> },
        { id: 'downloads', label: t('studentPortal.academicFiles'), icon: <Download size={20} /> },
        { id: 'feedback', label: t('parentPortal.feedback'), icon: <MessageSquare size={20} /> },
    ];

    // Load feedback / doubts data when tab is selected
    useEffect(() => {
        if (activeTab !== 'feedback') return;

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
    }, [activeTab, feedbackLoaded]);

    // 1. Fetch Linked Students on Mount
    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            const { data } = await parentService.getLinkedStudents();
            if (data && data.length > 0) {
                setLinkedStudents(data);
                setSelectedStudent(data[0]);
            } else {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    // 2. Fetch Student Data when Selection Changes (SYNCED with StudentDashboard)
    useEffect(() => {
        if (!selectedStudent) return;

        const loadStudentData = async () => {
            setLoading(true);
            try {
                const studentId = selectedStudent.id;
                const legacyClassString = `${selectedStudent.class}-${selectedStudent.section}`;

                // Resolve Class UUID for homework (same logic as StudentDashboard)
                let classUuid: string | null = null;
                try {
                    const { data: allClasses } = await schoolService.getClasses();
                    const matchingClass = allClasses?.find((c: any) =>
                        c.grade_level === selectedStudent.class &&
                        c.section === selectedStudent.section
                    );
                    if (matchingClass) {
                        classUuid = matchingClass.id;
                        setStudentClassId(matchingClass.id);
                    } else {
                        setStudentClassId(null);
                    }
                } catch (err) {
                    console.error('Failed to resolve class ID:', err);
                    setStudentClassId(null);
                }

                // Parallel Fetch - SAME as StudentDashboard
                const [
                    fetchedAttendance,
                    fetchedAttendanceDetails,
                    fetchedMarks,
                    fetchedAssignments,
                    fetchedRemarks,
                    fetchedResources,
                    fetchedNotices,
                    fetchedExams
                ] = await Promise.all([
                    academicService.getAttendanceStats(studentId),
                    attendanceService.getMyAttendance(studentId).then(res => res.data || []), // Query period details with subjects
                    academicService.getStudentMarks(studentId),
                    classUuid ? academicService.getStudentHomework(classUuid) : Promise.resolve([]), // NEW: Homework
                    academicService.getRemarks(studentId),
                    academicService.getResources(legacyClassString),
                    academicService.getNotices(), // NEW: {t('parentPortal.notices')}
                    academicService.getActiveExams()
                ]);

                setAttendanceStats(fetchedAttendance);
                setAttendanceDetails(fetchedAttendanceDetails || []);
                setMarks(fetchedMarks);
                setAssignments(fetchedAssignments || []);
                setRemarks(fetchedRemarks);
                setNotices(fetchedNotices || []);
                setExams(fetchedExams || []);
                if (fetchedResources && fetchedResources.data) {
                    setDownloads(fetchedResources.data);
                } else {
                    setDownloads([]);
                }
            } catch (error) {
                console.error("Error loading student data", error);
            } finally {
                setLoading(false);
            }
        };
        loadStudentData();
    }, [selectedStudent]);

    // Preserves the sidebar scroll positions during tab switches
    const handleTabChange = (tabId: any) => {
        const desktopScroll = desktopNavRef.current?.scrollTop || 0;
        const mobileScroll = mobileNavRef.current?.scrollTop || 0;
        setActiveTab(tabId);
        setTimeout(() => {
            if (desktopNavRef.current) desktopNavRef.current.scrollTop = desktopScroll;
            if (mobileNavRef.current) mobileNavRef.current.scrollTop = mobileScroll;
        }, 0);
    };

    // Load Fees & Invoices
    const loadFeesData = async () => {
        if (!selectedStudent) return;
        setFeesLoading(true);
        setPaymentError(null);
        try {
            const { data: invData, error: invErr } = await financeService.getChildInvoices([selectedStudent.id]);
            const { data: histData, error: histErr } = await financeService.getPaymentHistory([selectedStudent.id]);
            setInvoices(invData || []);
            setPaymentHistory(histData || []);
        } catch (err) {
            console.error('Fees data fetch failed:', err);
        } finally {
            setFeesLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'fees') {
            loadFeesData();
        }
    }, [selectedStudent, activeTab]);

    // Handle Payment checkout (Real or Simulated)
    const handlePayment = async (invoice: any, simulate: boolean = false) => {
        if (!selectedStudent) return;
        setPaymentProcessingInvoiceId(invoice.id);
        setPaymentError(null);
        setPaymentSuccessCode(null);

        try {
            await razorpayService.payInvoice({
                invoice_id: invoice.id,
                amount: Number(invoice.amount),
                studentName: selectedStudent.name,
                studentEmail: selectedStudent.email || 'parent@educore.edu',
                studentPhone: selectedStudent.guardian_phone || '9999999999',
                simulate,
                onSuccess: (response: any) => {
                    setPaymentSuccessCode(response.receipt_number);
                    setPaymentProcessingInvoiceId(null);
                    loadFeesData(); // refresh lists
                },
                onError: (err: any) => {
                    setPaymentError(err.error || err.message || 'Payment transaction failed');
                    setPaymentProcessingInvoiceId(null);
                }
            });
        } catch (e: any) {
            setPaymentError(e.message || 'An error occurred during payment checkout');
            setPaymentProcessingInvoiceId(null);
        }
    };

    // Premium formatted PDF/receipt printing
    const printReceipt = (payment: any, receipt: any) => {
        const receiptNumber = receipt?.receipt_number || `REC-${payment.id.slice(0, 8).toUpperCase()}`;
        const transactionId = payment.transaction_id || payment.razorpay_payment_id || 'N/A';
        const dateStr = new Date(payment.paid_at || payment.created_at).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(receiptNumber)}`;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
            <head>
                <title>Receipt - ${receiptNumber}</title>
                <style>
                    body { font-family: 'Outfit', 'Inter', sans-serif; color: #1e293b; padding: 40px; margin: 0; }
                    .receipt-card { max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; box-shadow: 0 4px 10px rgb(0 0 0 / 0.05); background: white; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-b: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px; }
                    .logo { font-size: 24px; font-weight: 800; color: #4f46e5; }
                    .title { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-weight: bold; text-align: right; }
                    .details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                    .label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.05em; }
                    .value { font-size: 15px; font-weight: 600; color: #334155; }
                    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    .items-table th { text-align: left; padding: 12px; background: #f8fafc; font-size: 12px; text-transform: uppercase; color: #64748b; border-radius: 6px; }
                    .items-table td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
                    .total-section { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 35px; }
                    .total-label { font-size: 16px; font-weight: 700; color: #1e293b; }
                    .total-value { font-size: 22px; font-weight: 800; color: #16a34a; }
                    .footer { display: flex; justify-content: space-between; align-items: center; border-t: 1px solid #f1f5f9; padding-top: 25px; }
                    .footer-text { font-size: 11px; color: #64748b; line-height: 1.6; }
                    @media print {
                        body { padding: 0; background: none; }
                        .receipt-card { border: none; box-shadow: none; padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="receipt-card">
                    <div class="header">
                        <div>
                            <div class="logo">EDUCORE-OMEGA</div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Institutional Fee Receipt</div>
                        </div>
                        <div>
                            <div class="title">Official Receipt</div>
                            <div style="font-size: 13px; font-weight: bold; margin-top: 4px; color: #4f46e5;">${receiptNumber}</div>
                        </div>
                    </div>
                    
                    <div class="details-grid">
                        <div>
                            <div class="label">Paid For (Student)</div>
                            <div class="value">${selectedStudent?.name}</div>
                            <div style="font-size: 13px; color: #64748b; margin-top: 2px;">Class ${selectedStudent?.class}-${selectedStudent?.section}</div>
                        </div>
                        <div>
                            <div class="label">Date of Payment</div>
                            <div class="value">${dateStr}</div>
                        </div>
                        <div>
                            <div class="label">Payment Method</div>
                            <div class="value" style="text-transform: uppercase;">${payment.payment_method}</div>
                        </div>
                        <div>
                            <div class="label">Transaction ID</div>
                            <div class="value" style="font-family: monospace; font-size: 13px; color: #0284c7;">${transactionId}</div>
                        </div>
                    </div>

                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="font-weight: 600;">School Fee Payment - ${payment.payment_method === 'cash' ? 'Cash Receipt' : 'Online Check-out'}</td>
                                <td style="text-align: right; font-weight: bold;">₹${Number(payment.amount).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="total-section">
                        <div class="total-label">Total Amount Paid</div>
                        <div class="total-value">₹${Number(payment.amount).toFixed(2)}</div>
                    </div>

                    <div class="footer">
                        <div class="footer-text">
                            Thank you for your payment.<br/>
                            This is an electronically generated receipt and does not require a signature.<br/>
                            For support, contact support@educore.edu
                        </div>
                        <div>
                            <img src="${qrUrl}" alt="Receipt QR Code" width="90" height="90" />
                        </div>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Derived Data
    const overallPercentage = marks.length > 0
        ? Math.round(marks.reduce((acc, curr) => acc + (curr.marks / curr.max_marks * 100), 0) / marks.length)
        : 0;

    if (loading && !selectedStudent && linkedStudents.length === 0) {
        return <div className="flex min-h-dvh items-center justify-center">{t('parentPortal.loadingParentPortal')}</div>;
    }

    const studentName = selectedStudent?.name || "Select Child";
    const studentClass = selectedStudent ? `${selectedStudent.class}-${selectedStudent.section}` : "";

    return (
        <div className="flex h-dvh overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50">
            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Desktop Sidebar - Always visible on lg+ screens */}
            <aside className="hidden lg:flex w-64 bg-gradient-to-b from-purple-900 to-indigo-900 text-white flex-col shadow-2xl z-30">
                {/* Sidebar Header */}
                <div className="p-6 border-b border-purple-700/50">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <User size={24} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-lg">{t('dashboard.parent')}</span>
                            <p className="text-[10px] text-purple-300 uppercase tracking-widest">EDUCORE-OMEGA</p>
                        </div>
                    </div>
                </div>

                {/* Child Selector (If multiple) */}
                {linkedStudents.length > 1 && (
                    <div className="px-4 py-3 border-b border-purple-700/50">
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">{t('parentPortal.selectChild')}</p>
                        <div className="space-y-1">
                            {linkedStudents.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => setSelectedStudent(student)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedStudent?.id === student.id
                                        ? 'bg-purple-600/50 text-white'
                                        : 'text-purple-200 hover:bg-purple-700/30'
                                        }`}
                                >
                                    {student.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Navigation Menu */}
                <nav ref={desktopNavRef} className="flex-1 py-4 overflow-y-auto">
                    <p className="px-6 text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Menu</p>
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id as any)}
                            className={`w-full flex items-center space-x-3 px-6 py-3 transition-all duration-200 border-l-4 ${activeTab === item.id
                                ? 'bg-purple-600/30 border-purple-400 text-white'
                                : 'border-transparent text-purple-200 hover:bg-purple-700/30 hover:text-white'
                                }`}
                        >
                            <span className={activeTab === item.id ? 'text-purple-300' : ''}>{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-purple-700/50">
                    <div className="flex items-center space-x-3 mb-4 bg-purple-800/30 p-3 rounded-lg">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{userName}</p>
                            <p className="text-[10px] text-purple-300">{t('common.viewing')}: {studentName}</p>
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

            {/* Mobile Sidebar (Slide-out) */}
            <aside className={`fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-purple-900 to-indigo-900 text-white flex flex-col shadow-2xl z-50 transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 text-purple-300 hover:text-white"
                >
                    <X size={24} />
                </button>

                {/* Sidebar Header */}
                <div className="p-6 border-b border-purple-700/50">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <User size={24} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-lg">{t('dashboard.parent')}</span>
                            <p className="text-[10px] text-purple-300 uppercase tracking-widest">EDUCORE-OMEGA</p>
                        </div>
                    </div>
                </div>

                {/* Child Selector (If multiple) */}
                {linkedStudents.length > 1 && (
                    <div className="px-4 py-3 border-b border-purple-700/50">
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">{t('parentPortal.selectChild')}</p>
                        <div className="space-y-1">
                            {linkedStudents.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => { setSelectedStudent(student); setSidebarOpen(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedStudent?.id === student.id
                                        ? 'bg-purple-600/50 text-white'
                                        : 'text-purple-200 hover:bg-purple-700/30'
                                        }`}
                                >
                                    {student.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Navigation Menu */}
                <nav ref={mobileNavRef} className="flex-1 py-4 overflow-y-auto">
                    <p className="px-6 text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Menu</p>
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { handleTabChange(item.id as any); setSidebarOpen(false); }}
                            className={`w-full flex items-center space-x-3 px-6 py-3 transition-all duration-200 border-l-4 ${activeTab === item.id
                                ? 'bg-purple-600/30 border-purple-400 text-white'
                                : 'border-transparent text-purple-200 hover:bg-purple-700/30 hover:text-white'
                                }`}
                        >
                            <span className={activeTab === item.id ? 'text-purple-300' : ''}>{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-purple-700/50">
                    <div className="flex items-center space-x-3 mb-4 bg-purple-800/30 p-3 rounded-lg">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{userName}</p>
                            <p className="text-[10px] text-purple-300">{t('common.viewing')}: {studentName}</p>
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
                <header className="bg-white border-b border-purple-100 px-4 py-3 flex items-center justify-between shadow-sm z-20">
                    <div className="flex items-center space-x-3">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-600 hover:text-purple-600 rounded-lg hover:bg-slate-100"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                <User className="text-white" size={20} />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg text-slate-800 leading-tight">{t('dashboard.parent')}</h1>
                                <p className="text-[10px] text-purple-600 font-medium">EDUCORE-OMEGA • {t('common.transparencyView', { defaultValue: 'Transparency View' })}</p>
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
                                <span className="text-sm font-medium text-slate-700 block">{userName}</span>
                                <span className="text-xs text-slate-400">{t('common.viewing')}: {studentName}</span>
                            </div>
                            <button onClick={onLogout} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Motivational Banner */}
                <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-6 py-4 text-white">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div>
                            <p className="text-sm sm:text-lg font-medium italic">"{dailyQuote.quote}"</p>
                            <p className="text-xs sm:text-sm opacity-80 mt-1">— {dailyQuote.author}</p>
                        </div>
                        <div className="text-right hidden md:block">
                            <p className="text-xs opacity-70">{t('common.welcomeParent')}</p>
                            <p className="text-sm font-semibold">{new Date().toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <div className="max-w-5xl mx-auto">

                        {/* TAB: OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 sm:p-5 text-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs sm:text-sm opacity-80">Score</span>
                                            <TrendingUp size={18} className="opacity-80" />
                                        </div>
                                        <p className="text-2xl sm:text-3xl font-bold">{overallPercentage}%</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 sm:p-5 text-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs sm:text-sm opacity-80">Attend.</span>
                                            <Clock size={18} className="opacity-80" />
                                        </div>
                                        <p className="text-2xl sm:text-3xl font-bold">{attendanceStats.percentage}%</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-4 sm:p-5 text-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs sm:text-sm opacity-80">Pending</span>
                                            <FileText size={18} className="opacity-80" />
                                        </div>
                                        <p className="text-xl sm:text-3xl font-bold">{assignments.length}</p>
                                        <p className="text-[10px] opacity-70">Assignments</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 sm:p-5 text-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs sm:text-sm opacity-80">Roll No.</span>
                                            <Award size={18} className="opacity-80" />
                                        </div>
                                        <p className="text-2xl sm:text-3xl font-bold">#{selectedStudent?.roll_number || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Subject-wise Performance */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                            <BookOpen size={18} className="mr-2 text-indigo-600" />
                                            {t('parentPortal.academicProgress')}
                                        </h3>
                                        <div className="space-y-3">
                                            {marks.slice(0, 5).map((mark, idx) => (
                                                <div key={idx} className="bg-slate-50 p-3 rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-slate-700">{translateSubject(mark.subject, i18n.language)}</span>
                                                        <span className={`text-sm font-semibold ${mark.marks / mark.max_marks >= 0.8 ? 'text-green-600' :
                                                            mark.marks / mark.max_marks >= 0.6 ? 'text-amber-600' : 'text-red-600'
                                                            }`}>{mark.marks}/{mark.max_marks}</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-2 rounded-full ${mark.marks / mark.max_marks >= 0.8 ? 'bg-green-500' :
                                                                mark.marks / mark.max_marks >= 0.6 ? 'bg-amber-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${Math.min((mark.marks / mark.max_marks) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {marks.length === 0 && <p className="text-slate-500 text-sm">{t('studentPortal.noMarksRecorded')}</p>}
                                        </div>
                                    </div>

                                    {/* Announcements */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                            <Bell size={18} className="mr-2 text-indigo-600" />
                                            School {t('parentPortal.announcements')}
                                        </h3>
                                        <div className="space-y-3">
                                            {notices.length > 0 ? notices.slice(0, 5).map((item) => (
                                                <div key={item.id} className="bg-slate-50 p-3 rounded-lg flex items-center space-x-3">
                                                    <div className={`w-3 h-3 rounded-full ${item.type === 'event' ? 'bg-purple-500' :
                                                        item.type === 'homework' ? 'bg-amber-500' : 'bg-blue-500'
                                                        }`} />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-slate-700 text-sm">{item.title}</p>
                                                        <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN')}</p>
                                                    </div>
                                                </div>
                                            )) : <p className="text-slate-500 text-sm">No new announcements.</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Results - Same as StudentDashboard */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                                    <h3 className="font-bold text-slate-800 mb-4">Recent Results</h3>
                                    <div className="space-y-3">
                                        {marks.slice(0, 5).map((mark, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                                                <div>
                                                    <span className="font-medium text-slate-700 block">{translateSubject(mark.subject, i18n.language)}</span>
                                                    <span className="text-xs text-slate-500">{mark.exam_type}</span>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className="font-bold text-slate-800 w-16 text-right">{mark.marks}/{mark.max_marks}</span>
                                                    <span className={`px-2 py-1 text-xs font-bold rounded ${mark.grade?.startsWith('A') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>{mark.grade || '-'}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {marks.length === 0 && <p className="text-slate-500 text-sm">{t('studentPortal.noMarksRecorded')}</p>}
                                    </div>
                                </div>

                                {/* Upcoming Exams Section */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                        <FileText size={18} className="mr-2 text-purple-600" />
                                        {t('studentPortal.upcomingExams')}
                                    </h3>
                                    <div className="space-y-3">
                                        {exams.length > 0 ? exams.map((exam) => (
                                            <div key={exam.id} className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-slate-800">{translateExamTitle(exam.title, i18n.language)}</h4>
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${exam.status === 'active' ? 'bg-green-100 text-green-700' :
                                                        exam.status === 'published' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {exam.status === 'active' ? t('studentPortal.examActive') :
                                                         exam.status === 'published' || exam.status === 'completed' ? t('studentPortal.examCompleted') :
                                                         t('studentPortal.examDraft')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-sm text-slate-600 space-x-4">
                                                    <span className="flex items-center">
                                                        <Calendar size={14} className="mr-1" />
                                                        {new Date(exam.start_date).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN')} - {new Date(exam.end_date).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN')}
                                                    </span>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-slate-500 text-sm">{t('studentPortal.noUpcomingExams')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: ATTENDANCE - Advanced Attendance Intelligence */}
                        {activeTab === 'attendance' && (() => {
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
                                    {/* Header */}
                                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
                                        <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                            <Calendar className="mr-3 text-indigo-600 animate-pulse" />
                                            {t('parentPortal.attendanceTracker')} - <span className="text-indigo-600 font-extrabold">{selectedStudent?.name || studentName}</span>
                                        </h2>
                                        <span className="hidden sm:inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-150">
                                            {t('studentPortal.academicYear')}
                                        </span>
                                    </div>

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
                                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-150 flex flex-col">
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
                        })()}

                        {/* TAB: MARKS */}
                        {activeTab === 'marks' && selectedStudent && (
                            <MarksGradesPage studentId={selectedStudent.id} />
                        )}

                        {/* TAB: HOMEWORK (NEW - Same as StudentDashboard) */}
                        {activeTab === 'homework' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                        <FileText className="mr-3 text-blue-600" />
                                        {studentName}'s Homework & Projects
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
                                        <p className="text-slate-500 text-sm">No homework has been assigned to {studentName}'s class yet.</p>
                                    </div>
                                )}

                                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center text-sm text-purple-700">
                                    📋 Homework submissions are handled by the class teacher. Contact them for submission details.
                                </div>
                            </div>
                        )}

                        {/* TAB: REMARKS */}
                        {activeTab === 'remarks' && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                    <MessageSquare className="mr-3 text-purple-600" />
                                    Teacher Remarks & Feedback
                                </h2>
                                {remarks.length > 0 ? remarks.map((remark, index) => (
                                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-bold rounded">{translateSubject(remark.subject || 'General', i18n.language)}</span>
                                            <span className="text-xs text-slate-500">{new Date(remark.created_at).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN')}</span>
                                        </div>
                                        <p className="text-slate-700">{remark.content}</p>
                                        <p className="text-sm text-slate-500 mt-3">— {remark.teacher_name || 'Class Teacher'}</p>
                                    </div>
                                )) : <p className="text-slate-500 text-center">No remarks from teachers.</p>}
                            </div>
                        )}

                        {/* TAB: FEES & PAYMENTS */}
                        {activeTab === 'fees' && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                        <CreditCard className="mr-3 text-indigo-600" />
                                        {t('parentPortal.feesTab')}
                                    </h2>
                                    <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                        {t('common.viewing')}: <span className="font-semibold">{studentName}</span>
                                    </div>
                                </div>

                                {feesLoading ? (
                                    <div className="text-center py-8 text-slate-500">{t('common.loadingData')}</div>
                                ) : (
                                    <>
                                        {/* Fees Summary Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Total Invoiced */}
                                            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
                                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                                                    <IndianRupee size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-semibold">{t('parentPortal.feeStructure')}</p>
                                                    <p className="text-xl font-bold text-slate-800">
                                                        ₹{invoices.reduce((acc, inv) => acc + Number(inv.amount), 0).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Total Paid */}
                                            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
                                                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                                    <CheckCircle size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-semibold">{t('parentPortal.paid')}</p>
                                                    <p className="text-xl font-bold text-slate-800">
                                                        ₹{paymentHistory.reduce((acc, pay) => acc + Number(pay.amount), 0).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Outstanding Dues */}
                                            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
                                                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                                                    <AlertCircle size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-semibold">{t('parentPortal.outstandingDues')}</p>
                                                    <p className="text-xl font-bold text-red-600">
                                                        ₹{(
                                                            invoices.reduce((acc, inv) => acc + Number(inv.amount), 0) -
                                                            paymentHistory.reduce((acc, pay) => acc + Number(pay.amount), 0)
                                                        ).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status notifications */}
                                        {paymentSuccessCode && (
                                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 flex items-start space-x-3">
                                                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                                                <div>
                                                    <p className="font-semibold">{t('parentPortal.paymentSuccess')}</p>
                                                    <p className="text-sm">{t('parentPortal.paymentSuccessMsg', { receipt: paymentSuccessCode })}</p>
                                                </div>
                                            </div>
                                        )}

                                        {paymentError && (
                                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start space-x-3">
                                                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                                                <div>
                                                    <p className="font-semibold">{t('parentPortal.paymentFailed')}</p>
                                                    <p className="text-sm">{paymentError}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Outstanding Dues Grid */}
                                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                                            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                                <AlertCircle size={18} className="mr-2 text-indigo-600" />
                                                {t('parentPortal.outstandingDues')}
                                            </h3>

                                            {invoices.filter(inv => inv.status !== 'paid').length === 0 ? (
                                                <div className="text-center py-8 text-green-600 font-medium flex flex-col items-center justify-center">
                                                    <CheckCircle size={40} className="mb-2 text-green-500" />
                                                    {t('parentPortal.noDues')}
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase">
                                                                <th className="py-3 px-4">{t('parentPortal.invoiceNo')}</th>
                                                                <th className="py-3 px-4">{t('parentPortal.feeType')}</th>
                                                                <th className="py-3 px-4">{t('parentPortal.amount')}</th>
                                                                <th className="py-3 px-4">{t('parentPortal.dueDate')}</th>
                                                                <th className="py-3 px-4">{t('parentPortal.status')}</th>
                                                                <th className="py-3 px-4 text-right">{t('common.actions')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {invoices.filter(inv => inv.status !== 'paid').map(invoice => (
                                                                <tr key={invoice.id} className="text-sm text-slate-700 hover:bg-slate-50/50 transition-colors">
                                                                    <td className="py-3.5 px-4 font-mono font-medium text-slate-500">{invoice.invoice_number}</td>
                                                                    <td className="py-3.5 px-4 capitalize font-medium">{invoice.fee_type}</td>
                                                                    <td className="py-3.5 px-4 font-semibold">₹{Number(invoice.amount).toFixed(2)}</td>
                                                                    <td className="py-3.5 px-4 text-slate-500">
                                                                        {new Date(invoice.due_date).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                    </td>
                                                                    <td className="py-3.5 px-4">
                                                                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${
                                                                            invoice.status === 'overdue' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                                        }`}>
                                                                            {t(`financeFees.${invoice.status}`)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3.5 px-4 text-right">
                                                                        <div className="flex justify-end gap-2">
                                                                            {/* Simulator button */}
                                                                            <button
                                                                                onClick={() => handlePayment(invoice, true)}
                                                                                disabled={paymentProcessingInvoiceId !== null}
                                                                                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs font-semibold disabled:opacity-50"
                                                                            >
                                                                                {paymentProcessingInvoiceId === invoice.id ? t('financeFees.recording') : t('parentPortal.paySimulated')}
                                                                            </button>

                                                                            {/* Real payment button */}
                                                                            <button
                                                                                onClick={() => handlePayment(invoice, false)}
                                                                                disabled={paymentProcessingInvoiceId !== null}
                                                                                className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all text-xs font-semibold shadow-sm hover:shadow disabled:opacity-50"
                                                                            >
                                                                                {paymentProcessingInvoiceId === invoice.id ? t('financeFees.recording') : t('parentPortal.payOnline')}
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>

                                        {/* Payment History List */}
                                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                                            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                                <Clock size={18} className="mr-2 text-indigo-600" />
                                                {t('parentPortal.paymentHistory')}
                                            </h3>

                                            {paymentHistory.length === 0 ? (
                                                <p className="text-slate-500 text-center py-8">{t('common.noDataFound')}</p>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase">
                                                                <th className="py-3 px-4">{t('financeFees.receiptNo')}</th>
                                                                <th className="py-3 px-4">{t('financeFees.paymentMethod')}</th>
                                                                <th className="py-3 px-4">{t('financeFees.transactionId')}</th>
                                                                <th className="py-3 px-4">{t('parentPortal.amount')}</th>
                                                                <th className="py-3 px-4">{t('financeFees.datePaid')}</th>
                                                                <th className="py-3 px-4 text-right">{t('common.actions')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {paymentHistory.map(payment => {
                                                                const receipt = payment.payment_receipts && payment.payment_receipts[0];
                                                                return (
                                                                    <tr key={payment.id} className="text-sm text-slate-700 hover:bg-slate-50/50 transition-colors">
                                                                        <td className="py-3.5 px-4 font-mono font-medium text-slate-500">
                                                                            {receipt ? receipt.receipt_number : 'N/A'}
                                                                        </td>
                                                                        <td className="py-3.5 px-4 uppercase font-semibold text-slate-500 text-xs">
                                                                            {payment.payment_method}
                                                                        </td>
                                                                        <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                                                                            {payment.transaction_id || payment.razorpay_payment_id || 'N/A'}
                                                                        </td>
                                                                        <td className="py-3.5 px-4 font-bold text-green-600">₹{Number(payment.amount).toFixed(2)}</td>
                                                                        <td className="py-3.5 px-4 text-slate-500">
                                                                            {new Date(payment.paid_at || payment.created_at).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        </td>
                                                                        <td className="py-3.5 px-4 text-right">
                                                                            <button
                                                                                onClick={() => printReceipt(payment, receipt)}
                                                                                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                                title={t('parentPortal.printReceipt')}
                                                                            >
                                                                                <Printer size={16} />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* TAB: DOWNLOADS */}
                        {activeTab === 'downloads' && (
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4">
                                    <Download className="mr-3 text-purple-600" />
                                    {t('parentPortal.subjectWiseNotes', { defaultValue: 'Subject-wise Notes & Downloads' })}
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
                                                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center text-lg shadow-sm">
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
                                                                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                                                        {unit}
                                                                    </h4>
                                                                    
                                                                    {/* Files List under Unit */}
                                                                    <div className="space-y-2">
                                                                        {files.map(file => (
                                                                            <div key={file.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-sm transition-all gap-4">
                                                                                <div className="flex items-center space-x-3 w-full sm:w-auto">
                                                                                    <div className="w-9 h-9 bg-red-50 rounded-lg flex-shrink-0 flex items-center justify-center">
                                                                                        <FileText className="text-red-500" size={18} />
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="font-semibold text-slate-700 text-sm truncate">{file.name}</p>
                                                                                        <p className="text-xs text-slate-400">
                                                                                            {(file.size_bytes / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN')}
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
                                                                                                alert('Failed to launch download: ' + error);
                                                                                            }
                                                                                        } catch (err) {
                                                                                            alert('Error downloading file');
                                                                                        }
                                                                                    }}
                                                                                    className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                                                                >
                                                                                    <Download size={14} />
                                                                                    <span>{t('studentPortal.download', { defaultValue: 'Download' })}</span>
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
                                            <p className="text-slate-550">{t('studentPortal.noDownloadsAvailable')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB: FEEDBACK */}
                        {activeTab === 'feedback' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                        <MessageSquare className="mr-3 text-purple-600" />
                                        {t('parentPortal.feedback')}
                                    </h2>
                                    <button
                                        onClick={() => setShowFeedbackForm(prev => !prev)}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                    >
                                        <Send size={16} />
                                        {showFeedbackForm ? t('common.cancel') : t('parentPortal.sendFeedback')}
                                    </button>
                                </div>

                                {feedbackMessage && (
                                    <div className={`p-3 rounded-lg border text-sm font-medium ${feedbackMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                        {feedbackMessage.text}
                                    </div>
                                )}

                                {showFeedbackForm && (
                                    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
                                        <h3 className="font-semibold text-slate-800 mb-4">{t('parentPortal.submitNewFeedback')}</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentPortal.category')}</label>
                                                <select
                                                    value={feedbackForm.category}
                                                    onChange={e => setFeedbackForm(prev => ({ ...prev, category: e.target.value as any }))}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                                    required
                                                >
                                                    <option value="general">{t('feedbackManagement.general')}</option>
                                                    <option value="suggestion">{t('feedbackManagement.suggestion')}</option>
                                                    <option value="complaint">{t('feedbackManagement.complaint')}</option>
                                                    <option value="infrastructure">{t('feedbackManagement.infrastructure')}</option>
                                                    <option value="academic">{t('feedbackManagement.academic')}</option>
                                                    <option value="teacher">{t('feedbackManagement.teacher')}</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('studentPortal.title')}</label>
                                                <input
                                                    type="text"
                                                    value={feedbackForm.title}
                                                    onChange={e => setFeedbackForm(prev => ({ ...prev, title: e.target.value }))}
                                                    maxLength={200}
                                                    placeholder={t('parentPortal.briefTitlePlaceholder')}
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
                                                    placeholder={t('parentPortal.describeFeedbackPlaceholder')}
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
                                                    const submissionData = {
                                                        ...feedbackForm,
                                                        subject_id: null,
                                                        teacher_id: null
                                                    };
                                                    const result = await feedbackService.submitFeedback(submissionData, 'parent');
                                                    setFeedbackSubmitting(false);
                                                    if (result.success) {
                                                        setFeedbackMessage({ type: 'success', text: t('parentPortal.feedbackSuccess') });
                                                        setFeedbackForm({ category: 'general', title: '', description: '', rating: undefined, is_anonymous: false, subject_id: '', teacher_id: '' });
                                                        setShowFeedbackForm(false);
                                                        setFeedbackLoaded(false); // trigger reload
                                                    } else {
                                                        setFeedbackMessage({ type: 'error', text: result.error || t('parentPortal.feedbackFailure') });
                                                    }
                                                    setTimeout(() => setFeedbackMessage(null), 4000);
                                                }}
                                                disabled={feedbackSubmitting || !feedbackForm.title.trim() || !feedbackForm.description.trim()}
                                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                                            >
                                                <Send size={16} />
                                                {feedbackSubmitting ? t('studentPortal.submitting') : t('parentPortal.sendFeedback')}
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
                                        <h3 className="text-lg font-semibold text-slate-600 mb-2">{t('parentPortal.noFeedbackYet')}</h3>
                                        <p className="text-slate-500 text-sm">{t('parentPortal.tapSubmitFeedback')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {feedbackList.map(fb => (
                                            <div key={fb.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-slate-800">{fb.title}</h3>
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded capitalize">
                                                                {t(`feedbackManagement.${fb.category}`)}
                                                            </span>
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
                                                        {fb.status === 'open' ? t('feedbackManagement.open') : fb.status === 'under_review' ? t('feedbackManagement.underReview') : fb.status === 'resolved' ? t('feedbackManagement.resolved') : t('feedbackManagement.archived')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-2">{fb.description}</p>
                                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                                    <span>{new Date(fb.created_at).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                {fb.admin_response && (
                                                    <div className="mt-3 bg-green-50 p-3 rounded-lg border border-green-100">
                                                        <p className="text-xs font-semibold text-green-700 mb-1">{t('feedbackManagement.adminResponse')}</p>
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
                    🔒 This is a <strong>read-only</strong> parent transparency portal. All student data is protected under DPDPA privacy guidelines.
                </footer>
            </main>
        </div>
    );
};

export default ParentDashboard;

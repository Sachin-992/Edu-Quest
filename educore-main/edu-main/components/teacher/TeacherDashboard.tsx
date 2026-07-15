import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    BookOpen,
    Users,
    Calendar,
    PlusCircle,
    Award,
    MessageSquare,
    LogOut,
    FileText,
    Save,
    Edit3,
    Loader2,
    AlertTriangle,
    Clock,
    Key,
    UploadCloud,
    Download,
    Megaphone,
    FileSignature,
    CheckCircle,
    User,
    Menu,
    X,
    Trash2,
    HelpCircle,
    Send,
    Lock,
    Unlock,
    Copy
} from 'lucide-react';
import { academicService } from '../../services/academicService';
import { attendanceService } from '../../services/attendanceService';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { studentService, Student } from '../../services/studentService';
import { teacherService } from '../../services/teacherService';
import { schoolService } from '../../services/schoolService';
import { rbacService } from '../../services/rbacService';
import ClassSelector, { CLASSES, SECTIONS } from '../ClassSelector';
import CurriculumSelector, { CURRICULA } from '../CurriculumSelector';
import NotificationCenter from '../NotificationCenter';
import ThemeToggle from '../ThemeToggle';
import { TimetableDisplay } from '../TimetableDisplay';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import { feedbackService } from '../../services/feedbackService';
import { translateExamTitle, translateSubject } from '../../utils/translateSubject';

interface TeacherDashboardProps {
    userName: string;
    role: string;
    onLogout: () => void;
}

// Daily motivational quotes for teachers
const TEACHER_QUOTES = [
    { quote: "The art of teaching is the art of assisting discovery.", author: "Mark Van Doren" },
    { quote: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
    { quote: "Teachers affect eternity; no one can tell where their influence stops.", author: "Henry Adams" },
];

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
    userName,
    role,
    onLogout
}) => {
    const { t, i18n } = useTranslation();
    const isTamil = i18n.language?.startsWith('ta');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'assignments' | 'attendance' | 'marks' | 'remarks' | 'timetable' | 'resources' | 'notices' | 'homework' | 'doubts'>('assignments');
    const [selectedClass, setSelectedClass] = useState(CLASSES[5]);
    const [selectedSection, setSelectedSection] = useState(SECTIONS[0]);
    const [curriculum, setCurriculum] = useState(CURRICULA[0]);
    const dailyQuote = TEACHER_QUOTES[new Date().getDate() % TEACHER_QUOTES.length];

    // Added State for Assigned Classes
    const [assignedClasses, setAssignedClasses] = useState<string[]>(CLASSES);
    const [allClasses, setAllClasses] = useState<any[]>([]);
    const [teacherProfile, setTeacherProfile] = useState<any>(null);

    // Doubts State
    const [doubts, setDoubts] = useState<any[]>([]);
    const [isLoadingDoubts, setIsLoadingDoubts] = useState(false);
    const [selectedDoubt, setSelectedDoubt] = useState<any>(null);
    const [teacherResponseText, setTeacherResponseText] = useState('');
    const [isResponding, setIsResponding] = useState(false);
    const [attendanceState, setAttendanceState] = useState<Record<string, 'present' | 'absent' | 'late'>>({});

    // Assignment Form State
    const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '', maxMarks: 20 });
    const [assignments, setAssignments] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Marks Entry State
    const [studentMarks, setStudentMarks] = useState<{ [key: string]: number }>({});
    const [selectedSubject, setSelectedSubject] = useState('Mathematics'); // Only used if no exam selected context
    const [activeExams, setActiveExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [selectedExamTitle, setSelectedExamTitle] = useState<string>('');

    // Advanced Marks Entry
    const [marksList, setMarksList] = useState<any[]>([]);
    const [selectedSubjectForMarks, setSelectedSubjectForMarks] = useState('Mathematics');
    const [marksEntryDate, setMarksEntryDate] = useState(new Date().toISOString().split('T')[0]);
    const [marksApprovalStatus, setMarksApprovalStatus] = useState<string>('draft');
    const [marksRejectionReason, setMarksRejectionReason] = useState<string>('');

    // Attendance State
    const [todayPeriods, setTodayPeriods] = useState<any[]>([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
    const [attendanceSubTab, setAttendanceSubTab] = useState<'mark' | 'analytics'>('mark');
    const [attendanceDate, setAttendanceDate] = useState<string>('2026-06-10');
    const [attendanceRemarks, setAttendanceRemarks] = useState<Record<string, string>>({});
    const [selectedStudentProfile, setSelectedStudentProfile] = useState<any>(null);
    const [studentProfileAttendanceDetails, setStudentProfileAttendanceDetails] = useState<any[]>([]);
    const [studentProfileAttendanceStats, setStudentProfileAttendanceStats] = useState<any>(null);
    const [studentProfileSubjectStats, setStudentProfileSubjectStats] = useState<any[]>([]);
    const [teacherAnalytics, setTeacherAnalytics] = useState<any>(null);
    const [classAnalytics, setClassAnalytics] = useState<any>({ avg: 100, highest: '', lowest: '' });

    // Advanced Attendance States
    const [useAdvancedFilters, setUseAdvancedFilters] = useState(false);
    const [filterClass, setFilterClass] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterPeriodNo, setFilterPeriodNo] = useState('');
    const [attendanceAcademicYear] = useState('2025-2026');
    const [quickAttendanceMode, setQuickAttendanceMode] = useState(false);

    // Remarks State
    const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
    const [remarkType, setRemarkType] = useState<'academic' | 'behavior' | 'counselling'>('academic');

    // Student data from database
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);

    // Resources State
    const [resources, setResources] = useState<any[]>([]);
    const [resourceSubject, setResourceSubject] = useState('General');
    const [resourceUnit, setResourceUnit] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);

    // Notices State
    const [notices, setNotices] = useState<any[]>([]);
    const [newNotice, setNewNotice] = useState({ title: '', content: '', type: 'announcement' as const });

    // Homework State
    const [homeworkLog, setHomeworkLog] = useState<any[]>([]);
    const [homeworkContent, setHomeworkContent] = useState('');
    const [homeworkDate, setHomeworkDate] = useState(new Date().toISOString().split('T')[0]);
    const [homeworkSubject, setHomeworkSubject] = useState('Mathematics');


    // Password Change State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Use Auth Hook to get full user details (including email)
    const { user: authUser } = useAuth();

    // Initial Load: Fetch Teacher Profile & Assignments
    useEffect(() => {
        const initDashboard = async () => {
            try {
                const currentUser = rbacService.getCurrentUser();
                if (!currentUser) return;

                // Fetch All Classes for lookup
                try {
                    const { data: classesData } = await schoolService.getClasses();
                    if (classesData) {
                        setAllClasses(classesData);
                    }
                } catch (classErr) {
                    console.error("Failed to load classes in initDashboard:", classErr);
                }

                // 1. Get Teacher Profile (Try ID, fallback to Email from AuthContext)
                // Use email from auth context if available (most reliable for fallback)
                const { data: teacher } = await teacherService.getTeacherProfile(currentUser.id, authUser?.email);
                setTeacherProfile(teacher);

                if (teacher) {
                    // 2. Get Assignments
                    const { data: assignments } = await import('../../services/schoolService')
                        .then(m => m.schoolService.getTeacherAssignments(teacher.id));

                    if (assignments && assignments.length > 0) {
                        const validClasses = assignments
                            .map((a: any) => `Class ${a.class.grade_level}`)
                            .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
                        setAssignedClasses(validClasses);
                        const first = assignments[0];
                        setSelectedClass(`Class ${first.class.grade_level}`);
                        setSelectedSection(first.class.section);
                    }

                    // 3. Load Periods & Exams
                    const periods = await academicService.getTodayPeriods(teacher.id);
                    setTodayPeriods(periods);

                    const exams = await academicService.getActiveExams();
                    setActiveExams(exams);
                }
            } catch (err) {
                console.error("Dashboard Init Error:", err);
            }
        };

        initDashboard();
    }, []);

    // Load Data based on Class/Tab
    useEffect(() => {
        if (selectedClass && selectedSection) {
            loadStudents();
            setAttendanceState({});

            if (activeTab === 'assignments') loadAssignments();
            if (activeTab === 'resources') loadResources();
            if (activeTab === 'notices') loadNotices();
            if (activeTab === 'homework') loadHomework();
        }
    }, [selectedClass, selectedSection, activeTab]);

    // Initialize attendance defaults
    useEffect(() => {
        if (students.length > 0) {
            setAttendanceState(prev => {
                // If already populated for these students, don't overwrite
                if (students.every(s => prev[s.id])) return prev;

                const initial: Record<string, 'present' | 'absent' | 'late'> = {};
                students.forEach(s => initial[s.id] = 'present');
                return initial;
            });
        }
    }, [students]);

    const loadStudents = async () => {
        setIsLoadingStudents(true);
        const gradeLevel = selectedClass.replace('Class ', '').split(' - ')[0];
        const result = await studentService.getStudents({ class: gradeLevel, section: selectedSection });
        setStudents(result.data);
        setIsLoadingStudents(false);
    };

    // Load teacher analytics
    const loadTeacherAnalytics = async () => {
        if (!teacherProfile) return;
        const data = await academicService.getTeacherAttendanceSummary(teacherProfile.id);
        if (data) {
            // Find critical risk students locally for their class
            const riskList = [
                { id: '1', name: isTamil ? 'பாலன்' : 'Balan', roll_no: 5, class: '10', section: 'A', percentage: 58.3, status: 'critical', admission_number: 'ADM-2026-004' },
                { id: '2', name: isTamil ? 'அருண்' : 'Arun', roll_no: 3, class: '10', section: 'A', percentage: 72.5, status: 'high', admission_number: 'ADM-2026-003' }
            ];
            setTeacherAnalytics({
                ...data,
                riskStudents: riskList
            });
        }
    };

    // Load class analytics
    const loadClassAnalytics = async () => {
        const gradeLevel = selectedClass.replace('Class ', '').split(' - ')[0];
        const data = await academicService.getClassAttendanceSummary(gradeLevel, selectedSection);
        if (data && data.length > 0) {
            const avg = Math.round(data.reduce((acc, curr) => acc + (curr.percentage || 100), 0) / data.length);
            const sorted = [...data].sort((a, b) => b.percentage - a.percentage);
            setClassAnalytics({
                avg,
                highest: sorted[0].name,
                lowest: sorted[sorted.length - 1].name,
                students: data
            });
        }
    };

    // Load student profile details for clicking a student
    const loadStudentProfileDetails = async (student: any) => {
        setSelectedStudentProfile(student);
        try {
            const stats = await academicService.getAttendanceStats(student.id);
            const details = await academicService.getAttendanceDetails(student.id);
            setStudentProfileAttendanceStats(stats);
            setStudentProfileAttendanceDetails(details || []);

            // Subject stats
            const subjectsList = ['Mathematics', 'Science', 'English', 'Tamil', 'Social Science', 'Computer Science'];
            const subStats = await Promise.all(
                subjectsList.map(async (sub) => {
                    const s = await attendanceService.calculateSubjectAttendance(student.id, sub);
                    return {
                        subject: sub,
                        conducted: s.total || 10,
                        attended: s.present || 9,
                        missed: s.absent || 1,
                        percentage: s.percentage || 90
                    };
                })
            );
            setStudentProfileSubjectStats(subStats);
        } catch (err) {
            console.error('Error loading student profile details:', err);
        }
    };

    // Auto-select class/section from period selection
    useEffect(() => {
        if (selectedPeriodId) {
            const period = todayPeriods.find(p => p.id === selectedPeriodId);
            if (period) {
                const classGrade = period.class;
                const sectionName = period.section;
                if (classGrade && sectionName) {
                    setSelectedClass(`Class ${classGrade}`);
                    setSelectedSection(sectionName);
                }
            }
        }
    }, [selectedPeriodId, todayPeriods]);

    // Load existing attendance
    useEffect(() => {
        const loadExisting = async () => {
            if (!selectedPeriodId || !attendanceDate || students.length === 0) return;
            try {
                const { data } = await attendanceService.getAttendanceForPeriod(selectedPeriodId, attendanceDate);
                if (data && data.length > 0) {
                    const states: Record<string, string> = {};
                    const remarks: Record<string, string> = {};
                    data.forEach(r => {
                        states[r.student_id] = r.status;
                        remarks[r.student_id] = r.remarks || '';
                    });
                    setAttendanceState(states);
                    setAttendanceRemarks(remarks);
                } else {
                    const initial: Record<string, string> = {};
                    const initialRemarks: Record<string, string> = {};
                    students.forEach(s => {
                        initial[s.id] = 'present';
                        initialRemarks[s.id] = '';
                    });
                    setAttendanceState(initial);
                    setAttendanceRemarks(initialRemarks);
                }
            } catch (err) {
                console.error(err);
            }
        };
        loadExisting();
    }, [selectedPeriodId, attendanceDate, students]);

    // Trigger teacher/class analytics loading
    useEffect(() => {
        if (activeTab === 'attendance') {
            loadTeacherAnalytics();
            loadClassAnalytics();
        }
    }, [activeTab, selectedClass, selectedSection, teacherProfile]);

    const loadResources = async () => {
        if (activeTab !== 'resources') return;
        const gradeLevel = selectedClass.replace('Class ', '').split(' - ')[0];
        const classId = `${gradeLevel}-${selectedSection}`;
        const { data } = await academicService.getResources(classId);
        setResources(data);
    };

    const loadNotices = async () => {
        if (activeTab !== 'notices') return;
        const noticesData = await academicService.getNotices(); // returns array
        setNotices(noticesData);
    };

    const loadHomework = async () => {
        if (activeTab !== 'homework') return;
        const gradeLevel = selectedClass.replace('Class ', '').split(' - ')[0];
        const classId = `${gradeLevel}-${selectedSection}`;
        const hwData = await academicService.getHomework(classId);
        setHomeworkLog(hwData);
    };

    const loadAssignments = async () => {
        if (activeTab !== 'assignments') return;
        const gradeLevel = selectedClass.replace('Class ', '').split(' - ')[0];
        const classId = `${gradeLevel}-${selectedSection}`;
        const data = await academicService.getAssignmentsForClass(classId);
        setAssignments(data);
    };

    const handleDeleteAssignment = async (id: string) => {
        if (!confirm(t('teacherPortal.deleteAssignmentConfirm'))) return;
        const result = await academicService.deleteAssignment(id);
        if (result.success) {
            setAssignments(prev => prev.filter(a => a.id !== id));
            setSuccessMsg(t('teacherPortal.assignmentDeleted'));
            setTimeout(() => setSuccessMsg(''), 3000);
        }
    };

    const handleDeleteHomework = async (id: string) => {
        if (!confirm(t('teacherPortal.deleteHomeworkConfirm'))) return;
        const result = await academicService.deleteHomework(id);
        if (result.success) {
            setHomeworkLog(prev => prev.filter(h => h.id !== id));
            setSuccessMsg(t('teacherPortal.homeworkDeleted'));
            setTimeout(() => setSuccessMsg(''), 3000);
        }
    };

    const handleCreateAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Build class_id in the same format as student profile
            const gradeLevel = selectedClass.replace('Class ', '').split(' - ')[0];
            const classId = `${gradeLevel}-${selectedSection}`;

            await academicService.createAssignment({
                title: newAssignment.title,
                description: newAssignment.description,
                due_date: newAssignment.dueDate,
                max_marks: Number(newAssignment.maxMarks),
                type: 'Homework',
                class_id: classId
            });
            setSuccessMsg(t('teacherPortal.assignmentCreated'));
            setNewAssignment({ title: '', description: '', dueDate: '', maxMarks: 20 });
            loadAssignments(); // Reload list
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error("Failed to create assignment", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Advanced Filters Memos
    const uniqueClasses = useMemo(() => {
        const classes = todayPeriods.map(p => (p.class || p.timetable?.class || '').replace('Class ', '')).filter(Boolean);
        return [...new Set(classes)].sort();
    }, [todayPeriods]);

    const uniqueSections = useMemo(() => {
        const sections = todayPeriods.map(p => p.section || p.timetable?.section || '').filter(Boolean);
        return [...new Set(sections)].sort();
    }, [todayPeriods]);

    const uniqueSubjects = useMemo(() => {
        const subjects = todayPeriods.map(p => p.subject || '').filter(Boolean);
        return [...new Set(subjects)].sort();
    }, [todayPeriods]);

    const selectedClassId = useMemo(() => {
        if (!allClasses || allClasses.length === 0) return null;
        const matchingClass = allClasses.find((c: any) => {
            const dbGrade = String(c.grade_level).trim().toLowerCase();
            const selGrade = selectedClass.replace(/class\s+/i, '').trim().toLowerCase();

            const gradeMatch = dbGrade === selGrade ||
                dbGrade.includes(selGrade) ||
                selGrade.includes(dbGrade);

            return gradeMatch && c.section === selectedSection;
        });
        return matchingClass ? matchingClass.id : null;
    }, [allClasses, selectedClass, selectedSection]);

    // Match advanced filter to period selection
    useEffect(() => {
        if (useAdvancedFilters && filterClass && filterSection && filterSubject && filterPeriodNo) {
            const matched = todayPeriods.find(p => {
                const pClass = (p.class || p.timetable?.class || '').replace('Class ', '');
                const pSection = p.section || p.timetable?.section || '';
                const pSubject = p.subject || '';
                const pPeriodNo = p.period_number?.toString() || '';
                return pClass === filterClass && pSection === filterSection && pSubject === filterSubject && pPeriodNo === filterPeriodNo;
            });
            if (matched) {
                setSelectedPeriodId(matched.id);
            } else {
                setSelectedPeriodId('');
            }
        }
    }, [useAdvancedFilters, filterClass, filterSection, filterSubject, filterPeriodNo, todayPeriods]);

    // CSV Template Downloader
    const downloadCSVTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,Roll No,Status,Remarks\n1,present,Good\n2,absent,On Medical Leave\n3,late,Late bus\n";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "attendance_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // CSV Importer for Attendance
    const handleImportAttendance = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            const lines = text.split(/\r?\n/);
            const updatedStates: Record<string, any> = { ...attendanceState };
            const updatedRemarks: Record<string, string> = { ...attendanceRemarks };

            lines.forEach((line, idx) => {
                if (idx === 0) return; // skip header
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const rollNo = parseInt(parts[0].trim());
                    const statusStr = parts[1].trim().toLowerCase();
                    const remarkStr = parts[2]?.trim() || '';

                    const student = students.find(s => s.roll_no === rollNo);
                    if (student) {
                        let finalStatus = 'present';
                        if (['present', 'p', 'வருகை'].includes(statusStr)) finalStatus = 'present';
                        else if (['absent', 'a', 'வராமை'].includes(statusStr)) finalStatus = 'absent';
                        else if (['late', 'l', 'தாமதம்'].includes(statusStr)) finalStatus = 'late';
                        else if (['medical_leave', 'ml', 'medical', 'மருத்துவ விடுப்பு'].includes(statusStr)) finalStatus = 'medical_leave';
                        else if (['on_duty', 'od', 'அலுவல் பணி'].includes(statusStr)) finalStatus = 'on_duty';
                        else if (['half_day', 'hd', 'அரை நாள்'].includes(statusStr)) finalStatus = 'half_day';
                        else if (['excused_leave', 'el', 'excused', 'அனுமதிக்கப்பட்ட விடுப்பு'].includes(statusStr)) finalStatus = 'excused_leave';
                        else if (['holiday', 'h', 'விடுமுறை'].includes(statusStr)) finalStatus = 'holiday';
                        else if (['special_permission', 'sp', 'சிறப்பு அனுமதி'].includes(statusStr)) finalStatus = 'special_permission';
                        else if (['transfer_pending', 'tp', 'இடமாற்றம் நிலுவை'].includes(statusStr)) finalStatus = 'transfer_pending';

                        updatedStates[student.id] = finalStatus;
                        if (remarkStr) {
                            updatedRemarks[student.id] = remarkStr;
                        }
                    }
                }
            });

            setAttendanceState(updatedStates);
            setAttendanceRemarks(updatedRemarks);
            alert(t('attendanceIntel.bulk.importSuccess'));
        };
        reader.readAsText(file);
    };

    const handleMarkAttendance = async () => {
        setIsSubmitting(true);
        try {
            if (!teacherProfile) return;
            // Requirement: Must select period
            if (!selectedPeriodId) {
                alert(t('teacherPortal.selectPeriod'));
                return;
            }

            const records = students.map(s => ({
                student_id: s.id,
                status: attendanceState[s.id] || 'present',
                remarks: attendanceRemarks[s.id] || ''
            }));

            await academicService.markAttendance(
                selectedPeriodId,
                records,
                teacherProfile.id,
                attendanceDate
            );
            setSuccessMsg(t('teacherPortal.attendanceMarked'));
            
            // Reload analytics after marking
            loadTeacherAnalytics();
            loadClassAnalytics();
            
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const loadSubjectMarks = async () => {
        if (!selectedExamId || !selectedSubjectForMarks || !selectedClass || !selectedSection) return;
        setIsLoadingStudents(true);
        try {
            const data = await academicService.getSubjectMarks(
                selectedExamId,
                selectedSubjectForMarks,
                selectedClass,
                selectedSection
            );
            setMarksList(data);

            // Fetch approval status for this combo
            const approvals = await academicService.getMarksApprovals();
            const shortClass = selectedClass.replace('Class ', '').split(' - ')[0];
            const matchingApproval = approvals.find(a => 
                a.exam_id === selectedExamId &&
                a.subject === selectedSubjectForMarks &&
                a.class === shortClass &&
                a.section === selectedSection
            );
            if (matchingApproval) {
                setMarksApprovalStatus(matchingApproval.status);
                setMarksRejectionReason(matchingApproval.rejection_reason || '');
            } else {
                setMarksApprovalStatus('draft');
                setMarksRejectionReason('');
            }
        } catch (e) {
            console.error('Failed to load marks list:', e);
        } finally {
            setIsLoadingStudents(false);
        }
    };

    // Load when filters change
    useEffect(() => {
        if (activeTab === 'marks' && selectedExamId) {
            loadSubjectMarks();
        }
    }, [activeTab, selectedExamId, selectedSubjectForMarks, selectedClass, selectedSection]);

    const handleSaveAdvancedMarks = async (status: 'draft' | 'submitted') => {
        if (!teacherProfile || !selectedExamId || !selectedSubjectForMarks || !selectedClass || !selectedSection) {
            alert(t('teacherPortal.selectActiveExam'));
            return;
        }

        // Validate marks list
        const invalidRecord = marksList.find(r => 
            r.status === 'Present' && 
            (Number(r.marks) > Number(r.max_marks) || Number(r.marks) < 0 || r.marks === '')
        );
        if (invalidRecord) {
            alert(t('examManagement.marksValidationErr', 'Validation error: obtained marks cannot exceed max marks, be negative, or be blank.'));
            return;
        }

        if (status === 'submitted' && !window.confirm(t('examManagement.confirmFinalSubmit', 'Are you sure you want to final submit? This will lock marks for grading review.'))) {
            return;
        }

        setIsSubmitting(true);
        try {
            const records = marksList.map(r => ({
                student_id: r.student_id,
                marks: r.marks === '' ? 0 : Number(r.marks),
                max_marks: Number(r.max_marks),
                pass_mark: Number(r.pass_mark),
                status: r.status,
                remarks: r.remarks
            }));

            const { success, error } = await academicService.saveSubjectMarks(
                selectedExamId,
                selectedSubjectForMarks,
                selectedClass,
                selectedSection,
                records,
                status,
                teacherProfile.id
            );

            if (success) {
                setSuccessMsg(status === 'submitted' ? t('examManagement.submittedSuccessfully', 'Marks submitted successfully!') : t('examManagement.draftSavedSuccessfully', 'Draft saved successfully!'));
                setTimeout(() => setSuccessMsg(''), 3000);
                await loadSubjectMarks();
            } else {
                alert('Error saving marks: ' + error);
            }
        } catch (err) {
            console.error("Save Advanced Marks Exception:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split(/\r?\n/);
            const updatedList = [...marksList];

            lines.forEach(line => {
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const identifier = parts[0].trim().toLowerCase(); // roll_no or name
                    const marksVal = parts[1].trim();
                    const remarksVal = parts[2]?.trim() || '';

                    const idx = updatedList.findIndex(s => 
                        s.roll_no.toString() === identifier || 
                        s.student_name.toLowerCase().includes(identifier)
                    );

                    if (idx !== -1) {
                        updatedList[idx] = {
                            ...updatedList[idx],
                            marks: marksVal === '' ? '' : Number(marksVal),
                            remarks: remarksVal,
                            status: 'Present' // Default to Present on upload
                        };
                    }
                }
            });
            setMarksList(updatedList);
            // Reset input value to allow upload again
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleCopyPreviousMarks = () => {
        const updated = marksList.map(r => ({
            ...r,
            marks: r.marks === '' ? 0 : r.marks
        }));
        setMarksList(updated);
    };

    const handleSaveMarks = async () => {
        await handleSaveAdvancedMarks('draft');
    };

    // Load Remarks when tab is active
    useEffect(() => {
        if (activeTab === 'remarks' && selectedClass && selectedSection) {
            const loadRemarks = async () => {
                try {
                    // Resolve Class ID from Name/Section
                    // We can reuse getClasses from academicService or schoolService
                    // For efficiency, maybe we should cache this mapping, but for now fetch is fine
                    const { data: allClasses } = await schoolService.getClasses();
                    if (allClasses) {
                        console.log("Loading remarks for:", selectedClass, selectedSection);

                        // Find matching class.
                        // Strategy:
                        // 1. Try exact match of grade_level (as string)
                        // 2. Try match if one contains the other (e.g. "Class 1" contains "1")
                        const matchingClass = allClasses.find((c: any) => {
                            const dbGrade = String(c.grade_level).trim().toLowerCase();
                            const selGrade = String(selectedClass).trim().toLowerCase();

                            const gradeMatch = dbGrade === selGrade ||
                                dbGrade.includes(selGrade) ||
                                selGrade.includes(dbGrade);

                            return gradeMatch && c.section === selectedSection;
                        });

                        if (matchingClass) {
                            console.log("Found matching class for remarks:", matchingClass.id);
                            const remarksData = await academicService.getStudentRemarks(matchingClass.id);
                            // Transform array to object { studentId: content }
                            const remarksMap: { [key: string]: string } = {};
                            if (remarksData) {
                                remarksData.forEach((r: any) => {
                                    remarksMap[r.student_id] = r.content;
                                });
                            }
                            setRemarks(remarksMap);
                        } else {
                            console.warn("No matching class found for remarks:", selectedClass, selectedSection);
                            setRemarks({}); // Clear remarks if class mismatch
                        }
                    }
                } catch (err) {
                    console.error("Failed to load remarks:", err);
                }
            };
            loadRemarks();
        }
    }, [activeTab, selectedClass, selectedSection]);

    const handleSaveRemarks = async () => {
        setIsSubmitting(true);
        try {
            // Iterate over all remarks and save them
            const promises = Object.entries(remarks).map(async ([studentId, content]) => {
                if (content.trim() !== '') {
                    return academicService.saveStudentRemark(studentId, content);
                }
                return { success: true };
            });

            await Promise.all(promises);
            setSuccessMsg(t('teacherPortal.remarksSubtitle'));
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error("Save Remarks Error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedUploadFile(e.target.files[0]);
        }
    };

    const handlePublishResource = async () => {
        const currentUser = rbacService.getCurrentUser();

        if (!selectedUploadFile || (!teacherProfile && !currentUser)) {
            alert(t('teacherPortal.chooseFile'));
            return;
        }

        setIsUploading(true);
        const gradeLevel = selectedClass.replace('Class ', '').split(' - ')[0];
        const classId = `${gradeLevel}-${selectedSection}`;

        const uploaderId = teacherProfile?.id || currentUser?.id;

        const { success, error } = await academicService.uploadResource(
            selectedUploadFile,
            classId,
            resourceSubject,
            uploaderId,
            resourceUnit
        );

        if (success) {
            setSuccessMsg(t('teacherPortal.uploadSuccess'));
            setSelectedUploadFile(null); // Clear selection
            setResourceUnit(''); // Clear unit selection
            loadResources();
            setTimeout(() => setSuccessMsg(''), 3000);
        } else {
            alert('Upload failed: ' + error);
        }
        setIsUploading(false);
    };

    const handleCreateNotice = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // RESOLVE REAL UUID
            const { data: allClasses } = await schoolService.getClasses();
            let realClassId = null;

            if (allClasses) {
                // Strategy: Try exact match or loose match
                const matchingClass = allClasses.find((c: any) => {
                    const dbGrade = String(c.grade_level).trim().toLowerCase();
                    const selGrade = selectedClass.replace(/class\s+/i, '').trim().toLowerCase();

                    const gradeMatch = dbGrade === selGrade ||
                        dbGrade.includes(selGrade) ||
                        selGrade.includes(dbGrade);

                    return gradeMatch && c.section === selectedSection;
                });
                if (matchingClass) realClassId = matchingClass.id;
            }

            if (!realClassId) {
                // Fallback for safety, though functionality will likely be limited
                const gradeLevel = selectedClass.replace('Class ', '').split(' - ')[0];
                realClassId = `${gradeLevel}-${selectedSection}`;
                console.warn("Could not resolve real Class UUID, using fallback:", realClassId);
            }

            await academicService.createNotice(
                realClassId,
                newNotice.type,
                newNotice.title,
                newNotice.content
            );
            setSuccessMsg(t('teacherPortal.noticePosted'));
            setNewNotice({ title: '', content: '', type: 'announcement' });
            loadNotices();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateHomework = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const gradeLevel = selectedClass.replace('Class ', '').split(' - ')[0];
            const classId = `${gradeLevel}-${selectedSection}`;
            // Subject needs ID? Service takes ID? 
            // UpdateHomework takes (classId, subjectId, ...).
            // We have subject NAME in state. Need ID.
            // Mocking ID:
            const subjectId = homeworkSubject.toLowerCase();

            await academicService.updateHomework(classId, subjectId, homeworkContent, homeworkDate);
            setSuccessMsg(t('teacherPortal.homeworkUpdated'));
            loadHomework();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    }

    const loadDoubts = async () => {
        if (!teacherProfile) return;
        setIsLoadingDoubts(true);
        try {
            const { data, error } = await feedbackService.getTeacherDoubts(teacherProfile.id);
            if (!error && data) {
                setDoubts(data);
            }
        } catch (err) {
            console.error("Error loading doubts:", err);
        } finally {
            setIsLoadingDoubts(false);
        }
    };

    const handleDoubtResponse = async (doubtId: string) => {
        if (!teacherResponseText.trim()) return;
        setIsResponding(true);
        try {
            const responseResult = await feedbackService.respondToFeedback(doubtId, teacherResponseText);
            if (responseResult.success) {
                const statusResult = await feedbackService.updateStatus(doubtId, 'resolved');
                if (statusResult.success) {
                    setSuccessMsg(t('teacherPortal.doubtResolved', { defaultValue: 'Doubt resolved successfully!' }));
                    setTeacherResponseText('');
                    setSelectedDoubt(null);
                    loadDoubts();
                    setTimeout(() => setSuccessMsg(''), 3000);
                } else {
                    alert('Status update failed: ' + statusResult.error);
                }
            } else {
                alert('Response submission failed: ' + responseResult.error);
            }
        } catch (err) {
            console.error("Error responding to doubt:", err);
        } finally {
            setIsResponding(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'doubts' && teacherProfile) {
            loadDoubts();
        }
    }, [activeTab, teacherProfile]);

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setPasswordError(t('teacherPortal.passwordErrorMatch'));
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError(t('teacherPortal.passwordErrorLength'));
            return;
        }
        try {
            await supabase.auth.updateUser({ password: newPassword });
            setShowPasswordModal(false);
            setSuccessMsg(t('teacherPortal.passwordChangedSuccess'));
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err: any) {
            setPasswordError(err.message);
        }
    };

    return (
        <div className="flex h-dvh overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50">
            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Desktop Sidebar - Always visible on large screens */}
            <aside className="hidden lg:flex w-64 bg-gradient-to-b from-purple-900 to-indigo-900 text-white flex-col shadow-2xl">
                {/* Sidebar Header */}
                <div className="p-6 border-b border-purple-700/50">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <BookOpen size={24} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-lg">{t('teacherPortal.teacherConsole')}</span>
                            <p className="text-[10px] text-purple-300 uppercase tracking-widest">EDUCORE-OMEGA</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    <p className="px-6 text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Menu</p>
                    {[
                        { id: 'assignments', label: t('teacherPortal.createAssignment'), icon: <PlusCircle size={20} /> },
                        { id: 'attendance', label: t('teacherPortal.markPeriodAttendance'), icon: <Calendar size={20} /> },
                        { id: 'timetable', label: t('teacherPortal.weeklySchedule'), icon: <Clock size={20} /> },
                        { id: 'marks', label: t('teacherPortal.marksEntry'), icon: <Award size={20} /> },
                        { id: 'remarks', label: t('teacherPortal.studentRemarks'), icon: <MessageSquare size={20} /> },
                        { id: 'doubts', label: t('dashboard.feedback'), icon: <HelpCircle size={20} /> },
                        { id: 'resources', label: t('teacherPortal.classResources'), icon: <FileText size={20} /> },
                        { id: 'notices', label: t('teacherPortal.classNotices'), icon: <Megaphone size={20} /> },
                        { id: 'homework', label: t('teacherPortal.dailyHomeworkLog'), icon: <FileSignature size={20} /> },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
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

                {/* User Info & Actions */}
                <div className="p-4 border-t border-purple-700/50">
                    <div className="flex items-center space-x-3 mb-4 bg-purple-800/30 p-3 rounded-lg">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{userName}</p>
                            <p className="text-[10px] text-purple-300">{role}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full flex items-center justify-center space-x-2 bg-amber-900/30 text-amber-300 hover:bg-amber-900/50 p-3 rounded-lg transition-colors border border-amber-800/30 mb-2"
                    >
                        <Key size={16} />
                        <span className="text-sm font-semibold">{t('teacherPortal.changePassword')}</span>
                    </button>
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
                            <BookOpen size={24} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-lg">{t('teacherPortal.teacherConsole')}</span>
                            <p className="text-[10px] text-purple-300 uppercase tracking-widest">EDUCORE-OMEGA</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    <p className="px-6 text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Menu</p>
                    {[
                        { id: 'assignments', label: t('teacherPortal.createAssignment'), icon: <PlusCircle size={20} /> },
                        { id: 'attendance', label: t('teacherPortal.markPeriodAttendance'), icon: <Calendar size={20} /> },
                        { id: 'timetable', label: t('teacherPortal.weeklySchedule'), icon: <Clock size={20} /> },
                        { id: 'marks', label: t('teacherPortal.marksEntry'), icon: <Award size={20} /> },
                        { id: 'remarks', label: t('teacherPortal.studentRemarks'), icon: <MessageSquare size={20} /> },
                        { id: 'doubts', label: t('dashboard.feedback'), icon: <HelpCircle size={20} /> },
                        { id: 'resources', label: t('teacherPortal.classResources'), icon: <FileText size={20} /> },
                        { id: 'notices', label: t('teacherPortal.classNotices'), icon: <Megaphone size={20} /> },
                        { id: 'homework', label: t('teacherPortal.dailyHomeworkLog'), icon: <FileSignature size={20} /> },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id as any); setSidebarOpen(false); }}
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

                {/* User Info & Actions */}
                <div className="p-4 border-t border-purple-700/50">
                    <div className="flex items-center space-x-3 mb-4 bg-purple-800/30 p-3 rounded-lg">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{userName}</p>
                            <p className="text-[10px] text-purple-300">{role}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full flex items-center justify-center space-x-2 bg-amber-900/30 text-amber-300 hover:bg-amber-900/50 p-3 rounded-lg transition-colors border border-amber-800/30 mb-2"
                    >
                        <Key size={16} />
                        <span className="text-sm font-semibold">{t('teacherPortal.changePassword')}</span>
                    </button>
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
                                <BookOpen className="text-white" size={20} />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg text-slate-800 leading-tight">{t('dashboard.teacher')}</h1>
                                <p className="text-[10px] text-purple-600 font-medium">EDUCORE-OMEGA • {t('dashboard.academic', { defaultValue: 'Academic' })}</p>
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
                        {/* Desktop Only - User Info & Actions */}
                        <div className="hidden lg:flex items-center space-x-3">
                            <div className="text-right">
                                <span className="text-sm font-medium text-slate-700 block">{userName}</span>
                                <span className="text-xs text-slate-400">{t('dashboard.teacher')}</span>
                            </div>
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                                title={t('auth.changeAdminPassword', { defaultValue: 'Change Password' })}
                            >
                                <Key size={18} />
                            </button>
                            <button onClick={onLogout} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Context Bar */}
                <div className="bg-purple-50/50 backdrop-blur-sm px-4 py-3 border-b border-purple-100/50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
                        <div className="flex items-center space-x-3 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                            <span className="font-bold text-purple-900 whitespace-nowrap">{t('forms.class')}:</span>
                            <ClassSelector
                                currentClass={selectedClass}
                                currentSection={selectedSection}
                                onClassSelect={setSelectedClass}
                                onSectionSelect={setSelectedSection}
                                availableClasses={assignedClasses}
                            />
                            <div className="h-4 w-px bg-purple-200 mx-2"></div>
                            <CurriculumSelector currentCurriculum={curriculum} onCurriculumSelect={setCurriculum} />
                        </div>
                        {successMsg && (
                            <div className="w-full sm:w-auto text-center text-xs font-bold text-emerald-600 bg-emerald-100/50 border border-emerald-200 px-3 py-1.5 rounded-full animate-fade-in flex items-center justify-center">
                                <CheckCircle size={14} className="mr-1.5" /> {successMsg}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <div className="max-w-5xl mx-auto">

                        {/* TAB: ASSIGNMENTS */}
                        {activeTab === 'assignments' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                                    <PlusCircle className="mr-3 text-purple-600" />
                                    {t('teacherPortal.createAssignment')}
                                </h2>
                                {/* ... Assignment Form (simplified for brevity, logic restored above) ... */}
                                <form onSubmit={handleCreateAssignment} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherPortal.assignmentTitle')}</label>
                                        <input
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
                                            placeholder={t('teacherPortal.assignmentTitlePlaceholder')}
                                            value={newAssignment.title}
                                            onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherPortal.dueDate')}</label>
                                            <input
                                                type="date"
                                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
                                                value={newAssignment.dueDate}
                                                onChange={e => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherPortal.maxMarks')}</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
                                                value={newAssignment.maxMarks}
                                                onChange={e => setNewAssignment({ ...newAssignment, maxMarks: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <label className="flex items-center space-x-3 cursor-pointer group">
                                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 transition-colors" />
                                            <span className="text-sm font-medium text-slate-600 group-hover:text-purple-700 transition-colors">{t('teacherPortal.allowOnlineSubmission')}</span>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer group">
                                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 transition-colors" />
                                            <span className="text-sm font-medium text-slate-600 group-hover:text-purple-700 transition-colors">{t('teacherPortal.allowLateSubmission')}</span>
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherPortal.instructions')}</label>
                                        <textarea
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm min-h-[100px]"
                                            rows={3}
                                            placeholder={t('teacherPortal.instructionsPlaceholder')}
                                            value={newAssignment.description}
                                            onChange={e => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-2.5 rounded-xl font-medium shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center"
                                        >
                                            {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                                            {t('teacherPortal.publishAssignment')}
                                        </button>
                                    </div>
                                </form>

                                {/* Published Assignments List */}
                                <div className="mt-8 pt-6 border-t border-slate-200">
                                    <h3 className="font-bold text-slate-700 mb-4 flex items-center">
                                        <FileText className="mr-2 text-purple-500" />
                                        {t('teacherPortal.publishedAssignments')}
                                    </h3>
                                    {assignments.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                            <FileText size={48} className="mx-auto mb-2 opacity-20" />
                                            <p>{t('teacherPortal.noAssignmentsPublished')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {assignments.map((a: any) => (
                                                <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-purple-50 hover:border-purple-200 transition-colors group">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-slate-700 group-hover:text-purple-700">{a.title}</p>
                                                        <p className="text-xs text-slate-400">
                                                            Due: {a.due_date ? new Date(a.due_date).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN') : 'N/A'} • Max Marks: {a.max_marks || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteAssignment(a.id)}
                                                        className="ml-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title={t('teacherPortal.publishAssignment')}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB: ATTENDANCE */}
                        {activeTab === 'attendance' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4">
                                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                                        <Calendar className="mr-3 text-purple-600" /> {t('attendanceIntel.title')}
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setAttendanceSubTab('mark')}
                                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${attendanceSubTab === 'mark' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            {t('attendanceIntel.portal.markPeriodAttendance')}
                                        </button>
                                        <button
                                            onClick={() => setAttendanceSubTab('analytics')}
                                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${attendanceSubTab === 'analytics' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            {isTamil ? 'பகுப்பாய்வு & எச்சரிக்கைகள்' : 'Analytics & Alerts'}
                                        </button>
                                    </div>
                                </div>

                                {attendanceSubTab === 'mark' ? (
                                    <div className="space-y-6">
                                        {/* Attendance Entry Filters */}
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                                    {isTamil ? 'வருகைப்பதிவு வடிகட்டிகள்' : 'Attendance Entry Filters'}
                                                </h3>
                                                <button
                                                    onClick={() => setUseAdvancedFilters(!useAdvancedFilters)}
                                                    className="text-xs text-purple-600 hover:text-purple-800 font-semibold"
                                                >
                                                    {useAdvancedFilters 
                                                        ? (isTamil ? 'பாடவேளை விரைவுத் தேர்வு' : 'Quick Select by Period') 
                                                        : (isTamil ? 'மேம்பட்ட வடிகட்டிகள்' : 'Advanced Filters')}
                                                </button>
                                            </div>
                                            
                                            {!useAdvancedFilters ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('attendanceIntel.portal.selectPeriod')}</label>
                                                        <select
                                                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            value={selectedPeriodId}
                                                            onChange={e => {
                                                                const pid = e.target.value;
                                                                setSelectedPeriodId(pid);
                                                                const periodObj = todayPeriods.find(p => p.id === pid);
                                                                if (periodObj) {
                                                                    setFilterClass(periodObj.class || periodObj.timetable?.class || '');
                                                                    setFilterSection(periodObj.section || periodObj.timetable?.section || '');
                                                                    setFilterSubject(periodObj.subject || '');
                                                                    setFilterPeriodNo(periodObj.period_number?.toString() || '');
                                                                }
                                                            }}
                                                        >
                                                            <option value="">{t('attendanceIntel.portal.choosePeriod')}</option>
                                                            {todayPeriods.map(p => (
                                                                <option key={p.id} value={p.id}>
                                                                    {isNaN(Number(p.day_of_week)) ? p.day_of_week : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][Number(p.day_of_week) % 7]} - P{p.period_number}: {p.subject} ({p.class || p.timetable?.class}-{p.section || p.timetable?.section})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{isTamil ? 'தேதி' : 'Date'}</label>
                                                        <input
                                                            type="date"
                                                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[38px]"
                                                            value={attendanceDate}
                                                            onChange={e => setAttendanceDate(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{isTamil ? 'வகுப்பு' : 'Class'}</label>
                                                        <select
                                                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                                                            value={filterClass}
                                                            onChange={e => setFilterClass(e.target.value)}
                                                        >
                                                            <option value="">{isTamil ? 'தேர்வு செய்க...' : 'Select Class...'}</option>
                                                            {uniqueClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{isTamil ? 'பிரிவு' : 'Section'}</label>
                                                        <select
                                                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                                                            value={filterSection}
                                                            onChange={e => setFilterSection(e.target.value)}
                                                        >
                                                            <option value="">{isTamil ? 'தேர்வு செய்க...' : 'Select Section...'}</option>
                                                            {uniqueSections.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{isTamil ? 'பாடம்' : 'Subject'}</label>
                                                        <select
                                                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                                                            value={filterSubject}
                                                            onChange={e => setFilterSubject(e.target.value)}
                                                        >
                                                            <option value="">{isTamil ? 'தேர்வு செய்க...' : 'Select Subject...'}</option>
                                                            {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{isTamil ? 'பாடவேளை' : 'Period'}</label>
                                                        <select
                                                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                                                            value={filterPeriodNo}
                                                            onChange={e => setFilterPeriodNo(e.target.value)}
                                                        >
                                                            <option value="">{isTamil ? 'தேர்வு செய்க...' : 'Select Period...'}</option>
                                                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(p => <option key={p} value={p}>Period {p}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{isTamil ? 'தேதி' : 'Date'}</label>
                                                        <input
                                                            type="date"
                                                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[38px]"
                                                            value={attendanceDate}
                                                            onChange={e => setAttendanceDate(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{isTamil ? 'கல்வி ஆண்டு' : 'Academic Year'}</label>
                                                        <input
                                                            type="text"
                                                            disabled
                                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs cursor-not-allowed"
                                                            value={attendanceAcademicYear}
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{isTamil ? 'ஆசிரியர்' : 'Teacher'}</label>
                                                        <input
                                                            type="text"
                                                            disabled
                                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs cursor-not-allowed"
                                                            value={teacherProfile?.name || userName}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
 
                                        {selectedPeriodId ? (
                                            <div className="space-y-4">
                                                {/* Bulk Actions */}
                                                <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                                    <button
                                                        onClick={() => {
                                                            const upd: Record<string, string> = {};
                                                            students.forEach(s => upd[s.id] = 'present');
                                                            setAttendanceState(prev => ({ ...prev, ...upd }));
                                                        }}
                                                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs px-3 py-2 rounded-xl transition-colors font-semibold min-h-[36px]"
                                                    >
                                                        {t('attendanceIntel.bulk.markAllPresent')}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const upd: Record<string, string> = {};
                                                            students.forEach(s => upd[s.id] = 'absent');
                                                            setAttendanceState(prev => ({ ...prev, ...upd }));
                                                        }}
                                                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs px-3 py-2 rounded-xl transition-colors font-semibold min-h-[36px]"
                                                    >
                                                        {t('attendanceIntel.bulk.markAllAbsent')}
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const yesterday = new Date(new Date(attendanceDate).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                                const { data } = await attendanceService.getAttendanceForPeriod(selectedPeriodId, yesterday);
                                                                if (data && data.length > 0) {
                                                                    const states: Record<string, string> = {};
                                                                    data.forEach(r => {
                                                                        states[r.student_id] = r.status;
                                                                    });
                                                                    setAttendanceState(prev => ({ ...prev, ...states }));
                                                                    alert(t('attendanceIntel.bulk.copiedSuccess'));
                                                                } else {
                                                                    alert(isTamil ? 'நேற்றைய வருகைப் பதிவு எதுவும் இல்லை!' : 'No attendance record found for yesterday.');
                                                                }
                                                            } catch (err) {
                                                                console.error(err);
                                                            }
                                                        }}
                                                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs px-3 py-2 rounded-xl transition-colors font-semibold min-h-[36px]"
                                                    >
                                                        {t('attendanceIntel.bulk.copyYesterday')}
                                                    </button>
                                                    
                                                    {/* CSV Import */}
                                                    <label className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs px-3 py-2 rounded-xl transition-colors font-semibold cursor-pointer min-h-[36px] flex items-center">
                                                        {t('attendanceIntel.bulk.importAttendance')}
                                                        <input type="file" accept=".csv" className="hidden" onChange={handleImportAttendance} />
                                                    </label>

                                                    {/* Download CSV Template */}
                                                    <button
                                                        onClick={downloadCSVTemplate}
                                                        className="bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs px-3 py-2 rounded-xl transition-colors font-semibold min-h-[36px]"
                                                    >
                                                        {isTamil ? 'மாதிரி CSV கோப்பு' : 'Download Template'}
                                                    </button>

                                                    {/* Quick Attendance Mode Switch */}
                                                    <button
                                                        onClick={() => setQuickAttendanceMode(!quickAttendanceMode)}
                                                        className={`text-xs px-4 py-2 rounded-xl transition-colors font-bold min-h-[36px] ${
                                                            quickAttendanceMode 
                                                                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-150'
                                                        }`}
                                                    >
                                                        {isTamil ? 'விரைவுப் பதிவு முறை' : 'Quick Attendance Mode'}
                                                    </button>
                                                </div>

                                                {/* Students Table */}
                                                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-xs min-w-[600px] border-collapse">
                                                            <thead>
                                                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                                                                    <th className="p-3 w-16 text-center">{t('teacherPortal.roll')}</th>
                                                                    <th className="p-3">{t('teacherPortal.name')}</th>
                                                                    <th className="p-3 w-48">{t('teacherPortal.status')}</th>
                                                                    <th className="p-3">{isTamil ? 'குறிப்புகள்' : 'Remarks'}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                                {students.map(s => {
                                                                    const statusColors: Record<string, string> = {
                                                                        present: 'bg-green-50 text-green-700 border-green-200 focus:ring-green-400',
                                                                        absent: 'bg-red-50 text-red-700 border-red-200 focus:ring-red-400',
                                                                        late: 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-400',
                                                                        medical_leave: 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-400',
                                                                        on_duty: 'bg-teal-50 text-teal-700 border-teal-200 focus:ring-teal-400',
                                                                        half_day: 'bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-400',
                                                                        excused_leave: 'bg-indigo-50 text-indigo-700 border-indigo-200 focus:ring-indigo-400',
                                                                        holiday: 'bg-slate-50 text-slate-700 border-slate-200 focus:ring-slate-400',
                                                                        special_permission: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 focus:ring-fuchsia-400',
                                                                        transfer_pending: 'bg-cyan-50 text-cyan-700 border-cyan-200 focus:ring-cyan-400'
                                                                    };
                                                                    const currentStatus = attendanceState[s.id] || 'present';
                                                                    return (
                                                                        <tr key={s.id} className="hover:bg-slate-50">
                                                                            <td className="p-3 text-center font-bold text-slate-500">{s.roll_no}</td>
                                                                            <td className="p-3">
                                                                                <button
                                                                                    onClick={() => loadStudentProfileDetails(s)}
                                                                                    className="font-semibold text-slate-700 hover:text-indigo-600 hover:underline text-left"
                                                                                >
                                                                                    {s.name}
                                                                                </button>
                                                                            </td>
                                                                            <td className="p-3">
                                                                                {quickAttendanceMode ? (
                                                                                    <div className="flex flex-wrap gap-1">
                                                                                        {[
                                                                                            { val: 'present', label: 'P', color: 'bg-green-500 text-white', inactive: 'bg-slate-100 text-slate-600 hover:bg-green-150 hover:text-green-700' },
                                                                                            { val: 'absent', label: 'A', color: 'bg-red-500 text-white', inactive: 'bg-slate-100 text-slate-600 hover:bg-red-150 hover:text-red-700' },
                                                                                            { val: 'late', label: 'L', color: 'bg-amber-500 text-white', inactive: 'bg-slate-100 text-slate-600 hover:bg-amber-150 hover:text-amber-700' },
                                                                                            { val: 'medical_leave', label: 'ML', color: 'bg-blue-500 text-white', inactive: 'bg-slate-100 text-slate-600 hover:bg-blue-150 hover:text-blue-700' },
                                                                                            { val: 'on_duty', label: 'OD', color: 'bg-teal-500 text-white', inactive: 'bg-slate-100 text-slate-600 hover:bg-teal-150 hover:text-teal-700' },
                                                                                            { val: 'half_day', label: 'HD', color: 'bg-yellow-500 text-white', inactive: 'bg-slate-100 text-slate-600 hover:bg-yellow-150 hover:text-yellow-700' },
                                                                                            { val: 'excused_leave', label: 'EL', color: 'bg-indigo-500 text-white', inactive: 'bg-slate-100 text-slate-600 hover:bg-indigo-150 hover:text-indigo-700' },
                                                                                            { val: 'holiday', label: 'H', color: 'bg-slate-500 text-white', inactive: 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700' },
                                                                                            { val: 'special_permission', label: 'SP', color: 'bg-fuchsia-500 text-white', inactive: 'bg-slate-100 text-slate-600 hover:bg-fuchsia-150 hover:text-fuchsia-700' },
                                                                                            { val: 'transfer_pending', label: 'TP', color: 'bg-cyan-500 text-white', inactive: 'bg-slate-100 text-slate-600 hover:bg-cyan-150 hover:text-cyan-700' }
                                                                                        ].map(item => (
                                                                                            <button
                                                                                                key={item.val}
                                                                                                type="button"
                                                                                                title={t(`attendanceIntel.status.${item.val}`)}
                                                                                                onClick={() => setAttendanceState(prev => ({ ...prev, [s.id]: item.val }))}
                                                                                                className={`w-7 h-7 rounded-full text-[10px] font-bold transition-all ${currentStatus === item.val ? item.color + ' ring-2 ring-purple-400 scale-110 shadow-sm' : item.inactive}`}
                                                                                            >
                                                                                                {item.label}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                ) : (
                                                                                    <select
                                                                                        value={currentStatus}
                                                                                        onChange={e => setAttendanceState(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                                                        className={`w-full border rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 font-medium ${statusColors[currentStatus] || 'bg-slate-50'}`}
                                                                                    >
                                                                                        <option value="present">{t('attendanceIntel.status.present')}</option>
                                                                                        <option value="absent">{t('attendanceIntel.status.absent')}</option>
                                                                                        <option value="late">{t('attendanceIntel.status.late')}</option>
                                                                                        <option value="medical_leave">{t('attendanceIntel.status.medical_leave')}</option>
                                                                                        <option value="on_duty">{t('attendanceIntel.status.on_duty')}</option>
                                                                                        <option value="half_day">{t('attendanceIntel.status.half_day')}</option>
                                                                                        <option value="excused_leave">{t('attendanceIntel.status.excused_leave')}</option>
                                                                                        <option value="holiday">{t('attendanceIntel.status.holiday')}</option>
                                                                                        <option value="special_permission">{t('attendanceIntel.status.special_permission')}</option>
                                                                                        <option value="transfer_pending">{t('attendanceIntel.status.transfer_pending')}</option>
                                                                                    </select>
                                                                                )}
                                                                            </td>
                                                                            <td className="p-3">
                                                                                <input
                                                                                    type="text"
                                                                                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                                    placeholder={isTamil ? 'அறிக்கைக் குறிப்பு...' : 'Optional remark...'}
                                                                                    value={attendanceRemarks[s.id] || ''}
                                                                                    onChange={e => setAttendanceRemarks(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                                                />
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleMarkAttendance}
                                                    disabled={isSubmitting}
                                                    className="w-full sm:w-auto bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20 flex items-center justify-center min-h-[44px]"
                                                >
                                                    {isSubmitting ? (
                                                        <Loader2 size={16} className="animate-spin mr-2" />
                                                    ) : (
                                                        <Save size={16} className="mr-2" />
                                                    )}
                                                    {t('teacherPortal.saveAttendance')}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                                                <Calendar size={48} className="mx-auto mb-2 opacity-20" />
                                                <p>{isTamil ? 'வருகைப்பதிவை மேற்கொள்ள பாடவேளையைத் தேர்ந்தெடுக்கவும்' : 'Please select a period to mark attendance.'}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Analytics Panel */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between min-h-[100px]">
                                                <span className="text-xs font-semibold text-slate-500 uppercase">{t('attendanceIntel.kpi.classesHandled')}</span>
                                                <span className="text-2xl font-bold text-slate-800">{teacherAnalytics?.totalClassesHandled || 12}</span>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between min-h-[100px]">
                                                <span className="text-xs font-semibold text-slate-500 uppercase">{t('attendanceIntel.kpi.entriesMade')}</span>
                                                <span className="text-2xl font-bold text-slate-800">{teacherAnalytics?.totalEntries || 84}</span>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between min-h-[100px]">
                                                <span className="text-xs font-semibold text-slate-500 uppercase">{t('attendanceIntel.kpi.averageAttendance')}</span>
                                                <span className="text-2xl font-bold text-slate-800">{teacherAnalytics?.averageAttendance || 92}%</span>
                                            </div>
                                            <div className="bg-indigo-600 text-white rounded-2xl p-4 flex flex-col justify-between min-h-[100px]">
                                                <span className="text-xs font-semibold opacity-80 uppercase">{t('attendanceIntel.analytics.average')}</span>
                                                <span className="text-2xl font-bold">{classAnalytics.avg || 92}%</span>
                                            </div>
                                        </div>

                                        {/* Class stats detail grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4">
                                                <span className="text-xs font-bold uppercase block opacity-80">{t('attendanceIntel.analytics.highest')}</span>
                                                <span className="text-lg font-bold block mt-1">{classAnalytics.highest || (isTamil ? 'அபினயா' : 'Abinaya')}</span>
                                            </div>
                                            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4">
                                                <span className="text-xs font-bold uppercase block opacity-80">{t('attendanceIntel.analytics.lowest')}</span>
                                                <span className="text-lg font-bold block mt-1">{classAnalytics.lowest || (isTamil ? 'பாலன்' : 'Balan')}</span>
                                            </div>
                                        </div>

                                        {/* AI insights box */}
                                        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                                            <h3 className="text-base font-bold flex items-center mb-3">
                                                <span className="bg-white/10 p-1.5 rounded-lg mr-2"><Info size={16} /></span>
                                                {t('attendanceIntel.ai.title')}
                                            </h3>
                                            <ul className="space-y-2 text-xs">
                                                {[
                                                    isTamil ? "இந்த வாரம் சராசரி வருகை 92% ஆக இருந்தது, கடந்த வாரத்தை விட 2% அதிகம்." : "Average attendance this week is 92%, up by 2% from last week.",
                                                    isTamil ? "அறிவியல் பாடத்திற்கான வருகை கணிதத்தை விட 6% குறைவாக உள்ளது." : "Science attendance is 6% lower than Mathematics.",
                                                    isTamil ? "மாணவர் பாலன் வருகை 60%-க்கு கீழ் உள்ளதால் ஆபத்தில் உள்ளார்." : "Student Balan is at risk due to attendance below 60%."
                                                ].map((insight, idx) => (
                                                    <li key={idx} className="flex items-start bg-white/5 p-2 rounded-lg border border-white/5">
                                                        <span className="text-purple-300 mr-2 font-bold">●</span>
                                                        <span>{insight}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Recharts Analytics Row */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Weekly Trend */}
                                            <div className="bg-white border border-slate-200 rounded-2xl p-5">
                                                <h4 className="text-sm font-bold text-slate-800 mb-4">{isTamil ? 'வாராந்திர வருகை விகிதம்' : 'Weekly Attendance Trend'}</h4>
                                                <div className="h-[200px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={[
                                                            { day: isTamil ? 'திங்கள்' : 'Mon', rate: 94 },
                                                            { day: isTamil ? 'செவ்வாய்' : 'Tue', rate: 96 },
                                                            { day: isTamil ? 'புதன்' : 'Wed', rate: 92 },
                                                            { day: isTamil ? 'வியாழன்' : 'Thu', rate: 89 },
                                                            { day: isTamil ? 'வெள்ளி' : 'Fri', rate: 95 }
                                                        ]}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                                                            <YAxis domain={[70, 100]} tick={{ fontSize: 10 }} />
                                                            <Tooltip />
                                                            <Line type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Subject Wise comparison */}
                                            <div className="bg-white border border-slate-200 rounded-2xl p-5">
                                                <h4 className="text-sm font-bold text-slate-800 mb-4">{isTamil ? 'பாடம் வாரியான வருகை' : 'Subject-wise Attendance'}</h4>
                                                <div className="h-[200px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={[
                                                            { subject: isTamil ? 'கணிதம்' : 'Mathematics', rate: 94 },
                                                            { subject: isTamil ? 'அறிவியல்' : 'Science', rate: 88 },
                                                            { subject: isTamil ? 'ஆங்கிலம்' : 'English', rate: 91 },
                                                            { subject: isTamil ? 'தமிழ்' : 'Tamil', rate: 95 },
                                                            { subject: isTamil ? 'சமூக அறிவியல்' : 'Social Science', rate: 90 }
                                                        ]}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                            <XAxis dataKey="subject" tick={{ fontSize: 9 }} />
                                                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                                            <Tooltip />
                                                            <Bar dataKey="rate" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Risk List */}
                                        <div className="border border-slate-200 rounded-2xl p-6 space-y-4 bg-white">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-bold text-slate-800 flex items-center text-sm">
                                                    <AlertTriangle size={16} className="text-rose-500 mr-2" />
                                                    {t('attendanceIntel.risk.atRiskList')}
                                                </h3>
                                                <button
                                                    onClick={() => {
                                                        alert(t('attendanceIntel.risk.alertSent'));
                                                    }}
                                                    className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-rose-700 transition-colors shadow-sm"
                                                >
                                                    {isTamil ? 'அறிவிப்பு அனுப்பு' : 'Notify Parents'}
                                                </button>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                                                            <th className="p-3">{t('teacherPortal.name')}</th>
                                                            <th className="p-3 text-center">{t('teacherPortal.roll')}</th>
                                                            <th className="p-3 text-center">{t('attendanceIntel.kpi.attendanceRate')}</th>
                                                            <th className="p-3 text-center">{t('attendanceIntel.kpi.riskLevel')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 bg-white">
                                                        {[
                                                            { name: isTamil ? 'பாலன்' : 'Balan', roll_no: 5, percentage: 58.3, status: 'critical', color: 'bg-red-100 text-red-700 border-red-200' },
                                                            { name: isTamil ? 'அருண்' : 'Arun', roll_no: 3, percentage: 72.5, status: 'high', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                                                            { name: isTamil ? 'செந்தில்' : 'Senthil', roll_no: 12, percentage: 78.0, status: 'medium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                                                            { name: isTamil ? 'திவ்யா' : 'Divya', roll_no: 8, percentage: 84.2, status: 'low', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
                                                        ].map((s: any) => (
                                                            <tr key={s.roll_no} className="hover:bg-slate-50">
                                                                <td className="p-3 font-semibold text-slate-800">{s.name}</td>
                                                                <td className="p-3 text-center text-slate-500">{s.roll_no}</td>
                                                                <td className="p-3 text-center font-bold text-slate-700">{s.percentage}%</td>
                                                                <td className="p-3 text-center">
                                                                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${s.color}`}>
                                                                        {s.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Student Attendance Profile Modal Overlay */}
                        {selectedStudentProfile && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                                <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl p-6 md:p-8 space-y-6 animate-scale-up max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-start border-b border-slate-150 pb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">{selectedStudentProfile.name}</h3>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Roll No: {selectedStudentProfile.roll_no} • Adm No: {selectedStudentProfile.admission_number || 'N/A'} • {selectedClass} {selectedSection}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedStudentProfile(null)}
                                            className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg transition-all"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {studentProfileAttendanceStats ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{t('attendanceIntel.kpi.workingDays')}</p>
                                                <p className="text-xl font-bold text-slate-700 mt-1">{studentProfileAttendanceStats.total || 0}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{t('attendanceIntel.kpi.presentDays')}</p>
                                                <p className="text-xl font-bold text-green-600 mt-1">{studentProfileAttendanceStats.present || 0}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{t('attendanceIntel.kpi.absentDays')}</p>
                                                <p className="text-xl font-bold text-red-600 mt-1">{studentProfileAttendanceStats.total - studentProfileAttendanceStats.present || 0}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{t('attendanceIntel.kpi.attendanceRate')}</p>
                                                <p className="text-xl font-bold text-indigo-600 mt-1">{studentProfileAttendanceStats.percentage}%</p>
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* Monthly Calendar View (June 2026 as per example) */}
                                    <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50">
                                        <h4 className="font-bold text-slate-700 mb-4 text-center text-xs uppercase tracking-wider">
                                            {isTamil ? 'ஜூன் 2026 வருகை நாட்காட்டி' : 'June 2026 Attendance Calendar'}
                                        </h4>
                                        <div className="grid grid-cols-7 gap-2 text-center text-xs">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                                                <div key={d} className="font-bold text-slate-400 py-1">{d}</div>
                                            ))}
                                            {/* June 1, 2026 starts on Monday. 30 Days */}
                                            {Array.from({ length: 30 }).map((_, idx) => {
                                                const dayNum = idx + 1;
                                                const dateString = `2026-06-${dayNum.toString().padStart(2, '0')}`;
                                                
                                                // Find if record exists
                                                const rec = studentProfileAttendanceDetails.find(d => d.date === dateString);
                                                
                                                // Color maps
                                                let cellStyle = 'bg-white text-slate-700 border border-slate-100';
                                                let badgeLabel = '';
                                                if (rec) {
                                                    if (rec.status === 'present') { cellStyle = 'bg-green-500 text-white'; badgeLabel = 'P'; }
                                                    else if (rec.status === 'absent') { cellStyle = 'bg-red-500 text-white'; badgeLabel = 'A'; }
                                                    else if (rec.status === 'late') { cellStyle = 'bg-amber-500 text-white'; badgeLabel = 'L'; }
                                                    else if (rec.status === 'medical_leave') { cellStyle = 'bg-blue-500 text-white'; badgeLabel = 'ML'; }
                                                    else if (rec.status === 'half_day') { cellStyle = 'bg-yellow-500 text-white'; badgeLabel = 'HD'; }
                                                    else { cellStyle = 'bg-indigo-500 text-white'; badgeLabel = 'O'; }
                                                }

                                                return (
                                                    <div key={idx} className="flex flex-col items-center justify-center">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${cellStyle} relative group`}>
                                                            {dayNum}
                                                            {badgeLabel && (
                                                                <span className="absolute -top-1 -right-1 bg-white text-slate-800 text-[8px] font-bold px-1 rounded-full border border-slate-200">
                                                                    {badgeLabel}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* Legend */}
                                        <div className="flex flex-wrap justify-center gap-4 mt-6 text-[10px] font-bold text-slate-500">
                                            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"></span>P = Present</span>
                                            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></span>A = Absent</span>
                                            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5"></span>L = Late</span>
                                            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></span>ML = Medical Leave</span>
                                            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-1.5"></span>HD = Half Day</span>
                                        </div>
                                    </div>

                                    {/* Subject Stats */}
                                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                        <div className="bg-slate-100 p-3 border-b border-slate-200 text-slate-700 font-bold text-xs">
                                            {t('attendanceIntel.portal.subjectStats')}
                                        </div>
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                                    <th className="p-3">{isTamil ? 'பாடம்' : 'Subject'}</th>
                                                    <th className="p-3 text-center">{t('attendanceIntel.analytics.conducted')}</th>
                                                    <th className="p-3 text-center">{t('attendanceIntel.analytics.attended')}</th>
                                                    <th className="p-3 text-center">{t('attendanceIntel.analytics.missed')}</th>
                                                    <th className="p-3 text-center">{t('attendanceIntel.kpi.attendanceRate')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {studentProfileSubjectStats.map((sub, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50">
                                                        <td className="p-3 font-semibold text-slate-700">{sub.subject}</td>
                                                        <td className="p-3 text-center text-slate-600">{sub.conducted}</td>
                                                        <td className="p-3 text-center text-green-600 font-bold">{sub.attended}</td>
                                                        <td className="p-3 text-center text-red-600 font-bold">{sub.missed}</td>
                                                        <td className="p-3 text-center font-bold text-indigo-600">{sub.percentage}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: NOTICES */}
                        {activeTab === 'notices' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                                    <Megaphone className="mr-3 text-orange-600" /> {t('teacherPortal.classNotices')}
                                </h2>
                                <form onSubmit={handleCreateNotice} className="mb-8 border-b border-slate-100 pb-8">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherPortal.noticeTitle')}</label>
                                            <input
                                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
                                                placeholder={t('teacherPortal.noticeTitlePlaceholder')}
                                                value={newNotice.title}
                                                onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherPortal.noticeType')}</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm appearance-none bg-white"
                                                    value={newNotice.type}
                                                    onChange={e => setNewNotice({ ...newNotice, type: e.target.value as any })}
                                                >
                                                    <option value="announcement">📢 {t('teacherPortal.announcement')}</option>
                                                    <option value="homework">📝 {t('teacherPortal.homework')}</option>
                                                    <option value="exam">🎓 {t('teacherPortal.exam')}</option>
                                                    <option value="event">🎉 {t('teacherPortal.event')}</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherPortal.content')}</label>
                                            <textarea
                                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm min-h-[100px]"
                                                placeholder={t('teacherPortal.contentPlaceholder')}
                                                value={newNotice.content}
                                                onChange={e => setNewNotice({ ...newNotice, content: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <button
                                                type="submit"
                                                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-2.5 rounded-xl font-medium shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Megaphone size={18} className="mr-2" />}
                                                {t('teacherPortal.postNotice')}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                                <div className="space-y-4">
                                    {notices.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400">
                                            <Megaphone size={48} className="mx-auto mb-2 opacity-20" />
                                            <p>{t('teacherPortal.noNoticesPosted')}</p>
                                        </div>
                                    ) : (
                                        notices.map((n, i) => (
                                            <div key={i} className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-slate-800 text-lg flex items-center">
                                                        {n.title}
                                                        <span className={`text-[10px] font-bold uppercase ml-3 px-2 py-0.5 rounded-full ${n.type === 'homework' ? 'bg-blue-100 text-blue-700' :
                                                            n.type === 'exam' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-orange-200 text-orange-800'
                                                            }`}>
                                                            {n.type}
                                                        </span>
                                                    </h3>
                                                    <span className="text-xs text-orange-600 font-medium bg-white px-2 py-1 rounded-lg border border-orange-200">
                                                        {new Date(n.created_at).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN')}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 text-sm leading-relaxed">{n.content}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB: HOMEWORK */}
                        {activeTab === 'homework' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                                    <FileSignature className="mr-3 text-blue-600" /> {t('teacherPortal.dailyHomeworkLog')}
                                </h2>
                                <form onSubmit={handleUpdateHomework} className="mb-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherPortal.dueDate')}</label>
                                            <input
                                                type="date"
                                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                                value={homeworkDate}
                                                onChange={e => setHomeworkDate(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherPortal.selectSubject')}</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm appearance-none bg-white"
                                                    value={homeworkSubject}
                                                    onChange={e => setHomeworkSubject(e.target.value)}
                                                >
                                                    <option value="Mathematics">{translateSubject('Mathematics', i18n.language)}</option>
                                                    <option value="Science">{translateSubject('Science', i18n.language)}</option>
                                                    <option value="English">{translateSubject('English', i18n.language)}</option>
                                                    <option value="Social Studies">{translateSubject('Social Studies', i18n.language)}</option>
                                                    <option value="Computer Science">{translateSubject('Computer Science', i18n.language)}</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherPortal.homeworkDetails')}</label>
                                        <textarea
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm min-h-[100px]"
                                            placeholder={t('teacherPortal.homeworkDetailsPlaceholder')}
                                            value={homeworkContent}
                                            onChange={e => setHomeworkContent(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
                                        >
                                            {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                                            {t('teacherPortal.updateHomework')}
                                        </button>
                                    </div>
                                </form>

                                {/* Published Homework List */}
                                <div className="mt-8 pt-6 border-t border-slate-200">
                                    <h3 className="font-bold text-slate-700 mb-4 flex items-center">
                                        <FileSignature className="mr-2 text-blue-500" />
                                        {t('teacherPortal.publishedHomework')}
                                    </h3>
                                    {homeworkLog.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                            <FileSignature size={48} className="mx-auto mb-2 opacity-20" />
                                            <p>{t('teacherPortal.noHomeworkPublished')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {homeworkLog.map((h: any) => (
                                                <div key={h.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-colors group">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-slate-700 group-hover:text-blue-700">{h.content}</p>
                                                        <p className="text-xs text-slate-400">
                                                            {translateSubject(h.subject_name, i18n.language)} • {h.homework_date ? new Date(h.homework_date).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN') : 'N/A'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteHomework(h.id)}
                                                        className="ml-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Homework"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB: MARKS - Redesigned Examination & Marks Entry Grid */}
                        {activeTab === 'marks' && (
                            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold flex items-center text-slate-800">
                                            <Award className="mr-3 text-yellow-500" /> {t('teacherPortal.marksEntry')}
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-1">{t('examManagement.subtitle', 'Create exams, schedule dates, and publish results.')}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                            marksApprovalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                            marksApprovalStatus === 'submitted' ? 'bg-amber-100 text-amber-700' :
                                            marksApprovalStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            ● {t('examManagement.status')}: {t(`examManagement.subStatus${marksApprovalStatus.charAt(0).toUpperCase() + marksApprovalStatus.slice(1)}`)}
                                        </span>
                                    </div>
                                </div>

                                {/* Rejection Warning Banner */}
                                {marksApprovalStatus === 'rejected' && (
                                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start space-x-3">
                                        <AlertTriangle className="flex-shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <p className="font-bold">{t('examManagement.correctionRequested', 'Correction Requested')}</p>
                                            <p className="text-sm mt-1">{t('examManagement.rejectionReason', 'Reason')}: <span className="italic font-medium">{marksRejectionReason}</span></p>
                                        </div>
                                    </div>
                                )}

                                {/* Lock Banner */}
                                {marksApprovalStatus === 'submitted' && (
                                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl flex items-center space-x-3">
                                        <Lock size={18} className="flex-shrink-0" />
                                        <p className="text-sm font-medium">{t('examManagement.marksLockedReview', 'Marks have been submitted and locked for review. Only Admin can edit or publish.')}</p>
                                    </div>
                                )}
                                {marksApprovalStatus === 'approved' && (
                                    <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center space-x-3">
                                        <CheckCircle size={18} className="flex-shrink-0" />
                                        <p className="text-sm font-medium">{t('examManagement.marksApprovedPublished', 'Results have been approved and published. Records are now read-only.')}</p>
                                    </div>
                                )}

                                {/* Selectors Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('examManagement.selectExam')}</label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-sm bg-white"
                                            value={selectedExamId}
                                            onChange={e => {
                                                const exam = activeExams.find(x => x.id === e.target.value);
                                                setSelectedExamId(e.target.value);
                                                if (exam) setSelectedExamTitle(translateExamTitle(exam.title, i18n.language));
                                            }}
                                        >
                                            <option value="">-- {t('examManagement.selectExam')} --</option>
                                            {activeExams.map(ex => (
                                                <option value={ex.id} key={ex.id}>{translateExamTitle(ex.title, i18n.language)}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('examManagement.selectSubject')}</label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-sm bg-white"
                                            value={selectedSubjectForMarks}
                                            onChange={e => setSelectedSubjectForMarks(e.target.value)}
                                        >
                                            {['Tamil', 'English', 'Mathematics', 'Science', 'Social Science', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'Commerce', 'Accountancy', 'Economics'].map(sub => (
                                                <option value={sub} key={sub}>{translateSubject(sub, i18n.language)}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('examManagement.selectClass')}</label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-sm bg-white"
                                            value={selectedClass}
                                            onChange={e => setSelectedClass(e.target.value)}
                                        >
                                            {CLASSES.map(cls => (
                                                <option value={cls} key={cls}>{t('forms.class')} {cls.replace('Class ', '')}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('examManagement.selectSection')}</label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-sm bg-white"
                                            value={selectedSection}
                                            onChange={e => setSelectedSection(e.target.value)}
                                        >
                                            {SECTIONS.map(sec => (
                                                <option value={sec} key={sec}>{t('teacherPortal.section')} {sec}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('examManagement.selectDate')}</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-sm bg-white"
                                            value={marksEntryDate}
                                            onChange={e => setMarksEntryDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {selectedExamId ? (
                                    <div className="space-y-4 animate-fade-in">
                                        {/* Utility Toolbar */}
                                        {(marksApprovalStatus === 'draft' || marksApprovalStatus === 'rejected') && (
                                            <div className="flex flex-wrap gap-2 items-center justify-between bg-yellow-50/50 p-3 rounded-lg border border-yellow-100">
                                                <div className="flex flex-wrap gap-2">
                                                    {/* Bulk Fill Max/Pass */}
                                                    <button
                                                        onClick={() => {
                                                            const updated = marksList.map(r => ({ ...r, max_marks: 100, pass_mark: 35 }));
                                                            setMarksList(updated);
                                                        }}
                                                        className="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-lg hover:bg-yellow-200 transition-colors"
                                                    >
                                                        {t('examManagement.fillDefaultMaxPass', 'Set 100 Max / 35 Pass')}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const updated = marksList.map(r => ({ ...r, status: 'Present' }));
                                                            setMarksList(updated);
                                                        }}
                                                        className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-lg hover:bg-green-200 transition-colors"
                                                    >
                                                        {t('examManagement.markAllPresent', 'Mark All Present')}
                                                    </button>
                                                    <button
                                                        onClick={handleCopyPreviousMarks}
                                                        className="px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center"
                                                    >
                                                        <Copy size={12} className="mr-1" />
                                                        {t('examManagement.copyPrevious', 'Copy Previous')}
                                                    </button>
                                                </div>

                                                {/* CSV Upload */}
                                                <div>
                                                    <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm">
                                                        <UploadCloud size={14} />
                                                        <span>{t('examManagement.excelUpload', 'Excel/CSV Upload')}</span>
                                                        <input
                                                            type="file"
                                                            accept=".csv"
                                                            onChange={handleCSVUpload}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        {/* Marks Entry Grid */}
                                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs font-bold uppercase">
                                                            <th className="p-4 w-20 text-center">{t('examManagement.rollNo')}</th>
                                                            <th className="p-4">{t('examManagement.studentName')}</th>
                                                            <th className="p-4 w-36">{t('examManagement.selectSubject')}</th>
                                                            <th className="p-4 w-24 text-center">{t('examManagement.maxMarks')}</th>
                                                            <th className="p-4 w-24 text-center">{t('examManagement.passMark')}</th>
                                                            <th className="p-4 w-28 text-center">{t('examManagement.obtainedMarks')}</th>
                                                            <th className="p-4 w-20 text-center">{t('examManagement.grade')}</th>
                                                            <th className="p-4 w-32">{t('examManagement.status')}</th>
                                                            <th className="p-4">{t('examManagement.remarks')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 text-sm">
                                                        {marksList.length > 0 ? marksList.map((row, idx) => {
                                                            const obtained = row.status === 'Present' ? Number(row.marks || 0) : 0;
                                                            const max = Number(row.max_marks || 100);
                                                            const pass = Number(row.pass_mark || 35);
                                                            const pct = max > 0 ? (obtained / max) * 100 : 0;

                                                            // Realtime Grade calculation
                                                            let grade = 'F';
                                                            if (row.status === 'Present') {
                                                                if (pct >= 90) grade = 'A+';
                                                                else if (pct >= 75) grade = 'A';
                                                                else if (pct >= 60) grade = 'B';
                                                                else if (pct >= 45) grade = 'C';
                                                                else if (pct >= 35) grade = 'D';
                                                            }

                                                            // Realtime status calculation
                                                            let resStatus = 'Fail';
                                                            if (row.status !== 'Present') {
                                                                resStatus = row.status;
                                                            } else if (obtained >= pass) {
                                                                resStatus = 'Pass';
                                                            }

                                                            const isLocked = marksApprovalStatus === 'submitted' || marksApprovalStatus === 'approved';
                                                            const isInvalid = row.status === 'Present' && (obtained > max || obtained < 0);

                                                            return (
                                                                <tr key={row.student_id} className="hover:bg-slate-50/50 transition-colors">
                                                                    <td className="p-4 font-bold text-slate-500 text-center">{row.roll_no}</td>
                                                                    <td className="p-4 font-semibold text-slate-700">{row.student_name}</td>
                                                                    <td className="p-4 text-xs font-medium text-indigo-700 bg-indigo-50/30 rounded">
                                                                        {translateSubject(selectedSubjectForMarks, i18n.language)}
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <input
                                                                            type="number"
                                                                            disabled={isLocked}
                                                                            className="border border-slate-200 rounded-lg p-1.5 w-16 text-center focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                                                                            value={row.max_marks}
                                                                            onChange={e => {
                                                                                const val = Number(e.target.value);
                                                                                const updated = [...marksList];
                                                                                updated[idx].max_marks = val;
                                                                                setMarksList(updated);
                                                                            }}
                                                                        />
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <input
                                                                            type="number"
                                                                            disabled={isLocked}
                                                                            className="border border-slate-200 rounded-lg p-1.5 w-16 text-center focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                                                                            value={row.pass_mark}
                                                                            onChange={e => {
                                                                                const val = Number(e.target.value);
                                                                                const updated = [...marksList];
                                                                                updated[idx].pass_mark = val;
                                                                                setMarksList(updated);
                                                                            }}
                                                                        />
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <input
                                                                            type="number"
                                                                            disabled={isLocked || row.status !== 'Present'}
                                                                            className={`border rounded-lg p-1.5 w-20 text-center focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 ${
                                                                                isInvalid ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200'
                                                                            }`}
                                                                            placeholder="0"
                                                                            value={row.status === 'Present' ? row.marks : ''}
                                                                            onChange={e => {
                                                                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                                                                const updated = [...marksList];
                                                                                updated[idx].marks = val;
                                                                                setMarksList(updated);
                                                                            }}
                                                                        />
                                                                    </td>
                                                                    <td className="p-4 text-center">
                                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                                            grade === 'A+' || grade === 'A' ? 'bg-green-100 text-green-700' :
                                                                            grade === 'B' || grade === 'C' ? 'bg-blue-100 text-blue-700' :
                                                                            grade === 'D' ? 'bg-amber-100 text-amber-700' :
                                                                            'bg-red-100 text-red-700'
                                                                        }`}>
                                                                            {grade}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <select
                                                                            disabled={isLocked}
                                                                            className="w-full border border-slate-200 rounded-lg p-1.5 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-xs font-semibold text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
                                                                            value={row.status}
                                                                            onChange={e => {
                                                                                const val = e.target.value;
                                                                                const updated = [...marksList];
                                                                                updated[idx].status = val;
                                                                                if (val !== 'Present') updated[idx].marks = 0;
                                                                                setMarksList(updated);
                                                                            }}
                                                                        >
                                                                            <option value="Present">{t('attendanceIntel.status.present')}</option>
                                                                            <option value="Absent">{t('attendanceIntel.status.absent')}</option>
                                                                            <option value="Medical Leave">{t('attendanceIntel.status.medical_leave')}</option>
                                                                            <option value="Withheld">{t('examManagement.withheld', 'Withheld')}</option>
                                                                            <option value="Pending Verification">{t('examManagement.pendingVerification', 'Pending')}</option>
                                                                        </select>
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <input
                                                                            type="text"
                                                                            disabled={isLocked}
                                                                            className="w-full border border-slate-200 rounded-lg p-1.5 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                                                                            placeholder={t('examManagement.remarks')}
                                                                            value={row.remarks}
                                                                            onChange={e => {
                                                                                const val = e.target.value;
                                                                                const updated = [...marksList];
                                                                                updated[idx].remarks = val;
                                                                                setMarksList(updated);
                                                                            }}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }) : (
                                                            <tr>
                                                                <td colSpan={9} className="p-10 text-center text-slate-400">
                                                                    {t('teacherPortal.noStudentsFound')}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        {(marksApprovalStatus === 'draft' || marksApprovalStatus === 'rejected') && (
                                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 pt-4">
                                                <p className="text-xs text-slate-500 flex items-center">
                                                    <Clock size={14} className="mr-1" />
                                                    {t('examManagement.autoSave', 'Drafts can be saved before final submission.')}
                                                </p>
                                                <div className="flex w-full sm:w-auto gap-3">
                                                    <button
                                                        onClick={() => handleSaveAdvancedMarks('draft')}
                                                        disabled={isSubmitting}
                                                        className="flex-1 sm:flex-initial bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center disabled:opacity-50"
                                                    >
                                                        <Save size={18} className="mr-2" />
                                                        {t('examManagement.saveDraft')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleSaveAdvancedMarks('submitted')}
                                                        disabled={isSubmitting || marksList.length === 0}
                                                        className="flex-1 sm:flex-initial bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
                                                    >
                                                        <CheckCircle size={18} className="mr-2" />
                                                        {t('examManagement.finalSubmit')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-12 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-center">
                                        <AlertTriangle className="mx-auto text-slate-300 mb-3" size={48} />
                                        <h3 className="font-bold text-slate-700 text-lg mb-1">{t('teacherPortal.selectActiveExam')}</h3>
                                        <p className="text-slate-400 text-sm max-w-sm mx-auto">{t('teacherPortal.selectActiveExamWarning')}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Other tabs (Remarks, Resources, Timetable) placeholders or simplified */}
                        {activeTab === 'remarks' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                            <MessageSquare className="mr-2 text-indigo-600" size={24} />
                                            {t('teacherPortal.studentRemarks')}
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-1">{t('teacherPortal.remarksSubtitle')}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={handleSaveRemarks}
                                            disabled={isSubmitting}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                                        >
                                            <Save size={16} className="mr-2" />
                                            {t('teacherPortal.saveAllRemarks')}
                                        </button>
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {students.length > 0 ? (
                                        students.map((student) => (
                                            <div key={student.id} className="p-6 hover:bg-slate-50 transition-colors">
                                                <div className="flex flex-col md:flex-row gap-4">
                                                    {/* Student Info */}
                                                    <div className="md:w-1/4">
                                                        <div className="flex items-center space-x-3 mb-2">
                                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                                {student.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-slate-800">{student.name}</h3>
                                                                <p className="text-xs text-slate-500">{t('teacherPortal.roll')}: {student.roll_no}</p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {/* Display existing categories badges if any - simplified for now */}
                                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
                                                                {t('teacherPortal.privateNote')}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Remarks Input */}
                                                    <div className="md:w-3/4">
                                                        <textarea
                                                            value={remarks[student.id] || ''}
                                                            onChange={(e) => setRemarks(prev => ({ ...prev, [student.id]: e.target.value }))}
                                                            placeholder={t('teacherPortal.remarksPlaceholder', { name: student.name })}
                                                            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-700 leading-relaxed min-h-[100px] resize-y"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                                <User size={32} />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-700">{t('teacherPortal.noStudentsFound')}</h3>
                                            <p className="text-slate-500">{t('teacherPortal.selectDifferentClass')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'resources' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                                    <FileText className="mr-3 text-teal-600" /> {t('teacherPortal.classResources')}
                                </h2>

                                {/* Upload {t('teacherPortal.section')} */}
                                <div className="mb-8 p-6 bg-teal-50/50 rounded-xl border border-teal-100">
                                    <h3 className="font-bold text-slate-700 mb-4">{t('teacherPortal.uploadNewResource')}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherPortal.selectSubject')}</label>
                                                <div className="relative">
                                                    <select
                                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm appearance-none bg-white"
                                                        value={resourceSubject}
                                                        onChange={e => setResourceSubject(e.target.value)}
                                                    >
                                                        <option value="General">📚 {translateSubject('General', i18n.language)}</option>
                                                        <option value="Mathematics">🔢 {translateSubject('Mathematics', i18n.language)}</option>
                                                        <option value="Science">🔬 {translateSubject('Science', i18n.language)}</option>
                                                        <option value="English">📖 {translateSubject('English', i18n.language)}</option>
                                                        <option value="Social Studies">🌍 {translateSubject('Social Studies', i18n.language)}</option>
                                                        <option value="Computer Science">💻 {translateSubject('Computer Science', i18n.language)}</option>
                                                        <option value="Hindi">🇮🇳 {translateSubject('Hindi', i18n.language)}</option>
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('studentPortal.unit', { defaultValue: 'Unit / Chapter' })}</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm bg-white text-slate-700"
                                                    placeholder={t('studentPortal.unitPlaceholder', { defaultValue: 'e.g. Unit 1: Introduction' })}
                                                    value={resourceUnit}
                                                    onChange={e => setResourceUnit(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherPortal.chooseFile')}</label>
                                            <div className="flex flex-col gap-3">
                                                <label className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed ${selectedUploadFile ? 'border-teal-500 bg-teal-50' : 'border-slate-300 hover:border-teal-300'} rounded-xl cursor-pointer transition-colors`}>
                                                    <input
                                                        type="file"
                                                        onChange={handleFileSelect}
                                                        className="hidden"
                                                        disabled={isUploading}
                                                    />
                                                    <div className="flex flex-col items-center">
                                                        {selectedUploadFile ? (
                                                            <>
                                                                <FileText className="text-teal-600 mb-1" size={24} />
                                                                <span className="text-teal-800 font-medium text-sm text-center break-all px-2">
                                                                    {selectedUploadFile.name}
                                                                </span>
                                                                <span className="text-teal-600 text-xs text-center mt-1">{t('teacherPortal.clickToChange')}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UploadCloud className="text-slate-400 mb-1" size={24} />
                                                                <span className="text-slate-600 font-medium text-sm">{t('teacherPortal.chooseFile')}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </label>

                                                <button
                                                    onClick={handlePublishResource}
                                                    disabled={!selectedUploadFile || isUploading}
                                                    className={`w-full py-2 rounded-lg font-bold text-white transition-all flex items-center justify-center space-x-2 ${!selectedUploadFile || isUploading
                                                        ? 'bg-slate-300 cursor-not-allowed'
                                                        : 'bg-teal-600 hover:bg-teal-700 shadow-md transform hover:-translate-y-0.5'
                                                        }`}
                                                >
                                                    {isUploading ? (
                                                        <>
                                                            <Loader2 className="animate-spin" size={18} />
                                                            <span>{t('teacherPortal.uploading')}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UploadCloud size={18} />
                                                            <span>{t('teacherPortal.publishResource')}</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {t('teacherPortal.uploadingTo')} <span className="font-bold text-slate-700">{selectedClass} - {t('teacherPortal.section')} {selectedSection}</span> → <span className="font-bold text-teal-700">{resourceSubject}</span>
                                    </p>
                                </div>

                                {/* Resources List */}
                                <div>
                                    <h3 className="font-bold text-slate-700 mb-4">{t('teacherPortal.uploadedResources')}</h3>
                                    {resources.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                            <FileText size={48} className="mx-auto mb-2 opacity-20" />
                                            <p>{t('teacherPortal.noResourcesUploaded')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {resources.map((r, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-teal-50 hover:border-teal-200 transition-colors cursor-pointer group"
                                                    onClick={async () => {
                                                        const { url, error } = await academicService.getDownloadUrl(r.storage_path);
                                                        if (url) {
                                                            window.open(url, '_blank');
                                                        } else {
                                                            alert('Failed to open file: ' + (error || 'Unknown error'));
                                                        }
                                                    }}
                                                    title="Click to open/download"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <FileText size={20} className="text-teal-500 group-hover:text-teal-600" />
                                                        <div>
                                                            <p className="font-medium text-slate-700 group-hover:text-teal-700">{r.title || r.name || r.file_name}</p>
                                                            <p className="text-xs text-slate-400">
                                                                {translateSubject(r.subjects?.name || r.subject || 'General', i18n.language)}
                                                                {r.unit ? ` • ${r.unit}` : ''}
                                                                {' • '}{r.mime_type}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN')}</span>
                                                        <Download size={16} className="text-slate-300 group-hover:text-teal-500" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'timetable' && (
                            <TimetableDisplay className={`${selectedClass}-${selectedSection}`} classId={selectedClassId || undefined} />
                        )}

                        {/* TAB: DOUBTS */}
                        {activeTab === 'doubts' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                                        <HelpCircle className="mr-3 text-purple-600 animate-pulse" size={28} />
                                        {t('dashboard.feedback')}
                                    </h2>
                                    <button
                                        onClick={loadDoubts}
                                        disabled={isLoadingDoubts}
                                        className="text-sm text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center"
                                    >
                                        <Loader2 className={`mr-1.5 ${isLoadingDoubts ? 'animate-spin' : 'hidden'}`} size={14} />
                                        {t('feedbackManagement.refresh', { defaultValue: 'Refresh' })}
                                    </button>
                                </div>

                                {isLoadingDoubts ? (
                                    <div className="text-center py-12">
                                        <Loader2 size={36} className="mx-auto text-purple-600 animate-spin mb-3" />
                                        <p className="text-slate-500">{t('feedbackManagement.loadingFeedback', { defaultValue: 'Loading doubts...' })}</p>
                                    </div>
                                ) : doubts.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                        <HelpCircle size={48} className="mx-auto mb-2 opacity-20" />
                                        <p className="font-medium text-slate-600 mb-1">{t('teacherPortal.noDoubtsAssigned', { defaultValue: 'No doubts assigned yet' })}</p>
                                        <p className="text-sm text-slate-400">{t('teacherPortal.noDoubtsDescription', { defaultValue: 'When students or parents ask doubts corresponding to your subjects, they will appear here.' })}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {doubts.map(doubt => {
                                            const isOpen = doubt.status === 'open' || doubt.status === 'under_review';
                                            return (
                                                <div
                                                    key={doubt.id}
                                                    className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-purple-50/20 hover:border-purple-200 hover:shadow-md transition-all flex flex-col justify-between group"
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start gap-2 mb-3">
                                                            <span className="text-xs text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full font-bold">
                                                                📖 {translateSubject(doubt.subject?.name || '', i18n.language) || t('studentPortal.subject')}
                                                            </span>
                                                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${
                                                                doubt.status === 'resolved'
                                                                    ? 'bg-green-50 border-green-200 text-green-700'
                                                                    : doubt.status === 'under_review'
                                                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                                                            }`}>
                                                                {doubt.status === 'under_review' ? t('studentPortal.underReview') : t(`studentPortal.${doubt.status}`)}
                                                            </span>
                                                        </div>
                                                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-purple-900 transition-colors line-clamp-1 mb-2">
                                                            {doubt.title}
                                                        </h3>
                                                        <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
                                                            {doubt.description}
                                                        </p>
                                                    </div>

                                                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                                        <div className="text-xs text-slate-400">
                                                            <p>
                                                                {t('feedbackManagement.submittedBy')}:{' '}
                                                                <span className="font-medium text-slate-500">
                                                                    {doubt.is_anonymous ? t('feedbackManagement.anonymous') : t(`userManagement.${doubt.user_role}s`, { defaultValue: doubt.user_role })}
                                                                </span>
                                                            </p>
                                                            <p className="mt-0.5">
                                                                {new Date(doubt.created_at).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN', {
                                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                                })}
                                                            </p>
                                                        </div>

                                                        {isOpen ? (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedDoubt(doubt);
                                                                    setTeacherResponseText(doubt.admin_response || '');
                                                                }}
                                                                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all"
                                                            >
                                                                {t('feedbackManagement.writeResponse', { defaultValue: 'Reply' })}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedDoubt(doubt);
                                                                    setTeacherResponseText(doubt.admin_response || '');
                                                                }}
                                                                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                                                            >
                                                                {t('common.view', { defaultValue: 'View' })}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </main>

            {/* Doubt Detail & Reply Modal */}
            {selectedDoubt && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDoubt(null)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-5 rounded-t-2xl flex items-start justify-between z-10">
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="text-xs text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full font-bold">
                                        📖 {translateSubject(selectedDoubt.subject?.name || '', i18n.language) || t('studentPortal.subject')}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${
                                        selectedDoubt.status === 'resolved'
                                            ? 'bg-green-50 border-green-200 text-green-700'
                                            : selectedDoubt.status === 'under_review'
                                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                                            : 'bg-blue-50 border-blue-200 text-blue-700'
                                    }`}>
                                        {selectedDoubt.status === 'under_review' ? t('studentPortal.underReview') : t(`studentPortal.${selectedDoubt.status}`)}
                                    </span>
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">{selectedDoubt.title}</h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    {t('feedbackManagement.submittedBy')}:{' '}
                                    <span className="font-semibold">
                                        {selectedDoubt.is_anonymous ? t('feedbackManagement.anonymous') : t(`userManagement.${selectedDoubt.user_role}s`, { defaultValue: selectedDoubt.user_role })}
                                    </span>{' '}
                                    •{' '}
                                    {new Date(selectedDoubt.created_at).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN', {
                                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>
                            </div>
                            <button onClick={() => setSelectedDoubt(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-2">{t('feedbackManagement.description')}</h3>
                                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap border border-slate-100">
                                    {selectedDoubt.description}
                                </div>
                            </div>

                            {selectedDoubt.admin_response && (
                                <div>
                                    <h3 className="text-sm font-semibold text-green-700 mb-2">{t('studentPortal.adminResponse')}</h3>
                                    <div className="bg-green-50 p-4 rounded-lg text-sm text-green-800 whitespace-pre-wrap border border-green-100">
                                        {selectedDoubt.admin_response}
                                        <p className="text-xs text-green-500 mt-2">
                                            {t('feedbackManagement.responded')}{' '}
                                            {selectedDoubt.responded_at && new Date(selectedDoubt.responded_at).toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {(selectedDoubt.status === 'open' || selectedDoubt.status === 'under_review') && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">{t('feedbackManagement.writeResponse')}</h3>
                                    <textarea
                                        value={teacherResponseText}
                                        onChange={e => setTeacherResponseText(e.target.value)}
                                        rows={4}
                                        placeholder={t('teacherPortal.enterReplyPlaceholder', { defaultValue: 'Type your response here...' })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none shadow-sm"
                                    />
                                    <div className="flex justify-end mt-3">
                                        <button
                                            onClick={() => handleDoubtResponse(selectedDoubt.id)}
                                            disabled={isResponding || !teacherResponseText.trim()}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                                        >
                                            {isResponding ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={16} />
                                                    <span>{t('feedbackManagement.sending')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={16} />
                                                    <span>{t('feedbackManagement.sendResponse', { defaultValue: 'Submit Response' })}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                            <Key className="mr-2 text-amber-600" />
                            {t('teacherPortal.changePassword')}
                        </h3>
                        <div className="space-y-4">
                            {passwordError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                                    {passwordError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherPortal.newPassword')}</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => { setNewPassword(e.target.value); setPasswordError(''); }}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder={t('teacherPortal.passwordPlaceholder')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherPortal.confirmPassword')}</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder={t('teacherPortal.confirmPasswordPlaceholder')}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => { setShowPasswordModal(false); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleChangePassword}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                            >
                                {t('teacherPortal.updatePassword')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

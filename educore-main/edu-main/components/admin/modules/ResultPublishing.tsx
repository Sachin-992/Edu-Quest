import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Calendar,
    ArrowLeft,
    Check,
    X,
    AlertCircle,
    User,
    Award,
    TrendingUp,
    FileSpreadsheet,
    Printer,
    Download
} from 'lucide-react';
import { academicService } from '../../../services/academicService';
import { pdfExportService } from '../../../services/pdfExportService';

interface ApprovalRecord {
    id: string;
    exam_id: string;
    class: string;
    section: string;
    subject: string;
    teacher_id: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    rejection_reason: string | null;
    release_at: string | null;
    created_at: string;
    updated_at: string;
    exams: {
        title: string;
    };
    users: {
        name: string;
    } | null;
}

export const ResultPublishing: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApproval, setSelectedApproval] = useState<ApprovalRecord | null>(null);
    const [studentMarks, setStudentMarks] = useState<any[]>([]);
    const [loadingMarks, setLoadingMarks] = useState(false);
    
    // Approval modal actions
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
    const [publishImmediately, setPublishImmediately] = useState(true);
    const [releaseDate, setReleaseDate] = useState('');
    const [releaseTime, setReleaseTime] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        loadApprovals();
    }, []);

    const loadApprovals = async () => {
        setLoading(true);
        const data = await academicService.getMarksApprovals();
        setApprovals(data);
        setLoading(false);
    };

    const handleSelectApproval = async (approval: ApprovalRecord) => {
        setSelectedApproval(approval);
        setLoadingMarks(true);
        const marks = await academicService.getSubjectMarks(
            approval.exam_id,
            approval.subject,
            approval.class,
            approval.section
        );
        setStudentMarks(marks);
        setLoadingMarks(false);
    };

    const handleBackToList = () => {
        setSelectedApproval(null);
        setStudentMarks([]);
        setShowActionModal(false);
    };

    const handleOpenActionModal = (type: 'approve' | 'reject') => {
        setActionType(type);
        setRejectionReason('');
        
        // Initialize release date/time to now
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().substring(0, 5);
        setReleaseDate(dateStr);
        setReleaseTime(timeStr);
        setPublishImmediately(true);
        
        setShowActionModal(true);
    };

    const handleSubmitAction = async () => {
        if (!selectedApproval) return;
        setSubmitLoading(true);

        let releaseAtVal: string | null = null;
        if (actionType === 'approve') {
            if (publishImmediately) {
                releaseAtVal = new Date().toISOString();
            } else {
                if (!releaseDate || !releaseTime) {
                    alert('Please select both release date and time.');
                    setSubmitLoading(false);
                    return;
                }
                releaseAtVal = new Date(`${releaseDate}T${releaseTime}`).toISOString();
            }
        }

        const reasonVal = actionType === 'reject' ? rejectionReason : null;
        const newStatus = actionType === 'approve' ? 'approved' : 'rejected';

        const { success, error } = await academicService.approveRejectMarks(
            selectedApproval.id,
            newStatus,
            reasonVal,
            releaseAtVal
        );

        setSubmitLoading(false);

        if (success) {
            await loadApprovals();
            // Refresh detail view
            const updatedApproval = approvals.find(a => a.id === selectedApproval.id);
            if (updatedApproval) {
                setSelectedApproval({
                    ...selectedApproval,
                    status: newStatus,
                    rejection_reason: reasonVal,
                    release_at: releaseAtVal
                });
            } else {
                handleBackToList();
            }
            setShowActionModal(false);
        } else {
            alert(`Failed: ${error}`);
        }
    };

    const handleDownloadPDF = async () => {
        if (!selectedApproval || studentMarks.length === 0) return;
        
        try {
            pdfExportService.exportMarksheetRegister({
                examTitle: selectedApproval.exams.title,
                className: selectedApproval.class,
                section: selectedApproval.section,
                subject: selectedApproval.subject,
                teacherName: selectedApproval.users?.name || 'Teacher',
                records: studentMarks.map(m => ({
                    rollNo: m.roll_no,
                    studentName: m.student_name,
                    marks: m.marks,
                    maxMarks: m.max_marks,
                    passMark: m.pass_mark,
                    grade: m.grade,
                    status: m.status,
                    remarks: m.remarks
                }))
            }, i18n.language as 'en' | 'ta' | 'bilingual');
        } catch (e) {
            console.error('PDF export failed:', e);
            alert('Failed to export PDF marklist. Please try again.');
        }
    };

    // Calculate stats for the selected register
    const totalStudents = studentMarks.length;
    const presentStudents = studentMarks.filter(m => m.status === 'Present').length;
    const passedStudents = studentMarks.filter(m => m.status === 'Present' && Number(m.marks || 0) >= Number(m.pass_mark || 35)).length;
    const passRate = presentStudents > 0 ? Math.round((passedStudents / presentStudents) * 100) : 0;
    const avgScore = presentStudents > 0 ? (studentMarks.reduce((acc, curr) => acc + (curr.status === 'Present' ? Number(curr.marks || 0) : 0), 0) / presentStudents).toFixed(1) : '0';

    return (
        <div className="space-y-6">
            {!selectedApproval ? (
                // approvals dashboard list view
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{t('examManagement.publishing', 'Result Publishing')}</h2>
                            <p className="text-slate-500">{t('examManagement.resultPublishingSub', 'Approve submitted marks, reject registers, and schedule release times.')}</p>
                        </div>
                    </div>

                    {/* Stats summary banner */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase">{t('common.total', 'Total Submissions')}</p>
                                <p className="text-2xl font-bold text-slate-800">{approvals.length}</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase">{t('examManagement.subStatusSubmitted', 'Pending Review')}</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {approvals.filter(a => a.status === 'submitted').length}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase">{t('examManagement.subStatusApproved', 'Approved/Released')}</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {approvals.filter(a => a.status === 'approved').length}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                                <XCircle size={24} />
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase">{t('examManagement.subStatusRejected', 'Rejected')}</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {approvals.filter(a => a.status === 'rejected').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Table list */}
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">{t('common.loading', 'Loading data...')}</div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.selectExam', 'Exam')}</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">{t('forms.class', 'Class')} & {t('forms.section', 'Section')}</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">{t('forms.subject', 'Subject')}</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">{t('teacherManagement.name', 'Teacher')}</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.status', 'Status')}</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.releaseDate', 'Release Schedule')}</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.actions', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {approvals.length > 0 ? approvals.map(approval => (
                                        <tr key={approval.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                {approval.exams.title}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                Class {approval.class} - {approval.section}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">
                                                {approval.subject}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {approval.users?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                    approval.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    approval.status === 'submitted' ? 'bg-amber-100 text-amber-700' :
                                                    approval.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {t(`examManagement.subStatus${approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}`, approval.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {approval.status === 'approved' && approval.release_at ? (
                                                    <div className="flex items-center space-x-1.5 text-green-600 font-medium">
                                                        <Calendar size={14} />
                                                        <span>
                                                            {new Date(approval.release_at).toLocaleString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN')}
                                                        </span>
                                                    </div>
                                                ) : approval.status === 'submitted' ? (
                                                    <span className="text-amber-600 flex items-center space-x-1">
                                                        <Clock size={14} />
                                                        <span>{t('examManagement.pendingReview', 'Pending Review')}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleSelectApproval(approval)}
                                                    className="flex items-center space-x-1 px-4 py-2 min-h-[44px] rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors active:scale-95"
                                                >
                                                    <FileText size={14} />
                                                    <span>{t('examManagement.viewMarksheet', 'Review')}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                                {t('common.noResults', 'No records found')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                // Detailed register verification view
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                        <button
                            onClick={handleBackToList}
                            className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span className="font-semibold">{t('common.back', 'Back to List')}</span>
                        </button>
                        
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleDownloadPDF}
                                className="flex items-center space-x-2 bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2 min-h-[44px] rounded-lg hover:bg-slate-200 font-semibold transition-colors active:scale-95"
                            >
                                <Download size={16} />
                                <span>{t('examManagement.downloadPDF', 'Download PDF')}</span>
                            </button>

                            {selectedApproval.status === 'submitted' && (
                                <>
                                    <button
                                        onClick={() => handleOpenActionModal('reject')}
                                        className="flex items-center space-x-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 min-h-[44px] rounded-lg hover:bg-red-100 font-semibold transition-colors active:scale-95"
                                    >
                                        <XCircle size={16} />
                                        <span>{t('examManagement.rejectAction', 'Reject')}</span>
                                    </button>
                                    <button
                                        onClick={() => handleOpenActionModal('approve')}
                                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 min-h-[44px] rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-sm active:scale-95"
                                    >
                                        <CheckCircle size={16} />
                                        <span>{t('examManagement.approveAction', 'Approve & Publish')}</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-slate-700/50 flex flex-col justify-between">
                            <div>
                                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {selectedApproval.exams.title}
                                </span>
                                <h3 className="text-2xl font-bold mt-3">
                                    Class {selectedApproval.class} - {selectedApproval.section} : {selectedApproval.subject}
                                </h3>
                                <p className="text-slate-400 mt-1 flex items-center">
                                    <User size={14} className="mr-1.5" />
                                    {t('teacherManagement.name', 'Teacher')}: {selectedApproval.users?.name || 'Unknown'}
                                </p>
                            </div>
                            
                            {selectedApproval.status === 'approved' && selectedApproval.release_at && (
                                <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center space-x-2 text-green-400 text-sm">
                                    <Check size={18} className="bg-green-400/10 p-0.5 rounded-full" />
                                    <span>
                                        {t('examManagement.resultsScheduled', 'Scheduled for release at')}{' '}
                                        <strong className="text-white">
                                            {new Date(selectedApproval.release_at).toLocaleString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN')}
                                        </strong>
                                    </span>
                                </div>
                            )}

                            {selectedApproval.status === 'rejected' && selectedApproval.rejection_reason && (
                                <div className="mt-6 pt-4 border-t border-slate-700/50 text-red-400 text-sm">
                                    <p className="font-semibold flex items-center">
                                        <AlertCircle size={16} className="mr-1.5" />
                                        {t('examManagement.rejectionReason', 'Rejection Reason')}:
                                    </p>
                                    <p className="text-slate-300 mt-1 italic">"{selectedApproval.rejection_reason}"</p>
                                </div>
                            )}
                        </div>

                        {/* Summary Metrics */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                            <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
                                {t('examManagement.overallAnalytics', 'Register Analytics')}
                            </h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-slate-400 text-xs font-semibold">{t('examManagement.avgScore', 'Avg Score')}</p>
                                    <div className="flex items-baseline space-x-1 mt-0.5">
                                        <span className="text-2xl font-bold text-slate-800">{avgScore}</span>
                                        <span className="text-xs text-slate-500">/ 100</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs font-semibold">{t('examManagement.passFail', 'Pass Rate')}</p>
                                    <div className="flex items-baseline space-x-1 mt-0.5">
                                        <span className="text-2xl font-bold text-indigo-600">{passRate}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex justify-between text-xs text-slate-500 font-semibold mb-1">
                                    <span>Pass ({passedStudents})</span>
                                    <span>Total Present ({presentStudents}/{totalStudents})</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-indigo-600 h-full transition-all duration-500"
                                        style={{ width: `${passRate}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Student Records List */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                        {loadingMarks ? (
                            <div className="text-center py-10 text-slate-500">{t('common.loading', 'Loading data...')}</div>
                        ) : (
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.rollNo', 'Roll No')}</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.studentName', 'Student')}</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.obtainedMarks', 'Obtained')}</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.maxMarks', 'Max')}</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.passMark', 'Pass')}</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.grade', 'Grade')}</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.status', 'Status')}</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.remarks', 'Remarks')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {studentMarks.length > 0 ? studentMarks.map((student, idx) => {
                                        const isFail = student.status === 'Present' && Number(student.marks || 0) < Number(student.pass_mark || 35);
                                        return (
                                            <tr key={student.student_id || idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-800">
                                                    {student.roll_no || idx + 1}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-800">
                                                    {student.student_name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {student.status === 'Present' ? (
                                                        <span className={`font-bold text-base ${isFail ? 'text-red-600' : 'text-slate-800'}`}>
                                                            {student.marks}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 font-semibold">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {student.max_marks}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {student.pass_mark}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {student.status === 'Present' ? (
                                                        <span className={`px-2 py-0.5 rounded text-xs font-extrabold border uppercase ${
                                                            student.grade === 'A+' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                            student.grade === 'A' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            student.grade === 'B' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            student.grade === 'C' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            student.grade === 'D' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            'bg-red-50 text-red-700 border-red-200'
                                                        }`}>
                                                            {student.grade || 'F'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 font-bold">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                        student.status === 'Present' ? (isFail ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700') :
                                                        student.status === 'Absent' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                                        'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {t(`examManagement.status${student.status.replace(/\s+/g, '')}`, student.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 italic max-w-xs truncate">
                                                    {student.remarks || '—'}
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-10 text-center text-slate-400">
                                                {t('common.noDataFound', 'No student marks found.')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Action Modal (Approve / Reject Dialog) */}
                    {showActionModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                                    {actionType === 'approve' ? (
                                        <>
                                            <CheckCircle className="mr-2 text-green-600 animate-pulse" />
                                            {t('examManagement.approveAction', 'Approve & Schedule Release')}
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="mr-2 text-red-600" />
                                            {t('examManagement.rejectAction', 'Reject Submission')}
                                        </>
                                    )}
                                </h3>

                                <div className="space-y-4">
                                    {actionType === 'approve' ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                <input
                                                    type="checkbox"
                                                    id="publish_now"
                                                    checked={publishImmediately}
                                                    onChange={e => setPublishImmediately(e.target.checked)}
                                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                                />
                                                <label htmlFor="publish_now" className="text-sm font-semibold text-slate-700 cursor-pointer">
                                                    {t('examManagement.publishImmediately', 'Publish Results Immediately')}
                                                </label>
                                            </div>

                                            {!publishImmediately && (
                                                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                                            {t('examManagement.releaseDate', 'Release Date')}
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={releaseDate}
                                                            onChange={e => setReleaseDate(e.target.value)}
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                                            {t('examManagement.releaseTime', 'Release Time')}
                                                        </label>
                                                        <input
                                                            type="time"
                                                            value={releaseTime}
                                                            onChange={e => setReleaseTime(e.target.value)}
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                {t('examManagement.rejectionReason', 'Rejection Reason / Guidance')}
                                            </label>
                                            <textarea
                                                rows={4}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-800"
                                                placeholder="e.g. Please re-check the marks for Roll No 5 and re-submit."
                                                value={rejectionReason}
                                                onChange={e => setRejectionReason(e.target.value)}
                                            ></textarea>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-3 mt-8 border-t border-slate-100 pt-4">
                                    <button
                                        onClick={() => setShowActionModal(false)}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                                        disabled={submitLoading}
                                    >
                                        {t('common.cancel', 'Cancel')}
                                    </button>
                                    
                                    <button
                                        onClick={handleSubmitAction}
                                        disabled={submitLoading || (actionType === 'reject' && !rejectionReason.trim())}
                                        className={`px-5 py-2 text-white font-bold rounded-lg transition-all flex items-center ${
                                            actionType === 'approve' 
                                                ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300' 
                                                : 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                                        }`}
                                    >
                                        {submitLoading ? (
                                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                        ) : (
                                            actionType === 'approve' ? <Check size={18} className="mr-1.5" /> : <X size={18} className="mr-1.5" />
                                        )}
                                        {actionType === 'approve' ? t('common.confirm', 'Confirm Approval') : t('examManagement.rejectAction', 'Reject')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

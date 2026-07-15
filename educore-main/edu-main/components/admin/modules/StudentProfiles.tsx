import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Search, Plus, Download, Eye, Loader2, AlertTriangle, CheckCircle, XCircle, RefreshCw, Edit, Trash2, Shield, Lock, EyeOff, ArrowRight, UserCheck } from 'lucide-react';
// ... existing imports
import { studentService, Student } from '../../../services/studentService';
import { aadhaarService } from '../../../services/aadhaarService';
import { schoolService, SchoolClass } from '../../../services/schoolService';
import { ConfirmDialog } from '../../ConfirmDialog';
import { sanitizeName, sanitizePhone, getTodayDate, sanitizeAadhaar } from '../../../utils/inputValidation';
import { isBilingualMatch } from '../../../utils/transliteration';

// Interfaces
interface StudentWithAadhaar extends Student {
    aadhaar_last4?: string;
    aadhaar_verified?: boolean;
}

export const StudentProfiles: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('All');
    const [students, setStudents] = useState<StudentWithAadhaar[]>([]);
    const [activeClasses, setActiveClasses] = useState<SchoolClass[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStudent, setNewStudent] = useState({
        name: '', class: '6', section: 'A', roll_no: 1, aadhaar: '',
        email: '', date_of_birth: '' // Required for login credentials
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Aadhaar modal
    const [showAadhaarModal, setShowAadhaarModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentWithAadhaar | null>(null);
    const [aadhaarInput, setAadhaarInput] = useState('');
    const [revealedAadhaar, setRevealedAadhaar] = useState<string | null>(null);
    const [isRevealingAadhaar, setIsRevealingAadhaar] = useState(false);

    // View profile modal
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewStudent, setViewStudent] = useState<StudentWithAadhaar | null>(null);

    // Edit student modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editStudent, setEditStudent] = useState<StudentWithAadhaar | null>(null);
    const [editForm, setEditForm] = useState({
        name: '', class: '', section: '', roll_no: 1,
        fee_status: 'pending' as 'paid' | 'pending' | 'overdue',
        admission_number: '', date_of_birth: '', blood_group: '',
        address: '', parent_name: '', parent_phone: '', year_of_joining: new Date().getFullYear()
    });

    // Promote Students Modal
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [promoteClass, setPromoteClass] = useState('');
    const [promoteTargetClass, setPromoteTargetClass] = useState('');
    const [promoteTargetSection, setPromoteTargetSection] = useState('');
    const [eligibleStudents, setEligibleStudents] = useState<StudentWithAadhaar[]>([]);
    const [selectedPromoteIds, setSelectedPromoteIds] = useState<Set<string>>(new Set());

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: 'danger' | 'warning' | 'info';
        confirmLabel: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', variant: 'danger', confirmLabel: 'Confirm', onConfirm: () => { } });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [studentRes, classRes] = await Promise.all([
                studentService.getStudents(),
                schoolService.getClasses()
            ]);

            if (studentRes.data) setStudents(studentRes.data as StudentWithAadhaar[]);
            if (classRes.data) {
                // Filter only valid classes with sections
                setActiveClasses(classRes.data.filter(c => c.status === 'active'));
            }
        } catch (err: any) {
            setError(err.message || t('common.loadingData', 'Failed to load data'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddStudent = async () => {
        if (!newStudent.name.trim()) {
            setError(t('studentProfiles.nameRequired'));
            return;
        }
        if (!newStudent.email.trim() || !newStudent.date_of_birth) {
            setError(t('studentProfiles.emailDobRequired'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await studentService.createStudent(
            {
                name: newStudent.name.trim(),
                email: newStudent.email.trim(),
                class: newStudent.class,
                section: newStudent.section,
                roll_no: newStudent.roll_no,
                date_of_birth: newStudent.date_of_birth,
                fee_status: 'pending',
                status: 'active',
            },
            'admin',
            'Admin User',
            'Administrator'
        );

        if (result.success && result.data) {
            // If Aadhaar was provided, update it
            if (newStudent.aadhaar && newStudent.aadhaar.replace(/\s|-/g, '').length === 12) {
                await aadhaarService.updateStudentAadhaar(
                    result.data.id,
                    newStudent.aadhaar,
                    'admin',
                    'Admin User',
                    'Administrator'
                );
            }

            const pwdMsg = result.temp_password
                ? ` (${t('userManagement.temporaryPassword')}: ${result.temp_password})`
                : '';
            setSuccessMsg(`${t('studentProfiles.enrollSuccess')}${pwdMsg}`);
            setNewStudent({ name: '', class: '6', section: 'A', roll_no: 1, aadhaar: '', email: '', date_of_birth: '' });
            setShowAddModal(false);
            await loadData();
            setTimeout(() => setSuccessMsg(null), 5000);
        } else {
            setError(result.error || t('studentProfiles.failedEnrollStudent'));
        }

        setIsSubmitting(false);
    };

    const handleDeleteStudent = async (id: string, name: string) => {
        setConfirmDialog({
            isOpen: true,
            title: t('studentProfiles.removeStudent'),
            message: t('studentProfiles.removeStudentMsg'),
            variant: 'danger',
            confirmLabel: t('common.remove'),
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                const result = await studentService.deleteStudent(id, 'admin', 'Admin User', 'Administrator');
                if (result.success) {
                    setSuccessMsg(t('studentProfiles.removeStudentSuccess'));
                    await loadData();
                    setTimeout(() => setSuccessMsg(null), 3000);
                } else {
                    setError(result.error || t('studentProfiles.failedRemoveStudent'));
                }
            }
        });
    };

    const handleOpenAadhaarModal = (student: StudentWithAadhaar) => {
        setSelectedStudent(student);
        setAadhaarInput('');
        setRevealedAadhaar(null);
        setShowAadhaarModal(true);
    };

    const handleUpdateAadhaar = async () => {
        if (!selectedStudent) return;

        const validation = aadhaarService.validate(aadhaarInput);
        if (!validation.valid) {
            setError(validation.error || t('studentProfiles.invalidAadhaar'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await aadhaarService.updateStudentAadhaar(
            selectedStudent.id,
            aadhaarInput,
            'admin',
            'Admin User',
            'Administrator'
        );

        if (result.success) {
            setSuccessMsg(t('studentProfiles.aadhaarUpdated'));
            setShowAadhaarModal(false);
            await loadData();
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            setError(result.error || t('studentProfiles.failedUpdateAadhaar'));
        }

        setIsSubmitting(false);
    };

    const handleRevealAadhaar = async () => {
        if (!selectedStudent) return;

        setIsRevealingAadhaar(true);
        const result = await aadhaarService.getDecryptedAadhaar(
            'student',
            selectedStudent.id,
            'admin',
            'Admin User',
            'Administrator'
        );

        if (result.success && result.aadhaar) {
            setRevealedAadhaar(result.aadhaar);
        } else {
            setError(result.error || t('studentProfiles.failedRevealAadhaar'));
        }

        setIsRevealingAadhaar(false);
    };

    // === EXPORT HANDLER ===
    const handleExport = () => {
        const headers = ['Name', 'Class', 'Section', 'Roll No', 'Fee Status', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filteredStudents.map(s =>
                [s.name, s.class, s.section, s.roll_no, s.fee_status, s.status].join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setSuccessMsg(t('studentProfiles.exportSuccess'));
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    // === VIEW PROFILE HANDLER ===
    const handleViewStudent = (student: StudentWithAadhaar) => {
        setViewStudent(student);
        setShowViewModal(true);
    };

    // === EDIT HANDLERS ===
    const handleOpenEditModal = (student: StudentWithAadhaar) => {
        setEditStudent(student);
        setEditForm({
            name: student.name,
            class: student.class,
            section: student.section,
            roll_no: student.roll_no,
            fee_status: student.fee_status,
            admission_number: student.admission_number || '',
            date_of_birth: student.date_of_birth || '',
            blood_group: student.blood_group || '',
            address: student.address || '',
            parent_name: student.parent_name || '',
            parent_phone: student.parent_phone || '',
            year_of_joining: student.year_of_joining || new Date().getFullYear()
        });
        setShowEditModal(true);
    };

    const handleUpdateStudent = async () => {
        if (!editStudent) return;

        setIsSubmitting(true);
        setError(null);

        const result = await studentService.updateStudent(
            editStudent.id,
            {
                name: editForm.name.trim(),
                class: editForm.class,
                section: editForm.section,
                roll_no: editForm.roll_no,
                fee_status: editForm.fee_status,
                admission_number: editForm.admission_number || undefined,
                date_of_birth: editForm.date_of_birth || undefined,
                blood_group: editForm.blood_group || undefined,
                address: editForm.address || undefined,
                parent_name: editForm.parent_name || undefined,
                parent_phone: editForm.parent_phone || undefined,
                year_of_joining: editForm.year_of_joining || undefined
            },
            'admin',
            'Admin User',
            'Administrator'
        );

        if (result.success) {
            setSuccessMsg(t('studentProfiles.studentUpdated'));
            setShowEditModal(false);
            setEditStudent(null);
            await loadData();
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            setError(result.error || t('studentProfiles.failedUpdateStudent'));
        }

        setIsSubmitting(false);
    };

    // === PROMOTION HANDLER ===
    const handleOpenPromoteModal = () => {
        setPromoteClass('9'); // Default or first available
        setPromoteTargetClass('10');
        setPromoteTargetSection('A');
        setShowPromoteModal(true);
    };

    // Auto-fetch students when promote class changes
    useEffect(() => {
        if (showPromoteModal && promoteClass) {
            const potentials = students.filter(s => s.class === promoteClass && s.status === 'active');
            setEligibleStudents(potentials);
            // Select all by default
            setSelectedPromoteIds(new Set(potentials.map(s => s.id)));
        }
    }, [showPromoteModal, promoteClass, students]);

    const handleTogglePromoteSelection = (id: string) => {
        const newSet = new Set(selectedPromoteIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedPromoteIds(newSet);
    };

    const handlePromoteStudents = async () => {
        if (selectedPromoteIds.size === 0) return;

        setConfirmDialog({
            isOpen: true,
            title: t('studentProfiles.promoteClass'),
            message: `${t('studentProfiles.removeStudentMsg', 'Are you sure you want to promote')} ${selectedPromoteIds.size} ${t('studentProfiles.eligibleStudents')} ${t('studentProfiles.toClassSection')} ${promoteTargetClass}-${promoteTargetSection}?`,
            variant: 'warning',
            confirmLabel: t('studentProfiles.promoteClass'),
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                setIsSubmitting(true);
                setError(null);

                const result = await studentService.promoteStudents(
                    Array.from(selectedPromoteIds),
                    promoteTargetClass,
                    promoteTargetSection,
                    'admin',
                    'Admin User',
                    'Administrator'
                );

                if (result.success) {
                    setSuccessMsg(t('studentProfiles.promoteSuccess'));
                    setShowPromoteModal(false);
                    await loadData();
                    setTimeout(() => setSuccessMsg(null), 5000);
                } else {
                    setError(result.error || t('studentProfiles.failedPromote'));
                }

                setIsSubmitting(false);
            }
        });
    };

    const filteredStudents = students.filter(s =>
        isBilingualMatch(s.name, searchTerm) &&
        (filterClass === 'All' || s.class === filterClass)
    );

    const classOptions = ['All', ...Array.from(new Set(students.map(s => s.class))).sort()];
    const activeCount = students.filter(s => s.status === 'active').length;
    const paidCount = students.filter(s => s.fee_status === 'paid').length;
    const verifiedCount = students.filter(s => s.aadhaar_verified).length;

    return (
        <div className="space-y-6">


            {error && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <XCircle className="text-red-600" size={20} />
                        <span className="text-red-800">{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-600">×</button>
                </div>
            )}

            {successMsg && (
                <div className="bg-green-50 border border-green-300 rounded-xl p-4 flex items-center space-x-3">
                    <CheckCircle className="text-green-600" size={20} />
                    <span className="text-green-800">{successMsg}</span>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <GraduationCap size={28} className="opacity-80" />
                        <span className="text-3xl font-bold">{isLoading ? '...' : students.length}</span>
                    </div>
                    <p className="text-indigo-100 font-medium text-sm">{t('overviewDashboard.totalStudents', 'Total Students')}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">✓</span>
                        <span className="text-3xl font-bold">{isLoading ? '...' : activeCount}</span>
                    </div>
                    <p className="text-green-100 font-medium text-sm">{t('common.active')}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">💳</span>
                        <span className="text-3xl font-bold">{isLoading ? '...' : paidCount}</span>
                    </div>
                    <p className="text-blue-100 font-medium text-sm">{t('studentPortal.paid')}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">📊</span>
                        <span className="text-3xl font-bold">{isLoading ? '...' : Math.round((paidCount / students.length) * 100) || 0}%</span>
                    </div>
                    <p className="text-amber-100 font-medium text-sm">{t('overviewDashboard.feeCollection', 'Fee Collection')}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Shield size={28} className="opacity-80" />
                        <span className="text-3xl font-bold">{isLoading ? '...' : verifiedCount}</span>
                    </div>
                    <p className="text-purple-100 font-medium text-sm">{t('studentProfiles.idVerified')}</p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('studentProfiles.searchPlaceholder')}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                    >
                        {classOptions.map(c => <option key={c} value={c}>{c === 'All' ? t('studentProfiles.allClasses') : `${t('forms.class')} ${c}`}</option>)}
                    </select>
                </div>
                <div className="flex flex-wrap gap-2 sm:space-x-3">
                    <button onClick={loadData} className="flex items-center space-x-2 bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200" disabled={isLoading}>
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">{t('common.refresh')}</span>
                    </button>
                    <button onClick={handleExport} className="flex items-center space-x-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200">
                        <Download size={18} />
                        <span className="hidden sm:inline">{t('common.export')}</span>
                    </button>
                    <button
                        onClick={handleOpenPromoteModal}
                        className="flex items-center space-x-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-lg hover:bg-amber-200"
                    >
                        <ArrowRight size={18} />
                        <span className="hidden sm:inline">{t('studentProfiles.promoteClass')}</span>
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">{t('studentProfiles.enrollStudent')}</span>
                    </button>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="bg-white rounded-2xl shadow-sm border p-12 flex items-center justify-center">
                    <Loader2 size={32} className="text-indigo-600 animate-spin" />
                    <span className="ml-3 text-slate-600">{t('studentProfiles.loadingStudents')}</span>
                </div>
            )}

            {/* Students Table */}
            {!isLoading && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('common.name')}</th>
                                    <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('forms.class')}</th>
                                    <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('forms.rollNo')}</th>
                                    <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('studentPortal.feeStatus')}</th>
                                    <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                                        <div className="flex items-center justify-center space-x-1">
                                            <Shield size={14} />
                                            <span>{t('forms.aadhaar')}</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-semibold text-slate-800">{student.name}</td>
                                        <td className="px-4 py-4 text-center">{student.class}-{student.section}</td>
                                        <td className="px-4 py-4 text-center">{student.roll_no}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${student.fee_status === 'paid' ? 'bg-green-100 text-green-700' :
                                                student.fee_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {t(`studentPortal.${student.fee_status}`, { defaultValue: student.fee_status }).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {student.aadhaar_verified ? (
                                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 flex items-center justify-center space-x-1">
                                                    <Lock size={12} />
                                                    <span>XXXX-{student.aadhaar_last4}</span>
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">{t('studentProfiles.notVerified')}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                <button
                                                    onClick={() => handleViewStudent(student)}
                                                    className="p-2 hover:bg-slate-100 rounded-lg"
                                                    title={t('common.view')}
                                                >
                                                    <Eye size={16} className="text-slate-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenAadhaarModal(student)}
                                                    className="p-2 hover:bg-purple-100 rounded-lg"
                                                    title={t('studentProfiles.aadhaarMgmt')}
                                                >
                                                    <Shield size={16} className="text-purple-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEditModal(student)}
                                                    className="p-2 hover:bg-blue-100 rounded-lg"
                                                    title={t('common.edit')}
                                                >
                                                    <Edit size={16} className="text-blue-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStudent(student.id, student.name)}
                                                    className="p-2 hover:bg-red-100 rounded-lg"
                                                    title={t('common.delete')}
                                                >
                                                    <Trash2 size={16} className="text-red-600" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredStudents.length === 0 && (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">{t('studentProfiles.noStudentsFound')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">{t('studentProfiles.enrollNewStudent')}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('userManagement.fullName')}</label>
                                <input type="text" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: sanitizeName(e.target.value) })} placeholder={`e.g., Priya Sharma (${t('common.lettersOnly')})`} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('userManagement.emailLabel')}</label>
                                    <input type="email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} placeholder="student@school.com" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('forms.dob')} *</label>
                                    <input type="date" value={newStudent.date_of_birth} onChange={e => setNewStudent({ ...newStudent, date_of_birth: e.target.value })} max={getTodayDate()} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <p className="text-xs text-indigo-600 bg-indigo-50 p-2 rounded">📝 {t('studentProfiles.pwdHint')}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('studentProfiles.selectClassActive')}</label>
                                    {activeClasses.length > 0 ? (
                                        <select
                                            value={activeClasses.find(c => c.grade_level === newStudent.class && c.section === newStudent.section)?.id || ''}
                                            onChange={e => {
                                                const selected = activeClasses.find(c => c.id === e.target.value);
                                                if (selected) {
                                                    setNewStudent({
                                                        ...newStudent,
                                                        class: selected.grade_level,
                                                        section: selected.section
                                                    });
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="">{t('schoolStructure.selectClass')}</option>
                                            {activeClasses
                                                .sort((a, b) => {
                                                    const gA = parseInt(a.grade_level) || 0;
                                                    const gB = parseInt(b.grade_level) || 0;
                                                    return gA - gB || (a.section || '').localeCompare(b.section || '');
                                                })
                                                .map(cls => (
                                                    <option key={cls.id} value={cls.id}>
                                                        {t('forms.class')} {cls.grade_level}-{cls.section} (ID: {cls.id.slice(0, 4)}...)
                                                    </option>
                                                ))}
                                        </select>
                                    ) : (
                                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                                            {t('studentProfiles.noActiveClasses')}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('forms.rollNo')}</label>
                                    <input type="number" min={1} value={newStudent.roll_no} onChange={e => setNewStudent({ ...newStudent, roll_no: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center space-x-2">
                                    <Shield size={14} className="text-purple-600" />
                                    <span>{t('studentProfiles.aadhaarOptional')}</span>
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={newStudent.aadhaar}
                                    onChange={e => setNewStudent({ ...newStudent, aadhaar: sanitizeAadhaar(e.target.value) })}
                                    placeholder={t('studentProfiles.aadhaarPlaceholder')}
                                    maxLength={12}
                                    className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-purple-50"
                                />
                                <p className="text-xs text-slate-500 mt-1">{t('studentProfiles.aadhaarSecureHint')}</p>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg" disabled={isSubmitting}>{t('common.cancel')}</button>
                            <button onClick={handleAddStudent} disabled={isSubmitting || !newStudent.name.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50">
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                <span>{isSubmitting ? t('studentProfiles.enrolling') : t('studentProfiles.enrollStudent')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Aadhaar Management Modal (Admin Only) */}
            {showAadhaarModal && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Shield className="text-purple-600" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{t('studentProfiles.aadhaarMgmt')}</h3>
                                <p className="text-sm text-slate-500">{selectedStudent.name}</p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                             <p className="text-xs text-amber-800 flex items-center space-x-2">
                                <Lock size={14} />
                                <span><strong>{t('studentProfiles.adminOnlyAudited')}</strong></span>
                            </p>
                        </div>

                        {/* Current Status */}
                        <div className="bg-slate-50 rounded-lg p-4 mb-4">
                            <p className="text-sm text-slate-600 mb-2">{t('studentProfiles.currentStatus')}</p>
                            {selectedStudent.aadhaar_verified ? (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-purple-700">
                                        {revealedAadhaar || `XXXX-XXXX-${selectedStudent.aadhaar_last4}`}
                                    </span>
                                    <button
                                        onClick={handleRevealAadhaar}
                                        disabled={isRevealingAadhaar}
                                        className="text-xs text-purple-600 hover:text-purple-700 flex items-center space-x-1"
                                    >
                                        {isRevealingAadhaar ? (
                                            <Loader2 size={12} className="animate-spin" />
                                        ) : revealedAadhaar ? (
                                            <EyeOff size={12} />
                                        ) : (
                                            <Eye size={12} />
                                        )}
                                        <span>{revealedAadhaar ? t('common.hide', 'Hide') : t('common.reveal', 'Reveal Full')}</span>
                                    </button>
                                </div>
                            ) : (
                                <span className="text-slate-400 text-sm">{t('studentProfiles.notVerified')}</span>
                            )}
                        </div>

                        {/* Update Aadhaar */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700">
                                {selectedStudent.aadhaar_verified ? t('common.update', 'Update') : t('common.add', 'Enter')} {t('forms.aadhaar')}
                            </label>
                            <input
                                type="text"
                                value={aadhaarInput}
                                onChange={e => setAadhaarInput(e.target.value)}
                                placeholder="1234 5678 9012"
                                maxLength={14}
                                className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-purple-50 text-lg tracking-wide"
                            />
                            <p className="text-xs text-slate-500">{t('studentProfiles.enter12DigitAadhaar')}</p>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAadhaarModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleUpdateAadhaar}
                                disabled={isSubmitting || aadhaarInput.replace(/\s|-/g, '').length !== 12}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 disabled:opacity-50"
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                <Shield size={16} />
                                <span>{isSubmitting ? t('studentProfiles.saving') : t('studentProfiles.saveAadhaar')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Profile Modal */}
            {showViewModal && viewStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center space-x-4 mb-6 pb-4 border-b">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                                <GraduationCap className="text-indigo-600" size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">{viewStudent.name}</h3>
                                <p className="text-sm text-slate-500">
                                    {viewStudent.admission_number ? `${t('studentProfiles.studentId')}: ${viewStudent.admission_number}` : t('studentProfiles.studentProfile')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Academic Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-indigo-50 p-3 rounded-xl">
                                    <p className="text-xs text-indigo-500 uppercase font-bold mb-1">{t('forms.class')}</p>
                                    <p className="text-lg font-semibold text-indigo-800">{viewStudent.class}-{viewStudent.section}</p>
                                </div>
                                <div className="bg-indigo-50 p-3 rounded-xl">
                                    <p className="text-xs text-indigo-500 uppercase font-bold mb-1">{t('forms.rollNo')}</p>
                                    <p className="text-lg font-semibold text-indigo-800">{viewStudent.roll_no}</p>
                                </div>
                                <div className="bg-indigo-50 p-3 rounded-xl">
                                    <p className="text-xs text-indigo-500 uppercase font-bold mb-1">{t('studentProfiles.yearJoined')}</p>
                                    <p className="text-lg font-semibold text-indigo-800">{viewStudent.year_of_joining || '-'}</p>
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">{t('forms.dob')}</p>
                                    <p className="font-semibold text-slate-800">
                                        {viewStudent.date_of_birth
                                            ? new Date(viewStudent.date_of_birth).toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : '-'}
                                    </p>
                                    {viewStudent.date_of_birth && (
                                        <p className="text-xs text-slate-400 mt-1">
                                            {t('studentProfiles.ageYears', { age: Math.floor((Date.now() - new Date(viewStudent.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) })}
                                        </p>
                                    )}
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">{t('teacherManagement.bloodGroup')}</p>
                                    <p className="font-semibold text-slate-800">{viewStudent.blood_group || '-'}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">{t('common.status')}</p>
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${viewStudent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                        {t(`common.${viewStudent.status}`, { defaultValue: viewStudent.status }).toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Parent/Guardian Info */}
                            <div className="bg-blue-50 p-4 rounded-xl">
                                <p className="text-xs text-blue-600 uppercase font-bold mb-2">👨‍👩‍👧 {t('studentProfiles.parentGuardianInfo')}</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500">{t('common.name')}</p>
                                        <p className="font-semibold text-slate-800">{viewStudent.parent_name || t('studentProfiles.notProvided')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">{t('common.phone')}</p>
                                        <p className="font-semibold text-slate-800">{viewStudent.parent_phone || t('studentProfiles.notProvided')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            {viewStudent.address && (
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">📍 {t('common.address')}</p>
                                    <p className="text-slate-800">{viewStudent.address}</p>
                                </div>
                            )}

                            {/* Fee Status */}
                            <div className="flex items-center space-x-4">
                                <div className="bg-slate-50 p-3 rounded-xl flex-1">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">{t('studentPortal.feeStatus')}</p>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${viewStudent.fee_status === 'paid' ? 'bg-green-100 text-green-700' :
                                        viewStudent.fee_status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                        {t(`studentPortal.${viewStudent.fee_status}`, { defaultValue: viewStudent.fee_status }).toUpperCase()}
                                    </span>
                                </div>
                                {viewStudent.aadhaar_verified && (
                                    <div className="bg-purple-50 p-3 rounded-xl flex-1 flex items-center space-x-2">
                                        <Shield size={16} className="text-purple-600" />
                                        <span className="text-purple-700 text-sm font-medium">{t('forms.aadhaar')}: XXXX-{viewStudent.aadhaar_last4}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end mt-6 pt-4 border-t">
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                            >
                                {t('common.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Promote Students Modal */}
            {showPromoteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <ArrowRight className="text-amber-600" />
                                    {t('studentProfiles.studentPromotion')}
                                </h3>
                                <p className="text-sm text-slate-500">{t('studentProfiles.bulkMove')}</p>
                            </div>
                            <button onClick={() => setShowPromoteModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('studentProfiles.fromClass')}</label>
                                <select
                                    value={promoteClass}
                                    onChange={e => setPromoteClass(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-700"
                                >
                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'].map(c => (
                                        <option key={c} value={c}>{t('forms.class')} {c}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-2">{eligibleStudents.length} {t('studentProfiles.eligibleStudents')}</p>
                            </div>

                            <div className="flex items-center justify-center">
                                <div className="bg-amber-100 p-3 rounded-full">
                                    <ArrowRight className="text-amber-600" size={24} />
                                </div>
                            </div>

                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                                <label className="block text-xs font-bold text-indigo-500 uppercase mb-2">{t('studentProfiles.toClassSection')}</label>
                                <select
                                    value={activeClasses.find(c => c.grade_level === promoteTargetClass && c.section === promoteTargetSection)?.id || ''}
                                    onChange={e => {
                                        const selected = activeClasses.find(c => c.id === e.target.value);
                                        if (selected) {
                                            setPromoteTargetClass(selected.grade_level);
                                            setPromoteTargetSection(selected.section);
                                        }
                                    }}
                                    className="w-full p-2 border border-indigo-300 rounded-lg font-bold text-indigo-700"
                                >
                                    <option value="">{t('studentProfiles.selectTarget')}</option>
                                    {activeClasses
                                        .sort((a, b) => {
                                            const gA = parseInt(a.grade_level) || 0;
                                            const gB = parseInt(b.grade_level) || 0;
                                            return gA - gB || (a.section || '').localeCompare(b.section || '');
                                        })
                                        .map(cls => (
                                            <option key={cls.id} value={cls.id}>
                                                {t('forms.class')} {cls.grade_level}-{cls.section}
                                            </option>
                                        ))}
                                </select>
                                <p className="text-xs text-indigo-600 mt-2">{t('studentProfiles.targetDestination')}</p>
                            </div>
                        </div>

                        {/* List of Eligible Students */}
                        <div className="flex-1 overflow-auto border rounded-xl mb-6">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="p-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={eligibleStudents.length > 0 && selectedPromoteIds.size === eligibleStudents.length}
                                                onChange={() => {
                                                    if (selectedPromoteIds.size === eligibleStudents.length) setSelectedPromoteIds(new Set());
                                                    else setSelectedPromoteIds(new Set(eligibleStudents.map(s => s.id)));
                                                }}
                                                className="rounded border-slate-300"
                                            />
                                        </th>
                                        <th className="p-3 text-left font-semibold text-slate-600">{t('teacherManagement.name')}</th>
                                        <th className="p-3 text-center font-semibold text-slate-600">{t('forms.rollNo')}</th>
                                        <th className="p-3 text-center font-semibold text-slate-600">{t('schoolStructure.section')}</th>
                                        <th className="p-3 text-center font-semibold text-slate-600">{t('studentPortal.feeStatus')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {eligibleStudents.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400">{t('studentProfiles.noEligibleStudents')} {promoteClass}</td></tr>
                                    ) : (
                                        eligibleStudents.map(student => (
                                            <tr key={student.id} className={selectedPromoteIds.has(student.id) ? 'bg-indigo-50/50' : ''}>
                                                <td className="p-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPromoteIds.has(student.id)}
                                                        onChange={() => handleTogglePromoteSelection(student.id)}
                                                        className="rounded border-slate-300"
                                                    />
                                                </td>
                                                <td className="p-3 font-medium text-slate-800">{student.name}</td>
                                                <td className="p-3 text-center text-slate-500">{student.roll_no}</td>
                                                <td className="p-3 text-center text-slate-500">{student.section}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${student.fee_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {t(`studentPortal.${student.fee_status}`, { defaultValue: student.fee_status }).toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                            <div className="text-sm text-slate-500">
                                {t('studentProfiles.selectedStudentsCount', { count: selectedPromoteIds.size })}
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowPromoteModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handlePromoteStudents}
                                    disabled={isSubmitting || selectedPromoteIds.size === 0}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
                                    <span>{t('studentProfiles.promoteSelected')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showEditModal && editStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">{t('studentProfiles.editStudentProfile')}</h3>
                        <div className="space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('userManagement.fullName')}</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('studentProfiles.studentId')} ({t('userManagement.admissionNo')})</label>
                                    <input
                                        type="text"
                                        value={editForm.admission_number}
                                        onChange={e => setEditForm({ ...editForm, admission_number: e.target.value })}
                                        placeholder="e.g. STU2026001"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Academic Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('studentProfiles.toClassSection')}</label>
                                    <select
                                        value={activeClasses.find(c => c.grade_level === editForm.class && c.section === editForm.section)?.id || ''}
                                        onChange={e => {
                                            const selected = activeClasses.find(c => c.id === e.target.value);
                                            if (selected) {
                                                setEditForm({
                                                    ...editForm,
                                                    class: selected.grade_level,
                                                    section: selected.section
                                                });
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">{t('schoolStructure.selectClass')}</option>
                                        {activeClasses
                                            .sort((a, b) => {
                                                const gA = parseInt(a.grade_level) || 0;
                                                const gB = parseInt(b.grade_level) || 0;
                                                return gA - gB || (a.section || '').localeCompare(b.section || '');
                                            })
                                            .map(cls => (
                                                <option key={cls.id} value={cls.id}>
                                                    {t('forms.class')} {cls.grade_level}-{cls.section}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('forms.rollNo')}</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={editForm.roll_no}
                                        onChange={e => setEditForm({ ...editForm, roll_no: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('studentProfiles.yearJoined')}</label>
                                    <input
                                        type="number"
                                        min={2000}
                                        max={2030}
                                        value={editForm.year_of_joining}
                                        onChange={e => setEditForm({ ...editForm, year_of_joining: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('forms.dob')}</label>
                                    <input
                                        type="date"
                                        value={editForm.date_of_birth}
                                        onChange={e => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                                        max={getTodayDate()}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.bloodGroup')}</label>
                                    <select
                                        value={editForm.blood_group}
                                        onChange={e => setEditForm({ ...editForm, blood_group: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    >
                                        <option value="">{t('teacherManagement.select')}</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('studentPortal.feeStatus')}</label>
                                    <select
                                        value={editForm.fee_status}
                                        onChange={e => setEditForm({ ...editForm, fee_status: e.target.value as 'paid' | 'pending' | 'overdue' })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    >
                                        <option value="paid">{t('studentPortal.paid')}</option>
                                        <option value="pending">{t('studentPortal.pending')}</option>
                                        <option value="overdue">{t('studentPortal.overdue')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Parent Info */}
                            <div className="bg-blue-50 p-4 rounded-xl">
                                <p className="text-sm font-medium text-blue-700 mb-3">👨‍👩‍👧 {t('studentProfiles.parentGuardianInfo')}</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentManagement.parent')} {t('common.name')}</label>
                                        <input
                                            type="text"
                                            value={editForm.parent_name}
                                            onChange={e => setEditForm({ ...editForm, parent_name: sanitizeName(e.target.value) })}
                                            placeholder={t('common.lettersOnly')}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentManagement.parent')} {t('common.phone')}</label>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            value={editForm.parent_phone}
                                            onChange={e => setEditForm({ ...editForm, parent_phone: sanitizePhone(e.target.value) })}
                                            placeholder={t('common.numbersOnly')}
                                            maxLength={10}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.address')}</label>
                                <textarea
                                    rows={2}
                                    value={editForm.address}
                                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                    placeholder={t('studentProfiles.enterFullAddress')}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                            <button
                                onClick={() => { setShowEditModal(false); setEditStudent(null); }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                disabled={isSubmitting}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleUpdateStudent}
                                disabled={isSubmitting || !editForm.name.trim()}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50"
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                <span>{t('common.saveChanges')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmLabel={confirmDialog.confirmLabel}
                variant={confirmDialog.variant}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default StudentProfiles;

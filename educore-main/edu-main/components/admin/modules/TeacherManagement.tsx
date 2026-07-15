import React, { useState, useEffect } from 'react';
import { Briefcase, Search, Plus, Download, Award, Loader2, AlertTriangle, CheckCircle, XCircle, RefreshCw, Eye, Edit, Trash2 } from 'lucide-react';
import { teacherService, Teacher } from '../../../services/teacherService';
import { ConfirmDialog } from '../../ConfirmDialog';
import { sanitizeName, sanitizePhone, getTodayDate } from '../../../utils/inputValidation';
import { useTranslation } from 'react-i18next';


export const TeacherManagement: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Form states
    const [showAddTeacher, setShowAddTeacher] = useState(false);
    const [newTeacher, setNewTeacher] = useState({
        name: '', email: '', subject: '', experience: 0,
        phone: '', designation: 'Teacher', qualification: '',
        employee_id: '', join_date: new Date().toISOString().split('T')[0],
        date_of_birth: '' // Required for login credentials
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // View/Edit Modal states
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
    const [editForm, setEditForm] = useState({
        name: '', email: '', subject: '', experience_years: 0,
        phone: '', designation: 'Teacher', qualification: '',
        employee_id: '', address: '', date_of_birth: '', blood_group: '',
        status: 'active' as 'active' | 'leave' | 'resigned'
    });

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const { t } = useTranslation();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        const result = await teacherService.getTeachers();
        if (result.error) {
            setError(result.error);
            setTeachers([]);
        } else {
            setTeachers(result.data);
        }
        setIsLoading(false);
    };

    const handleAddTeacher = async () => {
        if (!newTeacher.name.trim() || !newTeacher.email.trim()) {
            setError(t('teacherManagement.nameEmailRequired'));
            return;
        }
        if (!newTeacher.date_of_birth) {
            setError(t('teacherManagement.dobRequired2'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await teacherService.createTeacher(
            {
                name: newTeacher.name.trim(),
                email: newTeacher.email.trim(),
                subject: newTeacher.subject.trim(),
                classes: [],
                experience_years: newTeacher.experience,
                status: 'active',
                join_date: newTeacher.join_date || new Date().toISOString().split('T')[0],
                // Required for identity creation
                date_of_birth: newTeacher.date_of_birth,
                // Extended fields
                phone: newTeacher.phone,
                designation: newTeacher.designation,
                qualification: newTeacher.qualification,
                employee_id: newTeacher.employee_id
            },
            'admin',
            'Admin User',
            'Administrator'
        );

        if (result.success) {
            const pwdMsg = result.temp_password
                ? ` (Temp Password: ${result.temp_password})`
                : '';
            setSuccessMsg(`${t('teacherManagement.teacher', 'Teacher')} "${newTeacher.name}" ${t('teacherManagement.addedSuccess', 'added successfully')}${pwdMsg}`);
            setNewTeacher({
                name: '', email: '', subject: '', experience: 0,
                phone: '', designation: 'Teacher', qualification: '',
                employee_id: '', date_of_birth: '',
                join_date: new Date().toISOString().split('T')[0]
            });
            setShowAddTeacher(false);
            await loadData();
            setTimeout(() => setSuccessMsg(null), 5000);
        } else {
            setError(result.error || t('teacherManagement.failedAddTeacher', 'Failed to add teacher'));
        }

        setIsSubmitting(false);
    };

    const handleOpenEditModal = (teacher: Teacher) => {
        setEditTeacher(teacher);
        setEditForm({
            name: teacher.name,
            email: teacher.email,
            subject: teacher.subject,
            experience_years: teacher.experience_years,
            status: teacher.status,
            phone: teacher.phone || '',
            designation: teacher.designation || 'Teacher',
            qualification: teacher.qualification || '',
            employee_id: teacher.employee_id || '',
            address: teacher.address || '',
            date_of_birth: teacher.date_of_birth || '',
            blood_group: teacher.blood_group || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateTeacher = async () => {
        if (!editTeacher || !editForm.name.trim()) return;

        setIsSubmitting(true);
        const result = await teacherService.updateTeacher(
            editTeacher.id,
            {
                name: editForm.name.trim(),
                email: editForm.email.trim(),
                subject: editForm.subject.trim(),
                experience_years: editForm.experience_years,
                status: editForm.status,
                phone: editForm.phone,
                designation: editForm.designation,
                qualification: editForm.qualification,
                employee_id: editForm.employee_id,
                address: editForm.address,
                date_of_birth: editForm.date_of_birth || undefined, // undefined if empty string
                blood_group: editForm.blood_group || undefined
            },
            'admin',
            'Admin User',
            'Administrator'
        );

        if (result.success) {
            setSuccessMsg(t('teacherManagement.teacherUpdated'));
            setShowEditModal(false);
            setEditTeacher(null);
            await loadData();
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            setError(result.error || t('teacherManagement.failedUpdateTeacher', 'Failed to update teacher'));
        }
        setIsSubmitting(false);
    };

    const handleDeleteTeacher = async (id: string, name: string) => {
        setConfirmDialog({
            isOpen: true,
            title: t('teacherManagement.removeTeacherTitle'),
            message: t('teacherManagement.removeTeacherMsg'),
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                const result = await teacherService.deleteTeacher(id, 'admin', 'Admin User', 'Administrator');
                if (result.success) {
                    setSuccessMsg(`${t('teacherManagement.teacherRemoved', 'Teacher removed')}: "${name}"`);
                    await loadData();
                    setTimeout(() => setSuccessMsg(null), 3000);
                } else {
                    setError(result.error || t('teacherManagement.failedRemoveTeacher', 'Failed to remove teacher'));
                }
            }
        });
    };

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = teachers.filter(t => t.status === 'active').length;
    const leaveCount = teachers.filter(t => t.status === 'leave').length;

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <Briefcase size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">{isLoading ? '...' : teachers.length}</span>
                    </div>
                    <p className="text-purple-100 font-medium">{t('teacherManagement.totalTeachers')}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">✓</span>
                        <span className="text-3xl font-bold">{isLoading ? '...' : activeCount}</span>
                    </div>
                    <p className="text-green-100 font-medium">{t('teacherManagement.active')}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">🌴</span>
                        <span className="text-3xl font-bold">{isLoading ? '...' : leaveCount}</span>
                    </div>
                    <p className="text-amber-100 font-medium">{t('teacherManagement.onLeave')}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <Award size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">12</span>
                    </div>
                    <p className="text-cyan-100 font-medium">{t('teacherManagement.classTeachers')}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('teacherManagement.searchPlaceholder')}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={loadData} className="flex items-center space-x-2 bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200" disabled={isLoading}>
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">{t('common.refresh')}</span>
                    </button>
                    <button
                        className="flex items-center space-x-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200"
                        onClick={() => alert(t('teacherManagement.exportMsg', 'Export will download teacher data as CSV'))}
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">{t('common.export')}</span>
                    </button>
                    <button
                        onClick={() => setShowAddTeacher(true)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">{t('teacherManagement.addTeacher')}</span>
                    </button>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="bg-white rounded-2xl shadow-sm border p-12 flex items-center justify-center">
                    <Loader2 size={32} className="text-indigo-600 animate-spin" />
                    <span className="ml-3 text-slate-600">{t('teacherManagement.loadingTeachers')}</span>
                </div>
            )}

            {/* Table */}
            {!isLoading && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('teacherManagement.name')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('teacherManagement.subject')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('teacherManagement.email')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('teacherManagement.experience')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('teacherManagement.status')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('teacherManagement.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTeachers.map(teacher => (
                                    <tr key={teacher.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-semibold text-slate-800">{teacher.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{teacher.subject}</td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">{teacher.email}</td>
                                        <td className="px-6 py-4 text-center">{teacher.experience_years} {t('common.yrs', 'yrs')}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${teacher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {t(`teacherManagement.${teacher.status === 'leave' ? 'onLeaveStatus' : teacher.status === 'resigned' ? 'resigned' : 'active'}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => { setViewTeacher(teacher); setShowViewModal(true); }}
                                                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                                    title={t('common.view', 'View')}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEditModal(teacher)}
                                                    className="p-1 text-slate-400 hover:text-amber-600 transition-colors"
                                                    title={t('common.edit', 'Edit')}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                                                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                    title={t('common.delete', 'Delete')}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTeachers.length === 0 && (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">{t('teacherManagement.noTeachersFound')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Teacher Modal */}
            {showAddTeacher && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">{t('teacherManagement.addNewTeacher')}</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.fullName')}</label>
                                    <input type="text" value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: sanitizeName(e.target.value) })} placeholder={t('common.lettersOnly')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.employeeId')}</label>
                                    <input type="text" value={newTeacher.employee_id} onChange={e => setNewTeacher({ ...newTeacher, employee_id: e.target.value })} placeholder={t('common.autoGenerate')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.email')}</label>
                                    <input type="email" value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.phone')}</label>
                                    <input type="tel" inputMode="numeric" value={newTeacher.phone} onChange={e => setNewTeacher({ ...newTeacher, phone: sanitizePhone(e.target.value) })} placeholder={t('common.numbersOnly')} maxLength={10} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.subject')}</label>
                                    <input type="text" value={newTeacher.subject} onChange={e => setNewTeacher({ ...newTeacher, subject: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.designation')}</label>
                                    <input type="text" value={newTeacher.designation} onChange={e => setNewTeacher({ ...newTeacher, designation: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.qualification')}</label>
                                    <input type="text" value={newTeacher.qualification} onChange={e => setNewTeacher({ ...newTeacher, qualification: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.experienceYears')}</label>
                                    <input type="number" min={0} value={newTeacher.experience} onChange={e => setNewTeacher({ ...newTeacher, experience: Number(e.target.value) })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-4">
                                <label className="block text-sm font-medium text-indigo-800 mb-1">{t('teacherManagement.dobRequired')}</label>
                                <p className="text-xs text-indigo-600 mb-2">{t('teacherManagement.dobHint')}</p>
                                <input
                                    type="date"
                                    value={newTeacher.date_of_birth}
                                    onChange={e => setNewTeacher({ ...newTeacher, date_of_birth: e.target.value })}
                                    max={getTodayDate()}
                                    className="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                    required
                                />
                            </div>

                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button onClick={() => setShowAddTeacher(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg" disabled={isSubmitting}>{t('common.cancel')}</button>
                            <button onClick={handleAddTeacher} disabled={isSubmitting || !newTeacher.name.trim() || !newTeacher.email.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50">
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                <span>{isSubmitting ? t('teacherManagement.adding') : t('teacherManagement.addTeacher')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Teacher Modal */}
            {showViewModal && viewTeacher && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-start mb-6 border-b pb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">{viewTeacher.name}</h3>
                                <p className="text-slate-500">{viewTeacher.designation} • {viewTeacher.employee_id}</p>
                            </div>
                            <span className={`px-3 py-1 text-sm font-bold rounded-full ${viewTeacher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {t(`teacherManagement.${viewTeacher.status === 'leave' ? 'onLeaveStatus' : viewTeacher.status === 'resigned' ? 'resigned' : 'active'}`).toUpperCase()}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-semibold text-indigo-900 mb-3 flex items-center"><Briefcase size={16} className="mr-2" /> {t('teacherManagement.professional')}</h4>
                                <div className="space-y-3">
                                    <div><span className="text-xs text-slate-500 block">{t('teacherManagement.subject')}</span> <span className="text-slate-700">{viewTeacher.subject}</span></div>
                                    <div><span className="text-xs text-slate-500 block">{t('teacherManagement.qualification')}</span> <span className="text-slate-700">{viewTeacher.qualification || '-'}</span></div>
                                    <div><span className="text-xs text-slate-500 block">{t('teacherManagement.experience')}</span> <span className="text-slate-700">{viewTeacher.experience_years} {t('common.years', 'years')}</span></div>
                                    <div><span className="text-xs text-slate-500 block">{t('teacherManagement.joined')}</span> <span className="text-slate-700">{viewTeacher.join_date}</span></div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-indigo-900 mb-3 flex items-center"><Award size={16} className="mr-2" /> {t('teacherManagement.personalContact')}</h4>
                                <div className="space-y-3">
                                    <div><span className="text-xs text-slate-500 block">{t('teacherManagement.email')}</span> <span className="text-slate-700">{viewTeacher.email}</span></div>
                                    <div><span className="text-xs text-slate-500 block">{t('teacherManagement.phone')}</span> <span className="text-slate-700">{viewTeacher.phone || '-'}</span></div>
                                    <div><span className="text-xs text-slate-500 block">{t('teacherManagement.dob')}</span> <span className="text-slate-700">{viewTeacher.date_of_birth || '-'}</span></div>
                                    <div><span className="text-xs text-slate-500 block">{t('teacherManagement.bloodGroup')}</span> <span className="text-slate-700">{viewTeacher.blood_group || '-'}</span></div>
                                    <div><span className="text-xs text-slate-500 block">{t('teacherManagement.address')}</span> <span className="text-slate-700">{viewTeacher.address || '-'}</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button onClick={() => setShowViewModal(false)} className="px-5 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">{t('common.close')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Teacher Modal */}
            {showEditModal && editTeacher && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">{t('teacherManagement.editTeacherProfile')}</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.fullName')}</label>
                                    <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: sanitizeName(e.target.value) })} placeholder={t('common.lettersOnly')} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.employeeId')}</label>
                                    <input type="text" value={editForm.employee_id} onChange={e => setEditForm({ ...editForm, employee_id: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.email')}</label>
                                    <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.phone')}</label>
                                    <input type="tel" inputMode="numeric" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: sanitizePhone(e.target.value) })} placeholder={t('common.numbersOnly')} maxLength={10} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.subject')}</label>
                                    <input type="text" value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.designation')}</label>
                                    <input type="text" value={editForm.designation} onChange={e => setEditForm({ ...editForm, designation: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.status')}</label>
                                    <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as any })} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                        <option value="active">{t('teacherManagement.active')}</option>
                                        <option value="leave">{t('teacherManagement.onLeaveStatus')}</option>
                                        <option value="resigned">{t('teacherManagement.resigned')}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.dob')}</label>
                                    <input type="date" value={editForm.date_of_birth} onChange={e => setEditForm({ ...editForm, date_of_birth: e.target.value })} max={getTodayDate()} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.bloodGroup')}</label>
                                    <select value={editForm.blood_group} onChange={e => setEditForm({ ...editForm, blood_group: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                        <option value="">{t('teacherManagement.select')}</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.experience')}</label>
                                    <input type="number" value={editForm.experience_years} onChange={e => setEditForm({ ...editForm, experience_years: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacherManagement.address')}</label>
                                <textarea rows={2} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                            </div>

                        </div>
                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg" disabled={isSubmitting}>{t('common.cancel')}</button>
                            <button onClick={handleUpdateTeacher} disabled={isSubmitting || !editForm.name.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50">
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
                confirmLabel={t('common.remove', 'Remove')}
                variant="danger"
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default TeacherManagement;

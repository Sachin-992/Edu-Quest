/**
 * EDUCORE-OMEGA User Management Module
 * 
 * ADMIN-ONLY: User enrollment, role assignment, and management
 * - Create users with temporary passwords
 * - Assign roles (Student, Teacher, Parent, Admin)
 * - Link parents to students
 * - View and manage all users
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Users, UserPlus, Shield, Search, Loader2, CheckCircle, XCircle,
    AlertTriangle, Eye, Edit, Trash2, Link2, UserCheck, RefreshCw,
    Mail, Key, GraduationCap, BookOpen, UserCog, Copy
} from 'lucide-react';
import { authService, AuthUser, UserRole } from '../../../services/authService';
import { supabase } from '../../../services/supabaseClient';
import { sanitizeName, sanitizePhone } from '../../../utils/inputValidation';

interface StudentRecord {
    id: string;
    full_name: string;
    class: string;
    section: string;
    user_id: string | null;
}

interface ParentRecord {
    id: string;
    full_name: string;
    user_id: string;
}

export const UserManagement: React.FC = () => {
    const { t, i18n } = useTranslation();
    // State
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [parents, setParents] = useState<ParentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Create User Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        roll_number: '',
        pin: '',
        role: 'student' as UserRole,
        full_name: '',
        class: '1',
        section: 'A',
        admission_number: '',
        employee_id: '',
        subjects: [] as string[],
        classes: [] as string[],
        phone: ''
    });
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

    // Link Parent Modal
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedParent, setSelectedParent] = useState<ParentRecord | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [relationship, setRelationship] = useState<string>('parent');

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Load users
            const usersData = await authService.getAllUsers();
            setUsers(usersData);

            // Load students for linking
            if (supabase) {
                const { data: studentsData } = await supabase
                    .from('students')
                    .select('id, full_name, class, section, user_id')
                    .order('full_name');
                setStudents(studentsData || []);

                const { data: parentsData } = await supabase
                    .from('parents')
                    .select('id, full_name, user_id')
                    .order('full_name');
                setParents(parentsData || []);
            }
        } catch (err) {
            setError(t('userManagement.failedLoadData', 'Failed to load data'));
        }

        setIsLoading(false);
    };

    const handleCreateUser = async () => {
        if (newUser.role === 'student') {
            if (!newUser.roll_number || !newUser.pin || !newUser.full_name) {
                setError(t('userManagement.fieldsRequired', 'Roll Number, PIN, and Name are required'));
                return;
            }
            if (newUser.pin.length < 6) {
                setError(t('userManagement.pinLength', 'PIN must be at least 6 characters'));
                return;
            }
        } else if (newUser.role === 'teacher') {
            if (!newUser.employee_id || !newUser.pin || !newUser.full_name) {
                setError(t('userManagement.fieldsRequired', 'Employee ID, PIN, and Name are required'));
                return;
            }
            if (newUser.pin.length < 6) {
                setError(t('userManagement.pinLength', 'PIN must be at least 6 characters'));
                return;
            }
        } else if (newUser.role === 'parent') {
            if (!newUser.phone || !newUser.pin || !newUser.full_name) {
                setError(t('userManagement.fieldsRequired', 'Phone Number, PIN, and Name are required'));
                return;
            }
            if (newUser.pin.length < 6) {
                setError(t('userManagement.pinLength', 'PIN must be at least 6 characters'));
                return;
            }
        } else {
            if (!newUser.email || !newUser.full_name) {
                setError(t('userManagement.emailRequired'));
                return;
            }
        }

        setCreateLoading(true);
        setError(null);

        try {
            const currentUser = await authService.getCurrentUser();
            if (!currentUser) {
                setError(t('userManagement.mustBeLoggedIn'));
                setCreateLoading(false);
                return;
            }

            let email = newUser.email;
            let password = newUser.pin;

            if (newUser.role === 'student') {
                email = `${newUser.roll_number.toLowerCase().replace(/\s+/g, '')}@student.eduquest.local`;
            } else if (newUser.role === 'teacher') {
                email = `${newUser.employee_id.toLowerCase().replace(/\s+/g, '')}@teacher.educore.local`;
            } else if (newUser.role === 'parent') {
                email = `${newUser.phone.replace(/\D/g, '') || newUser.full_name.toLowerCase().replace(/\s+/g, '')}@parent.educore.local`;
            } else {
                // Admin role uses generated/entered temp password
                password = generateTempPassword();
            }

            const profileData: { full_name: string;[key: string]: unknown } = {
                full_name: newUser.full_name,
                phone: newUser.phone
            };

            if (newUser.role === 'student') {
                profileData.class = newUser.class;
                profileData.section = newUser.section;
                profileData.roll_number = newUser.roll_number;
                profileData.admission_number = newUser.admission_number || `ADM${Date.now()}`;
            } else if (newUser.role === 'teacher') {
                profileData.employee_id = newUser.employee_id;
                profileData.subjects = newUser.subjects;
                profileData.classes = newUser.classes;
            }

            const result = await authService.createUser(
                {
                    email,
                    password,
                    role: newUser.role,
                    profileData
                },
                currentUser.id
            );

            if (result.success) {
                if (newUser.role !== 'admin') {
                    setGeneratedPassword(newUser.pin);
                } else {
                    setGeneratedPassword(result.tempPassword || null);
                }
                setSuccess(`${t('userManagement.user', 'User')} "${newUser.full_name}" ${t('userManagement.userCreatedSuccessfully')}`);
                await loadData();
            } else {
                setError(result.error || t('userManagement.failedCreateUser'));
            }
        } catch (err) {
            setError(t('userManagement.unexpectedError'));
        }

        setCreateLoading(false);
    };


    const handleLinkParent = async () => {
        if (!selectedParent || !selectedStudentId) {
            setError(t('userManagement.selectBothParentStudent'));
            return;
        }

        const result = await authService.linkParentToStudent(
            selectedParent.id,
            selectedStudentId,
            relationship
        );

        if (result.success) {
            setSuccess(t('userManagement.parentLinkedSuccess'));
            setShowLinkModal(false);
            setSelectedParent(null);
            setSelectedStudentId('');
        } else {
            setError(result.error || t('userManagement.failedLinkParent'));
        }
    };

    const handleStatusChange = async (userId: string, status: 'active' | 'inactive' | 'suspended') => {
        const result = await authService.updateUserStatus(userId, status);
        if (result.success) {
            setSuccess(t('userManagement.userStatusUpdated'));
            await loadData();
        } else {
            setError(result.error || t('userManagement.failedUpdateStatus'));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setSuccess(t('userManagement.copiedToClipboard'));
        setTimeout(() => setSuccess(null), 2000);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case 'admin': return <Shield size={16} className="text-purple-600" />;
            case 'teacher': return <BookOpen size={16} className="text-blue-600" />;
            case 'student': return <GraduationCap size={16} className="text-green-600" />;
            case 'parent': return <Users size={16} className="text-amber-600" />;
        }
    };

    const getRoleBadgeClass = (role: UserRole) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700';
            case 'teacher': return 'bg-blue-100 text-blue-700';
            case 'student': return 'bg-green-100 text-green-700';
            case 'parent': return 'bg-amber-100 text-amber-700';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'inactive': return 'bg-slate-100 text-slate-700';
            case 'suspended': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white">
                    <div className="flex justify-between items-center">
                        <Shield size={28} className="opacity-80" />
                        <span className="text-3xl font-bold">{users.filter(u => u.role === 'admin').length}</span>
                    </div>
                    <p className="text-purple-100 mt-2 font-medium">{t('userManagement.admins')}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white">
                    <div className="flex justify-between items-center">
                        <BookOpen size={28} className="opacity-80" />
                        <span className="text-3xl font-bold">{users.filter(u => u.role === 'teacher').length}</span>
                    </div>
                    <p className="text-blue-100 mt-2 font-medium">{t('userManagement.teachers')}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
                    <div className="flex justify-between items-center">
                        <GraduationCap size={28} className="opacity-80" />
                        <span className="text-3xl font-bold">{users.filter(u => u.role === 'student').length}</span>
                    </div>
                    <p className="text-green-100 mt-2 font-medium">{t('userManagement.students')}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
                    <div className="flex justify-between items-center">
                        <Users size={28} className="opacity-80" />
                        <span className="text-3xl font-bold">{users.filter(u => u.role === 'parent').length}</span>
                    </div>
                    <p className="text-amber-100 mt-2 font-medium">{t('userManagement.parents')}</p>
                </div>
                <div className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl p-5 text-white">
                    <div className="flex justify-between items-center">
                        <UserCheck size={28} className="opacity-80" />
                        <span className="text-3xl font-bold">{users.length}</span>
                    </div>
                    <p className="text-slate-300 mt-2 font-medium">{t('userManagement.totalUsers')}</p>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <XCircle className="text-red-500" />
                        <span className="text-red-700">{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-500">×</button>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
                    <CheckCircle className="text-green-500" />
                    <span className="text-green-700">{success}</span>
                </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('userManagement.searchByEmail')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-full sm:w-64"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg"
                    >
                        <option value="all">{t('userManagement.allRoles')}</option>
                        <option value="admin">{t('userManagement.admins')}</option>
                        <option value="teacher">{t('userManagement.teachers')}</option>
                        <option value="student">{t('userManagement.students')}</option>
                        <option value="parent">{t('userManagement.parents')}</option>
                    </select>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={loadData}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                        disabled={isLoading}
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">{t('common.refresh')}</span>
                    </button>
                    <button
                        onClick={() => setShowLinkModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
                    >
                        <Link2 size={18} />
                        <span className="hidden sm:inline">{t('userManagement.linkParent')}</span>
                    </button>
                    <button
                        onClick={() => { setShowCreateModal(true); setGeneratedPassword(null); }}
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <UserPlus size={18} />
                        <span className="hidden sm:inline">{t('userManagement.createUser')}</span>
                    </button>
                </div>
            </div>

            {/* Users Table */}
            {isLoading ? (
                <div className="bg-white rounded-2xl p-12 flex items-center justify-center">
                    <Loader2 size={32} className="text-indigo-600 animate-spin" />
                    <span className="ml-3 text-slate-600">{t('userManagement.loadingUsers')}</span>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('userManagement.user')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('userManagement.role')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('userManagement.status')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('userManagement.firstLogin')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('userManagement.created')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('userManagement.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                                    {getRoleIcon(user.role)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">{user.email}</p>
                                                    <p className="text-xs text-slate-500">{user.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${getRoleBadgeClass(user.role)}`}>
                                                {user.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <select
                                                value={user.status}
                                                onChange={e => handleStatusChange(user.id, e.target.value as any)}
                                                className={`px-3 py-1 text-xs font-bold rounded-full border-0 cursor-pointer ${getStatusBadgeClass(user.status)}`}
                                            >
                                                <option value="active">{t('common.active', 'ACTIVE').toUpperCase()}</option>
                                                <option value="inactive">{t('common.inactive', 'INACTIVE').toUpperCase()}</option>
                                                <option value="suspended">{t('common.suspended', 'SUSPENDED').toUpperCase()}</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {user.first_login ? (
                                                <span className="text-amber-600 text-sm">⏳ {t('userManagement.pending')}</span>
                                            ) : (
                                                <span className="text-green-600 text-sm">✓ {t('userManagement.complete')}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-slate-500">
                                            {new Date(user.created_at).toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button className="p-1 text-slate-400 hover:text-indigo-600" title={t('common.view', 'View')}>
                                                    <Eye size={18} />
                                                </button>
                                                <button className="p-1 text-slate-400 hover:text-amber-600" title={t('common.edit', 'Edit')}>
                                                    <Edit size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            {t('userManagement.noUsersFound')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                            <UserPlus className="mr-2 text-indigo-600" />
                            {t('userManagement.createNewUser')}
                        </h3>

                        {generatedPassword ? (
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                    <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                                    <h4 className="text-lg font-bold text-green-800">{t('userManagement.userCreatedSuccessfully')}</h4>
                                    <p className="text-green-700 mt-2">{t('userManagement.shareCredentials')}</p>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500">{newUser.role === 'student' ? 'Roll Number' : t('common.email', 'Email')}</p>
                                            <p className="font-mono font-medium">{newUser.role === 'student' ? newUser.roll_number : newUser.email}</p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(newUser.role === 'student' ? newUser.roll_number : newUser.email)}
                                            className="p-2 text-slate-400 hover:text-indigo-600"
                                        >
                                            <Copy size={18} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500">{newUser.role === 'student' ? 'PIN' : t('userManagement.temporaryPassword')}</p>
                                            <p className="font-mono font-bold text-lg">{generatedPassword}</p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(generatedPassword || '')}
                                            className="p-2 text-slate-400 hover:text-indigo-600"
                                        >
                                            <Copy size={18} />
                                        </button>
                                    </div>
                                </div>

                                {newUser.role !== 'student' && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                        <div className="flex items-start space-x-3">
                                            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-1" />
                                            <div>
                                                <p className="font-medium text-amber-800">{t('common.important')}</p>
                                                <p className="text-amber-700 text-sm">{t('userManagement.importantMsg')}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setGeneratedPassword(null);
                                        setNewUser({
                                            email: '', roll_number: '', pin: '', role: 'student', full_name: '', class: '1', section: 'A',
                                            admission_number: '', employee_id: '', subjects: [], classes: [], phone: ''
                                        });
                                    }}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                                >
                                    {t('common.done')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Role Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('userManagement.selectRole')}</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {(['student', 'teacher', 'parent', 'admin'] as UserRole[]).map(role => (
                                            <button
                                                key={role}
                                                onClick={() => setNewUser({ ...newUser, role })}
                                                className={`p-4 rounded-xl border-2 flex flex-col items-center transition-all ${newUser.role === role
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                {role === 'student' && <GraduationCap size={24} className="text-green-600 mb-2" />}
                                                {role === 'teacher' && <BookOpen size={24} className="text-blue-600 mb-2" />}
                                                {role === 'parent' && <Users size={24} className="text-amber-600 mb-2" />}
                                                {role === 'admin' && <Shield size={24} className="text-purple-600 mb-2" />}
                                                <span className="text-sm font-medium capitalize">{t(`userManagement.${role}s`, { defaultValue: role })}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Common Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('userManagement.fullName')}</label>
                                        <input
                                            type="text"
                                            value={newUser.full_name}
                                            onChange={e => setNewUser({ ...newUser, full_name: sanitizeName(e.target.value) })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                            placeholder={t('common.lettersOnly')}
                                        />
                                    </div>
                                    {newUser.role === 'student' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Roll Number</label>
                                            <input
                                                type="text"
                                                value={newUser.roll_number}
                                                onChange={e => setNewUser({ ...newUser, roll_number: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                                placeholder="e.g. STU001"
                                            />
                                        </div>
                                    )}
                                    {newUser.role === 'teacher' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
                                            <input
                                                type="text"
                                                value={newUser.employee_id}
                                                onChange={e => setNewUser({ ...newUser, employee_id: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                                placeholder="e.g. EMP001"
                                            />
                                        </div>
                                    )}
                                    {newUser.role === 'parent' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('userManagement.phoneLabel')}</label>
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                value={newUser.phone}
                                                onChange={e => setNewUser({ ...newUser, phone: sanitizePhone(e.target.value) })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                                placeholder={t('common.numbersOnly')}
                                                maxLength={10}
                                            />
                                        </div>
                                    )}
                                    {newUser.role === 'admin' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('userManagement.emailLabel')}</label>
                                            <input
                                                type="email"
                                                value={newUser.email}
                                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                                placeholder="admin@school.edu"
                                            />
                                        </div>
                                    )}
                                </div>

                                {newUser.role !== 'admin' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Login PIN (min 6 characters)</label>
                                        <input
                                            type="text"
                                            value={newUser.pin}
                                            onChange={e => setNewUser({ ...newUser, pin: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                            placeholder="Enter permanent login PIN"
                                        />
                                    </div>
                                )}

                                {/* Role-specific Fields */}
                                {newUser.role === 'student' && (
                                    <div className="bg-green-50 p-4 rounded-xl space-y-4">
                                        <p className="text-sm font-medium text-green-800">{t('userManagement.studentDetails')}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('forms.class')}</label>
                                                <select
                                                    value={newUser.class}
                                                    onChange={e => setNewUser({ ...newUser, class: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                                                >
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('forms.section')}</label>
                                                <select
                                                    value={newUser.section}
                                                    onChange={e => setNewUser({ ...newUser, section: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                                                >
                                                    {['A', 'B', 'C', 'D'].map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('userManagement.admissionNo')}</label>
                                                <input
                                                    type="text"
                                                    value={newUser.admission_number}
                                                    onChange={e => setNewUser({ ...newUser, admission_number: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                                    placeholder={t('common.autoGenerate')}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Info Box for Admins only */}
                                {newUser.role === 'admin' && (
                                    <div className="bg-slate-50 rounded-xl p-4 flex items-start space-x-3">
                                        <Key className="text-slate-400 mt-1" size={20} />
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{t('userManagement.temporaryPassword')}</p>
                                            <p className="text-xs text-slate-500">{t('userManagement.tempPasswordInfo')}</p>
                                        </div>
                                    </div>
                                )}


                                {/* Actions */}
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                        disabled={createLoading}
                                    >
                                       {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleCreateUser}
                                        disabled={createLoading || (newUser.role === 'student' ? (!newUser.roll_number || !newUser.pin || !newUser.full_name) : (!newUser.email || !newUser.full_name))}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50"
                                    >
                                        {createLoading && <Loader2 size={18} className="animate-spin" />}
                                        <span>{createLoading ? t('userManagement.creating') : t('userManagement.createUser')}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Link Parent Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                            <Link2 className="mr-2 text-amber-600" />
                            {t('userManagement.linkParentToStudent')}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('userManagement.selectParent')}</label>
                                <select
                                    value={selectedParent?.id || ''}
                                    onChange={e => {
                                        const parent = parents.find(p => p.id === e.target.value);
                                        setSelectedParent(parent || null);
                                    }}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="">{t('userManagement.selectParent')}</option>
                                    {parents.map(parent => (
                                        <option key={parent.id} value={parent.id}>{parent.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('userManagement.selectStudent')}</label>
                                <select
                                    value={selectedStudentId}
                                    onChange={e => setSelectedStudentId(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="">{t('userManagement.selectStudent')}</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.full_name} ({t('forms.class')} {student.class}-{student.section})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('userManagement.relationship')}</label>
                                <select
                                    value={relationship}
                                    onChange={e => setRelationship(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="parent">{t('forms.parent')}</option>
                                    <option value="father">{t('userManagement.father')}</option>
                                    <option value="mother">{t('userManagement.mother')}</option>
                                    <option value="guardian">{t('userManagement.guardian')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleLinkParent}
                                disabled={!selectedParent || !selectedStudentId}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                            >
                                {t('userManagement.linkParentBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Search, Plus, Link2, Unlink, Eye, Download, UserPlus, AlertCircle, CheckCircle, Loader2, Bell, Send, XCircle } from 'lucide-react';
import { supabase, isAnalyticsEnabled } from '../../../services/supabaseClient';
import { auditService } from '../../../services/auditService';
import { rbacService } from '../../../services/rbacService';
import { notificationService } from '../../../services/notificationService';
import { parentService } from '../../../services/parentService';
import { ConfirmDialog } from '../../ConfirmDialog';
import { sanitizeName, sanitizePhone } from '../../../utils/inputValidation';

interface Parent {
    id: string;
    user_id?: string;
    name: string;
    phone?: string;
    email?: string;
    created_at: string;
}

interface Student {
    id: string;
    name: string;
    class: string;
    section: string;
    roll_no: number;
    date_of_birth?: string;
}

interface ParentStudentLink {
    id: string;
    parent_id: string;
    student_id: string;
    relationship: string;
    linked_at: string;
    student?: Student;
}

export const ParentManagement: React.FC = () => {
    const { t } = useTranslation();
    const [parents, setParents] = useState<Parent[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [links, setLinks] = useState<ParentStudentLink[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
    const [newParent, setNewParent] = useState({ name: '', phone: '', email: '', studentId: '', relationship: 'parent' });
    const [selectedStudentToLink, setSelectedStudentToLink] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Notice modal state
    const [showNoticeModal, setShowNoticeModal] = useState(false);
    const [noticeRecipient, setNoticeRecipient] = useState<string>('all');
    const [noticeTitle, setNoticeTitle] = useState('');
    const [noticeMessage, setNoticeMessage] = useState('');

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const isPersistent = isAnalyticsEnabled && supabase !== null;

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        if (!isPersistent) {
            setError("Database connection unavailable");
            setIsLoading(false);
            return;
        }

        try {
            const [parentsRes, studentsRes, linksRes] = await Promise.all([
                supabase!.from('parents').select('*').order('name'),
                supabase!.from('students').select('id, name, class, section, roll_no, date_of_birth').order('roll_no'),
                supabase!.from('parent_student_links').select('*, students(*)'),
            ]);

            if (parentsRes.error) throw parentsRes.error;
            if (studentsRes.error) throw studentsRes.error;
            if (linksRes.error) throw linksRes.error;

            // Map DB columns to UI format
            // Both parents and students tables use 'name', students uses roll_no
            const mappedParents = (parentsRes.data || []).map((p: Record<string, unknown>) => ({
                ...p,
                name: p.name as string,
            }));

            const mappedStudents = (studentsRes.data || []).map((s: Record<string, unknown>) => ({
                ...s,
                name: s.name as string,
                roll_no: s.roll_no as number,
            }));

            setParents(mappedParents as Parent[]);
            setStudents(mappedStudents as Student[]);
            setLinks(linksRes.data || []);
        } catch (err: any) {
            console.error('Error loading parent data:', err);
            setError(err.message || 'Failed to load data');
            setParents([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddParent = async () => {
        if (!newParent.name.trim() || !newParent.email.trim()) {
            setError('Name and Email are required');
            return;
        }
        if (!newParent.studentId) {
            setError('You must select a child/student to link. Parent password = Child\'s DOB');
            return;
        }

        setIsSaving(true);
        setError(null);
        const currentUser = rbacService.getCurrentUser();

        try {
            // Use parentService which calls identityService → Edge Function
            const result = await parentService.createParent(
                {
                    name: newParent.name.trim(),
                    email: newParent.email.trim(),
                    phone: newParent.phone,
                    studentId: newParent.studentId,
                    relationship: newParent.relationship || 'parent',
                },
                currentUser?.id || 'admin',
                currentUser?.name || 'Admin User',
                'Administrator'
            );

            if (result.success && result.data) {
                const pwdMsg = result.temp_password
                    ? ` (Temp Password: ${result.temp_password})`
                    : '';
                setSuccessMessage(`Parent "${newParent.name}" created with login${pwdMsg}`);
                setParents([...parents, result.data]);
                // Also add the link to state
                await loadData();
                setShowAddModal(false);
                setNewParent({ name: '', phone: '', email: '', studentId: '', relationship: 'parent' });
            } else {
                setError(result.error || 'Failed to create parent');
            }
        } catch (err: any) {
            console.error('Error creating parent:', err);
            setError(err.message || 'Failed to create parent');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSuccessMessage(null), 5000);
        }
    };

    const handleLinkStudent = async () => {
        if (!selectedParent || !selectedStudentToLink) return;

        setIsSaving(true);
        const currentUser = rbacService.getCurrentUser();

        if (!isPersistent) {
            setError("Database connection unavailable");
            setIsSaving(false);
            return;
        }

        try {
            // Build insert object - linked_by is optional (may not exist in older schemas)
            const insertData: Record<string, any> = {
                parent_id: selectedParent.id,
                student_id: selectedStudentToLink,
                relationship: 'parent',
            };

            // Only add linked_by if we have a current user
            if (currentUser?.id) {
                insertData.linked_by = currentUser.id;
            }

            let result = await supabase!
                .from('parent_student_links')
                .insert([insertData])
                .select()
                .single();

            // If linked_by column doesn't exist, retry without it
            if (result.error?.message?.includes('linked_by')) {
                console.warn('linked_by column not found, retrying without it...');
                delete insertData.linked_by;
                result = await supabase!
                    .from('parent_student_links')
                    .insert([insertData])
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            await auditService.logAccess(
                currentUser?.id || 'admin',
                currentUser?.name || 'Admin',
                'ADMIN',
                'CREATE',
                'parent_student_link',
                result.data.id,
                `Linked parent ${selectedParent.name} to student`
            );

            setLinks([...links, result.data]);
            setSuccessMessage('Student linked successfully');
            setShowLinkModal(false);
            setSelectedStudentToLink('');
        } catch (err: any) {
            console.error('Error linking student:', err);
            setError(err.message || 'Failed to link student');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    const handleUnlinkStudent = async (linkId: string, parentName: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Unlink Student',
            message: 'Are you sure you want to unlink this student from the parent?',
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                const currentUser = rbacService.getCurrentUser();

                if (!isPersistent) {
                    setError("Database connection unavailable");
                    return;
                }

                try {
                    const { error } = await supabase!
                        .from('parent_student_links')
                        .delete()
                        .eq('id', linkId);

                    if (error) throw error;

                    await auditService.logAccess(
                        currentUser?.id || 'admin',
                        currentUser?.name || 'Admin',
                        'ADMIN',
                        'DELETE',
                        'parent_student_link',
                        linkId,
                        `Unlinked student from parent ${parentName}`
                    );

                    setLinks(links.filter(l => l.id !== linkId));
                    setSuccessMessage('Student unlinked successfully');
                } catch (err: any) {
                    console.error('Error unlinking student:', err);
                    setError(err.message || 'Failed to unlink student');
                }
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        });
    };

    const getLinkedStudents = (parentId: string): ParentStudentLink[] => {
        return links.filter(l => l.parent_id === parentId);
    };

    const getStudentName = (studentId: string): string => {
        const student = students.find(s => s.id === studentId);
        return student ? `${student.name} (${student.class}-${student.section})` : 'Unknown';
    };

    const filteredParents = parents.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSendNotice = () => {
        if (!noticeTitle.trim() || !noticeMessage.trim()) return;

        const currentUser = rbacService.getCurrentUser();
        const recipientName = noticeRecipient === 'all'
            ? 'All Parents'
            : parents.find(p => p.id === noticeRecipient)?.name || 'Parent';

        // Send notification via notificationService
        notificationService.announce(
            noticeTitle,
            `[To: ${recipientName}] ${noticeMessage}`,
            currentUser?.name || 'School Admin'
        );

        // Log the action
        auditService.logAccess(
            currentUser?.id || 'admin',
            currentUser?.name || 'Admin',
            'ADMIN',
            'CREATE',
            'parent_notification',
            noticeRecipient,
            `Sent notice "${noticeTitle}" to ${recipientName}`
        );

        setSuccessMessage(`Notice sent to ${recipientName}`);
        setShowNoticeModal(false);
        setNoticeTitle('');
        setNoticeMessage('');
        setNoticeRecipient('all');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    return (
        <div className="space-y-6">
            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
                    <CheckCircle className="text-green-600" size={24} />
                    <p className="font-medium text-green-800">{successMessage}</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
                    <AlertCircle className="text-red-600" size={24} />
                    <div>
                        <p className="font-bold text-red-800">Error</p>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <Users size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">{parents.length}</span>
                    </div>
                    <p className="text-purple-100 font-medium">{t('parentManagement.totalParents')}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <Link2 size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">{links.length}</span>
                    </div>
                    <p className="text-green-100 font-medium">{t('parentManagement.activeLinks')}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">👨‍👩‍👧</span>
                        <span className="text-3xl font-bold">{students.length}</span>
                    </div>
                    <p className="text-blue-100 font-medium">{t('parentManagement.students')}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">🔗</span>
                        <span className="text-3xl font-bold">{students.length > 0 ? Math.round((links.length / students.length) * 100) : 0}%</span>
                    </div>
                    <p className="text-amber-100 font-medium">{t('parentManagement.linkCoverage')}</p>
                </div>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('parentManagement.searchParents')}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => loadData()}
                        disabled={isLoading}
                        className="flex items-center space-x-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        <span className="hidden sm:inline">{t('common.refresh')}</span>
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                        <UserPlus size={18} />
                        <span className="hidden sm:inline">{t('parentManagement.addParent')}</span>
                    </button>
                    <button
                        onClick={() => setShowNoticeModal(true)}
                        className="flex items-center space-x-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
                    >
                        <Bell size={18} />
                        <span className="hidden sm:inline">{t('parentManagement.sendNotice')}</span>
                    </button>
                </div>
            </div>

            {/* Parents Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
                        <p className="text-slate-500">{t('parentManagement.loadingParents')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('parentManagement.parent')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('parentManagement.contact')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('parentManagement.linkedStudents')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('parentManagement.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredParents.map(parent => {
                                    const linkedStudents = getLinkedStudents(parent.id);
                                    return (
                                        <tr key={parent.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                        <Users size={18} className="text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{parent.name}</p>
                                                        <p className="text-xs text-slate-500">ID: {parent.id.slice(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-700">{parent.phone || 'N/A'}</p>
                                                <p className="text-xs text-slate-500">{parent.email || t('parentManagement.noEmail')}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {linkedStudents.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {linkedStudents.map(link => (
                                                            <div key={link.id} className="flex items-center space-x-2">
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                                                    {getStudentName(link.student_id)}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleUnlinkStudent(link.id, parent.name)}
                                                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                                    title={t('parentManagement.unlink')}
                                                                >
                                                                    <Unlink size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-sm">{t('parentManagement.noLinkedStudents')}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center space-x-2">
                                                    <button
                                                        onClick={() => { setSelectedParent(parent); setShowLinkModal(true); }}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                        title="Link Student"
                                                    >
                                                        <Link2 size={16} />
                                                    </button>
                                                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="View History">
                                                        <Eye size={16} />
                                                    </button>
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

            {/* Add Parent Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center">
                            <UserPlus className="mr-2 text-indigo-600" size={24} />
                            {t('parentManagement.addNewParent')}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentManagement.fullName')}</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder={t('common.lettersOnly')}
                                    value={newParent.name}
                                    onChange={e => setNewParent({ ...newParent, name: sanitizeName(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentManagement.email')}</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="parent@email.com"
                                    value={newParent.email}
                                    onChange={e => setNewParent({ ...newParent, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentManagement.phone')}</label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder={t('common.numbersOnly')}
                                    value={newParent.phone}
                                    onChange={e => setNewParent({ ...newParent, phone: sanitizePhone(e.target.value) })}
                                    maxLength={10}
                                />
                            </div>
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                <label className="block text-sm font-medium text-indigo-800 mb-2">{t('parentManagement.linkToChild')}</label>
                                <p className="text-xs text-indigo-600 mb-2">{t('parentManagement.linkHint')}</p>
                                <select
                                    className="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                    value={newParent.studentId}
                                    onChange={e => setNewParent({ ...newParent, studentId: e.target.value })}
                                    required
                                >
                                    <option value="">{t('parentManagement.selectStudent')}</option>
                                    {students.filter(s => s.date_of_birth).map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.name} ({student.class}-{student.section})
                                        </option>
                                    ))}
                                </select>
                                {students.filter(s => !s.date_of_birth).length > 0 && (
                                    <p className="text-xs text-amber-600 mt-2">⚠️ {students.filter(s => !s.date_of_birth).length} {t('parentManagement.studentsWithoutDob')}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => { setShowAddModal(false); setNewParent({ name: '', phone: '', email: '', studentId: '', relationship: 'parent' }); }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleAddParent}
                                disabled={isSaving || !newParent.name.trim() || !newParent.email.trim() || !newParent.studentId}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Plus size={18} className="mr-2" />}
                                {t('parentManagement.createParentWithLogin')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Link Student Modal */}
            {showLinkModal && selectedParent && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center">
                            <Link2 className="mr-2 text-indigo-600" size={24} />
                            {t('parentManagement.linkStudentTitle')} {selectedParent.name}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentManagement.selectStudentLabel')}</label>
                                <select
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    value={selectedStudentToLink}
                                    onChange={e => setSelectedStudentToLink(e.target.value)}
                                >
                                    <option value="">{t('parentManagement.selectStudent')}</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.name} ({student.class}-{student.section}, Roll #{student.roll_no})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => { setShowLinkModal(false); setSelectedStudentToLink(''); }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleLinkStudent}
                                disabled={isSaving || !selectedStudentToLink}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Link2 size={18} className="mr-2" />}
                                {t('parentManagement.linkStudentBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Send Notice Modal */}
            {showNoticeModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center">
                            <Bell className="mr-2 text-amber-600" size={24} />
                            {t('parentManagement.sendNoticeTitle')}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentManagement.recipient')}</label>
                                <select
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                    value={noticeRecipient}
                                    onChange={e => setNoticeRecipient(e.target.value)}
                                >
                                    <option value="all">{t('parentManagement.allParents')}</option>
                                    {parents.map(parent => (
                                        <option key={parent.id} value={parent.id}>
                                            {parent.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentManagement.noticeTitle')}</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                    placeholder="e.g. Fee Payment Reminder"
                                    value={noticeTitle}
                                    onChange={e => setNoticeTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentManagement.noticeMessage')}</label>
                                <textarea
                                    rows={4}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                    placeholder="Enter your message to parents..."
                                    value={noticeMessage}
                                    onChange={e => setNoticeMessage(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => { setShowNoticeModal(false); setNoticeTitle(''); setNoticeMessage(''); }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleSendNotice}
                                disabled={!noticeTitle.trim() || !noticeMessage.trim()}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center"
                            >
                                <Send size={18} className="mr-2" />
                                {t('parentManagement.sendNotice')}
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
                confirmLabel="Unlink"
                variant="warning"
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

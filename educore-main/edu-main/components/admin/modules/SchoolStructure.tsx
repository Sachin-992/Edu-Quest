import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building, Layers, BookOpen, Plus, Loader2, CheckCircle, XCircle, RefreshCw, UserCircle, Save } from 'lucide-react';
import { schoolService, SchoolClass, Subject } from '../../../services/schoolService';
import { teacherService, Teacher } from '../../../services/teacherService';
import { ConfirmDialog } from '../../ConfirmDialog';

export const SchoolStructure: React.FC = () => {
    const { t } = useTranslation();
    const [activeView, setActiveView] = useState<'classes' | 'subjects'>('classes');
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Form states for Class
    const [showAddClass, setShowAddClass] = useState(false);
    const [newClassGrade, setNewClassGrade] = useState('');
    const [newClassSection, setNewClassSection] = useState('');

    // Form states for Subject
    const [showAddSubject, setShowAddSubject] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectCode, setNewSubjectCode] = useState('');
    const [newSubjectClassId, setNewSubjectClassId] = useState('');

    // Assign Teacher Modal
    const [showAssignTeacher, setShowAssignTeacher] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        const classResult = await schoolService.getClasses();
        const subjectResult = await schoolService.getSubjects();
        const teacherResult = await teacherService.getTeachers();

        setClasses(classResult.data || []);
        setSubjects(subjectResult.data || []);
        setTeachers(teacherResult.data || []);
        setIsLoading(false);
    };

    const handleAddClass = async () => {
        if (!newClassGrade.trim() || !newClassSection.trim()) return;

        setIsSubmitting(true);
        setError(null);

        const result = await schoolService.createClass(
            {
                grade_level: newClassGrade.trim(),
                section: newClassSection.trim().toUpperCase()
            },
            'admin',
            'Admin User',
            'Administrator'
        );

        if (result.success) {
            setSuccessMsg(t('schoolStructure.classCreated'));
            setNewClassGrade('');
            setNewClassSection('');
            setShowAddClass(false);
            await loadData();
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            setError(result.error || t('schoolStructure.failedCreateClass'));
        }

        setIsSubmitting(false);
    };

    const handleAddSubject = async () => {
        if (!newSubjectName.trim() || !newSubjectCode.trim() || !newSubjectClassId) return;

        setIsSubmitting(true);
        setError(null);

        const result = await schoolService.createSubject(
            {
                name: newSubjectName.trim(),
                code: newSubjectCode.trim().toUpperCase(),
                class_id: newSubjectClassId
            },
            'admin',
            'Admin User',
            'Administrator'
        );

        if (result.success) {
            setSuccessMsg(t('schoolStructure.subjectCreated'));
            setNewSubjectName('');
            setNewSubjectCode('');
            setNewSubjectClassId('');
            setShowAddSubject(false);
            await loadData();
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            setError(result.error || t('schoolStructure.failedCreateSubject'));
        }

        setIsSubmitting(false);
    };

    const handleAssignTeacher = async () => {
        if (!selectedSubject || !selectedTeacherId) return;

        setIsSubmitting(true);

        const result = await schoolService.assignTeacherToSubject(
            selectedSubject.id,
            selectedTeacherId,
            'admin',
            'Admin User',
            'Administrator'
        );

        if (result.success) {
            setSuccessMsg(t('schoolStructure.teacherAssigned'));
            setShowAssignTeacher(false);
            setSelectedSubject(null);
            setSelectedTeacherId('');
            await loadData();
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            setError(result.error || t('classAssignments.failedAssign', 'Failed to assign teacher'));
        }
        setIsSubmitting(false);
    };

    const handleDeleteClass = async (id: string, grade: string, section: string) => {
        setConfirmDialog({
            isOpen: true,
            title: t('schoolStructure.deleteClass'),
            message: t('schoolStructure.deleteClassMsg'),
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                const result = await schoolService.deleteClass(id, 'admin', 'Admin User', 'Administrator');
                if (result.success) {
                    setSuccessMsg(t('schoolStructure.classDeleted'));
                    await loadData();
                    setTimeout(() => setSuccessMsg(null), 3000);
                } else {
                    setError(result.error || t('schoolStructure.failedDeleteClass', 'Failed to delete class'));
                }
            }
        });
    };

    const handleDeleteSubject = async (id: string, name: string) => {
        setConfirmDialog({
            isOpen: true,
            title: t('schoolStructure.deleteSubject'),
            message: t('schoolStructure.deleteSubjectMsg'),
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                const result = await schoolService.deleteSubject(id, 'admin', 'Admin User', 'Administrator');
                if (result.success) {
                    setSuccessMsg(t('schoolStructure.subjectDeleted'));
                    await loadData();
                    setTimeout(() => setSuccessMsg(null), 3000);
                } else {
                    setError(result.error || t('schoolStructure.failedDeleteSubject', 'Failed to delete subject'));
                }
            }
        });
    };

    // Helper to get class name for a subject
    const getClassName = (classId: string) => {
        const cls = classes.find(c => c.id === classId);
        return cls ? `${cls.grade_level}-${cls.section}` : t('common.unknownClass', 'Unknown Class');
    };

    // Helper to get assigned teacher name (needs join ideally, but simplistic lookup for now)
    // In real app, schoolService.getSubjects would return teacher_id or we fetch assignments separately
    // For now, we don't have this data in current `subjects` state unless we update `getSubjects` or fetch map.
    // Let's assume user needs to see assignment status.

    const totalStudents = 775; // Placeholder

    return (
        <div className="space-y-6">
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <XCircle className="text-red-600" size={20} />
                        <span className="text-red-800">{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">×</button>
                </div>
            )}

            {/* Success Message */}
            {successMsg && (
                <div className="bg-green-50 border border-green-300 rounded-xl p-4 flex items-center space-x-3">
                    <CheckCircle className="text-green-600" size={20} />
                    <span className="text-green-800">{successMsg}</span>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <Building size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">{isLoading ? '...' : classes.length}</span>
                    </div>
                    <p className="text-indigo-100 font-medium">{t('schoolStructure.totalClasses')}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <Layers size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">{isLoading ? '...' : classes.length}</span>
                    </div>
                    <p className="text-emerald-100 font-medium">{t('forms.section')}s</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <BookOpen size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">{isLoading ? '...' : subjects.length}</span>
                    </div>
                    <p className="text-blue-100 font-medium">{t('schoolStructure.subjects')}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl">👥</span>
                        <span className="text-3xl font-bold">{totalStudents}</span>
                    </div>
                    <p className="text-amber-100 font-medium">{t('overviewDashboard.totalStudents', 'Total Students')}</p>
                </div>
            </div>

            {/* View Toggle & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg self-start">
                    <button
                        onClick={() => setActiveView('classes')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeView === 'classes' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
                    >
                        {t('schoolStructure.classes')} & {t('forms.section')}s
                    </button>
                    <button
                        onClick={() => setActiveView('subjects')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeView === 'subjects' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
                    >
                        {t('schoolStructure.subjects')}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={loadData}
                        className="flex items-center space-x-2 bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200"
                        disabled={isLoading}
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">{t('common.refresh')}</span>
                    </button>
                    <button
                        onClick={() => activeView === 'classes' ? setShowAddClass(true) : setShowAddSubject(true)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">{activeView === 'classes' ? t('schoolStructure.addClass') : t('schoolStructure.addSubject')}</span>
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex items-center justify-center">
                    <Loader2 size={32} className="text-indigo-600 animate-spin" />
                    <span className="ml-3 text-slate-600">{t('common.loadingData', 'Loading data...')}</span>
                </div>
            )}

            {/* Classes Table */}
            {!isLoading && activeView === 'classes' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('schoolStructure.gradeLevel')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('schoolStructure.section')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('forms.class')} ID</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {classes.map(cls => (
                                    <tr key={cls.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-semibold text-slate-800">{cls.grade_level}</td>
                                        <td className="px-6 py-4 text-center">{cls.section}</td>
                                        <td className="px-6 py-4 text-center font-mono text-xs text-slate-400">{cls.id}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDeleteClass(cls.id, cls.grade_level, cls.section)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                {t('common.delete')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {classes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            {t('schoolStructure.noClasses')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Subjects Table */}
            {!isLoading && activeView === 'subjects' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('forms.subject')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('schoolStructure.subjectCode')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('forms.class')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('teacherManagement.title')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {subjects.map(subj => (
                                    <tr key={subj.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-semibold text-slate-800">{subj.name}</td>
                                        <td className="px-6 py-4 text-center font-mono">{subj.code}</td>
                                        <td className="px-6 py-4 text-center text-sm text-slate-600">{getClassName(subj.class_id)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => { setSelectedSubject(subj); setShowAssignTeacher(true); }}
                                                className="flex items-center justify-center space-x-1 mx-auto text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                                            >
                                                <UserCircle size={14} />
                                                <span>{t('schoolStructure.assignTeacher')}</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDeleteSubject(subj.id, subj.name)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                {t('common.delete')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {subjects.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            {t('schoolStructure.noSubjects')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Class Modal */}
            {showAddClass && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">{t('schoolStructure.addNewClass')}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('schoolStructure.gradeLevel')}</label>
                                <input
                                    type="text"
                                    value={newClassGrade}
                                    onChange={e => setNewClassGrade(e.target.value)}
                                    placeholder="e.g., 6"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('schoolStructure.section')}</label>
                                <input
                                    type="text"
                                    value={newClassSection}
                                    onChange={e => setNewClassSection(e.target.value)}
                                    placeholder="e.g., A"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAddClass(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                disabled={isSubmitting}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleAddClass}
                                disabled={isSubmitting || !newClassGrade.trim() || !newClassSection.trim()}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50"
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                <span>{isSubmitting ? t('common.loading', 'Creating...') : t('schoolStructure.addClass')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Subject Modal */}
            {showAddSubject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">{t('schoolStructure.addNewSubject')}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('forms.class')}</label>
                                <select
                                    value={newSubjectClassId}
                                    onChange={e => setNewSubjectClassId(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">{t('schoolStructure.selectClass')}</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.grade_level}-{c.section}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('schoolStructure.className')}</label>
                                <input
                                    type="text"
                                    value={newSubjectName}
                                    onChange={e => setNewSubjectName(e.target.value)}
                                    placeholder="e.g., Mathematics"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('schoolStructure.subjectCode')}</label>
                                <input
                                    type="text"
                                    value={newSubjectCode}
                                    onChange={e => setNewSubjectCode(e.target.value)}
                                    placeholder="e.g., MATH"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAddSubject(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                disabled={isSubmitting}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleAddSubject}
                                disabled={isSubmitting || !newSubjectName.trim() || !newSubjectCode.trim() || !newSubjectClassId}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50"
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                <span>{isSubmitting ? t('common.loading', 'Creating...') : t('schoolStructure.addSubject')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Teacher Modal */}
            {showAssignTeacher && selectedSubject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-1">{t('schoolStructure.assignTeacher')}</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            {t('schoolStructure.assignToClass')} <span className="font-semibold text-indigo-600">{selectedSubject.name}</span> ({getClassName(selectedSubject.class_id)})
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('classAssignments.selectTeacher', 'Select Teacher')}</label>
                                <select
                                    value={selectedTeacherId}
                                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">{t('classAssignments.chooseTeacher', '-- Choose Teacher --')}</option>
                                    {teachers.filter(t => t.status === 'active').map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.subject})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-8">
                            <button
                                onClick={() => { setShowAssignTeacher(false); setSelectedTeacherId(''); }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleAssignTeacher}
                                disabled={!selectedTeacherId}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                <Save size={18} className="mr-2" />
                                {t('schoolStructure.assignTeacher')}
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
                confirmLabel={t('common.delete')}
                variant="danger"
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default SchoolStructure;

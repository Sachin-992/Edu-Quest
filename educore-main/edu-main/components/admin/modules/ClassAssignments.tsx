import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { schoolService, ClassAssignment, SchoolClass } from '../../../services/schoolService';
import { teacherService, Teacher } from '../../../services/teacherService';
import { UserPlus, Trash2, Shield, BookOpen, AlertCircle } from 'lucide-react';
import { rbacService } from '../../../services/rbacService';
import { ConfirmDialog } from '../../ConfirmDialog';

export const ClassAssignments = () => {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [assignments, setAssignments] = useState<Record<string, ClassAssignment[]>>({});
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);

    // Form State
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);
    const [error, setError] = useState('');

    const { t } = useTranslation();

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [classesRes, teachersRes] = await Promise.all([
                schoolService.getClasses(),
                teacherService.getTeachers()
            ]);

            if (classesRes.data) setClasses(classesRes.data);
            if (teachersRes.data) setTeachers(teachersRes.data);

            // Load assignments for all classes (or load on demand)
            // For now, load on demand or just iterate? 
            // Better to load on click to avoid N+1 requests if many classes.
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadAssignments = async (classId: string) => {
        const { data } = await schoolService.getClassAssignments(classId);
        if (data) {
            setAssignments(prev => ({ ...prev, [classId]: data }));
        }
    };

    const handleAssign = async () => {
        if (!selectedClass || !selectedTeacher) return;
        setError('');

        const currentUser = rbacService.getCurrentUser();
        const { success, error } = await schoolService.assignClassTeacher(
            selectedClass,
            selectedTeacher,
            isPrimary,
            null, // Subject ID (optional/future)
            currentUser?.id || 'admin',
            currentUser?.name || 'Admin',
            currentUser?.role || 'admin'
        );

        if (success) {
            await loadAssignments(selectedClass);
            setIsAssigning(false);
            setSelectedTeacher('');
            setIsPrimary(false);
        } else {
            setError(error || t('classAssignments.failedAssign'));
        }
    };

    const handleRemove = async (assignmentId: string, classId: string) => {
        setConfirmDialog({
            isOpen: true,
            title: t('classAssignments.removeTeacher'),
            message: t('classAssignments.removeTeacherMsg'),
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                const currentUser = rbacService.getCurrentUser();
                const { success } = await schoolService.removeClassAssignment(
                    assignmentId,
                    currentUser?.id || 'admin',
                    currentUser?.name || 'Admin',
                    currentUser?.role || 'admin'
                );
                if (success) {
                    loadAssignments(classId);
                }
            }
        });
    };

    const toggleClass = (classId: string) => {
        if (selectedClass === classId) {
            setSelectedClass(null);
        } else {
            setSelectedClass(classId);
            if (!assignments[classId]) {
                loadAssignments(classId);
            }
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{t('classAssignments.title')}</h2>
                <div className="text-xs sm:text-sm text-slate-500">{t('classAssignments.subtitle')}</div>
            </div>

            <div className="grid gap-4">
                {classes.map(cls => (
                    <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => toggleClass(cls.id)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                    {cls.grade_level}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Class {cls.grade_level} - {cls.section}</h3>
                                    <p className="text-xs text-slate-500">
                                        {assignments[cls.id]?.length || 0} {t('classAssignments.assignments')}
                                    </p>
                                </div>
                            </div>
                            <div className="text-slate-400">
                                {selectedClass === cls.id ? t('classAssignments.collapse') : t('classAssignments.expand')}
                            </div>
                        </div>

                        {selectedClass === cls.id && (
                            <div className="p-4 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{t('classAssignments.assignedFaculty')}</h4>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsAssigning(true); }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
                                    >
                                        <UserPlus size={16} /> {t('classAssignments.assignTeacher')}
                                    </button>
                                </div>

                                {isAssigning && (
                                    <div className="mb-4 p-4 bg-white rounded-lg border border-indigo-100 shadow-sm">
                                        <div className="text-sm font-semibold mb-2">{t('classAssignments.newAssignment')}</div>
                                        {error && <div className="text-red-500 text-xs mb-2 flex items-center gap-1"><AlertCircle size={12} /> {error}</div>}
                                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:items-end">
                                            <div className="flex-1">
                                                <label className="text-xs text-slate-500">{t('classAssignments.selectTeacher')}</label>
                                                <select
                                                    className="w-full p-2 border rounded-md text-sm mt-1"
                                                    value={selectedTeacher}
                                                    onChange={e => setSelectedTeacher(e.target.value)}
                                                >
                                                    <option value="">{t('classAssignments.chooseTeacher')}</option>
                                                    {teachers.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name} ({t.employee_id})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <input
                                                    type="checkbox"
                                                    id="primary"
                                                    checked={isPrimary}
                                                    onChange={e => setIsPrimary(e.target.checked)}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <label htmlFor="primary" className="text-sm text-slate-700 flex items-center gap-1">
                                                    <Shield size={14} className="text-amber-500" /> {t('classAssignments.classTeacherPrimary')}
                                                </label>
                                            </div>
                                            <button
                                                onClick={handleAssign}
                                                disabled={!selectedTeacher}
                                                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-slate-900 text-white rounded-lg sm:rounded-md text-sm disabled:opacity-50 min-h-[44px]"
                                            >
                                                {t('common.confirm')}
                                            </button>
                                            <button
                                                onClick={() => setIsAssigning(false)}
                                                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-slate-500 text-sm min-h-[44px]"
                                            >
                                                {t('common.cancel')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {assignments[cls.id]?.map(assign => {
                                        const teacher = (assign as any).teacher; // Populated by select query
                                        return (
                                            <div key={assign.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${assign.is_primary ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {assign.is_primary ? <Shield size={16} /> : <BookOpen size={16} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-800">{teacher?.name || 'Unknown Teacher'}</div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                                            {assign.is_primary ? t('classAssignments.classTeacher') : t('classAssignments.subjectTeacher')}
                                                            {teacher?.email && `• ${teacher.email}`}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemove(assign.id, cls.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                    title="Remove Assignment"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {(!assignments[cls.id] || assignments[cls.id].length === 0) && (
                                        <div className="text-center py-4 text-slate-400 text-sm italic">
                                            {t('classAssignments.noTeachersAssigned')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmLabel="Remove"
                variant="danger"
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Calendar,
    Plus,
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
    TrendingUp,
    Lock,
    Unlock,
    Save,
    Edit,
    Trash2,
    X
} from 'lucide-react';
import { academicService } from '../../../services/academicService';
import { notificationService } from '../../../services/notificationService';

// Types
interface Exam {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'active' | 'completed' | 'published';
    created_at: string;
}

export const ExamManagement: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);

    // New Exam Form State
    const [newExamTitle, setNewExamTitle] = useState('');
    const [newExamStart, setNewExamStart] = useState('');
    const [newExamEnd, setNewExamEnd] = useState('');

    // Edit Exam Form State
    const [editExamTitle, setEditExamTitle] = useState('');
    const [editExamStart, setEditExamStart] = useState('');
    const [editExamEnd, setEditExamEnd] = useState('');

    useEffect(() => {
        loadExams();
    }, []);

    const loadExams = async () => {
        setLoading(true);
        const data = await academicService.getAllExams();
        setExams(data);
        setLoading(false);
    };

    const handleCreateExam = async () => {
        if (!newExamTitle || !newExamStart || !newExamEnd) return;

        const { success, error } = await academicService.createExam(newExamTitle, newExamStart, newExamEnd);

        if (success) {
            await loadExams();
            setShowCreateModal(false);
            setNewExamTitle('');
            setNewExamStart('');
            setNewExamEnd('');
        } else {
            alert(`${t('examManagement.failedCreateExam', 'Failed to create exam')}: ${error}`);
        }
    };

    const handleOpenEditModal = (exam: Exam) => {
        setEditingExam(exam);
        setEditExamTitle(exam.title);
        setEditExamStart(exam.start_date.split('T')[0]);
        setEditExamEnd(exam.end_date.split('T')[0]);
        setShowEditModal(true);
    };

    const handleUpdateExam = async () => {
        if (!editingExam || !editExamTitle || !editExamStart || !editExamEnd) return;

        const { success, error } = await academicService.updateExam(
            editingExam.id,
            editExamTitle,
            editExamStart,
            editExamEnd
        );

        if (success) {
            await loadExams();
            setShowEditModal(false);
            setEditingExam(null);
        } else {
            alert(`${t('examManagement.failedUpdateExam', 'Failed to update exam')}: ${error}`);
        }
    };

    const handleDeleteExam = async (exam: Exam) => {
        if (!window.confirm(`${t('common.delete', 'Delete')} "${exam.title}"?`)) {
            return;
        }

        const { success, error } = await academicService.deleteExam(exam.id);

        if (success) {
            await loadExams();
        } else {
            alert(`${t('examManagement.failedDeleteExam', 'Failed to delete exam')}: ${error}`);
        }
    };

    const togglePublishStatus = async (exam: Exam) => {
        const newStatus = exam.status === 'published' ? 'completed' : 'published';

        const originalExams = [...exams];
        setExams(exams.map(e => e.id === exam.id ? { ...e, status: newStatus as any } : e));

        const { success, error } = await academicService.updateExamStatus(exam.id, newStatus);

        if (success) {
            if (newStatus === 'published') {
                // Determine priority based on start date (urgent if starting within 3 days)
                const daysToStart = Math.ceil((new Date(exam.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const priority = daysToStart <= 3 ? 'high' : 'normal';

                // Broadcast to all roles
                await Promise.all([
                    notificationService.broadcast(
                        'student',
                        `Exam Published: ${exam.title}`,
                        `The schedule for ${exam.title} has been published. It begins on ${new Date(exam.start_date).toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN')}. Check your timetable for details.`,
                        { category: 'academic', priority }
                    ),
                    notificationService.broadcast(
                        'parent',
                        `Exam Notice: ${exam.title}`,
                        `The exam "${exam.title}" has been scheduled from ${new Date(exam.start_date).toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN')} to ${new Date(exam.end_date).toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN')}.`,
                        { category: 'academic', priority }
                    ),
                    notificationService.broadcast(
                        'teacher',
                        `Exam Schedule Updated: ${exam.title}`,
                        `The exam "${exam.title}" is now published. Please ensure all internal marks are ready before the start date.`,
                        { category: 'academic', priority }
                    )
                ]);

                alert(t('examManagement.publishedNotificationsSent', 'Exam published and notifications sent to all students, parents, and teachers.'));
            }
        } else {
            alert(`${t('examManagement.failedUpdateStatus', 'Failed to update status')}: ${error}`);
            setExams(originalExams);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('examManagement.title')}</h2>
                    <p className="text-slate-500">{t('examManagement.subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>{t('examManagement.createNewExam')}</span>
                </button>
            </div>

            {/* Exam List */}
            {loading ? (
                <div className="text-center py-10 text-slate-500">{t('examManagement.loadingExams')}</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.examTitle')}</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.schedule')}</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.status')}</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">{t('examManagement.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {exams.length > 0 ? exams.map(exam => (
                                <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${exam.status === 'published' ? 'bg-green-100 text-green-600' :
                                                exam.status === 'active' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{exam.title}</p>
                                                <p className="text-xs text-slate-500">ID: {exam.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                                            <Calendar size={16} className="text-slate-400" />
                                            <span>
                                                {new Date(exam.start_date).toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN')} - {new Date(exam.end_date).toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${exam.status === 'published' ? 'bg-green-100 text-green-700' :
                                            exam.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                                exam.status === 'completed' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {t(`examManagement.${exam.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            {/* Edit Button */}
                                            <button
                                                onClick={() => handleOpenEditModal(exam)}
                                                className="flex items-center justify-center space-x-1 px-3 py-2 min-h-[44px] rounded-md text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors active:bg-blue-200"
                                            >
                                                <Edit size={16} />
                                                <span>{t('examManagement.edit')}</span>
                                            </button>

                                            {/* Publish Toggle */}
                                            <button
                                                onClick={() => togglePublishStatus(exam)}
                                                className={`flex items-center justify-center space-x-1 px-3 py-2 min-h-[44px] rounded-md text-xs font-medium transition-colors active:scale-95 ${exam.status === 'published'
                                                    ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 active:bg-amber-200'
                                                    : 'bg-green-50 text-green-600 hover:bg-green-100 active:bg-green-200'
                                                    }`}
                                            >
                                                {exam.status === 'published' ? (
                                                    <>
                                                        <Lock size={16} />
                                                        <span>{t('examManagement.unpublish')}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Unlock size={16} />
                                                        <span>{t('examManagement.publish')}</span>
                                                    </>
                                                )}
                                            </button>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDeleteExam(exam)}
                                                className="flex items-center justify-center space-x-1 px-3 py-2 min-h-[44px] rounded-md text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors active:bg-red-200"
                                            >
                                                <Trash2 size={16} />
                                                <span>{t('examManagement.delete')}</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                                        {t('examManagement.noExamsFound')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Exam Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                            <Plus className="mr-2 text-indigo-600" />
                            {t('examManagement.createNewExam')}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('examManagement.examTitleLabel')}</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="e.g. Final Term 2026"
                                    value={newExamTitle}
                                    onChange={(e) => setNewExamTitle(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('examManagement.startDate')}</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        value={newExamStart}
                                        onChange={(e) => setNewExamStart(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('examManagement.endDate')}</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        value={newExamEnd}
                                        onChange={(e) => setNewExamEnd(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-8">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {t('examManagement.cancel')}
                            </button>
                            <button
                                onClick={handleCreateExam}
                                disabled={!newExamTitle || !newExamStart || !newExamEnd}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                <Save size={18} className="mr-2" />
                                {t('examManagement.createExam')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Exam Modal */}
            {showEditModal && editingExam && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center">
                                <Edit className="mr-2 text-blue-600" />
                                {t('examManagement.editExam')}
                            </h3>
                            <button
                                onClick={() => { setShowEditModal(false); setEditingExam(null); }}
                                className="p-1 hover:bg-slate-100 rounded-full"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('examManagement.examTitleLabel')}</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    value={editExamTitle}
                                    onChange={(e) => setEditExamTitle(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('examManagement.startDate')}</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        value={editExamStart}
                                        onChange={(e) => setEditExamStart(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('examManagement.endDate')}</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        value={editExamEnd}
                                        onChange={(e) => setEditExamEnd(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-8">
                            <button
                                onClick={() => { setShowEditModal(false); setEditingExam(null); }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {t('examManagement.cancel')}
                            </button>
                            <button
                                onClick={handleUpdateExam}
                                disabled={!editExamTitle || !editExamStart || !editExamEnd}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                <Save size={18} className="mr-2" />
                                {t('examManagement.saveChanges')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

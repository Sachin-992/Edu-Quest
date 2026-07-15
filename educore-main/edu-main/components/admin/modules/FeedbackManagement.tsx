/**
 * EDUCORE-OMEGA Admin Feedback Management Panel
 * 
 * Full CRUD with metrics dashboard, status workflow, and response modal.
 * Admin-only: RBAC enforced at service layer + UI gating.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MessageSquare,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Clock,
    CheckCircle,
    AlertCircle,
    Archive,
    Send,
    X,
    Star,
    TrendingUp,
    Eye,
    RefreshCw,
} from 'lucide-react';
import { feedbackService, type Feedback, type FeedbackCategory, type FeedbackStatus, type FeedbackStats } from '../../../services/feedbackService';

// ============================================================
// COMPONENT
// ============================================================

export const FeedbackManagement: React.FC = () => {
    const { t, i18n } = useTranslation();

    const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
        open: { label: t('feedbackManagement.open'), color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: <AlertCircle size={14} /> },
        under_review: { label: t('feedbackManagement.underReview'), color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: <Eye size={14} /> },
        resolved: { label: t('feedbackManagement.resolved'), color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: <CheckCircle size={14} /> },
        archived: { label: t('feedbackManagement.archived'), color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', icon: <Archive size={14} /> },
    };

    const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
        academic: `📚 ${t('feedbackManagement.academic')}`,
        teacher: `👨‍🏫 ${t('feedbackManagement.teacher')}`,
        infrastructure: `🏗️ ${t('feedbackManagement.infrastructure')}`,
        complaint: `⚠️ ${t('feedbackManagement.complaint')}`,
        suggestion: `💡 ${t('feedbackManagement.suggestion')}`,
        general: `💬 ${t('feedbackManagement.general')}`,
    };

    // Data state
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [stats, setStats] = useState<FeedbackStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters & pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all');
    const [filterCategory, setFilterCategory] = useState<FeedbackCategory | 'all'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 25;

    // Detail modal
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [responseText, setResponseText] = useState('');
    const [adminNotesText, setAdminNotesText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // ============================================================
    // DATA LOADING
    // ============================================================

    const loadData = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [feedbackResult, statsResult] = await Promise.all([
                feedbackService.getAllFeedback({
                    page: currentPage,
                    pageSize: PAGE_SIZE,
                    status: filterStatus !== 'all' ? filterStatus : undefined,
                    category: filterCategory !== 'all' ? filterCategory : undefined,
                    search: searchQuery || undefined,
                }),
                feedbackService.getFeedbackStats(),
            ]);

            setFeedbackList(feedbackResult.data);
            setTotalCount(feedbackResult.total);
            if (statsResult.data) setStats(statsResult.data);
        } catch (err) {
            console.error('[FeedbackManagement] Load error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, filterStatus, filterCategory, searchQuery]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, filterCategory, searchQuery]);

    // ============================================================
    // ACTIONS
    // ============================================================

    const handleStatusChange = async (feedbackId: string, newStatus: FeedbackStatus) => {
        setIsSubmitting(true);
        const result = await feedbackService.updateStatus(feedbackId, newStatus, adminNotesText || undefined);
        setIsSubmitting(false);

        if (result.success) {
            setActionMessage({ type: 'success', text: `${t('feedbackManagement.statusUpdatedTo', 'Status updated to')} ${STATUS_CONFIG[newStatus].label}` });
            loadData(true);
            // Update selected feedback if open
            if (selectedFeedback?.id === feedbackId) {
                setSelectedFeedback(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } else {
            setActionMessage({ type: 'error', text: result.error || t('feedbackManagement.failedUpdateStatus', 'Failed to update status') });
        }
        setTimeout(() => setActionMessage(null), 3000);
    };

    const handleRespond = async () => {
        if (!selectedFeedback || !responseText.trim()) return;
        setIsSubmitting(true);
        const result = await feedbackService.respondToFeedback(selectedFeedback.id, responseText);
        setIsSubmitting(false);

        if (result.success) {
            setActionMessage({ type: 'success', text: t('feedbackManagement.responseSentSuccess', 'Response sent successfully') });
            setResponseText('');
            loadData(true);
            setSelectedFeedback(prev => prev ? { ...prev, admin_response: responseText, responded_at: new Date().toISOString() } : null);
        } else {
            setActionMessage({ type: 'error', text: result.error || t('feedbackManagement.failedSendResponse', 'Failed to send response') });
        }
        setTimeout(() => setActionMessage(null), 3000);
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="text-indigo-600" size={28} />
                        {t('feedbackManagement.title')}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">{t('feedbackManagement.subtitle')}</p>
                </div>
                <button
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    {t('feedbackManagement.refresh')}
                </button>
            </div>

            {/* Action Message */}
            {actionMessage && (
                <div className={`p-3 rounded-lg border text-sm font-medium ${actionMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                    {actionMessage.text}
                </div>
            )}

            {/* Metrics Cards */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs opacity-80">{t('feedbackManagement.open')}</span>
                            <AlertCircle size={18} className="opacity-80" />
                        </div>
                        <p className="text-2xl font-bold">{stats.open}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs opacity-80">{t('feedbackManagement.underReview')}</span>
                            <Eye size={18} className="opacity-80" />
                        </div>
                        <p className="text-2xl font-bold">{stats.under_review}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs opacity-80">{t('feedbackManagement.resolvedToday')}</span>
                            <CheckCircle size={18} className="opacity-80" />
                        </div>
                        <p className="text-2xl font-bold">{stats.resolved_today}</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs opacity-80">{t('feedbackManagement.avgResolution')}</span>
                            <TrendingUp size={18} className="opacity-80" />
                        </div>
                        <p className="text-2xl font-bold">
                            {stats.avg_resolution_hours != null ? `${stats.avg_resolution_hours}h` : '—'}
                        </p>
                    </div>
                </div>
            )}

            {/* Filters & Search */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('feedbackManagement.searchFeedback')}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value as FeedbackStatus | 'all')}
                                className="pl-8 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm appearance-none bg-white cursor-pointer"
                            >
                                <option value="all">{t('feedbackManagement.allStatus')}</option>
                                <option value="open">{t('feedbackManagement.open')}</option>
                                <option value="under_review">{t('feedbackManagement.underReview')}</option>
                                <option value="resolved">{t('feedbackManagement.resolved')}</option>
                                <option value="archived">{t('feedbackManagement.archived')}</option>
                            </select>
                        </div>
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value as FeedbackCategory | 'all')}
                            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm appearance-none bg-white cursor-pointer"
                        >
                            <option value="all">{t('feedbackManagement.allCategories')}</option>
                            <option value="academic">{t('feedbackManagement.academic')}</option>
                            <option value="teacher">{t('feedbackManagement.teacher')}</option>
                            <option value="infrastructure">{t('feedbackManagement.infrastructure')}</option>
                            <option value="complaint">{t('feedbackManagement.complaint')}</option>
                            <option value="suggestion">{t('feedbackManagement.suggestion')}</option>
                            <option value="general">{t('feedbackManagement.general')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Feedback List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <RefreshCw size={32} className="mx-auto text-slate-300 animate-spin mb-3" />
                        <p className="text-slate-500">{t('feedbackManagement.loadingFeedback')}</p>
                    </div>
                ) : feedbackList.length === 0 ? (
                    <div className="p-12 text-center">
                        <MessageSquare size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">{t('feedbackManagement.noFeedbackFound')}</p>
                        <p className="text-slate-400 text-sm mt-1">{t('feedbackManagement.adjustFilters')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {feedbackList.map(fb => {
                            const statusCfg = STATUS_CONFIG[fb.status];
                            return (
                                <div
                                    key={fb.id}
                                    onClick={() => {
                                        setSelectedFeedback(fb);
                                        setResponseText(fb.admin_response || '');
                                        setAdminNotesText(fb.admin_notes || '');
                                    }}
                                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${statusCfg.bg} ${statusCfg.color}`}>
                                                    {statusCfg.icon} {statusCfg.label}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {CATEGORY_LABELS[fb.category]}
                                                </span>
                                                {fb.subject?.name && (
                                                    <span className="text-xs text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full font-semibold">
                                                        📖 {fb.subject.name}
                                                    </span>
                                                )}
                                                {fb.teacher?.name && (
                                                    <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
                                                        👨‍🏫 {fb.teacher.name}
                                                    </span>
                                                )}
                                                <span className="text-xs text-slate-400">
                                                    {t('feedbackManagement.from')} {fb.is_anonymous ? t('feedbackManagement.anonymous') : t(`userManagement.${fb.user_role}s`, { defaultValue: fb.user_role })}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-slate-800 truncate">{fb.title}</h3>
                                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{fb.description}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs text-slate-400">
                                                {new Date(fb.created_at).toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                            {fb.rating && (
                                                <div className="flex items-center gap-0.5 mt-1 justify-end">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star key={s} size={12} className={s <= fb.rating! ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
                        <span className="text-sm text-slate-500">
                            {t('feedbackManagement.page')} {currentPage} {t('feedbackManagement.of')} {totalPages} ({totalCount} {t('feedbackManagement.total')})
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================================ */}
            {/* DETAIL MODAL */}
            {/* ============================================================ */}
            {selectedFeedback && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedFeedback(null)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 sm:p-6 rounded-t-2xl flex items-start justify-between z-10">
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    {(() => {
                                        const sc = STATUS_CONFIG[selectedFeedback.status];
                                        return (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${sc.bg} ${sc.color}`}>
                                                {sc.icon} {sc.label}
                                            </span>
                                        );
                                    })()}
                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                        {CATEGORY_LABELS[selectedFeedback.category]}
                                    </span>
                                    {selectedFeedback.subject?.name && (
                                        <span className="text-xs text-purple-600 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full font-semibold">
                                            📖 {selectedFeedback.subject.name}
                                        </span>
                                    )}
                                    {selectedFeedback.teacher?.name && (
                                        <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full font-semibold">
                                            👨‍🏫 {selectedFeedback.teacher.name}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">{selectedFeedback.title}</h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    {t('feedbackManagement.submittedBy')} {selectedFeedback.is_anonymous ? t('feedbackManagement.anonymous') : t(`userManagement.${selectedFeedback.user_role}s`, { defaultValue: selectedFeedback.user_role })} •{' '}
                                    {new Date(selectedFeedback.created_at).toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN', {
                                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>
                            </div>
                            <button onClick={() => setSelectedFeedback(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 space-y-5">
                            {/* Rating */}
                            {selectedFeedback.rating && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-600 font-medium">{t('feedbackManagement.rating')}</span>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={18} className={s <= selectedFeedback.rating! ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-2">{t('feedbackManagement.description')}</h3>
                                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap border border-slate-100">
                                    {selectedFeedback.description}
                                </div>
                            </div>

                            {/* Existing Admin Response */}
                            {selectedFeedback.admin_response && (
                                <div>
                                    <h3 className="text-sm font-semibold text-green-700 mb-2">{t('feedbackManagement.adminResponse')}</h3>
                                    <div className="bg-green-50 p-4 rounded-lg text-sm text-green-800 whitespace-pre-wrap border border-green-100">
                                        {selectedFeedback.admin_response}
                                        <p className="text-xs text-green-500 mt-2">
                                            {t('feedbackManagement.responded')} {selectedFeedback.responded_at && new Date(selectedFeedback.responded_at).toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Status Actions */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-2">{t('feedbackManagement.updateStatus')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {(['open', 'under_review', 'resolved', 'archived'] as FeedbackStatus[])
                                        .filter(s => s !== selectedFeedback.status)
                                        .map(status => {
                                            const cfg = STATUS_CONFIG[status];
                                            return (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusChange(selectedFeedback.id, status)}
                                                    disabled={isSubmitting}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${cfg.bg} ${cfg.color} hover:opacity-80`}
                                                >
                                                    {cfg.icon} {cfg.label}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* Admin Notes (internal) */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-2">{t('feedbackManagement.internalNotes')} <span className="font-normal text-slate-400">{t('feedbackManagement.notVisibleToUser')}</span></h3>
                                <textarea
                                    value={adminNotesText}
                                    onChange={e => setAdminNotesText(e.target.value)}
                                    rows={2}
                                    placeholder={t('feedbackManagement.internalNotesPlaceholder')}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                />
                            </div>

                            {/* Write Response */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-2">{t('feedbackManagement.writeResponse')} <span className="font-normal text-slate-400">{t('feedbackManagement.visibleToUser')}</span></h3>
                                <textarea
                                    value={responseText}
                                    onChange={e => setResponseText(e.target.value)}
                                    rows={3}
                                    placeholder={t('feedbackManagement.writeResponsePlaceholder')}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                />
                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={handleRespond}
                                        disabled={isSubmitting || !responseText.trim()}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    >
                                        <Send size={16} />
                                        {isSubmitting ? t('feedbackManagement.sending') : t('feedbackManagement.sendResponse')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackManagement;

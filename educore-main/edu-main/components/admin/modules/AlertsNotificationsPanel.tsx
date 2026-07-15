import React, { useState, useEffect } from 'react';
import {
    Bell, Send, Users, Mail, Clock, Megaphone, AlertTriangle,
    CheckCircle, Filter, Search, Trash2, Eye, RefreshCw, Loader2,
    GraduationCap, Briefcase, Home, User, MessageCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { notificationService, Notification, NotificationCategory, NotificationPriority } from '../../../services/notificationService';
import { supabase } from '../../../services/supabaseClient';
import { whatsappService } from '../../../services/whatsappService';

interface NotificationStats {
    total: number;
    unread: number;
    urgent: number;
    today: number;
}

const ROLE_OPTIONS = [
    { value: 'all', label: 'All Users', icon: Users },
    { value: 'admin', label: 'Admins', icon: User },
    { value: 'teacher', label: 'Teachers', icon: Briefcase },
    { value: 'student', label: 'Students', icon: GraduationCap },
    { value: 'parent', label: 'Parents', icon: Home },
];

const CATEGORY_OPTIONS: { value: NotificationCategory; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'academic', label: 'Academic' },
    { value: 'financial', label: 'Financial' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'announcement', label: 'Announcement' },
];

const PRIORITY_OPTIONS: { value: NotificationPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-slate-400' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-500' },
    { value: 'high', label: 'High', color: 'bg-amber-500' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
];

const TEMPLATES = [
    {
        name: 'Fee Reminder',
        titleKey: 'feeReminderTitle',
        messageKey: 'feeReminderMsg',
        category: 'financial' as NotificationCategory,
        priority: 'high' as NotificationPriority,
    },
    {
        name: 'Exam Schedule',
        titleKey: 'examScheduleTitle',
        messageKey: 'examScheduleMsg',
        category: 'academic' as NotificationCategory,
        priority: 'normal' as NotificationPriority,
    },
    {
        name: 'Holiday Notice',
        titleKey: 'holidayNoticeTitle',
        messageKey: 'holidayNoticeMsg',
        category: 'announcement' as NotificationCategory,
        priority: 'normal' as NotificationPriority,
    },
    {
        name: 'Emergency Alert',
        titleKey: 'emergencyAlertTitle',
        messageKey: 'emergencyAlertMsg',
        category: 'urgent' as NotificationCategory,
        priority: 'urgent' as NotificationPriority,
    },
];

export const AlertsNotificationsPanel: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, urgent: 0, today: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<NotificationCategory | 'all'>('all');

    // Send form state
    const [showSendForm, setShowSendForm] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        targetRole: 'all',
        category: 'announcement' as NotificationCategory,
        priority: 'normal' as NotificationPriority,
        actionUrl: '',
        sendViaWhatsApp: false,
    });
    const [whatsappSent, setWhatsappSent] = useState(false);
    const whatsappAvailable = whatsappService.isAvailable();

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setIsLoading(true);
        try {
            if (supabase) {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (!error && data) {
                    setNotifications(data);
                    calculateStats(data);
                }
            }
        } catch (e) {
            console.error('Failed to load notifications:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (notifs: Notification[]) => {
        const today = new Date().toDateString();
        setStats({
            total: notifs.length,
            unread: notifs.filter(n => !n.read).length,
            urgent: notifs.filter(n => n.priority === 'urgent').length,
            today: notifs.filter(n => new Date(n.created_at).toDateString() === today).length,
        });
    };

    const handleSendNotification = async () => {
        if (!formData.title.trim() || !formData.message.trim()) {
            alert(t('alertsPanel.fillRequiredFields'));
            return;
        }

        setIsSending(true);
        setWhatsappSent(false);
        try {
            const adminUser = 'System Admin'; // TODO: Get from auth context

            // 1. Send in-app notification
            if (formData.targetRole === 'all') {
                await notificationService.create(formData.title, formData.message, {
                    type: 'announcement',
                    category: formData.category,
                    priority: formData.priority,
                    senderName: adminUser,
                    actionUrl: formData.actionUrl || undefined,
                });
            } else {
                await notificationService.broadcast(
                    formData.targetRole as 'admin' | 'teacher' | 'student' | 'parent',
                    formData.title,
                    formData.message,
                    {
                        category: formData.category,
                        priority: formData.priority,
                        senderName: adminUser,
                    }
                );
            }

            // 2. Open WhatsApp with notice if toggled on
            if (formData.sendViaWhatsApp) {
                whatsappService.sendToGroup(
                    formData.title,
                    formData.message,
                    formData.category,
                    formData.priority
                );
                setWhatsappSent(true);
            }

            // Reset form
            setFormData({
                title: '',
                message: '',
                targetRole: 'all',
                category: 'announcement',
                priority: 'normal',
                actionUrl: '',
                sendViaWhatsApp: false,
            });
            setShowSendForm(false);
            loadNotifications();
        } catch (e) {
            console.error('Failed to send notification:', e);
            alert(t('alertsPanel.failedToSend'));
        } finally {
            setIsSending(false);
        }
    };

    const applyTemplate = (template: typeof TEMPLATES[0]) => {
        setFormData({
            ...formData,
            title: t(`alertsPanel.${template.titleKey}`),
            message: t(`alertsPanel.${template.messageKey}`),
            category: template.category,
            priority: template.priority,
        });
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || n.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('alertsPanel.title')}</h2>
                    <p className="text-slate-500 text-sm mt-1">{t('alertsPanel.subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowSendForm(!showSendForm)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2 w-full sm:w-auto justify-center"
                >
                    <Send size={18} />
                    <span>{t('alertsPanel.sendNotice')}</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Bell size={20} className="text-blue-600" />
                        </div>
                        <span className="text-2xl font-bold text-slate-800">{stats.total}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{t('alertsPanel.totalNotifications')}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Mail size={20} className="text-amber-600" />
                        </div>
                        <span className="text-2xl font-bold text-slate-800">{stats.unread}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{t('alertsPanel.unread')}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle size={20} className="text-red-600" />
                        </div>
                        <span className="text-2xl font-bold text-slate-800">{stats.urgent}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{t('alertsPanel.urgent')}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Clock size={20} className="text-green-600" />
                        </div>
                        <span className="text-2xl font-bold text-slate-800">{stats.today}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{t('alertsPanel.today')}</p>
                </div>
            </div>

            {/* Send Form */}
            {showSendForm && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <Megaphone size={20} className="mr-2 text-indigo-600" />
                        {t('alertsPanel.sendNewNotification')}
                    </h3>

                    {/* Templates */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('alertsPanel.quickTemplates')}</label>
                        <div className="flex flex-wrap gap-2">
                            {TEMPLATES.map((template, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => applyTemplate(template)}
                                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    {template.name === 'Fee Reminder' ? t('alertsPanel.feeReminder') :
                                     template.name === 'Exam Schedule' ? t('alertsPanel.examSchedule') :
                                     template.name === 'Holiday Notice' ? t('alertsPanel.holidayNotice') :
                                     template.name === 'Emergency Alert' ? t('alertsPanel.emergencyAlert') : template.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Title */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('alertsPanel.notificationTitle')}</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder={t('alertsPanel.enterTitlePlaceholder')}
                            />
                        </div>

                        {/* Message */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('alertsPanel.notificationMessage')}</label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder={t('alertsPanel.enterMessagePlaceholder')}
                            />
                        </div>

                        {/* Target Role */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('alertsPanel.sendTo')}</label>
                            <select
                                value={formData.targetRole}
                                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {ROLE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.value === 'all' ? t('alertsPanel.roleAll') :
                                         opt.value === 'admin' ? t('alertsPanel.roleAdmin') :
                                         opt.value === 'teacher' ? t('alertsPanel.roleTeacher') :
                                         opt.value === 'student' ? t('alertsPanel.roleStudent') :
                                         opt.value === 'parent' ? t('alertsPanel.roleParent') : opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('alertsPanel.category')}</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as NotificationCategory })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {CATEGORY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.value === 'system' ? t('alertsPanel.catSystem') :
                                         opt.value === 'academic' ? t('alertsPanel.catAcademic') :
                                         opt.value === 'financial' ? t('alertsPanel.catFinancial') :
                                         opt.value === 'urgent' ? t('alertsPanel.catUrgent') :
                                         opt.value === 'announcement' ? t('alertsPanel.catAnnouncement') : opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('alertsPanel.priority')}</label>
                            <div className="flex space-x-2">
                                {PRIORITY_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFormData({ ...formData, priority: opt.value })}
                                        className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${formData.priority === opt.value
                                            ? `${opt.color} text-white`
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {opt.value === 'low' ? t('alertsPanel.priLow') :
                                         opt.value === 'normal' ? t('alertsPanel.priNormal') :
                                         opt.value === 'high' ? t('alertsPanel.priHigh') :
                                         opt.value === 'urgent' ? t('alertsPanel.priUrgent') : opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action URL */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('alertsPanel.actionUrl')}</label>
                            <input
                                type="text"
                                value={formData.actionUrl}
                                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="/portal/finance"
                            />
                        </div>
                    </div>

                    {/* WhatsApp Group Toggle */}
                    <div className="mt-4 p-4 rounded-xl border border-green-200 bg-green-50/60">
                        <label className="flex items-center cursor-pointer space-x-3">
                            <input
                                type="checkbox"
                                checked={formData.sendViaWhatsApp}
                                onChange={(e) => setFormData({ ...formData, sendViaWhatsApp: e.target.checked })}
                                className="w-5 h-5 rounded border-green-400 text-green-600 focus:ring-green-500"
                                disabled={!whatsappAvailable}
                            />
                            <MessageCircle size={20} className="text-green-600" />
                            <div>
                                <span className="font-medium text-slate-800">{t('alertsPanel.sendToWhatsApp')}</span>
                                {!whatsappAvailable && (
                                    <p className="text-xs text-amber-600 mt-0.5">{t('alertsPanel.whatsappNotConfigured')}</p>
                                )}
                                {whatsappAvailable && (
                                    <p className="text-xs text-slate-500 mt-0.5">{t('alertsPanel.whatsappNoticeHelp')}</p>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Send Button */}
                    <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            onClick={() => setShowSendForm(false)}
                            className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors order-2 sm:order-1"
                        >
                            {t('alertsPanel.cancel')}
                        </button>
                        <button
                            onClick={handleSendNotification}
                            disabled={isSending}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 order-1 sm:order-2"
                        >
                            {isSending ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>{t('alertsPanel.sending')}</span>
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    <span>{formData.sendViaWhatsApp ? t('alertsPanel.sendAndOpenWhatsApp') : t('alertsPanel.sendBtn')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* WhatsApp Group Success Banner */}
            {whatsappSent && (
                <div className="bg-green-50 rounded-xl border border-green-200 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <MessageCircle size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium text-green-800">{t('alertsPanel.whatsappOpenedTitle')}</p>
                            <p className="text-xs text-green-600">{t('alertsPanel.whatsappOpenedDesc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setWhatsappSent(false)}
                        className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors"
                    >
                        {t('alertsPanel.dismiss')}
                    </button>
                </div>
            )}

            {/* Notifications List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Toolbar */}
                <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 gap-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('alertsPanel.searchPlaceholder')}
                                className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                            />
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value as NotificationCategory | 'all')}
                            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">{t('alertsPanel.allCategories')}</option>
                            {CATEGORY_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.value === 'system' ? t('alertsPanel.catSystem') :
                                     opt.value === 'academic' ? t('alertsPanel.catAcademic') :
                                     opt.value === 'financial' ? t('alertsPanel.catFinancial') :
                                     opt.value === 'urgent' ? t('alertsPanel.catUrgent') :
                                     opt.value === 'announcement' ? t('alertsPanel.catAnnouncement') : opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={loadNotifications}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors self-end sm:self-auto"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* List */}
                <div className="divide-y divide-slate-100">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <Loader2 size={32} className="mx-auto animate-spin text-indigo-600" />
                            <p className="mt-2 text-slate-500">{t('alertsPanel.loading')}</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell size={40} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500">{t('alertsPanel.noNotifications')}</p>
                        </div>
                    ) : (
                        filteredNotifications.slice(0, 50).map(notif => (
                            <div key={notif.id} className={`p-4 hover:bg-slate-50 ${!notif.read ? 'bg-indigo-50/50' : ''}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <span className={`w-2 h-2 rounded-full ${notif.priority === 'urgent' ? 'bg-red-500' :
                                                notif.priority === 'high' ? 'bg-amber-500' :
                                                    'bg-blue-500'
                                                }`} />
                                            <h4 className="font-medium text-slate-800">{notif.title}</h4>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${notif.category === 'urgent' ? 'bg-red-100 text-red-700' :
                                                notif.category === 'academic' ? 'bg-blue-100 text-blue-700' :
                                                    notif.category === 'financial' ? 'bg-green-100 text-green-700' :
                                                        'bg-slate-100 text-slate-700'
                                                }`}>
                                                {notif.category === 'system' ? t('alertsPanel.catSystem') :
                                                 notif.category === 'academic' ? t('alertsPanel.catAcademic') :
                                                 notif.category === 'financial' ? t('alertsPanel.catFinancial') :
                                                 notif.category === 'urgent' ? t('alertsPanel.catUrgent') :
                                                 notif.category === 'announcement' ? t('alertsPanel.catAnnouncement') : notif.category}
                                            </span>
                                            {notif.target_role && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                                    → {notif.target_role === 'all' ? t('alertsPanel.roleAll') :
                                                       notif.target_role === 'admin' ? t('alertsPanel.roleAdmin') :
                                                       notif.target_role === 'teacher' ? t('alertsPanel.roleTeacher') :
                                                       notif.target_role === 'student' ? t('alertsPanel.roleStudent') :
                                                       notif.target_role === 'parent' ? t('alertsPanel.roleParent') : notif.target_role}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                                        <div className="flex items-center space-x-3 mt-2 text-xs text-slate-400">
                                            <span>{formatDate(notif.created_at)}</span>
                                            {notif.sender_name && <span>{t('alertsPanel.by')} {notif.sender_name}</span>}
                                            {notif.read && <span className="text-green-600 flex items-center"><CheckCircle size={12} className="mr-0.5" /> {t('alertsPanel.readStatus')}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertsNotificationsPanel;

import React, { useState, useEffect, useRef } from 'react';
import {
    Bell, X, Check, CheckCheck, Info, AlertTriangle, AlertCircle,
    Megaphone, Filter, Volume2, VolumeX, Settings, Trash2, ExternalLink,
    ChevronDown, Clock, Zap
} from 'lucide-react';
import { notificationService, Notification, NotificationType, NotificationCategory } from '../services/notificationService';
import { useTranslation } from 'react-i18next';
import { localizeNotificationTitle, localizeNotificationMessage } from '../utils/localizationHelpers';

interface NotificationCenterProps {
    className?: string;
}

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
    system: 'System',
    academic: 'Academic',
    financial: 'Financial',
    urgent: 'Urgent',
    announcement: 'Announcements',
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
    const { t, i18n } = useTranslation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = notificationService.subscribe(setNotifications);
        return unsubscribe;
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update page title with unread count
    useEffect(() => {
        const unreadCount = notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            document.title = `(${unreadCount}) EDUCORE-OMEGA`;
        } else {
            document.title = 'EDUCORE-OMEGA';
        }
    }, [notifications]);

    const unreadCount = notifications.filter(n => !n.read).length;
    const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.read).length;

    const filteredNotifications = activeCategory === 'all'
        ? notifications
        : notifications.filter(n => n.category === activeCategory);

    const getIcon = (type: NotificationType, priority?: string) => {
        if (priority === 'urgent') return <Zap size={16} className="text-red-500" />;
        switch (type) {
            case 'success': return <Check size={16} className="text-green-500" />;
            case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
            case 'error': return <AlertCircle size={16} className="text-red-500" />;
            case 'announcement': return <Megaphone size={16} className="text-purple-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    const getBgColor = (type: NotificationType, read: boolean, priority?: string) => {
        if (read) return 'bg-slate-50';
        if (priority === 'urgent') return 'bg-red-50 border-l-4 border-red-500';
        switch (type) {
            case 'success': return 'bg-green-50';
            case 'warning': return 'bg-amber-50';
            case 'error': return 'bg-red-50';
            case 'announcement': return 'bg-purple-50';
            default: return 'bg-blue-50';
        }
    };

    const getPriorityBadge = (priority?: string) => {
        if (!priority || priority === 'normal' || priority === 'low') return null;
        return (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                {priority}
            </span>
        );
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return t('common.justNow');
        if (diffMins < 60) return t('common.minutesAgo', { count: diffMins });
        if (diffMins < 1440) return t('common.hoursAgo', { count: Math.floor(diffMins / 60) });
        return date.toLocaleDateString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN');
    };

    const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        await notificationService.markAsRead(id);
    };

    const handleDismiss = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await notificationService.dismiss(id);
    };

    const handleMarkAllAsRead = async () => {
        await notificationService.markAllAsRead();
    };

    const handleClearAll = async () => {
        if (confirm(t('alertsPanel.confirmClearAll'))) {
            await notificationService.clear();
        }
    };

    const handleRequestPush = async () => {
        const granted = await notificationService.requestPushPermission();
        if (granted) {
            notificationService.info('Push Enabled', 'You will now receive browser notifications');
        }
    };

    const pushPermission = notificationService.getPushPermission();

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors group"
            >
                <Bell size={22} className={`transition-colors ${urgentCount > 0 ? 'text-red-500 animate-pulse' : 'text-slate-600 group-hover:text-indigo-600'
                    }`} />
                {unreadCount > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-5 h-5 px-1 text-white text-xs font-bold rounded-full flex items-center justify-center ${urgentCount > 0 ? 'bg-red-500 animate-bounce' : 'bg-indigo-600'
                        }`}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
                        <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-slate-800">{t('dashboard.alertsNotices')}</h3>
                            {unreadCount > 0 && (
                                <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                                    {unreadCount} {t('alertsPanel.unread').toLowerCase()}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                    title={t('alertsPanel.markAllAsRead', 'Mark all as read')}
                                >
                                    <CheckCheck size={16} />
                                </button>
                            )}
                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                title={soundEnabled ? t('alertsPanel.mute', 'Mute sounds') : t('alertsPanel.unmute', 'Enable sounds')}
                            >
                                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            </button>
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                title={t('alertsPanel.notificationSettings')}
                            >
                                <Settings size={16} />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
                                title={t('common.close')}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${activeCategory === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {t('common.all')}
                        </button>
                        {(Object.keys(CATEGORY_LABELS) as NotificationCategory[]).map(cat => {
                            const count = notifications.filter(n => n.category === cat && !n.read).length;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors flex items-center space-x-1 ${activeCategory === cat
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    <span>{t(`alertsPanel.cat${cat.charAt(0).toUpperCase() + cat.slice(1)}`, { defaultValue: CATEGORY_LABELS[cat] })}</span>
                                    {count > 0 && (
                                        <span className={`text-[10px] px-1 rounded ${activeCategory === cat ? 'bg-white/30' : 'bg-indigo-100 text-indigo-600'
                                            }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <h4 className="font-medium text-slate-700 mb-3">{t('alertsPanel.notificationSettings')}</h4>
                            {pushPermission === 'default' && (
                                <button
                                    onClick={handleRequestPush}
                                    className="w-full py-2 px-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
                                >
                                    <Bell size={16} />
                                    <span>{t('alertsPanel.enablePush')}</span>
                                </button>
                            )}
                            {pushPermission === 'granted' && (
                                <div className="flex items-center space-x-2 text-green-600 text-sm">
                                    <Check size={16} />
                                    <span>{t('alertsPanel.pushEnabled')}</span>
                                </div>
                            )}
                            {pushPermission === 'denied' && (
                                <div className="flex items-center space-x-2 text-red-600 text-sm">
                                    <AlertCircle size={16} />
                                    <span>{t('alertsPanel.pushBlocked')}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {filteredNotifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <Bell size={40} className="mx-auto mb-3 opacity-40" />
                                <p className="text-sm font-medium">{t('alertsPanel.noNotifications')}</p>
                                <p className="text-xs mt-1">{t('alertsPanel.allCaughtUp')}</p>
                            </div>
                        ) : (
                            filteredNotifications.slice(0, 15).map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-3 border-b border-slate-100 hover:bg-slate-100 cursor-pointer transition-all ${getBgColor(notification.type, notification.read, notification.priority)}`}
                                    onClick={(e) => {
                                        // If clicking the action button or X inside, don't open modal?
                                        // The outer div has the click handler.
                                        // We want clicking the item to open details AND mark as read.
                                        handleMarkAsRead(notification.id);
                                        setActiveNotification(notification);
                                        // Close dropdown? Optional. Maybe keep it open or close it. 
                                        // User likely wants to see details, so closing dropdown to show modal is cleaner.
                                        setIsOpen(false);
                                    }}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="mt-0.5 flex-shrink-0">
                                            {getIcon(notification.type, notification.priority)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center space-x-2 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${notification.read ? 'text-slate-500' : 'text-slate-800'}`}>
                                                        {localizeNotificationTitle(notification.title, t)}
                                                    </p>
                                                    {getPriorityBadge(notification.priority)}
                                                </div>
                                                <button
                                                    onClick={(e) => handleDismiss(notification.id, e)}
                                                    className="text-slate-400 hover:text-red-500 p-1 flex-shrink-0"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <p className={`text-xs mt-0.5 line-clamp-2 ${notification.read ? 'text-slate-400' : 'text-slate-600'}`}>
                                                {localizeNotificationMessage(notification.message, t)}
                                            </p>
                                            <div className="flex items-center justify-between mt-1.5">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-[10px] text-slate-400 flex items-center">
                                                        <Clock size={10} className="mr-0.5" />
                                                        {formatTime(notification.created_at)}
                                                    </span>
                                                    {notification.sender_name && (
                                                        <span className="text-[10px] text-purple-600 font-medium">
                                                            {notification.sender_name}
                                                        </span>
                                                    )}
                                                </div>
                                                {notification.action_url && (
                                                    <a
                                                        href={notification.action_url}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-[10px] text-indigo-600 font-medium flex items-center hover:underline"
                                                    >
                                                        {notification.action_label || t('common.view')}
                                                        <ExternalLink size={10} className="ml-0.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {filteredNotifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                {t('alertsPanel.countNotifications', { count: filteredNotifications.length })}
                            </span>
                            <button
                                onClick={handleClearAll}
                                className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center space-x-1"
                            >
                                <Trash2 size={12} />
                                <span>{t('alertsPanel.clearAll')}</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
            {/* Detail Modal */}
            {activeNotification && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setActiveNotification(null)}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[80vh]">
                        {/* Header */}
                        <div className={`px-6 py-4 flex items-center justify-between ${getBgColor(activeNotification.type, false, activeNotification.priority)}`}>
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-white/50 rounded-lg backdrop-blur-sm">
                                    {getIcon(activeNotification.type, activeNotification.priority)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{localizeNotificationTitle(activeNotification.title, t)}</h3>
                                    <span className="text-xs font-medium opacity-70 flex items-center mt-1">
                                        <Clock size={12} className="mr-1" />
                                        {new Date(activeNotification.created_at).toLocaleString(i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN')}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveNotification(null)}
                                className="p-2 hover:bg-black/10 rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-600" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto">
                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {activeNotification.priority === 'urgent' && (
                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                        {t('notifications.urgentPriority', { defaultValue: 'Urgent Priority' })}
                                    </span>
                                )}
                                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide ${activeNotification.category === 'academic' ? 'bg-blue-100 text-blue-700' :
                                    activeNotification.category === 'financial' ? 'bg-green-100 text-green-700' :
                                        'bg-slate-100 text-slate-700'
                                    }`}>
                                    {t(`notifications.categories.${activeNotification.category}`, { defaultValue: CATEGORY_LABELS[activeNotification.category] })}
                                </span>
                            </div>

                            {/* Message */}
                            <div className="prose prose-sm prose-slate max-w-none">
                                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {localizeNotificationMessage(activeNotification.message, t)}
                                </p>
                            </div>

                            {/* Sender Info */}
                            {activeNotification.sender_name && (
                                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-sm text-slate-500">
                                    <span className="font-medium mr-2">{t('notifications.sentBy', { defaultValue: 'Sent by:' })}</span>
                                    <span className="flex items-center text-slate-700 font-medium">
                                        <div className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold mr-2">
                                            {activeNotification.sender_name.charAt(0)}
                                        </div>
                                        {activeNotification.sender_name}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setActiveNotification(null)}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                {t('common.close', { defaultValue: 'Close' })}
                            </button>
                            {activeNotification.action_url && (
                                <a
                                    href={activeNotification.action_url}
                                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-lg shadow-indigo-500/20"
                                    onClick={() => setActiveNotification(null)}
                                >
                                    {activeNotification.action_label || t('notifications.takeAction', { defaultValue: 'Take Action' })}
                                    <ExternalLink size={16} className="ml-2" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;

/**
 * EDUCORE-OMEGA Enhanced Notification Service
 * 
 * Database-persisted notifications with real-time updates,
 * push notification support, and role-based targeting.
 */

import { supabase } from './supabaseClient';

// Types
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'announcement';
export type NotificationCategory = 'system' | 'academic' | 'financial' | 'urgent' | 'announcement';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
    id: string;
    user_id?: string;
    target_role?: string;
    type: NotificationType;
    category: NotificationCategory;
    priority: NotificationPriority;
    title: string;
    message: string;
    action_url?: string;
    action_label?: string;
    sender_id?: string;
    sender_name?: string;
    read: boolean;
    dismissed: boolean;
    created_at: string;
    expires_at?: string;
    read_at?: string;
    metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
    enable_in_app: boolean;
    enable_push: boolean;
    enable_email: boolean;
    mute_system: boolean;
    mute_academic: boolean;
    mute_financial: boolean;
    mute_announcements: boolean;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
    enable_sound: boolean;
}

// In-memory cache for immediate UI updates
let notifications: Notification[] = [];
let listeners: Array<(notifications: Notification[]) => void> = [];
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

const generateId = () => `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;

// Sound for notifications
let notificationSound: HTMLAudioElement | null = null;
if (typeof window !== 'undefined') {
    notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVwmPmijso94OjOUnLuqfEQqOHOdxbeRVykvXpK6x4lDHC5onMi7hkIcI1qNvsiTWhQhVoq3v5JpLB5GgLnIl2YYGk2EvMiVZxgaS4G7x5hrGhlLgbrHmXwfHUqAusebfBwdS4K7x5l9HR1Le7fFlXkZG0t8uMWUeRkbS3y5xpV6GhtLfLnGlHoaG0t8ucaUehoaS3y5xpR7GhpLfLnGlHsaGkp8t8WUexoaSny3xZR7GhpKfLfFlHsaGkp');
}

export const notificationService = {
    /**
     * Initialize real-time subscription
     */
    init: async () => {
        if (!supabase) return;

        // Load existing notifications
        await notificationService.loadFromDatabase();

        // Subscribe to real-time updates
        realtimeChannel = supabase.channel('notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    if (!notifications.some(n => n.id === newNotification.id)) {
                        notifications.unshift(newNotification);
                        notificationService.notifyListeners();
                        notificationService.playSound();
                        notificationService.showBrowserNotification(newNotification);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'notifications' },
                (payload) => {
                    const updated = payload.new as Notification;
                    notifications = notifications.map(n =>
                        n.id === updated.id ? updated : n
                    );
                    notificationService.notifyListeners();
                }
            )
            .subscribe();
    },

    /**
     * Cleanup subscriptions
     */
    cleanup: () => {
        if (realtimeChannel) {
            supabase?.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }
    },

    /**
     * Load notifications from database
     */
    loadFromDatabase: async (): Promise<Notification[]> => {
        if (!supabase) return [];

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .or('dismissed.is.null,dismissed.eq.false')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Failed to load notifications:', error);
                return [];
            }

            const dismissedLocal: string[] = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
            const readLocal: string[] = JSON.parse(localStorage.getItem('read_notifications') || '[]');

            notifications = (data || [])
                .filter(n => !dismissedLocal.includes(n.id))
                .map(n => {
                    if (readLocal.includes(n.id)) {
                        n.read = true;
                    }
                    return n;
                });

            notificationService.notifyListeners();
            return notifications;
        } catch (e) {
            console.error('Notification load error:', e);
            return [];
        }
    },

    /**
     * Subscribe to notification updates
     */
    subscribe: (callback: (notifications: Notification[]) => void): (() => void) => {
        listeners.push(callback);
        callback(notifications);
        return () => {
            listeners = listeners.filter(l => l !== callback);
        };
    },

    /**
     * Notify all listeners
     */
    notifyListeners: () => {
        listeners.forEach(cb => cb([...notifications]));
    },

    /**
     * Play notification sound
     */
    playSound: () => {
        if (notificationSound) {
            notificationSound.currentTime = 0;
            notificationSound.play().catch(() => { });
        }
    },

    /**
     * Show browser notification (for push)
     */
    showBrowserNotification: async (notification: Notification) => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;

        const browserNotif = new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id,
            requireInteraction: notification.priority === 'urgent',
        });

        browserNotif.onclick = () => {
            window.focus();
            if (notification.action_url) {
                window.location.href = notification.action_url;
            }
            browserNotif.close();
        };
    },

    /**
     * Create a notification (database-persisted)
     */
    create: async (
        title: string,
        message: string,
        options: {
            type?: NotificationType;
            category?: NotificationCategory;
            priority?: NotificationPriority;
            userId?: string;
            targetRole?: string;
            actionUrl?: string;
            actionLabel?: string;
            senderId?: string;
            senderName?: string;
            expiresAt?: string;
        } = {}
    ): Promise<Notification | null> => {
        if (!supabase) {
            // Fallback to in-memory if no database
            const notification: Notification = {
                id: generateId(),
                title,
                message,
                type: options.type || 'info',
                category: options.category || 'system',
                priority: options.priority || 'normal',
                read: false,
                dismissed: false,
                created_at: new Date().toISOString(),
                ...options
            };
            notifications.unshift(notification);
            notificationService.notifyListeners();
            return notification;
        }

        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert({
                    title,
                    message,
                    type: options.type || 'info',
                    category: options.category || 'system',
                    priority: options.priority || 'normal',
                    user_id: options.userId || null,
                    target_role: options.targetRole || null,
                    action_url: options.actionUrl || null,
                    action_label: options.actionLabel || null,
                    sender_id: options.senderId || null,
                    sender_name: options.senderName || null,
                    expires_at: options.expiresAt || null,
                })
                .select()
                .single();

            if (error) throw error;
            if (!notifications.some(n => n.id === data.id)) {
                notifications.unshift(data);
                notificationService.notifyListeners();
            }
            return data;
        } catch (e) {
            console.error('Failed to create notification:', e);
            // Fallback to in-memory if database write failed (or RLS denied, e.g. during testing)
            const notification: Notification = {
                id: generateId(),
                title,
                message,
                type: options.type || 'info',
                category: options.category || 'system',
                priority: options.priority || 'normal',
                read: false,
                dismissed: false,
                created_at: new Date().toISOString(),
                ...options
            };
            notifications.unshift(notification);
            notificationService.notifyListeners();
            return notification;
        }
    },

    /**
     * Helper methods for common notification types
     */
    info: async (title: string, message: string) =>
        notificationService.create(title, message, { type: 'info' }),

    success: async (title: string, message: string) =>
        notificationService.create(title, message, { type: 'success' }),

    warning: async (title: string, message: string) =>
        notificationService.create(title, message, { type: 'warning', priority: 'high' }),

    error: async (title: string, message: string) =>
        notificationService.create(title, message, { type: 'error', priority: 'urgent' }),

    announce: async (title: string, message: string, senderName: string) =>
        notificationService.create(title, message, {
            type: 'announcement',
            category: 'announcement',
            senderName
        }),

    /**
     * Broadcast to a specific role
     */
    broadcast: async (
        role: 'admin' | 'teacher' | 'student' | 'parent',
        title: string,
        message: string,
        options: { category?: NotificationCategory; priority?: NotificationPriority; senderName?: string } = {}
    ) => notificationService.create(title, message, {
        targetRole: role,
        type: 'announcement',
        ...options
    }),

    /**
     * Mark notification as read
     */
    markAsRead: async (id: string): Promise<boolean> => {
        // Update local state immediately
        const notification = notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            notification.read_at = new Date().toISOString();
            notificationService.notifyListeners();
        }

        const readLocal = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        if (!readLocal.includes(id)) {
            readLocal.push(id);
            if (readLocal.length > 1000) readLocal.splice(0, readLocal.length - 1000);
            localStorage.setItem('read_notifications', JSON.stringify(readLocal));
        }

        if (!supabase) return true;

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('id', id);

            return !error;
        } catch (e) {
            console.error('Failed to mark as read:', e);
            return false;
        }
    },

    /**
     * Mark all as read
     */
    markAllAsRead: async (): Promise<number> => {
        // Update local state
        const readLocal = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        notifications.forEach(n => {
            n.read = true;
            n.read_at = new Date().toISOString();
            if (!readLocal.includes(n.id)) readLocal.push(n.id);
        });
        if (readLocal.length > 1000) readLocal.splice(0, readLocal.length - 1000);
        localStorage.setItem('read_notifications', JSON.stringify(readLocal));
        
        notificationService.notifyListeners();

        if (!supabase) return notifications.length;

        try {
            const { data, error } = await supabase.rpc('mark_all_notifications_read');
            return error ? 0 : (data as number);
        } catch (e) {
            console.error('Failed to mark all as read:', e);
            return 0;
        }
    },

    /**
     * Dismiss notification
     */
    dismiss: async (id: string): Promise<boolean> => {
        notifications = notifications.filter(n => n.id !== id);
        notificationService.notifyListeners();

        const dismissedLocal = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
        if (!dismissedLocal.includes(id)) {
            dismissedLocal.push(id);
            if (dismissedLocal.length > 1000) dismissedLocal.splice(0, dismissedLocal.length - 1000);
            localStorage.setItem('dismissed_notifications', JSON.stringify(dismissedLocal));
        }

        if (!supabase) return true;

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ dismissed: true })
                .eq('id', id);

            return !error;
        } catch (e) {
            console.error('Failed to dismiss:', e);
            return false;
        }
    },

    /**
     * Clear all notifications
     */
    clear: async (): Promise<void> => {
        const ids = notifications.map(n => n.id);
        notifications = [];
        notificationService.notifyListeners();

        const dismissedLocal = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
        ids.forEach(id => {
            if (!dismissedLocal.includes(id)) dismissedLocal.push(id);
        });
        if (dismissedLocal.length > 1000) dismissedLocal.splice(0, dismissedLocal.length - 1000);
        localStorage.setItem('dismissed_notifications', JSON.stringify(dismissedLocal));

        if (!supabase || ids.length === 0) return;

        try {
            await supabase
                .from('notifications')
                .update({ dismissed: true })
                .in('id', ids);
        } catch (e) {
            console.error('Failed to clear:', e);
        }
    },

    /**
     * Legacy alias for dismiss
     */
    remove: (id: string) => notificationService.dismiss(id),

    /**
     * Get all notifications (from cache)
     */
    getAll: (): Notification[] => [...notifications],

    /**
     * Get unread count
     */
    getUnreadCount: (): number => notifications.filter(n => !n.read).length,

    /**
     * Get notifications by category
     */
    getByCategory: (category: NotificationCategory): Notification[] =>
        notifications.filter(n => n.category === category),

    /**
     * Get notifications by type
     */
    getByType: (type: NotificationType): Notification[] =>
        notifications.filter(n => n.type === type),

    /**
     * Get urgent notifications
     */
    getUrgent: (): Notification[] =>
        notifications.filter(n => n.priority === 'urgent' && !n.read),

    /**
     * Request push notification permission
     */
    requestPushPermission: async (): Promise<boolean> => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return false;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    },

    /**
     * Check push notification permission
     */
    getPushPermission: (): NotificationPermission | 'unsupported' => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission;
    },

    /**
     * Get notification preferences
     */
    getPreferences: async (): Promise<NotificationPreferences | null> => {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .single();

        if (error) return null;
        return data;
    },

    /**
     * Update notification preferences
     */
    updatePreferences: async (prefs: Partial<NotificationPreferences>): Promise<boolean> => {
        if (!supabase) return false;

        const { error } = await supabase
            .from('notification_preferences')
            .upsert({
                ...prefs,
                updated_at: new Date().toISOString()
            });

        return !error;
    },

    // Legacy compatibility - synchronous add (uses in-memory)
    add: (notification: Omit<Notification, 'id' | 'created_at' | 'read' | 'dismissed'>): Notification => {
        const newNotification: Notification = {
            ...notification,
            id: generateId(),
            created_at: new Date().toISOString(),
            read: false,
            dismissed: false,
            category: notification.category || 'system',
            priority: notification.priority || 'normal',
        };
        notifications.unshift(newNotification);
        notificationService.notifyListeners();

        // Also persist to database async
        if (supabase) {
            supabase.from('notifications').insert(newNotification).then(() => { });
        }

        return newNotification;
    },
};

// Auto-initialize when imported in browser
if (typeof window !== 'undefined') {
    // Delay init to allow Supabase to be ready
    setTimeout(() => {
        notificationService.init();
    }, 1000);
}

export default notificationService;

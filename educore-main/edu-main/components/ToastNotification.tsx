import React, { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, Info, AlertCircle, Megaphone, ExternalLink } from 'lucide-react';
import { notificationService, Notification, NotificationType } from '../services/notificationService';

interface ToastProps {
    notification: Notification;
    onDismiss: (id: string) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const Toast: React.FC<ToastProps> = ({ notification, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Auto-dismiss after 5 seconds (except urgent)
        if (notification.priority !== 'urgent') {
            const timer = setTimeout(() => {
                handleDismiss();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(notification.id), 300);
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'success': return <Check size={20} className="text-green-500" />;
            case 'warning': return <AlertTriangle size={20} className="text-amber-500" />;
            case 'error': return <AlertCircle size={20} className="text-red-500" />;
            case 'announcement': return <Megaphone size={20} className="text-purple-500" />;
            default: return <Info size={20} className="text-blue-500" />;
        }
    };

    const getBorderColor = (type: NotificationType) => {
        switch (type) {
            case 'success': return 'border-l-green-500';
            case 'warning': return 'border-l-amber-500';
            case 'error': return 'border-l-red-500';
            case 'announcement': return 'border-l-purple-500';
            default: return 'border-l-blue-500';
        }
    };

    return (
        <div
            className={`
                w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden
                border-l-4 ${getBorderColor(notification.type)}
                transform transition-all duration-300 ease-out
                ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
                animate-slide-in
            `}
        >
            <div className="p-4">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                            <p className="text-sm font-semibold text-slate-800 truncate pr-2">
                                {notification.title}
                            </p>
                            <button
                                onClick={handleDismiss}
                                className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {notification.message}
                        </p>
                        {notification.action_url && (
                            <a
                                href={notification.action_url}
                                className="inline-flex items-center mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                            >
                                {notification.action_label || 'View Details'}
                                <ExternalLink size={12} className="ml-1" />
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress bar for auto-dismiss */}
            {notification.priority !== 'urgent' && (
                <div className="h-1 bg-slate-100">
                    <div
                        className={`h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-shrink`}
                        style={{ animationDuration: '5s' }}
                    />
                </div>
            )}
        </div>
    );
};

interface ToastContainerProps {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    maxToasts?: number;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
    position = 'top-right',
    maxToasts = 5
}) => {
    const [toasts, setToasts] = useState<Notification[]>([]);
    const shownIds = React.useRef<Set<string>>(new Set());

    useEffect(() => {
        const unsubscribe = notificationService.subscribe((notifications) => {
            // Only show new notifications as toasts
            const newToasts = notifications.filter(n =>
                !n.read &&
                !shownIds.current.has(n.id) &&
                // Only show recent notifications (within last 10 seconds)
                new Date().getTime() - new Date(n.created_at).getTime() < 10000
            );

            newToasts.forEach(n => shownIds.current.add(n.id));

            if (newToasts.length > 0) {
                setToasts(prev => [...newToasts, ...prev].slice(0, maxToasts));
            }
        });

        return unsubscribe;
    }, [maxToasts]);

    const handleDismiss = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
        notificationService.markAsRead(id);
    };

    const positionClasses = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
    };

    if (toasts.length === 0) return null;

    return (
        <div className={`fixed ${positionClasses[position]} z-[9999] space-y-3`}>
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    notification={toast}
                    onDismiss={handleDismiss}
                    position={position}
                />
            ))}
        </div>
    );
};

// CSS animations - add to index.css
export const toastAnimationStyles = `
@keyframes slide-in {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes shrink {
    from {
        width: 100%;
    }
    to {
        width: 0%;
    }
}

.animate-slide-in {
    animation: slide-in 0.3s ease-out forwards;
}

.animate-shrink {
    animation: shrink linear forwards;
}
`;

export default ToastContainer;

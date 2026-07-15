import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'bg-red-100 text-red-600',
            confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
            border: 'border-red-200'
        },
        warning: {
            icon: 'bg-amber-100 text-amber-600',
            confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
            border: 'border-amber-200'
        },
        info: {
            icon: 'bg-blue-100 text-blue-600',
            confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
            border: 'border-blue-200'
        }
    };

    const style = variantStyles[variant];

    return (
        <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className={`relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden ${style.border} border-t sm:border`}>
                {/* Header */}
                <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.icon}`}>
                            <AlertTriangle size={20} />
                        </div>
                        <h3
                            id="confirm-dialog-title"
                            className="text-lg font-bold text-slate-800"
                        >
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 -m-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                        aria-label="Close dialog"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5">
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 p-4 sm:p-5 pt-0 sm:justify-end">
                    <button
                        onClick={onCancel}
                        className="w-full sm:w-auto px-4 py-3 sm:py-2.5 text-slate-600 font-medium rounded-xl sm:rounded-lg hover:bg-slate-100 transition-colors text-center"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`w-full sm:w-auto px-6 py-3 sm:py-2.5 font-semibold rounded-xl sm:rounded-lg transition-colors text-center min-h-[44px] ${style.confirmBtn}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;

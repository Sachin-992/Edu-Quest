/**
 * EDUCORE-OMEGA First-Login Password Reset Component
 * 
 * Forces users to reset their temporary password on first login.
 * Blocks access to dashboard until password is changed.
 */

import React, { useState } from 'react';
import { Lock, Shield, Loader2, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/authService';

interface PasswordResetProps {
    onComplete: () => void;
    userEmail: string;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({ onComplete, userEmail }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Password strength indicators
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

    const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber;

    const handleReset = async () => {
        if (!passwordsMatch) {
            setError('Passwords do not match');
            return;
        }

        if (!isPasswordStrong) {
            setError('Password does not meet strength requirements');
            return;
        }

        setIsLoading(true);
        setError(null);

        const result = await authService.resetPassword(newPassword);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                onComplete();
            }, 2000);
        } else {
            setError(result.error || 'Failed to reset password');
        }

        setIsLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Password Changed!</h2>
                    <p className="text-slate-600">Your password has been updated successfully.</p>
                    <p className="text-slate-500 mt-2">Redirecting to your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield size={32} className="text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Password Reset Required</h2>
                    <p className="text-slate-500 mt-2">
                        For security, you must create a new password before continuing.
                    </p>
                </div>

                {/* User Info */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                    <p className="text-xs text-slate-500">Logged in as</p>
                    <p className="font-medium text-slate-800">{userEmail}</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
                        <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {/* Form */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                placeholder="Enter new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${confirmPassword && !passwordsMatch ? 'border-red-300' : 'border-slate-300'
                                    }`}
                                placeholder="Confirm new password"
                            />
                        </div>
                        {confirmPassword && !passwordsMatch && (
                            <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                        )}
                    </div>

                    {/* Password Strength */}
                    <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-xs font-medium text-slate-600 mb-3">Password Requirements</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className={`flex items-center space-x-2 ${hasMinLength ? 'text-green-600' : 'text-slate-400'}`}>
                                <span>{hasMinLength ? '✓' : '○'}</span>
                                <span>8+ characters</span>
                            </div>
                            <div className={`flex items-center space-x-2 ${hasUppercase ? 'text-green-600' : 'text-slate-400'}`}>
                                <span>{hasUppercase ? '✓' : '○'}</span>
                                <span>Uppercase letter</span>
                            </div>
                            <div className={`flex items-center space-x-2 ${hasLowercase ? 'text-green-600' : 'text-slate-400'}`}>
                                <span>{hasLowercase ? '✓' : '○'}</span>
                                <span>Lowercase letter</span>
                            </div>
                            <div className={`flex items-center space-x-2 ${hasNumber ? 'text-green-600' : 'text-slate-400'}`}>
                                <span>{hasNumber ? '✓' : '○'}</span>
                                <span>Number</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleReset}
                        disabled={isLoading || !isPasswordStrong || !passwordsMatch}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading && <Loader2 size={20} className="animate-spin" />}
                        <span>{isLoading ? 'Updating...' : 'Set New Password'}</span>
                    </button>
                </div>

                {/* Security Note */}
                <div className="mt-6 text-center text-xs text-slate-500">
                    <p>🔒 Your password is encrypted and secure.</p>
                    <p className="mt-1">This action is logged for security purposes.</p>
                </div>
            </div>
        </div>
    );
};

export default PasswordReset;

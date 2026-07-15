import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, Shield, AlertCircle, GraduationCap, Briefcase, Users, Building2, ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserRole } from '../types';

interface LoginScreenProps {
    onLogin: (userId: string, password: string, expectedRole: UserRole) => void;
    isLoading?: boolean;
    error?: string | null;
}

type LoginPortal = 'select' | 'student' | 'teacher' | 'parent' | 'admin';

const PORTAL_CONFIG: Record<Exclude<LoginPortal, 'select'>, {
    role: UserRole;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    bgGradient: string;
    demoCredentials: { id: string; password: string };
}> = {
    student: {
        role: UserRole.STUDENT,
        title: 'Student Portal',
        subtitle: 'Access your attendance, marks, and resources',
        icon: <GraduationCap size={32} />,
        color: 'blue',
        bgGradient: 'from-blue-500 to-cyan-600',
        demoCredentials: { id: 'student', password: 'demo' }
    },
    teacher: {
        role: UserRole.TEACHER,
        title: 'Teacher Portal',
        subtitle: 'Manage classes, attendance, and grades',
        icon: <Briefcase size={32} />,
        color: 'emerald',
        bgGradient: 'from-emerald-500 to-teal-600',
        demoCredentials: { id: 'teacher', password: 'demo' }
    },
    parent: {
        role: UserRole.PARENT,
        title: 'Parent Portal',
        subtitle: "View your child's academic progress",
        icon: <Users size={32} />,
        color: 'purple',
        bgGradient: 'from-purple-500 to-pink-600',
        demoCredentials: { id: 'parent', password: 'demo' }
    },
    admin: {
        role: UserRole.ADMIN,
        title: 'Admin Portal',
        subtitle: 'Full institutional governance access',
        icon: <Building2 size={32} />,
        color: 'slate',
        bgGradient: 'from-slate-700 to-slate-900',
        demoCredentials: { id: 'admin', password: 'demo' }
    }
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoading = false, error = null }) => {
    const { t, i18n } = useTranslation();
    const isTamil = i18n.language?.startsWith('ta');
    const [selectedPortal, setSelectedPortal] = useState<LoginPortal>('select');
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const getPortalTitle = (p: Exclude<LoginPortal, 'select'>) => {
        if (p === 'student') return t('dashboard.student');
        if (p === 'teacher') return t('dashboard.teacher');
        if (p === 'parent') return t('dashboard.parent');
        if (p === 'admin') return t('dashboard.admin');
        return '';
    };

    const getPortalSubtitle = (p: Exclude<LoginPortal, 'select'>) => {
        if (p === 'student') return isTamil ? 'வருகை, மதிப்பெண்கள் மற்றும் பாடப் பொருட்களைப் பெறவும்' : 'Access your attendance, marks, and resources';
        if (p === 'teacher') return isTamil ? 'வகுப்புகள், வருகை மற்றும் தரங்களை நிர்வகிக்கவும்' : 'Manage classes, attendance, and grades';
        if (p === 'parent') return isTamil ? 'உங்கள் குழந்தையின் கல்வி முன்னேற்றத்தைக் காணவும்' : "View your child's academic progress";
        if (p === 'admin') return isTamil ? 'முழு பள்ளி நிர்வாக அணுகல்' : 'Full institutional governance access';
        return '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userId.trim() && password.trim() && selectedPortal !== 'select') {
            const config = PORTAL_CONFIG[selectedPortal];
            onLogin(userId.trim(), password.trim(), config.role);
        }
    };

    const handleBack = () => {
        setSelectedPortal('select');
        setUserId('');
        setPassword('');
    };

    // ════════════════════════════════════════════════════════════════
    // PORTAL SELECTION SCREEN (Four Distinct Login Options)
    // ════════════════════════════════════════════════════════════════
    if (selectedPortal === 'select') {
        return (
            <div 
                className="min-h-dvh flex flex-col items-center justify-center p-4 relative bg-cover bg-center bg-fixed"
                style={{ backgroundImage: `linear-gradient(to bottom right, rgba(79, 70, 229, 0.85), rgba(147, 51, 234, 0.85), rgba(55, 48, 163, 0.95)), url('/hero-bg.png')` }}
            >
                {/* Language selector in top right */}
                <div className="absolute top-4 right-4">
                    <LanguageSwitcher />
                </div>
                
                <div className="w-full max-w-4xl px-4 mt-12">
                    {/* Logo & Header */}
                    <div className="text-center mb-6 md:mb-10">
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-2xl md:rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-4 md:mb-6 transform hover:scale-105 transition-transform">
                            <span className="text-3xl md:text-5xl font-bold text-indigo-600">Ω</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3">EDUCORE-OMEGA</h1>
                        <p className="text-indigo-200 text-sm md:text-lg">
                            {isTamil ? 'அடையாள-நிர்வகிக்கப்பட்ட கல்வி இயக்க முறைமை' : 'Identity-Governed Education Operating System'}
                        </p>
                    </div>

                    {/* Four Portal Options */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                        {(Object.keys(PORTAL_CONFIG) as Array<Exclude<LoginPortal, 'select'>>).map(portal => {
                            const config = PORTAL_CONFIG[portal];
                            return (
                                <button
                                    key={portal}
                                    onClick={() => setSelectedPortal(portal)}
                                    className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 group min-h-[120px] sm:min-h-[140px]"
                                >
                                    <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${config.bgGradient} rounded-xl flex items-center justify-center text-white mx-auto mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                        <span className="[&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-8 sm:[&>svg]:h-8">{config.icon}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-center text-sm sm:text-base mb-1 text-clamp-1">{getPortalTitle(portal).replace(isTamil ? ' போர்டல்' : ' Portal', '')}</h3>
                                    <p className="text-xs text-slate-500 text-center">{t('auth.login')}</p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Security Notice */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 max-w-xl mx-auto">
                        <div className="flex items-center justify-center space-x-3 text-white">
                            <Shield size={20} className="text-emerald-400" />
                            <span className="text-sm">
                                {isTamil 
                                  ? 'ஒவ்வொரு போர்ட்டலுக்கும் தனித்துவமான நற்சான்றிதழ்கள் தேவை. குறுக்கு-பங்கு அணுகல் தடுக்கப்பட்டுள்ளது.'
                                  : 'Each portal requires role-specific credentials. Cross-role access is blocked.'}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-indigo-300 text-xs">
                            Protected under DPDPA, GDPR, FERPA, COPPA • Government-Ready Infrastructure
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════
    // ROLE-SPECIFIC LOGIN FORM
    // ════════════════════════════════════════════════════════════════
    const config = PORTAL_CONFIG[selectedPortal];

    // For individual portals, we extract the gradient colors or use a dark semi-transparent overlay
    const portalOverlay = selectedPortal === 'student' ? 'rgba(59, 130, 246, 0.85), rgba(8, 145, 178, 0.9)' :
                          selectedPortal === 'teacher' ? 'rgba(16, 185, 129, 0.85), rgba(13, 148, 136, 0.9)' :
                          selectedPortal === 'parent' ? 'rgba(168, 85, 247, 0.85), rgba(219, 39, 119, 0.9)' :
                          'rgba(51, 65, 85, 0.85), rgba(15, 23, 42, 0.95)';

    return (
        <div 
            className="min-h-dvh flex flex-col items-center justify-center p-4 relative bg-cover bg-center bg-fixed"
            style={{ backgroundImage: `linear-gradient(to bottom right, ${portalOverlay}), url('/hero-bg.png')` }}
        >
            {/* Language selector in top right */}
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>

            <div className="w-full max-w-md mt-12">
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className="mb-6 flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>{isTamil ? 'போர்ட்டல் தேர்விற்குச் செல்லவும்' : 'Back to Portal Selection'}</span>
                </button>

                {/* Portal Logo */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-2xl mb-4">
                        <div className={`text-${config.color}-600`}>
                            {config.icon}
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{getPortalTitle(selectedPortal)}</h1>
                    <p className="text-white/80">{getPortalSubtitle(selectedPortal)}</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="flex items-center justify-center space-x-2 mb-6">
                        <div className={`w-3 h-3 rounded-full bg-${config.color}-500`}></div>
                        <span className="text-sm font-medium text-slate-600">
                            {getPortalTitle(selectedPortal)} {isTamil ? 'அங்கீகாரம்' : 'Authentication'}
                        </span>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700 text-sm">
                            <AlertCircle size={18} />
                            <span>{error === 'Invalid credentials.' ? t('auth.errorInvalidCredentials') : error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {selectedPortal === 'student' ? (isTamil ? 'வரிசை எண் (Roll Number)' : 'Roll Number') :
                                    selectedPortal === 'teacher' ? (isTamil ? 'ஆசிரியர் ஐடி / மின்னஞ்சல்' : 'Teacher ID / Email') :
                                        selectedPortal === 'parent' ? (isTamil ? 'பெற்றோர் ஐடி / தொலைபேசி' : 'Parent ID / Phone') :
                                            (isTamil ? 'நிர்வாகி ஐடி / மின்னஞ்சல்' : 'Admin ID / Email')}
                            </label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder={selectedPortal === 'student' ? 'e.g. STU001' : (isTamil ? 'உங்கள் நற்சான்றிதழ்களை உள்ளிடவும்' : `Enter your ${selectedPortal} credentials`)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {selectedPortal === 'student' ? (isTamil ? 'பின் எண் (PIN)' : 'PIN') : t('auth.password')}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={selectedPortal === 'student' ? (isTamil ? 'உங்கள் பின் எண்ணை உள்ளிடவும்' : 'Enter your PIN') : t('auth.passwordPlaceholder')}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pr-12"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!userId.trim() || !password.trim() || isLoading}
                            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${userId.trim() && password.trim() && !isLoading
                                ? `bg-gradient-to-r ${config.bgGradient} text-white hover:opacity-90 shadow-lg`
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    <span>{t('auth.signIn')} - {getPortalTitle(selectedPortal)}</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Portal-Specific Notice */}
                <div className="mt-6 text-center">
                    <div className="flex items-center justify-center space-x-2 text-white/80 text-sm">
                        <Shield size={16} />
                        <span>
                            {selectedPortal === 'student' ? (isTamil ? 'படிப்பு சார்ந்த வாசிப்பு மட்டுமே' : 'Read-only academic access') :
                                selectedPortal === 'teacher' ? (isTamil ? 'வகுப்பு மேலாண்மை அணுகல்' : 'Class management access') :
                                    selectedPortal === 'parent' ? (isTamil ? 'குழந்தைக்கான வெளிப்படைத்தன்மை அணுகல்' : 'Child transparency access') :
                                        (isTamil ? 'முழு பள்ளி நிர்வாக அணுகல்' : 'Full governance access')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;

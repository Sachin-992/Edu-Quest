import React, { useState } from 'react';
import {
    Users,
    BookOpen,
    Shield,
    Activity,
    Database,
    Settings,
    LogOut,
    Building,
    GraduationCap,
    Briefcase,
    CreditCard,
    BarChart3,
    FileCheck,
    Users2,
    ShieldCheck,
    Calendar,
    Bell,
    Menu,
    X,
    Key,
    MessageSquare
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import NotificationCenter from '../NotificationCenter';
import ThemeToggle from '../ThemeToggle';
import LanguageSwitcher from '../LanguageSwitcher';
import { supabase } from '../../services/supabaseClient';

type AdminTab = 'overview' | 'school' | 'students' | 'teachers' | 'assignments' | 'exams' | 'timetable' | 'parents' | 'finance' | 'analytics' | 'audit' | 'users' | 'notifications' | 'feedback' | 'attendance' | 'results_publishing' | 'eduquest';

interface SidebarContentProps {
    activeTab: AdminTab;
    onTabChange: (tab: AdminTab) => void;
    setSidebarOpen: (open: boolean) => void;
    userName: string;
    onLogout: () => void;
    setShowPasswordModal: (show: boolean) => void;
    menuItems: { id: AdminTab; label: string; icon: React.ReactNode; description: string }[];
    t: any;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
    activeTab,
    onTabChange,
    setSidebarOpen,
    userName,
    onLogout,
    setShowPasswordModal,
    menuItems,
    t
}) => {
    const handleTabChange = async (tab: AdminTab) => {
        if (tab === 'eduquest') {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            const eduQuestBase = import.meta.env.VITE_EDUQUEST_URL || 
                (window.location.origin.includes('localhost:') || window.location.origin.includes('127.0.0.1:') 
                    ? window.location.origin.replace(/:\d+$/, ':8080') 
                    : `${window.location.origin}/quest`);
            
            if (session) {
                const url = `${eduQuestBase}/admin/login?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`;
                window.open(url, '_blank');
            } else {
                window.open(`${eduQuestBase}/admin/login`, '_blank');
            }
            return;
        }
        onTabChange(tab);
        setSidebarOpen(false); // Close sidebar on mobile after selection
    };

    return (
        <>
            <div className="p-4 lg:p-6 border-b border-slate-700/50">
                <div className="flex items-center space-x-3 text-indigo-400 mb-1">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <Database size={22} />
                    </div>
                    <div>
                        <span className="font-bold text-lg tracking-wide">OMEGA CORE</span>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t('common.superAdmin')}</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 py-4 overflow-y-auto">
                <p className="px-4 lg:px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t('common.modules')}</p>
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 lg:px-6 py-3 transition-all duration-200 border-l-4 ${activeTab === item.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'border-transparent text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                    >
                        <span className={`${activeTab === item.id ? 'text-indigo-400' : ''}`}>{item.icon}</span>
                        <div className="text-left">
                            <span className="font-medium text-sm block">{item.label}</span>
                            <span className="text-[10px] text-slate-500 hidden lg:block">{item.description}</span>
                        </div>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-700/50">
                <div className="flex items-center space-x-3 mb-4 bg-slate-700/30 p-3 rounded-lg">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">{userName}</p>
                        <p className="text-[10px] text-indigo-400">{t('common.superAdmin')}</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="flex-1 flex items-center justify-center space-x-2 bg-amber-900/20 text-amber-400 hover:bg-amber-900/40 p-3 rounded-lg transition-colors border border-amber-900/30"
                        title={t('auth.changeAdminPassword')}
                    >
                        <Key size={16} />
                    </button>
                    <button
                        onClick={onLogout}
                        className="flex-1 flex items-center justify-center space-x-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 p-3 rounded-lg transition-colors border border-red-900/30"
                    >
                        <LogOut size={16} />
                        <span className="text-sm font-semibold">{t('common.logout')}</span>
                    </button>
                </div>
            </div>
        </>
    );
};

interface AdminLayoutProps {
    children: React.ReactNode;
    activeTab: AdminTab;
    onTabChange: (tab: AdminTab) => void;
    onLogout: () => void;
    userName: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
    children,
    activeTab,
    onTabChange,
    onLogout,
    userName
}) => {
    const { t, i18n } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Password change state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setPasswordError(t('auth.errorPasswordMismatch'));
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError(t('auth.errorPasswordLength'));
            return;
        }
        try {
            const { error } = await supabase!.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setShowPasswordModal(false);
            setNewPassword('');
            setConfirmPassword('');
            setPasswordSuccess(t('auth.passwordChangedSuccess'));
            setTimeout(() => setPasswordSuccess(''), 3000);
        } catch (err: any) {
            setPasswordError(err.message || t('messages.errorSaving'));
        }
    };

    const menuItems: { id: AdminTab; label: string; icon: React.ReactNode; description: string }[] = [
        { id: 'overview', label: t('dashboard.overview'), icon: <Activity size={20} />, description: t('dashboard.systemOverview') },
        { id: 'users', label: t('dashboard.userMgmt'), icon: <Users size={20} />, description: t('dashboard.identityAccess') },
        { id: 'school', label: t('dashboard.schoolStructure'), icon: <Building size={20} />, description: t('dashboard.classesSectionsSubjects') },
        { id: 'students', label: t('dashboard.studentProfiles'), icon: <GraduationCap size={20} />, description: t('dashboard.enrollmentRecords') },
        { id: 'teachers', label: t('dashboard.teacherMgmt'), icon: <Briefcase size={20} />, description: t('dashboard.staffAssignments') },
        { id: 'assignments', label: t('dashboard.classAssignments'), icon: <ShieldCheck size={20} />, description: t('dashboard.classTeacherGovernance') },
        { id: 'exams', label: t('dashboard.examinations'), icon: <FileCheck size={20} />, description: t('dashboard.scheduleResults') },
        { id: 'results_publishing', label: t('examManagement.publishing', 'Result Publishing'), icon: <FileCheck size={20} />, description: t('examManagement.resultPublishingSub', 'Approve & publish results') },
        { id: 'timetable', label: t('dashboard.timetableMgmt'), icon: <Calendar size={20} />, description: t('dashboard.scheduleManagement') },
        { id: 'parents', label: t('dashboard.parentMgmt'), icon: <Users2 size={20} />, description: t('dashboard.guardianAccountsLinks') },
        { id: 'finance', label: t('dashboard.financeFees'), icon: <CreditCard size={20} />, description: t('dashboard.paymentsDues') },
        { id: 'analytics', label: t('dashboard.analytics'), icon: <BarChart3 size={20} />, description: t('dashboard.reportsInsights') },
        { id: 'attendance', label: t('dashboard.attendanceIntel'), icon: <Calendar size={20} />, description: t('dashboard.attendanceIntelDesc') },
        { id: 'audit', label: t('dashboard.auditCompliance'), icon: <FileCheck size={20} />, description: t('dashboard.logsGovernance') },
        { id: 'notifications', label: t('dashboard.alertsNotices'), icon: <Bell size={20} />, description: t('dashboard.sendNotifications') },
        { id: 'feedback', label: t('dashboard.feedback'), icon: <MessageSquare size={20} />, description: t('dashboard.studentParentFeedback') },
        { id: 'eduquest', label: 'EduQuest Admin', icon: <GraduationCap size={20} />, description: 'EduQuest Gamification Admin' },
    ];

    return (
        <div className="flex h-dvh overflow-hidden bg-slate-100 font-sans">
            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Mobile (Fixed Overlay) */}
            <aside className={`fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-2xl z-50 transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X size={24} />
                </button>
                <SidebarContent activeTab={activeTab} onTabChange={onTabChange} setSidebarOpen={setSidebarOpen} userName={userName} onLogout={onLogout} setShowPasswordModal={setShowPasswordModal} menuItems={menuItems} t={t} />
            </aside>

            {/* Sidebar - Desktop (Static) */}
            <aside className="hidden lg:flex w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex-col shadow-2xl">
                <SidebarContent activeTab={activeTab} onTabChange={onTabChange} setSidebarOpen={setSidebarOpen} userName={userName} onLogout={onLogout} setShowPasswordModal={setShowPasswordModal} menuItems={menuItems} t={t} />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto bg-slate-50">
                <header className="bg-white px-4 lg:px-8 py-4 lg:py-5 border-b border-slate-200 shadow-sm flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center space-x-3">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">
                                {menuItems.find(i => i.id === activeTab)?.label}
                            </h1>
                            <p className="text-xs lg:text-sm text-slate-500 mt-0.5 lg:mt-1 hidden sm:block">
                                {menuItems.find(i => i.id === activeTab)?.description} — EDUCORE-OMEGA
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 lg:space-x-4">
                        <LanguageSwitcher />
                        <ThemeToggle />
                        <NotificationCenter />
                        <div className="hidden md:block bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase border border-green-100">
                            ● {t('overviewDashboard.online')}
                        </div>
                        <div className="hidden lg:block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                            {new Date().toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                </header>

                <div className="p-4 lg:p-8">
                    {children}
                </div>
            </main>

            {/* Password Success Message */}
            {passwordSuccess && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
                    {passwordSuccess}
                </div>
            )}

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                            <Key className="mr-2 text-amber-600" />
                            {t('auth.changeAdminPassword')}
                        </h3>
                        <div className="space-y-4">
                            {passwordError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                                    {passwordError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.newPassword')}</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => { setNewPassword(e.target.value); setPasswordError(''); }}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder={t('auth.passwordPlaceholder')}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.confirmPassword')}</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder={t('auth.confirmPassword')}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => { setShowPasswordModal(false); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleChangePassword}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                {t('auth.updatePassword')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export type { AdminTab };

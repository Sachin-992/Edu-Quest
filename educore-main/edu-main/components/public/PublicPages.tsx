import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { 
    BookOpen, 
    Calendar, 
    Clock, 
    CreditCard, 
    CheckCircle, 
    Award, 
    MessageSquare, 
    Globe, 
    Phone, 
    Mail, 
    MapPin, 
    ArrowRight, 
    ShieldCheck, 
    Zap,
    Users,
    ChevronRight,
    HelpCircle,
    UserCheck,
    BarChart3,
    Menu,
    X
} from 'lucide-react';

interface PublicHeaderProps {
    currentPath: string;
    onNavigate: (path: string) => void;
    isAuthenticated: boolean;
    onGoToDashboard: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
    currentPath,
    onNavigate,
    isAuthenticated,
    onGoToDashboard
}) => {
    const { t, i18n } = useTranslation();
    const isTamil = i18n.language?.startsWith('ta');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleLanguage = () => {
        const nextLang = i18n.language === 'ta' ? 'en' : 'ta';
        i18n.changeLanguage(nextLang);
        localStorage.setItem('educore_language', nextLang);
        
        // Update URL path language prefix
        const cleanPath = currentPath.replace(/^\/(en|ta)/, '');
        onNavigate(`/${nextLang}${cleanPath === '' ? '/' : cleanPath}`);
    };

    const getLangPrefix = () => `/${i18n.language}`;

    const navItems = [
        { label: t('publicHeader.home', 'Home'), path: '' },
        { label: t('publicHeader.features', 'Features'), path: '/features' },
        { label: t('publicHeader.about', 'About Us'), path: '/about' },
        { label: t('publicHeader.contact', 'Contact'), path: '/contact' },
    ];

    const cleanPath = currentPath.replace(/^\/(en|ta)/, '');
    const activeSubPath = cleanPath === '' ? '' : cleanPath;

    return (
        <header className="sticky top-0 bg-[#0a0e27]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 md:px-8 md:py-4 flex items-center justify-between z-50">
            {/* Logo */}
            <div className="flex items-center space-x-2 md:space-x-3 cursor-pointer flex-shrink-0" onClick={() => onNavigate(`${getLangPrefix()}/`)}>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/60">
                    <span className="text-white font-bold text-base md:text-xl tracking-tighter">Ω</span>
                </div>
                <div>
                    <h1 className="font-bold text-sm md:text-lg text-white tracking-tight font-poppins leading-tight">EDUCORE-OMEGA</h1>
                    <p className="text-[8px] md:text-[10px] text-indigo-400 font-semibold uppercase tracking-wider hidden sm:block">School Intelligence OS</p>
                </div>
            </div>

            {/* Desktop Nav - centered */}
            <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 -translate-x-1/2">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => onNavigate(`${getLangPrefix()}${item.path}`)}
                        className={`text-sm font-medium transition-colors relative group ${
                            activeSubPath === item.path 
                                ? 'text-white font-semibold' 
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {item.label}
                        {activeSubPath === item.path && (
                            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                        )}
                    </button>
                ))}
            </nav>

            {/* Right: Language + Sign In */}
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
                <button
                    onClick={toggleLanguage}
                    className="flex items-center space-x-1.5 px-2 py-1.5 md:px-3 md:py-2 text-slate-300 hover:text-white rounded-lg text-xs md:text-sm font-medium transition-colors border border-white/10 hover:border-white/30 bg-white/5"
                    title="Switch Language"
                >
                    <Globe size={13} className="text-slate-400" />
                    <span className="hidden sm:inline">{isTamil ? 'English' : 'தமிழ்'}</span>
                    <span className="sm:hidden">{isTamil ? 'EN' : 'தமிழ்'}</span>
                </button>

                {isAuthenticated ? (
                    <button
                        onClick={onGoToDashboard}
                        className="flex items-center space-x-1.5 px-3 py-1.5 md:px-5 md:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs md:text-sm font-semibold shadow-lg shadow-indigo-900/40 transition-all"
                    >
                        <span className="hidden sm:inline">{t('publicHeader.dashboard', 'Dashboard')}</span>
                        <span className="sm:hidden">Dash</span>
                        <ArrowRight size={13} />
                    </button>
                ) : (
                    <button
                        onClick={() => onNavigate(`${getLangPrefix()}/login`)}
                        className="px-3 py-1.5 md:px-5 md:py-2 border border-indigo-500/70 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-lg transition-all text-xs md:text-sm font-semibold whitespace-nowrap"
                    >
                        {t('publicHeader.login', 'Sign In')}
                    </button>
                )}
            </div>
            {/* Mobile Nav Toggle */}
            <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden ml-2 p-2 text-slate-300 hover:text-white rounded-lg bg-white/5 border border-white/10"
            >
                <Menu size={18} />
            </button>

            {/* Mobile Nav Sidebar */}
            {isMobileMenuOpen && createPortal(
                <div className="fixed inset-0 z-[9999] md:hidden">
                    <div 
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-0 bottom-0 w-64 bg-[#0a0e27] border-l border-white/10 p-6 flex flex-col shadow-2xl transition-transform duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-white font-bold text-sm tracking-widest uppercase">Menu</span>
                            <button 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 text-slate-400 hover:text-white rounded-lg bg-white/5 border border-white/10"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <nav className="flex flex-col space-y-4">
                            {navItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                        onNavigate(`${getLangPrefix()}${item.path}`);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`text-left text-sm font-medium transition-colors py-2 border-b border-white/5 ${
                                        activeSubPath === item.path 
                                            ? 'text-indigo-400 font-semibold border-indigo-500/30' 
                                            : 'text-slate-300 hover:text-white'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                        <div className="mt-auto pt-6 border-t border-white/10">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => {
                                        onGoToDashboard();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all"
                                >
                                    <span>{t('publicHeader.dashboard', 'Dashboard')}</span>
                                    <ArrowRight size={14} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        onNavigate(`${getLangPrefix()}/login`);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full py-3 border border-indigo-500/70 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-xl transition-all text-sm font-semibold"
                                >
                                    {t('publicHeader.login', 'Sign In')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </header>
    );
};

export const PublicFooter: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
    return null;
};

export { PublicHome } from './PublicHome';

export const PublicFeatures: React.FC = () => {
    const { t } = useTranslation();

    const features = [
        { icon: <UserCheck size={20} />, title: t('publicFeatures.attendance', 'Multi-Level Attendance'), desc: t('publicFeatures.attendanceDesc', 'Includes 10 attendance statuses, bulk recording, copy-yesterday shortcuts, risk logs, and automated alerts for students with low attendance rate.') },
        { icon: <CreditCard size={20} />, title: t('publicFeatures.finance', 'Fee Management & Invoicing'), desc: t('publicFeatures.financeDesc', 'Automates student invoicing, accepts secure online Razorpay payment collections, tracks cash receipt ledgers, and logs full transaction histories.') },
        { icon: <Calendar size={20} />, title: t('publicFeatures.timetable', 'Dynamic Timetables'), desc: t('publicFeatures.timetableDesc', 'Timetable builders supporting custom periods, subjects, assigned teacher lookup, physical activity slots, and published schedule integration.') },
        { icon: <Award size={20} />, title: t('publicFeatures.exams', 'Examinations & Grades'), desc: t('publicFeatures.examsDesc', 'Create examinations, log subject marks, compute grade cards, rank students, lock/publish results, and analyze class averages instantly.') },
        { icon: <Users size={20} />, title: t('publicFeatures.portals', 'Dedicated Portal Access'), desc: t('publicFeatures.portalsDesc', 'Integrated distinct layout views customized for Administrators, Teachers, Students, and Parents keeping everyone aligned.') },
        { icon: <ShieldCheck size={20} />, title: t('publicFeatures.security', 'Role-Based Access Control'), desc: t('publicFeatures.securityDesc', 'Robust identity management with custom schema security constraints, password strength policies, audit logging, and Supabase RLS security.') }
    ];

    return (
        <div className="py-20 px-6 max-w-5xl mx-auto relative min-h-[calc(100vh-60px)]">
            {/* Ambient glow backgrounds */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="text-center space-y-4 mb-20 relative z-10">
                <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 bg-indigo-900/40 border border-indigo-500/20 text-indigo-300 text-xs font-black rounded-full uppercase tracking-widest">
                    <Zap size={10} className="text-amber-400" />
                    <span>{t('publicFeatures.badge', 'Enterprise Capabilities')}</span>
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-200 tracking-tight font-poppins">{t('publicFeatures.title', 'Complete Features List')}</h1>
                <p className="text-slate-400 max-w-xl mx-auto leading-relaxed text-sm sm:text-base font-open">{t('publicFeatures.desc', 'Discover how EDUCORE-OMEGA can modernize your educational governance and student success tracking.')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {features.map((f, i) => (
                    <div key={i} className="flex gap-4 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-indigo-500/30 transition-all hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(99,102,241,0.08)] shadow-md group duration-300">
                        <div className="w-11 h-11 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            {f.icon}
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-extrabold text-lg text-white font-poppins">{f.title}</h3>
                          <p className="text-xs text-slate-400 leading-relaxed font-open font-semibold">{f.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PublicAbout: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="py-20 px-6 max-w-4xl mx-auto space-y-16 relative min-h-[calc(100vh-60px)]">
            {/* Ambient glow backgrounds */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="text-center space-y-4 relative z-10">
                <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 bg-indigo-900/40 border border-indigo-500/20 text-indigo-300 text-xs font-black rounded-full uppercase tracking-widest">
                    <Users size={10} className="text-amber-400" />
                    <span>{t('publicAbout.badge', 'Who We Are')}</span>
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-200 tracking-tight font-poppins">{t('publicAbout.title', 'Our Mission & Vision')}</h1>
            </div>

            <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800 shadow-2xl space-y-6 text-slate-300 leading-relaxed relative z-10 backdrop-blur-md">
                <h2 className="text-2xl font-bold text-white font-poppins">{t('publicAbout.sec1Title', 'Bridging Technology and Academic Governance')}</h2>
                <p className="font-open font-semibold text-sm sm:text-base text-slate-400">
                    {t('publicAbout.sec1Text', 'Founded with the mission to modernize institutional operations, EDUCORE-OMEGA is built to provide an educational operating system that keeps teachers, student records, finance ledgers, and parents coordinated.')}
                </p>
                <p className="font-open font-semibold text-sm sm:text-base text-slate-400">
                    {t('publicAbout.sec1Text2', 'We believe that modern educational institutions deserve custom tools that are secure, localized in local languages, and highly performant on both mobile and desktop views.')}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-800/80">
                    <div className="space-y-2">
                        <h3 className="font-bold text-white text-lg flex items-center"><Zap size={18} className="text-amber-500 mr-2" /> {t('publicAbout.vision', 'Our Vision')}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-semibold font-open">
                            {t('publicAbout.visionDesc', 'To empower every academic institution with data-driven workflows, ensuring student success and governance transparency.')}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-bold text-white text-lg flex items-center"><ShieldCheck size={18} className="text-emerald-500 mr-2" /> {t('publicAbout.governance', 'Our Commitment')}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-semibold font-open">
                            {t('publicAbout.governanceDesc', 'Enterprise-grade security, fully adhering to Supabase Row Level Security standards, data privacy protection, and zero compliance compromise.')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PublicContact: React.FC = () => {
    const { t } = useTranslation();
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="py-20 px-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 relative min-h-[calc(100vh-60px)] items-center">
            {/* Ambient glow backgrounds */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[130px]" />
            </div>

            <div className="space-y-8 relative z-10">
                <div className="space-y-4">
                    <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 bg-indigo-900/40 border border-indigo-500/20 text-indigo-300 text-xs font-black rounded-full uppercase tracking-widest">
                        <Phone size={10} className="text-amber-400" />
                        <span>{t('publicContact.badge', 'Reach Out')}</span>
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-200 tracking-tight font-poppins">{t('publicContact.title', 'Contact Support & Sales')}</h1>
                    <p className="text-slate-400 leading-relaxed font-open font-semibold text-sm sm:text-base">
                        {t('publicContact.desc', 'Want a custom demo for your school district, or need onboarding assistance? Drop us a message, and our team will get in touch with you shortly.')}
                    </p>
                </div>

                <div className="space-y-4 text-slate-300 text-xs sm:text-sm font-semibold font-open">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                            <Mail size={16} />
                        </div>
                        <span>info@scrollkurai.in</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                            <Phone size={16} />
                        </div>
                        <span>+91 9042315859</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                            <MapPin size={16} />
                        </div>
                        <span>Madurai, Tamil Nadu, India</span>
                    </div>
                </div>
            </div>

            <div className="bg-[#0a0f26] border border-indigo-500/20 shadow-2xl p-6 sm:p-8 rounded-[2rem] relative z-10 backdrop-blur-md">
                {submitted ? (
                    <div className="text-center py-12 space-y-4 animate-scale-in">
                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="font-extrabold text-xl text-white font-poppins">{t('publicContact.successTitle', 'Message Sent Successfully!')}</h3>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed font-open font-semibold">
                            {t('publicContact.successDesc', 'Thank you for reaching out. A platform architect will reply to your registered email shortly.')}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{t('publicContact.nameLabel', 'Full Name')}</label>
                            <input
                                required
                                type="text"
                                placeholder={t('publicContact.namePlaceholder', 'e.g. Anand Kumar')}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{t('publicContact.emailLabel', 'Email Address')}</label>
                            <input
                                required
                                type="email"
                                placeholder={t('publicContact.emailPlaceholder', 'anand@school.edu')}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{t('publicContact.messageLabel', 'Your Message')}</label>
                            <textarea
                                required
                                rows={4}
                                placeholder={t('publicContact.messagePlaceholder', 'Describe your requirements or questions...')}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/40 hover:shadow-indigo-500/20"
                        >
                            {t('publicContact.submit', 'Send Inquiry')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

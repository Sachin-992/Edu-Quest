import React from 'react';
import { Home, Search, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const NotFound: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'en';
    const isTa = currentLang.startsWith('ta');

    return (
        <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
            
            <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
                {/* 404 Header */}
                <div className="space-y-4">
                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                            <AlertTriangle size={48} className="text-red-400" />
                        </div>
                    </div>
                    <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 font-poppins tracking-tighter">
                        404
                    </h1>
                    <h2 className="text-2xl md:text-4xl font-bold text-white font-poppins">
                        {isTa ? 'பக்கம் கிடைக்கவில்லை' : 'Page Not Found'}
                    </h2>
                    <p className="text-slate-400 max-w-lg mx-auto font-open text-sm md:text-base leading-relaxed">
                        {isTa 
                            ? 'நீங்கள் தேடும் பக்கம் நீக்கப்பட்டிருக்கலாம், அதன் பெயர் மாற்றப்பட்டிருக்கலாம் அல்லது தற்காலிகமாக கிடைக்காமல் இருக்கலாம்.' 
                            : 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.'}
                    </p>
                </div>

                {/* Search Bar Mockup */}
                <div className="max-w-md mx-auto relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder={isTa ? 'EDUCORE-OMEGA-வில் தேடுக...' : 'Search EDUCORE-OMEGA...'}
                        className="w-full bg-slate-900/50 border border-slate-800 focus:border-indigo-500/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 outline-none transition-all shadow-inner backdrop-blur-sm"
                        readOnly // Mock functionality for visual completion
                    />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button
                        onClick={() => onNavigate ? onNavigate(`/${isTa ? 'ta' : 'en'}`) : window.location.href = `/${isTa ? 'ta' : 'en'}`}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-95"
                    >
                        <Home size={18} />
                        <span>{isTa ? 'முகப்புப்பக்கத்திற்குச் செல்' : 'Go to Homepage'}</span>
                    </button>
                    <button
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-xl font-bold transition-all active:scale-95"
                    >
                        {isTa ? 'திரும்பச் செல்' : 'Go Back'}
                    </button>
                </div>

                {/* Helpful Links */}
                <div className="pt-12 border-t border-slate-800/60 flex flex-wrap justify-center gap-4 sm:gap-8 text-sm font-semibold">
                    <button onClick={() => onNavigate ? onNavigate(`/${isTa ? 'ta' : 'en'}/features`) : window.location.href = `/${isTa ? 'ta' : 'en'}/features`} className="text-slate-400 hover:text-indigo-400 transition-colors">
                        {isTa ? 'அம்சங்கள்' : 'Features'}
                    </button>
                    <button onClick={() => onNavigate ? onNavigate(`/${isTa ? 'ta' : 'en'}/about`) : window.location.href = `/${isTa ? 'ta' : 'en'}/about`} className="text-slate-400 hover:text-indigo-400 transition-colors">
                        {isTa ? 'எங்களை பற்றி' : 'About Us'}
                    </button>
                    <button onClick={() => onNavigate ? onNavigate(`/${isTa ? 'ta' : 'en'}/contact`) : window.location.href = `/${isTa ? 'ta' : 'en'}/contact`} className="text-slate-400 hover:text-indigo-400 transition-colors">
                        {isTa ? 'தொடர்புக்கு' : 'Contact'}
                    </button>
                    <button onClick={() => onNavigate ? onNavigate('/login') : window.location.href = '/login'} className="text-slate-400 hover:text-indigo-400 transition-colors">
                        {isTa ? 'உள்நுழைய' : 'Login Portals'}
                    </button>
                </div>
            </div>
        </div>
    );
};

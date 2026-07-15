import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userPreferenceService } from '../services/userPreferenceService';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = i18n.language || 'en';

  const handleLanguageChange = async (lang: 'en' | 'ta') => {
    if (lang === currentLanguage) return;
    
    // 1. Instantly switch UI language locally
    await i18n.changeLanguage(lang);
    setIsOpen(false);

    // 2. Update URL path language prefix to keep route and language in sync
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    const firstPart = parts[0];
    let newPath = path;
    if (firstPart === 'en' || firstPart === 'ta') {
      const cleanPath = path.replace(/^\/(en|ta)/, '');
      newPath = `/${lang}${cleanPath === '' ? '/' : cleanPath}`;
    } else {
      newPath = `/${lang}${path === '/' ? '' : path}`;
    }

    if (newPath !== path) {
      window.history.pushState({}, '', newPath);
      // Dispatch popstate event so App.tsx's router listener updates currentPath state
      window.dispatchEvent(new PopStateEvent('popstate'));
    }

    // 3. Synchronize to Supabase & LocalStorage asynchronously
    if (user) {
      try {
        await userPreferenceService.saveUserPreference(user.id, lang);
      } catch (err) {
        console.error('[LanguageSwitcher] Failed to save language preference:', err);
      }
    } else {
      localStorage.setItem('educore_language', lang);
    }
  };

  return (
    <div className="relative inline-block text-left z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 text-slate-700 dark:text-slate-200 font-medium text-sm"
        id="language-selector-btn"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe size={16} className="text-indigo-500 animate-pulse" />
        <span>{currentLanguage === 'ta' ? 'தமிழ்' : 'English'}</span>
        <ChevronDown size={14} className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop for closing */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl ring-1 ring-black/5 focus:outline-none z-50 transform origin-top-right transition-all duration-200 ease-out p-1">
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="language-selector-btn">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                  currentLanguage === 'en'
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
                role="menuitem"
              >
                <span>English</span>
                {currentLanguage === 'en' && <Check size={14} />}
              </button>
              <button
                onClick={() => handleLanguageChange('ta')}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                  currentLanguage === 'ta'
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
                role="menuitem"
              >
                <span>தமிழ்</span>
                {currentLanguage === 'ta' && <Check size={14} />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;

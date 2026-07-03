import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n/config';

interface LanguageState {
    language: 'en' | 'ta';
    setLanguage: (lang: 'en' | 'ta') => void;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            language: 'en', // default
            setLanguage: (lang) => {
                i18n.changeLanguage(lang);
                set({ language: lang });
            },
        }),
        {
            name: 'user-language-preference',
        }
    )
);

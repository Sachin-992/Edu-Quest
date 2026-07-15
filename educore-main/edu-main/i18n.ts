import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import taTranslations from './locales/ta.json';
import enCommon from './locales/en/common.json';
import taCommon from './locales/ta/common.json';

// Get cached language or default to English
const savedLanguage = localStorage.getItem('educore_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: { ...enTranslations, ...enCommon }
      },
      ta: {
        translation: { ...taTranslations, ...taCommon }
      }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values to prevent XSS
    }
  });

export default i18n;

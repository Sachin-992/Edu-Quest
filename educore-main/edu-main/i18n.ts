import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import taTranslations from './locales/ta.json';
import enCommon from './locales/en/common.json';
import taCommon from './locales/ta/common.json';

// Get cached language or default to English
const savedLanguage = localStorage.getItem('educore_language') || 'en';

// Safely merge flat translation dictionaries with nested ones
function deepMerge(target: any, source: any) {
  const output = { ...target };
  if (target && typeof target === 'object' && source && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      const sourceVal = source[key];
      const targetVal = target[key];

      if (sourceVal && typeof sourceVal === 'object' && !Array.isArray(sourceVal)) {
        if (targetVal && typeof targetVal === 'object' && !Array.isArray(targetVal)) {
          output[key] = deepMerge(targetVal, sourceVal);
        } else {
          output[key] = sourceVal;
        }
      } else {
        // If target is a nested object and source is a primitive (like "dashboard": "Dashboard")
        // we preserve the nested translation map instead of overwriting it
        if (targetVal && typeof targetVal === 'object' && !Array.isArray(targetVal)) {
          // Keep the target object, skip overwriting
        } else {
          output[key] = sourceVal;
        }
      }
    });
  }
  return output;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: deepMerge(enTranslations, enCommon)
      },
      ta: {
        translation: deepMerge(taTranslations, taCommon)
      }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values to prevent XSS
    }
  });

export default i18n;

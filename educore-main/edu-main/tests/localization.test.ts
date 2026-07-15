import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Load translation files
const enPath = path.resolve(__dirname, '../locales/en.json');
const taPath = path.resolve(__dirname, '../locales/ta.json');

const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const taJson = JSON.parse(fs.readFileSync(taPath, 'utf8'));

// Helper to flatten nested object keys
function getDeepKeys(obj: any, prefix = ''): string[] {
    let keys: string[] = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(getDeepKeys(obj[key], prefix + key + '.'));
        } else {
            keys.push(prefix + key);
        }
    }
    return keys;
}

// Helper to get nested values
function getNestedValue(obj: any, pathStr: string): any {
    const parts = pathStr.split('.');
    let current = obj;
    for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        current = current[part];
    }
    return current;
}

describe('EDUCORE-OMEGA Localization Integrity Tests', () => {
    
    it('should verify locales files exist', () => {
        expect(fs.existsSync(enPath)).toBe(true);
        expect(fs.existsSync(taPath)).toBe(true);
    });

    it('should verify translation files have matching keys', () => {
        const enKeys = getDeepKeys(enJson).sort();
        const taKeys = getDeepKeys(taJson).sort();
        
        // Assert keys have exactly the same length
        expect(enKeys.length).toBe(taKeys.length);
        
        // Assert all keys match
        expect(enKeys).toEqual(taKeys);
    });

    it('should verify translation values are not empty', () => {
        const enKeys = getDeepKeys(enJson);
        for (const key of enKeys) {
            const enVal = getNestedValue(enJson, key);
            const taVal = getNestedValue(taJson, key);
            
            expect(enVal).toBeDefined();
            expect(typeof enVal).toBe('string');
            expect(enVal.trim().length).toBeGreaterThan(0);
            
            expect(taVal).toBeDefined();
            expect(typeof taVal).toBe('string');
            expect(taVal.trim().length).toBeGreaterThan(0);
        }
    });

    it('should verify Tamil translation files contain valid Tamil/Unicode characters', () => {
        const taKeys = getDeepKeys(taJson);
        let tamilCharCount = 0;
        
        // Match Tamil unicode range: U+0B80 to U+0BFF
        const tamilRegex = /[\u0B80-\u0BFF]/;

        for (const key of taKeys) {
            const val = getNestedValue(taJson, key);
            // Some names or common symbols/links might be english in ta.json, but overall it must contain Tamil
            if (tamilRegex.test(val)) {
                tamilCharCount++;
            }
        }
        
        // Verify at least 80% of translations in ta.json contain Tamil characters
        const ratio = tamilCharCount / taKeys.length;
        expect(ratio).toBeGreaterThan(0.8);
    });

    it('should audit core component files for i18n usage', () => {
        const coreFiles = [
            '../components/LoginScreen.tsx',
            '../components/admin/AdminLayout.tsx',
            '../components/student/StudentDashboard.tsx',
            '../components/teacher/TeacherDashboard.tsx',
            '../components/ParentDashboard.tsx',
            '../components/admin/modules/OverviewDashboard.tsx',
            '../components/admin/modules/AlertsNotificationsPanel.tsx'
        ];

        for (const fileRel of coreFiles) {
            const fullPath = path.resolve(__dirname, fileRel);
            expect(fs.existsSync(fullPath)).toBe(true);
            
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // Core files must import i18n or useTranslation
            expect(
                content.includes('useTranslation') || 
                content.includes('I18nextProvider') || 
                content.includes('i18n.changeLanguage')
            ).toBe(true);
        }
    });
});

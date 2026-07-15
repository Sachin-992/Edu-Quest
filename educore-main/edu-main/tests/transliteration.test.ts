import { describe, it, expect } from 'vitest';
import { transliterateTamilToEnglish, isBilingualMatch } from '../utils/transliteration';

describe('Bilingual Transliteration Utility', () => {
    it('should transliterate basic Tamil names to English sounds', () => {
        expect(transliterateTamilToEnglish('அருண்')).toContain('arun');
        expect(transliterateTamilToEnglish('பாலா')).toContain('paalaa');
        expect(transliterateTamilToEnglish('பிரியா')).toContain('piriyaa');
        expect(transliterateTamilToEnglish('ராமு')).toContain('raamu');
    });

    it('should match bilingual searches correctly', () => {
        // Search in English for Tamil name
        expect(isBilingualMatch('அருண்', 'Arun')).toBe(true);
        expect(isBilingualMatch('அருண் கோவிந்த்', 'Arun')).toBe(true);

        // Search in Tamil for English name
        expect(isBilingualMatch('Arun Kumar', 'அருண்')).toBe(true);
        expect(isBilingualMatch('Bala', 'பாலா')).toBe(true);

        // Substring matches
        expect(isBilingualMatch('அருண் பிரசாத்', 'பிரசாத்')).toBe(true);
        expect(isBilingualMatch('Arun Prasad', 'அருண்')).toBe(true);
    });

    it('should handle alternate spellings gracefully', () => {
        expect(isBilingualMatch('அருண்', 'Arun')).toBe(true);
        expect(isBilingualMatch('கணேஷ்', 'Ganesh')).toBe(true);
        expect(isBilingualMatch('பாலாஜி', 'Balaji')).toBe(true);
    });
});

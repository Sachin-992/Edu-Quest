/**
/**
 * Tamil-English Transliteration Utility
 * Helps match students when searching in either language.
 * E.g., "அருண்" -> "arun", "பாலா" -> "bala"
 */

const TAMIL_TO_ENGLISH_MAP: Record<string, string> = {
  // Vowels
  'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ee', 'உ': 'u', 'ஊ': 'oo',
  'எ': 'e', 'ஏ': 'ae', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'oe', 'ஔ': 'au',
  'ஃ': 'h',

  // Consonants
  'க': 'ka', 'ங': 'nga', 'ச': 'sa', 'ஞ': 'nya', 'ட': 'ta', 'ண': 'na',
  'த': 'tha', 'ந': 'na', 'ப': 'pa', 'ம': 'ma', 'ய': 'ya', 'ர': 'ra',
  'ல': 'la', 'வ': 'va', 'ழ': 'zha', 'ள': 'la', 'ற': 'ra', 'ன': 'na',
  
  // Grantha
  'ஜ': 'ja', 'ஷ': 'sha', 'ஸ': 'sa', 'ஹ': 'ha', 'க்ஷ': 'ksha'
};

const VOWEL_SIGN_MAP: Record<string, string> = {
  'ா': 'aa', // ஆ sign
  'ி': 'i',  // இ sign
  'ீ': 'ee', // ஈ sign
  'ு': 'u',  // உ sign
  'ூ': 'oo', // ஊ sign
  'ெ': 'e',  // எ sign
  'ே': 'ae', // ஏ sign
  'ை': 'ai', // ஐ sign
  'ொ': 'o',  // ஒ sign
  'ோ': 'oe', // ஓ sign
  'ௌ': 'au', // ஔ sign
  '்': ''    // Pulli (removes inherent 'a')
};

/**
 * Transliterates Tamil text to its approximate English sound equivalent
 */
export function transliterateTamilToEnglish(text: string): string {
  if (!text) return '';
  
  let result = '';
  let i = 0;
  
  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1] || '';
    
    // Check if it's a Tamil vowel or consonant
    if (TAMIL_TO_ENGLISH_MAP[char] !== undefined) {
      let mapped = TAMIL_TO_ENGLISH_MAP[char];
      
      // If it's a consonant and followed by a vowel sign
      if (VOWEL_SIGN_MAP[nextChar] !== undefined) {
        const sign = VOWEL_SIGN_MAP[nextChar];
        // If it has an inherent 'a' at the end (consonants in our map have it, e.g., 'ka'),
        // replace the 'a' with the vowel sign.
        if (mapped.endsWith('a') && sign !== '') {
          mapped = mapped.slice(0, -1) + sign;
        } else if (sign === '') {
          // Pulli removes the 'a'
          mapped = mapped.slice(0, -1);
        }
        i += 2; // skip both consonant and vowel sign
      } else {
        i += 1;
      }
      result += mapped;
    } else {
      // Keep non-Tamil characters as-is
      result += char;
      i += 1;
    }
  }
  
  return result.toLowerCase().trim();
}

/**
 * Checks if search text matches the target string in either English or Tamil
 */
export function isBilingualMatch(target: string, search: string): boolean {
  if (!search) return true;
  if (!target) return false;
  
  const normTarget = target.toLowerCase().trim();
  const normSearch = search.toLowerCase().trim();
  
  if (normTarget.includes(normSearch)) return true;
  
  // Transliterate both sides to English sounds
  const transTarget = transliterateTamilToEnglish(normTarget);
  const transSearch = transliterateTamilToEnglish(normSearch);
  
  // Compare English transliterations
  if (transTarget.includes(transSearch) || transSearch.includes(transTarget)) return true;
  
  // Compare clean alphabetic sounds (remove redundant double vowels or common alternate spellings)
  const simplify = (str: string) => {
    return str
      .replace(/aa/g, 'a')
      .replace(/ee/g, 'i')
      .replace(/oo/g, 'u')
      .replace(/ae/g, 'e')
      .replace(/ai/g, 'i')
      .replace(/oe/g, 'o')
      .replace(/th/g, 't')
      .replace(/zh/g, 'l')
      .replace(/sh/g, 's')
      .replace(/d/g, 't')
      .replace(/b/g, 'p')
      .replace(/g/g, 'k')
      .replace(/j/g, 's')
      .replace(/\s/g, '');
  };
  
  return simplify(transTarget).includes(simplify(transSearch)) || simplify(transSearch).includes(simplify(transTarget));
}

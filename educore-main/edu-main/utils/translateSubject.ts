import i18n from 'i18next';

/**
 * Subject & Class Name Translation Utility
 * Maps English database values → Tamil translations when Tamil language is active.
 * 
 * Subject names are stored in English in the DB. This utility translates them
 * dynamically based on the current i18n language.
 */

// Comprehensive subject name map: English → Tamil
export const SUBJECT_TAMIL_MAP: Record<string, string> = {
    // Core Subjects
    'Mathematics': 'கணிதம்',
    'Maths': 'கணிதம்',
    'Math': 'கணிதம்',
    'Science': 'அறிவியல்',
    'English': 'ஆங்கிலம்',
    'Tamil': 'தமிழ்',
    'Hindi': 'இந்தி',
    'Social Science': 'சமூக அறிவியல்',
    'Social Studies': 'சமூகவியல்',
    'EVS': 'சுற்றுச்சூழல் அறிவியல்',
    'Environmental Science': 'சுற்றுச்சூழல் அறிவியல்',

    // High School Sciences
    'Physics': 'இயற்பியல்',
    'Chemistry': 'வேதியியல்',
    'Biology': 'உயிரியல்',
    'Botany': 'தாவரவியல்',
    'Zoology': 'விலங்கியல்',

    // Languages & Literature
    'English Literature': 'ஆங்கில இலக்கியம்',
    'Tamil Literature': 'தமிழ் இலக்கியம்',
    'Sanskrit': 'சமஸ்கிருதம்',
    'French': 'பிரஞ்சு',
    'German': 'ஜெர்மன்',

    // Humanities
    'History': 'வரலாறு',
    'Geography': 'புவியியல்',
    'Civics': 'குடிமையியல்',
    'Economics': 'பொருளாதாரம்',
    'Political Science': 'அரசியல் அறிவியல்',
    'Sociology': 'சமூகவியல்',
    'Psychology': 'உளவியல்',

    // Technology & Commerce
    'Computer Science': 'கணினி அறிவியல்',
    'Computer': 'கணினி',
    'Information Technology': 'தகவல் தொழில்நுட்பம்',
    'IT': 'தகவல் தொழில்நுட்பம்',
    'Commerce': 'வணிகவியல்',
    'Accountancy': 'கணக்கியல்',
    'Accounts': 'கணக்கியல்',
    'Business Studies': 'வணிக ஆய்வுகள்',
    'Business Mathematics': 'வணிக கணிதம்',
    'Statistics': 'புள்ளியியல்',

    // Arts & Physical
    'Art': 'ஓவியம்',
    'Drawing': 'வரைவியல்',
    'Music': 'இசை',
    'Physical Education': 'உடற்கல்வி',
    'PE': 'உடற்கல்வி',
    'Sports': 'விளையாட்டு',
    'Games': 'விளையாட்டுகள்',

    // Special / Vocational
    'Moral Science': 'நெறிமுறை அறிவியல்',
    'Value Education': 'மதிப்பு கல்வி',
    'General Knowledge': 'பொது அறிவு',
    'GK': 'பொது அறிவு',
    'Library': 'நூலகம்',
    'Yoga': 'யோகா',
    'General': 'பொது',
    'General / Unspecified': 'பொது / குறிப்பிடப்படாதது',
};

// Grade/Class label map
export const CLASS_TAMIL_MAP: Record<string, string> = {
    'Class': 'வகுப்பு',
    'class': 'வகுப்பு',
    'Grade': 'வகுப்பு',
};

export function translateSubject(name: string, language?: string): string {
    const activeLang = (language || i18n.language || i18n.resolvedLanguage || (typeof localStorage !== 'undefined' ? localStorage.getItem('educore_language') : '') || 'en').toLowerCase();
    if (!activeLang.startsWith('ta')) return name;
    const normalized = name?.trim();
    if (!normalized) return '';
    
    // Exact match lookup
    if (SUBJECT_TAMIL_MAP[normalized]) return SUBJECT_TAMIL_MAP[normalized];
    
    // Case-insensitive fallback lookup
    const lowerName = normalized.toLowerCase();
    const key = Object.keys(SUBJECT_TAMIL_MAP).find(k => k.toLowerCase() === lowerName);
    if (key) return SUBJECT_TAMIL_MAP[key];
    
    return normalized;
}

/**
 * Translate a class label like "Class 1-A" → "வகுப்பு 1-A" in Tamil.
 */
export function translateClassLabel(label: string, language?: string): string {
    const activeLang = (language || i18n.language || i18n.resolvedLanguage || (typeof localStorage !== 'undefined' ? localStorage.getItem('educore_language') : '') || 'en').toLowerCase();
    if (!activeLang.startsWith('ta') || !label) return label;
    return label.replace(/^Class\s+/i, 'வகுப்பு ');
}

/**
 * Translate a section/class identifier like "1-A" → stays as "1-A" (numbers are universal).
 * Only the "Class" prefix word changes.
 */
export function translateClassName(cls: string, language?: string): string {
    const activeLang = (language || i18n.language || i18n.resolvedLanguage || (typeof localStorage !== 'undefined' ? localStorage.getItem('educore_language') : '') || 'en').toLowerCase();
    if (!activeLang.startsWith('ta')) return `Class ${cls}`;
    return `வகுப்பு ${cls}`;
}

// Exam Title Translation Map
export const EXAM_TAMIL_MAP: Record<string, string> = {
    'Final': 'இறுதித் தேர்வு',
    'Final Exam': 'இறுதித் தேர்வு',
    'Midterm': 'இடைப்பருவத் தேர்வு',
    'Mid-term': 'இடைப்பருவத் தேர்வு',
    'Quarterly': 'காலாண்டுத் தேர்வு',
    'Half Yearly': 'அரையாண்டுத் தேர்வு',
    'Half-Yearly': 'அரையாண்டுத் தேர்வு',
    'Annual': 'ஆண்டுத் தேர்வு',
    'Unit Test': 'அலகுத் தேர்வு',
    'Class Test': 'வகுப்புத் தேர்வு',
    'Examination': 'தேர்வு',
};

// Translate Exam Title
export function translateExamTitle(title: string, language?: string): string {
    const activeLang = (language || i18n.language || i18n.resolvedLanguage || (typeof localStorage !== 'undefined' ? localStorage.getItem('educore_language') : '') || 'en').toLowerCase();
    if (!activeLang.startsWith('ta') || !title) return title;
    const normalized = title.trim();
    if (EXAM_TAMIL_MAP[normalized]) return EXAM_TAMIL_MAP[normalized];
    
    const lowerTitle = normalized.toLowerCase();
    const key = Object.keys(EXAM_TAMIL_MAP).find(k => k.toLowerCase() === lowerTitle);
    if (key) return EXAM_TAMIL_MAP[key];
    
    return normalized;
}

// Curriculum Translation Map
export const CURRICULUM_TAMIL_MAP: Record<string, string> = {
    "General / Unspecified": "பொது / குறிப்பிடப்படாதது",
    "CBSE (India)": "சிபிஎஸ்இ (இந்தியா)",
    "ICSE (India)": "ஐசிஎஸ்இ (இந்தியா)",
    "IB (International)": "ஐபி (சர்வதேசம்)",
    "IGCSE (Cambridge)": "ஐஜிசிஎஸ்இ (கேம்பிரிட்ஜ்)",
    "Common Core (US)": "காமன் கோர் (அமெரிக்கா)",
    "State Board": "மாநில வாரியம்",
    "University / Higher Ed": "பல்கலைக்கழகம் / உயர்கல்வி",
    "Professional Certification": "தொழில்முறை சான்றிதழ்"
};

// Translate Curriculum Title
export function translateCurriculum(curriculum: string, language?: string): string {
    const activeLang = (language || i18n.language || i18n.resolvedLanguage || (typeof localStorage !== 'undefined' ? localStorage.getItem('educore_language') : '') || 'en').toLowerCase();
    if (!activeLang.startsWith('ta') || !curriculum) return curriculum;
    
    const normalized = curriculum.trim();
    if (CURRICULUM_TAMIL_MAP[normalized]) return CURRICULUM_TAMIL_MAP[normalized];
    
    const lowerCurr = normalized.toLowerCase();
    const key = Object.keys(CURRICULUM_TAMIL_MAP).find(k => k.toLowerCase() === lowerCurr);
    if (key) return CURRICULUM_TAMIL_MAP[key];
    
    return normalized;
}

// Translate Class Selector labels (e.g. Class 11 - Science -> வகுப்பு 11 - அறிவியல்)
export function translateClassSelector(c: string, language?: string): string {
    const activeLang = (language || i18n.language || i18n.resolvedLanguage || (typeof localStorage !== 'undefined' ? localStorage.getItem('educore_language') : '') || 'en').toLowerCase();
    if (!activeLang.startsWith('ta')) return c;
    
    let result = c.replace(/^Class\s+/i, 'வகுப்பு ');
    result = result.replace(/\s*-\s*Science/i, ' - அறிவியல்');
    result = result.replace(/\s*-\s*Commerce/i, ' - வணிகவியல்');
    result = result.replace(/\s*-\s*Humanities/i, ' - கலைப்பிரிவு');
    
    return result;
}

/**
 * Centralized Input Validation Utilities
 * Provides consistent validation across the entire app
 */

// ==================== PHONE NUMBER VALIDATION ====================
/**
 * Sanitize phone input - only allow digits
 */
export const sanitizePhone = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
};

/**
 * Validate phone number format (exactly 10 digits for Indian phones)
 */
export const validatePhone = (phone: string): { valid: boolean; error?: string } => {
    const cleaned = sanitizePhone(phone);
    if (!cleaned) return { valid: true }; // Empty is valid (optional field)
    if (cleaned.length !== 10) return { valid: false, error: 'Phone number must be exactly 10 digits' };
    return { valid: true };
};

/**
 * Phone input handler - restricts to numbers only
 */
export const handlePhoneInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (value: string) => void
) => {
    const sanitized = sanitizePhone(e.target.value);
    callback(sanitized);
};


// ==================== NAME VALIDATION ====================
/**
 * Sanitize name input - remove numbers, allow letters, spaces, and common name characters
 */
export const sanitizeName = (value: string): string => {
    // Allow letters (including unicode), spaces, hyphens, apostrophes, and periods
    return value.replace(/[0-9]/g, '');
};

/**
 * Validate name
 */
export const validateName = (name: string): { valid: boolean; error?: string } => {
    if (!name.trim()) return { valid: false, error: 'Name is required' };
    if (/[0-9]/.test(name)) return { valid: false, error: 'Name cannot contain numbers' };
    if (name.trim().length < 2) return { valid: false, error: 'Name must be at least 2 characters' };
    return { valid: true };
};

/**
 * Name input handler - restricts numbers
 */
export const handleNameInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (value: string) => void
) => {
    const sanitized = sanitizeName(e.target.value);
    callback(sanitized);
};


// ==================== DATE OF BIRTH VALIDATION ====================
/**
 * Get today's date in YYYY-MM-DD format for max date attribute
 */
export const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

/**
 * Validate date of birth - cannot be in the future
 */
export const validateDOB = (dob: string): { valid: boolean; error?: string } => {
    if (!dob) return { valid: true }; // Empty is valid for optional fields

    const dobDate = new Date(dob);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

    if (dobDate > today) {
        return { valid: false, error: 'Date of birth cannot be in the future' };
    }

    // Optional: Check for reasonable age (e.g., max 120 years old)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 120);
    if (dobDate < minDate) {
        return { valid: false, error: 'Please enter a valid date of birth' };
    }

    return { valid: true };
};

/**
 * DOB input handler
 */
export const handleDOBInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (value: string) => void
): string | null => {
    const value = e.target.value;
    const validation = validateDOB(value);

    if (validation.valid) {
        callback(value);
        return null; // No error
    }
    return validation.error || 'Invalid date';
};


// ==================== EMAIL VALIDATION ====================
/**
 * Validate email format
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
    if (!email) return { valid: true }; // Empty is valid for optional fields
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Please enter a valid email address' };
    }
    return { valid: true };
};


// ==================== AADHAAR VALIDATION ====================
/**
 * Sanitize Aadhaar input - only allow digits
 */
export const sanitizeAadhaar = (value: string): string => {
    return value.replace(/[^0-9]/g, '').slice(0, 12);
};

/**
 * Validate Aadhaar number (12 digits)
 */
export const validateAadhaar = (aadhaar: string): { valid: boolean; error?: string } => {
    if (!aadhaar) return { valid: true }; // Empty is valid for optional fields
    const cleaned = sanitizeAadhaar(aadhaar);
    if (cleaned.length !== 12) {
        return { valid: false, error: 'Aadhaar must be exactly 12 digits' };
    }
    return { valid: true };
};


// ==================== ROLL NUMBER VALIDATION ====================
/**
 * Sanitize roll number input - only allow digits
 */
export const sanitizeRollNumber = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
};


// ==================== INPUT PROPS HELPERS ====================
/**
 * Get props for phone input field
 */
export const getPhoneInputProps = () => ({
    type: 'tel',
    inputMode: 'numeric' as const,
    maxLength: 15,
    pattern: '[0-9]*',
    placeholder: 'Enter phone number (digits only)',
});

/**
 * Get props for DOB input field
 */
export const getDOBInputProps = () => ({
    type: 'date',
    max: getTodayDate(),
});

/**
 * Get props for name input field
 */
export const getNameInputProps = () => ({
    type: 'text',
    placeholder: 'Enter name (letters only)',
});

/**
 * Get props for Aadhaar input field
 */
export const getAadhaarInputProps = () => ({
    type: 'text',
    inputMode: 'numeric' as const,
    maxLength: 12,
    pattern: '[0-9]*',
    placeholder: 'Enter 12-digit Aadhaar number',
});

/**
 * EDUCORE-OMEGA Aadhaar Security Service
 * 
 * Handles encryption, masking, and secure access to government IDs
 * Compliant with data protection requirements
 */

import { supabase, isProductionReady } from './supabaseClient';
import { auditService } from './auditService';

// Encryption key (in production, this should be from environment variable)
const ENCRYPTION_KEY = import.meta.env.VITE_AADHAAR_ENCRYPTION_KEY || 'EDUCORE-OMEGA-SECURE-KEY-2026';

/**
 * Simple XOR-based encryption for demonstration
 * In production, use proper AES-256 encryption via a backend service
 */
const encryptAadhaar = (aadhaar: string): string => {
    if (!aadhaar || aadhaar.length !== 12) return '';

    // Base64 encode with key mixing for basic obfuscation
    const mixed = aadhaar.split('').map((char, i) => {
        const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
    }).join('');

    return btoa(mixed);
};

/**
 * Decrypt Aadhaar (Admin only)
 */
const decryptAadhaar = (encrypted: string): string => {
    if (!encrypted) return '';

    try {
        const mixed = atob(encrypted);
        return mixed.split('').map((char, i) => {
            const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
            return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
        }).join('');
    } catch {
        return '';
    }
};

/**
 * Extract last 4 digits for masked display
 */
const getLast4 = (aadhaar: string): string => {
    if (!aadhaar || aadhaar.length < 4) return '';
    return aadhaar.slice(-4);
};

/**
 * Format masked Aadhaar: XXXX-XXXX-1234
 */
const formatMasked = (last4: string): string => {
    if (!last4) return 'Not Verified';
    return `XXXX-XXXX-${last4}`;
};

/**
 * Validate Aadhaar format (12 digits)
 */
const validateAadhaar = (aadhaar: string): { valid: boolean; error?: string } => {
    if (!aadhaar) {
        return { valid: false, error: 'Aadhaar is required' };
    }

    const cleaned = aadhaar.replace(/\s|-/g, '');

    if (!/^\d{12}$/.test(cleaned)) {
        return { valid: false, error: 'Aadhaar must be exactly 12 digits' };
    }

    // Basic Verhoeff checksum validation could be added here

    return { valid: true };
};

export interface AadhaarUpdateResult {
    success: boolean;
    error?: string;
    masked?: string;
}

export const aadhaarService = {
    /**
     * Update student Aadhaar (Admin only)
     */
    async updateStudentAadhaar(
        studentId: string,
        aadhaar: string,
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<AadhaarUpdateResult> {
        // SECURITY: Only admin can update Aadhaar
        if (actorRole.toLowerCase() !== 'admin' && actorRole.toLowerCase() !== 'administrator') {
            await this.logAccess(actorId, actorName, actorRole, 'UPDATE', 'student', studentId, false, 'Unauthorized role');
            return { success: false, error: 'SECURITY VIOLATION: Only administrators can update Aadhaar' };
        }

        // Validate format
        const validation = validateAadhaar(aadhaar);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        const cleaned = aadhaar.replace(/\s|-/g, '');
        const encrypted = encryptAadhaar(cleaned);
        const last4 = getLast4(cleaned);

        if (!isProductionReady() || !supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const { error } = await supabase
                .from('students')
                .update({
                    aadhaar_encrypted: encrypted,
                    aadhaar_last4: last4,
                    aadhaar_verified: true,
                    aadhaar_updated_at: new Date().toISOString(),
                })
                .eq('id', studentId);

            if (error) {
                await this.logAccess(actorId, actorName, actorRole, 'UPDATE', 'student', studentId, false, error.message);
                return { success: false, error: error.message };
            }

            // Log successful update
            await this.logAccess(actorId, actorName, actorRole, 'UPDATE', 'student', studentId, true);

            // Also log to main audit
            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'UPDATE',
                entity: 'student_aadhaar',
                entity_id: studentId,
                severity: 'warning',
                details: 'Aadhaar ID updated (encrypted)',
            });

            return { success: true, masked: formatMasked(last4) };
        } catch (err) {
            return { success: false, error: 'Failed to update Aadhaar' };
        }
    },

    /**
     * Update teacher Aadhaar (Admin only)
     */
    async updateTeacherAadhaar(
        teacherId: string,
        aadhaar: string,
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<AadhaarUpdateResult> {
        if (actorRole.toLowerCase() !== 'admin' && actorRole.toLowerCase() !== 'administrator') {
            await this.logAccess(actorId, actorName, actorRole, 'UPDATE', 'teacher', teacherId, false, 'Unauthorized role');
            return { success: false, error: 'SECURITY VIOLATION: Only administrators can update Aadhaar' };
        }

        const validation = validateAadhaar(aadhaar);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        const cleaned = aadhaar.replace(/\s|-/g, '');
        const encrypted = encryptAadhaar(cleaned);
        const last4 = getLast4(cleaned);

        if (!isProductionReady() || !supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const { error } = await supabase
                .from('teachers')
                .update({
                    aadhaar_encrypted: encrypted,
                    aadhaar_last4: last4,
                    aadhaar_verified: true,
                    aadhaar_updated_at: new Date().toISOString(),
                })
                .eq('id', teacherId);

            if (error) {
                await this.logAccess(actorId, actorName, actorRole, 'UPDATE', 'teacher', teacherId, false, error.message);
                return { success: false, error: error.message };
            }

            await this.logAccess(actorId, actorName, actorRole, 'UPDATE', 'teacher', teacherId, true);

            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'UPDATE',
                entity: 'teacher_aadhaar',
                entity_id: teacherId,
                severity: 'warning',
                details: 'Aadhaar ID updated (encrypted)',
            });

            return { success: true, masked: formatMasked(last4) };
        } catch (err) {
            return { success: false, error: 'Failed to update Aadhaar' };
        }
    },

    /**
     * Get decrypted Aadhaar (Admin only)
     */
    async getDecryptedAadhaar(
        entityType: 'student' | 'teacher',
        entityId: string,
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; aadhaar?: string; error?: string }> {
        // SECURITY: Only admin can view full Aadhaar
        if (actorRole.toLowerCase() !== 'admin' && actorRole.toLowerCase() !== 'administrator') {
            await this.logAccess(actorId, actorName, actorRole, 'VIEW', entityType, entityId, false, 'Unauthorized role');
            return { success: false, error: 'SECURITY VIOLATION: Only administrators can view Aadhaar' };
        }

        if (!isProductionReady() || !supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const table = entityType === 'student' ? 'students' : 'teachers';
            const { data, error } = await supabase
                .from(table)
                .select('aadhaar_encrypted, aadhaar_last4, aadhaar_verified')
                .eq('id', entityId)
                .single();

            if (error || !data) {
                return { success: false, error: 'Record not found' };
            }

            if (!data.aadhaar_encrypted) {
                return { success: false, error: 'Aadhaar not set' };
            }

            // Log access
            await this.logAccess(actorId, actorName, actorRole, 'VIEW', entityType, entityId, true);

            const decrypted = decryptAadhaar(data.aadhaar_encrypted);

            // Format as XXXX-XXXX-XXXX
            const formatted = decrypted.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');

            return { success: true, aadhaar: formatted };
        } catch (err) {
            return { success: false, error: 'Failed to retrieve Aadhaar' };
        }
    },

    /**
     * Get masked Aadhaar for display
     */
    getMaskedAadhaar(last4: string | null | undefined): string {
        if (!last4) return 'Not Verified';
        return formatMasked(last4);
    },

    /**
     * Log Aadhaar access attempt
     */
    async logAccess(
        actorId: string,
        actorName: string,
        actorRole: string,
        action: 'VIEW' | 'UPDATE' | 'VERIFY' | 'ACCESS_DENIED',
        entityType: 'student' | 'teacher',
        entityId: string,
        success: boolean,
        failureReason?: string
    ): Promise<void> {
        if (!isProductionReady() || !supabase) return;

        try {
            await supabase.from('aadhaar_access_logs').insert({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action,
                entity_type: entityType,
                entity_id: entityId,
                success,
                failure_reason: failureReason,
            });
        } catch (err) {
            console.error('[AADHAAR] Failed to log access:', err);
        }
    },

    /**
     * Get Aadhaar access logs (Admin only)
     */
    async getAccessLogs(limit: number = 50): Promise<{ data: any[]; error?: string }> {
        if (!isProductionReady() || !supabase) {
            return { data: [], error: 'Database not configured' };
        }

        try {
            const { data, error } = await supabase
                .from('aadhaar_access_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                return { data: [], error: error.message };
            }

            return { data: data || [] };
        } catch (err) {
            return { data: [], error: 'Failed to fetch logs' };
        }
    },

    /**
     * Validate Aadhaar format
     */
    validate: validateAadhaar,
};

export default aadhaarService;

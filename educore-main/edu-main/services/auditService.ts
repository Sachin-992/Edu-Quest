/**
 * EDUCORE-OMEGA Audit Logging Service
 * 
 * PRODUCTION VERSION: Writes to Supabase audit_logs table
 * Logs are IMMUTABLE - cannot be edited or deleted.
 */

import { supabase, isAnalyticsEnabled } from './supabaseClient';

export type AuditAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'VIEW'
    | 'EXPORT'
    | 'FAILED_LOGIN'
    | 'ACCESS_DENIED'
    | 'SYSTEM'
    | 'PUBLISH'
    | 'TIMETABLE_PERIOD_CREATE'
    | 'TIMETABLE_PERIOD_UPDATE'
    | 'TIMETABLE_PERIOD_DELETE';

export type AuditSeverity = 'info' | 'success' | 'warning' | 'error';

export interface AuditLogEntry {
    id: string;
    created_at: string;
    actor_id: string;
    actor_name: string;
    actor_role: string;
    action: AuditAction;
    entity: string;
    entity_id?: string;
    details?: string;
    ip_address: string;
    severity: AuditSeverity;
    session_id: string;
}

// Session ID for current browser session
let currentSessionId = `SES-${Date.now().toString(36).toUpperCase()}`;

// In-memory cache for offline/fallback (limited to last 100)
const localCache: AuditLogEntry[] = [];

/**
 * Check if database persistence is available
 */
const isPersistenceAvailable = (): boolean => {
    return isAnalyticsEnabled && supabase !== null;
};

export const auditService = {
    /**
     * Log an audit entry (WRITES TO DATABASE)
     */
    log: async (entry: Omit<AuditLogEntry, 'id' | 'created_at' | 'ip_address' | 'session_id'>): Promise<AuditLogEntry | null> => {
        const logEntry: Omit<AuditLogEntry, 'id'> = {
            ...entry,
            created_at: new Date().toISOString(),
            ip_address: '0.0.0.0', // Would be extracted from request in production
            session_id: currentSessionId,
        };

        // Attempt database write
        if (isPersistenceAvailable()) {
            try {
                const { data, error } = await supabase!
                    .from('audit_logs')
                    .insert([logEntry])
                    .select()
                    .single();

                if (error) {
                    console.error('[AUDIT] Database write failed:', error);
                    // Fallback to local cache
                    const fallbackEntry = { ...logEntry, id: `LOCAL-${Date.now()}` } as AuditLogEntry;
                    localCache.unshift(fallbackEntry);
                    return fallbackEntry;
                }

                if (import.meta.env.DEV) {
                    console.log(`[AUDIT] ✓ ${data.action}: ${data.entity} by ${data.actor_name}`);
                }
                return data as AuditLogEntry;
            } catch (err) {
                console.error('[AUDIT] Exception during write:', err);
            }
        }

        // Fallback for when Supabase is not configured
        const fallbackEntry = { ...logEntry, id: `LOCAL-${Date.now()}` } as AuditLogEntry;
        localCache.unshift(fallbackEntry);
        if (localCache.length > 100) localCache.pop();

        if (import.meta.env.DEV) {
            console.log(`[AUDIT] (local) ${fallbackEntry.action}: ${fallbackEntry.entity} by ${fallbackEntry.actor_name}`);
        }
        return fallbackEntry;
    },

    /**
     * Log a login event
     */
    logLogin: async (userId: string, userName: string, userRole: string, success: boolean): Promise<AuditLogEntry | null> => {
        currentSessionId = `SES-${Date.now().toString(36).toUpperCase()}`;
        return auditService.log({
            actor_id: userId,
            actor_name: userName,
            actor_role: userRole,
            action: success ? 'LOGIN' : 'FAILED_LOGIN',
            entity: 'Authentication',
            severity: success ? 'success' : 'warning',
            details: success ? 'User logged in successfully' : 'Login attempt failed',
        });
    },

    /**
     * Log a logout event
     */
    logLogout: async (userId: string, userName: string, userRole: string): Promise<AuditLogEntry | null> => {
        return auditService.log({
            actor_id: userId,
            actor_name: userName,
            actor_role: userRole,
            action: 'LOGOUT',
            entity: 'Authentication',
            severity: 'info',
            details: 'User logged out',
        });
    },

    /**
     * Log a data access event
     */
    logAccess: async (
        userId: string,
        userName: string,
        userRole: string,
        action: AuditAction,
        entity: string,
        entityId?: string,
        details?: string
    ): Promise<AuditLogEntry | null> => {
        return auditService.log({
            actor_id: userId,
            actor_name: userName,
            actor_role: userRole,
            action,
            entity,
            entity_id: entityId,
            details,
            severity: action === 'DELETE' ? 'warning' : 'info',
        });
    },

    /**
     * Log an access denied event
     */
    logAccessDenied: async (
        userId: string,
        userName: string,
        userRole: string,
        entity: string,
        requiredRole: string
    ): Promise<AuditLogEntry | null> => {
        return auditService.log({
            actor_id: userId,
            actor_name: userName,
            actor_role: userRole,
            action: 'ACCESS_DENIED',
            entity,
            severity: 'error',
            details: `Access denied. Required role: ${requiredRole}`,
        });
    },

    /**
     * Get audit logs from database (with optional filtering)
     */
    getLogs: async (filters?: {
        userId?: string;
        action?: AuditAction;
        severity?: AuditSeverity;
        fromDate?: string;
        toDate?: string;
        limit?: number;
    }): Promise<AuditLogEntry[]> => {
        if (!isPersistenceAvailable()) {
            // Return local cache if database not available
            let filtered = [...localCache];
            if (filters?.userId) filtered = filtered.filter(log => log.actor_id === filters.userId);
            if (filters?.action) filtered = filtered.filter(log => log.action === filters.action);
            if (filters?.severity) filtered = filtered.filter(log => log.severity === filters.severity);
            return filtered.slice(0, filters?.limit || 100);
        }

        try {
            let query = supabase!
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(filters?.limit || 100);

            if (filters?.userId) query = query.eq('actor_id', filters.userId);
            if (filters?.action) query = query.eq('action', filters.action);
            if (filters?.severity) query = query.eq('severity', filters.severity);
            if (filters?.fromDate) query = query.gte('created_at', filters.fromDate);
            if (filters?.toDate) query = query.lte('created_at', filters.toDate);

            const { data, error } = await query;

            if (error) {
                console.error('[AUDIT] Error fetching logs:', error);
                return localCache;
            }

            return (data || []) as AuditLogEntry[];
        } catch (err) {
            console.error('[AUDIT] Exception fetching logs:', err);
            return localCache;
        }
    },

    /**
     * Get audit statistics
     */
    getStats: async () => {
        if (!isPersistenceAvailable()) {
            const today = new Date().toISOString().split('T')[0];
            const todayLogs = localCache.filter(log => log.created_at.startsWith(today));
            return {
                totalLogs: localCache.length,
                todayLogs: todayLogs.length,
                failedLogins: localCache.filter(log => log.action === 'FAILED_LOGIN').length,
                accessDenied: localCache.filter(log => log.action === 'ACCESS_DENIED').length,
                warnings: localCache.filter(log => log.severity === 'warning').length,
                errors: localCache.filter(log => log.severity === 'error').length,
            };
        }

        try {
            const today = new Date().toISOString().split('T')[0];

            const [totalResult, todayResult, failedResult, deniedResult] = await Promise.all([
                supabase!.from('audit_logs').select('id', { count: 'exact', head: true }),
                supabase!.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', today),
                supabase!.from('audit_logs').select('id', { count: 'exact', head: true }).eq('action', 'FAILED_LOGIN'),
                supabase!.from('audit_logs').select('id', { count: 'exact', head: true }).eq('action', 'ACCESS_DENIED'),
            ]);

            return {
                totalLogs: totalResult.count || 0,
                todayLogs: todayResult.count || 0,
                failedLogins: failedResult.count || 0,
                accessDenied: deniedResult.count || 0,
                warnings: 0, // Would need separate query
                errors: 0,
            };
        } catch (err) {
            console.error('[AUDIT] Error getting stats:', err);
            return { totalLogs: 0, todayLogs: 0, failedLogins: 0, accessDenied: 0, warnings: 0, errors: 0 };
        }
    },

    /**
     * Export logs as JSON (for admin download)
     */
    exportLogs: async (): Promise<string> => {
        const logs = await auditService.getLogs({ limit: 1000 });
        return JSON.stringify(logs, null, 2);
    },

    /**
     * Check if persistence is available
     */
    isPersistent: (): boolean => isPersistenceAvailable(),

    // NOTE: clearLogs() has been REMOVED to ensure immutability
    // Audit logs cannot be deleted.
};

export default auditService;

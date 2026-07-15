import { supabase, isAnalyticsEnabled } from './supabaseClient';
import { UserRole } from '../types';
import { rbacService } from './rbacService';

export interface SessionRecord {
    role: UserRole;
    curriculum: string;
    message_count: number;
    topics?: string[];
}

export interface AnalyticsData {
    totalSessions: number;
    sessionsByRole: { name: string; value: number }[];
    sessionsByCurriculum: { name: string; value: number }[];
    dailyActivity: { date: string; sessions: number }[];
}

/**
 * Logs an anonymized session record to the database.
 * Called when a conversation ends (reset or page unload).
 */
export const logSession = async (session: SessionRecord): Promise<boolean> => {
    if (!isAnalyticsEnabled || !supabase) {
        console.log('Analytics disabled. Session not logged.');
        return false;
    }

    try {
        const { error } = await supabase.from('sessions').insert({
            role: session.role,
            curriculum: session.curriculum,
            message_count: session.message_count,
            topics: session.topics || [],
        });

        if (error) {
            console.error('Failed to log session:', error.message);
            return false;
        }

        console.log('Session logged successfully.');
        return true;
    } catch (err) {
        console.error('Error logging session:', err);
        return false;
    }
};

/**
 * Fetches aggregated analytics data for the admin dashboard.
 */
export const getAnalyticsData = async (): Promise<AnalyticsData | null> => {
    // RBAC ENFORCEMENT (CRITICAL) - Admin only
    rbacService.enforce('system:analytics', 'read');

    if (!isAnalyticsEnabled || !supabase) {
        console.log('Analytics disabled. Cannot fetch data.');
        return null;
    }

    try {
        // Fetch all sessions
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch analytics:', error.message);
            return null;
        }

        if (!sessions || sessions.length === 0) {
            return {
                totalSessions: 0,
                sessionsByRole: [],
                sessionsByCurriculum: [],
                dailyActivity: [],
            };
        }

        // Aggregate: Sessions by Role
        const roleCount: Record<string, number> = {};
        sessions.forEach((s) => {
            roleCount[s.role] = (roleCount[s.role] || 0) + 1;
        });
        const sessionsByRole = Object.entries(roleCount).map(([name, value]) => ({ name, value }));

        // Aggregate: Sessions by Curriculum
        const curriculumCount: Record<string, number> = {};
        sessions.forEach((s) => {
            curriculumCount[s.curriculum] = (curriculumCount[s.curriculum] || 0) + 1;
        });
        const sessionsByCurriculum = Object.entries(curriculumCount).map(([name, value]) => ({ name, value }));

        // Aggregate: Daily Activity (last 7 days)
        const dailyCount: Record<string, number> = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            dailyCount[dateStr] = 0;
        }
        sessions.forEach((s) => {
            const dateStr = new Date(s.created_at).toISOString().split('T')[0];
            if (dailyCount[dateStr] !== undefined) {
                dailyCount[dateStr]++;
            }
        });
        const dailyActivity = Object.entries(dailyCount).map(([date, sessions]) => ({ date, sessions }));

        return {
            totalSessions: sessions.length,
            sessionsByRole,
            sessionsByCurriculum,
            dailyActivity,
        };
    } catch (err) {
        console.error('Error fetching analytics:', err);
        return null;
    }
};

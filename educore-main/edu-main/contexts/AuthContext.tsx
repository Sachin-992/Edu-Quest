/**
 * EDUCORE-OMEGA Authentication Context
 * 
 * ROBUST AUTH PERSISTENCE ENGINE v2 + EDUQUEST GAMIFICATION INTEGRATION
 * - Timeout protection (never hangs forever)
 * - Session-first approach
 * - Unified gamification state management
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';
import i18n from '../i18n';
import { userPreferenceService } from '../services/userPreferenceService';

// ============================================
// TYPES
// ============================================

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    status: 'active' | 'inactive' | 'suspended';
    first_login: boolean;
}

export interface MilestoneProgress {
    current_chapter: number;
    current_level: number;
    cumulative_xp: number;
    academic_rating: number;
    chapter_xp_earned: number;
    chapter_xp_required: number;
    knowledge_points: number;
    skill_stars: number;
    wisdom_points: number;
    scholar_points: number;
    coins: number;
    gems: number;
}

export interface ProfileDetails {
    full_name: string;
    roll_number: string | null;
    class_level: number | null;
    school_id: string | null;
    avatar_url: string | null;
}

interface AuthContextType {
    session: Session | null;
    user: AuthUser | null;
    loading: boolean;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;

    // Gamification properties compatible with EduQuest
    role: string | null;
    roleLoading: boolean;
    profile: ProfileDetails | null;
    motivationProgress: MilestoneProgress | null;
    updateProgress: (updates: Partial<MilestoneProgress>) => Promise<void>;
    addXp: (amount: number) => Promise<void>;
    addRating: (amount: number) => Promise<void>;
    refreshMotivation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// HELPER: Map DB role to UserRole enum
// ============================================
const mapDbRoleToUserRole = (dbRole: string): UserRole => {
    switch (dbRole) {
        case 'admin': return UserRole.ADMIN;
        case 'teacher': return UserRole.TEACHER;
        case 'student': return UserRole.STUDENT;
        case 'parent': return UserRole.PARENT;
        default: return UserRole.STUDENT;
    }
};

// ============================================
// HELPER: Promise with timeout
// ============================================
const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    const timeout = new Promise<T>((resolve) => {
        setTimeout(() => {
            console.warn(`[AuthContext] Operation timed out after ${ms}ms, using fallback`);
            resolve(fallback);
        }, ms);
    });
    return Promise.race([promise, timeout]);
};

// ============================================
// HELPER: Create user from session (no DB needed)
// ============================================
const createUserFromSession = (authUser: User): AuthUser => {
    const metadata = authUser.user_metadata || {};
    return {
        id: authUser.id,
        email: authUser.email || '',
        role: mapDbRoleToUserRole(metadata.role || 'student'),
        name: metadata.name || authUser.email?.split('@')[0] || 'User',
        status: 'active',
        first_login: false
    };
};

// ============================================
// AUTH PROVIDER
// ============================================
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Gamification states
    const [profile, setProfile] = useState<ProfileDetails | null>(null);
    const [motivationProgress, setMotivationProgress] = useState<MilestoneProgress | null>(null);
    const [roleLoading, setRoleLoading] = useState(true);

    // ========================================
    // FETCH GAMIFICATION METRICS
    // ========================================
    const fetchGamificationData = useCallback(async (userId: string, isStudent: boolean) => {
        if (!supabase) return;
        setRoleLoading(true);

        try {
            const [profileResult, milestoneResult] = await Promise.all([
                supabase
                    .from("profiles")
                    .select("full_name, roll_number, class_level, school_id, avatar_url")
                    .eq("user_id", userId)
                    .maybeSingle(),
                supabase
                    .from("student_milestone_progress")
                    .select("*")
                    .eq("student_id", userId)
                    .maybeSingle()
            ]);

            if (profileResult.data) {
                setProfile(profileResult.data);
            }

            if (milestoneResult.data) {
                setMotivationProgress(milestoneResult.data);
            } else if (isStudent) {
                // Initialize fallback default metrics for new students
                const defaultMilestone: MilestoneProgress = {
                    current_chapter: 1,
                    current_level: 1,
                    cumulative_xp: 0,
                    academic_rating: 800,
                    chapter_xp_earned: 0,
                    chapter_xp_required: 500,
                    knowledge_points: 0,
                    skill_stars: 0,
                    wisdom_points: 0,
                    scholar_points: 0,
                    coins: 0,
                    gems: 0
                };
                setMotivationProgress(defaultMilestone);
            }
        } catch (err) {
            console.error('[AuthContext] fetchGamificationData error:', err);
        } finally {
            setRoleLoading(false);
        }
    }, []);

    // ========================================
    // UPDATE METRICS & STREAKS
    // ========================================
    const refreshMotivation = useCallback(async () => {
        if (!supabase || !session?.user) return;
        try {
            const { data } = await supabase
                .from("student_milestone_progress")
                .select("*")
                .eq("student_id", session.user.id)
                .maybeSingle();
            if (data) setMotivationProgress(data);
        } catch (err) {
            console.error("[AuthContext] refreshMotivation error:", err);
        }
    }, [session]);

    const updateProgress = useCallback(async (updates: Partial<MilestoneProgress>) => {
        if (!supabase || !session?.user || !motivationProgress) return;
        try {
            const newProgress = { ...motivationProgress, ...updates };
            setMotivationProgress(newProgress);

            await supabase
                .from("student_milestone_progress")
                .update(updates)
                .eq("student_id", session.user.id);

            window.dispatchEvent(new Event("wallet_update"));
        } catch (err) {
            console.error("[AuthContext] updateProgress error:", err);
        }
    }, [session, motivationProgress]);

    const addXp = useCallback(async (amount: number) => {
        if (!motivationProgress) return;
        const newXp = motivationProgress.cumulative_xp + amount;
        let level = motivationProgress.current_level;
        let requiredXp = level * 500;
        let chapterXp = motivationProgress.chapter_xp_earned + amount;

        while (chapterXp >= requiredXp) {
            chapterXp -= requiredXp;
            level += 1;
            requiredXp = level * 500;
            window.dispatchEvent(new CustomEvent("eq_level_up", { detail: { level } }));
        }

        await updateProgress({
            cumulative_xp: newXp,
            current_level: level,
            chapter_xp_earned: chapterXp,
            chapter_xp_required: requiredXp
        });
    }, [motivationProgress, updateProgress]);

    const addRating = useCallback(async (amount: number) => {
        if (!motivationProgress) return;
        const newRating = Math.max(100, motivationProgress.academic_rating + amount);
        await updateProgress({ academic_rating: newRating });
        window.dispatchEvent(new CustomEvent("eq_rating_change", { detail: { rating: newRating, delta: amount } }));
    }, [motivationProgress, updateProgress]);


    // ========================================
    // INITIALIZE AUTH ON MOUNT
    // ========================================
    useEffect(() => {
        if (!supabase) {
            console.warn('[AuthContext] Supabase not configured');
            setLoading(false);
            setRoleLoading(false);
            return;
        }

        let mounted = true;

        const initAuth = async () => {
            console.log('[AuthContext] Initializing...');

            try {
                // Get session with 3 second timeout
                const sessionResult = await withTimeout(
                    supabase.auth.getSession(),
                    3000,
                    { data: { session: null }, error: null }
                );

                const existingSession = sessionResult.data.session;

                if (existingSession && mounted) {
                    console.log('[AuthContext] Session found for:', existingSession.user.email);
                    setSession(existingSession);

                    // Create user immediately from session metadata
                    const sessionUser = createUserFromSession(existingSession.user);
                    setUser(sessionUser);

                    // Load gamification profiles
                    fetchGamificationData(existingSession.user.id, sessionUser.role === UserRole.STUDENT);

                    // Try to enrich from DB with 2 second timeout (non-blocking)
                    withTimeout(
                        supabase.from('users').select('*').eq('auth_id', existingSession.user.id).single(),
                        2000,
                        { data: null, error: null }
                    ).then(async ({ data }) => {
                        if (data && mounted) {
                            console.log('[AuthContext] Enriched user from DB');
                            const enrichedUser: AuthUser = {
                                id: data.id,
                                email: data.email,
                                role: mapDbRoleToUserRole(data.role),
                                name: data.name || data.email,
                                status: data.status || 'active',
                                first_login: data.first_login ?? false
                            };
                            setUser(enrichedUser);
                            
                            // Load language preference
                            const lang = await userPreferenceService.getUserPreference(data.id);
                            i18n.changeLanguage(lang);
                        }
                    }).catch(() => {
                        console.warn('[AuthContext] DB enrichment failed, using session data');
                    });

                } else if (mounted) {
                    console.log('[AuthContext] No session found');
                    setSession(null);
                    setUser(null);
                    setRoleLoading(false);
                }
            } catch (err) {
                console.error('[AuthContext] Init error:', err);
                setRoleLoading(false);
            } finally {
                if (mounted) {
                    setLoading(false);
                    console.log('[AuthContext] Init complete');
                }
            }
        };

        initAuth();

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log('[AuthContext] Auth event:', event);

                if (!mounted) return;

                // GUARD: Prevent session hijacking when Admin creates new users
                if (event === 'SIGNED_IN' && session && newSession) {
                    const currentEmail = session.user?.email;
                    const newEmail = newSession.user?.email;
                    if (currentEmail && newEmail && currentEmail !== newEmail) {
                        console.warn('[AuthContext] Ignoring session switch from', currentEmail, 'to', newEmail);
                        return; // IGNORE this event
                    }
                }

                setSession(newSession);

                if (newSession?.user) {
                    const sessionUser = createUserFromSession(newSession.user);
                    setUser(sessionUser);

                    fetchGamificationData(newSession.user.id, sessionUser.role === UserRole.STUDENT);
                    
                    // Fetch profile info and load preferences
                    supabase.from('users').select('*').eq('auth_id', newSession.user.id).single().then(async ({ data }) => {
                        if (data && mounted) {
                            setUser({
                                id: data.id,
                                email: data.email,
                                role: mapDbRoleToUserRole(data.role),
                                name: data.name || data.email,
                                status: data.status || 'active',
                                first_login: data.first_login ?? false
                            });
                            
                            const lang = await userPreferenceService.getUserPreference(data.id);
                            i18n.changeLanguage(lang);
                        }
                    }).catch(err => {
                        console.warn('[AuthContext] Auth change DB check failed:', err);
                    });
                } else {
                    setUser(null);
                    setProfile(null);
                    setMotivationProgress(null);
                    setRoleLoading(false);
                }

                setLoading(false);
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchGamificationData]);

    // ========================================
    // SIGN IN
    // ========================================
    const signIn = useCallback(async (email: string, password: string) => {
        if (!supabase) {
            return { success: false, error: 'Authentication service unavailable' };
        }

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message || 'Authentication failed' };
        }
    }, []);

    // ========================================
    // SIGN OUT
    // ========================================
    const signOut = useCallback(async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        setMotivationProgress(null);
        setRoleLoading(false);
    }, []);

    // ========================================
    // CONTEXT VALUE
    // ========================================
    const value: AuthContextType = {
        session,
        user,
        loading,
        isAuthenticated: !!session && !!user,
        signIn,
        signOut,
        role: user?.role || null,
        roleLoading,
        profile,
        motivationProgress,
        updateProgress,
        addXp,
        addRating,
        refreshMotivation
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// ============================================
// HOOK
// ============================================
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;

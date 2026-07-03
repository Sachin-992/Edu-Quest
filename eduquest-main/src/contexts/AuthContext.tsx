import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "student" | "admin" | "super_admin" | "school_admin" | "platform_admin" | "teacher";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  roleLoading: boolean;
  profile: {
    full_name: string;
    roll_number: string | null;
    class_level: number | null;
    school_id: string | null;
    avatar_url: string | null;
  } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  roleLoading: true,
  profile: null,
  loading: true,
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

/* ── Layer 5: localStorage cache for instant returning-user login ── */
const CACHE_KEY = "eq_user_data";

interface CachedUserData {
  userId: string;
  role: AppRole;
  profile: AuthContextType["profile"];
  ts: number; // timestamp for staleness check
}

function readCache(userId: string): CachedUserData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedUserData = JSON.parse(raw);
    // Only use cache if same user and less than 24h old
    if (cached.userId === userId && Date.now() - cached.ts < 86_400_000) {
      return cached;
    }
  } catch { /* corrupt cache — ignore */ }
  return null;
}

function writeCache(userId: string, role: AppRole, profile: AuthContextType["profile"]) {
  try {
    const data: CachedUserData = { userId, role, profile, ts: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded — ignore */ }
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

/* ── Provider ── */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);

  const lastFetchedId = useRef<string | null>(null);
  const fetchingRef = useRef<string | null>(null);

  const fetchUserData = async (userId: string) => {
    // Skip if already fetching for this user (prevents race condition between getSession and onAuthStateChange)
    if (fetchingRef.current === userId) return;
    fetchingRef.current = userId;
    setRoleLoading(true);

    try {
      const t0 = performance.now();

      const [roleResult, profileResult] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId),
        supabase
          .from("profiles")
          .select("full_name, roll_number, class_level, school_id, avatar_url")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      if (import.meta.env.DEV) {
        console.debug(`[Auth] Role+profile fetched in ${Math.round(performance.now() - t0)}ms`);
      }

      // Process role
      const priority: AppRole[] = ["platform_admin", "super_admin", "school_admin", "admin", "teacher", "student"];
      const roles = (roleResult.data || []).map(r => r.role);
      const best = priority.find(p => roles.includes(p));
      const resolvedRole = (best as AppRole) || null;
      setRole(resolvedRole);

      // Process profile
      const resolvedProfile = profileResult.data || null;
      if (resolvedProfile) setProfile(resolvedProfile);

      // Write to cache for next visit
      if (resolvedRole) writeCache(userId, resolvedRole, resolvedProfile);
    } catch (err) {
      console.error("[Auth] fetchUserData failed:", err);
    } finally {
      setRoleLoading(false);
      fetchingRef.current = null;
      lastFetchedId.current = userId;
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        // Layer 5: Try cache first for instant render
        const cached = readCache(session.user.id);
        if (cached) {
          setRole(cached.role);
          setProfile(cached.profile);
          setRoleLoading(false);
          console.debug("[Auth] Cache hit — instant role/profile");
        }

        // Always fetch fresh data in background (updates cache too)
        fetchUserData(session.user.id).catch(err =>
          console.error("[Auth] Initial data fetch failed:", err)
        );
      } else {
        setRoleLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          // Try cache first
          const cached = readCache(session.user.id);
          if (cached) {
            setRole(cached.role);
            setProfile(cached.profile);
            setRoleLoading(false);
          }

          fetchUserData(session.user.id).catch(err =>
            console.error("[Auth] Auth change data fetch failed:", err)
          );
        } else {
          setRole(null);
          setProfile(null);
          setRoleLoading(false);
          lastFetchedId.current = null;
          clearCache();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    lastFetchedId.current = null;
    clearCache();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, roleLoading, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

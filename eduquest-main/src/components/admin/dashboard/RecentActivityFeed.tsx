import { useEffect, useState, useCallback } from "react";
import { getAdminClient } from "@/integrations/supabase/adminClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, LogIn, LogOut } from "lucide-react";
import { motion } from "framer-motion";

interface LoginEvent {
    id: string;
    userName: string;
    classLevel: number | null;
    type: "login" | "logout";
    timestamp: string;
    duration: string | null;
}

const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
};

const getInitials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const avatarColors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
];

interface RecentActivityFeedProps {
    isTeacher?: boolean;
    assignedClasses?: number[];
    assignedSubjects?: string[];
    assignments?: any[];
}

const RecentActivityFeed = ({
    isTeacher = false,
    assignedClasses = [],
    assignedSubjects = [],
    assignments = [],
}: RecentActivityFeedProps) => {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<LoginEvent[]>([]);

    const fetchActivity = useCallback(async () => {
        setLoading(true);
        try {
            const adminClient = getAdminClient();

            // Build profiles query – scoped by teacher's classes if applicable
            let profilesQuery = adminClient
                .from("profiles")
                .select("user_id, full_name, class_level, updated_at")
                .not("roll_number", "is", null)
                .eq("is_active", true);

            if (isTeacher && assignedClasses.length > 0) {
                profilesQuery = profilesQuery.in("class_level", assignedClasses);
            }

            const { data: profiles } = await profilesQuery.order("updated_at", { ascending: false }).limit(100);

            if (!profiles || profiles.length === 0) {
                setItems([]);
                setLoading(false);
                return;
            }

            const studentIds = profiles.map(p => p.user_id);

            // Fetch recent study sessions (login/logout tracking)
            const { data: sessions } = await adminClient
                .from("study_sessions")
                .select("id, user_id, started_at, ended_at, duration_seconds")
                .in("user_id", studentIds)
                .order("started_at", { ascending: false })
                .limit(100);

            const profileMap = new Map(profiles.map(p => [p.user_id, p]));
            const events: LoginEvent[] = [];

            if (sessions && sessions.length > 0) {
                // Build events from study sessions
                for (const s of sessions) {
                    const profile = profileMap.get(s.user_id);
                    if (!profile) continue;

                    // Login event
                    events.push({
                        id: `${s.id}-login`,
                        userName: profile.full_name,
                        classLevel: profile.class_level,
                        type: "login",
                        timestamp: s.started_at,
                        duration: null,
                    });

                    // Logout event (if ended)
                    if (s.ended_at) {
                        events.push({
                            id: `${s.id}-logout`,
                            userName: profile.full_name,
                            classLevel: profile.class_level,
                            type: "logout",
                            timestamp: s.ended_at,
                            duration: s.duration_seconds ? formatDuration(s.duration_seconds) : null,
                        });
                    }
                }
            }

            // Also use profiles.updated_at as login indicators for students
            // who don't have study_sessions yet
            const sessionUserIds = new Set(sessions?.map(s => s.user_id) || []);
            for (const profile of profiles) {
                if (sessionUserIds.has(profile.user_id)) continue;
                if (!profile.updated_at) continue;

                events.push({
                    id: `profile-${profile.user_id}`,
                    userName: profile.full_name,
                    classLevel: profile.class_level,
                    type: "login",
                    timestamp: profile.updated_at,
                    duration: null,
                });
            }

            // Sort by timestamp descending and limit
            events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setItems(events.slice(0, 30));
        } catch (err) {
            console.error("[RecentActivityFeed] Error:", err);
        }
        setLoading(false);
    }, [isTeacher, assignedClasses]);

    useEffect(() => {
        fetchActivity();
        // Poll every 30s
        const interval = setInterval(fetchActivity, 30000);
        return () => clearInterval(interval);
    }, [fetchActivity]);

    if (loading) {
        return (
            <div className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-5">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Clock className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <h3 className="font-bold text-base">Recent Activity</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-2.5 mb-5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Clock className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                    <h3 className="font-bold text-base leading-tight">Recent Activity</h3>
                    <p className="text-[11px] text-muted-foreground">Student login & logout</p>
                </div>
                {items.length > 0 && (
                    <div className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        LIVE
                    </div>
                )}
            </div>

            {items.length === 0 ? (
                <div className="text-center py-10 flex-1 flex flex-col items-center justify-center">
                    <Clock className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
            ) : (
                <div className="space-y-1 flex-1 overflow-y-auto pr-1 -mr-1 
                    scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent hover:scrollbar-thumb-border/80">
                    {items.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.25 }}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-all duration-200 group"
                        >
                            {/* Avatar */}
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                                {getInitials(item.userName)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm leading-snug truncate">
                                    <span className="font-bold text-foreground">{item.userName}</span>
                                    {item.classLevel && (
                                        <span className="text-muted-foreground text-[11px] ml-1.5 bg-muted/60 px-1.5 py-0.5 rounded font-medium">
                                            Class {item.classLevel}
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                                    {item.type === "login" ? (
                                        <>
                                            <LogIn className="w-3 h-3 flex-shrink-0 text-emerald-500" />
                                            <span>Logged in</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogOut className="w-3 h-3 flex-shrink-0 text-orange-500" />
                                            <span>Logged out{item.duration && <span className="text-muted-foreground/70"> · Session: {item.duration}</span>}</span>
                                        </>
                                    )}
                                </p>
                            </div>

                            {/* Right side */}
                            <div className="text-right flex-shrink-0">
                                <p className="text-[11px] text-muted-foreground whitespace-nowrap">{timeAgo(item.timestamp)}</p>
                                <div className={`mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    item.type === "login"
                                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                }`}>
                                    {item.type === "login" ? (
                                        <><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online</>
                                    ) : (
                                        <><span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> Offline</>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentActivityFeed;

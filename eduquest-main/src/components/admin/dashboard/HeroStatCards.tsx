import { useEffect, useState, useCallback } from "react";
import { getAdminClient } from "@/integrations/supabase/adminClient";
import { onQuizComplete, onActivityComplete } from "@/lib/quizSyncBus";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Users, Activity, Target, CheckCircle2,
    TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

/* ─── Animated Number Counter ───────────────────────────────────── */
const AnimatedNumber = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
    const mv = useMotionValue(0);
    const rounded = useTransform(mv, (v) => Math.round(v));
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const controls = animate(mv, value, { duration: 1.2, ease: "easeOut" });
        const unsub = rounded.on("change", setDisplay);
        return () => { controls.stop(); unsub(); };
    }, [value, mv, rounded]);

    return (
        <span>
            {display}
            {suffix}
        </span>
    );
};

/* ─── Types ─────────────────────────────────────────────────────── */
interface HeroStatCardsProps {
    onCardClick?: (tab: string) => void;
    isTeacher?: boolean;
    assignedClasses?: number[];
    assignedSubjects?: string[];
    assignments?: any[];
}

interface StatData {
    totalStudents: number;
    activeToday: number;
    avgScoreToday: number;
    completionRate: number;
    studentsTrend: number;
    activeTrend: number;
    scoreTrend: number;
    completionTrend: number;
}

/* ─── Main Component ────────────────────────────────────────────── */
const HeroStatCards = ({
    onCardClick,
    isTeacher = false,
    assignedClasses = [],
    assignedSubjects = [],
    assignments = [],
}: HeroStatCardsProps) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<StatData>({
        totalStudents: 0, activeToday: 0, avgScoreToday: 0, completionRate: 0,
        studentsTrend: 0, activeTrend: 0, scoreTrend: 0, completionTrend: 0,
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const todayISO = today.toISOString();
        const yesterdayISO = yesterday.toISOString();

        let profilesQuery = getAdminClient()
            .from("profiles")
            .select("user_id", { count: "exact" })
            .not("roll_number", "is", null);

        if (isTeacher) {
            profilesQuery = profilesQuery.in("class_level", assignedClasses);
        }

        const studentsRes = await profilesQuery;
        const totalStudents = studentsRes.count ?? 0;

        // If the teacher has no students in their assigned classes, return empty stats immediately
        if (isTeacher && totalStudents === 0) {
            setData({
                totalStudents: 0, activeToday: 0, avgScoreToday: 0, completionRate: 0,
                studentsTrend: 0, activeTrend: 0, scoreTrend: 0, completionTrend: 0,
            });
            setLoading(false);
            return;
        }

        let progressUserIds: string[] = [];
        if (isTeacher) {
            const { data: studentProfiles } = await getAdminClient()
                .from("profiles")
                .select("user_id")
                .in("class_level", assignedClasses)
                .not("roll_number", "is", null);
            progressUserIds = (studentProfiles || []).map((p) => p.user_id);
        }

        let todayQuery = getAdminClient().from("student_progress").select("user_id, score, quiz_id, lesson_id, status").gte("completed_at", todayISO);
        let yesterdayQuery = getAdminClient().from("student_progress").select("user_id, score, quiz_id, lesson_id, status").gte("completed_at", yesterdayISO).lt("completed_at", todayISO);
        let allQuery = getAdminClient().from("student_progress").select("user_id, lesson_id, status").not("lesson_id", "is", null).eq("status", "completed");
        // All-time scores for overall average – include both quiz AND lesson scores
        let allScoresQuery = getAdminClient().from("student_progress").select("user_id, score, xp_earned").not("score", "is", null);

        if (isTeacher) {
            if (progressUserIds.length === 0) {
                setData({
                    totalStudents: 0, activeToday: 0, avgScoreToday: 0, completionRate: 0,
                    studentsTrend: 0, activeTrend: 0, scoreTrend: 0, completionTrend: 0,
                });
                setLoading(false);
                return;
            }
            todayQuery = todayQuery.in("user_id", progressUserIds);
            yesterdayQuery = yesterdayQuery.in("user_id", progressUserIds);
            allQuery = allQuery.in("user_id", progressUserIds);
            allScoresQuery = allScoresQuery.in("user_id", progressUserIds);
        }

        const [todayRes, yesterdayRes, allRes, allScoresRes] = await Promise.all([
            todayQuery,
            yesterdayQuery,
            allQuery,
            allScoresQuery,
        ]);

        const td = todayRes.data || [];
        const yd = yesterdayRes.data || [];
        const all = allRes.data || [];
        const allScores = allScoresRes.data || [];

        const activeToday = new Set(td.map(p => p.user_id)).size;
        const activeYesterday = new Set(yd.map(p => p.user_id)).size;

        // All-time average score across all entries with a score value
        const allQuizScores = allScores.filter(p => p.score !== null && p.score !== undefined).map(p => p.score as number);
        let avgOverall = 0;
        if (allQuizScores.length > 0) {
            avgOverall = Math.round(allQuizScores.reduce((a, b) => a + b, 0) / allQuizScores.length);
        } else {
            // Fallback: derive from xp_earned if no scores exist
            // Use xp completion as a proxy: (total xp earned / max possible xp) as %
            const xpValues = allScores.filter(p => p.xp_earned > 0).map(p => p.xp_earned);
            if (xpValues.length > 0) {
                const avgXp = xpValues.reduce((a, b) => a + b, 0) / xpValues.length;
                const maxXp = Math.max(...xpValues, 100);
                avgOverall = Math.round((avgXp / maxXp) * 100);
            }
        }

        // Today vs yesterday for trend
        const tScores = td.filter(p => p.quiz_id && p.score != null && p.status === "completed").map(p => p.score!);
        const avgToday = tScores.length > 0 ? Math.round(tScores.reduce((a, b) => a + b, 0) / tScores.length) : 0;
        const yScores = yd.filter(p => p.quiz_id && p.score != null && p.status === "completed").map(p => p.score!);
        const avgYesterday = yScores.length > 0 ? Math.round(yScores.reduce((a, b) => a + b, 0) / yScores.length) : 0;

        const engaged = new Set(all.map(p => p.user_id)).size;
        const completionRate = totalStudents > 0 ? Math.round((engaged / totalStudents) * 100) : 0;

        setData({
            totalStudents, activeToday, avgScoreToday: avgOverall, completionRate,
            studentsTrend: 0,
            activeTrend: activeToday - activeYesterday,
            scoreTrend: avgToday - avgYesterday,
            completionTrend: 0,
        });
        setLoading(false);
    }, [isTeacher, assignedClasses]);

    // Initial fetch + 60s polling for real-time stats
    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(), 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Instant refresh on quiz completion event
    useEffect(() => {
        const unsub = onQuizComplete(() => fetchData());
        return unsub;
    }, [fetchData]);

    useEffect(() => {
        const unsub = onActivityComplete(() => fetchData());
        return unsub;
    }, [fetchData]);

    const cards = [
        {
            label: "Total Students", value: data.totalStudents, suffix: "",
            trend: data.studentsTrend, icon: Users,
            gradient: "from-blue-500 to-blue-600",
            glow: "shadow-blue-500/20",
            lightBg: "bg-blue-50 dark:bg-blue-950/40",
            tab: "students",
        },
        {
            label: "Active Today", value: data.activeToday, suffix: "",
            trend: data.activeTrend, icon: Activity,
            gradient: "from-emerald-500 to-emerald-600",
            glow: "shadow-emerald-500/20",
            lightBg: "bg-emerald-50 dark:bg-emerald-950/40",
            tab: "students",
            pulse: data.activeToday > 0,
        },
        {
            label: "Avg Score", value: data.avgScoreToday, suffix: "%",
            trend: data.scoreTrend, icon: Target,
            gradient: "from-amber-500 to-orange-500",
            glow: "shadow-orange-500/20",
            lightBg: "bg-orange-50 dark:bg-orange-950/40",
            tab: "performance",
        },
        {
            label: "Completion Rate", value: data.completionRate, suffix: "%",
            trend: data.completionTrend, icon: CheckCircle2,
            gradient: "from-violet-500 to-purple-600",
            glow: "shadow-purple-500/20",
            lightBg: "bg-purple-50 dark:bg-purple-950/40",
            tab: "performance",
        },
    ];

    return (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 xl:gap-8">
            {cards.map((card, i) => (
                <motion.button
                    key={card.label}
                    initial={{ opacity: 0, y: 24, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => onCardClick?.(card.tab)}
                    className={`relative overflow-hidden rounded-2xl ${card.lightBg} border border-white/10 dark:border-white/5 p-6 md:p-7 text-left transition-all duration-300 hover:shadow-xl hover:${card.glow} hover:-translate-y-1 active:scale-[0.97] group`}
                >
                    {/* Decorative gradient orb */}
                    <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-[0.08] blur-2xl group-hover:opacity-[0.15] transition-opacity duration-500`} />

                    <div className="relative z-10">
                        {/* Icon + Trend row */}
                        <div className="flex items-center justify-between mb-5">
                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.glow}`}>
                                <card.icon className="h-5.5 w-5.5 text-white" />
                            </div>
                            <TrendBadge trend={card.trend} />
                        </div>

                        {/* Value */}
                        {loading ? (
                            <Skeleton className="h-14 w-28 mb-2 rounded-xl" />
                        ) : (
                            <p className="text-4xl md:text-[3.25rem] font-black text-foreground tracking-tight leading-none tabular-nums">
                                <AnimatedNumber value={card.value} suffix={card.suffix} />
                            </p>
                        )}

                        {/* Label */}
                        <div className="flex items-center gap-2 mt-3">
                            {"pulse" in card && card.pulse && (
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                </span>
                            )}
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                                {card.label}
                            </p>
                        </div>
                    </div>
                </motion.button>
            ))}
        </section>
    );
};

/* ─── Trend Badge ───────────────────────────────────────────────── */
const TrendBadge = ({ trend }: { trend: number }) => {
    if (trend > 0) return (
        <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 shadow-sm"
        >
            <TrendingUp className="w-3.5 h-3.5" /> +{trend}
        </motion.span>
    );
    if (trend < 0) return (
        <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 shadow-sm"
        >
            <TrendingDown className="w-3.5 h-3.5" /> {trend}
        </motion.span>
    );
    return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-muted/80 text-muted-foreground">
            <Minus className="w-3.5 h-3.5" /> —
        </span>
    );
};

export default HeroStatCards;

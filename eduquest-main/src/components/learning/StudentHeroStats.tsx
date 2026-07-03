import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Star, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { getStreakMultiplier } from "@/lib/retentionEngine";
import RankTierBadge from "./RankTierBadge";

/* ─── Level Definitions ─────────────────────────────────────────── */
const LEVELS = [
    { level: 1, xpNeeded: 0, title: "Beginner", emoji: "🌱" },
    { level: 2, xpNeeded: 50, title: "Explorer", emoji: "🧭" },
    { level: 3, xpNeeded: 150, title: "Learner", emoji: "📖" },
    { level: 4, xpNeeded: 300, title: "Scholar", emoji: "🎓" },
    { level: 5, xpNeeded: 500, title: "Master", emoji: "🏆" },
    { level: 6, xpNeeded: 800, title: "Champion", emoji: "👑" },
    { level: 7, xpNeeded: 1200, title: "Legend", emoji: "⭐" },
];

interface StudentHeroStatsProps {
    refreshTrigger?: number;
}

const StudentHeroStats = ({ refreshTrigger }: StudentHeroStatsProps) => {
    const { user } = useAuth();
    const [totalXP, setTotalXP] = useState(0);
    const [streakDays, setStreakDays] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchStats = async () => {
            setLoading(true);
            const { data: progress } = await supabase
                .from("student_progress")
                .select("xp_earned, lesson_id, status, completed_at")
                .eq("user_id", user.id);

            if (!progress) { setLoading(false); return; }

            const xp = progress.reduce((sum, p) => sum + (p.xp_earned || 0), 0);

            // Calculate streak — normalize dates to IST (UTC+5:30)
            const toISTDateStr = (d: string) => {
                const date = new Date(d);
                const istMs = date.getTime() + (330 * 60 * 1000);
                return new Date(istMs).toISOString().slice(0, 10);
            };
            const nowIST = toISTDateStr(new Date().toISOString());
            const yesterdayIST = toISTDateStr(new Date(Date.now() - 86400000).toISOString());

            const dates = progress
                .filter(p => p.completed_at)
                .map(p => toISTDateStr(p.completed_at!))
                .filter((v, i, a) => a.indexOf(v) === i)
                .sort((a, b) => b.localeCompare(a));

            let streak = 0;
            if (dates.length > 0 && (dates[0] === nowIST || dates[0] === yesterdayIST)) {
                streak = 1;
                for (let i = 1; i < dates.length; i++) {
                    const prev = new Date(dates[i - 1]).getTime();
                    const curr = new Date(dates[i]).getTime();
                    const diff = prev - curr;
                    if (diff <= 86400000 * 1.5) streak++;
                    else break;
                }
            }

            setTotalXP(xp);
            setStreakDays(streak);
            setLoading(false);
        };
        fetchStats();
    }, [user, refreshTrigger]);

    const currentLevel = [...LEVELS].reverse().find(l => totalXP >= l.xpNeeded) || LEVELS[0];
    const nextLevel = LEVELS.find(l => l.xpNeeded > totalXP);
    const xpProgress = nextLevel
        ? ((totalXP - currentLevel.xpNeeded) / (nextLevel.xpNeeded - currentLevel.xpNeeded)) * 100
        : 100;
    const xpToNext = nextLevel ? nextLevel.xpNeeded - totalXP : 0;
    const streakInfo = getStreakMultiplier(streakDays);

    if (loading) {
        return <div className="h-40 bg-muted/30 rounded-3xl animate-pulse" />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/8 to-transparent border border-primary/20 p-8 md:p-10 shadow-xl shadow-primary/15"
        >
            {/* Decorative glows & particles */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-4 left-8 w-3 h-3 rounded-full bg-amber-400/30 anim-float" />
            <div className="absolute top-8 right-24 w-2 h-2 rounded-full bg-pink-400/25 anim-float" style={{ animationDelay: "1s" }} />
            <div className="absolute bottom-12 right-12 w-2.5 h-2.5 rounded-full bg-sky-400/20 anim-float" style={{ animationDelay: "2s" }} />

            <div className="relative z-10 flex flex-col gap-5">
                {/* ── Top Row: Level Badge + Streak ── */}
                <div className="flex items-center justify-between">
                    {/* Level Badge — big and bold */}
                    <div className="flex items-center gap-3.5">
                        <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                            className="h-18 w-18 md:h-22 md:w-22 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/30 anim-pulse-scale"
                        >
                            <span className="text-4xl md:text-5xl drop-shadow-md">{currentLevel.emoji}</span>
                        </motion.div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-[0.15em]">
                                Level {currentLevel.level}
                            </p>
                            <p className="text-xl md:text-2xl font-black text-foreground leading-tight">
                                {currentLevel.title}
                            </p>
                            {/* Rank Tier */}
                            <div className="mt-1">
                                <RankTierBadge totalXP={totalXP} size="sm" />
                            </div>
                        </div>
                    </div>

                    {/* Streak Flame — highlighted */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center gap-0.5"
                    >
                        <div className={`relative h-14 w-14 md:h-16 md:w-16 rounded-2xl flex items-center justify-center ${streakDays > 0
                            ? "bg-gradient-to-br from-orange-400/20 to-red-400/10 border border-orange-400/20"
                            : "bg-muted/30 border border-border/30"
                            }`}>
                            <Flame className={`w-7 h-7 md:w-8 md:h-8 ${streakDays > 0 ? "text-orange-500 anim-wiggle" : "text-muted-foreground/30"
                                }`} />
                            {streakDays > 0 && (
                                <div
                                    className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-orange-500/30 anim-pulse-scale"
                                >
                                    {streakDays}
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {streakDays > 0
                                ? `${streakDays} day${streakDays === 1 ? "" : "s"} 🔥`
                                : "No streak"}
                        </p>
                        {streakInfo.label && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`text-[9px] font-black ${streakInfo.color}`}
                            >
                                {streakInfo.multiplier}× XP
                            </motion.p>
                        )}
                    </motion.div>
                </div>

                {/* ── XP Progress Bar — full width, prominent ── */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-500" />
                            <span className="text-base md:text-lg font-black text-foreground">{totalXP} XP</span>
                        </div>
                        {nextLevel ? (
                            <span className="text-xs md:text-sm font-semibold text-muted-foreground">
                                {xpToNext} more to {nextLevel.emoji} {nextLevel.title}
                            </span>
                        ) : (
                            <span className="text-xs font-semibold text-amber-600">Max Level! ⭐</span>
                        )}
                    </div>
                    <div className="h-6 md:h-7 bg-muted/40 rounded-full overflow-hidden shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${xpProgress}%` }}
                            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 shadow-md shadow-amber-500/30 relative"
                        >
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white/60 anim-pulse-scale" />
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StudentHeroStats;

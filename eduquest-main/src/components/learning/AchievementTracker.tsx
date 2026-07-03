import { motion } from "framer-motion";
import { TrendingUp, Award } from "lucide-react";
import { getRank, getNextRank, ALL_BADGES, type BadgeStats } from "@/lib/retentionEngine";

interface AchievementTrackerProps {
    stats: BadgeStats;
}

const LEVELS = [
    { level: 1, xpNeeded: 0, title: "Beginner", emoji: "🌱" },
    { level: 2, xpNeeded: 50, title: "Explorer", emoji: "🧭" },
    { level: 3, xpNeeded: 150, title: "Learner", emoji: "📖" },
    { level: 4, xpNeeded: 300, title: "Scholar", emoji: "🎓" },
    { level: 5, xpNeeded: 500, title: "Master", emoji: "🏆" },
    { level: 6, xpNeeded: 800, title: "Champion", emoji: "👑" },
    { level: 7, xpNeeded: 1200, title: "Legend", emoji: "⭐" },
];

const AchievementTracker = ({ stats }: AchievementTrackerProps) => {
    const rank = getRank(stats.totalXP);
    const nextRank = getNextRank(stats.totalXP);

    // Next level
    const currentLevel = [...LEVELS].reverse().find((l) => stats.totalXP >= l.xpNeeded) || LEVELS[0];
    const nextLevel = LEVELS.find((l) => l.xpNeeded > stats.totalXP);

    // Next badge to unlock
    const lockedBadges = ALL_BADGES
        .filter((b) => !b.condition(stats))
        .map((b) => {
            const prog = b.progress(stats);
            return { ...b, progress: prog, pct: (prog.current / prog.target) * 100 };
        })
        .sort((a, b) => b.pct - a.pct); // Closest to unlock first

    const nearestBadge = lockedBadges[0];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 250, damping: 18 }}
            className="rounded-2xl bg-gradient-to-br from-indigo-500/8 via-card to-card border border-indigo-500/15 p-6 space-y-5 shadow-xl shadow-indigo-500/10 card-shimmer"
        >
            <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-base">Progress Tracker</h3>
            </div>

            {/* Level progress */}
            {nextLevel && (
                <div className="flex items-center gap-3">
                    <span className="text-xl">{currentLevel.emoji}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold">{currentLevel.title}</span>
                            <span className="text-muted-foreground">
                                {nextLevel.xpNeeded - stats.totalXP} XP to {nextLevel.emoji} {nextLevel.title}
                            </span>
                        </div>
                        <div className="w-full h-3.5 bg-muted/40 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${((stats.totalXP - currentLevel.xpNeeded) / (nextLevel.xpNeeded - currentLevel.xpNeeded)) * 100}%`,
                                }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full rounded-full bg-gradient-to-r from-primary via-primary/90 to-primary/70 progress-bar-stripe"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Rank progress */}
            {nextRank && (
                <div className="flex items-center gap-3">
                    <span className="text-xl">{rank.emoji}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold">{rank.name} Rank</span>
                            <span className="text-muted-foreground">
                                {nextRank.xpNeeded} XP to {nextRank.rank.emoji} {nextRank.rank.name}
                            </span>
                        </div>
                        <div className="w-full h-3.5 bg-muted/40 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${Math.max(5, ((stats.totalXP - rank.minXP) / (nextRank.rank.minXP - rank.minXP)) * 100)}%`,
                                }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                                className={`h-full rounded-full bg-gradient-to-r ${rank.gradient}`}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Nearest badge — glow when close to unlock */}
            {nearestBadge && (
                <div className={`flex items-center gap-3 rounded-xl p-2.5 -mx-1 ${nearestBadge.pct > 80 ? "bg-amber-400/10 ring-2 ring-amber-400/25 anim-glow" : ""}`}>
                    <span className={`text-xl ${nearestBadge.pct > 80 ? "" : "grayscale opacity-50"}`}>{nearestBadge.icon}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold flex items-center gap-1">
                                <Award className="w-3 h-3" /> {nearestBadge.name}
                                {nearestBadge.pct > 80 && <span className="text-amber-600 dark:text-amber-400 ml-1">Almost unlocked! 🏆</span>}
                            </span>
                            <span className="text-muted-foreground">
                                {nearestBadge.progress.current}/{nearestBadge.progress.target}
                            </span>
                        </div>
                        <div className="w-full h-3 bg-muted/40 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${nearestBadge.pct}%` }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 progress-bar-stripe"
                            />
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default AchievementTracker;

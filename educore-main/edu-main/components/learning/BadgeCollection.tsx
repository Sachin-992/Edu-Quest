import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALL_BADGES, type BadgeDef, type BadgeStats } from "@/lib/retentionEngine";

interface BadgeCollectionProps {
    stats: BadgeStats;
    onBack: () => void;
}

const CATEGORIES = [
    { id: "all", label: "All", emoji: "🏆" },
    { id: "learning", label: "Learning", emoji: "📚" },
    { id: "quizzes", label: "Quizzes", emoji: "📝" },
    { id: "streaks", label: "Streaks", emoji: "🔥" },
    { id: "adventure", label: "Adventure", emoji: "⚔️" },
    { id: "special", label: "Special", emoji: "🌟" },
] as const;

const BadgeCollection = ({ stats, onBack }: BadgeCollectionProps) => {
    const [category, setCategory] = useState<string>("all");

    const filtered = category === "all"
        ? ALL_BADGES
        : ALL_BADGES.filter((b) => b.category === category);

    const earned = ALL_BADGES.filter((b) => b.condition(stats)).length;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onBack} className="gap-2 -ml-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <div className="text-sm font-bold text-muted-foreground">
                    {earned}/{ALL_BADGES.length} Badges
                </div>
            </div>

            {/* Header */}
            <div className="text-center mb-2">
                <h2 className="text-2xl font-black text-gradient-flow">Badge Collection 🏅</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Complete challenges to unlock badges!
                </p>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {CATEGORIES.map((cat) => (
                    <motion.button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.93 }}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors ${category === cat.id
                            ? "bg-primary/15 text-primary border-2 border-primary/30"
                            : "bg-muted/30 text-muted-foreground border-2 border-transparent hover:bg-muted/50"
                            }`}
                    >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                    </motion.button>
                ))}
            </div>

            {/* Badge Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <AnimatePresence mode="popLayout">
                    {filtered.map((badge, i) => (
                        <BadgeCard key={badge.id} badge={badge} stats={stats} index={i} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

function BadgeCard({ badge, stats, index }: { badge: BadgeDef; stats: BadgeStats; index: number }) {
    const unlocked = badge.condition(stats);
    const prog = badge.progress(stats);
    const pct = Math.min((prog.current / prog.target) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: Math.min(index * 0.05, 0.4), type: 'spring', stiffness: 350, damping: 18 }}
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.95 }}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors cursor-pointer card-press ${unlocked
                ? "bg-gradient-to-b from-amber-50/50 to-card dark:from-amber-900/10 border-amber-300/40 dark:border-amber-700/40 card-shimmer"
                : "bg-muted/10 border-transparent"
                }`}
        >
            {/* Badge icon */}
            <div className="relative">
                {unlocked && (
                    <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-lg anim-glow" />
                )}
                <span className={`text-3xl relative ${unlocked ? "" : "grayscale opacity-30"}`}>
                    {unlocked ? badge.icon : "🔒"}
                </span>
            </div>

            {/* Name */}
            <span className={`text-[11px] font-bold text-center leading-tight ${unlocked ? "text-foreground" : "text-muted-foreground"
                }`}>
                {badge.name}
            </span>

            {/* Progress bar (only for locked) */}
            {!unlocked && (
                <div className="w-full">
                    <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary/40 rounded-full transition-all duration-500 progress-bar-stripe"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <p className="text-[9px] text-muted-foreground text-center mt-1 font-medium">
                        {prog.current}/{prog.target}
                    </p>
                </div>
            )}

            {/* Tooltip */}
            <p className="text-[9px] text-muted-foreground text-center leading-tight">
                {badge.description}
            </p>
        </motion.div>
    );
}

export default BadgeCollection;

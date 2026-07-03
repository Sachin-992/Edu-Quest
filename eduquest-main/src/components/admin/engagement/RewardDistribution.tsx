import { motion } from "framer-motion";

interface Props {
    /** Data from localStorage aggregate across all students */
    rewardCounts: { label: string; count: number; emoji: string; color: string }[];
    totalRewards: number;
}

const DEFAULT_REWARDS = [
    { label: "Bonus XP", count: 0, emoji: "⭐", color: "bg-amber-400" },
    { label: "Mystery Badge", count: 0, emoji: "🏅", color: "bg-purple-400" },
    { label: "Streak Shield", count: 0, emoji: "🛡️", color: "bg-blue-400" },
    { label: "XP Booster", count: 0, emoji: "🚀", color: "bg-orange-400" },
    { label: "Double Coins", count: 0, emoji: "💰", color: "bg-emerald-400" },
    { label: "No Reward", count: 0, emoji: "—", color: "bg-gray-300 dark:bg-gray-600" },
];

const RewardDistribution = ({ rewardCounts, totalRewards }: Props) => {
    const data = rewardCounts.length > 0 ? rewardCounts : DEFAULT_REWARDS;
    const max = Math.max(1, ...data.map((d) => d.count));
    const total = totalRewards || data.reduce((s, d) => s + d.count, 0) || 1;

    return (
        <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🎁</span>
                    <h3 className="font-bold text-sm">Reward Distribution</h3>
                </div>
                <span className="text-xs font-bold text-muted-foreground">{total} total</span>
            </div>

            {/* Stacked bar */}
            <div className="h-6 rounded-full overflow-hidden flex bg-muted/20">
                {data.filter((d) => d.count > 0).map((d, i) => (
                    <motion.div
                        key={d.label}
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.count / total) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        title={`${d.label}: ${d.count}`}
                        className={`${d.color} first:rounded-l-full last:rounded-r-full`}
                    />
                ))}
            </div>

            {/* Legend rows */}
            <div className="grid grid-cols-2 gap-2">
                {data.map((d) => (
                    <div key={d.label} className="flex items-center gap-2 text-xs">
                        <div className={`h-3 w-3 rounded-sm ${d.color} shrink-0`} />
                        <span className="text-muted-foreground">{d.emoji} {d.label}</span>
                        <span className="ml-auto font-bold">{d.count}</span>
                        <span className="text-muted-foreground text-[10px]">
                            ({total > 0 ? Math.round((d.count / total) * 100) : 0}%)
                        </span>
                    </div>
                ))}
            </div>

            <p className="text-[10px] text-muted-foreground">
                Aggregated from student reflection rewards
            </p>
        </div>
    );
};

export default RewardDistribution;

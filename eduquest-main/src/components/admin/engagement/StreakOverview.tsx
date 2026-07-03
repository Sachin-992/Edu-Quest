import { motion } from "framer-motion";
import type { StreakBucket, StudentStreak } from "@/lib/engagementAnalytics";

interface Props {
    buckets: StreakBucket[];
    streaks: StudentStreak[];
}

const StreakOverview = ({ buckets, streaks }: Props) => {
    const maxCount = Math.max(1, ...buckets.map((b) => b.count));
    const totalStudents = streaks.length || 1;
    const avgStreak = totalStudents > 0
        ? (streaks.reduce((s, st) => s + st.streakDays, 0) / totalStudents).toFixed(1)
        : "0";
    const longestStreak = Math.max(0, ...streaks.map((s) => s.streakDays));
    const activeToday = streaks.filter((s) => s.streakDays > 0).length;

    return (
        <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
            <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <h3 className="font-bold text-sm">Streak Overview</h3>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Avg Streak", value: `${avgStreak}d`, icon: "📊" },
                    { label: "Longest", value: `${longestStreak}d`, icon: "👑" },
                    { label: "Active Today", value: `${activeToday}`, icon: "🟢" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-xl bg-muted/20 border border-border/20 p-3 text-center"
                    >
                        <span className="text-sm">{stat.icon}</span>
                        <p className="text-lg font-black text-foreground mt-0.5">{stat.value}</p>
                        <p className="text-[9px] text-muted-foreground font-semibold">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Bar chart */}
            <div className="space-y-2">
                {buckets.map((bucket, i) => (
                    <div key={bucket.label} className="flex items-center gap-3">
                        <span className="w-20 text-[10px] font-semibold text-muted-foreground text-right">
                            {bucket.label}
                        </span>
                        <div className="flex-1 h-5 bg-muted/20 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(bucket.count / maxCount) * 100}%` }}
                                transition={{ duration: 0.6, delay: i * 0.08 }}
                                className={`h-full rounded-full ${bucket.color} flex items-center justify-end pr-2`}
                            >
                                {bucket.count > 0 && (
                                    <span className="text-[9px] font-black text-white drop-shadow-sm">
                                        {bucket.count}
                                    </span>
                                )}
                            </motion.div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StreakOverview;

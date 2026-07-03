import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { StudentMotivation } from "@/lib/engagementAnalytics";

interface Props {
    data: StudentMotivation[];
}

function scoreColor(score: number): string {
    if (score >= 70) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
    if (score >= 40) return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
    return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
    if (trend === "up") return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
    if (trend === "down") return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

const StudentMotivationTable = ({ data }: Props) => {
    const [showAll, setShowAll] = useState(false);
    const [filterFlag, setFilterFlag] = useState(false);

    const filtered = filterFlag ? data.filter((d) => d.needsEncouragement) : data;
    const displayed = showAll ? filtered : filtered.slice(0, 10);
    const flaggedCount = data.filter((d) => d.needsEncouragement).length;

    return (
        <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🧠</span>
                    <h3 className="font-bold text-sm">Student Motivation Scores</h3>
                </div>

                <button
                    onClick={() => setFilterFlag(!filterFlag)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${filterFlag
                            ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-300/50"
                            : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50"
                        }`}
                >
                    <AlertTriangle className="w-3 h-3" />
                    {flaggedCount} Need Help
                </button>
            </div>

            {displayed.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No students found</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-muted-foreground text-left border-b border-border/30">
                                <th className="pb-2 font-semibold">Student</th>
                                <th className="pb-2 font-semibold">Class</th>
                                <th className="pb-2 font-semibold text-center">Score</th>
                                <th className="pb-2 font-semibold text-center">Trend</th>
                                <th className="pb-2 font-semibold text-center">Streak</th>
                                <th className="pb-2 font-semibold text-center">XP</th>
                                <th className="pb-2 font-semibold text-center">Last Active</th>
                                <th className="pb-2 font-semibold text-center">Flag</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayed.map((s, i) => (
                                <motion.tr
                                    key={s.userId}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className={`border-b border-border/10 last:border-0 ${s.needsEncouragement ? "bg-red-50/50 dark:bg-red-900/5" : ""
                                        }`}
                                >
                                    <td className="py-2.5 font-semibold text-foreground">{s.fullName}</td>
                                    <td className="py-2.5 text-muted-foreground">{s.classLevel}</td>
                                    <td className="py-2.5 text-center">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${scoreColor(s.motivationScore)}`}>
                                            {s.motivationScore}
                                        </span>
                                    </td>
                                    <td className="py-2.5 text-center">
                                        <div className="flex justify-center">
                                            <TrendIcon trend={s.trend} />
                                        </div>
                                    </td>
                                    <td className="py-2.5 text-center font-bold">
                                        {s.streakDays > 0 ? `${s.streakDays}🔥` : "0"}
                                    </td>
                                    <td className="py-2.5 text-center font-semibold">{s.totalXP}</td>
                                    <td className="py-2.5 text-center text-muted-foreground">
                                        {s.daysSinceLastActive === 0
                                            ? "Today"
                                            : s.daysSinceLastActive === 999
                                                ? "Never"
                                                : `${s.daysSinceLastActive}d ago`}
                                    </td>
                                    <td className="py-2.5 text-center">
                                        {s.needsEncouragement && (
                                            <span title="Needs encouragement" className="text-red-500 text-sm">🚨</span>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filtered.length > 10 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-1"
                >
                    {showAll ? (
                        <>Show Less <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                        <>Show All ({filtered.length}) <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                </button>
            )}

            <p className="text-[10px] text-muted-foreground">
                Score = streak (40%) + recency (30%) + velocity (20%) + XP (10%). 🚨 = score &lt;30 or 5+ days inactive.
            </p>
        </div>
    );
};

export default StudentMotivationTable;

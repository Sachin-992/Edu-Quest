import { motion } from "framer-motion";
import type { SubjectEnjoyment } from "@/lib/engagementAnalytics";

interface Props {
    data: SubjectEnjoyment[];
}

const COLORS = [
    "from-emerald-400 to-green-500",
    "from-blue-400 to-indigo-500",
    "from-amber-400 to-orange-500",
    "from-pink-400 to-rose-500",
    "from-purple-400 to-violet-500",
    "from-cyan-400 to-teal-500",
    "from-red-400 to-rose-600",
    "from-lime-400 to-green-600",
];

const SubjectEnjoymentChart = ({ data }: Props) => {
    const max = Math.max(1, ...data.map((d) => d.enjoymentScore));

    return (
        <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
            <div className="flex items-center gap-2">
                <span className="text-lg">💖</span>
                <h3 className="font-bold text-sm">Most Enjoyed Subjects</h3>
            </div>

            {data.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
            ) : (
                <div className="space-y-3">
                    {data.map((s, i) => (
                        <div key={s.subjectId} className="flex items-center gap-3">
                            <span className="w-28 text-xs font-semibold text-muted-foreground truncate">
                                {s.subjectName}
                            </span>
                            <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(s.enjoymentScore / max) * 100}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                                    className={`h-full rounded-full bg-gradient-to-r ${COLORS[i % COLORS.length]} flex items-center justify-end pr-2`}
                                >
                                    <span className="text-[10px] font-black text-white drop-shadow-sm">
                                        {s.completionCount}
                                    </span>
                                </motion.div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-[10px] text-muted-foreground text-right">
                Ranked by completion count
            </p>
        </div>
    );
};

export default SubjectEnjoymentChart;

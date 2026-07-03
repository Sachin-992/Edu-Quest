import { motion } from "framer-motion";

interface Props {
    matrix: number[][]; // 7 days × 24 hours
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getColor(value: number, max: number): string {
    if (value === 0) return "bg-muted/20";
    const ratio = value / Math.max(1, max);
    if (ratio > 0.75) return "bg-emerald-500";
    if (ratio > 0.5) return "bg-emerald-400";
    if (ratio > 0.25) return "bg-emerald-300 dark:bg-emerald-600";
    return "bg-emerald-200 dark:bg-emerald-800";
}

const EngagementHeatmap = ({ matrix }: Props) => {
    const flatMax = Math.max(1, ...matrix.flat());

    // Show only hours 6-22 for cleaner display
    const startHour = 6;
    const endHour = 22;
    const hours = Array.from({ length: endHour - startHour }, (_, i) => i + startHour);

    return (
        <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
            <div className="flex items-center gap-2">
                <span className="text-lg">🟩</span>
                <h3 className="font-bold text-sm">Engagement Heatmap</h3>
                <span className="text-[10px] text-muted-foreground ml-auto">IST timezone</span>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[400px]">
                    {/* Hour labels */}
                    <div className="flex gap-[2px] ml-10 mb-1">
                        {hours.map((h) => (
                            <div
                                key={h}
                                className="flex-1 text-center text-[8px] text-muted-foreground font-medium"
                            >
                                {h % 3 === 0 ? `${h}` : ""}
                            </div>
                        ))}
                    </div>

                    {/* Grid rows */}
                    {DAY_LABELS.map((day, dayIdx) => (
                        <div key={day} className="flex items-center gap-[2px] mb-[2px]">
                            <span className="w-9 text-[10px] font-semibold text-muted-foreground text-right pr-1">
                                {day}
                            </span>
                            {hours.map((h) => {
                                const value = matrix[dayIdx]?.[h] ?? 0;
                                return (
                                    <motion.div
                                        key={h}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: (dayIdx * hours.length + (h - startHour)) * 0.003 }}
                                        title={`${day} ${h}:00 — ${value} activities`}
                                        className={`flex-1 aspect-square rounded-[3px] ${getColor(value, flatMax)} transition-colors cursor-default`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-1.5">
                <span className="text-[9px] text-muted-foreground">Less</span>
                <div className="h-3 w-3 rounded-[2px] bg-muted/20" />
                <div className="h-3 w-3 rounded-[2px] bg-emerald-200 dark:bg-emerald-800" />
                <div className="h-3 w-3 rounded-[2px] bg-emerald-300 dark:bg-emerald-600" />
                <div className="h-3 w-3 rounded-[2px] bg-emerald-400" />
                <div className="h-3 w-3 rounded-[2px] bg-emerald-500" />
                <span className="text-[9px] text-muted-foreground">More</span>
            </div>
        </div>
    );
};

export default EngagementHeatmap;

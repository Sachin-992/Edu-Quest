import { motion } from "framer-motion";
import type { DailyEngagement } from "@/lib/engagementAnalytics";

interface Props {
    data: DailyEngagement[];
}

const EngagementTrendLine = ({ data }: Props) => {
    if (data.length === 0) {
        return (
            <div className="rounded-2xl bg-card border border-border/40 p-5 text-center">
                <p className="text-sm text-muted-foreground">No engagement data</p>
            </div>
        );
    }

    const maxUsers = Math.max(1, ...data.map((d) => d.activeUsers));
    const maxCompletions = Math.max(1, ...data.map((d) => d.completions));
    const totalCompletions = data.reduce((s, d) => s + d.completions, 0);
    const avgDailyActive = (data.reduce((s, d) => s + d.activeUsers, 0) / data.length).toFixed(1);

    // SVG dimensions
    const W = 500;
    const H = 140;
    const padL = 0;
    const padR = 0;
    const padT = 10;
    const padB = 20;
    const graphW = W - padL - padR;
    const graphH = H - padT - padB;

    const xStep = data.length > 1 ? graphW / (data.length - 1) : graphW;

    // Build path for active users
    const userPoints = data.map((d, i) => ({
        x: padL + i * xStep,
        y: padT + graphH - (d.activeUsers / maxUsers) * graphH,
    }));

    const completionPoints = data.map((d, i) => ({
        x: padL + i * xStep,
        y: padT + graphH - (d.completions / maxCompletions) * graphH,
    }));

    const toPathD = (pts: { x: number; y: number }[]) =>
        pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

    const toAreaD = (pts: { x: number; y: number }[]) => {
        const baseline = padT + graphH;
        return `${toPathD(pts)} L${pts[pts.length - 1].x},${baseline} L${pts[0].x},${baseline} Z`;
    };

    return (
        <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📈</span>
                    <h3 className="font-bold text-sm">Engagement Trend (30 Days)</h3>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-4 rounded-full bg-primary inline-block" /> Active Users
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-4 rounded-full bg-amber-400 inline-block" /> Completions
                    </span>
                </div>
            </div>

            {/* Stat summary */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 text-center">
                    <p className="text-xl font-black text-primary">{avgDailyActive}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">Avg Daily Active</p>
                </div>
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-3 text-center">
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400">{totalCompletions}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">Total Completions</p>
                </div>
            </div>

            {/* SVG chart */}
            <div className="w-full overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75].map((pct) => (
                        <line
                            key={pct}
                            x1={padL}
                            x2={W - padR}
                            y1={padT + graphH * (1 - pct)}
                            y2={padT + graphH * (1 - pct)}
                            stroke="hsl(var(--muted-foreground)/0.1)"
                            strokeDasharray="4 4"
                        />
                    ))}

                    {/* Completion area + line */}
                    <motion.path
                        d={toAreaD(completionPoints)}
                        fill="hsl(40 90% 55% / 0.1)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    />
                    <motion.path
                        d={toPathD(completionPoints)}
                        fill="none"
                        stroke="hsl(40 90% 55%)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, delay: 0.3 }}
                    />

                    {/* User area + line */}
                    <motion.path
                        d={toAreaD(userPoints)}
                        fill="hsl(var(--primary) / 0.08)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    />
                    <motion.path
                        d={toPathD(userPoints)}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2 }}
                    />

                    {/* X-axis date labels — show every 5th */}
                    {data.map((d, i) =>
                        i % 5 === 0 ? (
                            <text
                                key={d.date}
                                x={padL + i * xStep}
                                y={H - 2}
                                textAnchor="middle"
                                fill="hsl(var(--muted-foreground))"
                                fontSize="8"
                                fontWeight="600"
                            >
                                {d.date.slice(5)} {/* MM-DD */}
                            </text>
                        ) : null
                    )}
                </svg>
            </div>
        </div>
    );
};

export default EngagementTrendLine;

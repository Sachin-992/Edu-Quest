import { useEffect, useState, useMemo } from "react";
import { getAdminClient } from "@/integrations/supabase/adminClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Flame, Brain, AlertTriangle, TrendingUp, TrendingDown, Minus,
    ArrowRight, Zap, Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import {
    computeEngagementTrend,
    computeMotivationScores,
    computeStudentStreaks,
    type ProgressRow,
    type StudentProfile,
} from "@/lib/engagementAnalytics";

/* ─── Types ─── */
interface EngagementInsightsProps {
    onNavigate: (tab: string) => void;
    isTeacher?: boolean;
    assignedClasses?: number[];
    assignedSubjects?: string[];
    assignments?: any[];
}

/* ─── Helpers ─── */
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function heatColor(val: number, max: number) {
    if (max === 0) return "bg-muted/30";
    const ratio = val / max;
    if (ratio >= 0.75) return "bg-emerald-500";
    if (ratio >= 0.5) return "bg-emerald-400";
    if (ratio >= 0.25) return "bg-emerald-300";
    if (ratio > 0) return "bg-emerald-200";
    return "bg-muted/30";
}

/* ─── Smart Insight Generator ─── */
function generateInsights(
    trend: { date: string; activeUsers: number; completions: number }[],
    atRisk: { fullName: string; classLevel: string; motivationScore: number; daysSinceLastActive: number; trend: string }[]
): string[] {
    const insights: string[] = [];

    // Best day of week
    const dayMap = new Map<number, number>();
    trend.forEach((t) => {
        const dow = new Date(t.date).getDay();
        dayMap.set(dow, (dayMap.get(dow) || 0) + t.completions);
    });
    let bestDay = 0, bestCount = 0;
    dayMap.forEach((count, day) => { if (count > bestCount) { bestCount = count; bestDay = day; } });
    if (bestCount > 0) insights.push(`${DAY_LABELS[bestDay]} shows the highest lesson completion rate this month.`);

    // Week-over-week trend
    const thisWeek = trend.slice(-7).reduce((s, d) => s + d.activeUsers, 0);
    const lastWeek = trend.slice(-14, -7).reduce((s, d) => s + d.activeUsers, 0);
    if (lastWeek > 0) {
        const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
        if (pct > 0) insights.push(`Weekly engagement is up ${pct}% compared to last week.`);
        else if (pct < 0) insights.push(`Weekly engagement dropped ${Math.abs(pct)}% — consider a motivational quiz.`);
    }

    // At‑risk insight
    if (atRisk.length > 0) {
        insights.push(`${atRisk[0].fullName} (Class ${atRisk[0].classLevel}) needs encouragement — ${atRisk[0].daysSinceLastActive}d inactive.`);
    }

    // Fallback
    if (insights.length === 0) insights.push("Activity data is building up — insights will appear with more student interactions.");

    return insights.slice(0, 3);
}

/* ─── Main Component ─── */
const EngagementInsights = ({
    onNavigate,
    isTeacher = false,
    assignedClasses = [],
    assignedSubjects = [],
    assignments = [],
}: EngagementInsightsProps) => {
    const [loading, setLoading] = useState(true);
    const [trend, setTrend] = useState<{ date: string; activeUsers: number; completions: number }[]>([]);
    const [atRisk, setAtRisk] = useState<{ fullName: string; classLevel: string; motivationScore: number; daysSinceLastActive: number; trend: string }[]>([]);
    const [weeklyData, setWeeklyData] = useState<{ day: string; count: number }[]>([]);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            let profilesQuery = getAdminClient()
                .from("profiles")
                .select("user_id, full_name, class_level")
                .not("roll_number", "is", null);

            if (isTeacher) {
                profilesQuery = profilesQuery.in("class_level", assignedClasses);
            }

            const [progressRes, profilesRes] = await Promise.all([
                getAdminClient()
                    .from("student_progress")
                    .select("user_id, lesson_id, quiz_id, status, xp_earned, score, completed_at")
                    .eq("status", "completed"),
                profilesQuery,
            ]);

            const students: StudentProfile[] = (profilesRes.data || []).map((r: any) => ({
                id: r.user_id,
                full_name: r.full_name,
                class_level: r.class_level ? String(r.class_level) : null,
            }));

            const studentUserIds = students.map((s) => s.id);

            const progress: ProgressRow[] = (progressRes.data || [])
                .filter((r: any) => !isTeacher || studentUserIds.includes(r.user_id))
                .map((r: any) => ({
                    user_id: r.user_id,
                    lesson_id: r.lesson_id,
                    quiz_id: r.quiz_id,
                    status: r.status,
                    xp_earned: r.xp_earned || 0,
                    score: r.score,
                    completed_at: r.completed_at,
                }));

            // Compute engagement trend
            const engTrend = computeEngagementTrend(progress);
            setTrend(engTrend);

            // Weekly heatmap: aggregate last 7 days by day-of-week
            const last7 = engTrend.slice(-7);
            const weekly = last7.map((d) => ({
                day: DAY_LABELS[new Date(d.date).getDay()],
                count: d.completions,
            }));
            setWeeklyData(weekly);

            // At-risk students
            const streaks = computeStudentStreaks(progress, students);
            const motivation = computeMotivationScores(progress, students, streaks);
            const risk = motivation
                .filter((m) => m.needsEncouragement)
                .slice(0, 2)
                .map((m) => ({
                    fullName: m.fullName,
                    classLevel: m.classLevel,
                    motivationScore: m.motivationScore,
                    daysSinceLastActive: m.daysSinceLastActive,
                    trend: m.trend,
                }));
            setAtRisk(risk);
            setLoading(false);
        };
        fetch();
    }, [isTeacher, assignedClasses]);

    const insights = useMemo(() => generateInsights(trend, atRisk), [trend, atRisk]);
    const maxCount = useMemo(() => Math.max(...weeklyData.map((d) => d.count), 1), [weeklyData]);

    // Week-over-week comparison
    const thisWeekTotal = trend.slice(-7).reduce((s, d) => s + d.completions, 0);
    const lastWeekTotal = trend.slice(-14, -7).reduce((s, d) => s + d.completions, 0);
    const weekDiff = lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : 0;

    if (loading) {
        return (
            <section className="flex flex-col gap-5 lg:gap-6 xl:gap-8">
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
            </section>
        );
    }

    return (
        <section className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-6 lg:p-8 shadow-sm flex flex-col gap-6 lg:gap-8 h-full">
            {/* ── Section Header ── */}
            <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Zap className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                    <h2 className="font-bold text-base xl:text-lg leading-tight">Engagement Insights</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Behavior signals & predictions</p>
                </div>
            </div>

            <div className="flex flex-col gap-6 flex-1 justify-around">
                {/* ── LEFT: Weekly Engagement Heatmap ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="relative w-full"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5">
                            <Flame className="h-5 w-5 text-orange-500" />
                            <h3 className="font-bold text-sm xl:text-base">Weekly Engagement Pulse</h3>
                        </div>
                        {weekDiff !== 0 && (
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${weekDiff > 0
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                                : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                                }`}>
                                {weekDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                {weekDiff > 0 ? "+" : ""}{weekDiff}% vs last week
                            </span>
                        )}
                    </div>

                    {/* Mini Heatmap Grid */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {weeklyData.map((d, i) => (
                            <motion.div
                                key={d.day}
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * 0.05 + 0.2, duration: 0.3 }}
                                className="flex flex-col items-center gap-1.5"
                            >
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase">{d.day}</span>
                                <div
                                    className={`w-full aspect-square rounded-lg ${heatColor(d.count, maxCount)} transition-colors duration-300 flex items-center justify-center`}
                                    title={`${d.count} completions`}
                                >
                                    <span className="text-[10px] font-bold text-white/80">{d.count || ""}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Bar chart */}
                    <div className="flex items-end gap-2 h-16">
                        {weeklyData.map((d, i) => (
                            <motion.div
                                key={`bar-${d.day}`}
                                className="flex-1 flex flex-col items-center"
                                initial={{ height: 0 }}
                                animate={{ height: "100%" }}
                                transition={{ delay: i * 0.05 + 0.4, duration: 0.5 }}
                            >
                                <div className="w-full flex items-end justify-center h-full">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${maxCount > 0 ? Math.max(8, (d.count / maxCount) * 100) : 8}%` }}
                                        transition={{ delay: i * 0.06 + 0.5, duration: 0.6, ease: "easeOut" }}
                                        className="w-full max-w-[32px] rounded-t-md bg-gradient-to-t from-emerald-500 to-teal-400"
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <p className="text-[10px] text-muted-foreground mt-3 text-center">
                        <Clock className="inline h-3 w-3 mr-1" />
                        Last 7 days · {thisWeekTotal} total completions
                    </p>
                </motion.div>

                {/* ── RIGHT: AI Insight Engine ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className="relative w-full flex flex-col pt-4 border-t border-border/40"
                >
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="relative">
                            <Brain className="h-5 w-5 text-violet-500" />
                            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-violet-500 animate-ping" />
                        </div>
                        <h3 className="font-bold text-sm xl:text-base">AI Engagement Insight</h3>
                    </div>

                    {/* Insights List */}
                    <div className="space-y-3 flex-1">
                        {insights.map((insight, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.15 + 0.3, duration: 0.35 }}
                                className="flex gap-3 items-start p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                                <span className="mt-0.5 h-5 w-5 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                                    <Zap className="h-3 w-3 text-white" />
                                </span>
                                <p className="text-sm text-foreground/90 leading-relaxed">{insight}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA */}
                    <Button
                        onClick={() => onNavigate("engagement")}
                        variant="outline"
                        className="mt-5 w-full gap-2 rounded-xl h-10 text-sm font-semibold border-border/50 hover:bg-muted/50"
                    >
                        Detailed Engagement
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </motion.div>
            </div>

            {/* ── Students At Risk Mini-Panel ── */}
            {atRisk.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.25 }}
                    className="relative w-full flex flex-col flex-1 justify-end pt-4 border-t border-red-200/40 dark:border-red-500/20"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Students At Risk</h3>
                                <p className="text-[10px] text-muted-foreground">Declining activity detected</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {atRisk.map((s, i) => (
                            <motion.div
                                key={s.fullName}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 + 0.35, duration: 0.3 }}
                                className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-100/30 dark:border-red-500/10"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                        {s.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm truncate">{s.fullName}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Class {s.classLevel} · {s.daysSinceLastActive}d inactive ·
                                            <span className="text-red-500 font-semibold ml-1">
                                                {s.trend === "down" ? <TrendingDown className="inline h-3 w-3" /> : <Minus className="inline h-3 w-3" />}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-lg font-black text-red-500">{s.motivationScore}</span>
                                    <span className="text-[10px] text-muted-foreground block">score</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </section>
    );
};

export default EngagementInsights;

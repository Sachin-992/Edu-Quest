import { useEffect, useState } from "react";
import { getAdminClient } from "@/integrations/supabase/adminClient";
import { useAuth } from "@/contexts/AuthContext";
import {
    BarChart3, Users, BookOpen, Brain, TrendingUp, Activity,
    Zap, Clock
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SchoolStats {
    total_students: number;
    lessons_completed: number;
    quizzes_completed: number;
    avg_quiz_score: number;
    total_xp_earned: number;
    active_7d: number;
    active_30d: number;
}

interface AIUsage {
    used: number;
    quota: number;
}

const SchoolAnalytics = () => {
    const { profile } = useAuth();
    const [stats, setStats] = useState<SchoolStats | null>(null);
    const [aiUsage, setAiUsage] = useState<AIUsage>({ used: 0, quota: 20 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!profile?.school_id) {
                setLoading(false);
                return;
            }

            try {
                // Fetch student count
                const { count: studentCount } = await getAdminClient()
                    .from("profiles")
                    .select("*", { count: "exact", head: true })
                    .eq("school_id", profile.school_id);

                // Fetch progress stats
                const { data: progressData } = await getAdminClient()
                    .from("student_progress")
                    .select("status, score, xp_earned, quiz_id, lesson_id, updated_at, user_id")
                    .eq("school_id", profile.school_id);

                const now = new Date();
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                // Include all statuses (in_progress, completed, etc) to accurately gauge activity
                const completed = progressData?.filter(p => p.status === "completed") || [];
                const quizzes = completed.filter(p => p.quiz_id);
                const lessons = completed.filter(p => p.lesson_id);

                // Calculate average score only from completed quizzes
                const scores = quizzes.map(q => q.score).filter(s => s != null) as number[];
                const avgScore = scores.length > 0
                    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                    : 0;

                const totalXP = progressData?.reduce((sum, p) => sum + (p.xp_earned || 0), 0) || 0;

                // Unique active users in the last 7 and 30 days regardless of status
                const uniqueUsers7d = new Set(
                    progressData?.filter(p => new Date(p.updated_at) > sevenDaysAgo).map(p => p.user_id) || []
                ).size;
                const uniqueUsers30d = new Set(
                    progressData?.filter(p => new Date(p.updated_at) > thirtyDaysAgo).map(p => p.user_id) || []
                ).size;

                setStats({
                    total_students: studentCount || 0,
                    lessons_completed: lessons.length,
                    quizzes_completed: quizzes.length,
                    avg_quiz_score: avgScore,
                    total_xp_earned: totalXP,
                    active_7d: uniqueUsers7d,
                    active_30d: uniqueUsers30d,
                });

                // Fetch AI usage
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                const { count: aiCount } = await getAdminClient()
                    .from("ai_usage")
                    .select("*", { count: "exact", head: true })
                    .eq("school_id", profile.school_id)
                    .gte("created_at", startOfMonth);

                // Get quota from subscription plan
                const { data: school } = await getAdminClient()
                    .from("schools")
                    .select("plan_id")
                    .eq("id", profile.school_id)
                    .maybeSingle();

                let quota = 20;
                if (school?.plan_id) {
                    const { data: plan } = await getAdminClient()
                        .from("subscription_plans")
                        .select("ai_quiz_quota_monthly")
                        .eq("id", school.plan_id)
                        .maybeSingle();
                    if (plan) quota = plan.ai_quiz_quota_monthly;
                }

                setAiUsage({ used: aiCount || 0, quota });
            } catch (err) {
                console.error("[SchoolAnalytics] Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [profile?.school_id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-16 text-muted-foreground">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No analytics data yet</p>
                <p className="text-sm mt-1">Data will appear once students start learning.</p>
            </div>
        );
    }

    const engagementRate = stats.total_students > 0
        ? Math.round((stats.active_7d / stats.total_students) * 100)
        : 0;

    const aiPercent = aiUsage.quota > 0
        ? Math.round((aiUsage.used / aiUsage.quota) * 100)
        : 0;

    const metricCards = [
        { icon: Users, label: "Total Students", value: stats.total_students, color: "text-blue-500", bg: "bg-blue-500/10" },
        { icon: Activity, label: "Active (7d)", value: stats.active_7d, color: "text-green-500", bg: "bg-green-500/10" },
        { icon: BookOpen, label: "Lessons Done", value: stats.lessons_completed, color: "text-purple-500", bg: "bg-purple-500/10" },
        { icon: Brain, label: "Quizzes Done", value: stats.quizzes_completed, color: "text-orange-500", bg: "bg-orange-500/10" },
        { icon: TrendingUp, label: "Avg Score", value: `${stats.avg_quiz_score}%`, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { icon: Zap, label: "Total XP", value: stats.total_xp_earned.toLocaleString(), color: "text-yellow-500", bg: "bg-yellow-500/10" },
    ];

    return (
        <div className="space-y-6">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {metricCards.map((card) => (
                    <div
                        key={card.label}
                        className="rounded-xl border border-border/40 bg-card/60 p-4 space-y-2"
                    >
                        <div className={`inline-flex p-2 rounded-lg ${card.bg}`}>
                            <card.icon className={`w-4 h-4 ${card.color}`} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground">{card.value}</p>
                            <p className="text-[11px] text-muted-foreground font-medium">{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Engagement & AI Usage Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Engagement Rate */}
                <div className="rounded-xl border border-border/40 bg-card/60 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" />
                            Student Engagement
                        </h3>
                        <span className="text-lg font-black text-primary">{engagementRate}%</span>
                    </div>
                    <Progress value={engagementRate} className="h-2.5" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{stats.active_7d} active this week</span>
                        <span>{stats.active_30d} active this month</span>
                    </div>
                </div>

                {/* AI Quiz Usage */}
                <div className="rounded-xl border border-border/40 bg-card/60 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Brain className="w-4 h-4 text-violet-500" />
                            AI Quiz Generation
                        </h3>
                        <span className="text-lg font-black text-violet-500">{aiUsage.used}/{aiUsage.quota === -1 ? "∞" : aiUsage.quota}</span>
                    </div>
                    <Progress
                        value={aiUsage.quota === -1 ? 10 : aiPercent}
                        className={`h-2.5 ${aiPercent > 80 ? "[&>div]:bg-red-500" : "[&>div]:bg-violet-500"}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Used this month</span>
                        <span className={aiPercent > 80 ? "text-red-500 font-medium" : ""}>
                            {aiUsage.quota === -1 ? "Unlimited plan" : `${100 - aiPercent}% remaining`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Recent Audit Activity */}
            <AuditLogPreview schoolId={profile?.school_id} />
        </div>
    );
};

/* ── Audit Log Preview ── */
const AuditLogPreview = ({ schoolId }: { schoolId?: string }) => {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        if (!schoolId) return;
        getAdminClient()
            .from("audit_log")
            .select("action, metadata, created_at")
            .eq("school_id", schoolId)
            .order("created_at", { ascending: false })
            .limit(10)
            .then(({ data }) => {
                if (data) setLogs(data);
            });
    }, [schoolId]);

    if (logs.length === 0) return null;

    const actionLabels: Record<string, { label: string; emoji: string }> = {
        "student.create": { label: "Student created", emoji: "👤" },
        "quiz.ai_generate": { label: "AI quiz generated", emoji: "🤖" },
        "login.student.success": { label: "Student login", emoji: "🔑" },
    };

    return (
        <div className="rounded-xl border border-border/40 bg-card/60 p-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Recent Activity
            </h3>
            <div className="space-y-2.5">
                {logs.map((log, i) => {
                    const info = actionLabels[log.action] || { label: log.action, emoji: "📝" };
                    const time = new Date(log.created_at).toLocaleString("en-IN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    });
                    return (
                        <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="text-base">{info.emoji}</span>
                            <span className="flex-1 text-foreground font-medium">{info.label}</span>
                            <span className="text-xs text-muted-foreground">{time}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SchoolAnalytics;

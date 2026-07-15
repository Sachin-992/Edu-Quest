import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Building2, Users, Brain, TrendingUp, DollarSign,
    RefreshCw, LogOut, Shield, BarChart3, Activity
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SchoolRow {
    id: string;
    name: string;
    code: string;
    subscription_status: string;
    plan_name: string;
    student_count: number;
    ai_usage_count: number;
}

interface PlatformStats {
    total_schools: number;
    total_students: number;
    total_ai_calls: number;
    active_schools: number;
}

const PlatformAdmin = () => {
    const { signOut } = useAuth();
    const [schools, setSchools] = useState<SchoolRow[]>([]);
    const [stats, setStats] = useState<PlatformStats>({ total_schools: 0, total_students: 0, total_ai_calls: 0, active_schools: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch schools with plan names
            const { data: schoolsData } = await supabase
                .from("schools")
                .select("id, name, code, subscription_status, plan_id")
                .order("name");

            if (!schoolsData) {
                setLoading(false);
                return;
            }

            // Get plan names
            const { data: plans } = await supabase
                .from("subscription_plans")
                .select("id, name");
            const planMap = new Map(plans?.map(p => [p.id, p.name]) || []);

            // Get per-school student counts
            const { data: profiles } = await supabase
                .from("profiles")
                .select("school_id");

            const studentCounts = new Map<string, number>();
            profiles?.forEach(p => {
                if (p.school_id) studentCounts.set(p.school_id, (studentCounts.get(p.school_id) || 0) + 1);
            });

            // Get per-school AI usage this month
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
            const { data: aiData } = await supabase
                .from("ai_usage")
                .select("school_id")
                .gte("created_at", startOfMonth);

            const aiCounts = new Map<string, number>();
            aiData?.forEach(a => {
                if (a.school_id) aiCounts.set(a.school_id, (aiCounts.get(a.school_id) || 0) + 1);
            });

            const rows: SchoolRow[] = schoolsData.map(s => ({
                id: s.id,
                name: s.name,
                code: s.code || "—",
                subscription_status: s.subscription_status || "trial",
                plan_name: planMap.get(s.plan_id) || "Free",
                student_count: studentCounts.get(s.id) || 0,
                ai_usage_count: aiCounts.get(s.id) || 0,
            }));

            setSchools(rows);
            setStats({
                total_schools: rows.length,
                total_students: Array.from(studentCounts.values()).reduce((a, b) => a + b, 0),
                total_ai_calls: Array.from(aiCounts.values()).reduce((a, b) => a + b, 0),
                active_schools: rows.filter(r => r.student_count > 0).length,
            });
        } catch (err) {
            console.error("[PlatformAdmin] Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            active: "bg-green-500/10 text-green-600",
            trial: "bg-blue-500/10 text-blue-600",
            expired: "bg-red-500/10 text-red-600",
            cancelled: "bg-gray-500/10 text-gray-500",
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${colors[status] || colors.trial}`}>
                {status}
            </span>
        );
    };

    const statCards = [
        { icon: Building2, label: "Total Schools", value: stats.total_schools, color: "text-blue-500", bg: "bg-blue-500/10" },
        { icon: Users, label: "Total Students", value: stats.total_students, color: "text-green-500", bg: "bg-green-500/10" },
        { icon: Activity, label: "Active Schools", value: stats.active_schools, color: "text-purple-500", bg: "bg-purple-500/10" },
        { icon: Brain, label: "AI Calls (Month)", value: stats.total_ai_calls, color: "text-orange-500", bg: "bg-orange-500/10" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-border/30 bg-card/70 backdrop-blur-xl">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between px-5 md:px-8 h-16">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-extrabold text-foreground">Platform Admin</h1>
                            <p className="text-xs text-muted-foreground">Cross-school management</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={fetchData} className="h-9 w-9 rounded-xl">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={signOut} className="h-9 w-9 rounded-xl text-destructive">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto px-5 md:px-8 py-7 space-y-7">
                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((card) => (
                        <div key={card.label} className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 space-y-2">
                            <div className={`inline-flex p-2.5 rounded-lg ${card.bg}`}>
                                <card.icon className={`w-5 h-5 ${card.color}`} />
                            </div>
                            <p className="text-2xl font-black text-foreground">{card.value}</p>
                            <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                        </div>
                    ))}
                </div>

                {/* Schools Table */}
                <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-bold text-foreground">All Schools</h2>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : schools.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground text-sm">
                            No schools registered yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/30 text-left">
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">School</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Code</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Plan</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Students</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">AI (Month)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schools.map((school) => (
                                        <tr key={school.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                                            <td className="px-5 py-3.5 font-semibold text-foreground">{school.name}</td>
                                            <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{school.code}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold">
                                                    {school.plan_name}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">{statusBadge(school.subscription_status)}</td>
                                            <td className="px-5 py-3.5 text-right font-bold">{school.student_count}</td>
                                            <td className="px-5 py-3.5 text-right font-mono">{school.ai_usage_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PlatformAdmin;

import { useEffect, useState, useMemo, useCallback } from "react";
import { getAdminClient } from "@/integrations/supabase/adminClient";
import { onQuizComplete, onActivityComplete } from "@/lib/quizSyncBus";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Users } from "lucide-react";
import { motion } from "framer-motion";

interface ClassData {
    classLevel: number;
    studentCount: number;
    avgScore: number;
    totalAttempts: number;
}

const strengthGradient = (avg: number) => {
    if (avg >= 70) return "from-emerald-400 to-emerald-500";
    if (avg >= 40) return "from-amber-400 to-yellow-500";
    return "from-red-400 to-red-500";
};

const strengthBg = (avg: number) => {
    if (avg >= 70) return "bg-emerald-50 dark:bg-emerald-950/30";
    if (avg >= 40) return "bg-amber-50 dark:bg-amber-950/30";
    return "bg-red-50 dark:bg-red-950/30";
};

const strengthText = (avg: number) => {
    if (avg >= 70) return "text-emerald-700 dark:text-emerald-400";
    if (avg >= 40) return "text-amber-700 dark:text-amber-400";
    return "text-red-700 dark:text-red-400";
};

interface ClassOverviewProps {
    isTeacher?: boolean;
    assignedClasses?: number[];
    assignedSubjects?: string[];
    assignments?: any[];
}

const ClassOverview = ({
    isTeacher = false,
    assignedClasses = [],
    assignedSubjects = [],
    assignments = [],
}: ClassOverviewProps) => {
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<ClassData[]>([]);

    const fetchClassData = useCallback(async () => {
        setLoading(true);
        let profilesQuery = getAdminClient().from("profiles").select("user_id, class_level").not("roll_number", "is", null).not("class_level", "is", null);
        if (isTeacher) {
            profilesQuery = profilesQuery.in("class_level", assignedClasses);
        }

        const [profilesRes, progressRes] = await Promise.all([
            profilesQuery,
            getAdminClient().from("student_progress").select("user_id, score, quiz_id").not("quiz_id", "is", null).not("score", "is", null),
        ]);

        const profiles = profilesRes.data || [];
        const progress = progressRes.data || [];

        const userClass = new Map<string, number>();
        profiles.forEach(p => userClass.set(p.user_id, p.class_level!));

        const classMap = new Map<number, { scores: number[]; students: Set<string>; attempts: number }>();
        const targetClasses = isTeacher ? assignedClasses : Array.from({ length: 8 }, (_, i) => i + 1);
        targetClasses.forEach(i => classMap.set(i, { scores: [], students: new Set(), attempts: 0 }));

        profiles.forEach(p => classMap.get(p.class_level!)?.students.add(p.user_id));
        progress.forEach(p => {
            const cl = userClass.get(p.user_id);
            if (cl && classMap.has(cl)) {
                const entry = classMap.get(cl)!;
                entry.scores.push(p.score!);
                entry.attempts++;
            }
        });

        const result: ClassData[] = [];
        classMap.forEach((val, key) => {
            if (val.students.size > 0 || isTeacher) {
                result.push({
                    classLevel: key,
                    studentCount: val.students.size,
                    avgScore: val.scores.length > 0 ? Math.round(val.scores.reduce((a, b) => a + b, 0) / val.scores.length) : 0,
                    totalAttempts: val.attempts,
                });
            }
        });
        result.sort((a, b) => a.classLevel - b.classLevel);
        setClasses(result);
        setLoading(false);
    }, [isTeacher, assignedClasses]);

    useEffect(() => {
        fetchClassData();
        const interval = setInterval(fetchClassData, 60000);
        return () => clearInterval(interval);
    }, [fetchClassData]);

    // Instant refresh on quiz or activity completion
    useEffect(() => {
        const unsub1 = onQuizComplete(() => fetchClassData());
        const unsub2 = onActivityComplete(() => fetchClassData());
        return () => { unsub1(); unsub2(); };
    }, [fetchClassData]);

    const maxScore = useMemo(() => Math.max(...classes.map(c => c.avgScore), 1), [classes]);

    if (loading) {
        return (
            <div className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-5">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <h3 className="font-bold text-base">Class Performance</h3>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                    <h3 className="font-bold text-base leading-tight">Class Performance</h3>
                    <p className="text-[11px] text-muted-foreground">Average quiz scores by class</p>
                </div>
            </div>

            {classes.length === 0 ? (
                <div className="text-center py-10">
                    <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No class data available</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {classes.map((c, i) => (
                        <motion.div
                            key={c.classLevel}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.35 }}
                            className={`flex items-center gap-4 p-3.5 rounded-xl ${strengthBg(c.avgScore)} transition-all hover:shadow-md group cursor-default`}
                        >
                            {/* Class Badge */}
                            <div className="h-10 w-10 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center font-black text-sm text-foreground shadow-sm flex-shrink-0">
                                {c.classLevel}
                            </div>

                            {/* Bar + Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="font-semibold text-sm text-foreground">Class {c.classLevel}</span>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-muted-foreground">{c.studentCount} students</span>
                                        <span className={`font-black text-sm ${strengthText(c.avgScore)}`}>
                                            {c.avgScore > 0 ? `${c.avgScore}%` : "—"}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(4, (c.avgScore / 100) * 100)}%` }}
                                        transition={{ delay: i * 0.06 + 0.3, duration: 0.8, ease: "easeOut" }}
                                        className={`h-full rounded-full bg-gradient-to-r ${strengthGradient(c.avgScore)} shadow-sm`}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClassOverview;

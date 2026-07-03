import { useState, useEffect, useMemo } from "react";
import { getAdminClient } from "@/integrations/supabase/adminClient";
import { onQuizComplete, onActivityComplete } from "@/lib/quizSyncBus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart3, AlertTriangle, TrendingUp, Target, Flame,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import StatCards from "./performance/StatCards";
import PerformanceChart from "./performance/PerformanceChart";
import StudentTable from "./performance/StudentTable";

interface StudentScore {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  class_level: number | null;
  avg_score: number;
  total_xp: number;
  quizzes_taken: number;
  last_active: string | null;
  improvement: number;
}

interface TopicStat {
  subject_name: string;
  subject_icon: string;
  avg_score: number;
  attempts: number;
}

interface ClassPerformanceProps {
  isTeacher?: boolean;
  assignedClasses?: number[];
  assignedSubjects?: string[];
  assignments?: any[];
}

const ClassPerformance = ({
  isTeacher = false,
  assignedClasses = [],
  assignedSubjects = [],
  assignments = [],
}: ClassPerformanceProps) => {
  const [allStudents, setAllStudents] = useState<StudentScore[]>([]);
  const [topics, setTopics] = useState<TopicStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentScore | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("all");

  useEffect(() => {
    fetchData();
    // Poll every 60s so new quiz completions appear automatically
    const interval = setInterval(() => fetchData(), 60000);
    return () => clearInterval(interval);
  }, [isTeacher, assignedClasses]);

  // Instant refresh on quiz completion event
  useEffect(() => {
    const unsub = onQuizComplete(() => fetchData());
    return unsub;
  }, [isTeacher, assignedClasses]);

  useEffect(() => {
    const unsub = onActivityComplete(() => fetchData());
    return unsub;
  }, [isTeacher, assignedClasses]);

  const fetchData = async () => {
    setLoading(true);

    // Use service-role client to bypass RLS (admin needs to see all students)
    const adminClient = getAdminClient();

    let profilesQuery = adminClient.from("profiles").select("user_id, full_name, avatar_url, class_level").not("roll_number", "is", null);
    if (isTeacher) {
      profilesQuery = profilesQuery.in("class_level", assignedClasses);
    }

    // All 5 queries are independent — run in parallel
    const [progressRes, profilesRes, quizzesRes, lessonsRes, subjectsRes] = await Promise.all([
      adminClient.from("student_progress").select("user_id, score, xp_earned, quiz_id, lesson_id, completed_at, status"),
      profilesQuery,
      adminClient.from("quizzes").select("id, lesson_id"),
      adminClient.from("lessons").select("id, subject_id"),
      adminClient.from("subjects").select("id, name, icon"),
    ]);

    const progress = progressRes.data;
    const profiles = profilesRes.data;
    const quizzes = quizzesRes.data;
    const lessons = lessonsRes.data;
    const subjects = subjectsRes.data;

    // Log any query errors for debugging
    if (progressRes.error) console.error("[ClassPerformance] progress query error:", progressRes.error);
    if (profilesRes.error) console.error("[ClassPerformance] profiles query error:", profilesRes.error);

    if (!profiles || !quizzes || !lessons || !subjects) {
      setLoading(false);
      return;
    }

    // Allow empty progress — students with no activity should still appear
    const safeProgress = progress || [];

    const profileMap = new Map(profiles.map((p) => [p.user_id, p]));
    const quizToLesson = new Map(quizzes.map((q) => [q.id, q.lesson_id]));
    const lessonToSubject = new Map(lessons.map((l) => [l.id, l.subject_id]));
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    const studentMap = new Map<string, { scores: number[]; xp: number; quizCount: number; lastActive: string | null; scoreDates: { score: number; date: string }[] }>();
    for (const p of safeProgress) {
      if (!profileMap.has(p.user_id)) continue;
      if (!studentMap.has(p.user_id)) {
        studentMap.set(p.user_id, { scores: [], xp: 0, quizCount: 0, lastActive: null, scoreDates: [] });
      }
      const s = studentMap.get(p.user_id)!;
      // Only count quiz scores for avg_score (not lesson completions / login bonuses)
      if (p.quiz_id && p.score != null) {
        s.scores.push(p.score);
        s.quizCount += 1;
        if (p.completed_at) s.scoreDates.push({ score: p.score, date: p.completed_at });
      }
      // Always count XP and activity from all progress types
      s.xp += p.xp_earned || 0;
      if (p.completed_at && (!s.lastActive || p.completed_at > s.lastActive)) {
        s.lastActive = p.completed_at;
      }
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const studentScores: StudentScore[] = [];
    for (const [userId, data] of studentMap) {
      const profile = profileMap.get(userId);
      if (!profile) continue;
      const recentScores = data.scoreDates.filter((d) => new Date(d.date) >= oneWeekAgo).map((d) => d.score);
      const olderScores = data.scoreDates.filter((d) => { const dt = new Date(d.date); return dt >= twoWeeksAgo && dt < oneWeekAgo; }).map((d) => d.score);
      let improvement = 0;
      if (recentScores.length > 0 && olderScores.length > 0) {
        const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
        improvement = Math.round(recentAvg - olderAvg);
      }
      studentScores.push({
        user_id: userId, full_name: profile.full_name, avatar_url: profile.avatar_url,
        class_level: profile.class_level ?? null,
        avg_score: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
        total_xp: data.xp, quizzes_taken: data.quizCount, last_active: data.lastActive, improvement,
      });
    }

    for (const profile of profiles) {
      if (!studentMap.has(profile.user_id)) {
        studentScores.push({
          user_id: profile.user_id, full_name: profile.full_name, avatar_url: profile.avatar_url,
          class_level: profile.class_level ?? null, avg_score: 0, total_xp: 0,
          quizzes_taken: 0, last_active: null, improvement: 0,
        });
      }
    }

    setAllStudents(studentScores);

    const topicMap = new Map<string, { scores: number[]; attempts: number }>();
    for (const p of safeProgress) {
      if (p.score == null || !p.quiz_id) continue;
      const lessonId = quizToLesson.get(p.quiz_id);
      if (!lessonId) continue;
      const subjectId = lessonToSubject.get(lessonId);
      if (!subjectId) continue;
      if (!topicMap.has(subjectId)) topicMap.set(subjectId, { scores: [], attempts: 0 });
      const t = topicMap.get(subjectId)!;
      t.scores.push(p.score);
      t.attempts += 1;
    }

    const topicStats: TopicStat[] = [];
    for (const [subjectId, data] of topicMap) {
      const sub = subjectMap.get(subjectId);
      if (!sub) continue;
      topicStats.push({
        subject_name: sub.name, subject_icon: sub.icon || "📚",
        avg_score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        attempts: data.attempts,
      });
    }
    topicStats.sort((a, b) => a.avg_score - b.avg_score);
    setTopics(topicStats);
    setLoading(false);
  };

  const availableClasses = useMemo(() => {
    if (isTeacher) return assignedClasses;
    const levels = new Set(allStudents.map((s) => s.class_level).filter((l): l is number => l != null));
    return [...levels].sort((a, b) => a - b);
  }, [allStudents, isTeacher, assignedClasses]);

  const students = useMemo(() => {
    if (selectedClass === "all") return allStudents;
    return allStudents.filter((s) => s.class_level === parseInt(selectedClass));
  }, [allStudents, selectedClass]);

  const classAvg = useMemo(() => {
    const withScores = students.filter((s) => s.quizzes_taken > 0);
    if (withScores.length === 0) return 0;
    return Math.round(withScores.reduce((a, b) => a + b.avg_score, 0) / withScores.length);
  }, [students]);

  const topPerformer = useMemo(() => {
    if (students.length === 0) return null;
    return [...students].sort((a, b) => b.avg_score - a.avg_score)[0];
  }, [students]);

  const completionRate = useMemo(() => {
    const withQuizzes = students.filter((s) => s.quizzes_taken > 0);
    if (students.length === 0) return 0;
    return Math.round((withQuizzes.length / students.length) * 100);
  }, [students]);

  const struggling = useMemo(() => {
    const now = new Date();
    return students.filter((s) => {
      if (s.avg_score > 0 && s.avg_score < 40) return true;
      if (s.quizzes_taken === 0) return true;
      if (s.last_active) {
        const daysSince = (now.getTime() - new Date(s.last_active).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 5) return true;
      }
      return false;
    });
  }, [students]);

  const mostImproved = useMemo(() => {
    return [...students].filter((s) => s.improvement > 0).sort((a, b) => b.improvement - a.improvement).slice(0, 3);
  }, [students]);

  const top5 = useMemo(() => {
    return [...students].sort((a, b) => b.avg_score - a.avg_score).slice(0, 5);
  }, [students]);

  const distributionData = useMemo(() => {
    const buckets = [
      { range: "90-100", count: 0, color: "hsl(var(--primary))" },
      { range: "70-89", count: 0, color: "hsl(142, 71%, 45%)" },
      { range: "40-69", count: 0, color: "hsl(48, 96%, 53%)" },
      { range: "<40", count: 0, color: "hsl(0, 84%, 60%)" },
    ];
    for (const s of students) {
      if (s.quizzes_taken === 0) continue;
      if (s.avg_score >= 90) buckets[0].count++;
      else if (s.avg_score >= 70) buckets[1].count++;
      else if (s.avg_score >= 40) buckets[2].count++;
      else buckets[3].count++;
    }
    return buckets;
  }, [students]);

  const topicStatus = (score: number) => {
    if (score >= 70) return { label: "Strong", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", dot: "🟢" };
    if (score >= 45) return { label: "Medium", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", dot: "🟡" };
    return { label: "Weak", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", dot: "🔴" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> Class Performance Overview
        </h2>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {availableClasses.map((c) => (
              <SelectItem key={c} value={String(c)}>Class {c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards — extracted sub-component */}
      <StatCards
        classAvg={classAvg}
        topPerformerName={topPerformer?.full_name ?? null}
        topPerformerScore={topPerformer?.avg_score ?? 0}
        strugglingCount={struggling.length}
        completionRate={completionRate}
      />

      {/* Score Distribution Chart — extracted sub-component */}
      <PerformanceChart data={distributionData} />

      {/* Most Improved This Week */}
      <div className="bg-card rounded-2xl shadow-card p-5 border-2 border-dashed border-primary/30">
        <h3 className="font-bold mb-4 flex items-center gap-2">🏅 Most Improved This Week</h3>
        {mostImproved.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">Not enough data from the past two weeks to detect improvement yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mostImproved.map((s, i) => (
              <div key={s.user_id} className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-2xl font-black">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.full_name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">+{s.improvement}%</span>
                    <span className="text-xs text-muted-foreground ml-1">vs last week</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top 5 + Struggling side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 — extracted sub-component */}
        <StudentTable
          students={top5}
          onSelectStudent={(s) => { setSelectedStudent(s as StudentScore); setDrawerOpen(true); }}
        />

        {/* Struggling Students */}
        <div className="bg-card rounded-2xl shadow-card p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Struggling Students</h3>
          {struggling.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No struggling students 🎉</p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {struggling.map((s) => {
                const reasons: string[] = [];
                if (s.avg_score > 0 && s.avg_score < 40) reasons.push(`Avg ${s.avg_score}%`);
                if (s.quizzes_taken === 0) reasons.push("No quizzes taken");
                if (s.last_active) {
                  const days = Math.floor((Date.now() - new Date(s.last_active).getTime()) / (1000 * 60 * 60 * 24));
                  if (days > 5) reasons.push(`Inactive ${days}d`);
                }
                return (
                  <div key={s.user_id} className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-sm font-bold text-red-700 dark:text-red-400">
                        {s.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.full_name}</p>
                        <div className="flex gap-1.5 mt-0.5">
                          {reasons.map((r) => (
                            <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">{r}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <Target className="w-3.5 h-3.5" /> Assign Practice
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Topic Heatmap */}
      <div className="bg-card rounded-2xl shadow-card p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /> Topic Performance Heatmap</h3>
        {topics.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No topic data yet</p>
        ) : (
          <div className="space-y-2">
            {topics.map((t) => {
              const status = topicStatus(t.avg_score);
              const barWidth = Math.max(t.avg_score, 5);
              return (
                <div key={t.subject_name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                  <span className="text-xl w-8 text-center">{t.subject_icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{t.subject_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{t.avg_score}%</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                          {status.dot} {status.label}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: t.avg_score >= 70 ? "hsl(142, 71%, 45%)" : t.avg_score >= 45 ? "hsl(48, 96%, 53%)" : "hsl(0, 84%, 60%)",
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t.attempts} quiz attempts</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Student Quick View Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              {selectedStudent && (
                <>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold">
                    {selectedStudent.full_name.charAt(0).toUpperCase()}
                  </div>
                  {selectedStudent.full_name}
                </>
              )}
            </SheetTitle>
          </SheetHeader>
          {selectedStudent && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Avg Score", value: `${selectedStudent.avg_score}%` },
                  { label: "Total XP", value: String(selectedStudent.total_xp) },
                  { label: "Quizzes Taken", value: String(selectedStudent.quizzes_taken) },
                  { label: "Last Active", value: selectedStudent.last_active ? new Date(selectedStudent.last_active).toLocaleDateString() : "Never" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-muted/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold mt-0.5">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <Badge variant={selectedStudent.avg_score >= 70 ? "default" : selectedStudent.avg_score >= 40 ? "secondary" : "destructive"}>
                  {selectedStudent.avg_score >= 70 ? "On Track ✅" : selectedStudent.avg_score >= 40 ? "Needs Attention 🟡" : "At Risk ⚠️"}
                </Badge>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ClassPerformance;

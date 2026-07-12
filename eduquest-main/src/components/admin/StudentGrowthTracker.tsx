import { useState, useEffect, useMemo } from "react";
import { getAdminClient } from "@/integrations/supabase/adminClient";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp, Target, Clock, BookOpen, BarChart3, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { Progress } from "@/components/ui/progress";

interface StudentOption {
  user_id: string;
  full_name: string;
  class_level: number | null;
}

interface QuizAttempt {
  quiz_id: string;
  score: number;
  xp_earned: number;
  completed_at: string;
  subject_name: string;
  subject_icon: string;
}

interface TopicMastery {
  subject_name: string;
  subject_icon: string;
  avg_score: number;
  attempts: number;
  best_score: number;
  trend: "up" | "down" | "stable";
}

const StudentGrowthTracker = () => {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [lessonCount, setLessonCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Fetch student list
  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await getAdminClient()
        .from("profiles")
        .select("user_id, full_name, class_level")
        .not("roll_number", "is", null)
        .order("full_name");
      if (data) setStudents(data);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  // Fetch selected student's data
  useEffect(() => {
    if (!selectedStudentId) return;
    const fetchStudentData = async () => {
      setDataLoading(true);

      const [progressRes, lessonsRes, quizzesRes, allLessonsRes, subjectsRes] = await Promise.all([
        getAdminClient().from("student_progress").select("quiz_id, lesson_id, score, xp_earned, completed_at, status").eq("user_id", selectedStudentId),
        getAdminClient().from("student_progress").select("id").eq("user_id", selectedStudentId).eq("status", "completed").not("lesson_id", "is", null),
        getAdminClient().from("quizzes").select("id, lesson_id"),
        getAdminClient().from("lessons").select("id, subject_id"),
        getAdminClient().from("subjects").select("id, name, icon"),
      ]);

      const progress = progressRes.data || [];
      const quizzes = quizzesRes.data || [];
      const lessons = allLessonsRes.data || [];
      const subjects = subjectsRes.data || [];

      setLessonCount(lessonsRes.data?.length || 0);

      const quizToLesson = new Map(quizzes.map((q) => [q.id, q.lesson_id]));
      const lessonToSubject = new Map(lessons.map((l) => [l.id, l.subject_id]));
      const subjectMap = new Map(subjects.map((s) => [s.id, s]));

      const quizAttempts: QuizAttempt[] = [];
      for (const p of progress) {
        if (!p.quiz_id || p.score == null || !p.completed_at) continue;
        const lessonId = quizToLesson.get(p.quiz_id);
        const subjectId = lessonId ? lessonToSubject.get(lessonId) : null;
        const subject = subjectId ? subjectMap.get(subjectId) : null;
        quizAttempts.push({
          quiz_id: p.quiz_id,
          score: p.score,
          xp_earned: p.xp_earned || 0,
          completed_at: p.completed_at,
          subject_name: subject?.name || "Unknown",
          subject_icon: subject?.icon || "📚",
        });
      }
      quizAttempts.sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());
      setAttempts(quizAttempts);
      setDataLoading(false);
    };
    fetchStudentData();
  }, [selectedStudentId]);

  // Derived stats
  const overallAccuracy = useMemo(() => {
    if (attempts.length === 0) return 0;
    return Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length);
  }, [attempts]);

  const totalXP = useMemo(() => attempts.reduce((s, a) => s + a.xp_earned, 0), [attempts]);

  const scoreTrendData = useMemo(() => {
    return attempts.map((a, i) => ({
      name: `Q${i + 1}`,
      score: a.score,
      date: new Date(a.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    }));
  }, [attempts]);

  const recentTrend = useMemo(() => {
    if (attempts.length < 2) return "stable";
    const recent = attempts.slice(-3);
    const older = attempts.slice(-6, -3);
    if (older.length === 0) return "stable";
    const recentAvg = recent.reduce((s, a) => s + a.score, 0) / recent.length;
    const olderAvg = older.reduce((s, a) => s + a.score, 0) / older.length;
    if (recentAvg > olderAvg + 5) return "up";
    if (recentAvg < olderAvg - 5) return "down";
    return "stable";
  }, [attempts]);

  const topicMastery: TopicMastery[] = useMemo(() => {
    const map = new Map<string, { icon: string; scores: number[]; best: number }>();
    for (const a of attempts) {
      if (!map.has(a.subject_name)) {
        map.set(a.subject_name, { icon: a.subject_icon, scores: [], best: 0 });
      }
      const entry = map.get(a.subject_name)!;
      entry.scores.push(a.score);
      if (a.score > entry.best) entry.best = a.score;
    }
    return Array.from(map.entries()).map(([name, data]) => {
      const avg = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
      let trend: "up" | "down" | "stable" = "stable";
      if (data.scores.length >= 2) {
        const last = data.scores[data.scores.length - 1];
        const prev = data.scores[data.scores.length - 2];
        if (last > prev + 5) trend = "up";
        else if (last < prev - 5) trend = "down";
      }
      return {
        subject_name: name,
        subject_icon: data.icon,
        avg_score: avg,
        attempts: data.scores.length,
        best_score: data.best,
        trend,
      };
    }).sort((a, b) => b.avg_score - a.avg_score);
  }, [attempts]);

  const radarData = useMemo(() => {
    return topicMastery.map((t) => ({
      subject: t.subject_name,
      score: t.avg_score,
      fullMark: 100,
    }));
  }, [topicMastery]);

  const availableClasses = useMemo(() => {
    const levels = new Set(students.map((s) => s.class_level).filter((l): l is number => l != null));
    return [...levels].sort((a, b) => a - b);
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (selectedClass === "all") return students;
    return students.filter((s) => s.class_level === parseInt(selectedClass));
  }, [students, selectedClass]);

  const selectedStudent = filteredStudents.find((s) => s.user_id === selectedStudentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with student selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> Student Growth Tracker
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedStudentId(""); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {availableClasses.map((c) => (
                <SelectItem key={c} value={String(c)}>Class {c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Select student..." />
            </SelectTrigger>
            <SelectContent>
              {filteredStudents.map((s) => (
                <SelectItem key={s.user_id} value={s.user_id}>
                  {s.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedStudentId && (
        <div className="bg-card rounded-2xl shadow-card p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium text-muted-foreground">Select a student to view their growth analytics</p>
        </div>
      )}

      {selectedStudentId && dataLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {selectedStudentId && !dataLoading && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Accuracy",
                value: `${overallAccuracy}%`,
                icon: Target,
                color: "bg-primary/10 text-primary",
                sub: attempts.length > 0 ? `${attempts.length} quizzes` : "No data",
              },
              {
                label: "Score Trend",
                value: recentTrend === "up" ? "Improving" : recentTrend === "down" ? "Declining" : "Stable",
                icon: recentTrend === "up" ? ArrowUpRight : recentTrend === "down" ? ArrowDownRight : TrendingUp,
                color: recentTrend === "up" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : recentTrend === "down" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                sub: attempts.length >= 2 ? "Last 3 vs prior 3" : "Need more data",
              },
              {
                label: "Lessons Done",
                value: String(lessonCount),
                icon: BookOpen,
                color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                sub: "Completed",
              },
              {
                label: "Total XP",
                value: String(totalXP),
                icon: Clock,
                color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                sub: "From quizzes",
              },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-card rounded-2xl p-5 shadow-card">
                <div className={`w-10 h-10 ${kpi.color} rounded-xl flex items-center justify-center mb-3`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-black">{kpi.value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">{kpi.label}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Score Trend Chart */}
          <div className="bg-card rounded-2xl shadow-card p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2">📈 Score Trend Over Time</h3>
            {scoreTrendData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No quiz attempts yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={scoreTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Score"]}
                    labelFormatter={(_, payload) => {
                      if (payload?.[0]?.payload?.date) return payload[0].payload.date;
                      return "";
                    }}
                    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Topic Mastery + Radar side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topic Mastery Breakdown */}
            <div className="bg-card rounded-2xl shadow-card p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Topic Mastery
              </h3>
              {topicMastery.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No topic data yet</p>
              ) : (
                <div className="space-y-3">
                  {topicMastery.map((t) => (
                    <div key={t.subject_name} className="p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{t.subject_icon}</span>
                          <span className="font-medium text-sm">{t.subject_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{t.avg_score}%</span>
                          {t.trend === "up" && <ArrowUpRight className="w-4 h-4 text-green-500" />}
                          {t.trend === "down" && <ArrowDownRight className="w-4 h-4 text-red-500" />}
                          <Badge variant={t.avg_score >= 70 ? "default" : t.avg_score >= 45 ? "secondary" : "destructive"} className="text-[10px]">
                            {t.avg_score >= 70 ? "Mastered" : t.avg_score >= 45 ? "Learning" : "Needs Work"}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={t.avg_score} className="h-2" />
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{t.attempts} attempts</span>
                        <span className="text-[10px] text-muted-foreground">Best: {t.best_score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Radar Chart */}
            <div className="bg-card rounded-2xl shadow-card p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2">🎯 Skill Radar</h3>
              {radarData.length < 3 ? (
                <p className="text-center text-muted-foreground py-6">Need at least 3 subjects for radar chart</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentGrowthTracker;

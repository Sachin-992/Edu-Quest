import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminClient } from "@/integrations/supabase/adminClient";
import { onQuizComplete, onActivityComplete } from "@/lib/quizSyncBus";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  TrendingUp,
  Calendar,
  Users,
  Activity,
  Award,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";

interface StudentMetrics {
  id: string;
  name: string;
  avatarUrl: string | null;
  totalXP: number;
  quizzesCompleted: number;
  avgScore: number;
  streakDays: number;
  lastActive: string | null;
  status: "active" | "struggling" | "inactive";
}

interface DailyXP {
  date: string;
  XP: number;
  Quizzes: number;
}

interface ClassAnalyticsProps {
  isTeacher?: boolean;
  assignedClasses?: number[];
  assignedSubjects?: string[];
  assignments?: any[];
}

const ClassAnalytics = ({
  isTeacher = false,
  assignedClasses: propAssignedClasses = [],
  assignedSubjects = [],
  assignments = [],
}: ClassAnalyticsProps) => {
  const { user, role } = useAuth();
  const [assignedClasses, setAssignedClasses] = useState<number[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [schoolId, setSchoolId] = useState<string>("");
  const [students, setStudents] = useState<StudentMetrics[]>([]);
  const [consistencyData, setConsistencyData] = useState<DailyXP[]>([]);
  const [heatmapData, setHeatmapData] = useState<{ day: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  // 1. Resolve school_id and class assignments
  useEffect(() => {
    if (!user) return;

    const resolveAccess = async () => {
      try {
        // Get school_id (use admin client to bypass RLS for teacher profiles)
        const { data: prof } = await getAdminClient()
          .from("profiles")
          .select("school_id")
          .eq("user_id", user.id)
          .maybeSingle();

        const resolvedSchoolId = prof?.school_id || "";
        setSchoolId(resolvedSchoolId);

        if (!resolvedSchoolId) return;

        // Check if teacher
        if (isTeacher) {
          setAssignedClasses(propAssignedClasses);
          if (propAssignedClasses.length > 0) {
            setSelectedClass(propAssignedClasses[0]);
          }
        } else {
          // School Admin / Admin has access to all classes 1 to 8
          setAssignedClasses([1, 2, 3, 4, 5, 6, 7, 8]);
          setSelectedClass(7); // Default to Grade 7
        }
      } catch (err) {
        console.error("[ClassAnalytics] Error resolving access:", err);
      }
    };

    resolveAccess();
  }, [user, isTeacher, propAssignedClasses]);

  // 2. Fetch data when selectedClass changes
  const fetchAnalytics = useCallback(async () => {
    if (!schoolId || selectedClass === null) return;
    setLoading(true);
    try {
      const adminClient = getAdminClient();

      // A. Fetch all student profiles in this school and class level
      const { data: profiles, error: profErr } = await adminClient
        .from("profiles")
        .select("user_id, full_name, avatar_url, updated_at")
        .eq("school_id", schoolId)
        .eq("class_level", selectedClass)
        .eq("is_active", true);

      if (profErr) throw profErr;

      if (!profiles || profiles.length === 0) {
        setStudents([]);
        setConsistencyData([]);
        setHeatmapData([]);
        setLoading(false);
        return;
      }

      const studentIds = profiles.map((p) => p.user_id);

      // B. Fetch student progress for these students (admin client bypasses RLS)
      const { data: progress, error: progErr } = await adminClient
        .from("student_progress")
        .select("user_id, xp_earned, score, completed_at, quiz_id")
        .in("user_id", studentIds);

      if (progErr) throw progErr;

      // Filter progress by subjects if teacher is assigned to specific subjects for this class
      let safeProgress = progress || [];
      const classAssignments = assignments.filter((a) => a.class_level === selectedClass);
      const restrictedSubjectIds = classAssignments
        .map((a) => a.subject_id)
        .filter(Boolean) as string[];
      
      const hasAllSubjects = classAssignments.length === 0 || classAssignments.some((a) => a.subject_id === null);

      if (isTeacher && !hasAllSubjects && restrictedSubjectIds.length > 0) {
        // Fetch lessons of these subjects
        const { data: lessons } = await adminClient
          .from("lessons")
          .select("id")
          .in("subject_id", restrictedSubjectIds);
        
        const lessonIds = (lessons || []).map((l) => l.id);
        if (lessonIds.length > 0) {
          // Fetch quizzes of these lessons
          const { data: quizzes } = await adminClient
            .from("quizzes")
            .select("id")
            .in("lesson_id", lessonIds);
          
          const restrictedQuizIds = (quizzes || []).map((q) => q.id);
          safeProgress = safeProgress.filter(
            (p) => !p.quiz_id || restrictedQuizIds.includes(p.quiz_id)
          );
        } else {
          // No lessons -> no progress visible for these subjects
          safeProgress = [];
        }
      }

        // C. Process Student Metrics
        const processedStudents: StudentMetrics[] = profiles.map((p) => {
          const studentProgress = safeProgress.filter((pr) => pr.user_id === p.user_id);
          
          const totalXP = studentProgress.reduce((sum, pr) => sum + (pr.xp_earned || 0), 0);
          
          const quizRecords = studentProgress.filter((pr) => pr.quiz_id !== null);
          const quizzesCompleted = quizRecords.length;

          const scoredQuizzes = quizRecords.filter((pr) => pr.score !== null && pr.score !== undefined);
          const avgScore = scoredQuizzes.length > 0
            ? Math.round(scoredQuizzes.reduce((sum, pr) => sum + pr.score!, 0) / scoredQuizzes.length)
            : 0;

          // Days since last activity
          let lastActiveDate: string | null = null;
          let daysSinceActive = 999;
          const completedDates = studentProgress
            .filter((pr) => pr.completed_at)
            .map((pr) => new Date(pr.completed_at!));

          if (completedDates.length > 0) {
            const maxDate = new Date(Math.max(...completedDates.map((d) => d.getTime())));
            lastActiveDate = maxDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
            daysSinceActive = Math.floor((Date.now() - maxDate.getTime()) / (1000 * 60 * 60 * 24));
          }

          // Streak placeholder
          const streakDays = Math.max(0, 5 - Math.floor(daysSinceActive / 2)); // Mocking streak based on activity

          // Status alerts
          let status: "active" | "struggling" | "inactive" = "active";
          if (daysSinceActive > 7) {
            status = "inactive";
          } else if (quizzesCompleted > 0 && avgScore < 60) {
            status = "struggling";
          }

          return {
            id: p.user_id,
            name: p.full_name,
            avatarUrl: p.avatar_url,
            totalXP,
            quizzesCompleted,
            avgScore,
            streakDays,
            lastActive: lastActiveDate,
            status,
          };
        });

        setStudents(processedStudents.sort((a, b) => b.totalXP - a.totalXP));

        // D. Process Daily consistency data (last 7 days)
        const dailyMap = new Map<string, { xp: number; quizzes: number }>();
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        
        // Initialise past 7 days
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
          dailyMap.set(dateStr, { xp: 0, quizzes: 0 });
        }

        if (safeProgress) {
          safeProgress.forEach((pr) => {
            if (!pr.completed_at) return;
            const pDate = new Date(pr.completed_at);
            const dateStr = pDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
            if (dailyMap.has(dateStr)) {
              const current = dailyMap.get(dateStr)!;
              dailyMap.set(dateStr, {
                xp: current.xp + (pr.xp_earned || 0),
                quizzes: current.quizzes + (pr.quiz_id ? 1 : 0),
              });
            }
          });
        }

        const consistencyList: DailyXP[] = [];
        dailyMap.forEach((val, key) => {
          consistencyList.push({
            date: key,
            XP: val.xp,
            Quizzes: val.quizzes,
          });
        });
        setConsistencyData(consistencyList);

        // E. Create Engagement Heatmap Data (Days of the week grid)
        const weekdayLogins = [0, 0, 0, 0, 0, 0, 0]; // Sun - Sat
        if (safeProgress) {
          safeProgress.forEach((pr) => {
            if (!pr.completed_at) return;
            const pDate = new Date(pr.completed_at);
            const dayIdx = pDate.getDay();
            weekdayLogins[dayIdx]++;
          });
        }

        const mapData = days.map((day, idx) => ({
          day,
          value: Math.min(100, Math.round((weekdayLogins[idx] / Math.max(1, profiles.length)) * 100)),
        }));
        setHeatmapData(mapData);

      } catch (err: any) {
        console.error("[ClassAnalytics] Fetch error:", err);
        toast({
          title: "Error fetching analytics",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
  }, [schoolId, selectedClass, toast]);

  useEffect(() => {
    fetchAnalytics();
    // Poll every 60s for live updates
    const interval = setInterval(() => fetchAnalytics(), 60000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  // Instant refresh on quiz or activity completion
  useEffect(() => {
    const unsub1 = onQuizComplete(() => fetchAnalytics());
    const unsub2 = onActivityComplete(() => fetchAnalytics());
    return () => { unsub1(); unsub2(); };
  }, [fetchAnalytics]);

  const strugglingStudents = students.filter((s) => s.status === "struggling");
  const inactiveStudents = students.filter((s) => s.status === "inactive");

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            📊 Class Performance & Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor daily study trends, active heatmaps, and students needing guidance.
          </p>
        </div>

        {assignedClasses.length > 0 && (
          <div className="w-full sm:w-48">
            <Select
              value={selectedClass ? String(selectedClass) : ""}
              onValueChange={(val) => setSelectedClass(parseInt(val))}
            >
              <SelectTrigger className="h-11 rounded-xl bg-card border-border">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {assignedClasses.map((c) => (
                  <SelectItem key={c} value={String(c)}>
                    Grade / Class {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground font-semibold">Generating analytics...</p>
          </div>
        </div>
      ) : assignedClasses.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-muted/5 py-12 text-center rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <span className="text-4xl mb-3">📋</span>
            <p className="font-bold text-muted-foreground text-sm">No Class Assignments Found</p>
            <p className="text-xs text-muted-foreground/80 mt-1 max-w-xs mx-auto">
              Please contact the school administrator to link your account to classes and subjects.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Consistency & Heatmap Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* consistency graph */}
            <Card className="lg:col-span-8 bg-card border-border/40 rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-primary">
                  <TrendingUp className="w-4 h-4" /> Weekly Activity & XP Flow
                </CardTitle>
                <CardDescription className="text-xs">
                  Daily XP output and completed quizzes by students in Grade {selectedClass}.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72 mt-2">
                {consistencyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={consistencyData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--border), 0.3)" />
                      <XAxis dataKey="date" stroke="rgba(var(--muted-foreground), 0.7)" fontSize={11} fontWeight="bold" />
                      <YAxis stroke="rgba(var(--muted-foreground), 0.7)" fontSize={11} fontWeight="bold" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "12px",
                        }}
                      />
                      <Legend fontSize={12} />
                      <Line type="monotone" dataKey="XP" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 6 }} name="XP Earned" />
                      <Line type="monotone" dataKey="Quizzes" stroke="#ec4899" strokeWidth={2.5} name="Quizzes" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground font-semibold">
                    No activity registered in the last 7 days.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engagement Heatmap */}
            <Card className="lg:col-span-4 bg-card border-border/40 rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-primary">
                  <Calendar className="w-4 h-4" /> Engagement Heatmap
                </CardTitle>
                <CardDescription className="text-xs">
                  % of students who studied by day of week.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col justify-between h-64">
                <div className="grid grid-cols-7 gap-2.5">
                  {heatmapData.map((item, index) => {
                    // Decide color shade based on value
                    let color = "bg-muted/30 border-border/30";
                    if (item.value > 80) color = "bg-green-500 text-green-50 shadow-[0_0_8px_rgba(34,197,94,0.3)] border-green-400";
                    else if (item.value > 50) color = "bg-emerald-500/70 text-emerald-50 border-emerald-400/50";
                    else if (item.value > 20) color = "bg-emerald-500/35 text-emerald-800 dark:text-emerald-200 border-emerald-400/20";
                    else if (item.value > 0) color = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-400/10";

                    return (
                      <div
                        key={item.day}
                        className={`flex flex-col items-center justify-center py-3.5 rounded-xl border text-center font-bold transition-all ${color}`}
                      >
                        <span className="text-[10px] uppercase font-black tracking-wider opacity-90">{item.day}</span>
                        <span className="text-xs font-extrabold mt-1.5">{item.value}%</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground mt-4 self-center uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-muted/40 border border-border" /> 0%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500/25 border border-emerald-400/20" /> Low
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-400" /> Medium
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-green-500 border border-green-400" /> High
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Alerts & Leaderboard Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Student Alerts (Struggling/Inactive) */}
            <Card className="lg:col-span-6 bg-card border-border/40 rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-red-500">
                  <AlertTriangle className="w-4 h-4 animate-bounce" /> Attention Alerts
                </CardTitle>
                <CardDescription className="text-xs">
                  Students struggling with quiz grades or inactive for over 7 days.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-3 max-h-[300px] overflow-y-auto space-y-3.5 pr-2">
                {strugglingStudents.length === 0 && inactiveStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Sparkles className="w-9 h-9 text-amber-500 mb-2 animate-pulse" />
                    <p className="font-bold text-xs text-foreground">All students on track! 🌟</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Students are performing well and logging in consistently.</p>
                  </div>
                ) : (
                  <>
                    {strugglingStudents.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3.5 bg-orange-500/10 border border-orange-500/25 rounded-2xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center font-bold text-xs text-orange-600 dark:text-orange-400">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground">{s.name}</p>
                            <p className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
                              Low Quiz Performance ({s.avgScore}% Avg)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-black uppercase bg-orange-500/15 border border-orange-500/30 px-2.5 py-1 rounded-full text-orange-600 dark:text-orange-400 tracking-wider">
                            Needs Support
                          </span>
                        </div>
                      </div>
                    ))}

                    {inactiveStudents.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center font-bold text-xs text-red-600 dark:text-red-400">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground">{s.name}</p>
                            <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 mt-0.5">
                              Inactive (Last Active: {s.lastActive || "Never"})
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-black uppercase bg-red-500/15 border border-red-500/30 px-2.5 py-1 rounded-full text-red-600 dark:text-red-400 tracking-wider">
                            Inactive 7d+
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Class Leaderboard/List */}
            <Card className="lg:col-span-6 bg-card border-border/40 rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-primary">
                  <Award className="w-4 h-4" /> Class Rank & Statistics
                </CardTitle>
                <CardDescription className="text-xs">
                  Leaderboard and details of students in Grade {selectedClass}.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-3 max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {students.map((student, idx) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-2.5 hover:bg-muted/30 border border-transparent hover:border-border/30 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-black w-5 text-center ${idx < 3 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        {idx + 1}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-border/40 flex items-center justify-center text-xs font-black text-primary">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground truncate max-w-[140px]">{student.name}</p>
                        <p className="text-[9px] text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                          <BookOpen className="w-2.5 h-2.5 text-muted-foreground" /> {student.quizzesCompleted} Quizzes
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-xs font-black text-foreground">{student.totalXP.toLocaleString()} XP</p>
                        <p className="text-[9px] text-muted-foreground font-bold">{student.avgScore}% Avg</p>
                      </div>
                      <span className="text-base select-none">
                        {student.status === "struggling" ? "⚠️" : student.status === "inactive" ? "💤" : "🔥"}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassAnalytics;

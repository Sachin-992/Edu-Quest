import { useState, useEffect, useCallback } from "react";
import { getAdminClient } from "@/integrations/supabase/adminClient";
import { onQuizComplete, onActivityComplete } from "@/lib/quizSyncBus";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Trophy, Eye, EyeOff, Calendar, TrendingUp, Award,
  Medal, Users, Zap, Target, Crown,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

/* ── Types ── */
interface Settings {
  id: string;
  is_visible: boolean;
  mode: string;
  show_most_improved: boolean;
  reward_most_improved: boolean;
}

interface RankedStudent {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  class_level: number | null;
  total_xp: number;
  quizzes_taken: number;
  avg_score: number;
}

/* ── Helpers ── */
const getInitials = (name: string) =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const medalColors = [
  "from-yellow-400 to-amber-500",   // 1st
  "from-slate-300 to-slate-400",    // 2nd
  "from-orange-400 to-orange-600",  // 3rd
];

const avatarBgs = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
];

/* ── Main Component ── */
const LeaderboardControls = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [students, setStudents] = useState<RankedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const admin = getAdminClient();

    // Fetch settings, progress, and profiles in parallel
    const [settingsRes, progressRes, profilesRes] = await Promise.all([
      admin.from("leaderboard_settings").select("id, is_visible, mode, show_most_improved, reward_most_improved").limit(1).maybeSingle(),
      admin.from("student_progress").select("user_id, xp_earned, quiz_id, score, completed_at, status"),
      admin.from("profiles").select("user_id, full_name, avatar_url, class_level").not("roll_number", "is", null),
    ]);

    // Settings — use existing or create defaults
    if (settingsRes.data) {
      setSettings(settingsRes.data as Settings);
    } else {
      // Try to create default settings (need a school_id)
      const { data: school } = await admin.from("schools").select("id").limit(1).maybeSingle();
      if (school) {
        const { data: created } = await admin
          .from("leaderboard_settings")
          .insert({ school_id: school.id })
          .select("id, is_visible, mode, show_most_improved, reward_most_improved")
          .single();
        if (created) setSettings(created as Settings);
      }
      // If no school exists, settings stays null — controls won't render but ranking still will
    }

    // Build student rankings
    const profiles = profilesRes.data || [];
    const progress = progressRes.data || [];

    const profileMap = new Map(profiles.map(p => [p.user_id, p]));
    const studentMap = new Map<string, { xp: number; quizCount: number; scores: number[] }>();

    for (const p of progress) {
      if (!profileMap.has(p.user_id)) continue;
      if (!studentMap.has(p.user_id)) {
        studentMap.set(p.user_id, { xp: 0, quizCount: 0, scores: [] });
      }
      const s = studentMap.get(p.user_id)!;
      s.xp += p.xp_earned || 0;
      if (p.quiz_id && p.score != null) {
        s.quizCount += 1;
        s.scores.push(p.score);
      }
    }

    // Include students with no progress (0 XP)
    for (const profile of profiles) {
      if (!studentMap.has(profile.user_id)) {
        studentMap.set(profile.user_id, { xp: 0, quizCount: 0, scores: [] });
      }
    }

    const ranked: RankedStudent[] = [];
    for (const [userId, data] of studentMap) {
      const profile = profileMap.get(userId);
      if (!profile) continue;
      ranked.push({
        user_id: userId,
        full_name: profile.full_name || "Unknown",
        avatar_url: profile.avatar_url,
        class_level: profile.class_level,
        total_xp: data.xp,
        quizzes_taken: data.quizCount,
        avg_score: data.scores.length > 0
          ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
          : 0,
      });
    }

    // Sort by XP descending, then by avg score as tiebreaker
    ranked.sort((a, b) => b.total_xp - a.total_xp || b.avg_score - a.avg_score);
    setStudents(ranked);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Instant refresh on quiz completion event
  useEffect(() => {
    const unsub = onQuizComplete(() => fetchData());
    return unsub;
  }, [fetchData]);

  // Instant refresh on any activity completion event
  useEffect(() => {
    const unsub = onActivityComplete(() => fetchData());
    return unsub;
  }, [fetchData]);

  const updateSettings = async (patch: Partial<Settings>) => {
    if (!settings) return;
    setSaving(true);
    const newSettings = { ...settings, ...patch };
    setSettings(newSettings);

    const { error } = await getAdminClient()
      .from("leaderboard_settings")
      .update(patch)
      .eq("id", settings.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings updated");
    }
  };

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="text-xl font-bold">Leaderboard</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight">Leaderboard</h2>
            <p className="text-xs text-muted-foreground">{students.length} students ranked by XP</p>
          </div>
        </div>
      </div>

      {/* ── Rankings Table ── */}
      {students.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-semibold text-muted-foreground">No student data yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Rankings will appear once students complete quizzes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Top 3 Podium */}
          {students.length >= 3 && (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-6">
              {[1, 0, 2].map(podiumIdx => {
                const s = students[podiumIdx];
                if (!s) return null;
                const rank = podiumIdx + 1;
                return (
                  <motion.div
                    key={s.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: podiumIdx * 0.1, duration: 0.4 }}
                    className={`relative flex flex-col items-center p-2.5 sm:p-5 rounded-2xl border border-border/40 bg-card/80 ${rank === 1 ? 'ring-2 ring-yellow-400/30 shadow-lg shadow-yellow-500/10 -mt-2' : ''}`}
                  >
                    {/* Medal */}
                    <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br ${medalColors[rank - 1]} flex items-center justify-center text-white text-[10px] sm:text-xs font-black shadow-md mb-2 sm:mb-3`}>
                      {rank === 1 ? <Crown className="w-3 h-3 sm:w-4 sm:h-4" /> : rank}
                    </div>
                    {/* Avatar */}
                    <div className={`h-9 w-9 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${avatarBgs[podiumIdx % avatarBgs.length]} mb-2`}>
                      {getInitials(s.full_name)}
                    </div>
                    <p className="font-bold text-xs sm:text-sm text-center truncate w-full">{s.full_name}</p>
                    {s.class_level && (
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground bg-muted/60 px-1.5 sm:px-2 py-0.5 rounded-full mt-1">
                        Class {s.class_level}
                      </span>
                    )}
                    <div className="flex items-center gap-0.5 sm:gap-1 mt-1.5 text-primary font-black text-sm sm:text-lg">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {s.total_xp}
                    </div>
                    <p className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5 text-center leading-tight">
                      {s.quizzes_taken} <span className="hidden sm:inline">quiz{s.quizzes_taken !== 1 ? "zes" : ""}</span><span className="sm:hidden">Q</span> · {s.avg_score}% <span className="hidden sm:inline">avg</span>
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Remaining students */}
          <div className="space-y-1.5">
            {students.slice(students.length >= 3 ? 3 : 0).map((s, i) => {
              const rank = (students.length >= 3 ? 3 : 0) + i + 1;
              return (
                <motion.div
                  key={s.user_id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.25 }}
                  className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-muted/40 transition-all duration-200 group"
                >
                  {/* Rank */}
                  <span className="w-8 text-center font-black text-sm text-muted-foreground tabular-nums">
                    #{rank}
                  </span>
                  {/* Avatar */}
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${avatarBgs[(rank - 1) % avatarBgs.length]}`}>
                    {getInitials(s.full_name)}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {s.full_name}
                      {s.class_level && (
                        <span className="text-[10px] text-muted-foreground ml-2 bg-muted/60 px-1.5 py-0.5 rounded font-medium">
                          Class {s.class_level}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Target className="w-3 h-3" /> {s.quizzes_taken} quiz{s.quizzes_taken !== 1 ? "zes" : ""}
                      </span>
                      <span>·</span>
                      <span>{s.avg_score}% avg</span>
                    </p>
                  </div>
                  {/* XP */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-sm text-primary flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> {s.total_xp} XP
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Settings Controls ── */}
      {settings && (
        <>
          <div className="border-t border-border/40 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Medal className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Leaderboard Settings</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visibility */}
            <div className="bg-muted/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                {settings.is_visible ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                <h3 className="font-bold text-sm">Student Visibility</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {settings.is_visible ? "Students can see the leaderboard." : "Leaderboard hidden from students."}
              </p>
              <div className="flex items-center gap-3">
                <Switch checked={settings.is_visible} onCheckedChange={(v) => updateSettings({ is_visible: v })} disabled={saving} />
                <Label className="text-xs font-medium">{settings.is_visible ? "Visible" : "Hidden"}</Label>
              </div>
            </div>

            {/* Mode */}
            <div className="bg-muted/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm">Competition Mode</h3>
              </div>
              <p className="text-xs text-muted-foreground">Weekly resets every Monday. All-time shows cumulative XP.</p>
              <Select value={settings.mode} onValueChange={(v) => updateSettings({ mode: v })} disabled={saving}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_time">🏆 All Time</SelectItem>
                  <SelectItem value="weekly">📅 Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show Most Improved */}
            <div className="bg-muted/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <h3 className="font-bold text-sm">Show Most Improved</h3>
              </div>
              <p className="text-xs text-muted-foreground">Highlight the most improved student on the leaderboard.</p>
              <div className="flex items-center gap-3">
                <Switch checked={settings.show_most_improved} onCheckedChange={(v) => updateSettings({ show_most_improved: v })} disabled={saving} />
                <Label className="text-xs font-medium">{settings.show_most_improved ? "Shown" : "Hidden"}</Label>
              </div>
            </div>

            {/* Reward Most Improved */}
            <div className="bg-muted/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                <h3 className="font-bold text-sm">Reward Most Improved</h3>
              </div>
              <p className="text-xs text-muted-foreground">Award +50 bonus XP to most improved student weekly.</p>
              <div className="flex items-center gap-3">
                <Switch checked={settings.reward_most_improved} onCheckedChange={(v) => updateSettings({ reward_most_improved: v })} disabled={saving} />
                <Label className="text-xs font-medium">{settings.reward_most_improved ? "Enabled" : "Disabled"}</Label>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeaderboardControls;

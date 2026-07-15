import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Star, Flame, Trophy, Award, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface GamificationStatsProps {
  refreshTrigger?: number;
}

const LEVELS = [
  { level: 1, xpNeeded: 0, title: "Beginner 🌱" },
  { level: 2, xpNeeded: 50, title: "Explorer 🧭" },
  { level: 3, xpNeeded: 150, title: "Learner 📖" },
  { level: 4, xpNeeded: 300, title: "Scholar 🎓" },
  { level: 5, xpNeeded: 500, title: "Master 🏆" },
  { level: 6, xpNeeded: 800, title: "Champion 👑" },
  { level: 7, xpNeeded: 1200, title: "Legend ⭐" },
];

const BADGES = [
  { id: "first_lesson", icon: "📖", name: "First Lesson", condition: (data: Stats) => data.lessonsCompleted >= 1 },
  { id: "quiz_ace", icon: "🎯", name: "Quiz Ace", condition: (data: Stats) => data.quizzesCompleted >= 1 },
  { id: "five_lessons", icon: "📚", name: "Bookworm", condition: (data: Stats) => data.lessonsCompleted >= 5 },
  { id: "streak_3", icon: "🔥", name: "On Fire", condition: (data: Stats) => data.streakDays >= 3 },
  { id: "xp_100", icon: "💫", name: "Century", condition: (data: Stats) => data.totalXP >= 100 },
  { id: "perfect_quiz", icon: "💯", name: "Perfect Score", condition: (data: Stats) => data.perfectQuizzes >= 1 },
];

interface Stats {
  totalXP: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  perfectQuizzes: number;
  streakDays: number;
  avgScore: number;
}

const GamificationStats = ({ refreshTrigger }: GamificationStatsProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalXP: 0, lessonsCompleted: 0, quizzesCompleted: 0,
    perfectQuizzes: 0, streakDays: 0, avgScore: 0,
  });
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { data: progress } = await supabase
        .from("student_progress")
        .select("*")
        .eq("user_id", user.id);

      if (!progress) return;

      const totalXP = progress.reduce((sum, p) => sum + (p.xp_earned || 0), 0);
      const lessonsCompleted = progress.filter((p) => p.lesson_id && p.status === "completed").length;
      const quizProgress = progress.filter((p) => p.quiz_id && p.status === "completed");
      const quizzesCompleted = quizProgress.length;
      const perfectQuizzes = quizProgress.filter((p) => (p.score ?? 0) >= 100).length;
      const avgScore = quizzesCompleted > 0
        ? Math.round(quizProgress.reduce((sum, p) => sum + (p.score ?? 0), 0) / quizzesCompleted)
        : 0;

      // Calculate streak — normalize dates to IST (UTC+5:30)
      const toISTDateStr = (d: string) => {
        const date = new Date(d);
        const istMs = date.getTime() + (330 * 60 * 1000);
        return new Date(istMs).toISOString().slice(0, 10);
      };
      const nowIST = toISTDateStr(new Date().toISOString());
      const yesterdayIST = toISTDateStr(new Date(Date.now() - 86400000).toISOString());

      const completedDates = progress
        .filter((p) => p.completed_at)
        .map((p) => toISTDateStr(p.completed_at!))
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => b.localeCompare(a));

      let streakDays = 0;
      if (completedDates.length > 0 && (completedDates[0] === nowIST || completedDates[0] === yesterdayIST)) {
        streakDays = 1;
        for (let i = 1; i < completedDates.length; i++) {
          const diff = new Date(completedDates[i - 1]).getTime() - new Date(completedDates[i]).getTime();
          if (diff <= 86400000 * 1.5) streakDays++;
          else break;
        }
      }

      setStats({ totalXP, lessonsCompleted, quizzesCompleted, perfectQuizzes, streakDays, avgScore });
    };
    fetchStats();
  }, [user, refreshTrigger]);

  const currentLevel = [...LEVELS].reverse().find((l) => stats.totalXP >= l.xpNeeded) || LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.xpNeeded > stats.totalXP);
  const xpProgress = nextLevel
    ? ((stats.totalXP - currentLevel.xpNeeded) / (nextLevel.xpNeeded - currentLevel.xpNeeded)) * 100
    : 100;
  const earnedBadges = BADGES.filter((b) => b.condition(stats));

  const statCards = [
    { label: "XP Points", value: String(stats.totalXP), icon: Star, color: "bg-edu-yellow text-edu-yellow-foreground" },
    { label: "Streak", value: `${stats.streakDays} day${stats.streakDays !== 1 ? "s" : ""}`, icon: Flame, color: "bg-streak text-primary-foreground" },
    { label: "Level", value: String(currentLevel.level), icon: TrendingUp, color: "bg-primary text-primary-foreground" },
    { label: "Badges", value: String(earnedBadges.length), icon: Award, color: "bg-edu-purple text-edu-purple-foreground" },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl p-4 shadow-card"
          >
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-2`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Level Progress */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-edu-yellow" />
            <span className="font-bold">{currentLevel.title}</span>
          </div>
          {nextLevel && (
            <span className="text-sm text-muted-foreground">
              {nextLevel.xpNeeded - stats.totalXP} XP to {nextLevel.title}
            </span>
          )}
        </div>
        <Progress value={xpProgress} className="h-3" />
      </div>

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Award className="w-5 h-5" /> Badges Earned
          </h3>
          <div className="flex gap-3 flex-wrap">
            {earnedBadges.map((badge) => (
              <motion.div
                key={badge.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center gap-1 bg-muted/50 rounded-xl px-4 py-3"
              >
                <span className="text-2xl">{badge.icon}</span>
                <span className="text-xs font-medium">{badge.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationStats;

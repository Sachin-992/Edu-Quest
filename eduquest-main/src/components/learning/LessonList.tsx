import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Subject, Lesson, StudentProgress } from "@/types/learning";
import { ArrowLeft, BookOpen, Play, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface LessonListProps {
  subject: Subject;
  onBack: () => void;
  onSelectLesson: (lesson: Lesson) => void;
  onOpenTamilGames?: () => void;
}

const lessonTypeIcons: Record<string, string> = {
  reading: "📖",
  video: "🎬",
  interactive: "🎮",
  game: "🕹️",
};

const LessonList = ({ subject, onBack, onSelectLesson, onOpenTamilGames }: LessonListProps) => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Map<string, StudentProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [lessonsRes, progressRes] = await Promise.all([
        supabase
          .from("lessons")
          .select("*")
          .eq("subject_id", subject.id)
          .eq("is_active", true)
          .order("lesson_order"),
        user
          ? supabase
            .from("student_progress")
            .select("*")
            .eq("user_id", user.id)
            .not("lesson_id", "is", null)
          : Promise.resolve({ data: [] }),
      ]);

      if (lessonsRes.data) setLessons(lessonsRes.data as unknown as Lesson[]);
      if (progressRes.data) {
        const map = new Map<string, StudentProgress>();
        (progressRes.data as unknown as StudentProgress[]).forEach((p) => {
          if (p.lesson_id) map.set(p.lesson_id, p);
        });
        setProgress(map);
      }
      setLoading(false);
    };
    fetchData();
  }, [subject.id, user]);

  // Determine which lessons are unlocked (completed + next one)
  const getUnlockedSet = (): Set<string> => {
    const unlocked = new Set<string>();
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const isCompleted = progress.get(lesson.id)?.status === "completed";
      unlocked.add(lesson.id); // This lesson is accessible
      if (!isCompleted) break; // Stop unlocking after the first incomplete lesson
    }
    return unlocked;
  };

  const unlockedSet = getUnlockedSet();
  const completedCount = lessons.filter((l) => progress.get(l.id)?.status === "completed").length;
  const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
        <ArrowLeft className="w-4 h-4" /> My Subjects
      </Button>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{subject.icon}</span>
          <div>
            <h2 className="text-2xl font-black">{subject.name}</h2>
            {subject.name_tamil && (
              <p className="text-muted-foreground font-tamil">{subject.name_tamil}</p>
            )}
          </div>
        </div>
        {onOpenTamilGames && (
          <Button onClick={onOpenTamilGames} className="gap-2">
            🎮 Tamil Games
          </Button>
        )}
      </div>

      {/* Subject progress bar */}
      {lessons.length > 0 && (
        <div className="mb-6 bg-card rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{completedCount}/{lessons.length} lessons done</span>
            <span className="font-bold">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 shadow-card text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Your lessons are coming soon! 🎒</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, i) => {
            const prog = progress.get(lesson.id);
            const isCompleted = prog?.status === "completed";
            const isUnlocked = unlockedSet.has(lesson.id);
            const isNext = isUnlocked && !isCompleted;

            return (
              <motion.button
                key={lesson.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => isUnlocked && onSelectLesson(lesson)}
                disabled={!isUnlocked}
                className={`w-full bg-card rounded-2xl p-4 shadow-card text-left flex items-center gap-4 group transition-all ${isUnlocked
                    ? "hover:shadow-lg cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                  } ${isNext ? "ring-2 ring-primary/30" : ""}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isCompleted
                    ? "bg-green-100 dark:bg-green-900/30"
                    : !isUnlocked
                      ? "bg-muted"
                      : "bg-primary/10"
                  }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : !isUnlocked ? (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    lessonTypeIcons[lesson.lesson_type] || "📖"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate">{lesson.title}</h3>
                    {isCompleted && (
                      <Badge variant="secondary" className="text-xs shrink-0">Done ✅</Badge>
                    )}
                    {isNext && (
                      <Badge className="text-xs shrink-0 bg-primary/10 text-primary border-primary/20">
                        Up Next
                      </Badge>
                    )}
                  </div>
                  {lesson.title_tamil && (
                    <p className="text-sm text-muted-foreground font-tamil truncate">
                      {lesson.title_tamil}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    +{lesson.xp_reward} XP · {lesson.lesson_type}
                  </p>
                </div>
                {isUnlocked ? (
                  <Play className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LessonList;

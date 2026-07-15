import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Subject } from "@/types/learning";
import { BookOpen, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useTranslation } from "react-i18next";

interface SubjectBrowserProps {
  onSelectSubject: (subject: Subject) => void;
}

const SubjectBrowser = ({ onSelectSubject }: SubjectBrowserProps) => {
  const { profile, user } = useAuth();
  const { language } = useLanguageStore();
  const { t } = useTranslation();
  const isTamil = language === "ta";
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressMap, setProgressMap] = useState<Map<string, { completed: number; total: number }>>(new Map());

  useEffect(() => {
    const fetchSubjects = async () => {
      const classLevel = profile?.class_level || 7;
      let { data } = await supabase
        .from("subjects")
        .select("id, name, name_tamil, description, icon, color, class_level")
        .eq("class_level", classLevel)
        .eq("is_active", true)
        .order("sort_order");

      if (!data || data.length === 0) {
        const fallback = await supabase
          .from("subjects")
          .select("id, name, name_tamil, description, icon, color, class_level")
          .eq("class_level", 7)
          .eq("is_active", true)
          .order("sort_order");
        data = fallback.data;
      }

      if (data) setSubjects(data as unknown as Subject[]);

      // Fetch lesson counts and completion per subject
      if (data && user) {
        const subjectIds = data.map((s: any) => s.id);
        const [lessonsRes, progressRes] = await Promise.all([
          supabase
            .from("lessons")
            .select("id, subject_id")
            .in("subject_id", subjectIds)
            .eq("is_active", true),
          supabase
            .from("student_progress")
            .select("lesson_id, status")
            .eq("user_id", user.id)
            .eq("status", "completed")
            .not("lesson_id", "is", null),
        ]);

        const totalPerSubject = new Map<string, Set<string>>();
        (lessonsRes.data || []).forEach((l: any) => {
          if (!totalPerSubject.has(l.subject_id)) totalPerSubject.set(l.subject_id, new Set());
          totalPerSubject.get(l.subject_id)!.add(l.id);
        });

        const completedLessonIds = new Set((progressRes.data || []).map((p: any) => p.lesson_id));

        const map = new Map<string, { completed: number; total: number }>();
        totalPerSubject.forEach((lessonIds, subjectId) => {
          const completed = [...lessonIds].filter((id) => completedLessonIds.has(id)).length;
          map.set(subjectId, { completed, total: lessonIds.size });
        });
        setProgressMap(map);
      }

      setLoading(false);
    };
    fetchSubjects();
  }, [profile?.class_level, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 loading-spin-glow" />
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-8 shadow-card text-center">
        <span className="text-5xl block mb-3">🎒</span>
        <h3 className="text-lg font-bold mb-1">{t('subjects_coming_soon')}</h3>
        <p className="text-muted-foreground text-sm">
          {t('subjects_coming_soon_desc')}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gradient-flow">{t('your_subjects')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject, i) => {
          const prog = progressMap.get(subject.id);
          const pct = prog && prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;

          return (
            <motion.button
              key={subject.id}
              initial={{ opacity: 0, y: 25, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 280, damping: 18 }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectSubject(subject)}
              className="bg-card rounded-2xl p-5 shadow-card text-left hover:shadow-lg transition-colors group card-shimmer card-press"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-3xl mb-2 block">{subject.icon}</span>
                  <h3 className="text-lg font-bold">{isTamil && subject.name_tamil ? subject.name_tamil : subject.name}</h3>
                  {subject.name_tamil && (
                    <p className="text-sm text-muted-foreground font-tamil">
                      {subject.name_tamil}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    {subject.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
              </div>

              {/* Progress bar */}
              {prog && prog.total > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{prog.completed}/{prog.total} lessons</span>
                    <span className="font-bold">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectBrowser;

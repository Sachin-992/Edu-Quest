import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Play, ChevronRight, Sparkles, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import type { Subject, Lesson } from "@/types/learning";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useTranslation } from "react-i18next";

interface ContinueLearningCardProps {
  onResume: (subject: Subject, lesson: Lesson) => void;
  onPickSubject?: () => void;
}

interface ResumeData {
  subject: Subject;
  lesson: Lesson;
  completedCount: number;
  totalCount: number;
}

const ContinueLearningCard = ({ onResume, onPickSubject }: ContinueLearningCardProps) => {
  const { user, profile } = useAuth();
  const { language } = useLanguageStore();
  const { t } = useTranslation();
  const isTamil = language === "ta";
  const [data, setData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;

    const fetch = async () => {
      const classLevel = profile.class_level || 7;

      let { data: subjects } = await supabase
        .from("subjects")
        .select("*")
        .eq("class_level", classLevel)
        .eq("is_active", true)
        .order("sort_order");

      if (!subjects || subjects.length === 0) {
        const fallback = await supabase
          .from("subjects")
          .select("*")
          .eq("class_level", 7)
          .eq("is_active", true)
          .order("sort_order");
        subjects = fallback.data;
      }

      if (!subjects || subjects.length === 0) { setLoading(false); return; }

      const subjectIds = subjects.map(s => s.id);
      const [lessonsRes, progressRes] = await Promise.all([
        supabase.from("lessons").select("id, subject_id, title, lesson_order").in("subject_id", subjectIds).eq("is_active", true).order("lesson_order"),
        supabase.from("student_progress").select("lesson_id, status").eq("user_id", user.id).eq("status", "completed").not("lesson_id", "is", null),
      ]);

      const lessons = (lessonsRes.data || []) as unknown as Lesson[];
      const completedIds = new Set((progressRes.data || []).map((p: any) => p.lesson_id));

      for (const subject of subjects) {
        const subjectLessons = lessons.filter(l => l.subject_id === subject.id).sort((a, b) => a.lesson_order - b.lesson_order);
        if (subjectLessons.length === 0) continue;
        const completedCount = subjectLessons.filter(l => completedIds.has(l.id)).length;
        const nextLesson = subjectLessons.find(l => !completedIds.has(l.id));
        if (nextLesson) {
          setData({
            subject: subject as unknown as Subject,
            lesson: nextLesson,
            completedCount,
            totalCount: subjectLessons.length,
          });
          break;
        }
      }
      setLoading(false);
    };
    fetch();
  }, [user, profile]);

  if (loading) {
    return <div className="h-36 bg-primary/5 rounded-3xl animate-pulse" />;
  }

  /* ── New student / all caught up ── */
  if (!data) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileTap={{ scale: 0.97 }}
        onClick={onPickSubject}
        className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white p-8 md:p-10 text-left group shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/35 transition-shadow duration-300"
      >
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Rocket className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70 mb-1">{t('start_adventure')}</p>
            <h2 className="text-xl md:text-2xl font-black leading-tight">{t('pick_first_subject')}</h2>
            <p className="text-sm text-white/80 mt-1">{t('tap_to_begin')}</p>
          </div>
          <ChevronRight className="w-6 h-6 text-white/50 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      </motion.button>
    );
  }

  const pct = Math.round((data.completedCount / data.totalCount) * 100);

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onResume(data.subject, data.lesson)}
      className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground p-8 md:p-10 text-left group shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-shadow duration-300"
    >
      {/* Decorative orbs & sparkles */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/8 blur-xl" />
      <div className="absolute top-6 right-16 w-2 h-2 rounded-full bg-white/30 anim-float" />
      <div className="absolute bottom-8 right-8 w-1.5 h-1.5 rounded-full bg-white/25 anim-float" style={{ animationDelay: "1.5s" }} />

      {/* Pulse ring on Play icon */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 h-14 w-14 rounded-2xl">
        <div className="absolute inset-0 rounded-2xl bg-white/20 anim-glow" />
      </div>

      <div className="relative z-10">
        {/* Top row — icon + label + chevron */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Play className="w-7 h-7 text-white fill-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70 mb-0.5">{t('continue_learning')}</p>
            <p className="text-sm font-semibold text-white/90">{data.subject.icon} {isTamil && data.subject.name_tamil ? data.subject.name_tamil : data.subject.name}</p>
          </div>
          <ChevronRight className="w-6 h-6 text-white/50 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>

        {/* Lesson title */}
        <h2 className="text-xl md:text-2xl font-black leading-tight mb-4 truncate">
          {data.lesson.title}
        </h2>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-4 bg-white/15 rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-white/90 via-white/80 to-white/70 relative"
            >
              <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white anim-pulse-scale" />
            </motion.div>
          </div>
          <span className="text-sm font-bold text-white/90 shrink-0">
            {data.completedCount}/{data.totalCount}
          </span>
        </div>
        {pct > 50 && (
          <p className="text-xs font-bold text-white/70 mt-2">{t('on_fire')}</p>
        )}
      </div>
    </motion.button>
  );
};

export default ContinueLearningCard;

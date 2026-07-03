import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Target, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCompletionReward } from "@/hooks/useCompletionReward";
import ReflectionModal from "./ReflectionModal";
import SurpriseRewardModal from "./SurpriseRewardModal";
import { useLanguageStore } from "@/store/useLanguageStore";

interface DailyMissionProps {
  refreshTrigger?: number;
}

const DAILY_LESSON_GOAL = 2;

const DailyMission = ({ refreshTrigger }: DailyMissionProps) => {
  const { user } = useAuth();
  const [completedToday, setCompletedToday] = useState(0);
  const completion = useCompletionReward(user?.id);
  const { language } = useLanguageStore();
  const isTamil = language === "ta";

  // Persist "already triggered today" across remounts using localStorage
  const getDailyKey = () => `eq_daily_mission_triggered_${new Date().toISOString().slice(0, 10)}`;
  const hasTriggeredToday = () => localStorage.getItem(getDailyKey()) === "1";
  const markTriggeredToday = () => localStorage.setItem(getDailyKey(), "1");

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("student_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", today.toISOString());

      setCompletedToday(data?.length || 0);
    };

    fetch();
  }, [user, refreshTrigger]);

  // Trigger reward once when daily goal is first reached (persists across remounts)
  useEffect(() => {
    if (completedToday >= DAILY_LESSON_GOAL && !hasTriggeredToday()) {
      markTriggeredToday();
      completion.triggerCompletion("daily_mission");
    }
  }, [completedToday]);

  const done = completedToday >= DAILY_LESSON_GOAL;
  const pct = Math.min((completedToday / DAILY_LESSON_GOAL) * 100, 100);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ type: 'spring', stiffness: 250, damping: 18, delay: 0.15 }}
        className={`rounded-2xl p-6 transition-all flex items-center gap-5 shadow-xl card-shimmer ${done
          ? "bg-gradient-to-br from-green-400/15 to-emerald-500/15 border-2 border-green-400/30 shadow-green-500/15"
          : "bg-gradient-to-br from-amber-400/10 to-orange-500/10 border border-amber-400/20 shadow-amber-500/15"
          }`}
      >
        {/* Icon */}
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${done
          ? "bg-green-100 dark:bg-green-800/30"
          : "bg-amber-100/80 dark:bg-amber-800/20 anim-pulse-scale"
          }`}>
          {done
            ? <CheckCircle2 className="w-6 h-6 text-green-500" />
            : <Target className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          }
        </div>

        {/* Text + progress */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base leading-tight">
            {done
              ? (isTamil ? "🎉 பணி முடிந்தது!" : "🎉 Mission Complete!")
              : (isTamil ? "🎯 இன்றைய பணி" : "🎯 Today's Mission")
            }
          </h3>
          <p className="text-sm text-muted-foreground mt-1 leading-tight">
            {done
              ? (isTamil ? "அருமை! நாளை மீண்டும் வாருங்கள் 🌟" : "Amazing! Come back tomorrow 🌟")
              : completedToday > 0
                ? (isTamil ? "கிட்டத்தட்ட முடிந்தது! நீங்கள் செய்வீர்கள்! 💪" : "Almost there! You got this! 💪")
                : (isTamil ? `இன்று ${DAILY_LESSON_GOAL} பாடங்களை முடிக்கவும்` : `Complete ${DAILY_LESSON_GOAL} lessons today`)
            }
          </p>
        </div>

        {/* Progress pill */}
        <div className="shrink-0 flex items-center gap-2">
          <div className="w-24 h-3.5 bg-muted/40 rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${done ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-to-r from-amber-400 to-orange-500 progress-bar-stripe"}`}
            />
          </div>
          <span className="text-sm font-black text-foreground">
            {Math.min(completedToday, DAILY_LESSON_GOAL)}/{DAILY_LESSON_GOAL}
          </span>
        </div>
      </motion.div>

      {/* ── Celebration bonus section when mission is complete ── */}
      {done && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
          className="mt-3 rounded-xl bg-gradient-to-r from-emerald-500/8 via-green-500/5 to-teal-500/8 border border-green-400/15 p-4 space-y-2.5"
        >
          {/* Bonus XP row */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 anim-pulse-scale">
              <span className="text-sm font-black text-white">+10</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {isTamil ? "தினசரி போனஸ் XP பெறப்பட்டது! ⭐" : "Daily Bonus XP Earned! ⭐"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isTamil ? "உங்கள் பணியை முடிப்பது கூடுதல் XP அளிக்கிறது" : "Completing your mission earns you extra XP"}
              </p>
            </div>
          </div>

          {/* Streak encouragement */}
          <div className="flex items-center gap-2 bg-white/40 dark:bg-white/5 rounded-lg px-3 py-2">
            <span className="text-lg anim-wiggle">🔥</span>
            <p className="text-xs font-semibold text-muted-foreground">
              {isTamil
                ? "உங்கள் தொடர்ச்சியை பாதுகாக்க நாளை மீண்டும் வாருங்கள் & ஆச்சரியங்களைத் திறக்கவும்! 🎁"
                : "Come back tomorrow to keep your streak alive & unlock surprises! 🎁"
              }
            </p>
          </div>
        </motion.div>
      )}

      {/* Reflection + Reward Modals */}
      <ReflectionModal
        isOpen={completion.showReflection}
        onSubmit={completion.handleReflectionSubmit}
        onSkip={completion.handleReflectionSkip}
      />
      <SurpriseRewardModal
        isOpen={completion.showReward}
        reward={completion.reward}
        onDismiss={completion.handleRewardDismiss}
      />
    </>
  );
};

export default DailyMission;

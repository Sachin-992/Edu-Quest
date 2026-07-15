import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageStore } from "@/store/useLanguageStore";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Award, Clock, ArrowRight, Play, Sparkles, CheckCircle2 } from "lucide-react";
import NMMSQuizPlayer from "../quiz/NMMSQuizPlayer";

interface DailyChallengeProps {
  onBack: () => void;
}

export default function DailyChallenge({ onBack }: DailyChallengeProps) {
  const { user } = useAuth();
  const { language } = useLanguageStore();
  const isTamil = language === "ta";

  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedToday, setCompletedToday] = useState(false);
  const [todayScore, setTodayScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchDailyStatus = async () => {
      try {
        setLoading(true);

        // Calculate current date in local YYYY-MM-DD
        const todayStr = new Date().toISOString().split("T")[0];

        // 1. Get or create daily challenge in public.nmms_daily_challenges
        // For Phase 1 fallback, if challenge does not exist, let's create it dynamically in code
        // and fetch completions
        const { data: completions, error: compError } = await supabase
          .from("nmms_daily_completions")
          .select("*")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false });

        if (compError) throw compError;

        let userStreak = 0;
        let doneToday = false;
        let lastScore = 0;

        if (completions && completions.length > 0) {
          const dates = completions.map(c => new Date(c.completed_at).toISOString().split("T")[0]);
          doneToday = dates.includes(todayStr);

          if (doneToday) {
            const todayCompletion = completions.find(c => new Date(c.completed_at).toISOString().split("T")[0] === todayStr);
            if (todayCompletion) {
              lastScore = todayCompletion.score;
            }
          }

          // Streak calc
          const uniqueDates = Array.from(new Set(dates));
          let current = new Date();
          let checkStr = current.toISOString().split("T")[0];

          if (uniqueDates.includes(checkStr)) {
            userStreak++;
            while (true) {
              current.setDate(current.getDate() - 1);
              checkStr = current.toISOString().split("T")[0];
              if (uniqueDates.includes(checkStr)) {
                userStreak++;
              } else {
                break;
              }
            }
          } else {
            current.setDate(current.getDate() - 1);
            checkStr = current.toISOString().split("T")[0];
            if (uniqueDates.includes(checkStr)) {
              userStreak++;
              while (true) {
                current.setDate(current.getDate() - 1);
                checkStr = current.toISOString().split("T")[0];
                if (uniqueDates.includes(checkStr)) {
                  userStreak++;
                } else {
                  break;
                }
              }
            }
          }
        }

        setStreak(userStreak);
        setCompletedToday(doneToday);
        setTodayScore(lastScore);
      } catch (err) {
        console.error("Error loading daily challenge status:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyStatus();
  }, [user, isPlaying]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin text-purple-400 text-3xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12 text-left">
      {!isPlaying ? (
        <div className="bg-card border border-border/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/5 rounded-bl-full pointer-events-none" />

          {/* Title Area */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full text-orange-500 text-[10px] font-black tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              {isTamil ? "தினசரி சவால்கள்" : "Daily Challenge Lobby"}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-foreground">
              {isTamil ? "இன்றைய 10 கேள்விகள்" : "Today's Mixed Quest"}
            </h2>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              {isTamil
                ? "தினமும் புதுப்பிக்கப்படும் 10 கலப்பு கேள்விகள். தொடர்ச்சியாக விளையாடி கூடுதல் பரிசுகளை வெல்லுங்கள்!"
                : "Solve 10 random MAT & SAT questions. Keep your learning streak going to win bonus coins & XP!"}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/20 border border-border/30 rounded-2xl flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-lg font-black text-foreground">{streak} Days</div>
                <div className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">
                  {isTamil ? "தற்போதைய தொடர்" : "Current Streak"}
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/20 border border-border/30 rounded-2xl flex items-center gap-3">
              <Award className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-lg font-black text-foreground">+50 XP</div>
                <div className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">
                  {isTamil ? "வழங்கப்படும் பரிசு" : "Completion Reward"}
                </div>
              </div>
            </div>
          </div>

          {/* Main Action Banner */}
          {completedToday ? (
            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/25 flex flex-col items-center justify-center text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <div className="space-y-1">
                <h4 className="text-sm font-black text-foreground">
                  {isTamil ? "இன்றைய சவால் வெற்றிகரமாக முடிந்தது!" : "Completed for Today!"}
                </h4>
                <p className="text-xs text-muted-foreground font-semibold">
                  {isTamil
                    ? `உங்கள் இன்றைய மதிப்பெண்: 10-க்கு ${todayScore} கேள்விகள்.`
                    : `You scored ${todayScore}/10 correct. Excellent work!`}
                </p>
              </div>
              <button
                onClick={onBack}
                className="mt-2 text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {isTamil ? "முகப்பிற்குச் செல்" : "Go back to Lobby"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/10 border border-border/20 rounded-2xl p-4 flex items-center gap-3 text-xs text-muted-foreground font-semibold">
                <Clock className="w-5 h-5 text-orange-400 shrink-0" />
                <span>
                  {isTamil
                    ? "சவாலை முடிக்க 10 கேள்விகளுக்குப் பதிலளிக்க வேண்டும். இடையில் விலகினால் முன்னேற்றம் சேமிக்கப்படாது."
                    : "Starts a 10-question mixed practice set. Closing the session mid-way resets your attempt."}
                </span>
              </div>

              <button
                onClick={() => setIsPlaying(true)}
                className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black flex items-center justify-center gap-2 uppercase tracking-wider text-xs md:text-sm hover:scale-[1.01] active:scale-[0.99] transition-transform shadow-[0_4px_20px_rgba(249,115,22,0.3)] cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white text-white" />
                {isTamil ? "சவாலைத் தொடங்கு" : "Start Daily Challenge"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <NMMSQuizPlayer
          sessionType="daily_challenge"
          paperType="FULL"
          onBack={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
}

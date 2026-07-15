import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, CheckCircle2, XCircle, Swords, Trophy, Zap, RotateCcw } from "lucide-react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AdventureWorld, AdventureLevel, AdventureQuestion } from "./adventureData";
import { useCompletionReward } from "@/hooks/useCompletionReward";
import ReflectionModal from "@/components/learning/ReflectionModal";
import SurpriseRewardModal from "@/components/learning/SurpriseRewardModal";
import { broadcastActivityComplete } from "@/lib/quizSyncBus";

interface Props {
  world: AdventureWorld;
  level: AdventureLevel;
  lang?: "en" | "ta";
  onComplete: (stars: number, xp: number) => void;
  onBack: () => void;
}

const AdventureLevelPlayer = ({ world, level, onComplete, onBack }: Props) => {
  const { language: lang } = useLanguageStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const isTamil = lang === "ta";
  const completion = useCompletionReward(user?.id);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0); // authoritative score — avoids stale-state bug
  const [finished, setFinished] = useState(false);

  const questions = level.questions;
  const currentQ = questions[currentIdx];
  const totalPoints = questions.length * 10;
  const bossMultiplier = level.isBoss ? 2 : 1;

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    setSelected(answer);
    setShowResult(true);
    const correctAns = isTamil ? currentQ.answer_ta : currentQ.answer;
    if (answer === correctAns) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
    }
  };

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setFinished(true);
      // Use scoreRef for the authoritative score (React state may be stale)
      const finalScore = scoreRef.current;
      const pct = Math.round((finalScore / totalPoints) * 100);
      const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0;
      const xp = (pct >= 50 ? 20 : 5) * bossMultiplier;

      if (user) {
        try {
          await supabase.from("adventure_progress").upsert(
            {
              user_id: user.id,
              world_id: world.id,
              level_number: level.number,
              stars_earned: stars,
              is_unlocked: true,
              is_completed: pct >= 50,
              is_boss_level: level.isBoss,
              score: pct,
              xp_earned: xp,
              completed_at: new Date().toISOString(),
            },
            { onConflict: "user_id,world_id,level_number" }
          );
        } catch (e) {
          console.error("Failed to save adventure progress:", e);
        }

        // Also award XP to student_progress (best-effort)
        try {
          const { error } = await supabase.from("student_progress").insert({
            user_id: user.id,
            status: "completed",
            xp_earned: xp,
            completed_at: new Date().toISOString(),
          });
          if (error) {
            console.error("[AdventureLevelPlayer] Failed to insert student_progress:", error);
          }
          broadcastActivityComplete({ userId: user.id, activityType: "adventure", xp });
        } catch (e) {
          console.error("[AdventureLevelPlayer] Failed to save student progress:", e);
        }
      }

      toast({ title: `+${xp} XP ${isTamil ? "பெற்றீர்கள்" : "earned"}! ${"⭐".repeat(stars)}` });
      completion.triggerCompletion("adventure");
    }
  };

  // Completion screen
  if (finished) {
    const pct = Math.round((score / totalPoints) * 100);
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0;
    const passed = pct >= 50;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-3xl p-8 md:p-10 shadow-xl text-center max-w-md w-full border relative overflow-hidden"
        >
          {/* Decorative */}
          <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${world.theme} opacity-10`} />
          <div className={`absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-gradient-to-br ${world.theme} opacity-10`} />

          {/* Boss banner */}
          {level.isBoss && (
            <Badge variant="destructive" className="mb-4 gap-1">
              <Swords className="w-3 h-3" /> {isTamil ? "போஸ் நிலை முடிந்தது!" : "Boss Level Complete!"}
            </Badge>
          )}

          <motion.span
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
            className="text-7xl block mb-4 relative z-10"
          >
            {passed ? (stars === 3 ? "🏆" : "🎉") : "💪"}
          </motion.span>

          <h2 className="text-2xl font-black mb-2 relative z-10">
            {passed
              ? stars === 3
                ? (isTamil ? "சிறப்பு! 🌟" : "Perfect! 🌟")
                : (isTamil ? "வெற்றி! 🎊" : "Victory! 🎊")
              : (isTamil ? "மீண்டும் முயற்சிக்கவும்!" : "Try Again!")}
          </h2>

          {/* Stars */}
          <div className="flex justify-center gap-2 my-4">
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5 + s * 0.2, type: "spring" }}
              >
                <Star
                  className={`w-10 h-10 ${s <= stars ? "text-edu-yellow fill-edu-yellow drop-shadow-lg" : "text-muted/30"}`}
                />
              </motion.div>
            ))}
          </div>

          {/* Score ring */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="hsl(var(--muted)/0.3)" strokeWidth="6" fill="none" />
              <motion.circle
                cx="48" cy="48" r="40" stroke="hsl(var(--primary))" strokeWidth="6" fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: "251.3", strokeDashoffset: "251.3" }}
                animate={{ strokeDashoffset: 251.3 - (251.3 * pct / 100) }}
                transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-black text-primary">{pct}%</span>
            </div>
          </div>

          <p className="text-muted-foreground mb-6">
            {score}/{totalPoints} {isTamil ? "புள்ளிகள்" : "points"}
          </p>

          <div className="flex gap-3 justify-center relative z-10">
            <Button variant="outline" onClick={() => onComplete(stars, 0)} className="gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" /> {isTamil ? "உலகம்" : "World Map"}
            </Button>
            <Button
              onClick={() => {
                setCurrentIdx(0);
                setSelected(null);
                setShowResult(false);
                scoreRef.current = 0;
                setScore(0);
                setFinished(false);
              }}
              className={`gap-2 rounded-xl bg-gradient-to-r ${world.theme} text-white`}
            >
              <RotateCcw className="w-4 h-4" /> {isTamil ? "மீண்டும்" : "Retry"}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const correctAnswer = isTamil ? currentQ.answer_ta : currentQ.answer;
  const options = isTamil ? currentQ.options_ta : currentQ.options;
  const progressPct = ((currentIdx + (showResult ? 1 : 0)) / questions.length) * 100;

  return (
    <>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={onBack} className="gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" /> {isTamil ? "வெளியேறு" : "Exit"}
            </Button>
            {level.isBoss && (
              <Badge variant="destructive" className="gap-1 animate-pulse">
                <Swords className="w-3 h-3" /> {isTamil ? "போஸ் போர்" : "BOSS BATTLE"}
              </Badge>
            )}
          </div>

          {/* Title & Progress */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${world.theme} flex items-center justify-center text-2xl shadow-lg`}>
                {level.isBoss ? "⚔️" : world.emoji}
              </div>
              <div>
                <h1 className="text-xl font-black">{isTamil ? level.title_ta : level.title}</h1>
                <p className="text-xs text-muted-foreground">
                  {isTamil ? world.name_ta : world.name}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {isTamil ? "கேள்வி" : "Q"}
                  </p>
                  <p className="text-lg font-black">{currentIdx + 1}<span className="text-muted-foreground text-xs">/{questions.length}</span></p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {isTamil ? "புள்ளிகள்" : "Score"}
                  </p>
                  <p className="text-lg font-black text-primary flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />{score}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${world.theme}`}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className={`bg-card rounded-3xl p-6 md:p-8 shadow-lg border-2 ${level.isBoss ? "border-destructive/20" : "border-border/50"}`}
            >
              <h3 className="text-lg font-bold mb-1">
                {isTamil ? currentQ.q_ta : currentQ.q}
              </h3>
              {isTamil && (
                <p className="text-sm text-muted-foreground mb-4">{currentQ.q}</p>
              )}

              <div className="space-y-3 mt-6">
                {options.map((opt, i) => {
                  const letters = ["A", "B", "C", "D"];
                  const isSelected = selected === opt;
                  const isCorrect = opt === correctAnswer;

                  let style = "bg-muted/40 border-2 border-transparent hover:border-primary/30 hover:bg-primary/5";
                  if (showResult) {
                    if (isCorrect) style = "bg-xp/10 border-2 border-xp";
                    else if (isSelected && !isCorrect) style = "bg-destructive/10 border-2 border-destructive";
                    else style = "bg-muted/20 border-2 border-transparent opacity-50";
                  } else if (isSelected) {
                    style = "bg-primary/10 border-2 border-primary";
                  }

                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={!showResult ? { scale: 1.01, x: 3 } : {}}
                      onClick={() => handleAnswer(opt)}
                      disabled={showResult}
                      className={`w-full p-4 rounded-2xl transition-all flex items-center gap-3 ${style}`}
                    >
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${showResult && isCorrect
                        ? "bg-xp text-white"
                        : showResult && isSelected && !isCorrect
                          ? "bg-destructive text-white"
                          : `bg-gradient-to-br ${world.theme} text-white`
                        }`}>
                        {showResult && isCorrect ? <CheckCircle2 className="w-4 h-4" /> :
                          showResult && isSelected && !isCorrect ? <XCircle className="w-4 h-4" /> :
                            letters[i]}
                      </span>
                      <span className="font-semibold text-left">{opt}</span>
                    </motion.button>
                  );
                })}
              </div>

              {showResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Button
                    onClick={handleNext}
                    className={`mt-6 w-full rounded-xl bg-gradient-to-r ${world.theme} text-white font-bold text-base h-12`}
                  >
                    {currentIdx < questions.length - 1
                      ? (isTamil ? "அடுத்த கேள்வி →" : "Next Question →")
                      : level.isBoss
                        ? (isTamil ? "போஸ் முடி! 🏆" : "Finish Boss! 🏆")
                        : (isTamil ? "நிலை முடி! ⭐" : "Complete Level! ⭐")}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

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

export default AdventureLevelPlayer;

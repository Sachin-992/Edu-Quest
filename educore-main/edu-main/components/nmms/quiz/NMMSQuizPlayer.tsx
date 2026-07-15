import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageStore } from "@/store/useLanguageStore";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Clock,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  Award
} from "lucide-react";
import { NMMS_STATIC_QUESTIONS, NMMSQuestion } from "../questionsData";
import { broadcastActivityComplete } from "@/lib/quizSyncBus";
import NMMSReview from "./NMMSReview";

interface NMMSQuizPlayerProps {
  sessionType: "practice" | "daily_challenge";
  paperType: "MAT" | "SAT" | "FULL";
  subject?: "mathematics" | "science" | "social_science";
  chapter?: string;
  onBack: () => void;
  customQuestions?: NMMSQuestion[];
}

export default function NMMSQuizPlayer({
  sessionType,
  paperType,
  subject,
  chapter,
  onBack,
  customQuestions
}: NMMSQuizPlayerProps) {
  const { user, motivationProgress, updateProgress, addXp, addRating } = useAuth();
  const { language } = useLanguageStore();
  const isTamilDefault = language === "ta";

  // Toggle local language for the active question
  const [localLang, setLocalLang] = useState<"en" | "ta">(isTamilDefault ? "ta" : "en");
  const [questions, setQuestions] = useState<NMMSQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState<string[]>([]); // list of question ids where hint was used
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90); // 90 seconds per question
  const [quizComplete, setQuizComplete] = useState(false);

  // Stats / answers log for Review mode
  const [userAnswers, setUserAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [coinsReward, setCoinsReward] = useState(0);
  const [xpReward, setXpReward] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);

  // Load questions
  useEffect(() => {
    if (customQuestions && customQuestions.length > 0) {
      setQuestions(customQuestions);
      return;
    }
    let filtered = [...NMMS_STATIC_QUESTIONS];
    if (sessionType === "daily_challenge") {
      // Shuffle and pick 10 mixed questions
      filtered.sort(() => 0.5 - Math.random());
      setQuestions(filtered.slice(0, 10));
    } else {
      // Filter by paper type, subject, chapter
      if (paperType === "MAT") {
        filtered = filtered.filter(q => q.paper_type === "MAT" && q.chapter === chapter);
      } else {
        filtered = filtered.filter(
          q => q.paper_type === "SAT" && q.subject === subject && q.chapter === chapter
        );
      }
      // Shuffle questions within the chapter
      filtered.sort(() => 0.5 - Math.random());
      setQuestions(filtered.slice(0, 10)); // Max 10 per practice session
    }
  }, [sessionType, paperType, subject, chapter, customQuestions]);

  // Sync default language on mount
  useEffect(() => {
    setLocalLang(isTamilDefault ? "ta" : "en");
  }, [isTamilDefault]);

  // Question Timer
  useEffect(() => {
    if (isAnswered || quizComplete || questions.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up! Auto skip/wrong
          handleOptionSelect(null as any);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIdx, isAnswered, quizComplete, questions]);

  const activeQuestion: NMMSQuestion | undefined = questions[currentIdx];

  const handleOptionSelect = (opt: "A" | "B" | "C" | "D") => {
    if (isAnswered) return;
    setSelectedOpt(opt);
    setIsAnswered(true);
    setUserAnswers(prev => ({ ...prev, [activeQuestion.id]: opt }));

    const isCorrect = opt === activeQuestion.correct_answer;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleUseHint = async () => {
    if (!user || showHint || hintsUsed.includes(activeQuestion.id)) {
      setShowHint(true);
      return;
    }

    try {
      const curCoins = motivationProgress?.coins ?? 0;
      if (curCoins < 5) {
        // Fallback: unlock anyway or notify user
        setShowHint(true);
        return;
      }
      await updateProgress({ coins: Math.max(0, curCoins - 5) });
      setHintsUsed(prev => [...prev, activeQuestion.id]);
      setShowHint(true);
    } catch (err) {
      console.error("Error using hint:", err);
      setShowHint(true);
    }
  };

  const handleNext = () => {
    setIsAnswered(false);
    setSelectedOpt(null);
    setShowHint(false);
    setTimeLeft(90);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setQuizComplete(true);
    if (!user) return;

    setSavingProgress(true);
    try {
      const calculatedXp = score * 10;
      const baseCoins = score * 5;
      const bonusCoins = sessionType === "daily_challenge" ? 20 : 0;
      const finalCoins = baseCoins + bonusCoins;

      setXpReward(calculatedXp);
      setCoinsReward(finalCoins);

      // 1. Record session in public.nmms_sessions
      const { data: sessionData, error: sessionErr } = await supabase
        .from("nmms_sessions")
        .insert({
          user_id: user.id,
          session_type: sessionType,
          paper_type: paperType,
          subject: subject || null,
          total_questions: questions.length,
          answered: Object.keys(userAnswers).length,
          correct: score,
          wrong: questions.length - score,
          score: score,
          max_score: questions.length,
          xp_earned: calculatedXp,
          coins_earned: finalCoins,
          is_completed: true,
          answers: userAnswers
        })
        .select()
        .single();

      if (sessionErr) throw sessionErr;

      // 2. Broadcast activity to sync context XP
      broadcastActivityComplete({
        userId: user.id,
        activityType: sessionType === "daily_challenge" ? "daily_quest" : "quiz",
        xp: calculatedXp
      });

      // Chess.com-style Elo Rating calculations
      let ratingDelta = 0;
      const accuracy = questions.length > 0 ? (score / questions.length) * 100 : 0;
      if (accuracy === 100) ratingDelta = 25;
      else if (accuracy >= 80) ratingDelta = 15;
      else if (accuracy < 50) ratingDelta = -10;

      // 3. Update XP, ELO rating, and Coins in Supabase Motivation System
      await addXp(calculatedXp);
      await addRating(ratingDelta);
      const curCoins = motivationProgress?.coins ?? 0;
      await updateProgress({ coins: curCoins + finalCoins });

      // 4. Update daily completions if daily challenge
      if (sessionType === "daily_challenge") {
        // Fetch or create challenge_id?
        // Let's check or create a placeholder daily challenge if none exists,
        // or insert completion referencing null or custom UUID
        await supabase.from("nmms_daily_completions").insert({
          user_id: user.id,
          score: score,
          total: questions.length,
          xp_earned: calculatedXp,
          coins_earned: finalCoins
        });
      }

      // 5. Update nmms_progress for Practice Mode
      if (sessionType === "practice" && chapter) {
        // Check if progress already exists
        const { data: existingProgress } = await supabase
          .from("nmms_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("paper_type", paperType)
          .eq("chapter", chapter)
          .maybeSingle();

        if (existingProgress) {
          const newAttempted = existingProgress.questions_attempted + questions.length;
          const newCorrect = existingProgress.questions_correct + score;
          const newAccuracy = Math.round((newCorrect / newAttempted) * 100);

          await supabase
            .from("nmms_progress")
            .update({
              questions_attempted: newAttempted,
              questions_correct: newCorrect,
              accuracy: newAccuracy,
              last_practiced: new Date().toISOString(),
              mastery_level: Math.min(100, Math.round((newCorrect / newAttempted) * 100))
            })
            .eq("id", existingProgress.id);
        } else {
          await supabase.from("nmms_progress").insert({
            user_id: user.id,
            paper_type: paperType,
            subject: subject || null,
            chapter: chapter,
            questions_attempted: questions.length,
            questions_correct: score,
            accuracy: Math.round((score / questions.length) * 100),
            last_practiced: new Date().toISOString(),
            mastery_level: Math.round((score / questions.length) * 100)
          });
        }
      }
    } catch (err) {
      console.error("Error saving NMMS session:", err);
    } finally {
      setSavingProgress(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin text-purple-400 text-3xl">⏳</div>
      </div>
    );
  }

  // Quiz Completions view
  if (quizComplete) {
    return (
      <div className="max-w-2xl mx-auto bg-card border border-border/40 rounded-3xl p-6 md:p-8 space-y-8 text-center shadow-2xl">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full text-purple-400 text-[10px] font-black uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            {sessionType === "daily_challenge" ? (language === "ta" ? "தினசரி சவால்" : "Daily Challenge Finished") : (language === "ta" ? "பயிற்சி முடிந்தது" : "Practice Set Finished")}
          </div>
          <h2 className="text-2xl font-black text-foreground">
            {language === "ta" ? "வாழ்த்துகள்!" : "Session Complete!"}
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">
            {language === "ta"
              ? "நீங்கள் அனைத்து வினாக்களுக்கும் வெற்றிகரமாகப் பதிலளித்துள்ளீர்கள்."
              : "You have answered all questions in this session."}
          </p>
        </div>

        {/* Results Circular Score */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="text-5xl font-black text-purple-400">
            {score} / {questions.length}
          </div>
          <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
            {language === "ta" ? "சரியான விடைகள்" : "Correct Answers"}
          </div>
        </div>

        {/* Rewards grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/20 border border-border/30 rounded-2xl flex items-center justify-center gap-3">
            <span className="text-2xl">⚡</span>
            <div className="text-left">
              <div className="text-lg font-black text-foreground">+{xpReward} XP</div>
              <div className="text-[9px] text-muted-foreground font-bold uppercase">
                {language === "ta" ? "அனுபவ புள்ளிகள்" : "XP Earned"}
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/20 border border-border/30 rounded-2xl flex items-center justify-center gap-3">
            <span className="text-2xl">🪙</span>
            <div className="text-left">
              <div className="text-lg font-black text-foreground">+{coinsReward}</div>
              <div className="text-[9px] text-muted-foreground font-bold uppercase">
                {language === "ta" ? "நாணயங்கள்" : "Coins Gained"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={onBack}
            className="flex-1 py-4.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-black uppercase tracking-wider text-xs transition-colors cursor-pointer"
          >
            {language === "ta" ? "முகப்பிற்குத் திரும்பு" : "Return to Hub"}
          </button>
        </div>
      </div>
    );
  }

  // Active question render
  const questionText = localLang === "ta" && activeQuestion.question_text_ta ? activeQuestion.question_text_ta : activeQuestion.question_text;
  const optA = localLang === "ta" && activeQuestion.option_a_ta ? activeQuestion.option_a_ta : activeQuestion.option_a;
  const optB = localLang === "ta" && activeQuestion.option_b_ta ? activeQuestion.option_b_ta : activeQuestion.option_b;
  const optC = localLang === "ta" && activeQuestion.option_c_ta ? activeQuestion.option_c_ta : activeQuestion.option_c;
  const optD = localLang === "ta" && activeQuestion.option_d_ta ? activeQuestion.option_d_ta : activeQuestion.option_d;

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left pb-12">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-card/65 border border-border/30 backdrop-blur-md px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">
            {language === "ta" ? "கேள்வி" : "Question"} {currentIdx + 1} / {questions.length}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-orange-400 font-bold ml-4">
            <Clock className="w-4 h-4" />
            <span className={`${timeLeft <= 15 ? "text-red-500 animate-pulse" : ""}`}>{timeLeft}s</span>
          </div>
        </div>

        <button
          onClick={() => setLocalLang(l => l === "en" ? "ta" : "en")}
          className="text-[10px] font-black text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest border border-purple-500/20 px-2.5 py-1 rounded-xl bg-purple-500/5 cursor-pointer"
        >
          {localLang === "en" ? "தமிழ்" : "English"}
        </button>
      </div>

      {/* Main Question Card */}
      <div className="bg-card border border-border/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
        {/* Paper badge */}
        <div className="inline-flex bg-muted/30 border border-border/40 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md text-muted-foreground">
          {activeQuestion.paper_type} {activeQuestion.subject ? `• ${activeQuestion.subject.replace("_", " ")}` : ""}
        </div>

        <h3 className="text-base md:text-lg font-black text-foreground leading-relaxed">
          {questionText}
        </h3>

        {/* Options Stack */}
        <div className="grid grid-cols-1 gap-3.5">
          {([
            { id: "A", text: optA },
            { id: "B", text: optB },
            { id: "C", text: optC },
            { id: "D", text: optD }
          ] as const).map((opt) => {
            const isSel = selectedOpt === opt.id;
            const isCorrectAnswer = opt.id === activeQuestion.correct_answer;
            const showCorrect = isAnswered && isCorrectAnswer;
            const showIncorrect = isAnswered && isSel && !isCorrectAnswer;

            let btnStyle = "bg-muted/15 border-border/30 hover:border-purple-500/30";
            if (isSel && !isAnswered) btnStyle = "bg-purple-500/10 border-purple-500";
            if (showCorrect) btnStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-400";
            if (showIncorrect) btnStyle = "bg-red-500/10 border-red-500 text-red-400";

            return (
              <button
                key={opt.id}
                onClick={() => handleOptionSelect(opt.id)}
                disabled={isAnswered}
                className={`w-full flex items-center justify-between p-4.5 rounded-2xl border text-left font-bold transition-all text-xs md:text-sm cursor-pointer ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 shrink-0 rounded-lg bg-muted/20 border border-border/30 flex items-center justify-center text-[11px] font-black">
                    {opt.id}
                  </span>
                  <span>{opt.text}</span>
                </div>

                {showCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 ml-2" />}
                {showIncorrect && <XCircle className="w-5 h-5 text-red-500 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>

        {/* Hints / Help */}
        <div className="flex justify-between items-center pt-2">
          {!isAnswered ? (
            <button
              onClick={handleUseHint}
              className="inline-flex items-center gap-1 text-[10px] font-black text-yellow-500 hover:text-yellow-400 transition-colors uppercase tracking-widest cursor-pointer"
            >
              <Lightbulb className="w-4 h-4" />
              {showHint ? (language === "ta" ? "குறிப்பு திறக்கப்பட்டது" : "Hint Unlocked") : (language === "ta" ? "குறிப்பு (-5 🪙)" : "Hint (-5 🪙)")}
            </button>
          ) : (
            <div />
          )}

          {isAnswered && (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer"
            >
              <span>{language === "ta" ? "அடுத்த கேள்வி" : "Next Question"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Hint content drop-down */}
        {showHint && (
          <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 text-xs text-yellow-500 font-semibold leading-relaxed mt-4 animate-fadeIn">
            <strong>{language === "ta" ? "குறிப்பு: " : "Hint: "}</strong>
            {localLang === "ta" && activeQuestion.hint_ta ? activeQuestion.hint_ta : activeQuestion.hint}
          </div>
        )}
      </div>

      {/* Explanations reveals after answering */}
      {isAnswered && activeQuestion.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/40 rounded-3xl p-6 space-y-2 shadow-lg"
        >
          <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest">
            {language === "ta" ? "விளக்கம்" : "Solution & Explanation"}
          </h4>
          <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
            {localLang === "ta" && activeQuestion.explanation_ta ? activeQuestion.explanation_ta : activeQuestion.explanation}
          </p>
        </motion.div>
      )}
    </div>
  );
}

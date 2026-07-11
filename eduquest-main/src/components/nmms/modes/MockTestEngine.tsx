import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageStore } from "@/store/useLanguageStore";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Brain,
  HelpCircle,
  Play
} from "lucide-react";
import { NMMS_STATIC_QUESTIONS, NMMSQuestion } from "../questionsData";
import { broadcastActivityComplete } from "@/lib/quizSyncBus";

interface MockTestEngineProps {
  onBack: () => void;
}

export default function MockTestEngine({ onBack }: MockTestEngineProps) {
  const { user, motivationProgress, updateProgress, addXp, addRating } = useAuth();
  const { language } = useLanguageStore();
  const isTamilDefault = language === "ta";

  const [step, setStep] = useState<"lobby" | "test" | "results">("lobby");
  const [selectedPaper, setSelectedPaper] = useState<"MAT" | "SAT" | null>(null);
  const [questions, setQuestions] = useState<NMMSQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Exam state
  const [userAnswers, setUserAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [visited, setVisited] = useState<Record<number, boolean>>({ 0: true });

  // Timer: 90 minutes = 5400 seconds
  const [timeLeft, setTimeLeft] = useState(5400);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [localLang, setLocalLang] = useState<"en" | "ta">(isTamilDefault ? "ta" : "en");

  // Post-exam stats
  const [score, setScore] = useState(0);
  const [xpReward, setXpReward] = useState(0);
  const [coinsReward, setCoinsReward] = useState(0);
  const [saving, setSaving] = useState(false);

  // Initialize questions — no repeats, shuffled, capped at 90
  const startTest = (paper: "MAT" | "SAT") => {
    setSelectedPaper(paper);

    // Filter questions by selected paper type; fall back to all if empty
    let pool = NMMS_STATIC_QUESTIONS.filter(q => q.paper_type === paper);
    if (pool.length === 0) pool = [...NMMS_STATIC_QUESTIONS];
    else pool = [...pool];

    // Fisher-Yates shuffle for a randomized, non-repeating order
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Cap at 90 (real NMMS paper size); use all if fewer available
    const selected = pool.slice(0, 90);

    setQuestions(selected);
    setUserAnswers({});
    setMarkedForReview({});
    setVisited({ 0: true });
    setTimeLeft(5400);
    setCurrentIdx(0);
    setStep("test");
  };

  // Sync default language when global language changes
  useEffect(() => {
    setLocalLang(language === "ta" ? "ta" : "en");
  }, [language]);

  // Timer countdown
  useEffect(() => {
    if (step !== "test") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleOptionSelect = (opt: "A" | "B" | "C" | "D") => {
    setUserAnswers(prev => ({ ...prev, [currentIdx]: opt }));
  };

  const toggleReview = () => {
    setMarkedForReview(prev => ({ ...prev, [currentIdx]: !prev[currentIdx] }));
  };

  const navigateTo = (idx: number) => {
    setVisited(prev => ({ ...prev, [idx]: true }));
    setCurrentIdx(idx);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const submitExam = async (isAuto = false) => {
    setShowSubmitConfirm(false);
    setSaving(true);

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_answer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    const finalXp = correctCount * 5; // 5 XP per correct answer in Mock Test
    const finalCoins = correctCount * 2; // 2 coins per correct answer
    setXpReward(finalXp);
    setCoinsReward(finalCoins);

    try {
      if (user) {
        // Save session to DB
        await supabase.from("nmms_sessions").insert({
          user_id: user.id,
          session_type: "mock_test",
          paper_type: selectedPaper,
          total_questions: 90,
          answered: Object.keys(userAnswers).length,
          correct: correctCount,
          wrong: 90 - correctCount,
          score: correctCount,
          max_score: 90,
          xp_earned: finalXp,
          coins_earned: finalCoins,
          time_taken_seconds: 5400 - timeLeft,
          time_limit_seconds: 5400,
          is_completed: true
        });

        // Broadcast stats
        broadcastActivityComplete({
          userId: user.id,
          activityType: "quiz",
          xp: finalXp
        });

        // Chess.com-style Elo Rating calculations
        let ratingDelta = 0;
        const accuracy = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
        if (accuracy >= 80) ratingDelta = 40;
        else if (accuracy >= 50) ratingDelta = 15;
        else if (accuracy < 45) ratingDelta = -20;

        // Update XP, ELO rating, and Coins in Supabase Motivation System
        await addXp(finalXp);
        await addRating(ratingDelta);
        const curCoins = motivationProgress?.coins ?? 0;
        await updateProgress({ coins: curCoins + finalCoins });
      }
    } catch (err) {
      console.error("Error saving mock test results:", err);
    } finally {
      setSaving(false);
      setStep("results");
    }
  };

  const activeQuestion = questions[currentIdx];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 text-left">
      {/* ── LOBBY VIEW ── */}
      {step === "lobby" && (
        <div className="bg-card border border-border/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/5 rounded-bl-full pointer-events-none" />

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full text-purple-400 text-[10px] font-black uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              {isTamilDefault ? "முழு மாதிரித் தேர்வு" : "Full Length Mock Exam"}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-foreground">
              {isTamilDefault ? "90 நிமிட தேர்வு உருவகப்படுத்துதல்" : "Timed 90-Question Simulation"}
            </h2>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              {isTamilDefault
                ? "உண்மையான தேர்வு நேரத்தை அனுபவியுங்கள். 90 கேள்விகள், 90 நிமிடங்கள், எதிர்மறை மதிப்பெண்கள் இல்லை."
                : "Experience the real NMMS exam conditions. Exactly 90 questions, 90 minutes limit, auto-submits when time runs out."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Paper 1 MAT */}
            <div className="p-6 rounded-2xl bg-muted/20 border border-border/30 hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="text-2xl">🧠</div>
                <h4 className="text-sm font-black text-foreground">
                  {isTamilDefault ? "தாள் 1: மனத்திறன் தேர்வு (MAT)" : "Paper 1: Mental Ability Test (MAT)"}
                </h4>
                <p className="text-xs text-muted-foreground font-semibold">
                  {isTamilDefault
                    ? "ஆற்றல், பகுத்தறிதல், எண் ஒப்புமை மற்றும் தர்க்கத் திறன்."
                    : "Verbal and non-verbal reasoning, pattern matching, analogy & classifications."}
                </p>
              </div>
              <button
                onClick={() => startTest("MAT")}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                {isTamilDefault ? "தேர்வைத் தொடங்கு" : "Start MAT Exam"}
              </button>
            </div>

            {/* Paper 2 SAT */}
            <div className="p-6 rounded-2xl bg-muted/20 border border-border/30 hover:border-blue-500/30 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="text-2xl">🔬</div>
                <h4 className="text-sm font-black text-foreground">
                  {isTamilDefault ? "தாள் 2: கல்வித்திறன் தேர்வு (SAT)" : "Paper 2: Scholastic Aptitude Test (SAT)"}
                </h4>
                <p className="text-xs text-muted-foreground font-semibold">
                  {isTamilDefault
                    ? "7 மற்றும் 8-ஆம் வகுப்பு அறிவியல், சமூக அறிவியல் மற்றும் கணிதம்."
                    : "Class 7 & 8 academic curriculum of Science, Social Science, and Math."}
                </p>
              </div>
              <button
                onClick={() => startTest("SAT")}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                {isTamilDefault ? "தேர்வைத் தொடங்கு" : "Start SAT Exam"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEST EXAM PLAY VIEW ── */}
      {step === "test" && activeQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel: Active Question Card */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between bg-card/65 border border-border/30 backdrop-blur-md px-4 py-3 rounded-2xl">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  {isTamilDefault ? "கேள்வி" : "Question"} {currentIdx + 1} / {questions.length}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-red-500 font-black ml-4 animate-pulse">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>
              <button
                onClick={() => setLocalLang(l => l === "en" ? "ta" : "en")}
                className="text-[10px] font-black text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-xl bg-purple-500/5 cursor-pointer uppercase tracking-wider"
              >
                {localLang === "en" ? "தமிழ்" : "English"}
              </button>
            </div>

            <div className="bg-card border border-border/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative">
              <div className="inline-flex bg-muted/30 border border-border/40 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md text-muted-foreground">
                {selectedPaper} MOCK TEST
              </div>

              <h3 className="text-base md:text-lg font-black text-foreground leading-relaxed">
                {localLang === "ta" && activeQuestion.question_text_ta ? activeQuestion.question_text_ta : activeQuestion.question_text}
              </h3>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {([
                  { id: "A", text: localLang === "ta" && activeQuestion.option_a_ta ? activeQuestion.option_a_ta : activeQuestion.option_a },
                  { id: "B", text: localLang === "ta" && activeQuestion.option_b_ta ? activeQuestion.option_b_ta : activeQuestion.option_b },
                  { id: "C", text: localLang === "ta" && activeQuestion.option_c_ta ? activeQuestion.option_c_ta : activeQuestion.option_c },
                  { id: "D", text: localLang === "ta" && activeQuestion.option_d_ta ? activeQuestion.option_d_ta : activeQuestion.option_d }
                ] as const).map((opt) => {
                  const isSel = userAnswers[currentIdx] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionSelect(opt.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left font-bold transition-all text-xs md:text-sm cursor-pointer ${
                        isSel ? "bg-purple-600/10 border-purple-500 text-purple-400" : "bg-muted/10 border-border/30 hover:border-purple-500/20"
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border ${
                        isSel ? "bg-purple-600 text-white border-purple-600" : "bg-muted/20 border-border/30 text-muted-foreground"
                      }`}>
                        {opt.id}
                      </span>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Nav Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-border/30">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => navigateTo(currentIdx - 1)}
                  className="px-4 py-2.5 rounded-xl border border-border/30 hover:bg-muted/20 font-black text-xs uppercase text-muted-foreground disabled:opacity-30 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {isTamilDefault ? "முந்தைய" : "Prev"}
                </button>

                <button
                  onClick={toggleReview}
                  className={`px-4 py-2.5 rounded-xl border font-black text-xs uppercase cursor-pointer flex items-center gap-1.5 ${
                    markedForReview[currentIdx]
                      ? "bg-amber-500/10 border-amber-500 text-amber-400"
                      : "border-border/30 text-muted-foreground hover:bg-muted/20"
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  {isTamilDefault ? "மதிப்பாய்வு குறி" : "Review"}
                </button>

                {currentIdx < 89 ? (
                  <button
                    onClick={() => navigateTo(currentIdx + 1)}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1"
                  >
                    {isTamilDefault ? "அடுத்து" : "Next"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitConfirm(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider cursor-pointer"
                  >
                    {isTamilDefault ? "சமர்ப்பி" : "Submit"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar: 90 Questions Grid */}
          <div className="lg:col-span-4 bg-card border border-border/40 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-border/20 pb-3">
              <h4 className="text-xs font-black text-foreground uppercase tracking-wider">
                {isTamilDefault ? "வினாக்கள் பட்டியல்" : "Navigation Grid"}
              </h4>
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 font-black text-[10px] uppercase tracking-wider cursor-pointer"
              >
                {isTamilDefault ? "தேர்வை முடி" : "End Exam"}
              </button>
            </div>

            {/* Color Labels legend */}
            <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-muted/30 border border-border/30" />
                <span>{isTamilDefault ? "பார்க்காதவை" : "Unvisited"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-red-500/10 border border-red-500/30" />
                <span>{isTamilDefault ? "பதிலளிக்காதவை" : "Unanswered"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-purple-600/10 border border-purple-500/30" />
                <span>{isTamilDefault ? "பதிலளித்தவை" : "Answered"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-amber-500/10 border border-amber-500/30" />
                <span>{isTamilDefault ? "மதிப்பாய்வு" : "Review Flag"}</span>
              </div>
            </div>

            {/* Question number grid — dynamic size */}
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 pt-2 max-h-[300px] overflow-y-auto pr-1">
              {Array.from({ length: questions.length }).map((_, idx) => {
                const isCurrent = currentIdx === idx;
                const isAns = userAnswers[idx] !== undefined;
                const isRev = markedForReview[idx] === true;
                const isVis = visited[idx] === true;

                let gridStyle = "bg-muted/10 border-border/30 text-muted-foreground hover:bg-muted/20";
                if (isVis && !isAns) gridStyle = "bg-red-500/10 border-red-500/30 text-red-500";
                if (isAns) gridStyle = "bg-purple-600/10 border-purple-500/30 text-purple-400";
                if (isRev) gridStyle = "bg-amber-500/10 border-amber-500/30 text-amber-500";
                if (isCurrent) gridStyle = "ring-2 ring-purple-500 font-extrabold text-foreground";

                return (
                  <button
                    key={idx}
                    onClick={() => navigateTo(idx)}
                    className={`h-9 rounded-lg border text-xs font-bold transition-all relative flex items-center justify-center cursor-pointer ${gridStyle}`}
                  >
                    <span>{idx + 1}</span>
                    {isRev && (
                      <span className="absolute top-0.5 right-0.5 text-[7px]">🚩</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBMIT CONFIRMATION MODAL ── */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/50 max-w-sm w-full rounded-2xl p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="text-center space-y-2">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
              <h3 className="text-base font-black text-foreground">
                {isTamilDefault ? "தேர்வை சமர்ப்பிக்கவா?" : "Submit Exam?"}
              </h3>
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                {isTamilDefault
                  ? `நீங்கள் 90 கேள்விகளில் ${Object.keys(userAnswers).length} கேள்விகளுக்கு மட்டுமே பதிலளித்துள்ளீர்கள். தேர்வை சமர்ப்பிக்க விரும்புகிறீர்களா?`
                  : `You have answered ${Object.keys(userAnswers).length} out of 90 questions. Are you sure you want to end and submit the test?`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-border/30 hover:bg-muted/20 font-black text-xs uppercase cursor-pointer"
              >
                {isTamilDefault ? "ரத்துசெய்" : "Cancel"}
              </button>
              <button
                onClick={() => submitExam(false)}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase cursor-pointer"
              >
                {isTamilDefault ? "சமர்ப்பி" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESULTS SUMMARY VIEW ── */}
      {step === "results" && (
        <div className="max-w-2xl mx-auto bg-card border border-border/40 rounded-3xl p-6 md:p-8 space-y-8 text-center shadow-2xl">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full text-purple-400 text-[10px] font-black uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              {isTamilDefault ? "மாதிரித் தேர்வு முடிந்தது" : "Mock Exam Finished"}
            </div>
            <h2 className="text-2xl font-black text-foreground">
              {isTamilDefault ? "தேர்வு முடிவுகள்" : "Performance Summary"}
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">
              {isTamilDefault
                ? "90 நிமிட முழு மாதிரித் தேர்வை வெற்றிகரமாக முடித்துவிட்டீர்கள்."
                : "Your test attempt has been recorded and evaluated."}
            </p>
          </div>

          {/* Large Score circle */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              {score} / 90
            </div>
            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
              {isTamilDefault ? "சரியான விடைகள்" : "Total Score"}
            </div>
          </div>

          {/* Rewards Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4.5 bg-muted/20 border border-border/30 rounded-2xl flex items-center justify-center gap-3">
              <span className="text-2xl">⚡</span>
              <div className="text-left">
                <div className="text-lg font-black text-foreground">+{xpReward} XP</div>
                <div className="text-[9px] text-muted-foreground font-bold uppercase">
                  {isTamilDefault ? "அனுபவ புள்ளிகள்" : "XP Gained"}
                </div>
              </div>
            </div>

            <div className="p-4.5 bg-muted/20 border border-border/30 rounded-2xl flex items-center justify-center gap-3">
              <span className="text-2xl">🪙</span>
              <div className="text-left">
                <div className="text-lg font-black text-foreground">+{coinsReward}</div>
                <div className="text-[9px] text-muted-foreground font-bold uppercase">
                  {isTamilDefault ? "நாணயங்கள்" : "Coins Gained"}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onBack}
              className="w-full py-4.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-black uppercase tracking-wider text-xs transition-colors cursor-pointer"
            >
              {isTamilDefault ? "முகப்பிற்குத் திரும்பு" : "Return to Hub"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

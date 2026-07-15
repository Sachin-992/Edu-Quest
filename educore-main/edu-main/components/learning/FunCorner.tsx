import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Star, CheckCircle2, XCircle, Trophy, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useTranslation } from "react-i18next";
import StoryQuest from "./story-quest/StoryQuest";
import { broadcastActivityComplete } from "@/lib/quizSyncBus";
import {
  generateMathProblem,
  getClassLabel,
  getClassLabelTamil,
  shuffle,
} from "./fun-corner/gameData";
import { useMultilingualQuestions } from "@/hooks/useMultilingualQuestions";
import { getLocalFallback } from "./fun-corner/localFallback";

interface FunCornerProps {
  onBack: () => void;
  embedded?: boolean;
  onStartGame?: (game: GameType) => void;
  initialGame?: GameType;
}

type GameType = "math_challenge" | "gk_quiz" | "science_lab" | "vocabulary" | "story_quest";


export type { GameType };

// Gradient configs for each game type
const GAME_THEMES: Record<GameType, { gradient: string; accent: string; bg: string; emoji: string }> = {
  math_challenge: { gradient: "from-blue-500 to-cyan-400", accent: "text-cyan-400", bg: "bg-blue-500/10", emoji: "🧮" },
  gk_quiz: { gradient: "from-emerald-500 to-teal-400", accent: "text-emerald-400", bg: "bg-emerald-500/10", emoji: "🌍" },
  vocabulary: { gradient: "from-purple-500 to-pink-400", accent: "text-purple-400", bg: "bg-purple-500/10", emoji: "📖" },
  science_lab: { gradient: "from-orange-500 to-amber-400", accent: "text-orange-400", bg: "bg-orange-500/10", emoji: "🔬" },
  story_quest: { gradient: "from-rose-500 to-amber-400", accent: "text-rose-400", bg: "bg-rose-500/10", emoji: "📚" },
};

const FunCorner = ({ onBack, embedded = false, onStartGame, initialGame }: FunCornerProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const classLevel = profile?.class_level ?? 5;

  const [activeGame, setActiveGame] = useState<GameType | null>(initialGame ?? null);
  const [totalXP, setTotalXP] = useState(0);
  const { language: lang } = useLanguageStore();

  // Fetch Multilingual Data via React Query
  // For simplicity, we assign GK, Vocab, and Science all at once since they are cached
  const { data: gkData = [], isLoading: isLoadingGk } = useMultilingualQuestions("gk_quiz", classLevel);
  const { data: vocabData = [], isLoading: isLoadingVocab } = useMultilingualQuestions("vocabulary", classLevel);
  const { data: sciData = [], isLoading: isLoadingSci } = useMultilingualQuestions("science_lab", classLevel);

  // Math state (remains local logic)
  const [mathProblem, setMathProblem] = useState(generateMathProblem(classLevel));
  const [mathScore, setMathScore] = useState(0);
  const [mathQ, setMathQ] = useState(1);
  const [mathResult, setMathResult] = useState<"correct" | "wrong" | null>(null);

  // Quiz progression state maps
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [currentResult, setCurrentResult] = useState<"correct" | "wrong" | null>(null);
  const [isDone, setIsDone] = useState(false);

  const totalMathQs = 10;
  // Use DB data if available, else fallback to local grade-filtered questions
  const gkQuestions = useMemo(
    () => gkData.length > 0 ? gkData : getLocalFallback("gk_quiz", classLevel, lang),
    [gkData, classLevel, lang]
  );
  const vocabQuestions = useMemo(
    () => vocabData.length > 0 ? vocabData : getLocalFallback("vocabulary", classLevel, lang),
    [vocabData, classLevel, lang]
  );
  const sciQuestions = useMemo(
    () => sciData.length > 0 ? sciData : getLocalFallback("science_lab", classLevel, lang),
    [sciData, classLevel, lang]
  );

  const activeQuestions = activeGame === "gk_quiz" ? gkQuestions : activeGame === "vocabulary" ? vocabQuestions : activeGame === "science_lab" ? sciQuestions : [];
  const maxQs = activeGame === "science_lab" ? activeQuestions.length : 10;
  const totalQs = Math.min(activeQuestions.length, maxQs);

  const isTamil = lang === "ta";

  const awardXP = async (xp: number) => {
    if (xp <= 0) return;
    setTotalXP((t) => t + xp);
    if (user) {
      const { error } = await supabase.from("student_progress").insert({
        user_id: user.id, status: "completed", xp_earned: xp, completed_at: new Date().toISOString(),
      });
      if (error) {
        console.error("[FunCorner] Failed to insert student_progress:", error);
      }
      broadcastActivityComplete({ userId: user.id, activityType: "fun_corner", xp });
    }
    toast({ title: `+${xp} XP ${isTamil ? "பெற்றீர்கள்" : "earned"}! 🎉` });
  };

  const exitGame = () => {
    setActiveGame(null);
    onBack();
  };

  // ── Math handlers ──
  const startMath = () => {
    setMathScore(0); setMathQ(1); setMathResult(null);
    setMathProblem(generateMathProblem(classLevel));
    setActiveGame("math_challenge");
  };
  const checkMath = (ans: string) => {
    const correct = ans === mathProblem.answer;
    setMathResult(correct ? "correct" : "wrong");
    const newScore = correct ? mathScore + 10 : mathScore;
    if (correct) setMathScore(newScore);
    setTimeout(() => {
      if (mathQ >= totalMathQs) { awardXP(newScore); return; }
      setMathProblem(generateMathProblem(classLevel));
      setMathQ((q) => q + 1);
      setMathResult(null);
    }, 1000);
  };

  // ── Unified Handler ──
  const checkAnswer = (ans: string) => {
    if (!activeQuestions.length) return;
    const currentQ = activeQuestions[currentIdx];

    // For science, the true answer string is not perfectly mapped to correct_option_key because of bilingual differences, 
    // BUT since we fetch the translation flat, the exact localized option string is stored in option_a, option_b, etc.
    // So we can check the `correct_option_key` against the raw `ans` string!
    const correctOptString = currentQ[currentQ.correct_option_key as keyof typeof currentQ] as string;

    const isCorrect = ans === correctOptString;
    setCurrentResult(isCorrect ? "correct" : "wrong");

    // Scoring logic (Science gives +15, others +10)
    const points = activeGame === "science_lab" ? 15 : 10;
    const newScore = isCorrect ? currentScore + points : currentScore;
    if (isCorrect) setCurrentScore(newScore);

    // If Science, we require manual "Next" click to read explanation
    if (activeGame !== "science_lab") {
      setTimeout(() => {
        if (currentIdx >= totalQs - 1) {
          setIsDone(true);
          awardXP(newScore);
          return;
        }
        setCurrentIdx((i) => i + 1);
        setCurrentResult(null);
      }, 1200);
    }
  };

  const nextManual = () => {
    if (currentIdx >= totalQs - 1) {
      setIsDone(true);
      awardXP(currentScore);
      return;
    }
    setCurrentIdx((i) => i + 1);
    setCurrentResult(null);
  };

  // ── Start Handlers ──
  const startGame = (type: GameType) => {
    setActiveGame(type);
    setCurrentIdx(0);
    setCurrentScore(0);
    setCurrentResult(null);
    setIsDone(false);
  };

  const games = [
    { type: "story_quest" as GameType, icon: "📚", title: isTamil ? "கதை சவால்" : "Story Quest", desc: isTamil ? "கதைகள் மூலம் கற்றுக்கொள்!" : "Learn through adventures!", color: "bg-gradient-to-br from-rose-500/20 to-amber-500/10 border-rose-500/20", start: () => setActiveGame("story_quest") },
    { type: "math_challenge" as GameType, icon: "🧮", title: isTamil ? "கணித சவால்" : "Math Challenge", desc: isTamil ? `வகுப்பு ${classLevel} கணக்குகள்` : `Class ${classLevel} math problems`, color: "bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/20", start: startMath },
    { type: "gk_quiz" as GameType, icon: "🌍", title: isTamil ? "பொது அறிவு" : "GK Quiz", desc: isTamil ? `${gkQuestions.length}+ கேள்விகள்` : `${gkQuestions.length}+ questions`, color: "bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/20", start: () => startGame("gk_quiz") },
    { type: "vocabulary" as GameType, icon: "📖", title: isTamil ? "சொல்வளம்" : "Vocabulary Builder", desc: isTamil ? `${getClassLabelTamil(classLevel)} நிலை` : `${getClassLabel(classLevel)} level words`, color: "bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/20", start: () => startGame("vocabulary") },
    { type: "science_lab" as GameType, icon: "🔬", title: isTamil ? "அறிவியல் ஆய்வகம்" : "Science Explorer", desc: isTamil ? "சுவாரஸ்யமான சோதனைகள்" : "Fun experiments & questions", color: "bg-gradient-to-br from-orange-500/20 to-amber-500/10 border-orange-500/20", start: () => startGame("science_lab") },
  ];



  const classTag = (
    <Badge variant="outline" className="text-xs">
      📚 {isTamil ? `வகுப்பு ${classLevel} · ${getClassLabelTamil(classLevel)}` : `Class ${classLevel} · ${getClassLabel(classLevel)}`}
    </Badge>
  );

  // ── Completion Screen ──
  const CompletionScreen = ({ emoji, title, score, total, onReplay }: { emoji: string; title: string; score: number; total: number; onReplay: () => void }) => {
    const pct = Math.round((score / total) * 100);
    const isGreat = pct >= 80;
    const isOkay = pct >= 50;
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card rounded-3xl p-10 shadow-xl text-center max-w-md mx-auto w-full border relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/5" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-primary/5" />

          <motion.span initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: "spring", bounce: 0.5 }} className="text-7xl block mb-6 relative z-10">{emoji}</motion.span>
          <h3 className="text-3xl font-black mb-3 relative z-10">{title}</h3>

          {/* Score ring */}
          <div className="relative w-28 h-28 mx-auto mb-4">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle cx="56" cy="56" r="48" stroke="hsl(var(--muted)/0.3)" strokeWidth="8" fill="none" />
              <motion.circle
                cx="56" cy="56" r="48" stroke="hsl(var(--primary))" strokeWidth="8" fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: "301.6", strokeDashoffset: "301.6" }}
                animate={{ strokeDashoffset: 301.6 - (301.6 * pct / 100) }}
                transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-2xl font-black text-primary">{pct}%</motion.span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-primary" />
            <p className="text-xl font-bold">{score}/{total} {isTamil ? "புள்ளிகள்" : "points"}</p>
          </div>
          <p className="text-muted-foreground mb-6">
            {isGreat ? (isTamil ? "அருமை! 🌟" : "Outstanding! 🌟") : isOkay ? (isTamil ? "நன்று! தொடருங்கள் 💪" : "Good job! Keep going! 💪") : (isTamil ? "பயிற்சி செய்யுங்கள்! 📚" : "Keep practicing! 📚")}
          </p>
          <div className="flex gap-3 justify-center relative z-10">
            <Button variant="outline" onClick={exitGame} className="gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" /> {isTamil ? "முகப்பு" : "Dashboard"}
            </Button>
            <Button onClick={onReplay} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80">
              <RotateCcw className="w-4 h-4" /> {isTamil ? "மீண்டும்" : "Play Again"}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  // ── Game Menu (embedded on dashboard) ──
  if (!activeGame) {
    return (
      <div>
        {!embedded && (
          <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" /> {isTamil ? "பின்செல்" : "Back"}
          </Button>
        )}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-4xl">🎯</span>
          <div>
            <h2 className="text-2xl font-black">{isTamil ? "வேடிக்கை மூலை" : "Fun Corner"}</h2>
            <p className="text-muted-foreground">{isTamil ? "விளையாடி கற்றுக்கொள்!" : "Learn while having fun!"}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">

            {classTag}
            {totalXP > 0 && (
              <Badge className="text-lg px-4 py-1">
                <Star className="w-4 h-4 mr-1" /> {totalXP} XP
              </Badge>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {games.map((g, i) => (
            <motion.button
              key={g.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onStartGame ? onStartGame(g.type) : g.start()}
              className={`${g.color} rounded-2xl p-5 text-left border hover:shadow-lg transition-all`}
            >
              <span className="text-4xl mb-3 block">{g.icon}</span>
              <h3 className="text-base font-bold">{g.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{g.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // ── Story Quest (separate full component) ──
  if (activeGame === "story_quest") {
    return <StoryQuest classLevel={classLevel} onBack={exitGame} />;
  }

  // ── Full-Page Quiz Wrapper ──
  const theme = GAME_THEMES[activeGame];

  const QuizPageHeader = ({ title, current, total, score }: { title: string; current: number; total: number; score: number }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={exitGame} className="gap-2 text-muted-foreground hover:text-foreground rounded-xl">
          <ArrowLeft className="w-4 h-4" /> {isTamil ? "வெளியேறு" : "Exit Quiz"}
        </Button>

      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-3xl shadow-lg`}
          >
            {theme.emoji}
          </motion.div>
          <div>
            <h1 className="text-2xl font-black">{title}</h1>
            <div className="flex items-center gap-2 mt-1">
              {classTag}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{isTamil ? "கேள்வி" : "Question"}</p>
            <p className="text-xl font-black">{current}<span className="text-muted-foreground text-sm">/{total}</span></p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{isTamil ? "புள்ளிகள்" : "Score"}</p>
            <p className="text-xl font-black text-primary flex items-center gap-1"><Zap className="w-4 h-4" />{score}</p>
          </div>
        </div>
      </div>
      {/* Progress bar with gradient */}
      <div className="mt-5 relative">
        <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${theme.gradient}`}
            initial={{ width: 0 }}
            animate={{ width: `${(current / total) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        {/* Step dots */}
        <div className="flex justify-between mt-1 px-0.5">
          {Array.from({ length: total }, (_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < current ? "bg-primary" : "bg-muted/40"}`} />
          ))}
        </div>
      </div>
    </div>
  );

  const OptionButton = ({ label, index, onClick, disabled }: { label: string; index: number; onClick: () => void; disabled?: boolean }) => {
    const letters = ["A", "B", "C", "D"];
    return (
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.08 }}
        whileHover={!disabled ? { scale: 1.02, x: 4 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className="w-full p-4 bg-card border-2 border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all font-semibold text-left text-base disabled:opacity-50 flex items-center gap-4 group"
      >
        <span className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center text-sm font-black text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
          {letters[index]}
        </span>
        <span className={isTamil ? "font-tamil" : ""}>{label}</span>
      </motion.button>
    );
  };

  const ResultFeedback = ({ result, correctAnswer }: { result: "correct" | "wrong"; correctAnswer: string }) => (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-6">
      {result === "correct" ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex items-center gap-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.6 }}>
            <CheckCircle2 className="w-10 h-10 text-emerald-500 flex-shrink-0" />
          </motion.div>
          <div>
            <p className="font-bold text-lg text-emerald-600">{isTamil ? "சரி! 🎉" : "Correct! 🎉"}</p>
            <p className="text-sm text-muted-foreground">{isTamil ? "அருமை, தொடருங்கள்!" : "Great work, keep it up!"}</p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ delay: 0.2 }}
            className="ml-auto text-2xl"
          >
            +10
          </motion.div>
        </div>
      ) : (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-5 flex items-center gap-4">
          <motion.div initial={{ rotate: 0 }} animate={{ rotate: [0, -10, 10, 0] }}>
            <XCircle className="w-10 h-10 text-destructive flex-shrink-0" />
          </motion.div>
          <div>
            <p className="font-bold text-lg text-destructive">{isTamil ? "தவறு!" : "Not quite!"}</p>
            <p className={`text-sm ${isTamil ? "font-tamil" : ""}`}>{isTamil ? "சரியான பதில்:" : "Correct answer:"} <span className="font-bold">{correctAnswer}</span></p>
          </div>
        </div>
      )}
    </motion.div>
  );

  // ── Full-page game views ──
  const gameContent = () => {
    // ── Math Challenge ──
    if (activeGame === "math_challenge") {
      if (mathQ > totalMathQs || (mathResult && mathQ >= totalMathQs)) {
        return <CompletionScreen emoji="🏆" title={isTamil ? "கணித சவால் முடிந்தது!" : "Math Challenge Complete!"} score={mathScore} total={totalMathQs * 10} onReplay={startMath} />;
      }
      return (
        <>
          <QuizPageHeader title={isTamil ? "கணித சவால்" : "Math Challenge"} current={mathQ} total={totalMathQs} score={mathScore} />
          <div className="flex justify-center">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-3xl p-8 md:p-12 shadow-xl border max-w-lg w-full text-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.gradient}`} />
              <p className="text-sm text-muted-foreground mb-4">{isTamil ? "இதற்கு விடை காண்:" : "Solve this:"}</p>
              <motion.p key={mathQ} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl md:text-5xl font-black mb-8 tracking-tight">{mathProblem.question}</motion.p>
              {mathResult ? (
                <ResultFeedback result={mathResult} correctAnswer={mathProblem.answer} />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {mathProblem.options.map((opt, idx) => (
                    <motion.button
                      key={opt}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => checkMath(opt)}
                      className="p-5 bg-muted/30 rounded-2xl hover:bg-primary/10 transition-colors font-black text-2xl border-2 border-transparent hover:border-primary/30"
                    >
                      {opt}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      );
    }

    // ── GK Quiz ──
    if (activeGame === "gk_quiz") {
      if (isDone) {
        return <CompletionScreen emoji="🌟" title={isTamil ? "பொது அறிவு முடிந்தது!" : "GK Quiz Complete!"} score={currentScore} total={totalQs * 10} onReplay={() => startGame("gk_quiz")} />;
      }
      if (gkQuestions.length === 0) {
        return <p className="text-center text-muted-foreground py-20">{isTamil ? "உங்கள் வகுப்பிற்கு கேள்விகள் இல்லை." : "No questions available for your class level."}</p>;
      }
      const current = gkQuestions[currentIdx];
      const qText = current.question_text;
      const opts = [current.option_a, current.option_b, current.option_c, current.option_d].filter(Boolean) as string[];
      // The true answer is held loosely in the original format, but we check against correct_option_key in the check method.
      // For display purposes in the "incorrect" UI, we can just look up the correct string!
      const correctAns = current[current.correct_option_key as keyof typeof current] as string;
      return (
        <>
          <QuizPageHeader title={isTamil ? "பொது அறிவு" : "GK Quiz"} current={currentIdx + 1} total={totalQs} score={currentScore} />
          <div className="flex justify-center">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-3xl p-8 shadow-xl border max-w-lg w-full relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.gradient}`} />
              <motion.p key={currentIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-xl font-bold mb-6 text-center leading-relaxed ${isTamil ? "font-tamil" : ""}`}>{qText}</motion.p>
              {currentResult ? (
                <ResultFeedback result={currentResult} correctAnswer={correctAns} />
              ) : (
                <div className="space-y-3">
                  {opts.map((opt, idx) => (
                    <OptionButton key={opt} label={opt} index={idx} onClick={() => checkAnswer(opt)} />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      );
    }

    // ── Vocabulary Builder ──
    if (activeGame === "vocabulary") {
      if (isDone) {
        return <CompletionScreen emoji="📚" title={isTamil ? "சொல்வளம் முடிந்தது!" : "Vocabulary Complete!"} score={currentScore} total={totalQs * 10} onReplay={() => startGame("vocabulary")} />;
      }
      if (vocabQuestions.length === 0) {
        return <p className="text-center text-muted-foreground py-20">{isTamil ? "உங்கள் வகுப்பிற்கு சொற்கள் இல்லை." : "No words available for your class level."}</p>;
      }
      const current = vocabQuestions[currentIdx];

      // We stored the word as "What is the meaning of XYZ" in DB. Let's extract XYZ or just use the full string.
      const wordPrompt = current.question_text;
      const opts = shuffle([current.option_a, current.option_b, current.option_c, current.option_d].filter(Boolean) as string[]);
      const correctAns = current[current.correct_option_key as keyof typeof current] as string;

      return (
        <>
          <QuizPageHeader title={isTamil ? "சொல்வளம்" : "Vocabulary Builder"} current={currentIdx + 1} total={totalQs} score={currentScore} />
          <div className="flex justify-center">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-3xl p-8 shadow-xl border max-w-lg w-full text-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.gradient}`} />
              <p className="text-sm text-muted-foreground mb-2">{isTamil ? "இதன் பொருள் என்ன?" : "Answer this:"}</p>
              <motion.p key={currentIdx} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`text-2xl md:text-3xl font-black mb-8 ${isTamil ? "font-tamil" : ""}`}>{wordPrompt}</motion.p>
              {currentResult ? (
                <ResultFeedback result={currentResult} correctAnswer={correctAns} />
              ) : (
                <div className="space-y-3">
                  {opts.map((opt, idx) => (
                    <OptionButton key={opt} label={opt} index={idx} onClick={() => checkAnswer(opt)} />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      );
    }

    // ── Science Explorer ──
    if (activeGame === "science_lab") {
      if (isDone) {
        return <CompletionScreen emoji="🔬" title={isTamil ? "அறிவியல் ஆய்வு முடிந்தது!" : "Science Explorer Complete!"} score={currentScore} total={totalQs * 15} onReplay={() => startGame("science_lab")} />;
      }
      if (sciQuestions.length === 0) {
        return <p className="text-center text-muted-foreground py-20">{isTamil ? "உங்கள் வகுப்பிற்கு சோதனைகள் இல்லை." : "No experiments available for your class level."}</p>;
      }
      const exp = sciQuestions[currentIdx];

      // Because we didn't migrate `title` separate from `question` natively in the flat map, 
      // let's just use the question text!
      const title = isTamil ? "சோதனை" : "Experiment";
      const question = exp.question_text;
      const opts = [exp.option_a, exp.option_b, exp.option_c, exp.option_d].filter(Boolean) as string[];
      const correctAns = exp[exp.correct_option_key as keyof typeof exp] as string;
      const explanation = exp.explanation;

      return (
        <>
          <QuizPageHeader title={isTamil ? "அறிவியல் ஆய்வகம்" : "Science Explorer"} current={currentIdx + 1} total={totalQs} score={currentScore} />
          <div className="flex justify-center">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-3xl p-8 shadow-xl border max-w-lg w-full relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.gradient}`} />
              <h3 className={`text-2xl font-bold mb-4 text-center ${isTamil ? "font-tamil" : ""}`}>{title}</h3>
              <p className={`text-lg mb-6 text-center leading-relaxed ${isTamil ? "font-tamil" : ""}`}>{question}</p>
              {currentResult ? (
                <div>
                  <ResultFeedback result={currentResult} correctAnswer={correctAns} />
                  <div className="bg-muted/20 rounded-2xl p-5 mt-4 border border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">💡 {isTamil ? "விளக்கம்:" : "Explanation:"}</p>
                    <p className={`text-sm leading-relaxed ${isTamil ? "font-tamil" : ""}`}>{explanation}</p>
                  </div>
                  <div className="mt-4 text-center">
                    <Button onClick={nextManual} size="lg" className={`gap-2 rounded-xl bg-gradient-to-r ${theme.gradient}`}>
                      {currentIdx < totalQs - 1 ? (isTamil ? "அடுத்தது →" : "Next Experiment →") : (isTamil ? "முடிவுகள் 🏆" : "See Results 🏆")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {opts.map((opt, idx) => (
                    <OptionButton key={opt} label={opt} index={idx} onClick={() => checkAnswer(opt)} />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {gameContent()}
      </div>
    </div>
  );
};

export default FunCorner;

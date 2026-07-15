import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Lesson, Quiz, QuizQuestion } from "@/types/learning";
import { ArrowLeft, Star, CheckCircle2, ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useCompletionReward } from "@/hooks/useCompletionReward";
import { useLanguageStore } from "@/store/useLanguageStore";
import ReflectionModal from "./ReflectionModal";
import SurpriseRewardModal from "./SurpriseRewardModal";
import { broadcastActivityComplete } from "@/lib/quizSyncBus";

interface LessonViewerProps {
  lesson: Lesson;
  subjectName?: string;
  onBack: () => void;
  onStartQuiz?: (quiz: Quiz) => void; // kept for compatibility but unused
}

/* ── Fun facts to sprinkle between questions ── */
const FUN_FACTS = [
  "🧠 Your brain uses 20% of your body's energy!",
  "🌍 Earth rotates at about 1,670 km/h at the equator!",
  "📚 The word 'quiz' was invented in 1781!",
  "⚡ A bolt of lightning is 5x hotter than the sun's surface!",
  "🐙 Octopuses have 3 hearts and blue blood!",
  "🎵 Music can help improve your memory by 20%!",
  "🦋 Butterflies taste with their feet!",
  "🔢 111,111,111 × 111,111,111 = 12,345,678,987,654,321!",
];

const LessonViewer = ({ lesson, subjectName, onBack }: LessonViewerProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [completed, setCompleted] = useState(false);
  const [wasCompletedBefore, setWasCompletedBefore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const completion = useCompletionReward(user?.id);
  const { language } = useLanguageStore();
  const isTamil = language === "ta";

  // Inline quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [inlineAnswers, setInlineAnswers] = useState<Record<number, string>>({});
  const [inlineRevealed, setInlineRevealed] = useState<Record<number, boolean>>({});
  const [inlineScore, setInlineScore] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, progRes] = await Promise.all([
          supabase
            .from("quizzes")
            .select("*")
            .eq("lesson_id", lesson.id)
            .eq("is_active", true)
            .maybeSingle(),
          user
            ? supabase
              .from("student_progress")
              .select("*")
              .eq("user_id", user.id)
              .eq("lesson_id", lesson.id)
              .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        if (quizRes.data) {
          const q = quizRes.data as unknown as Quiz;
          setQuiz(q);
          // Fetch questions for inline display
          const { data: qData } = await supabase
            .from("quiz_questions")
            .select("*")
            .eq("quiz_id", q.id)
            .order("question_order");
          if (qData) {
            const parsed = (qData as any[]).map((q) => ({
              ...q,
              options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
            })) as QuizQuestion[];
            setQuestions(parsed);
          }
        }

        if (progRes.data && (progRes.data as any).status === "completed") {
          setWasCompletedBefore(true);
          setCompleted(true);
        }
      } catch (err) {
        console.error("[LessonViewer] Failed to fetch data:", err);
      }
    };
    fetchData();
  }, [lesson.id, user]);

  // Scroll-based reading progress
  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    const el = contentRef.current;
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const totalHeight = el.scrollHeight;
    const scrolled = Math.max(0, -rect.top + windowHeight * 0.3);
    const pct = Math.min(100, Math.round((scrolled / (totalHeight - windowHeight * 0.5)) * 100));
    setReadProgress(Math.max(pct, 0));
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const markComplete = async () => {
    if (!user || completed) return;
    setSaving(true);
    const { error } = await supabase.from("student_progress").upsert(
      {
        user_id: user.id,
        lesson_id: lesson.id,
        status: "completed" as const,
        xp_earned: lesson.xp_reward,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );
    setSaving(false);
    if (!error) {
      setCompleted(true);
      broadcastActivityComplete({ userId: user.id, activityType: "lesson", xp: lesson.xp_reward });
      toast({ title: `+${lesson.xp_reward} XP earned! 🎉` });
      completion.triggerCompletion("lesson");
    } else {
      console.error("[LessonViewer] Failed to upsert student_progress:", error);
    }
  };

  /* ── Inline quiz answer handler ── */
  const handleInlineAnswer = (qIdx: number, answer: string, correctAnswer: string) => {
    if (inlineRevealed[qIdx]) return; // already answered
    setInlineAnswers(prev => ({ ...prev, [qIdx]: answer }));
    setInlineRevealed(prev => ({ ...prev, [qIdx]: true }));
    if (answer === correctAnswer) {
      setInlineScore(prev => prev + 1);
    }
  };

  const allQuestionsAnswered = questions.length > 0 && Object.keys(inlineRevealed).length === questions.length;

  return (
    <div>
      {/* Reading Progress Bar */}
      <div className="sticky top-0 z-30 w-full h-1.5 bg-muted/50 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${readProgress}%` }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        />
      </div>

      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Lessons
      </Button>

      <motion.div
        ref={contentRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-6 md:p-8 shadow-card"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-black">{isTamil && lesson.title_tamil ? lesson.title_tamil : lesson.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {wasCompletedBefore && (
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            )}
            <div className="flex items-center gap-1 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full shrink-0">
              <Star className="w-4 h-4" /> {lesson.xp_reward} XP
            </div>
          </div>
        </div>

        {/* Reading progress indicator */}
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/60 rounded-full transition-all duration-300"
              style={{ width: `${readProgress}%` }}
            />
          </div>
          <span>{readProgress}% read</span>
        </div>

        {/* ═══ Content ═══ */}
        {lesson.content ? (
          <div className="prose prose-sm max-w-none mb-6">
            <p className={`text-foreground leading-relaxed whitespace-pre-wrap ${isTamil ? 'font-tamil text-lg' : ''}`}>
              {isTamil && lesson.content_tamil ? lesson.content_tamil : lesson.content}
            </p>
          </div>
        ) : !questions.length ? (
          <div className="py-8 text-center text-muted-foreground mb-6">
            <span className="text-4xl block mb-2">📖</span>
            <p className="font-medium">Content coming soon!</p>
            <p className="text-sm mt-1">Check back later for this lesson.</p>
          </div>
        ) : null}

        {/* ═══ Start Now Card (gate for quiz) ═══ */}
        {quiz && !quizStarted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-br from-primary/10 via-violet-500/8 to-indigo-500/10 border-2 border-primary/20 rounded-2xl p-6 md:p-8 text-center space-y-4"
          >
            <span className="text-5xl block">🚀</span>
            <h3 className="text-xl font-black text-foreground">Ready to test your knowledge?</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {questions.length > 0
                ? `Answer ${questions.length} quick questions about ${lesson.title} right here!`
                : `Take a quiz on ${lesson.title} and earn XP!`}
            </p>
            <Button
              size="lg"
              onClick={() => {
                if (questions.length > 0) {
                  setQuizStarted(true);
                } else {
                  const params = new URLSearchParams();
                  if (subjectName) params.set("subject", subjectName);
                  params.set("lessonId", lesson.id);
                  navigate(`/quiz/${quiz.id}?${params.toString()}`);
                }
              }}
              className="gap-2 text-lg px-10 py-6 mt-2 shadow-lg hover:shadow-xl transition-shadow"
            >
              🎯 Start Now
            </Button>
          </motion.div>
        )}

        {/* No quiz at all */}
        {!quiz && (
          <div className="mb-6 p-5 rounded-xl bg-muted/30 border border-border/40 text-center">
            <span className="text-3xl block mb-2">📝</span>
            <p className="text-sm text-muted-foreground font-medium">Quiz coming soon for this lesson!</p>
          </div>
        )}

        {/* ═══ Inline Knowledge Check (revealed after Start Now) ═══ */}
        {quizStarted && questions.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-black text-foreground">📝 Knowledge Check</h3>
              {allQuestionsAnswered && (
                <span className="ml-auto text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {inlineScore}/{questions.length} correct
                </span>
              )}
            </div>

            {questions.map((q, idx) => (
              <div key={q.id}>
                {/* Fun fact card between questions */}
                {idx > 0 && idx % 2 === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200/50 dark:border-amber-700/30"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        {FUN_FACTS[idx % FUN_FACTS.length]}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Question Card */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-5 rounded-xl border-2 transition-colors ${inlineRevealed[idx]
                    ? inlineAnswers[idx] === q.correct_answer
                      ? "border-green-400/50 bg-green-50/50 dark:bg-green-900/10"
                      : "border-red-400/50 bg-red-50/50 dark:bg-red-900/10"
                    : "border-border/50 bg-muted/20"
                    }`}
                >
                  {/* Question number + text */}
                  <div className="flex items-start gap-3 mb-4">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary text-sm font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className={`font-bold text-foreground leading-snug ${isTamil ? 'font-tamil text-lg' : ''}`}>
                        {isTamil && q.question_text_tamil ? q.question_text_tamil : q.question_text}
                      </p>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(q.options || []).map((englishOpt, optIdx) => {
                      const opt = isTamil && q.options_tamil && q.options_tamil[optIdx] ? q.options_tamil[optIdx] : englishOpt;
                      const isSelected = inlineAnswers[idx] === englishOpt;
                      const isCorrect = englishOpt === q.correct_answer;
                      const isRevealed = inlineRevealed[idx];
                      const optionLabel = String.fromCharCode(65 + optIdx); // A, B, C, D

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleInlineAnswer(idx, englishOpt, q.correct_answer)}
                          disabled={isRevealed}
                          className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all min-h-[44px] ${isRevealed
                            ? isCorrect
                              ? "border-green-400 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                              : isSelected
                                ? "border-red-400 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                                : "border-border/30 bg-muted/10 text-muted-foreground opacity-60"
                            : "border-border/40 bg-white dark:bg-white/5 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] cursor-pointer"
                            }`}
                        >
                          <span className="font-black mr-2 text-xs">{optionLabel}.</span>
                          {opt}
                          {isRevealed && isCorrect && " ✅"}
                          {isRevealed && isSelected && !isCorrect && " ❌"}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation after reveal */}
                  <AnimatePresence>
                    {inlineRevealed[idx] && q.explanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/40 dark:border-blue-700/30"
                      >
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          <strong>💡 Explanation:</strong> {q.explanation}
                        </p>
                        {q.explanation_tamil && (
                          <p className="text-sm text-blue-700/80 dark:text-blue-400/80 font-tamil mt-1">
                            {q.explanation_tamil}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            ))}

            {/* Score summary + actions after completing all questions */}
            <AnimatePresence>
              {allQuestionsAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-400/20 text-center space-y-3"
                >
                  <span className="text-4xl block">
                    {inlineScore === questions.length ? "🏆" : inlineScore >= questions.length / 2 ? "⭐" : "💪"}
                  </span>
                  <h4 className="text-lg font-black text-foreground">
                    {inlineScore === questions.length
                      ? "Perfect Score!"
                      : inlineScore >= questions.length / 2
                        ? "Good Job!"
                        : "Keep Practicing!"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You got <strong>{inlineScore}</strong> out of <strong>{questions.length}</strong> questions right.
                  </p>

                  {quiz && (
                    <Button
                      size="lg"
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (subjectName) params.set("subject", subjectName);
                        params.set("lessonId", lesson.id);
                        navigate(`/quiz/${quiz.id}?${params.toString()}`);
                      }}
                      className="gap-2 text-base px-6 py-5 mt-1"
                    >
                      🎯 Take Full Quiz for XP
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ═══ Actions ═══ */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!completed ? (
            <Button onClick={markComplete} disabled={saving} className="gap-2 text-base py-5">
              <CheckCircle2 className="w-5 h-5" />
              {saving ? "Saving..." : "I finished this! ✅"}
            </Button>
          ) : !wasCompletedBefore ? (
            /* Just completed this session — celebrate */
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold">
              <CheckCircle2 className="w-5 h-5" /> Lesson Complete! 🎉
            </div>
          ) : null}

          {completed && (
            <Button variant="outline" onClick={onBack} className="gap-2">
              Next Lesson <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.div>

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
    </div>
  );
};

export default LessonViewer;

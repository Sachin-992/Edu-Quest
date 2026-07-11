import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Quiz, QuizQuestion } from "@/types/learning";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import QuizFeedback from "./QuizFeedback";
import ShareAchievement from "./ShareAchievement";
import ConfettiCelebration from "./ConfettiCelebration";
import { useCompletionReward } from "@/hooks/useCompletionReward";
import { broadcastQuizComplete } from "@/lib/quizSyncBus";
import ReflectionModal from "./ReflectionModal";
import SurpriseRewardModal from "./SurpriseRewardModal";

interface QuizPlayerProps {
  quiz: Quiz;
  subjectName?: string;
  onBack: () => void;
  onComplete: () => void;
  onQuestionChange?: (index: number) => void;
}

const QuizPlayer = ({ quiz, subjectName, onBack, onComplete, onQuestionChange }: QuizPlayerProps) => {
  const { user, profile, motivationProgress, updateProgress, addXp, addRating } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);
  const completion = useCompletionReward(user?.id);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from("quiz_questions")
          .select("id, quiz_id, question_text, question_text_tamil, question_type, options, correct_answer, explanation, explanation_tamil, question_order, points")
          .eq("quiz_id", quiz.id)
          .order("question_order");
        if (error) {
          console.error("[QuizPlayer] Failed to fetch questions:", error);
          toast({ title: "Couldn't load questions 😕", description: "Check your connection and try again", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (data) {
          const parsed = (data as any[]).map((q) => ({
            ...q,
            options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
          })) as QuizQuestion[];
          setQuestions(parsed);
          setTotalPoints(parsed.reduce((sum, q) => sum + q.points, 0));
        }

        // Fetch previous score for this quiz
        if (user) {
          const { data: prev } = await supabase
            .from("student_progress")
            .select("score")
            .eq("user_id", user.id)
            .eq("quiz_id", quiz.id)
            .maybeSingle();
          if (prev?.score !== undefined) setPreviousScore(prev.score);
        }
      } catch (err) {
        console.error("[QuizPlayer] Unexpected error:", err);
        toast({ title: "Something went wrong 😕", description: "Please try again", variant: "destructive" });
      }
      setLoading(false);
    };
    fetchQuestions();
  }, [quiz.id, user]);

  const currentQ = questions[currentIdx];
  const progressPercent = questions.length > 0 ? ((currentIdx + (showResult ? 1 : 0)) / questions.length) * 100 : 0;

  const handleAnswer = async (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    if (answer === currentQ.correct_answer) {
      setScore((s) => s + currentQ.points);
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.85 }
        });
      } catch (e) {
        // Safe fallback if module load fails
      }
    }
  };

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setSelectedAnswer(null);
      setShowResult(false);
      onQuestionChange?.(nextIdx);
    } else {
      // Finished
      setFinished(true);
      
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 120,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      // score already includes the last question's points from handleAnswer
      // (React flushed the state between handleAnswer click and this "Finish" click)
      const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

      if (user) {
        const xpForThisQuiz = percentage >= quiz.passing_score ? quiz.xp_reward : Math.floor(quiz.xp_reward / 2);

        const progressRow = {
          user_id: user.id,
          quiz_id: quiz.id,
          status: "completed" as const,
          score: percentage,
          xp_earned: xpForThisQuiz,
          completed_at: new Date().toISOString(),
        };

        // Layer 1: Try student's own client (respects RLS)
        const { error: saveError } = await supabase
          .from("student_progress")
          .upsert(progressRow, { onConflict: "user_id,quiz_id" });

        if (saveError) {
          console.warn("[QuizPlayer] RLS upsert failed, trying admin fallback:", saveError.message);
          // Layer 2: Admin client fallback (bypasses RLS)
          try {
            const { getAdminClient } = await import("@/integrations/supabase/adminClient");
            const admin = getAdminClient();
            const { error: adminError } = await admin
              .from("student_progress")
              .upsert(progressRow, { onConflict: "user_id,quiz_id" });

            if (adminError) {
              console.error("[QuizPlayer] Admin fallback also failed:", adminError);
              toast({ title: "Couldn't save your score 😕", description: "Don't worry — try the quiz again", variant: "destructive" });
            } else {
              console.log("[QuizPlayer] Saved via admin client ✓");
              broadcastQuizComplete({ userId: user.id, quizId: quiz.id, xp: xpForThisQuiz, score: percentage });
            }
          } catch (e) {
            console.error("[QuizPlayer] Admin client import failed:", e);
            toast({ title: "Couldn't save your score 😕", description: "Don't worry — try the quiz again", variant: "destructive" });
          }
        } else {
          // Success via student client
          broadcastQuizComplete({ userId: user.id, quizId: quiz.id, xp: xpForThisQuiz, score: percentage });
        }

        // Chess.com-style Elo Rating calculations
        let ratingDelta = 0;
        if (percentage === 100) ratingDelta = 25;
        else if (percentage >= 80) ratingDelta = 15;
        else if (percentage < 50) ratingDelta = -10;

        const finalCoins = percentage >= quiz.passing_score ? 10 : 5;

        // Update Supabase Motivation System
        await addXp(xpForThisQuiz);
        await addRating(ratingDelta);
        const curCoins = motivationProgress?.coins ?? 0;
        await updateProgress({ coins: curCoins + finalCoins });
      }

      const xpEarned = percentage >= quiz.passing_score ? quiz.xp_reward : Math.floor(quiz.xp_reward / 2);
      toast({ title: `+${xpEarned} XP earned! ${percentage >= quiz.passing_score ? "🎉" : "📚"}` });
      completion.triggerCompletion("quiz");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-8 shadow-card text-center">
        <span className="text-5xl block mb-3">📝</span>
        <p className="text-muted-foreground">Questions are being prepared. Check back soon!</p>
        <Button onClick={onBack} className="mt-4">← Go Back</Button>
      </div>
    );
  }

  if (finished) {
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const passed = percentage >= quiz.passing_score;

    return (
      <>
        <ConfettiCelebration show={passed} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl p-8 shadow-card text-center max-w-md mx-auto"
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? "bg-edu-green/20" : "bg-edu-orange/20"
            }`}>
            <Trophy className={`w-10 h-10 ${passed ? "text-edu-green" : "text-edu-orange"}`} />
          </div>
          <h2 className="text-2xl font-black mb-1">
            {passed ? "Amazing work! 🎉" : "Almost there! 💪"}
          </h2>
          <p className="text-4xl font-black my-4">
            You got {score} out of {totalPoints}! {passed ? "🌟" : ""}
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            {passed
              ? "You did it! Keep going! 🚀"
              : "Don't worry — try one more time! You'll get it! 📚"}
          </p>

          {/* AI Feedback */}
          <QuizFeedback
            percentage={percentage}
            passed={passed}
            subjectName={subjectName}
            previousScore={previousScore}
          />

          <div className="flex gap-3 justify-center mt-6">
            <Button variant="outline" onClick={onBack}>← Back to Lesson</Button>
            <Button variant="outline" onClick={() => setShowShare(true)}>
              <Share2 className="w-4 h-4 mr-1" /> Share
            </Button>
            <Button onClick={onComplete} className="gap-1">Next Lesson →</Button>
          </div>

          {/* Share Achievement Modal */}
          <ShareAchievement
            isOpen={showShare}
            onClose={() => setShowShare(false)}
            achievement={{
              title: passed ? "Quiz Passed!" : "Quiz Completed",
              description: `Scored ${percentage}% on ${quiz.title}`,
              emoji: passed ? "🏆" : "📚",
              xp: percentage >= quiz.passing_score ? quiz.xp_reward : Math.floor(quiz.xp_reward / 2),
            }}
            studentName={profile?.full_name || "Student"}
          />
        </motion.div>
      </>
    );
  }

  return (
    <>
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </Button>

        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Question {currentIdx + 1} of {questions.length}</span>
              <span>Score: {score}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-card rounded-2xl p-6 shadow-card"
            >
              <h3 className="text-lg font-bold mb-1">{currentQ.question_text}</h3>
              {currentQ.question_text_tamil && (
                <p className="text-muted-foreground font-tamil mb-4">{currentQ.question_text_tamil}</p>
              )}

              <div className="space-y-3 mt-4">
                {currentQ.options.map((option, i) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQ.correct_answer;
                  let variant = "bg-muted hover:bg-muted/80";
                  if (showResult) {
                    if (isCorrect) variant = "bg-edu-green/20 border-2 border-edu-green";
                    else if (isSelected && !isCorrect) variant = "bg-destructive/20 border-2 border-destructive";
                    else variant = "bg-muted opacity-60";
                  } else if (isSelected) {
                    variant = "bg-primary/10 border-2 border-primary";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(option)}
                      disabled={showResult}
                      className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-3 ${variant}`}
                    >
                      <span className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-sm font-bold shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="font-medium">{option}</span>
                      {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-edu-green ml-auto shrink-0" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-destructive ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showResult && currentQ.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-4 bg-muted rounded-xl"
                >
                  <p className="text-sm font-medium text-muted-foreground mb-1">Explanation:</p>
                  <p className="text-sm">{currentQ.explanation}</p>
                  {currentQ.explanation_tamil && (
                    <p className="text-sm font-tamil text-muted-foreground mt-1">
                      {currentQ.explanation_tamil}
                    </p>
                  )}
                </motion.div>
              )}

              {showResult && (
                <Button onClick={handleNext} className="mt-4 w-full">
                  {currentIdx < questions.length - 1 ? "Next Question →" : "Finish Quiz 🏆"}
                </Button>
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

export default QuizPlayer;

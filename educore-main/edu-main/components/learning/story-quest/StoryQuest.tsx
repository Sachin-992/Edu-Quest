import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Globe, Lightbulb, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMultilingualStories, MultilingualStory } from "@/hooks/useMultilingualStories";
import { useLanguageStore } from "@/store/useLanguageStore";
import { broadcastActivityComplete } from "@/lib/quizSyncBus";

interface StoryQuestProps {
  onBack: () => void;
  classLevel: number;
}

type Phase = "select" | "reading" | "quiz" | "complete";

const StoryQuest = ({ onBack, classLevel }: StoryQuestProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage } = useLanguageStore();
  const [phase, setPhase] = useState<Phase>("select");
  const [selectedStory, setSelectedStory] = useState<MultilingualStory | null>(null);
  const [showKeyword, setShowKeyword] = useState<string | null>(null);
  const [thinkAnswers, setThinkAnswers] = useState<Record<number, number>>({});

  // Quiz state
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);

  const isTamil = language === "ta";

  // Fetch stories globally from Supabase via React Query
  const { data: allStories = [], isLoading } = useMultilingualStories();
  const stories = allStories.filter(s => classLevel >= s.classRange[0] && classLevel <= s.classRange[1]);

  const LangToggle = () => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setLanguage(language === "en" ? "ta" : "en")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm font-semibold shadow-sm hover:shadow-md transition-all"
    >
      <Globe className="w-3.5 h-3.5" />
      {language === "en" ? "தமிழ்" : "English"}
    </motion.button>
  );

  const startStory = (story: MultilingualStory) => {
    setSelectedStory(story);
    setThinkAnswers({});
    setShowKeyword(null);
    setPhase("reading");
  };

  const handleQuizAnswer = (answer: string) => {
    if (!selectedStory || quizResult) return;
    const q = selectedStory.questions[quizIdx];
    const correct = answer === q.answer; // Language translation is perfectly handled under the hood now
    setQuizResult(correct ? "correct" : "wrong");
    if (correct) setQuizScore((s) => s + 10);

    setTimeout(async () => {
      if (quizIdx < selectedStory.questions.length - 1) {
        setQuizIdx((i) => i + 1);
        setQuizResult(null);
      } else {
        // Complete
        const finalScore = quizScore + (correct ? 10 : 0);
        setQuizScore(finalScore);
        setPhase("complete");

        // Award XP
        if (user) {
          const xp = Math.max(Math.floor((finalScore / (selectedStory.questions.length * 10)) * selectedStory.xpReward), 5);
          const { error } = await supabase.from("student_progress").insert({
            user_id: user.id,
            status: "completed",
            xp_earned: xp,
            completed_at: new Date().toISOString(),
          });
          if (error) console.error("[StoryQuest] Failed to insert student_progress:", error);
            broadcastActivityComplete({ userId: user.id, activityType: "story_quest", xp: quest.xp_reward });
          toast({ title: `+${xp} XP earned! 📚🎉` });
        }
      }
    }, 1200);
  };

  // ── SELECT SCREEN ──
  if (phase === "select") {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> {isTamil ? "பின்செல்" : "Back"}
          </Button>
          <LangToggle />
        </div>

        <div className="text-center mb-8">
          <span className="text-5xl mb-3 block">📚</span>
          <h2 className="text-2xl font-black">{isTamil ? "கதை சவால்" : "Story Quest"}</h2>
          <p className="text-muted-foreground">{isTamil ? "கதைகள் மூலம் கற்றுக்கொள்!" : "Learn through adventures!"}</p>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-8 animate-pulse">
            {isTamil ? "கதைகளை ஏற்றுகிறது..." : "Loading stories..."}
          </p>
        ) : stories.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {isTamil ? "இந்த வகுப்புக்கு கதைகள் இல்லை" : "No stories available for your class level yet."}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {stories.map((story, i) => (
              <motion.button
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startStory(story)}
                className="bg-card rounded-2xl p-5 text-left border-2 border-transparent hover:border-primary/30 shadow-card hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{story.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="text-[10px] mb-1">{isTamil ? "பொது" : story.subject}</Badge>
                    <h3 className="font-black text-base">
                      {story.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {story.pages.length} {isTamil ? "பக்கங்கள்" : "pages"} · {story.questions.length} {isTamil ? "கேள்விகள்" : "questions"} · {story.xpReward} XP
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!selectedStory) return null;

  // ── READING SCREEN — all pages shown at once ──
  if (phase === "reading") {
    const setPageThinkAnswer = (pIdx: number, val: number) => {
      setThinkAnswers((prev) => ({ ...prev, [pIdx]: val }));
    };

    const allRequiredAnswered = selectedStory.pages.every((page, i) =>
      !page.thinkMoment || thinkAnswers[i] !== undefined
    );

    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => setPhase("select")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> {isTamil ? "வெளியேறு" : "Exit"}
          </Button>
          <LangToggle />
        </div>

        {/* Story title */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">{selectedStory.emoji}</span>
          <div>
            <h2 className="text-xl font-black">{selectedStory.title}</h2>
            <p className="text-xs text-muted-foreground">{selectedStory.pages.length} {isTamil ? "பக்கங்கள்" : "pages"} · {selectedStory.xpReward} XP</p>
          </div>
        </div>

        {/* All pages */}
        <div className="space-y-5">
          {selectedStory.pages.map((page, pIdx) => {
            const pageThinkAnswer = thinkAnswers[pIdx] ?? null;

            return (
              <motion.div
                key={pIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pIdx * 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-card border"
              >
                {/* Character + Story */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl shrink-0">
                    {page.character}
                  </div>
                  <div className="flex-1">
                    <p className="text-base leading-relaxed whitespace-pre-line">{page.text}</p>
                  </div>
                </div>

                {/* Keywords */}
                {page.keywords && page.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {page.keywords.map((kw) => (
                      <button
                        key={kw.word}
                        onClick={() => setShowKeyword(showKeyword === kw.word ? null : kw.word)}
                        className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-all"
                      >
                        💡 {kw.word}
                      </button>
                    ))}
                  </div>
                )}

                {/* Keyword meaning popup */}
                <AnimatePresence>
                  {showKeyword && page.keywords?.some(k => k.word === showKeyword) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 p-3 rounded-xl bg-primary/5 border border-primary/20"
                    >
                      <p className="text-sm">
                        <Lightbulb className="w-4 h-4 inline mr-1 text-primary" />
                        <strong>{showKeyword}:</strong>{" "}
                        {page.keywords.find((k) => k.word === showKeyword)?.meaning}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Think Moment */}
                {page.thinkMoment && (
                  <div className="mt-3 p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🧠</span>
                      <p className="font-bold text-sm">
                        {page.thinkMoment.question}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {page.thinkMoment.options.map((opt, i) => {
                        const selected = pageThinkAnswer === i;
                        const isCorrect = opt.isCorrect;
                        let style = "bg-card border-border hover:border-primary/50";
                        if (pageThinkAnswer !== null) {
                          if (isCorrect) style = "bg-green-50 dark:bg-green-900/20 border-green-400";
                          else if (selected) style = "bg-red-50 dark:bg-red-900/20 border-red-400";
                          else style = "bg-card border-border opacity-50";
                        }
                        return (
                          <button
                            key={i}
                            onClick={() => pageThinkAnswer === null && setPageThinkAnswer(pIdx, i)}
                            disabled={pageThinkAnswer !== null}
                            className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm font-medium ${style}`}
                          >
                            {opt.label}
                            {pageThinkAnswer !== null && selected && (
                              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-xs mt-1 ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                                {isCorrect ? "✅" : "❌"} {opt.feedback}
                              </motion.p>
                            )}
                            {pageThinkAnswer !== null && !selected && isCorrect && (
                              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs mt-1 text-green-600">
                                ✅ {opt.feedback}
                              </motion.p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Start Quiz button */}
        <div className="mt-6 flex justify-end">
          <Button
            size="lg"
            onClick={() => { setQuizIdx(0); setQuizScore(0); setQuizResult(null); setPhase("quiz"); }}
            disabled={!allRequiredAnswered}
            className="gap-2"
          >
            {isTamil ? "கேள்விகள் தொடங்கு" : "Start Quiz"} 🎯
          </Button>
        </div>
      </div>
    );
  }

  // ── QUIZ SCREEN ──
  if (phase === "quiz") {
    const q = selectedStory.questions[quizIdx];
    const options = q.options;
    const correctAnswer = q.answer;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => { setPhase("reading"); setQuizResult(null); }} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> {isTamil ? "பின்செல்" : "Back to Story"}
          </Button>
          <LangToggle />
        </div>
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{isTamil ? "கேள்வி" : "Question"} {quizIdx + 1} / {selectedStory.questions.length}</span>
            <span>{isTamil ? "புள்ளிகள்" : "Score"}: {quizScore}</span>
          </div>
          <Progress value={((quizIdx + 1) / selectedStory.questions.length) * 100} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={quizIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="bg-card rounded-2xl p-6 shadow-card"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🎯</span>
              <h3 className="text-lg font-bold">{q.question}</h3>
            </div>

            <div className="space-y-3">
              {options.map((opt, i) => {
                const isSelected = quizResult && opt === (quizResult === "correct" ? correctAnswer : opt);
                const isCorrectOpt = opt === correctAnswer;
                let variant = "bg-muted hover:bg-muted/80";
                if (quizResult) {
                  if (isCorrectOpt) variant = "bg-green-100 dark:bg-green-900/30 border-2 border-green-400";
                  else variant = "bg-muted opacity-60";
                }

                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => handleQuizAnswer(opt)}
                    disabled={quizResult !== null}
                    className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-3 ${variant}`}
                  >
                    <span className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-sm font-bold shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="font-medium">{opt}</span>
                    {quizResult && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto shrink-0" />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── COMPLETE SCREEN ──
  if (phase === "complete") {
    const total = selectedStory.questions.length * 10;
    const pct = Math.round((quizScore / total) * 100);
    const isGreat = pct >= 80;

    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-3xl p-10 shadow-xl text-center max-w-md w-full border relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/5" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-primary/5" />

          <motion.span
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
            className="text-7xl block mb-4 relative z-10"
          >
            {isGreat ? "🏆" : "📖"}
          </motion.span>

          <h3 className="text-2xl font-black mb-2 relative z-10">
            {isGreat
              ? (isTamil ? "அருமை! கதை நிறைவு!" : "Amazing! Story Complete!")
              : (isTamil ? "கதை நிறைவு!" : "Story Complete!")}
          </h3>

          <p className="text-3xl font-black text-primary my-3">{pct}%</p>
          <p className="text-muted-foreground mb-6">
            {quizScore}/{total} {isTamil ? "புள்ளிகள்" : "points"}
          </p>

          <div className="flex gap-3 justify-center relative z-10">
            <Button variant="outline" onClick={() => { setPhase("select"); setSelectedStory(null); }}>
              <BookOpen className="w-4 h-4 mr-1" /> {isTamil ? "மேலும் கதைகள்" : "More Stories"}
            </Button>
            <Button onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-1" /> {isTamil ? "முகப்பு" : "Dashboard"}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default StoryQuest;

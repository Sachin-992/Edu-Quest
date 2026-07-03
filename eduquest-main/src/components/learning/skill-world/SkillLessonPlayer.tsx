// ═══════════════════════════════════════════════════════════════
// Skill Lesson Player — Interactive Story + Decision + Quiz
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Star,
  Coins,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SKILL_CATEGORIES from './categories';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translateSkillLesson } from './lessonTranslator';
import { broadcastActivityComplete } from '@/lib/quizSyncBus';
import type { SkillLesson } from './types';
import { DIFFICULTY_META } from './types';


// ── Types ──────────────────────────────────────────────────────

type Phase = 'intro' | 'story' | 'decision' | 'quiz' | 'complete';

interface SkillLessonPlayerProps {
  lesson: SkillLesson;
  onComplete: (lessonId: string, xp: number, coins: number) => void;
  onBack: () => void;
}

// ── Confetti Particle ──────────────────────────────────────────

function ConfettiParticle({ index }: { index: number }) {
  const colors = [
    'bg-yellow-400',
    'bg-pink-400',
    'bg-blue-400',
    'bg-green-400',
    'bg-purple-400',
    'bg-red-400',
    'bg-indigo-400',
    'bg-amber-400',
  ];
  const color = colors[index % colors.length];
  const startX = Math.random() * 100;
  const endX = startX + (Math.random() - 0.5) * 60;
  const size = 6 + Math.random() * 8;
  const duration = 2 + Math.random() * 2;
  const delay = Math.random() * 0.8;
  const isCircle = Math.random() > 0.5;

  return (
    <motion.div
      className={`absolute ${color} ${isCircle ? 'rounded-full' : 'rounded-sm'}`}
      style={{
        width: size,
        height: isCircle ? size : size * 0.6,
        left: `${startX}%`,
        top: -10,
      }}
      initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
      animate={{
        y: [0, 600, 900],
        x: [0, (endX - startX) * 2, (endX - startX) * 4],
        opacity: [1, 1, 0],
        rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1), 720],
      }}
      transition={{
        duration,
        delay,
        ease: 'easeIn',
      }}
    />
  );
}

// ── Phase Indicator ────────────────────────────────────────────

function PhaseIndicator({ phase }: { phase: Phase }) {
  const { language } = useLanguageStore();
  const isTamil = language === 'ta';
  const phases: Phase[] = ['intro', 'story', 'decision', 'quiz', 'complete'];
  const currentIdx = phases.indexOf(phase);
  const labels = isTamil 
    ? ['அறிமுகம்', 'கதை', 'தேர்வு', 'விதிவினா', 'முடிந்தது']
    : ['Intro', 'Story', 'Choose', 'Quiz', 'Done'];

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 py-3 px-4">
      {phases.map((p, idx) => (
        <React.Fragment key={p}>
          <div className="flex flex-col items-center gap-1">
            <motion.div
              className={`
                w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all duration-300
                ${
                  idx < currentIdx
                    ? 'bg-emerald-500 scale-100'
                    : idx === currentIdx
                    ? 'bg-indigo-500 scale-110 ring-4 ring-indigo-500/20'
                    : 'bg-slate-300 dark:bg-gray-600 scale-90'
                }
              `}
              animate={
                idx === currentIdx
                  ? { scale: [1.1, 1.25, 1.1] }
                  : {}
              }
              transition={
                idx === currentIdx
                  ? { duration: 2, repeat: Infinity }
                  : {}
              }
            />
            <span
              className={`text-[10px] font-medium hidden sm:block ${
                idx <= currentIdx
                  ? 'text-slate-600 dark:text-gray-300'
                  : 'text-slate-400 dark:text-gray-500'
              }`}
            >
              {labels[idx]}
            </span>
          </div>
          {idx < phases.length - 1 && (
            <div
              className={`w-6 sm:w-10 h-0.5 rounded-full transition-colors duration-300 ${
                idx < currentIdx
                  ? 'bg-emerald-400'
                  : 'bg-slate-200 dark:bg-gray-700'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

const SkillLessonPlayer: React.FC<SkillLessonPlayerProps> = ({
  lesson: originalLesson,
  onComplete,
  onBack,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguageStore();
  const isTamil = language === 'ta';

  const lesson = useMemo(() => {
    return translateSkillLesson(originalLesson, isTamil);
  }, [originalLesson, isTamil]);

  // Phase state
  const [phase, setPhase] = useState<Phase>('intro');
  const [sceneIdx, setSceneIdx] = useState(0);

  // Decision state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showConsequence, setShowConsequence] = useState(false);

  // Quiz state
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);

  // Completion state
  const [saved, setSaved] = useState(false);

  const category = useMemo(
    () => SKILL_CATEGORIES.find((c) => c.id === lesson.categoryId),
    [lesson.categoryId],
  );

  const gradient = category?.gradient ?? 'from-indigo-500 to-purple-600';
  const diffMeta = DIFFICULTY_META[lesson.difficulty];

  // ── Decision logic ───────────────────────────────────────

  const selectedOption = useMemo(
    () => lesson.decision.options.find((o) => o.id === selectedOptionId) ?? null,
    [lesson.decision.options, selectedOptionId],
  );

  const handleDecisionSelect = (optionId: string) => {
    if (showConsequence) return;
    setSelectedOptionId(optionId);
    setShowConsequence(true);
  };

  const handleDecisionContinue = () => {
    if (!selectedOption) return;
    if (selectedOption.consequence.isCorrect) {
      setPhase('quiz');
    } else {
      // Reset for retry
      setSelectedOptionId(null);
      setShowConsequence(false);
    }
  };

  // ── Quiz logic ───────────────────────────────────────────

  const currentQuestion = lesson.quiz[quizIdx] ?? null;

  const handleQuizAnswer = useCallback(
    (answerIdx: number) => {
      if (showQuizResult || !currentQuestion) return;
      setSelectedAnswer(answerIdx);
      setShowQuizResult(true);

      if (answerIdx === currentQuestion.correctIndex) {
        setQuizScore((s) => s + 1);
      }

      // Auto-advance
      setTimeout(() => {
        if (quizIdx < lesson.quiz.length - 1) {
          setQuizIdx((i) => i + 1);
          setSelectedAnswer(null);
          setShowQuizResult(false);
        } else {
          setPhase('complete');
        }
      }, 1500);
    },
    [showQuizResult, currentQuestion, quizIdx, lesson.quiz.length],
  );

  // ── Save to Supabase on completion ───────────────────────

  useEffect(() => {
    if (phase !== 'complete' || saved) return;

    const saveProgress = async () => {
      try {
        if (user) {
          // Save skill lesson completion to localStorage (skill IDs are local,
          // not in the DB lessons table, so we cannot use the FK-constrained lesson_id column)
          const storageKey = `eduspark_skill_completed_${user.id}`;
          try {
            const existing = JSON.parse(localStorage.getItem(storageKey) || '[]') as string[];
            if (!existing.includes(originalLesson.id)) {
              existing.push(originalLesson.id);
              localStorage.setItem(storageKey, JSON.stringify(existing));
            }
          } catch { /* ignore parse errors */ }

          // Record XP in student_progress (without lesson_id to avoid FK violation)
          const { error: spError } = await supabase.from('student_progress').insert({
            user_id: user.id,
            status: 'completed',
            xp_earned: lesson.xpReward,
            completed_at: new Date().toISOString(),
          });
          if (spError) console.error('[SkillLessonPlayer] student_progress insert error:', spError);

          broadcastActivityComplete({ userId: user.id, activityType: 'skill_lesson', xp: lesson.xpReward });

          // Record coins
          await supabase.from('coin_transactions').insert({
            user_id: user.id,
            amount: lesson.coinReward,
            description: isTamil ? `திறன் உலகம் முடிந்தது: ${lesson.title}` : `Completed Skill World: ${lesson.title}`,
          });
        }
        setSaved(true);
        onComplete(originalLesson.id, lesson.xpReward, lesson.coinReward);
        toast({
          title: isTamil ? '🎉 பாடம் முடிந்தது!' : '🎉 Lesson Complete!',
          description: isTamil 
            ? `+${lesson.xpReward} XP, +${lesson.coinReward} நாணயங்கள் பெறப்பட்டன!`
            : `+${lesson.xpReward} XP, +${lesson.coinReward} coins earned!`,
        });
      } catch (err) {
        console.error('Failed to save progress:', err);
        // Still mark as complete in UI even if save fails
        setSaved(true);
        onComplete(originalLesson.id, lesson.xpReward, lesson.coinReward);
      }
    };

    saveProgress();
  }, [phase, saved, user, lesson, originalLesson, onComplete, toast]);

  // ── Slide animation variants ─────────────────────────────

  const slideVariants = {
    enter: { opacity: 0, x: 60 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-40 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Back bar */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-slate-200/60 dark:border-gray-800/60">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 text-slate-600 dark:text-gray-300"
          >
            <ArrowLeft className="w-4 h-4" />
            {isTamil ? 'பின்செல்' : 'Back'}
          </Button>
          <PhaseIndicator phase={phase} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        <Card className="border-0 shadow-xl overflow-hidden bg-white dark:bg-gray-900">
          {/* Gradient header strip */}
          <div className={`h-2 bg-gradient-to-r ${gradient}`} />

          <CardContent className="p-0">
            <AnimatePresence mode="wait">
              {/* ═══ INTRO PHASE ═══ */}
              {phase === 'intro' && (
                <motion.div
                  key="intro"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4 }}
                  className="p-6 sm:p-10"
                >
                  <div className="text-center">
                    <motion.div
                      className="text-7xl sm:text-8xl mb-4"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {lesson.characterEmoji}
                    </motion.div>

                    <motion.h2
                      className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-gray-100"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {lesson.title}
                    </motion.h2>

                    <motion.p
                      className="text-slate-500 dark:text-gray-400 mt-2 text-base"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {lesson.subtitle}
                    </motion.p>

                    <motion.div
                      className="flex flex-wrap justify-center gap-2 mt-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Badge variant="secondary" className={`${diffMeta.color} text-xs`}>
                        {diffMeta.emoji} {isTamil ? (lesson.difficulty === 'beginner' ? 'தொடக்கநிலை' : lesson.difficulty === 'intermediate' ? 'இடைநிலை' : lesson.difficulty === 'advanced' ? 'உயர்நிலை' : lesson.difficulty === 'master' ? 'நிபுணர்' : 'புராண நாயகர்') : diffMeta.label}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1 text-amber-500" />
                        {lesson.xpReward} XP
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Coins className="w-3 h-3 mr-1 text-amber-500" />
                        {lesson.coinReward} {isTamil ? 'நாணயங்கள்' : 'Coins'}
                      </Badge>
                    </motion.div>

                    <motion.div
                      className="mt-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <p className="text-xs text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                        {isTamil ? 'நீங்கள் கற்கும் மதிப்புகள்' : "Values you'll learn"}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {lesson.valuesTaught.map((v) => (
                          <Badge
                            key={v}
                            className={`bg-gradient-to-r ${gradient} text-white border-0 text-xs`}
                          >
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="mt-8"
                    >
                      <Button
                        onClick={() => setPhase('story')}
                        className={`h-14 px-10 text-lg font-bold bg-gradient-to-r ${gradient} text-white shadow-lg hover:shadow-xl transition-all`}
                      >
                        <BookOpen className="w-5 h-5 mr-2" />
                        {isTamil ? 'கதையைத் தொடங்கு' : 'Begin Story'}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* ═══ STORY PHASE ═══ */}
              {phase === 'story' && (
                <motion.div
                  key={`story-${sceneIdx}`}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35 }}
                  className="p-5 sm:p-8"
                >
                  {lesson.scenes[sceneIdx] && (
                    <>
                      {/* Scene title */}
                      <div className="flex items-center justify-between mb-5">
                        <Badge variant="outline" className="text-xs text-slate-500 dark:text-gray-400">
                          {isTamil ? `காட்சி ${sceneIdx + 1} / ${lesson.scenes.length}` : `Scene ${sceneIdx + 1} of ${lesson.scenes.length}`}
                        </Badge>
                        <span className="text-xs text-slate-400 dark:text-gray-500">
                          {lesson.scenes[sceneIdx].title}
                        </span>
                      </div>

                      {/* Comic panel layout */}
                      <div className="flex gap-4 sm:gap-6 items-start">
                        {/* Character */}
                        <motion.div
                          className="flex flex-col items-center shrink-0"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div
                            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
                          >
                            <span className="text-3xl sm:text-4xl">
                              {lesson.scenes[sceneIdx].illustration}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 mt-2 text-center max-w-[80px] truncate">
                            {lesson.scenes[sceneIdx].speaker}
                          </span>
                        </motion.div>

                        {/* Speech bubble */}
                        <motion.div
                          className="flex-1 min-w-0"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="relative bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl rounded-tl-md p-4 sm:p-5 shadow-inner">
                            {/* Speech bubble arrow */}
                            <div className="absolute -left-2 top-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-indigo-50 dark:border-r-indigo-950/30" />
                            <p className="text-base sm:text-lg text-slate-700 dark:text-gray-200 font-medium leading-relaxed italic">
                              &ldquo;{lesson.scenes[sceneIdx].dialogue}&rdquo;
                            </p>
                          </div>
                        </motion.div>
                      </div>

                      {/* Narrative text */}
                      <motion.p
                        className="mt-5 text-slate-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                      >
                        {lesson.scenes[sceneIdx].text}
                      </motion.p>

                      {/* Navigation */}
                      <div className="flex justify-between items-center mt-8">
                        <Button
                          variant="ghost"
                          onClick={() => setSceneIdx((i) => Math.max(0, i - 1))}
                          disabled={sceneIdx === 0}
                          className="gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          {isTamil ? 'பின்னால்' : 'Back'}
                        </Button>
                        <Button
                          onClick={() => {
                            if (sceneIdx < lesson.scenes.length - 1) {
                              setSceneIdx((i) => i + 1);
                            } else {
                              setPhase('decision');
                            }
                          }}
                          className={`h-12 px-6 gap-2 font-bold bg-gradient-to-r ${gradient} text-white shadow-lg`}
                        >
                          {sceneIdx < lesson.scenes.length - 1 ? (
                            <>
                              {isTamil ? 'அடுத்தது' : 'Next'}
                              <ArrowRight className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              {isTamil ? 'தேர்வு செய்' : 'Make a Choice'}
                              <Sparkles className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* ═══ DECISION PHASE ═══ */}
              {phase === 'decision' && (
                <motion.div
                  key="decision"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4 }}
                  className="p-5 sm:p-8"
                >
                  {!showConsequence ? (
                    <>
                      <motion.div
                        className="text-center mb-6"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <span className="text-4xl mb-3 block">🤔</span>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-gray-100">
                          {isTamil ? 'முடிவெடுக்கும் நேரம்!' : 'Decision Time!'}
                        </h3>
                        <p className="text-slate-600 dark:text-gray-300 mt-2 text-base sm:text-lg">
                          {lesson.decision.question}
                        </p>
                      </motion.div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {lesson.decision.options.map((opt, idx) => (
                          <motion.div
                            key={opt.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + idx * 0.15 }}
                          >
                            <motion.div
                              whileHover={{ y: -4, scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <Card
                                onClick={() => handleDecisionSelect(opt.id)}
                                className="cursor-pointer border-2 border-slate-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-200 shadow-md hover:shadow-xl"
                              >
                                <CardContent className="p-5 sm:p-6 text-center">
                                  <p className="font-semibold text-slate-700 dark:text-gray-200 text-base sm:text-lg">
                                    {opt.text}
                                  </p>
                                </CardContent>
                              </Card>
                            </motion.div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* Consequence view */
                    selectedOption && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-center"
                      >
                        <motion.div
                          className={`
                            inline-flex items-center justify-center w-20 h-20 rounded-full mb-4
                            ${
                              selectedOption.consequence.isCorrect
                                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                : 'bg-orange-100 dark:bg-orange-900/30'
                            }
                          `}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          {selectedOption.consequence.isCorrect ? (
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                          ) : (
                            <XCircle className="w-10 h-10 text-orange-500" />
                          )}
                        </motion.div>

                        <h3
                          className={`text-xl font-extrabold ${
                            selectedOption.consequence.isCorrect
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-orange-600 dark:text-orange-400'
                          }`}
                        >
                          {selectedOption.consequence.title}
                        </h3>

                        <div className="mt-4 max-w-md mx-auto">
                          <div
                            className={`rounded-2xl p-5 ${
                              selectedOption.consequence.isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/20'
                                : 'bg-orange-50 dark:bg-orange-950/20'
                            }`}
                          >
                            <span className="text-3xl block mb-2">
                              {selectedOption.consequence.illustration}
                            </span>
                            <p className="text-slate-600 dark:text-gray-300 text-base italic mb-3">
                              &ldquo;{selectedOption.consequence.dialogue}&rdquo;
                            </p>
                            <p className="text-slate-500 dark:text-gray-400 text-sm">
                              {selectedOption.consequence.text}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-gray-400">
                          💡 {selectedOption.consequence.lesson}
                        </p>

                        <Button
                          onClick={handleDecisionContinue}
                          className={`mt-6 h-12 px-8 font-bold text-white shadow-lg ${
                            selectedOption.consequence.isCorrect
                              ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                              : 'bg-gradient-to-r from-orange-500 to-amber-500'
                          }`}
                        >
                          {selectedOption.consequence.isCorrect ? (
                            <>
                              {isTamil ? 'வினாடி வினாவிற்குச் செல்' : 'Continue to Quiz'}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              {isTamil ? 'மீண்டும் முயற்சி செய்' : 'Try Again'}
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )
                  )}
                </motion.div>
              )}

              {/* ═══ QUIZ PHASE ═══ */}
              {phase === 'quiz' && currentQuestion && (
                <motion.div
                  key={`quiz-${quizIdx}`}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35 }}
                  className="p-5 sm:p-8"
                >
                  <div className="flex items-center justify-between mb-5">
                    <Badge variant="outline" className="text-xs">
                      {isTamil ? `கேள்வி ${quizIdx + 1} / ${lesson.quiz.length}` : `Question ${quizIdx + 1} of ${lesson.quiz.length}`}
                    </Badge>
                    <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0 text-xs">
                      {isTamil ? `மதிப்பெண்: ${quizScore}/${quizIdx + (showQuizResult ? 1 : 0)}` : `Score: ${quizScore}/${quizIdx + (showQuizResult ? 1 : 0)}`}
                    </Badge>
                  </div>

                  {/* Question progress bar */}
                  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-gray-700 mb-6 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                      animate={{
                        width: `${((quizIdx + 1) / lesson.quiz.length) * 100}%`,
                      }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-gray-100 mb-6">
                    {currentQuestion.question}
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options.map((option, idx) => {
                      let optionStyle =
                        'border-slate-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500';
                      let textColor = 'text-slate-700 dark:text-gray-200';

                      if (showQuizResult) {
                        if (idx === currentQuestion.correctIndex) {
                          optionStyle =
                            'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-600';
                          textColor = 'text-emerald-700 dark:text-emerald-400';
                        } else if (
                          idx === selectedAnswer &&
                          idx !== currentQuestion.correctIndex
                        ) {
                          optionStyle =
                            'border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-700';
                          textColor = 'text-red-600 dark:text-red-400';
                        } else {
                          optionStyle =
                            'border-slate-200 dark:border-gray-700 opacity-50';
                        }
                      }

                      return (
                        <motion.button
                          key={idx}
                          onClick={() => handleQuizAnswer(idx)}
                          disabled={showQuizResult}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          className={`
                            w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                            ${optionStyle}
                            ${!showQuizResult ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                                ${
                                  showQuizResult &&
                                  idx === currentQuestion.correctIndex
                                    ? 'bg-emerald-500 text-white'
                                    : showQuizResult &&
                                      idx === selectedAnswer &&
                                      idx !== currentQuestion.correctIndex
                                    ? 'bg-red-500 text-white'
                                    : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400'
                                }
                              `}
                            >
                              {showQuizResult &&
                              idx === currentQuestion.correctIndex ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : showQuizResult &&
                                idx === selectedAnswer &&
                                idx !== currentQuestion.correctIndex ? (
                                <XCircle className="w-5 h-5" />
                              ) : (
                                String.fromCharCode(65 + idx)
                              )}
                            </div>
                            <span className={`font-medium text-sm sm:text-base ${textColor}`}>
                              {option}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Explanation after answer */}
                  <AnimatePresence>
                    {showQuizResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 overflow-hidden"
                      >
                        <div
                          className={`rounded-xl p-4 text-sm ${
                            selectedAnswer === currentQuestion.correctIndex
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          <span className="font-semibold">
                            {selectedAnswer === currentQuestion.correctIndex
                              ? (isTamil ? '✅ சரி! ' : '✅ Correct! ')
                              : (isTamil ? '💡 விளக்கம்: ' : '💡 Explanation: ')}
                          </span>
                          {currentQuestion.explanation}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ═══ COMPLETE PHASE ═══ */}
              {phase === 'complete' && (
                <motion.div
                  key="complete"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                  className="relative p-6 sm:p-10 overflow-hidden"
                >
                  {/* Confetti */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(40)].map((_, i) => (
                      <ConfettiParticle key={i} index={i} />
                    ))}
                  </div>

                  <div className="relative z-10 text-center">
                    <motion.div
                      className="text-6xl sm:text-7xl mb-4"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    >
                      🎉
                    </motion.div>

                    <motion.h2
                      className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-gray-100"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      {isTamil ? 'பாடம் முடிந்தது!' : 'Lesson Complete!'}
                    </motion.h2>

                    <motion.p
                      className="text-slate-500 dark:text-gray-400 mt-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {isTamil 
                        ? `“${lesson.title}” பாடத்தை வெற்றிகரமாக முடித்ததற்கு பாராட்டுகள்!`
                        : `Amazing work finishing “${lesson.title}”!`}
                    </motion.p>

                    {/* Score summary */}
                    <motion.div
                      className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-4">
                        <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                          {quizScore}/{lesson.quiz.length}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                          {isTamil ? 'விதிவினா மதிப்பெண்' : 'Quiz Score'}
                        </div>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4">
                        <div className="flex items-center justify-center gap-1 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                          <Star className="w-5 h-5 fill-amber-400" />
                          {lesson.xpReward}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                          {isTamil ? 'பெற்ற XP' : 'XP Earned'}
                        </div>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4">
                        <div className="flex items-center justify-center gap-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                          <Coins className="w-5 h-5 text-emerald-500" />
                          {lesson.coinReward}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                          {isTamil ? 'நாணயங்கள்' : 'Coins'}
                        </div>
                      </div>
                    </motion.div>

                    {/* Values learned */}
                    <motion.div
                      className="mt-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <p className="text-xs text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                        {isTamil ? 'கற்றுக்கொண்ட மதிப்புகள்' : 'Values Learned'}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {lesson.valuesTaught.map((v, idx) => (
                          <motion.div
                            key={v}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.9 + idx * 0.1, type: 'spring' }}
                          >
                            <Badge
                              className={`bg-gradient-to-r ${gradient} text-white border-0 text-xs px-3 py-1`}
                            >
                              ✨ {v}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Back button */}
                    <motion.div
                      className="mt-10"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                    >
                      <Button
                        onClick={onBack}
                        className={`h-14 px-10 text-lg font-bold bg-gradient-to-r ${gradient} text-white shadow-lg hover:shadow-xl transition-all`}
                      >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        {isTamil ? 'வரைபடத்திற்குச் செல்' : 'Back to Roadmap'}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SkillLessonPlayer;

// ═══════════════════════════════════════════════════════════════
// Skill Roadmap — Vertical Progression Path for a Category
// ═══════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, CheckCircle2, Play, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { SkillCategory, SkillLesson } from './types';
import { DIFFICULTY_META } from './types';
import { useLanguageStore } from '@/store/useLanguageStore';

// ── Props ──────────────────────────────────────────────────────

interface SkillRoadmapProps {
  category: SkillCategory;
  gradeBand: string;
  lessons: SkillLesson[];
  completedLessonIds: string[];
  onBack: () => void;
  onStartLesson: (lesson: SkillLesson) => void;
}

// ── Component ──────────────────────────────────────────────────

const SkillRoadmap: React.FC<SkillRoadmapProps> = ({
  category,
  gradeBand,
  lessons,
  completedLessonIds,
  onBack,
  onStartLesson,
}) => {
  const { language } = useLanguageStore();
  const isTamil = language === 'ta';

  const getCategoryTranslation = (id: string, name: string, description: string, isTamil: boolean) => {
    if (!isTamil) return { name, description };
    const translations: Record<string, { name: string; description: string }> = {
      'english-communication': { name: 'ஆங்கிலத் தோழன்', description: 'வேடிக்கையான உரையாடல்கள் மூலம் ஆங்கிலப் பேச்சு மற்றும் எழுத்தில் தேர்ச்சி பெறுங்கள்' },
      'tamil-learning': { name: 'தமிழ் கற்றல்', description: 'கலாச்சாரம் மற்றும் கதைகள் மூலம் தமிழைக் கற்றுக்கொள்ளுங்கள்' },
      'life-skills': { name: 'வாழ்க்கைத் திறன்கள்', description: 'அன்றாட சூழ்நிலைகளுக்கான நடைமுறை திறன்கள்' },
      'money-management': { name: 'பண மேலாண்மை', description: 'சேமிப்பு, செலவு மற்றும் ஸ்மார்ட் பணத் தேர்வுகளைக் கற்றுக் கொள்ளுங்கள்' },
      'kindness-empathy': { name: 'அன்பு & இரக்கம்', description: 'உணர்வுகளைப் புரிந்து கொண்டு அன்பைப் பரப்புங்கள்' },
      'learn-say-no': { name: 'வேண்டாம் என்று சொல்ல பழகுங்கள்', description: 'எல்லைகளை உருவாக்கி உங்களுக்காக எழுந்து நில்லுங்கள்' },
      'negotiation': { name: 'பேச்சுவார்த்தை திறன்கள்', description: 'ஒவ்வொரு சூழ்நிலையிலும் வெற்றி-வெற்றி தீர்வுகளைக் கண்டறியவும்' },
      'communication': { name: 'தொடர்புத் திறன்கள்', description: 'உங்களை தெளிவாக வெளிப்படுத்துங்கள் மற்றும் நன்றாக கவனியுங்கள்' },
      'internet-tech': { name: 'இணையம் & தொழில்நுட்பம்', description: 'டிஜிட்டல் உலகை பாதுகாப்பாக வழிநடத்துங்கள்' },
      'ai-chatbots': { name: 'AI & சாட்போட்கள்', description: 'AI, சாட்போட்கள் மற்றும் எதிர்காலத்தைப் புரிந்து கொள்ளுங்கள்' },
      'creativity': { name: 'படைப்பாற்றல் & கற்பனை', description: 'உங்கள் ஆக்கப்பூர்வமான சக்திகளைத் திறக்கவும்' },
      'focus-discipline': { name: 'கவனம் & ஒழுக்கம்', description: 'தீவிர கவனம் மற்றும் வலுவான பழக்கங்களை உருவாக்குங்கள்' },
      'safety': { name: 'பாதுகாப்பு விழிப்புணர்வு', description: 'வீடு, பள்ளி மற்றும் ஆன்லைனில் பாதுகாப்பாக இருங்கள்' },
      'social-skills': { name: 'சமூகத் திறன்கள்', description: 'நண்பர்களை உருவாக்கி மற்றவர்களுடன் இணைந்து பணியாற்றுங்கள்' },
      'habit-building': { name: 'பழக்கவழக்கங்களை உருவாக்குதல்', description: 'என்றென்றும் நீடிக்கும் நல்ல பழக்கங்களை உருவாக்குங்கள்' },
      'emotional-control': { name: 'உணர்ச்சி கட்டுப்பாடு', description: 'அமைதியான வலிமையுடன் பெரிய உணர்வுகளை நிர்வகிக்கவும்' },
      'problem-solving': { name: 'பிரச்சனை தீர்த்தல்', description: 'புத்திசாலித்தனமாக சிந்தித்து கடினமான சவால்களை தீர்க்கவும்' },
      'public-speaking': { name: 'மேடைப் பேச்சு', description: 'எந்தவொரு கூட்டத்தின் முன்னிலையிலும் ஆற்றலுடன் பேசுங்கள்' }
    };
    return translations[id] || { name, description };
  };

  const getDifficultyTranslation = (label: string, isTamil: boolean) => {
    if (!isTamil) return label;
    const translations: Record<string, string> = {
      'Beginner': 'தொடக்கநிலை',
      'Intermediate': 'இடைநிலை',
      'Advanced': 'உயர்நிலை',
      'Master': 'நிபுணர்',
      'Legend': 'புராண நாயகர்',
    };
    return translations[label] || label;
  };

  const getValueTranslation = (val: string, isTamil: boolean) => {
    if (!isTamil) return val;
    const vals: Record<string, string> = {
      'Kindness': 'அன்பு',
      'Helping': 'உதவுதல்',
      'Empathy': 'இரக்கம்',
      'Respect': 'மரியாதை',
      'Safety': 'பாதுகாப்பு',
      'Communication': 'தொடர்பு',
      'Focus': 'கவனம்',
      'Saving': 'சேமிப்பு',
      'Spending': 'செலவழித்தல்',
      'Negotiation': 'பேச்சுவார்த்தை',
      'Internet': 'இணையம்',
      'Tech': 'தொழில்நுட்பம்',
      'AI': 'AI',
      'Creativity': 'படைப்பாற்றல்',
      'Confidence': 'தன்னம்பிக்கை',
      'Leadership': 'தலைமை',
    };
    return vals[val] || val;
  };
  // Sort lessons by order
  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => a.order - b.order),
    [lessons],
  );

  // Find the index of the next unlocked lesson
  const nextUnlockedIdx = useMemo(() => {
    for (let i = 0; i < sortedLessons.length; i++) {
      if (!completedLessonIds.includes(sortedLessons[i].id)) {
        return i;
      }
    }
    return -1; // all completed
  }, [sortedLessons, completedLessonIds]);

  return (
    <div className="min-h-screen pb-40 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* ── Header ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`relative overflow-hidden bg-gradient-to-br ${category.gradient}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.15),transparent_60%)]" />

        <div className="relative max-w-3xl mx-auto px-4 py-8 sm:py-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 text-white/80 hover:text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {isTamil ? "பின்னால்" : "Back"}
          </Button>

          <div className="flex items-center gap-4">
            <motion.span
              className="text-5xl sm:text-6xl drop-shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
            >
              {category.emoji}
            </motion.span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
                {getCategoryTranslation(category.id, category.name, category.description, isTamil).name}
              </h1>
              <p className="text-white/70 text-sm mt-1">
                {getCategoryTranslation(category.id, category.name, category.description, isTamil).description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  {isTamil ? `வகுப்புகள் ${gradeBand}` : `Grades ${gradeBand}`}
                </Badge>
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  {isTamil ? `${sortedLessons.length} பாடங்கள்` : `${sortedLessons.length} Lessons`}
                </Badge>
              </div>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>{isTamil ? "முன்னேற்றம்" : "Progress"}</span>
              <span>
                {sortedLessons.filter((l) =>
                  completedLessonIds.includes(l.id),
                ).length}
                /{sortedLessons.length}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-white/80"
                initial={{ width: 0 }}
                animate={{
                  width:
                    sortedLessons.length > 0
                      ? `${
                          (sortedLessons.filter((l) =>
                            completedLessonIds.includes(l.id),
                          ).length /
                            sortedLessons.length) *
                          100
                        }%`
                      : '0%',
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Roadmap ─────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 mt-8">
        {sortedLessons.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <span className="text-5xl">📭</span>
            <p className="mt-4 text-slate-500 dark:text-gray-400 text-lg">
              {isTamil ? "இந்த வகுப்பு பிரிவிற்கு இன்னும் பாடங்கள் இல்லை." : "No lessons available for this grade band yet."}
            </p>
            <p className="mt-1 text-slate-400 dark:text-gray-500 text-sm">
              {isTamil ? "விரைவில் சரிபார்க்கவும் — புதிய பாடங்கள் வருகின்றன!" : "Check back soon — new lessons are on the way!"}
            </p>
          </motion.div>
        ) : (
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-300 via-slate-200 to-transparent dark:from-gray-600 dark:via-gray-700 dark:to-transparent" />

            {sortedLessons.map((lesson, idx) => {
              const isCompleted = completedLessonIds.includes(lesson.id);
              const isNext = idx === nextUnlockedIdx;
              const isLocked = false;
              const allDone = nextUnlockedIdx === -1;
              const isPlayable = true;

              const diffMeta = DIFFICULTY_META[lesson.difficulty];

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: idx * 0.08,
                    ease: 'easeOut',
                  }}
                  className="relative pl-14 sm:pl-20 pb-8 last:pb-0"
                >
                  {/* Node circle on the line */}
                  <div className="absolute left-3.5 sm:left-5.5 top-4">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: idx * 0.08 + 0.2 }}
                      >
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 fill-emerald-500" />
                      </motion.div>
                    ) : isNext ? (
                      <motion.div
                        animate={{
                          scale: [1, 1.3, 1],
                          boxShadow: [
                            '0 0 0 0 rgba(99, 102, 241, 0.4)',
                            '0 0 0 10px rgba(99, 102, 241, 0)',
                            '0 0 0 0 rgba(99, 102, 241, 0)',
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center"
                      >
                        <Play className="w-2.5 h-2.5 text-white fill-white" />
                      </motion.div>
                    ) : (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <Play className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400 fill-indigo-500 dark:fill-indigo-400" />
                      </div>
                    )}
                  </div>

                  {/* Lesson card */}
                  <motion.div
                    whileHover={isPlayable ? { y: -3, scale: 1.01 } : {}}
                    whileTap={isPlayable ? { scale: 0.98 } : {}}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Card
                      onClick={() => isPlayable && onStartLesson(lesson)}
                      className={`
                        border transition-all duration-300 overflow-hidden
                        ${isCompleted
                          ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md'
                          : isNext
                          ? 'border-indigo-300 dark:border-indigo-700 shadow-lg shadow-indigo-500/10 dark:shadow-indigo-500/5 cursor-pointer'
                          : isLocked
                          ? 'border-slate-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                          : 'border-slate-200 dark:border-gray-700 shadow-md cursor-pointer'
                        }
                      `}
                    >
                      {/* Glow strip for next lesson */}
                      {isNext && (
                        <motion.div
                          className={`h-1 bg-gradient-to-r ${category.gradient}`}
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}

                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3
                                className={`font-bold text-base sm:text-lg truncate ${
                                  isCompleted
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : isLocked
                                    ? 'text-slate-400 dark:text-gray-500'
                                    : 'text-slate-800 dark:text-gray-100'
                                }`}
                              >
                                {lesson.title}
                              </h3>
                              {isCompleted && (
                                <span className="text-sm">✅</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5 truncate">
                              {lesson.subtitle}
                            </p>

                            {/* Meta row */}
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${diffMeta.color}`}
                              >
                                {diffMeta.emoji} {getDifficultyTranslation(diffMeta.label, isTamil)}
                              </Badge>
                              {lesson.valuesTaught.slice(0, 2).map((v) => (
                                <Badge
                                  key={v}
                                  variant="outline"
                                  className="text-xs text-slate-500 dark:text-gray-400"
                                >
                                  {getValueTranslation(v, isTamil)}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* XP badge */}
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="w-4 h-4 fill-amber-400" />
                              <span className="text-sm font-bold">
                                {lesson.xpReward}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                              XP
                            </span>
                          </div>
                        </div>

                        {/* Action area */}
                        {(!isCompleted) && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="mt-4"
                          >
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartLesson(lesson);
                              }}
                              className={`w-full h-12 text-base font-bold bg-gradient-to-r ${category.gradient} text-white shadow-lg hover:shadow-xl transition-shadow`}
                            >
                              <Play className="w-5 h-5 mr-2 fill-white" />
                              {isTamil ? "பாடத்தைத் தொடங்கு" : "Start Lesson"}
                            </Button>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              );
            })}

            {/* All complete celebration */}
            {nextUnlockedIdx === -1 && sortedLessons.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: sortedLessons.length * 0.08 + 0.3, type: 'spring' }}
                className="relative pl-14 sm:pl-20 pt-4"
              >
                <div className="absolute left-3.5 sm:left-5.5 top-7">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-2xl"
                  >
                    🏆
                  </motion.div>
                </div>
                <Card className="border-amber-200 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 shadow-lg">
                  <CardContent className="p-5 text-center">
                    <p className="font-bold text-amber-700 dark:text-amber-400 text-lg">
                      {isTamil ? "🎉 அனைத்து பாடங்களும் முடிந்தது!" : "🎉 All Lessons Complete!"}
                    </p>
                    <p className="text-sm text-amber-600/70 dark:text-amber-500/70 mt-1">
                      {isTamil 
                        ? `நீங்கள் ${getCategoryTranslation(category.id, category.name, category.description, isTamil).name}-ல் உள்ள அனைத்து பாடங்களையும் கற்றுக்கொண்டீர்கள்!`
                        : `You've mastered every lesson in ${category.name}!`}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillRoadmap;

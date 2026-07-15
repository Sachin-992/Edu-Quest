// ═══════════════════════════════════════════════════════════════
// Skill World Hub — Main Entry Point
// ═══════════════════════════════════════════════════════════════

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Coins, Trophy, BookOpen, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SKILL_CATEGORIES from './categories';
import { GRADE_BANDS, type SkillLesson, type GradeBandInfo } from './types';
import { useLanguageStore } from '@/store/useLanguageStore';

// ── Props ──────────────────────────────────────────────────────

interface SkillWorldHubProps {
  onBack: () => void;
  onSelectCategory: (categoryId: string, gradeBand: string) => void;
  completedLessonIds: string[];
  allLessons: SkillLesson[];
  selectedGrade: number;
  coins: number;
  totalXP: number;
}

// ── Helpers ────────────────────────────────────────────────────

function getGradeBandForGrade(grade: number): string {
  const band = GRADE_BANDS.find((b) => b.grades.includes(grade));
  return band?.id ?? '1-2';
}

function getGradesForBand(bandId: string): number[] {
  const band = GRADE_BANDS.find((b) => b.id === bandId);
  return band?.grades ?? [1, 2];
}

// ── Component ──────────────────────────────────────────────────

const SkillWorldHub: React.FC<SkillWorldHubProps> = ({
  onBack,
  onSelectCategory,
  completedLessonIds,
  allLessons,
  selectedGrade,
  coins,
  totalXP,
}) => {
  const { language } = useLanguageStore();
  const isTamil = language === 'ta';
  const [activeBand, setActiveBand] = useState<string>(
    getGradeBandForGrade(selectedGrade),
  );

  const getCategoryTranslation = (id: string, name: string, description: string, isTamil: boolean) => {
    if (!isTamil) return { name, description };
    
    const translations: Record<string, { name: string; description: string }> = {
      'english-communication': {
        name: 'ஆங்கிலத் தோழன்',
        description: 'வேடிக்கையான உரையாடல்கள் மூலம் ஆங்கிலப் பேச்சு மற்றும் எழுத்தில் தேர்ச்சி பெறுங்கள்'
      },
      'tamil-learning': {
        name: 'தமிழ் கற்றல்',
        description: 'கலாச்சாரம் மற்றும் கதைகள் மூலம் தமிழைக் கற்றுக்கொள்ளுங்கள்'
      },
      'life-skills': {
        name: 'வாழ்க்கைத் திறன்கள்',
        description: 'அன்றாட சூழ்நிலைகளுக்கான நடைமுறை திறன்கள்'
      },
      'money-management': {
        name: 'பண மேலாண்மை',
        description: 'சேமிப்பு, செலவு மற்றும் ஸ்மார்ட் பணத் தேர்வுகளைக் கற்றுக் கொள்ளுங்கள்'
      },
      'kindness-empathy': {
        name: 'அன்பு & இரக்கம்',
        description: 'உணர்வுகளைப் புரிந்து கொண்டு அன்பைப் பரப்புங்கள்'
      },
      'learn-say-no': {
        name: 'வேண்டாம் என்று சொல்ல பழகுங்கள்',
        description: 'எல்லைகளை உருவாக்கி உங்களுக்காக எழுந்து நில்லுங்கள்'
      },
      'negotiation': {
        name: 'பேச்சுவார்த்தை திறன்கள்',
        description: 'ஒவ்வொரு சூழ்நிலையிலும் வெற்றி-வெற்றி தீர்வுகளைக் கண்டறியவும்'
      },
      'communication': {
        name: 'தொடர்புத் திறன்கள்',
        description: 'உங்களை தெளிவாக வெளிப்படுத்துங்கள் மற்றும் நன்றாக கவனியுங்கள்'
      },
      'internet-tech': {
        name: 'இணையம் & தொழில்நுட்பம்',
        description: 'டிஜிட்டல் உலகை பாதுகாப்பாக வழிநடத்துங்கள்'
      },
      'ai-chatbots': {
        name: 'AI & சாட்போட்கள்',
        description: 'AI, சாட்போட்கள் மற்றும் எதிர்காலத்தைப் புரிந்து கொள்ளுங்கள்'
      },
      'creativity': {
        name: 'படைப்பாற்றல் & கற்பனை',
        description: 'உங்கள் ஆக்கப்பூர்வமான சக்திகளைத் திறக்கவும்'
      },
      'confidence': {
        name: 'தன்னம்பிக்கை வளர்த்தல்',
        description: 'உங்களை நம்பி பிரகாசமாக ஒளிரச் செய்யுங்கள்'
      },
      'leadership': {
        name: 'தலைமைப் பணிகள்',
        description: 'குழுக்களை வழிநடத்தி மற்றவர்களை ஊக்குவிக்கவும்'
      },
      'focus-discipline': {
        name: 'கவனம் & ஒழுக்கம்',
        description: 'தீவிர கவனம் மற்றும் வலுவான பழக்கங்களை உருவாக்குங்கள்'
      },
      'safety': {
        name: 'பாதுகாப்பு விழிப்புணர்வு',
        description: 'வீடு, பள்ளி மற்றும் ஆன்லைனில் பாதுகாப்பாக இருங்கள்'
      },
      'social-skills': {
        name: 'சமூகத் திறன்கள்',
        description: 'நண்பர்களை உருவாக்கி மற்றவர்களுடன் இணைந்து பணியாற்றுங்கள்'
      },
      'habit-building': {
        name: 'பழக்கவழக்கங்களை உருவாக்குதல்',
        description: 'என்றென்றும் நீடிக்கும் நல்ல பழக்கங்களை உருவாக்குங்கள்'
      },
      'emotional-control': {
        name: 'உணர்ச்சி கட்டுப்பாடு',
        description: 'அமைதியான வலிமையுடன் பெரிய உணர்வுகளை நிர்வகிக்கவும்'
      },
      'problem-solving': {
        name: 'பிரச்சனை தீர்த்தல்',
        description: 'புத்திசாலித்தனமாக சிந்தித்து கடினமான சவால்களை தீர்க்கவும்'
      },
      'public-speaking': {
        name: 'மேடைப் பேச்சு',
        description: 'எந்தவொரு கூட்டத்தின் முன்னிலையிலும் ஆற்றலுடன் பேசுங்கள்'
      }
    };
    
    return translations[id] || { name, description };
  };

  const getBandTranslation = (id: string, label: string, description: string, isTamil: boolean) => {
    if (!isTamil) return { label, description };
    const translations: Record<string, { label: string; description: string }> = {
      '1-2': { label: 'சின்னஞ்சிறு நட்சத்திரங்கள்', description: 'எளிய கதைகளுடன் கூடிய வேடிக்கையான காட்சி கற்றல்!' },
      '3-4': { label: 'வளரும் ஆராய்ச்சியாளர்கள்', description: 'விறுவிறுப்பான சாகசங்கள் மூலம் திறன்களை வளர்த்துக் கொள்ளுங்கள்!' },
      '5-6': { label: 'ஸ்மார்ட் சவாலாளர்கள்', description: 'நிஜ உலக சவால்களை எதிர்கொள்ளுங்கள்!' },
      '7-8': { label: 'எதிர்கால தலைவர்கள்', description: 'தலைமை மற்றும் வாழ்க்கைக்கு தயாராகுங்கள்!' },
    };
    return translations[id] || { label, description };
  };

  // Lessons filtered by selected grade band
  const bandLessons = useMemo(() => {
    const grades = getGradesForBand(activeBand);
    return allLessons.filter(
      (l) => grades.some((g) => g >= l.gradeMin && g <= l.gradeMax),
    );
  }, [allLessons, activeBand]);

  // Per-category stats
  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};
    SKILL_CATEGORIES.forEach((cat) => {
      const catLessons = bandLessons.filter((l) => l.categoryId === cat.id);
      const completed = catLessons.filter((l) =>
        completedLessonIds.includes(l.id),
      ).length;
      map[cat.id] = { total: catLessons.length, completed };
    });
    return map;
  }, [bandLessons, completedLessonIds]);

  // Global completion
  const totalLessons = bandLessons.length;
  const totalCompleted = bandLessons.filter((l) =>
    completedLessonIds.includes(l.id),
  ).length;
  const completionPct =
    totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen pb-40 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* ── Back button ─────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-slate-200/60 dark:border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            {isTamil ? "முகப்பு" : "Dashboard"}
          </Button>
        </div>
      </div>

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-800 dark:via-purple-900 dark:to-pink-800" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/20"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -12, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          />
        ))}

        <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-14 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-lg"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            {isTamil ? "திறன் உலகம் 🌍" : "Skill World 🌍"}
          </motion.h1>
          <p className="mt-2 text-white/80 text-base sm:text-lg max-w-md mx-auto">
            {isTamil ? "ஊடாடும் கதைகள் மூலம் நிஜ வாழ்க்கை திறன்களை மாஸ்டர் செய்யுங்கள்!" : "Master real-life skills through interactive stories!"}
          </p>
 
          {/* Stats row */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-6">
            <StatPill icon={<Sparkles className="w-4 h-4" />} label="XP" value={totalXP.toLocaleString()} />
            <StatPill icon={<Coins className="w-4 h-4" />} label={isTamil ? "நாணயங்கள்" : "Coins"} value={coins.toLocaleString()} />
            <StatPill icon={<Trophy className="w-4 h-4" />} label={isTamil ? "முடிந்தது" : "Done"} value={`${completionPct}%`} />
            <StatPill icon={<BookOpen className="w-4 h-4" />} label={isTamil ? "பாடங்கள்" : "Lessons"} value={`${totalCompleted}/${totalLessons}`} />
          </div>
        </div>
      </motion.div>

      {/* ── Grade Band Selector ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 -mt-5 relative z-10">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {GRADE_BANDS.map((band) => (
            <GradeBandTab
              key={band.id}
              band={band}
              isActive={activeBand === band.id}
              onClick={() => setActiveBand(band.id)}
              isTamil={isTamil}
            />
          ))}
        </div>
      </div>

      {/* ── Band Description ────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {GRADE_BANDS.filter((b) => b.id === activeBand).map((band) => (
          <motion.p
            key={band.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-center text-sm text-slate-500 dark:text-gray-400 mt-4 px-4"
          >
            {band.emoji} {getBandTranslation(band.id, band.label, band.description, isTamil).label} — {getBandTranslation(band.id, band.label, band.description, isTamil).description}
          </motion.p>
        ))}
      </AnimatePresence>

      {/* ── Category Grid ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
        >
          <AnimatePresence mode="popLayout">
            {SKILL_CATEGORIES.map((cat, idx) => {
              const stats = categoryStats[cat.id] ?? { total: 0, completed: 0 };
              const isLocked = stats.total === 0;
              const isComplete = stats.total > 0 && stats.completed === stats.total;

              return (
                <motion.div
                  key={cat.id}
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    duration: 0.4,
                    delay: idx * 0.04,
                    ease: 'easeOut',
                  }}
                >
                  <motion.div
                    whileHover={isLocked ? {} : { y: -6, scale: 1.03 }}
                    whileTap={isLocked ? {} : { scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Card
                      onClick={() =>
                        !isLocked && onSelectCategory(cat.id, activeBand)
                      }
                      className={`
                        relative overflow-hidden cursor-pointer border-0
                        transition-shadow duration-300
                        ${
                          isLocked
                            ? 'opacity-50 cursor-not-allowed grayscale'
                            : `shadow-lg hover:shadow-2xl hover:${cat.glowColor}`
                        }
                        ${isComplete ? 'ring-2 ring-emerald-400 dark:ring-emerald-500' : ''}
                      `}
                    >
                      {/* Gradient header */}
                      <div
                        className={`h-28 sm:h-32 bg-gradient-to-br ${cat.gradient} flex items-center justify-center relative`}
                      >
                        {/* Glow orb */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2),transparent_70%)]" />
                        <span className="text-5xl sm:text-6xl drop-shadow-lg relative z-10">
                          {cat.emoji}
                        </span>

                        {isLocked && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Lock className="w-8 h-8 text-white/70" />
                          </div>
                        )}

                        {isComplete && (
                          <motion.div
                            className="absolute top-2 right-2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.3 }}
                          >
                            <Badge className="bg-emerald-500 text-white shadow-lg text-xs">
                              {isTamil ? "✅ முடிந்தது" : "✅ Complete"}
                            </Badge>
                          </motion.div>
                        )}
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-bold text-base text-slate-800 dark:text-gray-100 truncate">
                          {getCategoryTranslation(cat.id, cat.name, cat.description, isTamil).name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {getCategoryTranslation(cat.id, cat.name, cat.description, isTamil).description}
                        </p>

                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-slate-400 dark:text-gray-500 mb-1">
                            <span>
                              {isLocked
                                ? (isTamil ? 'பாடங்கள் இல்லை' : 'No lessons')
                                : (isTamil ? `${stats.completed}/${stats.total} பாடங்கள்` : `${stats.completed}/${stats.total} lessons`)}
                            </span>
                            {!isLocked && (
                              <span>
                                {Math.round(
                                  (stats.completed / stats.total) * 100,
                                )}
                                %
                              </span>
                            )}
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-gray-700 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full bg-gradient-to-r ${cat.gradient}`}
                              initial={{ width: 0 }}
                              animate={{
                                width:
                                  stats.total > 0
                                    ? `${(stats.completed / stats.total) * 100}%`
                                    : '0%',
                              }}
                              transition={{ duration: 0.8, delay: idx * 0.05 }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium shadow-lg">
      {icon}
      <span className="opacity-70">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function GradeBandTab({
  band,
  isActive,
  onClick,
  isTamil,
}: {
  band: GradeBandInfo;
  isActive: boolean;
  onClick: () => void;
  isTamil: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300
        ${
          isActive
            ? `bg-gradient-to-r ${band.color} text-white shadow-lg shadow-black/20`
            : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 shadow-md hover:shadow-lg border border-slate-200 dark:border-gray-700'
        }
      `}
    >
      {isActive && (
        <motion.div
          layoutId="activeBandGlow"
          className="absolute inset-0 rounded-full bg-white/10"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <span className="relative z-10">
        {band.emoji} {isTamil ? "வகுப்புகள்" : "Grades"} {band.id}
      </span>
    </motion.button>
  );
}

export default SkillWorldHub;

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Gift, Clock, CheckCircle2, Star, Sparkles, Gem, Shield, Flame } from 'lucide-react';
import ConfettiCelebration from './ConfettiCelebration';
import { useLanguageStore } from '@/store/useLanguageStore';

/* ═══════════════════════════════════════════════════
   Daily Quest System — 3 rotating quests + mystery box
   ═══════════════════════════════════════════════════ */

interface DailyQuestSystemProps {
  lessonsToday?: number;
  xpToday?: number;
  perfectQuizToday?: number;
  streakDays?: number;
  wordCompleted?: boolean;
}

type QuestType = 'complete_lessons' | 'earn_xp' | 'perfect_quiz' | 'streak_maintain' | 'word_of_day';

interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  emoji: string;
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
}

interface MysteryPrize {
  type: 'xp' | 'gems' | 'streak_freeze';
  amount: number;
  label: string;
  emoji: string;
}

interface DailyQuestState {
  date: string;
  questsCompleted: boolean[];
  mysteryOpened: boolean;
  prize: MysteryPrize | null;
}

// ── Quest Templates ─────────────────────────────────
const QUEST_POOL: Omit<Quest, 'id' | 'current' | 'completed'>[] = [
  { type: 'complete_lessons', title: 'Lesson Learner', description: 'Complete 2 lessons today', emoji: '📚', target: 2, xpReward: 15 },
  { type: 'complete_lessons', title: 'Study Sprint', description: 'Complete 3 lessons today', emoji: '🏃', target: 3, xpReward: 25 },
  { type: 'earn_xp', title: 'XP Hunter', description: 'Earn 30 XP today', emoji: '⭐', target: 30, xpReward: 10 },
  { type: 'earn_xp', title: 'XP Surge', description: 'Earn 50 XP today', emoji: '💫', target: 50, xpReward: 20 },
  { type: 'perfect_quiz', title: 'Perfect Score', description: 'Get a perfect quiz score', emoji: '💯', target: 1, xpReward: 20 },
  { type: 'perfect_quiz', title: 'Double Perfect', description: 'Get 2 perfect quiz scores', emoji: '🎯', target: 2, xpReward: 30 },
  { type: 'streak_maintain', title: 'Streak Keeper', description: 'Maintain a 3+ day streak', emoji: '🔥', target: 3, xpReward: 15 },
  { type: 'streak_maintain', title: 'Streak Master', description: 'Maintain a 7+ day streak', emoji: '⚡', target: 7, xpReward: 25 },
  { type: 'word_of_day', title: 'Word Wizard', description: 'Complete the Word of the Day', emoji: '📖', target: 1, xpReward: 10 },
  { type: 'word_of_day', title: 'Vocabulary Hero', description: 'Learn today\'s new word', emoji: '🧠', target: 1, xpReward: 10 },
];

// ── Helpers ─────────────────────────────────────────
function getTodayIST(): string {
  const now = new Date();
  const istMs = now.getTime() + 330 * 60 * 1000;
  return new Date(istMs).toISOString().slice(0, 10);
}

function dateSeedHash(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const shuffled = [...arr];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getDailyQuests(dateStr: string): Omit<Quest, 'current' | 'completed'>[] {
  const seed = dateSeedHash(dateStr);
  const shuffled = seededShuffle(QUEST_POOL, seed);

  // Pick 3 quests ensuring different types
  const selected: Omit<Quest, 'id' | 'current' | 'completed'>[] = [];
  const usedTypes = new Set<QuestType>();

  for (const quest of shuffled) {
    if (selected.length >= 3) break;
    if (!usedTypes.has(quest.type)) {
      selected.push(quest);
      usedTypes.add(quest.type);
    }
  }

  // Fallback: fill remaining slots
  for (const quest of shuffled) {
    if (selected.length >= 3) break;
    if (!selected.includes(quest)) {
      selected.push(quest);
    }
  }

  return selected.map((q, i) => ({ ...q, id: `${dateStr}_q${i}` }));
}

function generatePrize(seed: number): MysteryPrize {
  const roll = seed % 100;
  if (roll < 50) {
    const xpAmount = 10 + (seed % 5) * 10; // 10-50
    return { type: 'xp', amount: xpAmount, label: `+${xpAmount} Bonus XP`, emoji: '⭐' };
  } else if (roll < 85) {
    const gemAmount = 1 + (seed % 5); // 1-5
    return { type: 'gems', amount: gemAmount, label: `+${gemAmount} Gem${gemAmount > 1 ? 's' : ''}`, emoji: '💎' };
  } else {
    return { type: 'streak_freeze', amount: 1, label: 'Streak Freeze Token!', emoji: '🛡️' };
  }
}

function getStorageKey(dateStr: string): string {
  return `eq_daily_quests_${dateStr}`;
}

function loadState(dateStr: string): DailyQuestState {
  try {
    const raw = localStorage.getItem(getStorageKey(dateStr));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { date: dateStr, questsCompleted: [false, false, false], mysteryOpened: false, prize: null };
}

function saveState(state: DailyQuestState): void {
  localStorage.setItem(getStorageKey(state.date), JSON.stringify(state));
}

function getMidnightIST(): Date {
  const now = new Date();
  const istOffset = 330 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const tomorrow = new Date(istNow);
  tomorrow.setUTCHours(0, 0, 0, 0);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return new Date(tomorrow.getTime() - istOffset);
}

// ── Gradient configs per quest type ────────────────
const QUEST_GRADIENTS: Record<QuestType, string> = {
  complete_lessons: 'from-blue-500/15 via-cyan-500/10 to-blue-600/5',
  earn_xp: 'from-amber-500/15 via-yellow-500/10 to-orange-500/5',
  perfect_quiz: 'from-purple-500/15 via-pink-500/10 to-fuchsia-500/5',
  streak_maintain: 'from-orange-500/15 via-red-500/10 to-rose-500/5',
  word_of_day: 'from-emerald-500/15 via-green-500/10 to-teal-500/5',
};

const QUEST_BORDER_COLORS: Record<QuestType, string> = {
  complete_lessons: 'border-blue-400/30',
  earn_xp: 'border-amber-400/30',
  perfect_quiz: 'border-purple-400/30',
  streak_maintain: 'border-orange-400/30',
  word_of_day: 'border-emerald-400/30',
};

const QUEST_BAR_COLORS: Record<QuestType, string> = {
  complete_lessons: 'from-blue-400 to-cyan-400',
  earn_xp: 'from-amber-400 to-yellow-400',
  perfect_quiz: 'from-purple-400 to-pink-400',
  streak_maintain: 'from-orange-400 to-red-400',
  word_of_day: 'from-emerald-400 to-green-400',
};

// ── Component ───────────────────────────────────────
const DailyQuestSystem = ({
  lessonsToday = 0,
  xpToday = 0,
  perfectQuizToday = 0,
  streakDays = 0,
  wordCompleted = false,
}: DailyQuestSystemProps) => {
  const today = getTodayIST();
  const { language } = useLanguageStore();
  const isTamil = language === 'ta';

  const getQuestText = (type: QuestType, title: string, target: number, isTamil: boolean) => {
    if (!isTamil) {
      return { title, description: 
        type === 'complete_lessons' ? `Complete ${target} lessons today` :
        type === 'earn_xp' ? `Earn ${target} XP today` :
        type === 'perfect_quiz' ? (target === 1 ? 'Get a perfect quiz score' : `Get ${target} perfect quiz scores`) :
        type === 'streak_maintain' ? `Maintain a ${target}+ day streak` :
        type === 'word_of_day' ? (title === 'Word Wizard' ? 'Complete the Word of the Day' : "Learn today's new word") :
        ""
      };
    }
    
    // Tamil translations
    const titleMap: Record<string, string> = {
      'Lesson Learner': 'பாடம் கற்பவர்',
      'Study Sprint': 'படிப்பு ஓட்டம்',
      'XP Hunter': 'XP வேட்டைக்காரர்',
      'XP Surge': 'XP எழுச்சி',
      'Perfect Score': 'சரியான மதிப்பெண்',
      'Double Perfect': 'இரட்டை சரியான மதிப்பெண்',
      'Streak Keeper': 'தொடர் காப்பாளர்',
      'Streak Master': 'தொடர் மாஸ்டர்',
      'Word Wizard': 'வார்த்தை வழிகாட்டி',
      'Vocabulary Hero': 'சொல்லகராதி நாயகன்',
    };
    
    const description = 
      type === 'complete_lessons' ? `இன்று ${target} பாடங்களை முடிக்கவும்` :
      type === 'earn_xp' ? `இன்று ${target} XP பெறவும்` :
      type === 'perfect_quiz' ? (target === 1 ? 'ஒரு குவிஸில் சரியான மதிப்பெண் பெறவும்' : `குவிஸ்களில் ${target} முறை சரியான மதிப்பெண் பெறவும்`) :
      type === 'streak_maintain' ? `${target}+ நாட்கள் தொடரை பராமரிக்கவும்` :
      type === 'word_of_day' ? (title === 'Word Wizard' ? 'இன்றைய வார்த்தையை முடிக்கவும்' : 'இன்றைய புதிய வார்த்தையை கற்கவும்') :
      "";
      
    return {
      title: titleMap[title] || title,
      description
    };
  };

  const getPrizeLabel = (prize: MysteryPrize, isTamil: boolean) => {
    if (!isTamil) return prize.label;
    if (prize.type === 'xp') {
      return `+${prize.amount} போனஸ் XP`;
    } else if (prize.type === 'gems') {
      return `+${prize.amount} ரத்தினங்கள்`;
    } else {
      return 'தொடர் முடக்க டோக்கன்!';
    }
  };
  const [state, setState] = useState<DailyQuestState>(() => loadState(today));
  const [countdown, setCountdown] = useState('');
  const [boxStage, setBoxStage] = useState<'locked' | 'ready' | 'opening' | 'burst' | 'revealed'>('locked');
  const [showConfetti, setShowConfetti] = useState(false);

  // Build quests with live progress
  const questTemplates = getDailyQuests(today);
  const quests: Quest[] = questTemplates.map((q, i) => {
    let current = 0;
    switch (q.type) {
      case 'complete_lessons': current = lessonsToday; break;
      case 'earn_xp': current = xpToday; break;
      case 'perfect_quiz': current = perfectQuizToday; break;
      case 'streak_maintain': current = streakDays; break;
      case 'word_of_day': current = wordCompleted ? 1 : 0; break;
    }
    const completed = current >= q.target || state.questsCompleted[i];
    return { ...q, current: Math.min(current, q.target), completed };
  });

  // Sync completion state to localStorage
  useEffect(() => {
    const newCompleted = quests.map(q => q.completed);
    const changed = newCompleted.some((c, i) => c !== state.questsCompleted[i]);
    if (changed) {
      const newState = { ...state, questsCompleted: newCompleted };
      setState(newState);
      saveState(newState);
    }
  }, [quests.map(q => q.completed).join(',')]);

  const allComplete = quests.every(q => q.completed);

  // Update box stage
  useEffect(() => {
    if (state.mysteryOpened) {
      setBoxStage('revealed');
    } else if (allComplete) {
      setBoxStage('ready');
    } else {
      setBoxStage('locked');
    }
  }, [allComplete, state.mysteryOpened]);

  // Countdown timer
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const midnight = getMidnightIST();
      const diff = midnight.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown('00:00:00');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Open mystery box
  const handleOpenBox = () => {
    if (!allComplete || state.mysteryOpened) return;

    setBoxStage('opening');

    setTimeout(() => {
      setBoxStage('burst');
    }, 1200);

    setTimeout(() => {
      const seed = dateSeedHash(today + '_prize');
      const prize = generatePrize(seed);

      // Apply prize
      if (prize.type === 'gems') {
        const currentGems = parseInt(localStorage.getItem('eq_gems') || '0', 10);
        localStorage.setItem('eq_gems', String(currentGems + prize.amount));
      }
      if (prize.type === 'streak_freeze') {
        const currentFreezes = parseInt(localStorage.getItem('eq_streak_freezes') || '0', 10);
        localStorage.setItem('eq_streak_freezes', String(Math.min(currentFreezes + 1, 3)));
      }

      const newState = { ...state, mysteryOpened: true, prize };
      setState(newState);
      saveState(newState);
      setBoxStage('revealed');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 2000);
  };

  const completedCount = quests.filter(q => q.completed).length;

  return (
    <>
      <ConfettiCelebration show={showConfetti} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl"
      >
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-purple-500/6 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 p-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">{isTamil ? "தினசரி தேடல்கள்" : "Daily Quests"}</h2>
                <p className="text-xs text-muted-foreground font-medium">{isTamil ? `${completedCount}/3 முடிக்கப்பட்டது` : `${completedCount}/3 completed`}</p>
              </div>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-1.5 bg-muted/40 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-border/30">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-bold font-mono text-muted-foreground">{countdown}</span>
            </div>
          </div>
        </div>

        {/* Quest Cards */}
        <div className="relative z-10 px-6 space-y-3">
          {quests.map((quest, i) => {
            const pct = quest.target > 0 ? (quest.current / quest.target) * 100 : 0;

            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.2, type: 'spring', stiffness: 200, damping: 18 }}
                className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
                  quest.completed
                    ? 'bg-gradient-to-br from-green-400/10 to-emerald-500/10 border-green-400/30 shadow-md shadow-green-500/10'
                    : `bg-gradient-to-br ${QUEST_GRADIENTS[quest.type]} ${QUEST_BORDER_COLORS[quest.type]} shadow-sm`
                }`}
              >
                {/* Glassmorphism overlay */}
                <div className="absolute inset-0 bg-white/3 dark:bg-white/[0.02] backdrop-blur-[1px] pointer-events-none" />

                <div className="relative z-10 flex items-center gap-3.5">
                  {/* Emoji icon */}
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                    quest.completed
                      ? 'bg-green-100 dark:bg-green-800/30'
                      : 'bg-white/10 dark:bg-white/5 border border-white/10'
                  }`}>
                    <AnimatePresence mode="wait">
                      {quest.completed ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        >
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        </motion.div>
                      ) : (
                        <motion.span key="emoji" className="text-xl">{quest.emoji}</motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={`text-sm font-bold ${quest.completed ? 'text-green-600 dark:text-green-400 line-through' : 'text-foreground'}`}>
                        {getQuestText(quest.type, quest.title, quest.target, isTamil).title}
                      </h3>
                      <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
                        <Star className="w-3 h-3" />
                        +{quest.xpReward}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{getQuestText(quest.type, quest.title, quest.target, isTamil).description}</p>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 + 0.3 }}
                          className={`h-full rounded-full ${
                            quest.completed
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                              : `bg-gradient-to-r ${QUEST_BAR_COLORS[quest.type]}`
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-black text-muted-foreground shrink-0">
                        {quest.current}/{quest.target}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Completion glow */}
                {quest.completed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-0 right-0 w-20 h-20 bg-green-400/10 rounded-full blur-2xl pointer-events-none"
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Mystery Box Section */}
        <div className="relative z-10 p-6 pt-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`relative overflow-hidden rounded-2xl border-2 p-5 text-center transition-all ${
              boxStage === 'locked'
                ? 'border-border/30 bg-muted/20'
                : boxStage === 'revealed'
                  ? 'border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-orange-500/8 to-yellow-500/5'
                  : 'border-purple-400/50 bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-fuchsia-500/5'
            }`}
          >
            {/* Glow border for ready state */}
            {boxStage === 'ready' && (
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-purple-400/50"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            <AnimatePresence mode="wait">
              {boxStage === 'locked' && (
                <motion.div
                  key="locked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="text-4xl opacity-40 grayscale">🎁</div>
                  <p className="text-sm font-bold text-muted-foreground">{isTamil ? "மர்மப் பெட்டி" : "Mystery Box"}</p>
                  <p className="text-xs text-muted-foreground/60">{isTamil ? "திறக்க 3 தேடல்களையும் முடிக்கவும்!" : "Complete all 3 quests to unlock!"}</p>
                  <div className="flex gap-1.5 mt-1">
                    {quests.map((q, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          q.completed ? 'bg-green-400 shadow-sm shadow-green-400/30' : 'bg-muted/40'
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {boxStage === 'ready' && (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <motion.div
                    className="text-5xl drop-shadow-lg"
                    animate={{ y: [-5, 5, -5], rotate: [-3, 3, -3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    🎁
                  </motion.div>
                  <p className="text-sm font-bold text-foreground">{isTamil ? "மர்மப் பெட்டி தயார்!" : "Mystery Box Ready!"}</p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={handleOpenBox}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 flex items-center gap-2"
                  >
                    <Gift className="w-4 h-4" />
                    {isTamil ? "மர்மப் பெட்டியைத் திறக்கவும்" : "Open Mystery Box"}
                    <Sparkles className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}

              {boxStage === 'opening' && (
                <motion.div
                  key="opening"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 py-2"
                >
                  <motion.div
                    className="text-6xl"
                    animate={{
                      rotate: [-8, 8, -8, 8, -4, 4, -2, 2, 0],
                      scale: [1, 1.1, 1.15, 1.2, 1.15, 1.1, 1.05, 1.1, 1.15],
                      y: [0, -8, 3, -12, 5, -6, 0],
                    }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                  >
                    🎁
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 bg-purple-500/10 rounded-2xl"
                    animate={{ opacity: [0, 0.5, 0, 0.5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                  <p className="text-sm font-bold text-purple-400">{isTamil ? "திறக்கப்படுகிறது..." : "Opening..."}</p>
                </motion.div>
              )}

              {boxStage === 'burst' && (
                <motion.div
                  key="burst"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="flex items-center justify-center py-4"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-yellow-400/60 via-amber-300/40 to-orange-400/60 rounded-2xl"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
                    transition={{ duration: 0.8 }}
                  />
                  <motion.div
                    className="text-7xl"
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 2, 0], rotate: [0, 180, 360], opacity: [1, 1, 0] }}
                    transition={{ duration: 0.8 }}
                  >
                    ✨
                  </motion.div>
                </motion.div>
              )}

              {boxStage === 'revealed' && state.prize && (
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0, scale: 0.3, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="flex flex-col items-center gap-2 py-1"
                >
                  <motion.div
                    className="text-5xl drop-shadow-lg"
                    animate={{ y: [-4, 4, -4], scale: [1, 1.05, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {state.prize.emoji}
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg font-black text-foreground"
                  >
                    {getPrizeLabel(state.prize, isTamil)}
                  </motion.p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {state.prize.type === 'xp' && <Star className="w-4 h-4 text-amber-500" />}
                    {state.prize.type === 'gems' && <Gem className="w-4 h-4 text-cyan-500" />}
                    {state.prize.type === 'streak_freeze' && <Shield className="w-4 h-4 text-blue-500" />}
                    <span className="text-xs font-bold text-muted-foreground">
                      {state.prize.type === 'xp' && (isTamil ? 'போனஸ் XP சேர்க்கப்பட்டது!' : 'Bonus XP added!')}
                      {state.prize.type === 'gems' && (isTamil ? 'உங்கள் ரத்தினப் பையில் சேர்க்கப்பட்டது!' : 'Added to your gem pouch!')}
                      {state.prize.type === 'streak_freeze' && (isTamil ? 'தொடர் பாதுகாப்பு செயல்படுத்தப்பட்டது!' : 'Streak protection activated!')}
                    </span>
                  </div>
                </motion.div>
              )}

              {boxStage === 'revealed' && !state.prize && (
                <motion.div
                  key="revealed-done"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2 py-1"
                >
                  <div className="text-4xl">🎁</div>
                  <p className="text-sm font-bold text-green-500">{isTamil ? "மர்மப் பெட்டி திறக்கப்பட்டது!" : "Mystery Box Opened!"}</p>
                  <p className="text-xs text-muted-foreground">{isTamil ? "புதிய பெட்டிக்கு நாளை மீண்டும் வரவும் ✨" : "Come back tomorrow for a new box ✨"}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Total XP reward footer */}
        <div className="relative z-10 px-6 pb-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {isTamil ? `மொத்த வெகுமதிகள்: +${quests.reduce((s, q) => s + q.xpReward, 0)} XP` : `Total quest rewards: +${quests.reduce((s, q) => s + q.xpReward, 0)} XP`}
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {isTamil ? "+ மர்ம வெகுமதி" : "+ Mystery Prize"}
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default DailyQuestSystem;

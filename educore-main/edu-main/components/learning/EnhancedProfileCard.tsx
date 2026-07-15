import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Flame, Target, Trophy, Eye, ChevronRight, Sparkles, Crown, Award, Medal } from 'lucide-react';
import { getRank, getNextRank } from '@/lib/retentionEngine';
import { useLanguageStore } from '@/store/useLanguageStore';
import { CharacterSVG, type CharacterConfig } from '@/components/learning/CharacterCreator';

/* ═══════════════════════════════════════════════════
   Enhanced Profile Card — holographic animated card
   ═══════════════════════════════════════════════════ */

interface EnhancedProfileCardProps {
  name: string;
  classLevel: number;
  totalXP: number;
  streakDays: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  perfectQuizzes: number;
  avgScore: number;
  compact?: boolean;
  onViewProfile?: () => void;
  avatarConfig?: CharacterConfig;
  academicRating?: number;
  characterLevel?: number;
}

// ── Title Definitions ───────────────────────────────
interface TitleDef {
  id: string;
  label: string;
  emoji: string;
  requirement: string;
  check: (props: EnhancedProfileCardProps) => boolean;
}

const TITLES: TitleDef[] = [
  { id: 'newcomer', label: 'Newcomer', emoji: '🌱', requirement: 'Start your journey', check: () => true },
  { id: 'quiz_master', label: 'Quiz Master', emoji: '🎯', requirement: '5 perfect quizzes', check: (p) => p.perfectQuizzes >= 5 },
  { id: 'streak_champion', label: 'Streak Champion', emoji: '🔥', requirement: '14-day streak', check: (p) => p.streakDays >= 14 },
  { id: 'bookworm', label: 'Bookworm', emoji: '📚', requirement: '10 lessons completed', check: (p) => p.lessonsCompleted >= 10 },
  { id: 'scholar', label: 'Scholar', emoji: '🎓', requirement: '20 lessons completed', check: (p) => p.lessonsCompleted >= 20 },
  { id: 'sharpshooter', label: 'Sharpshooter', emoji: '🎯', requirement: '90%+ average score', check: (p) => p.avgScore >= 90 },
  { id: 'xp_legend', label: 'XP Legend', emoji: '👑', requirement: '1000+ total XP', check: (p) => p.totalXP >= 1000 },
  { id: 'perfectionist', label: 'Perfectionist', emoji: '💯', requirement: '10 perfect quizzes', check: (p) => p.perfectQuizzes >= 10 },
  { id: 'unstoppable', label: 'Unstoppable', emoji: '⚡', requirement: '30-day streak', check: (p) => p.streakDays >= 30 },
  { id: 'champion', label: 'Champion', emoji: '🏆', requirement: '500+ XP & 10+ quizzes', check: (p) => p.totalXP >= 500 && p.quizzesCompleted >= 10 },
];

interface AnimeQuote {
  quote: string;
  quote_ta: string;
  author: string;
  author_ta: string;
  anime: string;
  anime_ta: string;
}

const ANIME_QUOTES: Record<string, Record<string, AnimeQuote>> = {
  '1-2': {
    bronze: {
      quote: "Believe in yourself! If you don't, who will?",
      quote_ta: "உன்னை நீயே நம்பு! நீ நம்பாவிட்டால், வேறு யார் உன்னை நம்புவார்கள்?",
      author: "Naruto Uzumaki",
      author_ta: "நருடோ உசுமகி",
      anime: "Naruto",
      anime_ta: "நருடோ"
    },
    silver: {
      quote: "If you don't take risks, you can't create a future!",
      quote_ta: "நீ ஆபத்துக்களை எதிர்கொள்ளவில்லை என்றால், ஒரு பிரகாசமான எதிர்காலத்தை உருவாக்க முடியாது!",
      author: "Monkey D. Luffy",
      author_ta: "மங்கி டி. லூஃபி",
      anime: "One Piece",
      anime_ta: "ஒன் பீஸ்"
    },
    gold: {
      quote: "Power comes in response to a need, not a desire.",
      quote_ta: "ஆற்றல் என்பது ஆசையினால் வருவதில்லை, தேவையினால் வருகிறது.",
      author: "Goku",
      author_ta: "கோகு",
      anime: "Dragon Ball Z",
      anime_ta: "டிராகன் பால் Z"
    },
    platinum: {
      quote: "Even if you feel like a failure, you must keep going!",
      quote_ta: "நீ தோல்வியடைந்ததாக உணர்ந்தாலும், தொடர்ந்து முன்னேறிச் செல்ல வேண்டும்!",
      author: "Izuku Midoriya",
      author_ta: "இசுகு மிடோரியா",
      anime: "My Hero Academia",
      anime_ta: "மை ஹீரோ அகாடமியா"
    }
  },
  '3-4': {
    bronze: {
      quote: "No matter how hard or impossible it is, never lose sight of your goal.",
      quote_ta: "அது எவ்வளவு கடினமானதாக அல்லது சாத்தியமற்றதாக இருந்தாலும், உங்கள் இலக்கை ஒருபோதும் கைவிடாதீர்கள்.",
      author: "Monkey D. Luffy",
      author_ta: "மங்கி டி. லூஃபி",
      anime: "One Piece",
      anime_ta: "ஒன் பீஸ்"
    },
    silver: {
      quote: "My magic is never giving up!",
      quote_ta: "என் மந்திரம் என்னவென்றால் ஒருபோதும் கைவிடாமல் இருப்பதுதான்!",
      author: "Asta",
      author_ta: "அஸ்டா",
      anime: "Black Clover",
      anime_ta: "பிளாக் குளோவர்"
    },
    gold: {
      quote: "It's not about whether you can do it or not, it's about whether you want to do it.",
      quote_ta: "உன்னால் செய்ய முடியுமா இல்லையா என்பது முக்கியமல்ல, நீ அதைச் செய்ய விரும்புகிறாயா என்பதுதான் முக்கியம்.",
      author: "Naruto Uzumaki",
      author_ta: "நருடோ உசுமகி",
      anime: "Naruto",
      anime_ta: "நருடோ"
    },
    platinum: {
      quote: "To know sorrow is not terrifying. What is terrifying is to know you cannot go back.",
      quote_ta: "துயரத்தை அறிவது பயங்கரமானது அல்ல. கடந்த காலத்திற்குத் திரும்ப முடியாது என்பதை அறிவதே பயங்கரமானது.",
      author: "Gon Freecss",
      author_ta: "கோன் ஃப்ரீக்ஸ்",
      anime: "Hunter x Hunter",
      anime_ta: "ஹண்டர் x ஹண்டர்"
    }
  },
  '5-6': {
    bronze: {
      quote: "The difference between the novice and the master is that the master has failed more times than the novice has tried.",
      quote_ta: "தொடக்கக்காரருக்கும் மாஸ்டருக்கும் உள்ள வித்தியாசம் என்னவென்றால், தொடக்கக்காரர் முயற்சித்ததை விட மாஸ்டர் பலமுறை தோல்வியடைந்துள்ளார்.",
      author: "Koro-sensei",
      author_ta: "கோரோ-சென்செய்",
      anime: "Assassination Classroom",
      anime_ta: "அசாசினேஷன் கிளாஸ்ரூம்"
    },
    silver: {
      quote: "If you don't like your destiny, don't accept it. Instead, have the courage to change it.",
      quote_ta: "உன் விதியை உனக்கு பிடிக்கவில்லை என்றால், அதை ஏற்காதே. அதை மாற்றுவதற்கான தைரியத்தை வளர்த்துக்கொள்.",
      author: "Naruto Uzumaki",
      author_ta: "நருடோ உசுமகி",
      anime: "Naruto Shippuden",
      anime_ta: "நருடோ ஷிப்புடன்"
    },
    gold: {
      quote: "If you clench your fists against your limit, remember for what cause you started!",
      quote_ta: "உங்கள் எல்லையைத் தாண்டி போராடும் போது, நீங்கள் எதற்காகத் தொடங்கினீர்கள் என்பதை நினைவில் கொள்ளுங்கள்!",
      author: "All Might",
      author_ta: "ஆல் மைட்",
      anime: "My Hero Academia",
      anime_ta: "மை ஹீரோ அகாடமியா"
    },
    platinum: {
      quote: "Do not look at what you have lost, look at what you still have left!",
      quote_ta: "நீ எதை இழந்தாய் என்று பார்க்காதே, உன்னிடம் இன்னும் என்ன மிச்சமிருக்கிறது என்று பார்!",
      author: "Jinbe",
      author_ta: "ஜின்பே",
      anime: "One Piece",
      anime_ta: "ஒன் பீஸ்"
    }
  },
  '7-8': {
    bronze: {
      quote: "Human strength lies in the ability to change yourself.",
      quote_ta: "உன்னை நீயே மாற்றிக்கொள்ளும் திறனில்தான் மனிதனின் உண்மையான வலிமை அடங்கியுள்ளது.",
      author: "Saitama",
      author_ta: "சைதாமா",
      anime: "One Punch Man",
      anime_ta: "ஒன் பஞ்ச் மேன்"
    },
    silver: {
      quote: "Moving on accepts what's happened and continues to grow.",
      quote_ta: "முன்னேறிச் செல்வது என்பது கடந்த காலத்தை ஏற்றுக்கொண்டு தொடர்ந்து வளர்வது மட்டுமே.",
      author: "Erza Scarlet",
      author_ta: "எர்சா ஸ்கார்லெட்",
      anime: "Fairy Tail",
      anime_ta: "ஃபேரி டெயில்"
    },
    gold: {
      quote: "Hard work is worthless for those who don't believe in themselves.",
      quote_ta: "தங்களை நம்பாதவர்களுக்கு கடின உழைப்பு என்பது பயனற்ற ஒன்றாகும்.",
      author: "Naruto Uzumaki",
      author_ta: "நருடோ உசுமகி",
      anime: "Naruto",
      anime_ta: "நருடோ"
    },
    platinum: {
      quote: "The future belongs to those who believe in the beauty of their dreams and work hard every day!",
      quote_ta: "தங்கள் கனவுகளின் அழகை நம்பி தினமும் கடுமையாக உழைப்பவர்களுக்கே எதிர்காலம் சொந்தம்!",
      author: "Shoyo Hinata",
      author_ta: "ஷோயோ ஹினாட்டா",
      anime: "Haikyu!!",
      anime_ta: "ஹைக்யூ!!"
    }
  }
};

// ── Rank glow colors ────────────────────────────────
const RANK_GLOW: Record<string, string> = {
  bronze: 'shadow-orange-400/30',
  silver: 'shadow-gray-300/30',
  gold: 'shadow-amber-400/40',
  platinum: 'shadow-slate-300/40',
};

const RANK_BORDER_ANIM: Record<string, string> = {
  bronze: 'from-orange-400/40 via-orange-200/20 to-orange-500/40',
  silver: 'from-gray-300/40 via-white/20 to-gray-400/40',
  gold: 'from-amber-300/50 via-yellow-200/30 to-amber-400/50',
  platinum: 'from-slate-300/50 via-white/30 to-slate-400/50',
};

const RANK_BADGE_ICON: Record<string, typeof Medal> = {
  bronze: Medal,
  silver: Award,
  gold: Trophy,
  platinum: Crown,
};

function getActiveTitle(): string {
  return localStorage.getItem('eq_active_title') || 'newcomer';
}

function setActiveTitle(titleId: string): void {
  localStorage.setItem('eq_active_title', titleId);
}

function getProfileViews(): number {
  const views = parseInt(localStorage.getItem('eq_profile_views') || '0', 10);
  return views;
}

function incrementProfileViews(): void {
  const current = getProfileViews();
  localStorage.setItem('eq_profile_views', String(current + 1));
}

function getLikes(): number {
  return parseInt(localStorage.getItem('eq_profile_likes') || '0', 10);
}

const EnhancedProfileCard = (props: EnhancedProfileCardProps) => {
  const {
    name,
    classLevel,
    totalXP,
    streakDays,
    lessonsCompleted,
    quizzesCompleted,
    perfectQuizzes,
    avgScore,
    compact = false,
    onViewProfile,
    avatarConfig,
    academicRating,
    characterLevel,
  } = props;

  const { language } = useLanguageStore();
  const isTamil = language === 'ta';

  const getRankName = (rankId: string, isTamil: boolean) => {
    const names: Record<string, string> = {
      bronze: isTamil ? "வெண்கலம்" : "Bronze",
      silver: isTamil ? "வெள்ளி" : "Silver",
      gold: isTamil ? "தங்கம்" : "Gold",
      platinum: isTamil ? "பிளாட்டினம்" : "Platinum",
    };
    return names[rankId] || rankId;
  };

  const getTitleText = (id: string, isTamil: boolean) => {
    const titles: Record<string, { label: string; requirement: string }> = {
      newcomer: { label: isTamil ? 'புதியவர்' : 'Newcomer', requirement: isTamil ? 'உங்கள் பயணத்தைத் தொடங்குங்கள்' : 'Start your journey' },
      quiz_master: { label: isTamil ? 'குவிஸ் மாஸ்டர்' : 'Quiz Master', requirement: isTamil ? '5 சரியான குவிஸ்கள்' : '5 perfect quizzes' },
      streak_champion: { label: isTamil ? 'தொடர் சாம்பியன்' : 'Streak Champion', requirement: isTamil ? '14-நாள் தொடர்' : '14-day streak' },
      bookworm: { label: isTamil ? 'புத்தகப் புழு' : 'Bookworm', requirement: isTamil ? '10 பாடங்கள் முடிக்கப்பட்டன' : '10 lessons completed' },
      scholar: { label: isTamil ? 'அறிஞர்' : 'Scholar', requirement: isTamil ? '20 பாடங்கள் முடிக்கப்பட்டன' : '20 lessons completed' },
      sharpshooter: { label: isTamil ? 'துல்லியவாதி' : 'Sharpshooter', requirement: isTamil ? '90%+ சராசரி மதிப்பெண்' : '90%+ average score' },
      xp_legend: { label: isTamil ? 'XP லெஜண்ட்' : 'XP Legend', requirement: isTamil ? '1000+ மொத்த XP' : '1000+ total XP' },
      perfectionist: { label: isTamil ? 'துல்லியமானவர்' : 'Perfectionist', requirement: isTamil ? '10 சரியான குவிஸ்கள்' : '10 perfect quizzes' },
      unstoppable: { label: isTamil ? 'தடுக்க முடியாதவர்' : 'Unstoppable', requirement: isTamil ? '30-நாள் தொடர்' : '30-day streak' },
      champion: { label: isTamil ? 'சாம்பியன்' : 'Champion', requirement: isTamil ? '500+ XP & 10+ குவிஸ்கள்' : '500+ XP & 10+ quizzes' },
    };
    return titles[id] || { label: id, requirement: '' };
  };

  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [activeTitleId, setActiveTitleId] = useState(getActiveTitle);
  const [showTitlePicker, setShowTitlePicker] = useState(false);
  const [profileViews] = useState(getProfileViews);
  const [likes] = useState(getLikes);

  const rank = getRank(totalXP);
  const nextRank = getNextRank(totalXP);
  
  const getGradeBand = (grade: number): string => {
    if (grade <= 2) return '1-2';
    if (grade <= 4) return '3-4';
    if (grade <= 6) return '5-6';
    return '7-8';
  };

  const gradeBand = getGradeBand(classLevel);
  const quoteObj = ANIME_QUOTES[gradeBand]?.[rank.id] || ANIME_QUOTES['1-2']['bronze'];

  const RankIcon = RANK_BADGE_ICON[rank.id] || Medal;

  // Unlocked titles
  const unlockedTitles = TITLES.filter(t => t.check(props));
  const activeTitle = TITLES.find(t => t.id === activeTitleId) || TITLES[0];

  // Increment profile views on mount
  useEffect(() => {
    incrementProfileViews();
  }, []);

  // Holographic mouse tracking
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0.5, y: 0.5 });
  };

  const handleTitleChange = (titleId: string) => {
    setActiveTitleId(titleId);
    setActiveTitle(titleId);
    setShowTitlePicker(false);
  };

  // Holographic gradient angle based on mouse position
  const holoAngle = Math.atan2(mousePos.y - 0.5, mousePos.x - 0.5) * (180 / Math.PI) + 180;
  const holoIntensity = Math.sqrt(Math.pow(mousePos.x - 0.5, 2) + Math.pow(mousePos.y - 0.5, 2)) * 2;

  // XP progress to next rank
  const rankProgress = nextRank
    ? ((totalXP - rank.minXP) / (nextRank.rank.minXP - rank.minXP)) * 100
    : 100;

  // ── Compact mode ────────────────────────────────
  if (compact) {
    return (
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 p-4 shadow-lg ${RANK_GLOW[rank.id] || ''} cursor-pointer flex flex-col h-full`}
        onClick={onViewProfile}
        style={{
          background: `linear-gradient(${holoAngle}deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,${0.06 * holoIntensity}) 50%, rgba(255,255,255,0.02) 100%)`,
        }}
      >
        {/* Rank glow border */}
        <motion.div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${RANK_BORDER_ANIM[rank.id]} opacity-40 pointer-events-none`}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ padding: '1px' }}
        />

        <div className="relative z-10 flex flex-col flex-1">
          {/* Top row: Avatar + Name + XP */}
          <div className="flex items-center gap-3 mb-3">
            {/* Rank badge */}
            <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${rank.gradient} flex items-center justify-center shadow-lg shrink-0`}>
              <span className="text-xl">{rank.emoji}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-black text-foreground truncate">{name}</p>
                {streakDays > 0 && (
                  <span className="text-xs">🔥</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold text-muted-foreground">
                  {activeTitle.emoji} {getTitleText(activeTitle.id, isTamil).label}
                </span>
                <span className="text-[10px] font-bold text-amber-500">{totalXP} XP</span>
                {characterLevel !== undefined && (
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-1 py-0.2 rounded">L{characterLevel}</span>
                )}
                {academicRating !== undefined && (
                  <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-1 py-0.2 rounded">⚡{academicRating}</span>
                )}
              </div>
            </div>

            {onViewProfile && (
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
          </div>

          {/* Rank progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">{isTamil ? `${getRankName(rank.id, true)} தரம்` : `${rank.name} Rank`}</span>
              {nextRank ? (
                <span className="text-[9px] font-semibold text-muted-foreground">
                  {isTamil ? `தரம் உயர ${nextRank.xpNeeded} XP தேவை (${nextRank.rank.emoji} ${getRankName(nextRank.rank.id, true)})` : `${nextRank.xpNeeded} XP to ${nextRank.rank.emoji} ${nextRank.rank.name}`}
                </span>
              ) : (
                <span className="text-[9px] font-bold text-amber-500">{isTamil ? "அதிகபட்ச தரம்! 💎" : "Max Rank! 💎"}</span>
              )}
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rankProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className={`h-full rounded-full bg-gradient-to-r ${rank.gradient}`}
              />
            </div>
          </div>

          {/* Mini stats grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: '🔥', label: isTamil ? 'தொடர்' : 'Streak', value: `${streakDays}d` },
              { icon: '📚', label: isTamil ? 'பாடங்கள்' : 'Lessons', value: lessonsCompleted },
              { icon: '🎯', label: isTamil ? 'குவிஸ்கள்' : 'Quizzes', value: quizzesCompleted },
              { icon: '💯', label: isTamil ? 'சராசரி' : 'Avg', value: `${avgScore}%` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg bg-muted/15 border border-border/20 p-2 text-center"
              >
                <span className="text-sm block">{stat.icon}</span>
                <p className="text-xs font-black text-foreground mt-0.5">{stat.value}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Anime Quote & Character avatar showcase to fill space */}
          <div className="mt-4 pt-4 border-t border-border/20 flex flex-col items-center justify-between flex-grow">
            {/* Speech bubble */}
            <div className="relative w-full bg-slate-900/40 dark:bg-slate-950/40 backdrop-blur-md border border-border/30 rounded-2xl p-4 shadow-md text-center">
              {/* Triangle pointer */}
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 dark:bg-slate-950 border-r border-b border-border/30 rotate-45" />
              
              <p className="text-xs font-bold text-foreground italic leading-relaxed">
                "{isTamil ? quoteObj.quote_ta : quoteObj.quote}"
              </p>
              
              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                <span className="text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase">
                  - {isTamil ? quoteObj.author_ta : quoteObj.author}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground">
                  ({isTamil ? quoteObj.anime_ta : quoteObj.anime})
                </span>
              </div>
            </div>

            {/* Character Avatar Preview */}
            <div className="relative h-44 flex items-center justify-center select-none origin-bottom mb-2 mt-4">
              <div className="absolute bottom-2 w-32 h-6 bg-cyan-500/10 border border-cyan-500/20 rounded-full scale-y-50 blur-[1px] shadow-[0_0_15px_rgba(6,182,212,0.3)]" />
              {avatarConfig ? (
                <div className="scale-75 origin-center">
                  <CharacterSVG config={avatarConfig} />
                </div>
              ) : (
                <div className={`h-24 w-24 rounded-2xl bg-gradient-to-br ${rank.gradient} flex items-center justify-center shadow-lg`}>
                  <span className="text-5xl">{rank.emoji}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Full mode ───────────────────────────────────
  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      className={`relative overflow-hidden rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl ${RANK_GLOW[rank.id] || ''}`}
    >
      {/* Holographic overlay — shifts with mouse */}
      <div
        className="absolute inset-0 pointer-events-none z-[1] rounded-3xl transition-all duration-300"
        style={{
          background: `linear-gradient(${holoAngle}deg, 
            transparent 0%, 
            rgba(168,85,247,${0.05 * holoIntensity}) 25%, 
            rgba(56,189,248,${0.06 * holoIntensity}) 50%, 
            rgba(251,191,36,${0.04 * holoIntensity}) 75%, 
            transparent 100%)`,
        }}
      />

      {/* Animated rank frame border */}
      <motion.div
        className={`absolute inset-0 rounded-3xl pointer-events-none z-[2]`}
        style={{
          background: `linear-gradient(${holoAngle}deg, ${rank.color}33 0%, transparent 40%, transparent 60%, ${rank.color}33 100%)`,
          padding: '2px',
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Ambient particles */}
      <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-primary/6 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

      {/* Top decorative stripe */}
      <div className={`h-1.5 bg-gradient-to-r ${rank.gradient}`} />

      <div className="relative z-10 p-6">
        {/* ── Profile Header ── */}
        <div className="flex items-start gap-4 mb-5">
          {/* Rank badge — large */}
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="relative"
          >
            <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${rank.gradient} flex items-center justify-center shadow-xl ${RANK_GLOW[rank.id]}`}>
              <span className="text-3xl drop-shadow-md">{rank.emoji}</span>
            </div>
            {/* Rank icon overlay */}
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card border-2 border-border/50 flex items-center justify-center">
              <RankIcon className="w-3 h-3 text-foreground" />
            </div>
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-black text-foreground truncate">{name}</h2>
              {streakDays >= 7 && <span className="text-sm">🔥</span>}
            </div>
            <p className="text-xs font-bold text-muted-foreground mb-1.5">
              {isTamil ? `வகுப்பு ${classLevel} • ${getRankName(rank.id, true)} தரம்` : `Class ${classLevel} • ${rank.name} Rank`}
            </p>
            {(characterLevel !== undefined || academicRating !== undefined) && (
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {characterLevel !== undefined && (
                  <span className="text-[10px] font-extrabold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                    {isTamil ? `நிலை ${characterLevel}` : `Level ${characterLevel}`}
                  </span>
                )}
                {academicRating !== undefined && (
                  <span className="text-[10px] font-extrabold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    ⚡ {academicRating} {isTamil ? "மதிப்பீடு" : "Elo"}
                  </span>
                )}
              </div>
            )}

            {/* Active Title — clickable */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTitlePicker(!showTitlePicker)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 text-xs font-bold text-foreground hover:border-primary/40 transition-all"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              {activeTitle.emoji} {getTitleText(activeTitle.id, isTamil).label}
            </motion.button>
          </div>

          {/* View/Like counters */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              <span className="font-bold">{profileViews}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-red-400">
              <span>🔥</span>
              <span className="font-bold">{likes}</span>
            </div>
          </div>
        </div>

        {/* ── Title Picker ── */}
        {showTitlePicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 rounded-2xl bg-muted/20 border border-border/30 p-3 overflow-hidden"
          >
            <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">{isTamil ? "உங்கள் தலைப்பைத் தேர்ந்தெடுக்கவும்" : "Choose Your Title"}</p>
            <div className="flex flex-wrap gap-1.5">
              {TITLES.map(title => {
                const unlocked = unlockedTitles.includes(title);
                const isActive = title.id === activeTitleId;
                return (
                  <motion.button
                    key={title.id}
                    whileTap={unlocked ? { scale: 0.95 } : {}}
                    onClick={() => unlocked && handleTitleChange(title.id)}
                    disabled={!unlocked}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      isActive
                        ? 'bg-primary/20 border border-primary/40 text-primary'
                        : unlocked
                          ? 'bg-muted/30 border border-border/30 text-foreground hover:bg-muted/50'
                          : 'bg-muted/10 border border-border/10 text-muted-foreground/30 cursor-not-allowed'
                    }`}
                    title={unlocked ? getTitleText(title.id, isTamil).label : `Locked: ${getTitleText(title.id, isTamil).requirement}`}
                  >
                    {unlocked ? title.emoji : '🔒'} {getTitleText(title.id, isTamil).label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── XP & Rank Progress ── */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-base font-black text-foreground">{totalXP} XP</span>
            </div>
            {nextRank ? (
              <span className="text-xs font-semibold text-muted-foreground">
                {isTamil ? `தரம் உயர ${nextRank.xpNeeded} XP தேவை (${nextRank.rank.emoji} ${getRankName(nextRank.rank.id, true)})` : `${nextRank.xpNeeded} to ${nextRank.rank.emoji} ${nextRank.rank.name}`}
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-500">{isTamil ? "அதிகபட்ச தரம்! 💎" : "Max Rank! 💎"}</span>
            )}
          </div>
          <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${rankProgress}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              className={`h-full rounded-full bg-gradient-to-r ${rank.gradient} shadow-md relative`}
            >
              <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/60 anim-pulse-scale" />
            </motion.div>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { icon: Target, label: isTamil ? 'பாடங்கள்' : 'Lessons', value: lessonsCompleted, color: 'text-blue-500', bg: 'from-blue-500/10 to-cyan-500/5' },
            { icon: Trophy, label: isTamil ? 'வென்ற குவிஸ்கள்' : 'Quizzes Aced', value: perfectQuizzes, color: 'text-purple-500', bg: 'from-purple-500/10 to-pink-500/5' },
            { icon: Flame, label: isTamil ? 'தொடர்' : 'Streak', value: `${streakDays}d`, color: 'text-orange-500', bg: 'from-orange-500/10 to-red-500/5' },
            { icon: Star, label: isTamil ? 'சராசரி மதிப்பெண்' : 'Avg Score', value: `${avgScore}%`, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/5' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 + 0.4 }}
              className={`rounded-xl bg-gradient-to-br ${stat.bg} border border-border/20 p-3 text-center`}
            >
              <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
              <p className="text-lg font-black text-foreground leading-tight">{stat.value}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── View Full Profile Button ── */}
        {onViewProfile && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={onViewProfile}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 text-sm font-bold text-foreground hover:border-primary/40 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            {isTamil ? "முழு சுயவிவரத்தைக் காட்டு" : "View Full Profile"}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default EnhancedProfileCard;

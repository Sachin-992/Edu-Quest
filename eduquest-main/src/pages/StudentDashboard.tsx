import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Map,
  ShoppingBag,
  Share2,
  MoreVertical,
  BookOpen,
  Trophy,
  Award,
  Play,
  Flame,
  Sparkles,
  Smile,
  RefreshCw,
  UserCheck,
  ChevronRight,
  Globe,
  Settings,
  X
} from "lucide-react";
import type { Subject, Lesson } from "@/types/learning";
import SubjectBrowser from "@/components/learning/SubjectBrowser";
import LessonList from "@/components/learning/LessonList";
import LessonViewer from "@/components/learning/LessonViewer";
import TamilGames from "@/components/learning/TamilGames";
import EnglishBuddy from "@/components/learning/EnglishBuddy";
import LifeSkills from "@/components/learning/LifeSkills";
import FunCorner, { type GameType } from "@/components/learning/FunCorner";
import SkillWorldHub from "@/components/learning/skill-world/SkillWorldHub";
import SkillRoadmap from "@/components/learning/skill-world/SkillRoadmap";
import SkillLessonPlayer from "@/components/learning/skill-world/SkillLessonPlayer";
import ALL_SKILL_LESSONS from "@/components/learning/skill-world/allLessons";
import SKILL_CATEGORIES from "@/components/learning/skill-world/categories";
import type { SkillCategory, SkillLesson } from "@/components/learning/skill-world/types";
import AdventureMap from "@/components/adventure/AdventureMap";
import AvatarShop from "@/components/learning/AvatarShop";
import DailyMission from "@/components/learning/DailyMission";
import OnboardingTutorial from "@/components/learning/OnboardingTutorial";
import ShareAchievement from "@/components/learning/ShareAchievement";
import EnhancedLeaderboard from "@/components/learning/EnhancedLeaderboard";
import DailyLoginBonus from "@/components/learning/DailyLoginBonus";
import WeeklyChallenge from "@/components/learning/WeeklyChallenge";
import ComeBackBanner from "@/components/learning/ComeBackBanner";
import AchievementTracker from "@/components/learning/AchievementTracker";
import BadgeCollection from "@/components/learning/BadgeCollection";
import { supabase } from "@/integrations/supabase/client";
import type { BadgeStats } from "@/lib/retentionEngine";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import CharacterCreator, { CharacterSVG, type CharacterConfig } from "@/components/learning/CharacterCreator";
import PublicProfileDialog from "@/components/learning/PublicProfileDialog";
import { getRank, getNextRank } from "@/lib/retentionEngine";
import { ALL_COSMETICS } from "@/data/cosmetics";
import { getStableUuid } from "@/lib/utils";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useTranslation } from "react-i18next";
import DailyQuestSystem from "@/components/learning/DailyQuestSystem";
import StreakFreezeShop from "@/components/learning/StreakFreezeShop";
import EnhancedProfileCard from "@/components/learning/EnhancedProfileCard";
import EnglishBuddyGames from "@/components/learning/english-buddy/EnglishBuddyGames";
import GemWallet from "@/components/learning/GemWallet";
import LevelUpCelebration from "@/components/learning/LevelUpCelebration";


type View =
  | { screen: "home" }
  | { screen: "subjects" }
  | { screen: "lessons"; subject: Subject }
  | { screen: "lesson"; subject: Subject; lesson: Lesson }
  | { screen: "tamil_games" }
  | { screen: "fun_corner_game"; initialGame: GameType }
  | { screen: "adventure" }
  | { screen: "avatar_shop" }
  | { screen: "leaderboard" }
  | { screen: "badges" }
  | { screen: "character_creator" }
  | { screen: "english_buddy" }
  | { screen: "english_games" }
  | { screen: "streak_freeze" }
  | { screen: "life_skills" };

const THEME_TRANSLATIONS: Record<string, { en: string; ta: string }> = {
  space: { en: "Space", ta: "விண்வெளி" },
  cyberpunk: { en: "Cyberpunk", ta: "சைபர்பங்க்" },
  jungle: { en: "Jungle", ta: "காடு" },
  forest: { en: "Forest", ta: "காடு" },
  library: { en: "Library", ta: "நூலகம்" },
  castle: { en: "Castle", ta: "கோட்டை" },
  school: { en: "School", ta: "பள்ளி" }
};

const DEFAULT_CHARACTER_CONFIG: CharacterConfig = {
  gender: "male",
  style: "anime",
  skinTone: "#FCE3B6",
  hairstyle: "spiky",
  hairColor: "#1A1A1A",
  eyes: "anime",
  expression: "confident",
};

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { language } = useLanguageStore();
  const { t } = useTranslation();
  const isTamil = language === "ta";

  // Navigation History Stack
  const [history, setHistoryState] = useState<View[]>(() => {
    const saved = sessionStorage.getItem("student_view_history");
    return saved ? JSON.parse(saved) : [];
  });

  // Current View Screen State
  const [view, setViewState] = useState<View>(() => {
    const saved = sessionStorage.getItem("current_student_view");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse view from sessionStorage:", e);
      }
    }
    return { screen: "home" };
  });

  // Sync view to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem("current_student_view", JSON.stringify(view));
  }, [view]);

  // Sync history to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem("student_view_history", JSON.stringify(history));
  }, [history]);

  // Forward Navigation Wrapper
  const setView = (newView: View) => {
    setViewState((prev) => {
      // Don't push to history if it is the same view to prevent duplicate entries
      if (prev.screen !== newView.screen || JSON.stringify(prev) !== JSON.stringify(newView)) {
        setHistoryState((prevHistory) => {
          const last = prevHistory[prevHistory.length - 1];
          if (last && JSON.stringify(last) === JSON.stringify(prev)) {
            return prevHistory;
          }
          return [...prevHistory, prev];
        });
      }
      return newView;
    });
  };

  // Backward Navigation Wrapper
  const goBack = () => {
    setHistoryState((prevHistory) => {
      if (prevHistory.length === 0) {
        setViewState({ screen: "home" });
        return [];
      }
      const nextHistory = [...prevHistory];
      const previousView = nextHistory.pop();
      if (previousView) {
        setViewState(previousView);
      }
      return nextHistory;
    });
  };

  const handleSignOut = () => {
    sessionStorage.removeItem("current_student_view");
    sessionStorage.removeItem("student_view_history");
    sessionStorage.removeItem("selected_skill_category");
    sessionStorage.removeItem("selected_skill_grade_band");
    sessionStorage.removeItem("active_skill_lesson");
    signOut();
  };

  const [refreshGamification, setRefreshGamification] = useState(0);
  const [showLevelShare, setShowLevelShare] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasActivityToday, setHasActivityToday] = useState(false);
  const [showStreakFreeze, setShowStreakFreeze] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Dynamic user and stats state
  const [coins, setCoins] = useState(0);
  const [gems, setGems] = useState(0);
  const [dbProfile, setDbProfile] = useState<{ full_name?: string; class_level?: number; avatar_url?: string | null; roll_number?: string | null; school_id?: string | null } | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<CharacterConfig>(DEFAULT_CHARACTER_CONFIG);
  const [equippedPet, setEquippedPet] = useState<string | undefined>();
  const [equippedAura, setEquippedAura] = useState<string | undefined>();
  const [equippedBg, setEquippedBg] = useState<string>("bg-school");

  // Life Skills Sub-states loaded from sessionStorage
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<SkillCategory | null>(() => {
    const saved = sessionStorage.getItem("selected_skill_category");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });
  const [selectedSkillGradeBand, setSelectedSkillGradeBand] = useState<string | null>(() => {
    return sessionStorage.getItem("selected_skill_grade_band");
  });
  const [activeSkillLesson, setActiveSkillLesson] = useState<SkillLesson | null>(() => {
    const saved = sessionStorage.getItem("active_skill_lesson");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  // Sync Life Skills Sub-states to sessionStorage
  useEffect(() => {
    if (selectedSkillCategory) {
      sessionStorage.setItem("selected_skill_category", JSON.stringify(selectedSkillCategory));
    } else {
      sessionStorage.removeItem("selected_skill_category");
    }
  }, [selectedSkillCategory]);

  useEffect(() => {
    if (selectedSkillGradeBand) {
      sessionStorage.setItem("selected_skill_grade_band", selectedSkillGradeBand);
    } else {
      sessionStorage.removeItem("selected_skill_grade_band");
    }
  }, [selectedSkillGradeBand]);

  useEffect(() => {
    if (activeSkillLesson) {
      sessionStorage.setItem("active_skill_lesson", JSON.stringify(activeSkillLesson));
    } else {
      sessionStorage.removeItem("active_skill_lesson");
    }
  }, [activeSkillLesson]);

  const [completedSkillLessonIds, setCompletedSkillLessonIds] = useState<string[]>([]);
  const [currentWeather, setCurrentWeather] = useState<'clear' | 'rain' | 'snow' | 'windy' | 'magical'>('clear');

  const [resumeData, setResumeData] = useState<{
    subject: Subject;
    lesson: Lesson;
    completedCount: number;
    totalCount: number;
  } | null>(null);

  const [badgeStats, setBadgeStats] = useState<BadgeStats>({
    totalXP: 0,
    lessonsCompleted: 0,
    quizzesCompleted: 0,
    perfectQuizzes: 0,
    streakDays: 0,
    avgScore: 0,
    adventureLevels: 0,
    adventureStars: 0,
    loginDays: 0,
  });

  // Emotional Voice Lines & Speech Bubble states
  const QUOTES = [
    { en: "Let's level up our knowledge today! 🚀", ta: "இன்று நமது அறிவை வளர்த்துக் கொள்வோம்! 🚀" },
    { en: "Let's learn and grow! 💪", ta: "கற்றுக்கொண்டு வளர்வோம்! 💪" },
    { en: "Tap me again to jump! 🏃‍♂️", ta: "குதிப்பதற்கு என்னை மீண்டும் தட்டவும்! 🏃‍♂️" },
    { en: "Have you checked the Leaderboard today? 🏆", ta: "இன்று முன்னிலை பலகையைச் சரிபார்த்தீர்களா? 🏆" },
    { en: "Tamil games are super fun, have you tried them? 🎮", ta: "தமிழ் விளையாட்டுகள் மிகவும் வேடிக்கையானவை, நீங்கள் முயற்சி செய்தீர்களா? 🎮" },
    { en: "XP is the path to greatness. Keep questing! ⚡", ta: "XP என்பது பெருமைக்கான வழி. தொடர்ந்து விளையாடுங்கள்! ⚡" },
    { en: "Got some coins? Check the Avatar Shop! 🛍️", ta: "சில நாணயங்கள் உள்ளதா? அவதார் கடையை சரிபார்க்கவும்! 🛍️" },
    { en: "Completing quizzes earns you Gems! 💎", ta: "புதிர்களை முடிப்பதன் மூலம் ரத்தினங்களைப் பெறலாம்! 💎" },
    { en: "Daily missions refresh every day. Don't miss out! 📅", ta: "தினசரி சவால்கள் தினமும் புதுப்பிக்கப்படும். தவறவிடாதீர்கள்! 📅" },
    { en: "Are we going for a perfect 100 today? 💯", ta: "இன்று நாம் முழுமையாக 100 புள்ளிகள் பெறலாமா? 💯" },
    { en: "Stay focused, stay awesome! 🌟", ta: "கவனத்துடன் இருங்கள், சிறப்பாக செயல்படுங்கள்! 🌟" },
    { en: "My pet loves it when we study! 🐾", ta: "நாம் படிக்கும் போது என் செல்லப்பிராணிக்கு மிகவும் பிடிக்கும்! 🐾" },
    { en: "Can you unlock the Grandmaster rank? 👑", ta: "உங்களால் கிராண்ட்மாஸ்டர் தரத்தை திறக்க முடியுமா? 👑" }
  ];

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [jumpKey, setJumpKey] = useState(0);

  const quote = isTamil ? QUOTES[quoteIndex].ta : QUOTES[quoteIndex].en;

  // Time-based immersive greeting
  const getTimeBasedGreeting = (name: string) => {
    const hour = new Date().getHours();
    if (hour < 5) return `${t('greeting_night')}, ${name} 🌙`;
    if (hour < 12) return `${t('greeting_morning')}, ${name} 🌅`;
    if (hour < 17) return `${t('greeting_afternoon')}, ${name} ☀️`;
    if (hour < 21) return `${t('greeting_evening')}, ${name} 🌇`;
    return `${t('greeting_night')}, ${name} 🌙`;
  };

  const changeQuote = () => {
    const randomIdx = Math.floor(Math.random() * QUOTES.length);
    setQuoteIndex(randomIdx);
  };

  // Main fetch loop
  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        // Parallelize independent queries for speed
        const [profileRes, progressRes, adventureRes, transactionsRes, equippedRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("student_progress").select("xp_earned, score, completed_at, lesson_id, quiz_id, status").eq("user_id", user.id),
          supabase.from("adventure_progress").select("is_completed, stars_earned").eq("user_id", user.id),
          supabase.from("coin_transactions").select("amount").eq("user_id", user.id),
          supabase.from("student_avatar_items").select("item_id").eq("user_id", user.id).eq("is_equipped", true),
        ]);

        // 1. Process Profile
        const profData = profileRes.data;
        let gemsSpent = 0;
        let gemsAwarded = 0;
        if (profData) {
          setDbProfile(profData);
          if (profData.avatar_url) {
            try {
              const parsed = JSON.parse(profData.avatar_url);
              if (parsed.gender) {
                setAvatarConfig({ ...DEFAULT_CHARACTER_CONFIG, ...parsed });
              }
              gemsSpent = parsed.gems_spent || 0;
              gemsAwarded = parsed.gems_awarded || 0;
            } catch (e) {
              // Not a JSON string
            }
          }
        }

        // 2. Process Progress (for XP, perfect score, streak)
        const progress = progressRes.data;

        let xp = 0;
        let lessonsCount = 0;
        let quizzesCount = 0;
        let perfectCount = 0;
        let totalScoreSum = 0;
        let scoreCount = 0;

        if (progress) {
          xp = progress.reduce((sum, p) => sum + (p.xp_earned || 0), 0);
          lessonsCount = progress.filter((p) => p.lesson_id && p.status === "completed").length;
          
          const completedIdsList = progress
            .filter(p => p.status === "completed" && p.lesson_id)
            .map(p => p.lesson_id!);
          
          // Also load skill-world completions from localStorage
          // (skill lesson IDs are local and can't be stored in the FK-constrained lesson_id column)
          try {
            const localCompleted = JSON.parse(localStorage.getItem(`eduspark_skill_completed_${user.id}`) || '[]') as string[];
            localCompleted.forEach(id => {
              if (!completedIdsList.includes(id)) {
                completedIdsList.push(id);
              }
            });
          } catch { /* ignore parse errors */ }
          
          setCompletedSkillLessonIds(completedIdsList);
          
          progress.forEach((p) => {
            if (p.status === "completed") {
              if (p.quiz_id) {
                quizzesCount++;
                if (p.score !== null && p.score !== undefined) {
                  totalScoreSum += p.score;
                  scoreCount++;
                  if (p.score >= 100) perfectCount++;
                }
              }
            }
          });
        }

        // Streak
        const toISTDateStr = (d: string) => {
          const date = new Date(d);
          const istMs = date.getTime() + (330 * 60 * 1000);
          return new Date(istMs).toISOString().slice(0, 10);
        };
        const nowIST = toISTDateStr(new Date().toISOString());
        const yesterdayIST = toISTDateStr(new Date(Date.now() - 86400000).toISOString());
        const dates = progress
          ? progress
              .filter(p => p.completed_at)
              .map(p => toISTDateStr(p.completed_at!))
              .filter((v, i, a) => a.indexOf(v) === i)
              .sort((a, b) => b.localeCompare(a))
          : [];

        let streakDays = 0;
        if (dates.length > 0 && (dates[0] === nowIST || dates[0] === yesterdayIST)) {
          streakDays = 1;
          for (let i = 1; i < dates.length; i++) {
            const diff = new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime();
            if (diff <= 86400000 * 1.5) streakDays++;
            else break;
          }
        }
        setHasActivityToday(dates.includes(nowIST));

        // 3. Process Adventure (already fetched)
        const adventure = adventureRes.data;
        const adventureLevels = adventure?.filter((a) => a.is_completed).length ?? 0;
        const adventureStars = adventure?.reduce((sum, a) => sum + (a.stars_earned || 0), 0) ?? 0;

        setBadgeStats({
          totalXP: xp,
          lessonsCompleted: lessonsCount,
          quizzesCompleted: quizzesCount,
          perfectQuizzes: perfectCount,
          streakDays,
          avgScore: scoreCount > 0 ? Math.round(totalScoreSum / scoreCount) : 0,
          adventureLevels,
          adventureStars,
          loginDays: streakDays || 1,
        });

        // 4. Process Coin Transactions (already fetched)
        const transactions = transactionsRes.data;
        const spent = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
        const totalCoins = xp + spent;
        setCoins(totalCoins);
        localStorage.setItem("eq_coins", String(totalCoins));

        const totalGems = Math.max(0, Math.floor(xp / 100) + (perfectCount * 2) + gemsAwarded - gemsSpent);
        setGems(totalGems);
        localStorage.setItem("eq_gems", String(totalGems));

        // 5. Process Equipped Items (already fetched)
        const equipped = equippedRes.data;

        if (equipped) {
          const ids = equipped.map((d) => d.item_id);
          const items = ALL_COSMETICS.filter((c) => ids.includes(getStableUuid(c.id)));

          const petItem = items.find((i) => i.category === "pet");
          const auraItem = items.find((i) => i.category === "aura");
          const bgItem = items.find((i) => i.category === "background");

          setEquippedPet(petItem?.icon);
          setEquippedAura(auraItem?.icon);
          setEquippedBg(bgItem?.id || "bg-school");

          // Inject AAA dynamic cosmetic slots into CharacterConfig
          const OUTFIT_CATEGORIES = ['outfit', 'anime', 'superhero', 'fantasy', 'adventure', 'funny', 'school'];
          setAvatarConfig(prev => {
            const next = { ...prev };
            delete next.outfit; delete next.jacket; delete next.hat; delete next.glasses;
            delete next.prop; delete next.backpack; delete next.beard;
            
            items.forEach(item => {
              let slot = item.equipSlot || item.category;
              // Map outfit-type categories to the 'outfit' slot
              if (!item.equipSlot && OUTFIT_CATEGORIES.includes(item.category)) {
                slot = 'outfit';
              }
              if (slot === 'outfit') next.outfit = item.id;
              if (slot === 'jacket') next.jacket = item.id;
              if (slot === 'hat') next.hat = item.id;
              if (slot === 'glasses') next.glasses = item.id;
              if (slot === 'prop') next.prop = item.id;
              if (slot === 'backpack') next.backpack = item.id;
              if (slot === 'beard') next.beard = item.id;
            });
            return next;
          });
        }

        // 5. Fetch Resume Data (matchmaking details)
        const classLevel = profData?.class_level || 7;
        let { data: subjects } = await supabase
          .from("subjects")
          .select("*")
          .eq("class_level", classLevel)
          .eq("is_active", true)
          .order("sort_order");

        if (!subjects || subjects.length === 0) {
          const fallback = await supabase
            .from("subjects")
            .select("*")
            .eq("class_level", 7)
            .eq("is_active", true)
            .order("sort_order");
          subjects = fallback.data;
        }

        if (subjects && subjects.length > 0) {
          const subjectIds = subjects.map(s => s.id);
          const [lessonsRes, progressRes] = await Promise.all([
            supabase.from("lessons").select("id, subject_id, title, lesson_order").in("subject_id", subjectIds).eq("is_active", true).order("lesson_order"),
            supabase.from("student_progress").select("lesson_id, status").eq("user_id", user.id).eq("status", "completed").not("lesson_id", "is", null),
          ]);

          const lessons = (lessonsRes.data || []) as unknown as Lesson[];
          const completedIds = new Set((progressRes.data || []).map((p: any) => p.lesson_id));

          let foundResume = false;
          for (const subject of subjects) {
            const subjectLessons = lessons.filter(l => l.subject_id === subject.id).sort((a, b) => a.lesson_order - b.lesson_order);
            if (subjectLessons.length === 0) continue;
            const completedCount = subjectLessons.filter(l => completedIds.has(l.id)).length;
            const nextLesson = subjectLessons.find(l => !completedIds.has(l.id));
            if (nextLesson) {
              setResumeData({
                subject: subject as unknown as Subject,
                lesson: nextLesson,
                completedCount,
                totalCount: subjectLessons.length,
              });
              foundResume = true;
              break;
            }
          }
          if (!foundResume) {
            setResumeData(null);
          }
        }
      } catch (err) {
        console.error("Error fetching lobby data:", err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchUserData();
  }, [user, refreshGamification]);

  const goHome = () => {
    setRefreshGamification(r => r + 1);
    setHistoryState([]);
    setViewState({ screen: "home" });
  };

  const handleSubjectSelect = (subject: Subject) => {
    setView({ screen: "lessons", subject });
  };

  const handleResumeLearning = (subject: Subject, lesson: Lesson) => {
    setView({ screen: "lesson", subject, lesson });
  };

  const bottomNavItems = [
    { id: "home", label: t('nav_lobby'), emoji: "🏠" },
    { id: "subjects", label: t('nav_subjects'), emoji: "📚" },
    { id: "adventure", label: t('nav_adventure'), emoji: "🗺️" },
    { id: "leaderboard", label: t('nav_leaderboard'), emoji: "🏅" },
    { id: "character_creator", label: t('nav_customize'), emoji: "👤" },
  ] as const;

  const activeTab = (() => {
    if (view.screen === "home") return "home";
    if (view.screen === "subjects" || view.screen === "lessons") return "subjects";
    if (view.screen === "adventure") return "adventure";
    if (view.screen === "leaderboard") return "leaderboard";
    if (view.screen === "character_creator" || view.screen === "avatar_shop") return "character_creator";
    return "home";
  })();

  const handleNavClick = (id: typeof bottomNavItems[number]["id"]) => {
    setHistoryState([]);
    switch (id) {
      case "home": setViewState({ screen: "home" }); break;
      case "subjects": setViewState({ screen: "subjects" }); break;
      case "adventure": setViewState({ screen: "adventure" }); break;
      case "leaderboard": setViewState({ screen: "leaderboard" }); break;
      case "character_creator": setViewState({ screen: "character_creator" }); break;
    }
  };

  // Render dynamic background theme
  const renderHeroBackground = (themeId: string) => {
    const isSpace = themeId === "bg-space";
    const isCyber = themeId === "bg-cyberpunk";
    const isJungle = themeId === "bg-jungle" || themeId === "bg-forest";
    const isLibrary = themeId === "bg-library";
    const isCastle = themeId === "bg-castle";

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        {isSpace && (
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950 via-slate-950 to-indigo-950">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{
                  duration: 1.5 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        )}
        {isCyber && (
          <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-950 via-slate-950 to-cyan-950/60">
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,229,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.15)_1px,transparent_1px)] bg-[size:25px_25px]" />
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-[1px] w-full bg-cyan-400/30"
                style={{ top: `${20 + i * 25}%` }}
                animate={{ opacity: [0.1, 0.4, 0.1], y: [0, 10, 0] }}
                transition={{ duration: 3 + i, repeat: Infinity }}
              />
            ))}
          </div>
        )}
        {isJungle && (
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 to-stone-950">
            {[...Array(8)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-xl opacity-20"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, 15, 0],
                  rotate: [0, 45, 0],
                }}
                transition={{
                  duration: 4 + Math.random() * 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                🍃
              </motion.span>
            ))}
          </div>
        )}
        {isLibrary && (
          <div className="absolute inset-0 bg-gradient-to-b from-amber-950/80 to-slate-950">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 2 + Math.random() * 2, repeat: Infinity }}
              />
            ))}
          </div>
        )}
        {isCastle && (
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950">
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-slate-900/50 to-transparent blur-md" />
          </div>
        )}
        {!isSpace && !isCyber && !isJungle && !isLibrary && !isCastle && (
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-blue-400/25 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{ y: [-10, 10, -10], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2.5 + Math.random() * 2, repeat: Infinity }}
              />
            ))}
          </div>
        )}

        {/* ── Weather Particle Overlay Systems ── */}
        {currentWeather === 'rain' && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {[...Array(25)].map((_, i) => (
              <motion.div
                key={`rain-${i}`}
                className="absolute w-[1.5px] h-4 bg-cyan-400/40 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * -20}%`,
                }}
                animate={{
                  y: ['0px', '520px'],
                }}
                transition={{
                  duration: 0.7 + Math.random() * 0.3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 1,
                }}
              />
            ))}
          </div>
        )}
        {currentWeather === 'snow' && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`snow-${i}`}
                className="absolute w-2.5 h-2.5 bg-white rounded-full opacity-60"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * -20}%`,
                }}
                animate={{
                  y: ['0px', '520px'],
                  x: ['0px', `${(i % 2 === 0 ? 12 : -12)}px`, '0px'],
                }}
                transition={{
                  duration: 3.5 + Math.random() * 1.5,
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        )}
        {currentWeather === 'windy' && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <motion.span
                key={`windy-${i}`}
                className="absolute text-sm opacity-25 select-none"
                style={{
                  left: `${Math.random() * -20}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  x: ['0px', '600px'],
                  y: ['0px', `${Math.sin(i) * 35}px`, '0px'],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 4.5 + Math.random() * 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 2,
                }}
              >
                {i % 2 === 0 ? '🍃' : '🍂'}
              </motion.span>
            ))}
          </div>
        )}
        {currentWeather === 'magical' && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`magical-${i}`}
                className="absolute text-sm select-none"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${100 + Math.random() * 20}%`,
                }}
                animate={{
                  y: ['0px', '-520px'],
                  scale: [0.5, 1.2, 0.5],
                  opacity: [0.2, 0.85, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 2,
                }}
              >
                {['✨', '⭐', '🌟', '💫'][i % 4]}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ── Full-page/Focus Views (Bypass HUD & Dock for complete immersion) ── */
  if (view.screen === "fun_corner_game") {
    return <FunCorner initialGame={view.initialGame} onBack={goBack} />;
  }
  if (view.screen === "tamil_games") {
    return <TamilGames onBack={goBack} classLevel={dbProfile?.class_level || 5} />;
  }
  if (view.screen === "lesson") {
    return (
      <LessonViewer
        lesson={view.lesson}
        subjectName={view.subject.name}
        onBack={() => {
          setRefreshGamification(r => r + 1);
          goBack();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-transparent text-foreground flex flex-col relative pb-28">
      <OnboardingTutorial studentName={dbProfile?.full_name || "Student"} />
      <DailyLoginBonus />
      <LevelUpCelebration totalXP={badgeStats.totalXP} onDismiss={() => setRefreshGamification(r => r + 1)} />

      {/* ── 1. Top HUD Stats Bar ── */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="z-30 shrink-0 bg-card/75 backdrop-blur-xl border-b border-border/40 px-2 sm:px-4 md:px-8 py-2 sm:py-3.5 flex items-center justify-between sticky top-0 text-foreground gap-1 sm:gap-4"
      >
        <div className="flex items-center gap-1 sm:gap-4 shrink min-w-0">
          {/* User mini badge */}
          <div
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2.5 bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card/80 transition-all rounded-full h-8 sm:h-10 p-0.5 sm:p-1 cursor-pointer sm:pr-3.5 hover-glow btn-bounce-hover shrink min-w-0"
            style={{ '--hover-glow-color': 'hsl(var(--primary) / 0.2)' } as React.CSSProperties}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-lg shrink-0 overflow-hidden">
              <CharacterSVG config={avatarConfig} mini={true} />
            </div>
            <div className="text-left leading-none shrink min-w-0 hidden sm:block">
              <div className="text-[10px] sm:text-xs font-black text-foreground truncate max-w-[65px] sm:max-w-[200px]">
                {getTimeBasedGreeting(dbProfile?.full_name?.split(" ")[0] || "Champion")}
              </div>
              <span className="text-[8px] sm:text-[9px] font-black text-cyan-600 dark:text-cyan-400 tracking-wider flex items-center gap-0.5 mt-0.5 uppercase">
                <span>Lvl {getRank(badgeStats.totalXP).level}</span>
                <span>{getRank(badgeStats.totalXP).emoji}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Resource Displays */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <GemWallet />

          <motion.div whileHover={{ scale: 1.1, rotate: [0, -3, 3, 0] }} whileTap={{ scale: 0.9 }} onClick={() => setShowStreakFreeze(prev => !prev)} className="flex items-center justify-center gap-1 sm:gap-1.5 bg-card/60 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)] px-2 sm:px-3 h-8 sm:h-10 rounded-full cursor-pointer transition-colors duration-300">
            <span className="text-xs sm:text-sm animate-pulse">🔥</span>
            <span className="font-black text-[10px] sm:text-xs text-orange-600 dark:text-orange-400">{badgeStats.streakDays}</span>
          </motion.div>
        </div>

        {/* Dropdown & Settings */}
        <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
          <div className="hidden sm:block"><ThemeToggle /></div>
          <LanguageToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl bg-card border-border text-foreground shadow-lg">
              <DropdownMenuItem onClick={() => setShowLevelShare(true)} className="hover:bg-accent focus:bg-accent cursor-pointer">
                <Share2 className="w-4 h-4 mr-2 text-primary" /> {t('share_progress')}
              </DropdownMenuItem>
              
              <div className="border-t border-border/40 my-1" />
              <div className="px-2.5 py-1.5 text-[9px] font-black uppercase text-muted-foreground select-none">Lobby Weather</div>
              <div className="flex items-center gap-1 px-2 pb-2">
                {(['clear', 'rain', 'snow', 'windy', 'magical'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setCurrentWeather(w)}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center border transition-all cursor-pointer ${
                      currentWeather === w 
                        ? 'bg-primary/15 border-primary text-primary scale-105 shadow-[0_0_8px_rgba(var(--primary),0.3)]' 
                        : 'border-border/30 hover:bg-muted text-muted-foreground'
                    }`}
                    title={w.toUpperCase()}
                  >
                    {w === 'clear' ? '☀️' : w === 'rain' ? '🌧️' : w === 'snow' ? '❄️' : w === 'windy' ? '🍃' : '✨'}
                  </button>
                ))}
              </div>
              <div className="border-t border-border/40 my-1" />

              <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:text-red-400 hover:bg-red-500/10 cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" /> {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      {/* Share Achievement Modal */}
      <ShareAchievement
        isOpen={showLevelShare}
        onClose={() => setShowLevelShare(false)}
        achievement={{ title: "Learning Champion!", description: "Check out my learning progress!", emoji: "🏆", xp: badgeStats.totalXP }}
        studentName={dbProfile?.full_name || "Student"}
      />

      {/* Own Public Profile Dialog */}
      {isProfileOpen && user && (
        <PublicProfileDialog
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          userId={user.id}
        />
      )}

      {/* Streak Freeze Overlay */}
      <AnimatePresence>
        {showStreakFreeze && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowStreakFreeze(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <StreakFreezeShop
                streakDays={badgeStats.streakDays}
                onClose={() => setShowStreakFreeze(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. Main Content workspace ── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        
        {/* ══ LOBBY HOME SCREEN ══ */}
        {view.screen === "home" && dataLoading && (
          <div className="space-y-6 pb-28 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-3 h-[480px] rounded-3xl bg-card/60 border border-border/30" />
              <div className="lg:col-span-5 h-[520px] rounded-3xl bg-card/60 border border-border/30" />
              <div className="lg:col-span-4 space-y-6">
                <div className="h-40 rounded-3xl bg-card/60 border border-border/30" />
                <div className="h-64 rounded-3xl bg-card/60 border border-border/30" />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-card/60 border border-border/30" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-72 rounded-3xl bg-card/60 border border-border/30" />
              <div className="h-72 rounded-3xl bg-card/60 border border-border/30" />
            </div>
          </div>
        )}
        {view.screen === "home" && !dataLoading && (
          <div className="space-y-8 pb-28">
            {/* Main Gaming Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* LEFT: MATCHMAKING CARD */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.15 }}
                className="lg:col-span-3 game-card game-glow-cyan p-5 flex flex-col justify-between relative overflow-hidden card-shimmer"
              >
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none" />
                
                <div>
                  <div className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3">{t('lobby_matchmaker')}</div>
                  <h3 className="text-base font-black text-foreground">{t('lobby_ready')}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t('lobby_desc')}</p>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (resumeData) {
                        handleResumeLearning(resumeData.subject, resumeData.lesson);
                      } else {
                        setView({ screen: "subjects" });
                      }
                    }}
                    className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white font-black py-4.5 shadow-[0_0_20px_rgba(245,158,11,0.35)] text-sm uppercase tracking-wider group mt-5 flex items-center justify-center gap-2 btn-shake-attention btn-glow-pulse"
                    style={{ '--glow-color': 'rgba(245, 158, 11, 0.45)' } as React.CSSProperties}
                  >
                    <div className="absolute inset-0 rounded-2xl border-2 border-white/20 animate-ping opacity-60 pointer-events-none" />
                    <Play className="w-5 h-5 fill-white text-white" />
                    {t('lobby_start_quest')}
                  </motion.button>
                </div>

                <div className="space-y-4 mt-6">
                  {/* Current Learning info */}
                  <div className="bg-muted/20 border border-border/30 rounded-2xl p-4">
                    {resumeData ? (
                      <>
                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">{t('lobby_resume_lesson')}</div>
                        <div className="flex items-center gap-2.5 mb-3">
                          <span className="text-2xl">{resumeData.subject.icon}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-foreground truncate">{isTamil && resumeData.subject.name_tamil ? resumeData.subject.name_tamil : resumeData.subject.name}</div>
                            <div className="text-[10px] text-muted-foreground font-bold truncate">{resumeData.lesson.title}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                              style={{ width: `${Math.round((resumeData.completedCount / resumeData.totalCount) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-muted-foreground shrink-0">
                            {resumeData.completedCount}/{resumeData.totalCount}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t('lobby_challenge_cleared')}</div>
                        <p className="text-[10px] text-muted-foreground">{t('lobby_choose_subject')}</p>
                      </>
                    )}
                  </div>

                  {/* Quick Play shortcuts */}
                  <div className="space-y-2">
                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t('lobby_mini_games')}</div>
                    
                    <button
                      onClick={() => setView({ screen: "fun_corner_game", initialGame: "quiz" })}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-muted/15 hover:bg-muted/30 border border-border/30 hover:border-purple-500/30 transition-all text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎮</span>
                        <div>
                          <div className="text-xs font-bold text-foreground">{t('lobby_fun_corner')}</div>
                          <div className="text-[9px] text-muted-foreground font-semibold">{t('lobby_fun_corner_desc')}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>

                    <button
                      onClick={() => setView({ screen: "tamil_games" })}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-muted/15 hover:bg-muted/30 border border-border/30 hover:border-red-500/30 transition-all text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🐯</span>
                        <div>
                          <div className="text-xs font-bold text-foreground">{t('lobby_tamil_quest')}</div>
                          <div className="text-[9px] text-muted-foreground font-semibold">{t('lobby_tamil_quest_desc')}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>

                     <button
                      onClick={() => setView({ screen: "english_buddy" })}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-muted/15 hover:bg-muted/30 border border-border/30 hover:border-indigo-500/30 transition-all text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🤖</span>
                        <div>
                          <div className="text-xs font-bold text-foreground">{isTamil ? "ஆங்கில நண்பன்" : "English Buddy"}</div>
                          <div className="text-[9px] text-muted-foreground font-semibold">{isTamil ? "AI மாஸ்கோட்டுடன் ஆங்கிலம் பேசலாம் & எழுதலாம்!" : "Speak & write English with AI mascot!"}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>

                    <button
                      onClick={() => setView({ screen: "life_skills" })}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-muted/15 hover:bg-muted/30 border border-border/30 hover:border-emerald-500/30 transition-all text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🌍</span>
                        <div>
                          <div className="text-xs font-bold text-foreground">{isTamil ? "வாழ்க்கைத்திறன் உலகம்" : "Life Skills World"}</div>
                          <div className="text-[9px] text-muted-foreground font-semibold">{isTamil ? "புத்திசாலித்தனமான முடிவுகளை எடுத்து பேட்ஜ்களை வெல்லுங்கள்!" : "Make smart decisions & earn badges!"}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* CENTER: CHARACTER LOBBY CARD */}
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.25 }}
                className="lg:col-span-5 relative w-full rounded-3xl overflow-hidden shadow-2xl border border-border/30 flex flex-col justify-between min-h-[480px] h-[520px]"
              >
                {renderHeroBackground(equippedBg)}

                {/* Top header badge */}
                <div className="relative z-10 self-start m-4 bg-background/50 border border-border/40 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black tracking-wider uppercase text-primary">
                  {t('lobby_theme')}: {(() => {
                    const tKey = equippedBg.replace("bg-", "");
                    const trans = THEME_TRANSLATIONS[tKey];
                    return trans ? (isTamil ? trans.ta : trans.en) : tKey;
                  })()}
                </div>

                {/* Floating Speech Bubble */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={quote}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    className="absolute top-12 left-1/2 -translate-x-1/2 bg-card/90 text-card-foreground px-3.5 py-2.5 rounded-2xl shadow-2xl border border-border/80 max-w-[210px] text-center z-20 cursor-pointer"
                    onClick={changeQuote}
                  >
                    <p className="text-xs font-bold leading-tight">{quote}</p>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card rotate-45 border-r border-b border-border/80" />
                  </motion.div>
                </AnimatePresence>

                {/* Main Avatar Character SVG with click jumps */}
                <div
                  className="flex-1 flex items-center justify-center relative mt-10 mb-4 cursor-pointer"
                  onClick={() => {
                    setJumpKey((k) => k + 1);
                    changeQuote();
                  }}
                >
                  <motion.div
                    key={jumpKey}
                    animate={{
                      y: jumpKey > 0 ? [-35, 5, -10, 0] : [0, 0],
                      scaleX: jumpKey > 0 ? [1, 1.15, 0.92, 1.05, 1] : [1, 1],
                      scaleY: jumpKey > 0 ? [1, 0.82, 1.18, 0.95, 1] : [1, 1],
                      rotate: jumpKey > 0 ? [0, -3, 2, -1, 0] : [0, 0],
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 10,
                      mass: 0.8,
                    }}
                    className="relative z-10"
                  >
                    {/* Ambient sparkle particles around character */}
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={`sparkle-${i}`}
                        className="absolute w-2 h-2 rounded-full pointer-events-none"
                        style={{
                          background: ['#fbbf24', '#a855f7', '#06b6d4', '#f43f5e', '#22c55e', '#ec4899'][i],
                          left: `${20 + Math.cos(i * 1.05) * 40}%`,
                          top: `${15 + Math.sin(i * 1.05) * 35}%`,
                        }}
                        animate={{
                          y: [0, -15 - i * 4, 0],
                          x: [0, (i % 2 === 0 ? 8 : -8), 0],
                          scale: [0.5, 1.2, 0.5],
                          opacity: [0.2, 0.9, 0.2],
                        }}
                        transition={{
                          duration: 2.5 + i * 0.4,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: i * 0.3,
                        }}
                      />
                    ))}
                    <CharacterSVG config={avatarConfig} pet={equippedPet} aura={equippedAura} />
                  </motion.div>
                </div>

                {/* Bottom Stats Banner inside Lobby */}
                <div className="relative z-10 m-4 bg-card/85 border border-border/50 backdrop-blur-xl p-3.5 rounded-2xl flex items-center justify-between text-foreground">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg text-xl select-none">
                      {getRank(badgeStats.totalXP).emoji}
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t('lobby_level')} {getRank(badgeStats.totalXP).level}</p>
                      <p className="text-sm font-black text-foreground">{getRank(badgeStats.totalXP).name}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs font-black text-foreground">{badgeStats.totalXP} {t('xp')}</div>
                    <div className="text-[9px] text-muted-foreground font-semibold mt-0.5">
                      {getNextRank(badgeStats.totalXP)
                        ? `${getNextRank(badgeStats.totalXP)?.xpNeeded} ${t('lobby_xp_to_next')}`
                        : t('lobby_max_rank')}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* RIGHT: DAILY MISSIONS & CRATE LAUNCHER */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                {/* Daily Mission widget */}
                <DailyMission refreshTrigger={refreshGamification} />

                {/* Lootbox Launcher Card */}
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.4 }}
                  className="game-card p-5 flex flex-col justify-between relative overflow-hidden card-shimmer rainbow-shadow"
                  style={{ borderRadius: '1.5rem' }}
                >
                  <div className="absolute inset-0 bg-radial-gradient from-purple-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                  
                  <div className="relative z-10 text-left">
                    <div className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">{t('reward_system')}</div>
                    <h3 className="text-sm font-black text-foreground">{t('mystery_lootbox')}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{t('lootbox_desc')}</p>

                    <div className="my-5 flex justify-center">
                      <motion.div
                        animate={{
                          y: [-8, 8, -8],
                          rotate: [-5, 5, -5],
                          scale: [1, 1.08, 1],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="text-7xl filter drop-shadow-[0_10px_25px_rgba(168,85,247,0.5)] cursor-pointer select-none"
                        whileHover={{ scale: 1.2, rotate: 15 }}
                        whileTap={{ scale: 0.85, rotate: -10 }}
                        onClick={() => setView({ screen: "avatar_shop" })}
                      >
                        🎁
                      </motion.div>
                    </div>

                    <Button
                      onClick={() => setView({ screen: "avatar_shop" })}
                      className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 font-bold text-white shadow-lg shadow-purple-500/25 h-10 btn-bounce-hover btn-glow-pulse"
                      style={{ '--glow-color': 'rgba(168, 85, 247, 0.4)' } as React.CSSProperties}
                    >
                      {t('go_to_shop')}
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Quick Access — features not in bottom nav */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
            >
              {[
                { id: 'english_buddy', label: isTamil ? 'ஆங்கில நண்பன்' : 'English Buddy', emoji: '🤖', gradient: 'from-indigo-500/15 to-blue-500/10', border: 'hover:border-indigo-500/40' },
                { id: 'life_skills', label: isTamil ? 'வாழ்க்கைத்திறன்' : 'Life Skills', emoji: '🌍', gradient: 'from-emerald-500/15 to-teal-500/10', border: 'hover:border-emerald-500/40' },
                { id: 'badges', label: t('nav_badges'), emoji: '🏆', gradient: 'from-amber-500/15 to-orange-500/10', border: 'hover:border-amber-500/40' },
                { id: 'english_games', label: isTamil ? 'விளையாட்டுகள்' : 'Games', emoji: '🎮', gradient: 'from-purple-500/15 to-pink-500/10', border: 'hover:border-purple-500/40' },
                { id: 'avatar_shop', label: t('nav_shop'), emoji: '🛍️', gradient: 'from-rose-500/15 to-red-500/10', border: 'hover:border-rose-500/40' },
              ].map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setView({ screen: item.id as any })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${item.gradient} border border-border/30 ${item.border} backdrop-blur-sm transition-all shadow-sm hover:shadow-md cursor-pointer`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-[10px] font-black text-foreground uppercase tracking-wider">{item.label}</span>
                </motion.button>
              ))}
            </motion.div>

            {/* Tier 2: Daily Quests & Enhanced Profile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DailyQuestSystem
                lessonsToday={hasActivityToday ? 1 : 0}
                xpToday={badgeStats.totalXP}
                perfectQuizToday={badgeStats.perfectQuizzes}
                streakDays={badgeStats.streakDays}
                wordCompleted={false}
              />
              <EnhancedProfileCard
                name={dbProfile?.full_name || "Hero Student"}
                classLevel={dbProfile?.class_level || 1}
                totalXP={badgeStats.totalXP}
                streakDays={badgeStats.streakDays}
                lessonsCompleted={badgeStats.lessonsCompleted}
                quizzesCompleted={badgeStats.quizzesCompleted}
                perfectQuizzes={badgeStats.perfectQuizzes}
                avgScore={badgeStats.avgScore}
                compact
                onViewProfile={() => setIsProfileOpen(true)}
                avatarConfig={avatarConfig}
              />
            </div>

            {/* Tier 3: Weekly Challenges & Achievements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WeeklyChallenge stats={badgeStats} />
              <AchievementTracker stats={badgeStats} />
            </div>

            {/* Tier 4: Comeback banner */}
            <ComeBackBanner hasActivityToday={hasActivityToday} />
          </div>
        )}

        {/* ══ Subjects View ══ */}
        {view.screen === "subjects" && (
          <div className="space-y-6 text-left">
            <button
              onClick={goBack}
              className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              ← {t('back_to_lobby')}
            </button>
            <SubjectBrowser onSelectSubject={handleSubjectSelect} />

            {/* Embedded Fun Corner games for fast practice */}
            <FunCorner
              embedded
              onBack={() => setRefreshGamification(r => r + 1)}
              onStartGame={(game) => setView({ screen: "fun_corner_game", initialGame: game })}
            />
          </div>
        )}

        {/* ══ Lesson List view ══ */}
        {view.screen === "lessons" && (
          <LessonList
            subject={view.subject}
            onBack={() => {
              setRefreshGamification(r => r + 1);
              goBack();
            }}
            onSelectLesson={(lesson) => setView({ screen: "lesson", subject: view.subject, lesson })}
            onOpenTamilGames={
              view.subject.name.toLowerCase() === "tamil"
                ? () => setView({ screen: "tamil_games" })
                : undefined
            }
          />
        )}

        {/* ══ Leaderboard View ══ */}
        {view.screen === "leaderboard" && (
          <div className="space-y-6 text-left">
            <button
              onClick={goBack}
              className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              ← {t('back_to_lobby')}
            </button>
            <EnhancedLeaderboard onRefresh={() => setRefreshGamification(r => r + 1)} />
          </div>
        )}

        {/* ══ Adventure View ══ */}
        {view.screen === "adventure" && (
          <div className="text-left">
            <AdventureMap onBack={goBack} />
          </div>
        )}

        {/* ══ Badge Collection View ══ */}
        {view.screen === "badges" && (
          <div className="text-left">
            <BadgeCollection stats={badgeStats} onBack={goBack} />
          </div>
        )}

        {/* ══ Avatar Shop View ══ */}
        {view.screen === "avatar_shop" && (
          <div className="text-left">
            <AvatarShop onBack={goBack} onConfigChange={(newConfig) => setAvatarConfig(newConfig)} />
          </div>
        )}

        {/* ══ Character Customizer View ══ */}
        {view.screen === "character_creator" && (
          <div className="text-left">
            <CharacterCreator onBack={goBack} onSaved={() => setRefreshGamification((r) => r + 1)} />
          </div>
        )}

        {/* ══ English Buddy View ══ */}
        {view.screen === "english_buddy" && (
          <EnglishBuddy onBack={goBack} />
        )}

        {/* ══ English Games View ══ */}
        {view.screen === "english_games" && (
          <EnglishBuddyGames onBack={goBack} />
        )}

        {/* ══ Life Skills View ══ */}
        {view.screen === "life_skills" && (
          activeSkillLesson ? (
            <SkillLessonPlayer
              lesson={activeSkillLesson}
              onBack={() => setActiveSkillLesson(null)}
              onComplete={(lessonId, xp, coinsReward) => {
                setCoins(c => c + coinsReward);
                setBadgeStats(prev => ({ ...prev, totalXP: prev.totalXP + xp }));
                setCompletedSkillLessonIds(prev => [...prev, lessonId]);
                setActiveSkillLesson(null);
                setRefreshGamification(r => r + 1);
              }}
            />
          ) : selectedSkillCategory && selectedSkillGradeBand ? (
            <SkillRoadmap
              category={selectedSkillCategory}
              gradeBand={selectedSkillGradeBand}
              lessons={ALL_SKILL_LESSONS.filter(l => 
                l.categoryId === selectedSkillCategory.id && 
                `${l.gradeMin}-${l.gradeMax}` === selectedSkillGradeBand
              ).sort((a, b) => a.order - b.order)}
              completedLessonIds={completedSkillLessonIds}
              onBack={() => {
                setSelectedSkillCategory(null);
                setSelectedSkillGradeBand(null);
              }}
              onStartLesson={(lesson) => setActiveSkillLesson(lesson)}
            />
          ) : (
            <SkillWorldHub
              onBack={goBack}
              onSelectCategory={(catId, band) => {
                const catObj = SKILL_CATEGORIES.find(c => c.id === catId);
                if (catObj) {
                  setSelectedSkillCategory(catObj);
                  setSelectedSkillGradeBand(band);
                }
              }}
              completedLessonIds={completedSkillLessonIds}
              allLessons={ALL_SKILL_LESSONS}
              selectedGrade={dbProfile?.class_level || 1}
              coins={coins}
              totalXP={badgeStats.totalXP}
            />
          )
        )}
      </main>

      {/* ── 3. Sticky Bottom Cyber Navigation Console ── */}
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border/50 shadow-2xl py-2 px-3 flex items-center justify-between gap-1 w-full text-foreground"
      >
        {bottomNavItems.map((item, idx) => {
          const isActive = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 + idx * 0.06, type: 'spring', stiffness: 300, damping: 18 }}
              className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 relative transition-colors rounded-xl hover:bg-accent/40 cursor-pointer"
            >
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute inset-0 bg-gradient-to-t from-primary/15 to-transparent rounded-xl"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
              <motion.span
                className={`text-xl sm:text-2xl z-10 select-none ${isActive ? 'nav-icon-wiggle' : ''}`}
                animate={isActive ? { y: [0, -4, 0], scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              >
                {item.emoji}
              </motion.span>
              <span className={`text-[9px] font-black z-10 truncate hidden sm:block mt-0.5 select-none transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute -bottom-0.5 w-5 h-1 rounded-full bg-primary"
                  style={{ boxShadow: '0 0 12px hsl(var(--primary) / 0.7), 0 0 24px hsl(var(--primary) / 0.3)' }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.nav>
    </div>
  );
};

export default StudentDashboard;


import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { onQuizComplete } from "@/lib/quizSyncBus";
import { Trophy, Medal, Award, Star, TrendingUp, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import PublicProfileDialog from "./PublicProfileDialog";
import { CharacterSVG, type CharacterConfig } from "./CharacterCreator";
import { useLanguageStore } from "@/store/useLanguageStore";

function getISOWeekOfDate(d: Date): number {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function getPreviousWeekRange() {
  const now = new Date();
  
  // Start of current week (Monday)
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  currentMonday.setHours(0, 0, 0, 0);

  // Start of previous week (Monday)
  const prevMonday = new Date(currentMonday);
  prevMonday.setDate(currentMonday.getDate() - 7);

  // End of previous week (Sunday 23:59:59)
  const prevSunday = new Date(currentMonday);
  prevSunday.setMilliseconds(-1);

  return {
    start: prevMonday.toISOString(),
    end: prevSunday.toISOString(),
    weekKey: `${prevMonday.getFullYear()}-W${getISOWeekOfDate(prevMonday)}`
  };
}


interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_xp: number;
  rank: number;
  improvement?: number;
}

interface LeaderboardSettings {
  is_visible: boolean;
  mode: string;
  show_most_improved: boolean;
}

const LEVELS = [
  { level: 1, xpNeeded: 0, title: "Beginner 🌱" },
  { level: 2, xpNeeded: 50, title: "Explorer 🧭" },
  { level: 3, xpNeeded: 150, title: "Learner 📖" },
  { level: 4, xpNeeded: 300, title: "Scholar 🎓" },
  { level: 5, xpNeeded: 500, title: "Master 🏆" },
  { level: 6, xpNeeded: 800, title: "Champion 👑" },
  { level: 7, xpNeeded: 1200, title: "Legend ⭐" },
];

const rankStyles: Record<number, { bg: string; icon: React.ReactNode; border: string }> = {
  1: { bg: "bg-yellow-100 dark:bg-yellow-900/30", icon: <Trophy className="w-5 h-5 text-yellow-500" />, border: "border-yellow-400" },
  2: { bg: "bg-gray-100 dark:bg-gray-800/40", icon: <Medal className="w-5 h-5 text-gray-400" />, border: "border-gray-300" },
  3: { bg: "bg-orange-100 dark:bg-orange-900/30", icon: <Award className="w-5 h-5 text-orange-500" />, border: "border-orange-400" },
};

interface EnhancedLeaderboardProps {
  onRefresh?: () => void;
}

const EnhancedLeaderboard = ({ onRefresh }: EnhancedLeaderboardProps) => {
  const { user } = useAuth();
  const { language } = useLanguageStore();
  const isTamil = language === "ta";

  const getLevelTitle = (level: number, isTamil: boolean) => {
    const titles: Record<number, string> = {
      1: isTamil ? "தொடக்கநிலை 🌱" : "Beginner 🌱",
      2: isTamil ? "ஆராய்ச்சியாளர் 🧭" : "Explorer 🧭",
      3: isTamil ? "கற்பவர் 📖" : "Learner 📖",
      4: isTamil ? "அறிஞர் 🎓" : "Scholar 🎓",
      5: isTamil ? "நிபுணர் 🏆" : "Master 🏆",
      6: isTamil ? "வெற்றியாளர் 👑" : "Champion 👑",
      7: isTamil ? "சாதனையாளர் ⭐" : "Legend ⭐",
    };
    return titles[level] || "";
  };

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [mostImproved, setMostImproved] = useState<LeaderboardEntry | null>(null);
  const [settings, setSettings] = useState<LeaderboardSettings>({ is_visible: true, mode: "all_time", show_most_improved: true });
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [classLevel, setClassLevel] = useState<number>(7);

  // Weekly reward claim states
  const [rewardClaim, setRewardClaim] = useState<{
    rank: number;
    coins: number;
    gems: number;
    weekKey: string;
  } | null>(null);
  const [claiming, setClaiming] = useState(false);

  const handleRowClick = (uid: string) => {
    setSelectedStudentId(uid);
    setIsProfileOpen(true);
  };

  const handleClaimReward = async () => {
    if (!rewardClaim || !user || claiming) return;
    setClaiming(true);
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      let parsedAvatar: any = {};
      if (prof?.avatar_url) {
        try {
          parsedAvatar = JSON.parse(prof.avatar_url);
        } catch (e) {}
      }

      const claimedWeeks: string[] = parsedAvatar.leaderboard_claimed_weeks || [];
      if (claimedWeeks.includes(rewardClaim.weekKey)) {
        setRewardClaim(null);
        return;
      }

      // 1. Insert coin transaction
      await supabase.from("coin_transactions").insert({
        user_id: user.id,
        amount: rewardClaim.coins,
        description: isTamil 
          ? `தலைவர் பலகை வாராந்திர முதல் 3 வெகுமதி (தரம் #${rewardClaim.rank}) 🏆`
          : `Leaderboard Weekly Top 3 Reward (Rank #${rewardClaim.rank}) 🏆`,
      });

      // 2. Update gems & claimed weeks
      claimedWeeks.push(rewardClaim.weekKey);
      parsedAvatar.leaderboard_claimed_weeks = claimedWeeks;
      parsedAvatar.gems_awarded = (parsedAvatar.gems_awarded || 0) + rewardClaim.gems;

      await supabase
        .from("profiles")
        .update({ avatar_url: JSON.stringify(parsedAvatar) })
        .eq("user_id", user.id);

      // Sync local storage
      const currentCoins = parseInt(localStorage.getItem('eq_coins') || '0', 10);
      const currentGems = parseInt(localStorage.getItem('eq_gems') || '0', 10);
      localStorage.setItem('eq_coins', String(currentCoins + rewardClaim.coins));
      localStorage.setItem('eq_gems', String(currentGems + rewardClaim.gems));

      // Trigger callback if passed
      if (onRefresh) {
        onRefresh();
      }

      setRewardClaim(null);
    } catch (error) {
      console.error("Error claiming leaderboard reward:", error);
    } finally {
      setClaiming(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      // 1. Get current user's profile to filter by class level
      const { data: userProf } = await supabase
        .from("profiles")
        .select("class_level, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      const userClassLevel = userProf?.class_level || 7;
      setClassLevel(userClassLevel);

      // 2. Get leaderboard settings
      const { data: settingsData } = await supabase
        .from("leaderboard_settings")
        .select("is_visible, mode, show_most_improved")
        .limit(1)
        .maybeSingle();

      if (settingsData) {
        setSettings(settingsData as LeaderboardSettings);
        if (!settingsData.is_visible) { setLoading(false); return; }
      }

      const isWeekly = settingsData?.mode === "weekly";
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);

      let query = supabase.from("student_progress").select("user_id, xp_earned, score, completed_at");
      if (isWeekly) query = query.gte("completed_at", monday.toISOString());
      const { data: progressData } = await query;

      if (!progressData || progressData.length === 0) { setLoading(false); return; }

      const xpMap = new Map<string, number>();
      progressData.forEach((p) => xpMap.set(p.user_id, (xpMap.get(p.user_id) || 0) + p.xp_earned));

      const userIds = Array.from(xpMap.keys());
      
      // Filter profiles strictly by the current user's class level
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .eq("class_level", userClassLevel)
        .in("user_id", userIds);

      if (!profiles || profiles.length === 0) { setLoading(false); return; }

      const board: LeaderboardEntry[] = profiles
        .map((p) => ({
          user_id: p.user_id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          total_xp: xpMap.get(p.user_id) || 0,
          rank: 0,
        }))
        .sort((a, b) => b.total_xp - a.total_xp)
        .map((entry, i) => ({ ...entry, rank: i + 1 }));

      setAllEntries(board);
      setEntries(board.slice(0, 10));

      // 3. Most improved (class filtered)
      if (settingsData?.show_most_improved) {
        const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
        const { data: allProgress } = await supabase
          .from("student_progress")
          .select("user_id, score, completed_at")
          .not("score", "is", null)
          .not("completed_at", "is", null);

        if (allProgress && allProgress.length > 0) {
          const improvementMap = new Map<string, { recent: number[]; older: number[] }>();
          allProgress.forEach((p) => {
            const dt = new Date(p.completed_at!);
            if (!improvementMap.has(p.user_id)) improvementMap.set(p.user_id, { recent: [], older: [] });
            const m = improvementMap.get(p.user_id)!;
            if (dt >= oneWeekAgo) m.recent.push(p.score!);
            else if (dt >= twoWeeksAgo) m.older.push(p.score!);
          });

          // Only calculate improvement for class members
          const classUserIds = new Set(profiles.map(p => p.user_id));
          let bestUserId = "";
          let bestImprovement = 0;
          for (const [uid, { recent, older }] of improvementMap) {
            if (classUserIds.has(uid) && recent.length > 0 && older.length > 0) {
              const imp = (recent.reduce((a, b) => a + b, 0) / recent.length) - (older.reduce((a, b) => a + b, 0) / older.length);
              if (imp > bestImprovement) { bestImprovement = imp; bestUserId = uid; }
            }
          }

          if (bestUserId) {
            const profile = profiles.find((p) => p.user_id === bestUserId);
            if (profile) {
              setMostImproved({
                user_id: bestUserId,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                total_xp: xpMap.get(bestUserId) || 0,
                rank: 0,
                improvement: Math.round(bestImprovement),
              });
            }
          }
        }
      }

      // 4. Check previous week's rewards (Class specific)
      try {
        const range = getPreviousWeekRange();
        let parsedAvatar: any = {};
        if (userProf?.avatar_url) {
          try {
            parsedAvatar = JSON.parse(userProf.avatar_url);
          } catch (e) {}
        }

        const claimedWeeks: string[] = parsedAvatar.leaderboard_claimed_weeks || [];
        if (!claimedWeeks.includes(range.weekKey)) {
          // Fetch previous week's progress for this class
          const { data: prevProgress } = await supabase
            .from("student_progress")
            .select("user_id, xp_earned")
            .gte("completed_at", range.start)
            .lte("completed_at", range.end);

          if (prevProgress && prevProgress.length > 0) {
            const prevXpMap = new Map<string, number>();
            prevProgress.forEach((p) => {
              prevXpMap.set(p.user_id, (prevXpMap.get(p.user_id) || 0) + (p.xp_earned || 0));
            });

            // Get all students in the class
            const { data: classStudents } = await supabase
              .from("profiles")
              .select("user_id, full_name")
              .eq("class_level", userClassLevel);

            if (classStudents && classStudents.length > 0) {
              const prevBoard = classStudents
                .map((student) => ({
                  user_id: student.user_id,
                  full_name: student.full_name,
                  xp: prevXpMap.get(student.user_id) || 0,
                }))
                .filter((student) => student.xp > 0)
                .sort((a, b) => b.xp - a.xp);

              // Find current user's rank in last week's board
              const myIndex = prevBoard.findIndex((s) => s.user_id === user.id);
              if (myIndex >= 0 && myIndex < 3) {
                const rank = myIndex + 1;
                const coinsReward = rank === 1 ? 500 : rank === 2 ? 300 : 150;
                const gemsReward = rank === 1 ? 30 : rank === 2 ? 15 : 10;

                setRewardClaim({
                  rank,
                  coins: coinsReward,
                  gems: gemsReward,
                  weekKey: range.weekKey,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("Error checking leaderboard rewards:", err);
      }

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  // Instant refresh when any student completes a quiz
  useEffect(() => {
    if (!user) return;
    const unsub = onQuizComplete(() => {
      const refresh = async () => {
        const { data: progress } = await supabase.from("student_progress").select("user_id, xp_earned");
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").eq("class_level", classLevel).not("roll_number", "is", null);
        if (!progress || !profiles) return;
        const xpMap = new Map<string, number>();
        for (const p of progress) {
          xpMap.set(p.user_id, (xpMap.get(p.user_id) || 0) + (p.xp_earned || 0));
        }
        const sorted = profiles.map(p => ({
          user_id: p.user_id, full_name: p.full_name || "Student",
          avatar_url: p.avatar_url, total_xp: xpMap.get(p.user_id) || 0,
          rank: 0,
        })).sort((a, b) => b.total_xp - a.total_xp).map((e, i) => ({ ...e, rank: i + 1 }));
        setAllEntries(sorted);
        setEntries(sorted.slice(0, 10));
      };
      refresh();
    });
    return unsub;
  }, [user, classLevel]);

  const currentUserEntry = allEntries.find((e) => e.user_id === user?.id);
  const currentUserInTop10 = entries.some((e) => e.user_id === user?.id);

  // Calculate XP needed for next rank
  const getXpToNextRank = () => {
    if (!currentUserEntry || currentUserEntry.rank <= 1) return null;
    const aboveEntry = allEntries.find((e) => e.rank === currentUserEntry.rank - 1);
    if (!aboveEntry) return null;
    return aboveEntry.total_xp - currentUserEntry.total_xp;
  };

  // Calculate level from XP
  const getLevelFromXP = (xp: number) => {
    return [...LEVELS].reverse().find((l) => xp >= l.xpNeeded) || LEVELS[0];
  };

  const getAvatarDisplay = (avatarUrl: string | null, name: string) => {
    if (!avatarUrl) return name.charAt(0).toUpperCase();
    const trimmed = avatarUrl.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(avatarUrl) as CharacterConfig;
        if (parsed.gender) {
          return <CharacterSVG config={parsed} mini={true} />;
        }
      } catch (e) {
        // Fallback
      }
    }
    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://") || avatarUrl.startsWith("/") || avatarUrl.startsWith("data:image")) {
      return <img src={avatarUrl} alt="" className="w-full h-full object-cover" />;
    }
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings.is_visible) return null;

  const xpToNext = getXpToNextRank();

  return (
    <div className="bg-card rounded-2xl p-5 md:p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-black">{isTamil ? "வகுப்பு தலைவர் பலகை" : "Class Leaderboard"}</h3>
        {settings.mode === "weekly" && (
          <span className="ml-auto text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{isTamil ? "வாராந்திர" : "Weekly"}</span>
        )}
      </div>

      {/* Your Rank Card */}
      {currentUserEntry && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl bg-primary/10 border-2 border-primary"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-black text-primary">
                #{currentUserEntry.rank}
              </div>
              <div>
                <p className="font-bold">{isTamil ? "உங்களது தரம்" : "Your Rank"}</p>
                <p className="text-sm text-muted-foreground">
                  {getLevelTitle(getLevelFromXP(currentUserEntry.total_xp).level, isTamil)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 font-bold">
                <Star className="w-4 h-4 text-yellow-500" />
                {currentUserEntry.total_xp} XP
              </div>
              {xpToNext !== null && xpToNext > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <ChevronUp className="w-3 h-3" />
                  {isTamil ? `${xpToNext} XP தரம் உயரத் தேவை` : `${xpToNext} XP to rank up`}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Most Improved Banner */}
      {settings.show_most_improved && mostImproved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3"
        >
          <div className="text-2xl">🌟</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-green-700 dark:text-green-300">{isTamil ? "இந்த வாரம் மிகவும் முன்னேறியவர்" : "Most Improved This Week"}</p>
            <p className="font-bold text-sm truncate">{mostImproved.full_name}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold text-green-600 dark:text-green-400">+{mostImproved.improvement}%</span>
          </div>
        </motion.div>
      )}

      {/* Weekly Leaderboard Reward Info Card */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-purple-500/10 border border-amber-500/20 text-left">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-black text-amber-400 uppercase tracking-wider">{isTamil ? "வாராந்திர முதல் 3 வகுப்பு வெகுமதிகள்" : "Weekly Top 3 Class Rewards"}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
          {isTamil 
            ? `ஞாயிற்றுக்கிழமை இரவுக்குள் வகுப்பு ${classLevel}-ல் முதல் 3 இடங்களைப் பிடித்து, இந்த பெரிய போனஸைப் பெறுங்கள்!` 
            : `Study hard and rank in the top 3 of class ${classLevel} by Sunday night to claim these massive bonuses!`}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-950/40 border border-yellow-500/20">
            <span className="text-lg">🥇</span>
            <span className="text-[10px] font-black text-foreground mt-1">{isTamil ? "தரம் 1" : "Rank 1"}</span>
            <span className="text-[10px] text-amber-400 font-bold mt-0.5">🪙 500 / 💎 30</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-950/40 border border-gray-400/20">
            <span className="text-lg">🥈</span>
            <span className="text-[10px] font-black text-foreground mt-1">{isTamil ? "தரம் 2" : "Rank 2"}</span>
            <span className="text-[10px] text-gray-300 font-bold mt-0.5">🪙 300 / 💎 15</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-950/40 border border-amber-600/20">
            <span className="text-lg">🥉</span>
            <span className="text-[10px] font-black text-foreground mt-1">{isTamil ? "தரம் 3" : "Rank 3"}</span>
            <span className="text-[10px] text-amber-500 font-bold mt-0.5">🪙 150 / 💎 10</span>
          </div>
        </div>
      </div>

      {/* Top 10 */}
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">{isTamil ? "இன்னும் தரவரிசை இல்லை. இங்கு வர கற்கத் தொடங்குங்கள்!" : "No rankings yet. Start learning to appear here!"}</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const style = rankStyles[entry.rank];
            const isCurrentUser = entry.user_id === user?.id;

            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleRowClick(entry.user_id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:brightness-110 active:scale-[0.99] transition-all ${isCurrentUser
                    ? "bg-primary/10 border-2 border-primary"
                    : style
                      ? `${style.bg} border ${style.border}`
                      : "bg-muted/50"
                  }`}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0">
                  {style ? style.icon : <span className="text-muted-foreground">{entry.rank}</span>}
                </div>
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden">
                  {getAvatarDisplay(entry.avatar_url, entry.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">
                    {entry.full_name}
                    {isCurrentUser && <span className="text-primary ml-1">{isTamil ? "(நீங்கள்)" : "(You)"}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold shrink-0">
                  <Star className="w-3.5 h-3.5 text-yellow-500" />
                  {entry.total_xp} XP
                </div>
              </motion.div>
            );
          })}

          {/* Show current user below top 10 if not in it */}
          {currentUserEntry && !currentUserInTop10 && (
            <>
              <div className="text-center text-muted-foreground text-xs py-1">···</div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => handleRowClick(currentUserEntry.user_id)}
                className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border-2 border-primary cursor-pointer hover:brightness-110 active:scale-[0.99] transition-all"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 text-muted-foreground">
                  {currentUserEntry.rank}
                </div>
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden">
                  {getAvatarDisplay(currentUserEntry.avatar_url, currentUserEntry.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">
                    {currentUserEntry.full_name} <span className="text-primary">{isTamil ? "(நீங்கள்)" : "(You)"}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold shrink-0">
                  <Star className="w-3.5 h-3.5 text-yellow-500" />
                  {currentUserEntry.total_xp} XP
                </div>
              </motion.div>
            </>
          )}
        </div>
      )}
      {selectedStudentId && (
        <PublicProfileDialog 
          userId={selectedStudentId} 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
        />
      )}

      {/* ══ POPUP: CLAIM WEEKLY TOPPER REWARD ══ */}
      <AnimatePresence>
        {rewardClaim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 text-center max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              
              <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-500/30 flex items-center justify-center text-4xl mx-auto mb-4 animate-bounce">
                👑
              </div>

              <h3 className="text-xl font-black text-white mb-1 uppercase tracking-wide">
                {isTamil ? "வகுப்பில் முதலிடம் பெற்றதற்கான வாராந்திர போனஸ்!" : "CLASS TOPPER WEEKLY BONUS!"}
              </h3>
              
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-3">
                {isTamil ? `வகுப்பு ${classLevel}-ல் தரம் #${rewardClaim.rank}` : `RANK #${rewardClaim.rank} in Class ${classLevel}`}
              </p>

              <p className="text-xs text-slate-300 leading-normal mb-5">
                {isTamil 
                  ? "அற்அற்புதமான வேலை! கடந்த வாரம் உங்கள் வகுப்புத் தலைவர் பலகையில் முதல் 3 இடங்களுக்குள் முடித்தீர்கள். கூடுதல் வெகுமதிகளை அனுபவிக்கவும்!" 
                  : "Awesome work! You finished in the Top 3 of your class leaderboard last week. Enjoy your extra rewards!"}
              </p>

              <div className="flex justify-center gap-4 mb-6">
                <div className="flex items-center gap-1.5 bg-slate-950/60 px-3.5 py-2 rounded-2xl border border-amber-500/25">
                  <span className="text-xl">🪙</span>
                  <span className="font-black text-amber-400 text-sm">+{rewardClaim.coins}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/60 px-3.5 py-2 rounded-2xl border border-purple-500/25">
                  <span className="text-xl">💎</span>
                  <span className="font-black text-purple-400 text-sm">+{rewardClaim.gems}</span>
                </div>
              </div>

              <button
                onClick={handleClaimReward}
                disabled={claiming}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 font-black text-slate-950 rounded-xl h-11 text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                {claiming ? (isTamil ? "பெறப்படுகிறது..." : "Claiming...") : (isTamil ? "வெகுமதிகளைப் பெறுங்கள்! 🎁" : "Claim Rewards! 🎁")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedLeaderboard;

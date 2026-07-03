import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Medal, Award, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { CharacterSVG, type CharacterConfig } from "./CharacterCreator";

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

const rankStyles: Record<number, { bg: string; icon: React.ReactNode; border: string }> = {
  1: { bg: "bg-yellow-100 dark:bg-yellow-900/30", icon: <Trophy className="w-5 h-5 text-yellow-500" />, border: "border-yellow-400" },
  2: { bg: "bg-gray-100 dark:bg-gray-800/40", icon: <Medal className="w-5 h-5 text-gray-400" />, border: "border-gray-300" },
  3: { bg: "bg-orange-100 dark:bg-orange-900/30", icon: <Award className="w-5 h-5 text-orange-500" />, border: "border-orange-400" },
};

const Leaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [mostImproved, setMostImproved] = useState<LeaderboardEntry | null>(null);
  const [settings, setSettings] = useState<LeaderboardSettings>({ is_visible: true, mode: "all_time", show_most_improved: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      // Fetch settings
      const { data: settingsData } = await supabase
        .from("leaderboard_settings")
        .select("is_visible, mode, show_most_improved")
        .limit(1)
        .maybeSingle();

      if (settingsData) {
        setSettings(settingsData as LeaderboardSettings);
        if (!settingsData.is_visible) {
          setLoading(false);
          return;
        }
      }

      const isWeekly = settingsData?.mode === "weekly";
      const now = new Date();
      // Monday of current week
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);

      // Get progress (filtered by week if weekly mode)
      let query = supabase.from("student_progress").select("user_id, xp_earned, score, completed_at");
      if (isWeekly) {
        query = query.gte("completed_at", monday.toISOString());
      }
      const { data: progressData } = await query;

      if (!progressData || progressData.length === 0) {
        setLoading(false);
        return;
      }

      // Aggregate XP per user
      const xpMap = new Map<string, number>();
      progressData.forEach((p) => {
        xpMap.set(p.user_id, (xpMap.get(p.user_id) || 0) + p.xp_earned);
      });

      const userIds = Array.from(xpMap.keys());
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      if (!profiles) { setLoading(false); return; }

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

      setEntries(board.slice(0, 20));

      // Most improved calculation
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

          let bestUserId = "";
          let bestImprovement = 0;
          for (const [uid, { recent, older }] of improvementMap) {
            if (recent.length > 0 && older.length > 0) {
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

      setLoading(false);
    };
    fetchAll();
  }, []);

  const currentUserRank = entries.find((e) => e.user_id === user?.id);

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

  return (
    <div className="bg-card rounded-2xl p-5 md:p-6 shadow-card">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-black">Leaderboard</h3>
        {settings.mode === "weekly" && (
          <span className="ml-auto text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Weekly
          </span>
        )}
      </div>

      {/* Most Improved Banner */}
      {settings.show_most_improved && mostImproved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3"
        >
          <div className="text-2xl">🌟</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-green-700 dark:text-green-300">Most Improved This Week</p>
            <p className="font-bold text-sm truncate">{mostImproved.full_name}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold text-green-600 dark:text-green-400">+{mostImproved.improvement}%</span>
          </div>
        </motion.div>
      )}

      {entries.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">No rankings yet. Start learning to appear here!</p>
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
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isCurrentUser
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
                    {isCurrentUser && <span className="text-primary ml-1">(You)</span>}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-sm font-bold shrink-0">
                  <Star className="w-3.5 h-3.5 text-yellow-500" />
                  {entry.total_xp} XP
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {currentUserRank && currentUserRank.rank > 3 && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          You're ranked <span className="font-bold text-primary">#{currentUserRank.rank}</span> — keep learning to climb! 🚀
        </p>
      )}
    </div>
  );
};

export default Leaderboard;

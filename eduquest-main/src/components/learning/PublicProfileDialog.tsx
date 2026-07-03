import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Flame, Target, Clock, Sparkles, Shield, X, Award, Medal, BookOpen, Sparkle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminClient } from "@/integrations/supabase/adminClient";
import { ALL_COSMETICS, RARITY_CONFIG, type Cosmetic } from "@/data/cosmetics";
import { CharacterSVG, type CharacterConfig } from "@/components/learning/CharacterCreator";
import { getRank, getNextRank, ALL_BADGES, type BadgeStats } from "@/lib/retentionEngine";
import { getStableUuid } from "@/lib/utils";


interface PublicProfileDialogProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CHARACTER_CONFIG: CharacterConfig = {
  gender: "male",
  style: "anime",
  skinTone: "#FCE3B6",
  hairstyle: "classic",
  hairColor: "#1A1A1A",
  eyes: "anime",
  expression: "confident",
};

const LOBBY_THEME_CLASSES: Record<string, { bg: string; particlesColor: string }> = {
  "bg-school": { bg: "from-blue-900/80 to-slate-900", particlesColor: "#60A5FA" },
  "bg-library": { bg: "from-amber-950/80 to-slate-950", particlesColor: "#FBBF24" },
  "bg-space": { bg: "from-purple-950 via-slate-950 to-indigo-950", particlesColor: "#C084FC" },
  "bg-jungle": { bg: "from-emerald-950 to-stone-950", particlesColor: "#34D399" },
  "bg-cyberpunk": { bg: "from-fuchsia-950 via-slate-950 to-cyan-950/60", particlesColor: "#F472B6" },
  "bg-castle": { bg: "from-indigo-950 via-slate-900 to-slate-950", particlesColor: "#F3F4F6" },
};

export default function PublicProfileDialog({ userId, isOpen, onClose }: PublicProfileDialogProps) {
  const [profile, setProfile] = useState<any>(null);
  const [characterConfig, setCharacterConfig] = useState<CharacterConfig>(DEFAULT_CHARACTER_CONFIG);
  const [equippedPet, setEquippedPet] = useState<string | undefined>();
  const [equippedAura, setEquippedAura] = useState<string | undefined>();
  const [equippedBg, setEquippedBg] = useState<string>("bg-school");
  const [fireCount, setFireCount] = useState(0);
  const [hasSentFire, setHasSentFire] = useState(false);
  
  // Learning stats
  const [totalXP, setTotalXP] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [quizzesCompleted, setQuizzesCompleted] = useState(0);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [perfectQuizzes, setPerfectQuizzes] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  
  // Badges calculation
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchStudentData = async () => {
      setLoading(true);
      try {
        const client = getAdminClient(); // Bypass RLS to show student profiles on leaderboard
        
        // 1. Fetch profile
        const { data: profileData } = await client
          .from("profiles")
          .select("full_name, roll_number, class_level, avatar_url")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);
          if (profileData.avatar_url) {
            try {
              const parsed = JSON.parse(profileData.avatar_url);
              if (parsed.gender) {
                setCharacterConfig({ ...DEFAULT_CHARACTER_CONFIG, ...parsed });
              }
            } catch (e) {
              // Not a JSON string
            }
          }
        }

        // 2. Fetch progress metrics
        const { data: progress } = await client
          .from("student_progress")
          .select("xp_earned, lesson_id, quiz_id, status, score, completed_at")
          .eq("user_id", userId);

        let xp = 0;
        let quizzesCount = 0;
        let lessonsCount = 0;
        let perfectCount = 0;
        let totalScoreSum = 0;
        let scoreCount = 0;

        if (progress) {
          xp = progress.reduce((sum, p) => sum + (p.xp_earned || 0), 0);
          
          progress.forEach((p) => {
            if (p.status === "completed") {
              if (p.lesson_id) lessonsCount++;
              if (p.quiz_id) {
                quizzesCount++;
                if (p.score !== null && p.score !== undefined) {
                  totalScoreSum += p.score;
                  scoreCount++;
                  if (p.score === 100) perfectCount++;
                }
              }
            }
          });
        }

        setTotalXP(xp);
        setQuizzesCompleted(quizzesCount);
        setLessonsCompleted(lessonsCount);
        setPerfectQuizzes(perfectCount);
        setAvgScore(scoreCount > 0 ? Math.round(totalScoreSum / scoreCount) : 0);

        // Calculate Study Streak (IST timezone logic)
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

        let streak = 0;
        if (dates.length > 0 && (dates[0] === nowIST || dates[0] === yesterdayIST)) {
          streak = 1;
          for (let i = 1; i < dates.length; i++) {
            const prev = new Date(dates[i - 1]).getTime();
            const curr = new Date(dates[i]).getTime();
            const diff = prev - curr;
            if (diff <= 86400000 * 1.5) streak++;
            else break;
          }
        }
        setStreakDays(streak);

        // 3. Fetch equipped items
        const { data: equipped } = await client
          .from("student_avatar_items")
          .select("item_id")
          .eq("user_id", userId)
          .eq("is_equipped", true);

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
          setCharacterConfig(prev => {
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

        // 4. Calculate earned badges dynamically
        const badgeStats: BadgeStats = {
          totalXP: xp,
          lessonsCompleted: lessonsCount,
          quizzesCompleted: quizzesCount,
          perfectQuizzes: perfectCount,
          streakDays: streak,
          avgScore: scoreCount > 0 ? Math.round(totalScoreSum / scoreCount) : 0,
          adventureLevels: 0, // Fallback if no adventure table
          adventureStars: 0,
          loginDays: streak || 1, // Fallback
        };

        const earned = ALL_BADGES.filter((b) => b.condition(badgeStats));
        setUnlockedBadges(earned);

      } catch (err) {
        console.error("Error fetching public profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const rank = getRank(totalXP);
  const nextRank = getNextRank(totalXP);
  
  // Lobby Background Styles
  const activeLobby = LOBBY_THEME_CLASSES[equippedBg] || LOBBY_THEME_CLASSES["bg-school"];

  // Custom border glow based on Rank
  const rankGlowBorder = rank.id === "platinum" 
    ? "border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]" 
    : rank.id === "gold"
    ? "border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]"
    : rank.id === "silver"
    ? "border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.4)]"
    : "border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Card Content container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className={`relative max-w-4xl w-full max-h-[95vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-2 ${rankGlowBorder} rounded-3xl z-10 grid grid-cols-1 md:grid-cols-12`}
        >
          {/* Close button */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-30 bg-black/40 hover:bg-black/60 border border-white/20 text-white rounded-full p-2 hover:scale-110 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {loading ? (
            <div className="col-span-12 h-[500px] flex flex-col items-center justify-center text-foreground">
              <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-bold text-sm tracking-wider text-muted-foreground uppercase">Synchronizing profiles...</p>
            </div>
          ) : (
            <>
              {/* LEFT COLUMN: HERO SHOWCASE (5 columns) */}
              <div className={`col-span-12 md:col-span-5 relative bg-gradient-to-b ${activeLobby.bg} p-4 md:p-6 flex flex-col justify-between items-center border-b md:border-b-0 md:border-r border-border/20`}>
                
                {/* Cyber Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                {/* Ambient dynamic particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: activeLobby.particlesColor,
                        left: `${15 + i * 15}%`,
                        top: `${20 + (i % 2) * 30}%`,
                      }}
                      animate={{
                        y: [-20, 20],
                        opacity: [0.2, 0.8, 0.2],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{
                        duration: 3 + i,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.4
                      }}
                    />
                  ))}
                </div>

                {/* Top header badge: lobby theme */}
                <div className="relative z-10 self-start bg-black/40 border border-white/10 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-cyan-400">
                  Lobby: {equippedBg.replace("bg-", "")}
                </div>

                {/* Character Render Container */}
                <div className="w-full flex-1 flex items-center justify-center py-4 relative z-10 group">
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <CharacterSVG 
                      config={characterConfig} 
                      pet={equippedPet} 
                      aura={equippedAura} 
                    />
                  </motion.div>
                </div>

                {/* Interactive Social Button */}
                <div className="relative z-10 mb-4 flex flex-col items-center">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (!hasSentFire) {
                        setFireCount(prev => prev + 1);
                        setHasSentFire(true);
                      }
                    }}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full border shadow-lg transition-all ${hasSentFire ? "bg-orange-500/20 border-orange-500/50 text-orange-400" : "bg-card/40 hover:bg-card/80 border-border/50 hover:border-orange-500/50 text-muted-foreground hover:text-orange-400 backdrop-blur-md"}`}
                  >
                    <Flame className={`w-5 h-5 ${hasSentFire ? "fill-orange-400 animate-pulse" : ""}`} />
                    <span className="font-black text-sm">{fireCount > 0 ? `${fireCount} Fires` : "Send Fire!"}</span>
                  </motion.button>
                </div>

                {/* Bottom Row inside left panel */}
                <div className="w-full text-center relative z-10 bg-black/40 border border-white/5 backdrop-blur-md rounded-2xl p-3">
                  <div className="text-xs font-semibold text-slate-300">CURRENT RANK</div>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-2xl">{rank.emoji}</span>
                    <span className="font-black text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent uppercase tracking-wider">
                      {rank.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: METRICS & BADGES (7 columns) */}
              <div className="col-span-12 md:col-span-7 p-4 sm:p-6 md:p-8 flex flex-col justify-between bg-transparent text-foreground">
                
                {/* Header Information */}
                <div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
                    <div>
                      <h2 className="text-xl md:text-3xl font-black bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-transparent uppercase tracking-wider drop-shadow-md">
                        {profile?.full_name || "Hero Student"}
                      </h2>
                      <p className="text-[10px] sm:text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                        <span>Class {profile?.class_level || 7}</span>
                        {profile?.roll_number && (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-border" />
                            <span>Roll #{profile.roll_number}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 px-4 py-1.5 rounded-2xl flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                      <span className="font-black text-sm text-cyan-600 dark:text-cyan-300">{totalXP} XP</span>
                    </div>
                  </div>

                  {/* Rank progression */}
                  <div className="bg-card/60 border border-border/40 rounded-2xl p-4 mb-6">
                    <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-1.5">
                      <span className="uppercase">Rank Progress</span>
                      {nextRank ? (
                        <span>{nextRank.xpNeeded} XP to {nextRank.rank.emoji} {nextRank.rank.name}</span>
                      ) : (
                        <span className="text-amber-500 dark:text-amber-400 font-black">MAX RANK REACHED 🏆</span>
                      )}
                    </div>
                    <div className="h-3 bg-muted/80 rounded-full overflow-hidden border border-border/30 relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${nextRank 
                            ? ((totalXP - rank.minXP) / (nextRank.rank.minXP - rank.minXP)) * 100 
                            : 100}%` 
                        }}
                        className={`h-full rounded-full bg-gradient-to-r ${rank.gradient}`}
                      />
                    </div>
                  </div>

                  {/* Learning Stats Grid */}
                  <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase mb-3">Lobby Statistics</h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
                    
                    {/* Stat 1: Streak */}
                    <div className="bg-card/40 border border-border/50 hover:bg-card/60 hover:border-orange-500/30 p-2 sm:p-3 rounded-2xl flex items-center gap-2 sm:gap-3 transition-all duration-300">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                        <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-orange-500/10 animate-bounce" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wide truncate">Study Streak</div>
                        <div className="font-black text-xs sm:text-sm text-foreground truncate">{streakDays} Days</div>
                      </div>
                    </div>

                    {/* Stat 2: Accuracy */}
                    <div className="bg-card/40 border border-border/50 hover:bg-card/60 hover:border-emerald-500/30 p-2 sm:p-3 rounded-2xl flex items-center gap-2 sm:gap-3 transition-all duration-300">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wide truncate">Avg Accuracy</div>
                        <div className="font-black text-xs sm:text-sm text-foreground truncate">{avgScore}%</div>
                      </div>
                    </div>

                    {/* Stat 3: Quizzes */}
                    <div className="bg-card/40 border border-border/50 hover:bg-card/60 hover:border-indigo-500/30 p-2 sm:p-3 rounded-2xl flex items-center gap-2 sm:gap-3 transition-all duration-300">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-bold">
                        <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wide truncate">Quizzes Beat</div>
                        <div className="font-black text-xs sm:text-sm text-foreground truncate">{quizzesCompleted} Complete</div>
                      </div>
                    </div>

                    {/* Stat 4: Perfects */}
                    <div className="bg-card/40 border border-border/50 hover:bg-card/60 hover:border-yellow-500/30 p-2 sm:p-3 rounded-2xl flex items-center gap-2 sm:gap-3 transition-all duration-300">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-500/10" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wide truncate">Perfect Scores</div>
                        <div className="font-black text-xs sm:text-sm text-foreground truncate">{perfectQuizzes} Aced <span className="text-[10px] sm:text-xs">💯</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badges showcase section */}
                <div>
                  <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase mb-3 flex items-center justify-between">
                    <span>Unlocked Badges</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full text-[9px] lowercase">
                      {unlockedBadges.length} earned
                    </span>
                  </h3>
                  
                  {unlockedBadges.length === 0 ? (
                    <div className="bg-card/40 border border-border/50 rounded-2xl p-4 text-center text-xs text-muted-foreground/60 font-semibold">
                      This student is building their badge collection! 🚀
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2.5">
                      {unlockedBadges.slice(0, 4).map((badge) => (
                        <motion.div
                          key={badge.id}
                          whileHover={{ y: -3, scale: 1.05 }}
                          className="bg-card/50 border border-border/40 hover:bg-card/85 hover:border-cyan-500/30 p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 relative group cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-white/5 border border-border/50 flex items-center justify-center text-xl shadow-inner group-hover:bg-cyan-500/10 group-hover:border-cyan-400/30 transition-colors">
                            {badge.icon}
                          </div>
                          <span className="text-[9px] font-black text-center text-foreground truncate w-full">
                            {badge.name}
                          </span>
                          
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-popover text-popover-foreground border border-border/60 rounded-xl p-2 text-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-20 font-semibold">
                            {badge.description}
                          </div>
                        </motion.div>
                      ))}
                      
                      {/* Empty slots placeholders if they have < 4 badges */}
                      {[...Array(Math.max(0, 4 - unlockedBadges.length))].map((_, i) => (
                        <div 
                          key={i}
                          className="bg-card/25 border border-dashed border-border/40 p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 opacity-40"
                        >
                          <div className="w-10 h-10 rounded-full border border-dashed border-border/50 flex items-center justify-center text-muted-foreground">
                            🔒
                          </div>
                          <span className="text-[9px] font-black text-muted-foreground">Locked</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

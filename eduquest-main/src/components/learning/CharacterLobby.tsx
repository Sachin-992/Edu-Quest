import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Star, Flame, Map, Settings, Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getStreakMultiplier } from "@/lib/retentionEngine";
import RankTierBadge from "./RankTierBadge";
import { ALL_COSMETICS, type Cosmetic } from "@/data/cosmetics";

/* ─── Gamification Levels ─────────────────────────────────────────── */
const LEVELS = [
  { level: 1, xpNeeded: 0, title: "Beginner", emoji: "🌱" },
  { level: 2, xpNeeded: 50, title: "Explorer", emoji: "🧭" },
  { level: 3, xpNeeded: 150, title: "Learner", emoji: "📖" },
  { level: 4, xpNeeded: 300, title: "Scholar", emoji: "🎓" },
  { level: 5, xpNeeded: 500, title: "Master", emoji: "🏆" },
  { level: 6, xpNeeded: 800, title: "Champion", emoji: "👑" },
  { level: 7, xpNeeded: 1200, title: "Legend", emoji: "⭐" },
  { level: 8, xpNeeded: 2000, title: "Mythic Master", emoji: "🌌" },
];

/* ─── Emotional Quotes / AI System ────────────────────────────── */
const getEmotionalQuote = (streak: number, timeOfDay: string) => {
  if (streak > 5) return "You're on fire! 🔥 Keep it up!";
  if (streak > 0) return "Let's build that streak today! 🚀";
  if (timeOfDay === "morning") return "Good morning! Ready to level up? 🌅";
  if (timeOfDay === "evening") return "Evening! One last quiz? 🌙";
  return "Let's learn and grow! 💪";
};

interface CharacterLobbyProps {
  onShopClick: () => void;
}

export default function CharacterLobby({ onShopClick }: CharacterLobbyProps) {
  const { user } = useAuth();
  const [totalXP, setTotalXP] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [coins, setCoins] = useState(0);
  const [equippedItems, setEquippedItems] = useState<Cosmetic[]>([]);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      setLoading(true);
      const [progressRes, transactionsRes, avatarRes] = await Promise.all([
        supabase.from("student_progress").select("xp_earned, completed_at").eq("user_id", user.id),
        supabase.from("coin_transactions").select("amount").eq("user_id", user.id),
        supabase.from("student_avatar_items").select("item_id, is_equipped").eq("user_id", user.id).eq("is_equipped", true)
      ]);

      const xp = progressRes.data?.reduce((sum, p) => sum + (p.xp_earned || 0), 0) || 0;
      const spent = transactionsRes.data?.reduce((sum, t) => sum + t.amount, 0) || 0;
      setTotalXP(xp);
      setCoins(xp + spent);

      // Streak calculation
      const dates = progressRes.data?.map(p => p.completed_at?.split('T')[0]).filter(Boolean) || [];
      const uniqueDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
      // Simplified streak calc for UI purposes
      setStreakDays(uniqueDates.length > 0 ? 1 : 0); // Real calc in backend usually

      if (avatarRes.data) {
        const equipped = avatarRes.data.map(d => ALL_COSMETICS.find(c => c.id === d.item_id)).filter(Boolean) as Cosmetic[];
        setEquippedItems(equipped);
      }

      const h = new Date().getHours();
      const timeOfDay = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
      setQuote(getEmotionalQuote(uniqueDates.length > 0 ? 1 : 0, timeOfDay));

      setLoading(false);
    };
    fetchStats();
  }, [user]);

  const currentLevel = [...LEVELS].reverse().find(l => totalXP >= l.xpNeeded) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.xpNeeded > totalXP);
  const xpProgress = nextLevel ? ((totalXP - currentLevel.xpNeeded) / (nextLevel.xpNeeded - currentLevel.xpNeeded)) * 100 : 100;
  
  const bgItem = equippedItems.find(i => i.category === 'background');
  const petItem = equippedItems.find(i => i.category === 'pet');
  const auraItem = equippedItems.find(i => i.category === 'aura');
  const avatarVisuals = equippedItems.filter(i => !['background', 'pet', 'aura', 'emote'].includes(i.category));

  if (loading) return <div className="h-96 bg-muted/20 animate-pulse rounded-3xl" />;

  // Default theme if no bg equipped
  const defaultBgClass = "bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20";
  
  return (
    <div className={`relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 ${!bgItem ? defaultBgClass : ''}`} style={{ minHeight: '480px' }}>
      
      {/* ── Background Theme ── */}
      {bgItem && (
        <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle, transparent 20%, #000 120%)' }}>
          <div className="w-full h-full text-9xl flex items-center justify-center opacity-10">{bgItem.icon}</div>
        </div>
      )}

      {/* Floating Particles/Aura */}
      {auraItem && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           {[...Array(15)].map((_, i) => (
             <motion.div key={i} className="absolute text-2xl opacity-40"
                style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                animate={{ y: [-20, 20], opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}>
               {auraItem.icon}
             </motion.div>
           ))}
        </div>
      )}

      <div className="relative z-10 p-6 md:p-8 flex flex-col h-full justify-between">
        
        {/* ── Top Bar: Coins & Streak ── */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <motion.div className="flex items-center gap-2 bg-foreground/10 backdrop-blur-md border border-foreground/10 px-4 py-2 rounded-full"
              whileHover={{ scale: 1.05 }}>
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="font-black text-yellow-600 dark:text-yellow-300 text-lg">{coins.toLocaleString()}</span>
            </motion.div>
            
            <motion.div className="flex items-center gap-2 bg-foreground/10 backdrop-blur-md border border-foreground/10 px-4 py-2 rounded-full"
              whileHover={{ scale: 1.05 }}>
              <Flame className={`w-5 h-5 ${streakDays > 0 ? "text-orange-500" : "text-foreground/40"}`} />
              <span className={`font-black text-lg ${streakDays > 0 ? "text-orange-500 dark:text-orange-400" : "text-foreground/40"}`}>{streakDays}</span>
            </motion.div>
          </div>

          <Button onClick={onShopClick} size="lg" className="rounded-2xl font-black bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/30 group">
            <Map className="w-5 h-5 mr-2 group-hover:animate-bounce" />
            Character Shop
          </Button>
        </div>

        {/* ── Center: Avatar & Pet ── */}
        <div className="flex-1 flex items-center justify-center relative mt-8 mb-12">
          
          {/* Speech Bubble (Emotional AI) */}
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute -top-12 md:-top-16 bg-card text-foreground px-4 py-3 rounded-2xl shadow-xl border border-border/50 max-w-xs text-center z-20">
            <p className="text-sm font-bold">{quote}</p>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card rotate-45 border-r border-b border-border/50" />
          </motion.div>

          {/* Main Avatar Character */}
          <motion.div 
            animate={{ y: [-5, 5, -5] }} 
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            {/* Base Character (Evolves with Level) */}
            <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center bg-gradient-to-br from-white/20 to-black/20 backdrop-blur-sm border-4 ${currentLevel.level >= 5 ? 'border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)]' : 'border-white/30 shadow-2xl'}`}>
              <span className="text-7xl md:text-8xl filter drop-shadow-xl z-10">
                {avatarVisuals.length > 0 ? avatarVisuals[0].icon : currentLevel.emoji}
              </span>
            </div>

            {/* Equipped Accessories/Outfits around the base */}
            {avatarVisuals.slice(1, 4).map((item, idx) => (
               <motion.div key={item.id} 
                  className={`absolute bg-white/90 dark:bg-slate-900/90 rounded-full flex items-center justify-center border-2 border-purple-500/50 shadow-xl z-20 w-12 h-12 md:w-16 md:h-16 text-2xl md:text-3xl`}
                  style={{
                    bottom: idx === 0 ? '-10%' : idx === 1 ? '10%' : '10%',
                    left: idx === 0 ? '35%' : idx === 1 ? '-10%' : 'auto',
                    right: idx === 2 ? '-10%' : 'auto'
                  }}
                  animate={{ rotate: [-5, 5, -5] }}
                  transition={{ duration: 3 + idx, repeat: Infinity }}
               >
                 {item.icon}
               </motion.div>
            ))}
          </motion.div>

          {/* Floating Pet Companion */}
          {petItem && (
            <motion.div 
              className="absolute right-[5%] md:right-[20%] top-[30%] w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-full border-2 border-white/30 flex items-center justify-center shadow-lg"
              animate={{ y: [-10, 10, -10], x: [-5, 5, -5], rotate: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-4xl filter drop-shadow-md">{petItem.icon}</span>
            </motion.div>
          )}

        </div>

        {/* ── Bottom Bar: XP Progression ── */}
        <div className="bg-card/80 backdrop-blur-xl border border-border/40 p-5 rounded-3xl w-full">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg text-2xl">
                  {currentLevel.emoji}
                </div>
                <div>
                   <p className="text-xs text-foreground/60 font-bold uppercase tracking-wider">Level {currentLevel.level}</p>
                   <p className="text-lg font-black text-foreground">{currentLevel.title}</p>
                 </div>
             </div>
             <RankTierBadge totalXP={totalXP} size="sm" />
          </div>

          <div className="relative h-4 bg-muted/60 rounded-full overflow-hidden shadow-inner">
             <motion.div 
               initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ duration: 1, ease: "easeOut" }}
               className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-orange-500"
             >
               <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/50" />
             </motion.div>
          </div>
          
          <div className="flex justify-between mt-2 text-xs font-bold text-foreground/50">
            <span>{totalXP} XP</span>
            {nextLevel ? <span>{nextLevel.xpNeeded} XP</span> : <span>MAX</span>}
          </div>
        </div>

      </div>
    </div>
  );
}

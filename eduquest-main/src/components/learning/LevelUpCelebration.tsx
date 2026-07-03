import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Crown, Sparkles, ChevronRight, Shield, Gem, Trophy } from 'lucide-react';
import { getRank, type RankTier } from '@/lib/retentionEngine';
import ConfettiCelebration from './ConfettiCelebration';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguageStore } from '@/store/useLanguageStore';

const RANK_REWARDS: Record<string, { coins: number; gems: number }> = {
  silver: { coins: 150, gems: 10 },
  gold: { coins: 350, gems: 25 },
  platinum: { coins: 750, gems: 50 },
};


/* ═══════════════════════════════════════════════════
   Level Up Celebration — full-screen rank-up modal
   ═══════════════════════════════════════════════════ */

interface LevelUpCelebrationProps {
  totalXP: number;
  onDismiss: () => void;
}

interface PerkInfo {
  icon: typeof Star;
  text: string;
}

const RANK_PERKS: Record<string, PerkInfo[]> = {
  silver: [
    { icon: Shield, text: 'Unlock Silver frame' },
    { icon: Star, text: 'Weekly mystery box' },
  ],
  gold: [
    { icon: Crown, text: 'Unlock Gold frame' },
    { icon: Sparkles, text: 'Double XP weekends' },
    { icon: Gem, text: 'Exclusive avatar items' },
  ],
  platinum: [
    { icon: Trophy, text: 'Unlock Diamond frame' },
    { icon: Sparkles, text: 'Triple XP events' },
    { icon: Crown, text: 'Legendary shop access' },
    { icon: Star, text: 'Custom title colors' },
  ],
};

const RANK_ORDER = ['bronze', 'silver', 'gold', 'platinum'] as const;

const BADGE_COLORS: Record<string, { bg: string; ring: string; glow: string; text: string }> = {
  bronze: {
    bg: 'from-orange-400 via-orange-200 to-orange-500',
    ring: 'ring-orange-400/60',
    glow: 'bg-orange-400/30',
    text: 'from-orange-300 to-orange-500',
  },
  silver: {
    bg: 'from-gray-300 via-gray-100 to-gray-400',
    ring: 'ring-gray-300/60',
    glow: 'bg-gray-300/30',
    text: 'from-gray-300 to-gray-500',
  },
  gold: {
    bg: 'from-amber-300 via-yellow-200 to-amber-400',
    ring: 'ring-amber-400/60',
    glow: 'bg-amber-400/30',
    text: 'from-amber-300 to-yellow-500',
  },
  platinum: {
    bg: 'from-slate-300 via-white to-slate-400',
    ring: 'ring-slate-300/60',
    glow: 'bg-slate-300/30',
    text: 'from-slate-200 to-slate-500',
  },
};

// Generate floating particles data
function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 3 + Math.random() * 5,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
  }));
}

const LevelUpCelebration = ({ totalXP, onDismiss }: LevelUpCelebrationProps) => {
  const { user } = useAuth();
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

  const getRankPerks = (rankId: string, isTamil: boolean): PerkInfo[] => {
    const perksMap: Record<string, { icon: typeof Star; text: string; text_ta: string }[]> = {
      silver: [
        { icon: Shield, text: 'Unlock Silver frame', text_ta: 'வெள்ளி சட்டத்தை அன்லாக் செய்க' },
        { icon: Star, text: 'Weekly mystery box', text_ta: 'வாராந்திர மர்மப் பெட்டி' },
      ],
      gold: [
        { icon: Crown, text: 'Unlock Gold frame', text_ta: 'தங்க சட்டத்தை அன்லாக் செய்க' },
        { icon: Sparkles, text: 'Double XP weekends', text_ta: 'இரட்டிப்பு XP வார இறுதி நாட்கள்' },
        { icon: Gem, text: 'Exclusive avatar items', text_ta: 'பிரத்யேக அவதார் பொருட்கள்' },
      ],
      platinum: [
        { icon: Trophy, text: 'Unlock Diamond frame', text_ta: 'வைர சட்டத்தை அன்லாக் செய்க' },
        { icon: Sparkles, text: 'Triple XP events', text_ta: 'முப்புரி XP நிகழ்வுகள்' },
        { icon: Crown, text: 'Legendary shop access', text_ta: 'புகழ்பெற்ற கடை அணுகல்' },
        { icon: Star, text: 'Custom title colors', text_ta: 'தனிப்பயன் தலைப்பு வண்ணங்கள்' },
      ],
    };
    const list = perksMap[rankId] || [];
    return list.map(item => ({
      icon: item.icon,
      text: isTamil ? item.text_ta : item.text
    }));
  };

  const [showCelebration, setShowCelebration] = useState(false);
  const [oldRank, setOldRank] = useState<RankTier | null>(null);
  const [newRank, setNewRank] = useState<RankTier | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [particles] = useState(() => generateParticles(20));
  const [rewardedCoins, setRewardedCoins] = useState(0);
  const [rewardedGems, setRewardedGems] = useState(0);

  useEffect(() => {
    if (!user) return;

    const checkAndAwardRankRewards = async () => {
      const currentRank = getRank(totalXP);
      const lastSeenRank = localStorage.getItem('eq_last_seen_rank') || 'bronze';

      const currentIdx = RANK_ORDER.indexOf(currentRank.id);
      const lastSeenIdx = RANK_ORDER.indexOf(lastSeenRank as typeof RANK_ORDER[number]);

      if (currentIdx > lastSeenIdx) {
        const previousRank = getRank(
          currentRank.id === 'silver' ? 0
            : currentRank.id === 'gold' ? 149
              : currentRank.id === 'platinum' ? 499
                : 0
        );
        setOldRank(previousRank);
        setNewRank(currentRank);
        setShowCelebration(true);

        // Trigger confetti slightly after modal appears
        setTimeout(() => setShowConfetti(true), 400);

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

          const rewardedRanks: string[] = parsedAvatar.rewarded_ranks || [];
          let coinsToAward = 0;
          let gemsToAward = 0;
          const newRewardedList = [...rewardedRanks];

          const checkRanks = ['silver', 'gold', 'platinum'] as const;
          for (const rankId of checkRanks) {
            const rankTier = getRank(rankId === 'silver' ? 150 : rankId === 'gold' ? 500 : 1200);
            if (totalXP >= rankTier.minXP && !newRewardedList.includes(rankId)) {
              const reward = RANK_REWARDS[rankId];
              if (reward) {
                coinsToAward += reward.coins;
                gemsToAward += reward.gems;
              }
              newRewardedList.push(rankId);
            }
          }

          if (coinsToAward > 0 || gemsToAward > 0) {
            setRewardedCoins(coinsToAward);
            setRewardedGems(gemsToAward);

            if (coinsToAward > 0) {
              await supabase.from("coin_transactions").insert({
                user_id: user.id,
                amount: coinsToAward,
                description: isTamil 
                   ? `தர உயர்வு வெகுமதி: ${getRankName(currentRank.id, true)} தரத்தை அடைந்துள்ளீர்கள்! 🏅`
                   : `Rank Up Reward: Reached ${currentRank.name}! 🏅`,
              });
            }

            parsedAvatar.rewarded_ranks = newRewardedList;
            if (gemsToAward > 0) {
              parsedAvatar.gems_awarded = (parsedAvatar.gems_awarded || 0) + gemsToAward;
            }

            await supabase
              .from("profiles")
              .update({ avatar_url: JSON.stringify(parsedAvatar) })
              .eq("user_id", user.id);

            // Sync with local storage
            const currentLocalCoins = parseInt(localStorage.getItem('eq_coins') || '0', 10);
            const currentLocalGems = parseInt(localStorage.getItem('eq_gems') || '0', 10);
            localStorage.setItem('eq_coins', String(currentLocalCoins + coinsToAward));
            localStorage.setItem('eq_gems', String(currentLocalGems + gemsToAward));
          }
        } catch (error) {
          console.error("Error in checkAndAwardRankRewards:", error);
        }
      }
    };

    checkAndAwardRankRewards();
  }, [totalXP, user, isTamil]);

  const handleDismiss = () => {
    if (newRank) {
      localStorage.setItem('eq_last_seen_rank', newRank.id);
    }
    setShowCelebration(false);
    setShowConfetti(false);
    onDismiss();
  };


  const perks = newRank ? getRankPerks(newRank.id, isTamil) : [];
  const colors = newRank ? BADGE_COLORS[newRank.id] : BADGE_COLORS.bronze;

  return (
    <>
      <ConfettiCelebration show={showConfetti} />

      <AnimatePresence>
        {showCelebration && oldRank && newRank && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={handleDismiss}
            />

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 0.8, 0],
                    y: [0, -30, -60],
                    scale: [0, 1, 0.5],
                  }}
                  transition={{
                    duration: p.duration,
                    delay: p.delay,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                  style={{
                    position: 'absolute',
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: p.size,
                    height: p.size,
                    borderRadius: '50%',
                  }}
                  className={colors.glow}
                />
              ))}
            </div>

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
              className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/50 shadow-2xl"
            >
              {/* Ambient glow backgrounds */}
              <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full ${colors.glow} blur-3xl pointer-events-none`} />
              <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

              {/* ── "RANK UP!" Header ── */}
              <div className="relative z-10 pt-8 pb-2 text-center">
                <motion.div
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center gap-2 mb-2"
                >
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Crown className="w-5 h-5 text-amber-400" />
                  </motion.div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {isTamil ? "வாழ்த்துகள்" : "Congratulations"}
                  </span>
                  <motion.div
                    animate={{ rotate: [0, -15, 15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Crown className="w-5 h-5 text-amber-400" />
                  </motion.div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 15, delay: 0.4 }}
                  className={`text-4xl font-black bg-gradient-to-r ${colors.text} bg-clip-text text-transparent`}
                >
                  {isTamil ? "தர உயர்வு!" : "RANK UP!"}
                </motion.h1>
              </div>

              {/* ── Rank Badge ── */}
              <div className="relative z-10 flex justify-center py-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.5 }}
                  className="relative"
                >
                  {/* Pulse glow rings */}
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`absolute inset-0 rounded-2xl ${colors.glow} blur-xl`}
                    style={{ margin: '-16px' }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
                    className={`absolute inset-0 rounded-2xl ${colors.glow} blur-2xl`}
                    style={{ margin: '-24px' }}
                  />

                  {/* Badge */}
                  <div
                    className={`relative h-24 w-24 rounded-2xl bg-gradient-to-br ${colors.bg} ring-4 ${colors.ring} flex items-center justify-center shadow-2xl`}
                  >
                    <span className="text-5xl">{newRank.emoji}</span>
                  </div>

                  {/* Sparkle decorations */}
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.4,
                      }}
                      className="absolute"
                      style={{
                        top: i < 2 ? '-8px' : 'auto',
                        bottom: i >= 2 ? '-8px' : 'auto',
                        left: i % 2 === 0 ? '-8px' : 'auto',
                        right: i % 2 === 1 ? '-8px' : 'auto',
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* ── Old → New Rank Comparison ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="relative z-10 px-6 mb-5"
              >
                <div className="flex items-center justify-center gap-4">
                  {/* Old rank */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`h-14 w-14 rounded-xl bg-gradient-to-br ${BADGE_COLORS[oldRank.id].bg} ring-2 ${BADGE_COLORS[oldRank.id].ring} flex items-center justify-center shadow-lg opacity-60`}
                    >
                      <span className="text-2xl">{oldRank.emoji}</span>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{getRankName(oldRank.id, isTamil)}</span>
                  </div>

                  {/* Arrow */}
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ChevronRight className="w-6 h-6 text-muted-foreground" />
                  </motion.div>

                  {/* New rank */}
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      className={`h-14 w-14 rounded-xl bg-gradient-to-br ${colors.bg} ring-2 ${colors.ring} flex items-center justify-center shadow-lg`}
                    >
                      <span className="text-2xl">{newRank.emoji}</span>
                    </motion.div>
                    <span className="text-[10px] font-black text-foreground uppercase">{newRank.name}</span>
                  </div>
                </div>
              </motion.div>

              {/* ── Rewards Unlocked ── */}
              {(rewardedCoins > 0 || rewardedGems > 0) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.75 }}
                  className="relative z-10 px-6 mb-5"
                >
                  <div className="rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-purple-500/15 border border-amber-400/25 p-4 text-center">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-2">{isTamil ? "தரப் பூர்த்தி வெகுமதிகள்!" : "Rank Completion Rewards!"}</span>
                    <div className="flex justify-center items-center gap-4">
                      {rewardedCoins > 0 && (
                        <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-amber-500/30">
                          <span className="text-base">🪙</span>
                          <span className="font-black text-amber-400 text-xs">+{rewardedCoins} {isTamil ? "நாணயங்கள்" : "Coins"}</span>
                        </div>
                      )}
                      {rewardedGems > 0 && (
                        <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-purple-500/30">
                          <span className="text-base">💎</span>
                          <span className="font-black text-purple-400 text-xs">+{rewardedGems} {isTamil ? "ரத்தினங்கள்" : "Gems"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Unlocked Perks ── */}
              {perks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="relative z-10 px-6 mb-5"
                >
                  <div className="rounded-2xl bg-gradient-to-br from-purple-500/8 via-violet-500/5 to-fuchsia-500/8 border border-purple-400/15 p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                        {isTamil ? "புதிய சலுகைகள் அன்லாக் செய்யப்பட்டன" : "New Perks Unlocked"}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {perks.map((perk, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + i * 0.1 }}
                          className="flex items-center gap-2.5"
                        >
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400/15 to-orange-500/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                            <perk.icon className="w-3.5 h-3.5 text-amber-400" />
                          </div>
                          <span className="text-sm font-semibold text-foreground">{perk.text}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Continue Button ── */}
              <div className="relative z-10 px-6 pb-6">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={handleDismiss}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r ${colors.bg} text-gray-900 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2`}
                >
                  <Sparkles className="w-4 h-4" />
                  {isTamil ? "தொடரவும்" : "Continue"}
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LevelUpCelebration;

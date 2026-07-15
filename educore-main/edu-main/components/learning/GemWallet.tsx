import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gem, Coins, Snowflake, Sparkles, ChevronDown, X, Gift, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguageStore } from '@/store/useLanguageStore';

/* ═══════════════════════════════════════════════════
   Gem Wallet — compact currency overlay widget
   ═══════════════════════════════════════════════════ */

interface GemWalletProps {
  className?: string;
}

function getFreezes(): number {
  return parseInt(localStorage.getItem('eq_streak_freezes') || '0', 10);
}

// Removed static EARN_TIPS to declare inside component based on language preference.

const GemWallet = ({ className = '' }: GemWalletProps) => {
  const { language } = useLanguageStore();
  const { motivationProgress } = useAuth();
  const isTamil = language === 'ta';
  const [expanded, setExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const gems = motivationProgress?.gems ?? 0;
  const coins = motivationProgress?.coins ?? 0;
  const [freezes, setFreezes] = useState(getFreezes());

  useEffect(() => {
    const handleUpdate = () => {
      setFreezes(getFreezes());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('wallet_update', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('wallet_update', handleUpdate);
    };
  }, []);

  const EARN_TIPS = [
    { icon: Star, text: isTamil ? 'ரத்தினங்களைப் பெற பாடங்களை முடிக்கவும்' : 'Complete lessons to earn gems', color: 'text-amber-400' },
    { icon: Gift, text: isTamil ? 'தினசரி உள்நுழைவு போனஸ் வெகுமதிகள்' : 'Daily login bonus rewards', color: 'text-pink-400' },
    { icon: Sparkles, text: isTamil ? 'சரியான குவிஸ் மதிப்பெண்கள் போனஸ் ரத்தினங்களை வழங்கும்' : 'Perfect quiz scores give bonus gems', color: 'text-purple-400' },
    { icon: Coins, text: isTamil ? 'தொடர் மைல்கற்கள் நாணயங்களை வழங்கும்' : 'Streak milestones award coins', color: 'text-yellow-500' },
  ];

  return (
    <div className={`relative ${className}`}>
      {/* ✨ Compact Pill Button ✨ */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 h-8 sm:h-10 rounded-full bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg hover:shadow-xl transition-shadow"
      >
        {/* Gem icon with sparkle */}
        <div className="relative">
          <motion.div
            animate={isHovering ? { rotate: [0, -10, 10, -5, 0], scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.6 }}
          >
            <Gem className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]" />
          </motion.div>

          {/* Sparkle particles on hover */}
          <AnimatePresence>
            {isHovering && (
              <>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    initial={{ opacity: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      x: (Math.random() - 0.5) * 30,
                      y: (Math.random() - 0.5) * 30,
                    }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Gems indicator */}
        <span className="text-xs sm:text-sm font-black text-foreground tabular-nums">{gems}</span>

        {/* Separator */}
        <div className="w-[1px] h-3 sm:h-4 bg-border/60 mx-0.5 sm:mx-1" />

        {/* Coins indicator */}
        <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
        <span className="text-xs sm:text-sm font-black text-foreground tabular-nums">{coins}</span>
        
        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground transition-transform duration-300 ml-0.5 ${expanded ? "rotate-180" : ""}`} />
      </motion.button>

      {/* ── Expanded Card ── */}
      <AnimatePresence>
        {expanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
              className="fixed inset-0 z-40"
            />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="fixed left-4 right-4 top-20 mx-auto sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mx-0 mt-0 sm:mt-2 z-50 w-auto sm:w-72 max-w-[360px] overflow-hidden rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/50 shadow-2xl origin-top sm:origin-top-right"
            >
              {/* Ambient glow */}
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-cyan-500/8 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-purple-500/6 blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="relative z-10 p-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-black text-foreground">{isTamil ? "என் பணப்பை" : "My Wallet"}</h3>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="h-6 w-6 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Gem Balance */}
              <div className="relative z-10 px-4 mb-3">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-xl bg-gradient-to-br from-cyan-500/12 via-blue-500/8 to-purple-500/10 border border-cyan-400/20 p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                        <Gem className="w-5 h-5 text-white" />
                      </div>
                      {/* Sparkle orbit */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="absolute -inset-1 pointer-events-none"
                      >
                        <Sparkles className="absolute -top-0.5 left-1/2 w-2 h-2 text-cyan-300/60" />
                      </motion.div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{isTamil ? "ரத்தினங்கள்" : "Gems"}</p>
                      <p className="text-2xl font-black text-foreground tabular-nums leading-tight">{gems}</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Coins & Freezes row */}
              <div className="relative z-10 px-4 mb-3 flex gap-2">
                {/* Coin card */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex-1 rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-500/8 border border-yellow-400/20 p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{isTamil ? "நாணயங்கள்" : "Coins"}</span>
                  </div>
                  <p className="text-xl font-black text-foreground tabular-nums">{coins}</p>
                </motion.div>

                {/* Freeze card */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex-1 rounded-xl bg-gradient-to-br from-sky-500/10 to-cyan-500/8 border border-sky-400/20 p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Snowflake className="w-4 h-4 text-sky-400" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{isTamil ? "முடக்கங்கள்" : "Freezes"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.08 }}
                      >
                        <Snowflake
                          className={`w-5 h-5 ${
                            i < freezes
                              ? 'text-sky-400 drop-shadow-[0_0_4px_rgba(56,189,248,0.5)]'
                              : 'text-muted-foreground/20'
                          }`}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* How to Earn */}
              <div className="relative z-10 px-4 pb-4">
                <div className="rounded-xl bg-muted/20 border border-border/30 p-3">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Gift className="w-3 h-3 text-pink-400" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                      {isTamil ? "சம்பாதிப்பது எப்படி" : "How to Earn"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {EARN_TIPS.map((tip, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.06 }}
                        className="flex items-center gap-2"
                      >
                        <tip.icon className={`w-3.5 h-3.5 ${tip.color} shrink-0`} />
                        <span className="text-xs text-muted-foreground font-medium">{tip.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GemWallet;

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles, Gift, Gem } from "lucide-react";
import { type Cosmetic, ALL_COSMETICS, RARITY_CONFIG, getCosmeticName, getCosmeticDescription } from "@/data/cosmetics";
import ConfettiCelebration from "./ConfettiCelebration";
import { useLanguageStore } from "@/store/useLanguageStore";

interface LootBoxRevealProps {
  item: Cosmetic | null;
  onClose: () => void;
}

type Stage = "idle" | "spinning" | "shaking" | "opening" | "revealed";

export default function LootBoxReveal({ item, onClose }: LootBoxRevealProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [spinItems, setSpinItems] = useState<Cosmetic[]>([]);
  const { language } = useLanguageStore();
  const isTamil = language === 'ta';

  const getTamilRarity = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'சாதாரண';
      case 'rare': return 'அரிய';
      case 'epic': return 'மிகவும் அரிய';
      case 'legendary': return 'உன்னத';
      case 'mythic': return 'புராண';
      case 'limited': return 'வரையறுக்கப்பட்ட';
      case 'event': return 'நிகழ்வு';
      case 'seasonal': return 'பруவகால';
      default: return 'சாதாரண';
    }
  };

  useEffect(() => {
    if (item) {
      // Generate random items for the spin reel, placing the winner at index 20
      const randomItems = Array.from({ length: 24 }).map(() => {
        const pool = ALL_COSMETICS.filter(c => c.id !== item.id && !c.isLimited);
        return pool[Math.floor(Math.random() * pool.length)];
      });
      const reel = [...randomItems.slice(0, 20), item, ...randomItems.slice(20)];
      setSpinItems(reel);
      
      setStage("spinning");

      // Phase 1: Spin for 3.2s
      const t1 = setTimeout(() => {
        setStage("shaking");
      }, 3200);

      // Phase 2: Shake box for 1.2s (tension build-up)
      const t2 = setTimeout(() => {
        setStage("opening");
      }, 4400);

      // Phase 3: Blast of light & final reveal
      const t3 = setTimeout(() => {
        setStage("revealed");
      }, 4900);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setStage("idle");
      setSpinItems([]);
    }
  }, [item]);

  if (!item) return null;

  const rc = RARITY_CONFIG[item.rarity];
  const isHighTier = item.rarity === 'legendary' || item.rarity === 'mythic' || item.rarity === 'limited';

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <ConfettiCelebration show={stage === "revealed" && isHighTier} />
        
        {/* Ambient background rays */}
        {stage === "revealed" && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {isHighTier && (
              <motion.div className="absolute inset-0 bg-white"
                initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.8 }} />
            )}
            <motion.div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] rounded-full opacity-15`}
               style={{ background: `conic-gradient(from 0deg, transparent 0deg 15deg, white 15deg 30deg, transparent 30deg 45deg, white 45deg 60deg, transparent 60deg 75deg, white 75deg 90deg, transparent 90deg 105deg, white 105deg 120deg, transparent 120deg 135deg, white 135deg 150deg, transparent 150deg 165deg, white 165deg 180deg, transparent 180deg 195deg, white 195deg 210deg, transparent 210deg 225deg, white 225deg 240deg, transparent 240deg 255deg, white 255deg 270deg, transparent 270deg 285deg, white 285deg 300deg, transparent 300deg 315deg, white 315deg 330deg, transparent 330deg 345deg, white 345deg 360deg)` }}
               animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}

        <div className="relative z-10 w-full flex flex-col items-center text-center">
          
          {/* STAGE 1: SPINNING REEL */}
          {stage === "spinning" && (
            <div className="flex flex-col items-center gap-6">
              <h2 className="text-2xl font-black text-white uppercase tracking-widest text-gradient-flow">
                {isTamil ? "🎲 மர்மப் பெட்டி திறக்கப்படுகிறது..." : "🎲 Opening Mystery Box..."}
              </h2>
              
              <div className="relative w-80 h-36 bg-slate-950/90 border-2 border-purple-500/50 rounded-2xl overflow-hidden flex items-center shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                {/* Center Selector Marker */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-yellow-400 z-30 shadow-[0_0_10px_#f59e0b]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rotate-45" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-yellow-400 rotate-45" />
                </div>
                
                {/* Scrolling Reel */}
                <motion.div 
                  className="flex gap-3 px-[112px]"
                  initial={{ x: 0 }}
                  animate={{ x: -20 * 108 }} // 96px width + 12px gap = 108px
                  transition={{ duration: 3, ease: [0.1, 0.85, 0.2, 1] }}
                >
                  {spinItems.map((spinItem, idx) => {
                    const sRarity = RARITY_CONFIG[spinItem.rarity];
                    return (
                      <div 
                        key={idx} 
                        className={`w-24 h-24 rounded-xl border flex flex-col items-center justify-center bg-slate-900/60 shrink-0 shadow-lg ${sRarity.border} border-opacity-40`}
                      >
                        <span className="text-4xl drop-shadow-md">{spinItem.icon}</span>
                        <span className={`text-[9px] font-black uppercase mt-1 ${sRarity.color}`}>
                          {isTamil ? getTamilRarity(spinItem.rarity) : sRarity.label}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
              <p className="text-sm text-slate-400">
                {isTamil ? "பெட்டி சுழலுகிறது..." : "Spinning crate reel..."}
              </p>
            </div>
          )}

          {/* STAGE 2 & 3: CRATE SHAKING & FLASHING */}
          {(stage === "shaking" || stage === "opening") && (
            <motion.div
              animate={
                stage === "shaking" ? { 
                  rotate: [-6, 6, -6, 6, -3, 3, -1, 1, 0], 
                  scale: [1, 1.1, 1.15, 1.2, 1.1],
                  y: [0, -10, 5, -15, 0]
                } : 
                stage === "opening" ? { 
                  scale: [1.1, 1.8], 
                  opacity: [1, 0], 
                  filter: "brightness(3)" 
                } : {}
              }
              transition={{ duration: stage === "shaking" ? 1.2 : 0.5, ease: "easeInOut" }}
              className="text-9xl relative filter drop-shadow-[0_0_40px_rgba(168,85,247,0.7)]"
            >
              📦
              {stage === "shaking" && (
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-ping" />
              )}
            </motion.div>
          )}

          {/* STAGE 4: REVEAL CARD */}
          {stage === "revealed" && (
            <motion.div
              initial={{ scale: 0.3, y: 200, rotate: -60, opacity: 0 }}
              animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 8, stiffness: 80, mass: 0.8 }}
              className="relative w-full max-w-sm"
            >
              {/* Outer Glowing Box */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-tr ${rc.gradient} opacity-20 blur-2xl`} />
              
              <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${rc.gradient}`} />
                
                {/* Holographic particle glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full" />
                
                <motion.div 
                  animate={{ y: [-10, 10, -10], rotate: [-2, 2, -2], scale: [1, 1.03, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="text-9xl mb-6 filter drop-shadow-[0_15px_30px_rgba(255,255,255,0.15)] flex justify-center"
                >
                  {item.icon}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <span className={`inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${rc.bg} ${rc.color} border ${rc.border} mb-3 shadow-md`}>
                    {isTamil ? `${getTamilRarity(item.rarity)} ஆடை கிடைத்தது!` : `${rc.label} Item Unboxed!`}
                  </span>
                  
                  <h2 className="text-3xl font-black text-white mb-2 tracking-wide drop-shadow-md">
                    {getCosmeticName(item, isTamil)}
                  </h2>
                  
                  <p className="text-white/60 text-sm mb-6 leading-relaxed">
                    {getCosmeticDescription(item, isTamil)}
                  </p>
                  
                  <button 
                    onClick={onClose} 
                    className={`w-full py-4 rounded-xl font-black text-lg text-white shadow-xl btn-bounce-hover transition-all ${isHighTier ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-pink-600 shadow-orange-500/25 rainbow-shadow btn-glow-pulse' : 'bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20'}`}
                    style={isHighTier ? { '--glow-color': 'rgba(245, 158, 11, 0.5)', borderRadius: '0.75rem' } as React.CSSProperties : {}}
                  >
                    {isTamil ? "ஆடைக் கூடத்தில் சேர்! 🎒" : "Add to Arsenal! 🎒"}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

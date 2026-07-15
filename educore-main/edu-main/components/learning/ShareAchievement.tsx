import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Share2, X, Trophy, Star, Download, Flame, Award, Shield, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { CharacterSVG, type CharacterConfig } from "@/components/learning/CharacterCreator";
import { getRank } from "@/lib/retentionEngine";

interface ShareAchievementProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: {
    title: string;
    description: string;
    emoji: string;
    level?: number;
    xp?: number;
  };
  studentName: string;
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

const ShareAchievement = ({ isOpen, onClose, achievement, studentName }: ShareAchievementProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();

  // Parse avatar configuration
  let characterConfig: CharacterConfig | null = null;
  if (profile?.avatar_url) {
    try {
      const parsed = JSON.parse(profile.avatar_url);
      if (parsed.gender) {
        characterConfig = { ...DEFAULT_CHARACTER_CONFIG, ...parsed };
      }
    } catch (e) {
      // not a json string
    }
  }

  const xpValue = achievement.xp ?? profile?.total_xp ?? 0;
  const rank = getRank(xpValue);

  const shareText = `🎓 ${studentName} just achieved: ${achievement.title}! ${achievement.emoji}\n${achievement.description}\n\n#LearningAdventure #Education`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${achievement.title} ${achievement.emoji}`,
          text: shareText,
        });
      } catch {
        // User cancelled
      }
    } else {
      // Copy to clipboard fallback
      await navigator.clipboard.writeText(shareText);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
  };

  // Custom styling based on Rank
  const borderClass = rank.id === "platinum" 
    ? "border-cyan-400/80 shadow-[0_0_25px_rgba(34,211,238,0.35)]" 
    : rank.id === "gold"
    ? "border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.35)]"
    : rank.id === "silver"
    ? "border-slate-300/80 shadow-[0_0_20px_rgba(203,213,225,0.3)]"
    : "border-orange-500/80 shadow-[0_0_15px_rgba(249,115,22,0.25)]";

  const ringClass = rank.id === "platinum"
    ? "ring-cyan-500/30"
    : rank.id === "gold"
    ? "ring-amber-500/30"
    : rank.id === "silver"
    ? "ring-slate-400/30"
    : "ring-orange-500/30";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-slate-900 border-2 ${borderClass} rounded-[32px] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden text-white`}
          >
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-4 right-4 z-30 bg-black/40 hover:bg-black/60 border border-white/10 text-white rounded-full p-1.5 transition-all">
              <X className="w-4 h-4" />
            </button>

            {/* Achievement Card Area */}
            <div
              ref={cardRef}
              className="text-center py-4 relative"
            >
              {/* Cyber Grid & Glowing background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
              <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full bg-gradient-to-br ${rank.gradient} opacity-10 blur-3xl pointer-events-none`} />

              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="relative z-10 flex flex-col items-center"
              >
                {/* 1. Large Premium Circular Profile Avatar Icon */}
                <div className="relative mb-6 select-none">
                  {/* Outer Orbit Ring */}
                  <div className={`absolute -inset-2.5 rounded-full border-2 border-dashed border-white/10 animate-[spin_40s_linear_infinite]`} />
                  
                  {/* Inner Glowing Frame */}
                  <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br ${rank.gradient} p-1 shadow-lg shadow-black/50 ring-4 ${ringClass} flex items-center justify-center overflow-hidden`}>
                    <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center overflow-hidden relative">
                      {characterConfig ? (
                        <div className="scale-[0.8] origin-center translate-y-1">
                          <CharacterSVG config={characterConfig} />
                        </div>
                      ) : (
                        <span className="text-5xl">{achievement.emoji}</span>
                      )}
                    </div>
                  </div>

                  {/* Badge Overlay representing the Achievement */}
                  <motion.div 
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-slate-900 border-2 border-amber-400 shadow-lg flex items-center justify-center text-lg"
                    title={achievement.title}
                  >
                    {achievement.emoji}
                  </motion.div>
                </div>

                {/* 2. Achievement Title & Badges */}
                <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase flex items-center gap-1.5 mb-1 bg-cyan-950/40 border border-cyan-800/30 px-3 py-1 rounded-full">
                  <Sparkles className="w-3 h-3 text-cyan-400 fill-cyan-400/20" />
                  {achievement.title}
                </span>

                <h2 className="text-2xl font-black uppercase tracking-wider drop-shadow-md text-foreground px-4 mb-2">
                  Learning Champion!
                </h2>
                
                <p className="text-sm text-slate-300 font-medium px-4 mb-4">
                  {achievement.description}
                </p>

                {/* Rank Emblem */}
                <div className="flex items-center justify-center gap-2 bg-black/40 border border-white/5 px-4 py-2 rounded-2xl mb-4 w-full max-w-[240px] shadow-inner">
                  <span className="text-2xl">{rank.emoji}</span>
                  <div className="text-left">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Rank Status</div>
                    <div className="font-black text-sm bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent uppercase tracking-wider">
                      {rank.name}
                    </div>
                  </div>
                  {achievement.xp !== undefined && (
                    <div className="ml-auto flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-black text-xs text-amber-400">{achievement.xp} XP</span>
                    </div>
                  )}
                </div>

                <p className="text-xs font-bold text-slate-400 tracking-wider">
                  — {studentName}
                </p>
              </motion.div>
            </div>

            {/* Premium Buttons */}
            <div className="flex gap-3 mt-4 relative z-10">
              <Button 
                variant="outline" 
                className="flex-1 rounded-2xl border-white/10 hover:bg-white/5 text-white bg-slate-900/40 font-bold" 
                onClick={handleCopy}
              >
                <Download className="w-4 h-4 mr-1.5" /> Copy
              </Button>
              <Button 
                className="flex-1 rounded-2xl font-black bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white shadow-lg shadow-cyan-500/20" 
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-1.5" /> Share
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareAchievement;

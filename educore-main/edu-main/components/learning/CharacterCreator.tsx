import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Sparkles, Smile, RefreshCw, UserCheck, Flame, Lock, Check, Coins, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ALL_COSMETICS, type Cosmetic, getCosmeticName } from "@/data/cosmetics";
import { getStableUuid } from "@/lib/utils";
import { useLanguageStore } from "@/store/useLanguageStore";

export interface CharacterConfig {
  gender: "male" | "female";
  style: "anime" | "cartoon" | "chibi";
  skinTone: string;
  hairstyle: string;
  hairColor: string;
  eyes: string;
  expression: string;
  outfit?: string;
  jacket?: string;
  hat?: string;
  glasses?: string;
  prop?: string;
  backpack?: string;
  beard?: string;
  pet?: string;
  aura?: string;
  background?: string;
  frame?: string;
  pose?: string;
  gems_spent?: number;
  gems_awarded?: number;
}

interface CharacterCreatorProps {
  onBack: () => void;
  onSaved?: () => void;
}

const SKIN_TONES = [
  { label: "Fair", label_ta: "வெளிர்", value: "#FCE3B6" },
  { label: "Peach", label_ta: "பீச்", value: "#FAD09E" },
  { label: "Tan", label_ta: "மாநிறம்", value: "#E0A96D" },
  { label: "Golden", label_ta: "பொன்னிறம்", value: "#D2B48C" },
  { label: "Bronze", label_ta: "வெண்கலம்", value: "#A87C43" },
  { label: "Dark", label_ta: "அடர் நிறம்", value: "#7B4F2A" },
];

const EYE_STYLES = [
  { id: "anime", label: "Anime Sparkle", label_ta: "அனிம் ஒளி" },
  { id: "cool", label: "Cool Visor", label_ta: "கூல் வைசர்" },
  { id: "cute", label: "Round & Cute", label_ta: "வட்டமான & அழகான" },
  { id: "gamer", label: "Cyber Glass", label_ta: "சைபர் கண்ணாடி" },
];

const EXPRESSIONS = [
  { id: "confident", label: "Confident", label_ta: "தன்னம்பிக்கை" },
  { id: "excited", label: "Excited", label_ta: "உற்சாகம்" },
  { id: "smirk", label: "Smirk", label_ta: "புன்னகை" },
  { id: "focused", label: "Focused", label_ta: "கவனம்" },
];

const DEFAULT_CONFIG: CharacterConfig = {
  gender: "male",
  style: "anime",
  skinTone: "#FCE3B6",
  hairstyle: "spiky",
  hairColor: "#1A1A1A",
  eyes: "anime",
  expression: "confident",
};

const HAIR_STYLES = [
  { id: "spiky", label: "Spiky Anime", label_ta: "கூர்மையான அனிம்" },
  { id: "long-waves", label: "Flowing Waves", label_ta: "அலை அலையான" },
  { id: "undercut", label: "Cool Undercut", label_ta: "கூல் அண்டர்கட்" },
  { id: "buns", label: "Double Buns", label_ta: "இரட்டை கொண்டை" },
  { id: "classic", label: "Classic Trim", label_ta: "கிளாசிக் டிரிம்" },
  { id: "pigtails", label: "Pigtails", label_ta: "இரட்டை சடை" },
];

const HAIR_COLORS = [
  { label: "Black", label_ta: "கருப்பு", value: "#1A1A1A" },
  { label: "Brown", label_ta: "பழுப்பு", value: "#5C3A21" },
  { label: "Blonde", label_ta: "பொன்னிறம்", value: "#EED202" },
  { label: "Fiery", label_ta: "நெருப்பு நிறம்", value: "#FF5722" },
  { label: "Electric", label_ta: "மின்சார நீலம்", value: "#00BCD4" },
  { label: "Neon Purple", label_ta: "நியான் ஊதா", value: "#9C27B0" },
  { label: "Sakura Pink", label_ta: "சகுரா இளஞ்சிவப்பு", value: "#E91E63" },
];

// Helper to determine item price and currency type
export const getItemCostType = (item: Cosmetic) => {
  const isGemCost = item.rarity === 'legendary' || item.rarity === 'mythic' || item.rarity === 'limited';
  let amount = isGemCost ? Math.ceil(item.price / 10) : item.price;
  
  try {
    const discount = localStorage.getItem('eq_avatar_discount');
    if (discount) {
      const val = parseFloat(discount);
      if (val > 0 && val < 1) {
        amount = Math.ceil(amount * val);
      }
    }
  } catch (e) {
    // Safely ignore local storage restrictions
  }
  
  return { type: isGemCost ? 'gems' : 'coins' as 'gems' | 'coins', amount };
};

/* ── HIGH FIDELITY DYNAMIC CHARACTER SVG ── */
export function CharacterSVG({ config, emote, pet, aura, mini }: { config: CharacterConfig; emote?: string; pet?: string; aura?: string; mini?: boolean }) {
  const isMale = config.gender === "male";
  const isAnime = config.style === "anime";
  const isChibi = config.style === "chibi";
  const isCartoon = config.style === "cartoon";

  // Full-body equipment transformation states
  const outfitId = config.outfit || "";
  const isSpider = outfitId.includes("spider");
  const isNinja = outfitId.includes("ninja");
  const isDino = outfitId.includes("dino");
  const isBanana = outfitId.includes("banana");
  const isPizza = outfitId.includes("pizza");
  const isPenguin = outfitId.includes("penguin");
  const isCat = outfitId.includes("cat") || outfitId.includes("onesie");
  const isSpace = outfitId.includes("space") || outfitId.includes("astronaut");
  const isSamurai = outfitId.includes("samurai") || outfitId.includes("spirit");

  // Conditional Hiding Matrix to prevent clipping and overlap
  const hideHair = isSpider || isNinja || isDino || isBanana || isPizza || isPenguin || isCat;
  const hideDefaultHead = isSpider || isNinja || isDino || isBanana || isPizza || isPenguin || isCat;
  const hideEyebrows = isSpider;
  const hideEyes = isSpider;
  const hideMouth = isSpider || isNinja;
  const hideBeard = isSpider || isNinja;
  const hideGlasses = isSpider || isNinja;
  const hideBlush = isSpider || isNinja;
  const hideEyelashes = isSpider;
  const hideHat = isSpider || isNinja || isDino || isBanana || isPizza || isPenguin || isCat || isSamurai || isSpace;

  const breatheAnim = mini ? {} : {
    animate: {
      y: [0, -3, 0],
      scaleY: [1, 1.015, 1],
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  // Determine frame styling
  const frameBorderClass = !mini && config.frame === "frame-cyber"
    ? "border-cyan-400 shadow-[0_0_20px_#22d3ee]"
    : !mini && config.frame === "frame-royal"
    ? "border-amber-400 shadow-[0_0_25px_#fbbf24]"
    : !mini && config.frame === "frame-legendary"
    ? "border-purple-500 shadow-[0_0_30px_#a855f7]"
    : "";

  const content = (
    <motion.svg
      viewBox="0 0 200 200"
      className={mini ? "w-full h-full" : "w-full h-full drop-shadow-[0_10px_25px_rgba(0,0,0,0.35)] relative z-10"}
      {...breatheAnim}
    >
      <defs>
        <radialGradient id="faceGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={config.skinTone} stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        
        {/* Premium Space helmet glass glow */}
        <radialGradient id="spaceHelmetGlow" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="40%" stopColor="#22d3ee" stopOpacity="0.2" />
          <stop offset="80%" stopColor="#0891b2" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.35" />
        </radialGradient>
        
        {/* Premium Glow Filter for glowing elements */}
        <filter id="premiumGlow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        {/* Premium Gradients */}
        <linearGradient id="spikyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="60%" stopColor="#2979FF" />
          <stop offset="100%" stopColor="#1A237E" />
        </linearGradient>
        <linearGradient id="rainbowGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF007F" />
          <stop offset="20%" stopColor="#FF5722" />
          <stop offset="40%" stopColor="#FFEB3B" />
          <stop offset="60%" stopColor="#4CAF50" />
          <stop offset="80%" stopColor="#00BCD4" />
          <stop offset="100%" stopColor="#9C27B0" />
        </linearGradient>
        <linearGradient id="crownGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="50%" stopColor="#FFA000" />
          <stop offset="100%" stopColor="#795548" />
        </linearGradient>
        <linearGradient id="flameGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFEB3B" />
          <stop offset="40%" stopColor="#FF9800" />
          <stop offset="100%" stopColor="#D84315" />
        </linearGradient>
        <linearGradient id="flameCoreGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FFEB3B" />
          <stop offset="100%" stopColor="#FF5722" />
        </linearGradient>
        <linearGradient id="galaxyGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4A148C" />
          <stop offset="40%" stopColor="#311B92" />
          <stop offset="70%" stopColor="#006064" />
          <stop offset="100%" stopColor="#01579B" />
        </linearGradient>
        <linearGradient id="galaxyHighlightGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E040FB" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
        <linearGradient id="ninjaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#37474F" />
          <stop offset="60%" stopColor="#212121" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        <radialGradient id="afroGradient" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#A1887F" />
          <stop offset="70%" stopColor="#5D4037" />
          <stop offset="100%" stopColor="#3E2723" />
        </radialGradient>
      </defs>

      {/* BODY GROUP (scaled down for Chibi) */}
      <g transform={isChibi ? "translate(100, 180) scale(0.8, 0.75) translate(-100, -180)" : undefined}>
        {/* 0. Backpacks */}
        <g stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2.5 : 0} strokeLinejoin="round">
          {config.backpack && (
            <g>
              <rect x="35" y="130" width="130" height="60" rx="10" fill={config.backpack.includes('cyber') ? "#0891b2" : config.backpack.includes('ninja') ? "#1e293b" : "#475569"} />
              <path d="M 45,130 Q 100,110 155,130" stroke={isCartoon ? "#111" : "#334155"} strokeWidth="8" fill="none" />
              {config.backpack.includes('ninja') && <circle cx="100" cy="160" r="15" fill="#e11d48" />}
            </g>
          )}
        </g>

        {/* 1. Body Base & Neck — gender-distinct silhouette */}
        {/* Male: wider neck; Female: slim neck with collarbone */}
        <path
          d={isMale
            ? "M 83,140 L 117,140 L 115,165 L 85,165 Z"
            : "M 90,140 L 110,140 L 107,165 L 93,165 Z"
          }
          fill={config.skinTone}
          stroke={isCartoon ? "#111" : "none"}
          strokeWidth={isCartoon ? 2.5 : 0}
          strokeLinejoin="round"
        />
        {/* Female collarbone highlight */}
        {!isMale && (
          <path d="M 93,142 Q 100,146 107,142" stroke="#fff" strokeWidth="0.8" fill="none" opacity="0.25" />
        )}
        
        {/* 2. Clothes / Torso */}
        <g stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2.5 : 0} strokeLinejoin="round">
          {config.outfit ? (
            <g>
              {/* Custom Outfit: Ninja Set */}
            {config.outfit.includes('ninja') ? (
              <g>
                {/* Base: Slate Dark Blue */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#1e293b" className="transition-all duration-300" />
                {/* Mesh under-armor inside V-neck */}
                <path d="M 80,160 L 120,160 L 100,185 Z" fill="#374151" />
                <path d="M 80,160 L 120,185 M 120,160 L 80,185 M 90,160 L 110,185 M 110,160 L 90,185" stroke="#1f2937" strokeWidth="1" />
                {/* Overlapping Orange Kimono Tunic Collar wraps */}
                <path d="M 72,160 L 98,200 L 108,200 L 82,160 Z" fill="#f97316" />
                <path d="M 128,160 L 102,200 L 92,200 L 118,160 Z" fill="#f97316" />
                {/* Red waist sash belt */}
                <path d="M 46,190 L 154,190 L 155,200 L 45,200 Z" fill="#ea580c" />
                {/* Crimson red left/right shoulder straps */}
                <path d="M 55,160 L 68,160 L 60,185 L 50,185 Z" fill="#ea580c" opacity="0.8" />
                <path d="M 145,160 L 132,160 L 140,185 L 150,185 Z" fill="#ea580c" opacity="0.8" />
                {/* Swirl Crest on left chest */}
                <circle cx="83" cy="174" r="5" fill="#f8fafc" stroke="#ea580c" strokeWidth="1" />
                <path d="M 83,174 Q 86,171 83,172 T 83,176" fill="none" stroke="#ea580c" strokeWidth="1" />
              </g>
            ) : config.outfit.includes('panda') ? (
              <g>
                {/* Base Onesie: Dark Slate Black */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#1e293b" className="transition-all duration-300" />
                {/* Big Fluffy White Panda Belly */}
                <ellipse cx="100" cy="182" rx="26" ry="17" fill="#f8fafc" />
                {/* Cute green bamboo sprig on left chest */}
                <g transform="translate(80, 166) scale(0.6)">
                  <path d="M 2,15 Q 8,5 15,2 M 8,9 Q 15,5 18,10 M 5,12 Q 1,4 3,0" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 15,2 C 16,1 18,3 15,5 Z" fill="#22c55e" />
                  <path d="M 18,10 C 20,9 21,11 18,12 Z" fill="#22c55e" />
                </g>
                {/* Cute tiny pawprint inside white belly */}
                <circle cx="100" cy="182" r="3.5" fill="#f472b6" />
                <circle cx="95" cy="178" r="1.5" fill="#f472b6" />
                <circle cx="100" cy="176" r="1.5" fill="#f472b6" />
                <circle cx="105" cy="178" r="1.5" fill="#f472b6" />
              </g>
            ) : (config.outfit.includes('graduation') || config.outfit.includes('gown') && !config.outfit.includes('ice') && !config.outfit.includes('saree')) ? (
              <g>
                {/* Base Robe: Pitch Black */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#111827" className="transition-all duration-300" />
                {/* White Inner Shirt Collar */}
                <path d="M 80,160 L 120,160 L 100,182 Z" fill="#f8fafc" />
                {/* Red Graduation Tie */}
                <path d="M 97,165 L 103,165 L 105,185 L 100,192 L 95,185 Z" fill="#dc2626" />
                {/* V-Neck Outer Gown Collar */}
                <path d="M 78,160 L 100,185 L 122,160 L 130,160 L 100,194 L 70,160 Z" fill="#1f2937" stroke="#111827" strokeWidth="0.5" />
                {/* Gold Satin Stoles on shoulders */}
                <path d="M 72,160 L 84,160 L 84,200 L 72,200 Z" fill="#eab308" />
                <path d="M 116,160 L 128,160 L 128,200 L 116,200 Z" fill="#eab308" />
                {/* Tiny gold medal ribbon on right chest */}
                <rect x="119" y="172" width="6" height="10" fill="#3b82f6" />
                <circle cx="122" cy="184" r="3.5" fill="#eab308" />
              </g>
            ) : config.outfit.includes('pirate') ? (
              <g>
                {/* Base Coat: Rich Crimson Red */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#991b1b" className="transition-all duration-300" />
                {/* White ruffled ascot/jabot in V-neck */}
                <path d="M 80,160 L 120,160 L 100,185 Z" fill="#f8fafc" />
                {/* Jabot ruffles */}
                <path d="M 88,162 Q 100,168 112,162 M 92,169 Q 100,175 108,169 M 95,176 Q 100,182 105,176" stroke="#e2e8f0" strokeWidth="1.5" fill="none" />
                {/* Overlapping Deep Black/Gold Lapels */}
                <path d="M 50,160 L 78,164 L 68,200 L 45,200 Z" fill="#111827" stroke="#eab308" strokeWidth="1" />
                <path d="M 150,160 L 122,164 L 132,200 L 155,200 Z" fill="#111827" stroke="#eab308" strokeWidth="1" />
                {/* Shiny Gold buttons on lapels */}
                <circle cx="60" cy="172" r="2.5" fill="#fbbf24" />
                <circle cx="58" cy="186" r="2.5" fill="#fbbf24" />
                <circle cx="140" cy="172" r="2.5" fill="#fbbf24" />
                <circle cx="142" cy="186" r="2.5" fill="#fbbf24" />
                {/* Diagonal Leather strap / sash */}
                <path d="M 64,160 L 138,198 L 134,200 L 60,162 Z" fill="#78350f" />
                <rect x="94" y="174" width="12" height="10" transform="rotate(27 100 179)" fill="none" stroke="#fbbf24" strokeWidth="2" />
              </g>
            ) : config.outfit.includes('caped-hero') ? (
              <g>
                {/* RED CAPE BEHIND SHOULDERS */}
                <path d="M 55,160 L 30,200 L 170,200 L 145,160 Z" fill="#dc2626" />
                {/* Base Tunic: Bright Yellow */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#facc15" className="transition-all duration-300" />
                {/* Skin V-neck */}
                <path d="M 82,160 L 118,160 L 100,180 Z" fill={config.skinTone} />
                {/* Red Circular Crest Shield with White E (EduSpark) */}
                <circle cx="100" cy="174" r="8.5" fill="#dc2626" stroke="#f8fafc" strokeWidth="1" />
                <path d="M 97,171 L 103,171 M 97,174 L 102,174 M 97,177 L 103,177 M 97,171 L 97,177" stroke="#f8fafc" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                {/* Red belt at waist */}
                <path d="M 46,192 L 154,192 L 155,200 L 45,200 Z" fill="#dc2626" />
                {/* Gold belt buckle */}
                <rect x="94" y="190" width="12" height="10" fill="#facc15" rx="1" />
              </g>
            ) : (config.outfit.includes('dragon-warrior') || config.outfit.includes('dragon')) ? (
              <g>
                {/* Base Tunic: Martial Arts Orange */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#ea580c" className="transition-all duration-300" />
                {/* Deep Blue undershirt in V-neck */}
                <path d="M 80,160 L 120,160 L 100,185 Z" fill="#1e40af" />
                {/* Overlapping Orange wraps */}
                <path d="M 72,160 L 98,200 L 108,200 L 82,160 Z" fill="#ea580c" />
                <path d="M 128,160 L 102,200 L 92,200 L 118,160 Z" fill="#ea580c" />
                {/* Thick dark blue waist sash sash */}
                <path d="M 46,190 L 154,190 L 155,200 L 45,200 Z" fill="#1e40af" />
                {/* White Martial Arts circular badge on left chest */}
                <circle cx="83" cy="174" r="5" fill="#f8fafc" />
                {/* Black Kanji-style letter mark */}
                <path d="M 81,173 L 85,173 M 83,171 L 83,177 M 81,176 L 85,176" stroke="#111827" strokeWidth="1" fill="none" />
              </g>
            ) : config.outfit.includes('spider') ? (
              <g>
                {/* Base: Superhero Red */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#dc2626" className="transition-all duration-300" />
                {/* Left and Right Cobalt Blue side panels */}
                <path d="M 55,160 L 72,162 L 64,200 L 45,200 Z" fill="#1e40af" />
                <path d="M 145,160 L 128,162 L 136,200 L 155,200 Z" fill="#1e40af" />
                
                {/* Spider Web overlay lines */}
                <g stroke="#111827" strokeWidth="0.8" opacity="0.75" fill="none">
                  <path d="M 100,150 L 100,200" />
                  <path d="M 100,150 L 72,200" />
                  <path d="M 100,150 L 128,200" />
                  <path d="M 100,150 L 52,190" />
                  <path d="M 100,150 L 148,190" />
                  <path d="M 85,170 Q 100,174 115,170" />
                  <path d="M 75,183 Q 100,189 125,183" />
                  <path d="M 62,195 Q 100,203 138,195" />
                </g>
                
                {/* Black Spider Chest Emblem */}
                <circle cx="100" cy="172" r="2.5" fill="#111827" />
                <circle cx="100" cy="168" r="1.5" fill="#111827" />
                <path d="M 98,170 Q 94,166 92,168 M 98,172 Q 92,172 90,175 M 98,174 Q 93,178 92,182" stroke="#111827" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                <path d="M 102,170 Q 106,166 108,168 M 102,172 Q 108,172 110,175 M 102,174 Q 107,178 108,182" stroke="#111827" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              </g>
            ) : config.outfit.includes('bat') ? (
              <g>
                {/* Base: Tech Charcoal */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#1e293b" className="transition-all duration-300" />
                
                {/* Tech Armor Plate overlays */}
                <path d="M 68,160 L 100,174 L 132,160 L 138,188 L 100,196 L 62,188 Z" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
                <path d="M 80,160 L 100,170 L 120,160 L 122,178 L 100,185 L 78,178 Z" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
                
                {/* Glowing Yellow Bat Emblem */}
                <path d="M 100,169 Q 95,165 91,169 Q 92,173 100,177 Q 108,173 109,169 Q 105,165 100,169 Z" fill="#facc15" />
                <path d="M 100,169 L 98,166 L 100,168 L 102,166 Z" fill="#facc15" />
                
                {/* Tech Utility Belt */}
                <path d="M 46,192 L 154,192 L 155,200 L 45,200 Z" fill="#d97706" />
                <rect x="62" y="193" width="8" height="6" fill="#f59e0b" rx="0.5" />
                <rect x="74" y="193" width="8" height="6" fill="#f59e0b" rx="0.5" />
                <rect x="118" y="193" width="8" height="6" fill="#f59e0b" rx="0.5" />
                <rect x="130" y="193" width="8" height="6" fill="#f59e0b" rx="0.5" />
                <rect x="94" y="191" width="12" height="9" fill="#fbbf24" rx="1" stroke="#b45309" strokeWidth="0.5" />
              </g>
            ) : config.outfit.includes('thunder') ? (
              <g>
                {/* Flowing Red Cape behind shoulders */}
                <path d="M 55,160 L 25,200 L 175,200 L 145,160 Z" fill="#b91c1c" />
                {/* Base: Silver/Blue Metallic Armor */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#475569" className="transition-all duration-300" />
                <path d="M 65,160 L 100,172 L 135,160 L 140,192 L 100,200 L 60,192 Z" fill="#94a3b8" />
                
                {/* 6 circular silver medallions */}
                <circle cx="80" cy="172" r="5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                <circle cx="120" cy="172" r="5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                <circle cx="78" cy="186" r="5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                <circle cx="122" cy="186" r="5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                
                {/* Small cyan neon energy core lines */}
                <circle cx="80" cy="172" r="1.5" fill="#67e8f9" />
                <circle cx="120" cy="172" r="1.5" fill="#67e8f9" />
                <circle cx="78" cy="186" r="1.5" fill="#67e8f9" />
                <circle cx="122" cy="186" r="1.5" fill="#67e8f9" />
                
                {/* Golden waist armor border */}
                <path d="M 46,194 L 154,194 L 155,200 L 45,200 Z" fill="#d97706" />
              </g>
            ) : config.outfit.includes('iron') ? (
              <g>
                {/* Base: Hot-rod Red Tech Tunic */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#991b1b" className="transition-all duration-300" />
                
                {/* Gold Shoulder Pads & Chest trim */}
                <path d="M 55,160 L 75,160 L 70,180 L 50,180 Z" fill="#eab308" />
                <path d="M 145,160 L 125,160 L 130,180 L 150,180 Z" fill="#eab308" />
                <path d="M 76,160 L 100,176 L 124,160 L 112,160 L 100,170 L 88,160 Z" fill="#eab308" />
                
                {/* Tech panel lines */}
                <path d="M 75,182 L 90,192 M 125,182 L 110,192" stroke="#fbbf24" strokeWidth="1" opacity="0.7" />
                
                {/* Glowing Arc Reactor */}
                <circle cx="100" cy="177" r="7" fill="url(#premiumGlow)" filter="url(#premiumGlow)" opacity="0.3" />
                <circle cx="100" cy="177" r="5" fill="#22d3ee" stroke="#ffffff" strokeWidth="1" />
                <circle cx="100" cy="177" r="2" fill="#ffffff" />
                
                {/* Gold/Red tech belt at waist */}
                <path d="M 46,192 L 154,192 L 155,200 L 45,200 Z" fill="#eab308" />
                <rect x="90" y="191" width="20" height="9" fill="#991b1b" rx="1" />
              </g>
            ) : (config.outfit.includes('shield') || config.outfit.includes('captain')) ? (
              <g>
                {/* Base: Patriot Blue Tunic */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#1d4ed8" className="transition-all duration-300" />
                
                {/* Red and White vertical chest stripes */}
                <g fill="#f8fafc">
                  <rect x="68" y="178" width="64" height="22" fill="#f8fafc" />
                  <rect x="74" y="178" width="8" height="22" fill="#dc2626" />
                  <rect x="90" y="178" width="8" height="22" fill="#dc2626" />
                  <rect x="106" y="178" width="8" height="22" fill="#dc2626" />
                  <rect x="122" y="178" width="8" height="22" fill="#dc2626" />
                </g>
                
                {/* Leather shoulder straps harness */}
                <path d="M 62,160 L 80,178 L 74,178 L 56,160 Z" fill="#78350f" />
                <path d="M 138,160 L 120,178 L 126,178 L 144,160 Z" fill="#78350f" />
                
                {/* Bold Pure White Star on chest */}
                <g transform="translate(100, 168) scale(0.65) translate(-100, -168)">
                  <polygon points="100,154 104,164 115,164 107,171 110,182 100,175 90,182 93,171 85,164 96,164" fill="#f8fafc" />
                </g>
              </g>
            ) : config.outfit.includes('wonder') ? (
              <g>
                {/* Base: Amazonian ruby red */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#b91c1c" className="transition-all duration-300" />
                
                {/* Golden Eagle Breastplate design */}
                <path d="M 60,160 L 100,174 L 140,160 L 135,172 L 100,182 L 65,172 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="0.5" />
                <path d="M 72,164 L 88,168 L 100,174 L 112,168 L 128,164" stroke="#ca8a04" strokeWidth="1" fill="none" />
                
                {/* Blue star-spangled belt/sash at waist */}
                <path d="M 46,190 L 154,190 L 155,200 L 45,200 Z" fill="#1d4ed8" />
                <g fill="#f8fafc" transform="scale(0.8) translate(25, 27)">
                  <circle cx="70" cy="242" r="1" />
                  <circle cx="90" cy="242" r="1" />
                  <circle cx="110" cy="242" r="1" />
                  <circle cx="130" cy="242" r="1" />
                </g>
              </g>
            ) : config.outfit.includes('school-uniform') || config.outfit.includes('uniform') ? (
              <g>
                {/* School Uniform: Crisp white buttoned shirt with collar, red/blue tie/scarf */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill={isMale ? "#3B82F6" : "#EC4899"} className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,185 Z" fill={config.skinTone} />
                {/* White shirt collars */}
                <path d="M 72,160 L 100,178 L 82,160 Z" fill="#FFFFFF" />
                <path d="M 128,160 L 100,178 L 118,160 Z" fill="#FFFFFF" />
                {isMale ? (
                  /* Boy Tie */
                  <path d="M 97,175 L 103,175 L 105,195 L 100,200 L 95,195 Z" fill="#EF4444" />
                ) : (
                  /* Girl Sailor Bow */
                  <g>
                    <path d="M 94,178 L 106,178 L 100,185 Z" fill="#EF4444" />
                    <circle cx="100" cy="178" r="3" fill="#EF4444" />
                    <path d="M 97,178 L 92,192 L 99,186 Z" fill="#EF4444" />
                    <path d="M 103,178 L 108,192 L 101,186 Z" fill="#EF4444" />
                  </g>
                )}
              </g>
            ) : config.outfit.includes('sports-jersey') || config.outfit.includes('jersey') || config.outfit.includes('sport') ? (
              <g>
                {/* Sports Jersey: Green active jersey, yellow trim, white side stripes, yellow bold "7" */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#16a34a" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,180 Z" fill={config.skinTone} />
                {/* White side panels */}
                <path d="M 55,160 L 62,161 L 52,200 L 45,200 Z" fill="#f8fafc" />
                <path d="M 145,160 L 138,161 L 148,200 L 155,200 Z" fill="#f8fafc" />
                {/* Yellow athletic collar */}
                <path d="M 80,160 Q 100,175 120,160 L 124,160 Q 100,178 76,160 Z" fill="#facc15" />
                {/* Bold sports number "7" on chest */}
                <path d="M 95,170 L 107,170 L 99,190" stroke="#facc15" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </g>
            ) : config.outfit.includes('lab-coat') || config.outfit.includes('lab') ? (
              <g>
                {/* Lab coat: Crisp white, deep V collar showing green shirt underneath, front pockets, blue pens */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" className="transition-all duration-300" />
                {/* Green inner shirt */}
                <path d="M 80,160 L 120,160 L 100,185 Z" fill="#0d9488" />
                <path d="M 83,160 L 117,160 L 100,178 Z" fill={config.skinTone} />
                {/* Double-breasted lab coat collars */}
                <path d="M 70,160 L 100,186 L 85,200 L 45,200 Z" fill="#f1f5f9" opacity="0.9" />
                <path d="M 130,160 L 100,186 L 115,200 L 155,200 Z" fill="#f1f5f9" opacity="0.9" />
                {/* Pens in left pocket */}
                <rect x="70" y="178" width="12" height="10" fill="#e2e8f0" rx="1" />
                <rect x="73" y="172" width="2.5" height="7" fill="#3b82f6" rx="0.5" />
                <rect x="77" y="170" width="2.5" height="9" fill="#ef4444" rx="0.5" />
                {/* Beaker circular chest crest */}
                <circle cx="125" cy="180" r="5" fill="#f1f5f9" stroke="#0ea5e9" strokeWidth="1" />
                <path d="M 123,178 L 127,178 M 125,178 L 125,182 L 122,183 L 128,183 Z" fill="none" stroke="#0ea5e9" strokeWidth="0.8" />
              </g>
            ) : config.outfit.includes('art-smock') || config.outfit.includes('art') ? (
              <g>
                {/* Artist Smock: Lavender base coat, colourful paint splatters, neck straps */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#c084fc" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,182 Z" fill={config.skinTone} />
                {/* Dark grey protective smock apron */}
                <path d="M 68,168 L 132,168 L 138,200 L 62,200 Z" fill="#475569" />
                {/* Neck apron strap */}
                <path d="M 68,168 L 84,160 M 132,168 L 116,160" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                {/* Colourful paint splatters */}
                <circle cx="80" cy="182" r="4" fill="#ef4444" />
                <circle cx="83" cy="184" r="2" fill="#ef4444" />
                <circle cx="112" cy="178" r="4.5" fill="#eab308" />
                <circle cx="95" cy="192" r="5" fill="#3b82f6" />
                <circle cx="92" cy="194" r="2.5" fill="#3b82f6" />
                <circle cx="120" cy="190" r="3.5" fill="#22c55e" />
              </g>
            ) : config.outfit.includes('head-prefect') || config.outfit.includes('prefect') ? (
              <g>
                {/* Head Prefect Badge: Smart navy blue blazer, gold trim, red prefect shield emblem, gold epaulets */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#1e3a5f" className="transition-all duration-300" />
                {/* White inner shirt & gold tie */}
                <path d="M 80,160 L 120,160 L 100,185 Z" fill="#f8fafc" />
                <path d="M 97,165 L 103,165 L 100,186 Z" fill="#eab308" />
                <path d="M 76,160 L 100,186 L 124,160 Z" fill="#1e293b" />
                {/* Gold epaulets on shoulders */}
                <path d="M 54,160 Q 64,158 74,160 L 70,164 Z" fill="#eab308" />
                <path d="M 146,160 Q 136,158 126,160 L 130,164 Z" fill="#eab308" />
                {/* Smart red shield prefect badge */}
                <path d="M 118,175 L 128,175 L 128,181 L 123,186 L 118,181 Z" fill="#ef4444" stroke="#eab308" strokeWidth="0.8" />
                <path d="M 121,177 Q 123,178 125,177 L 123,183 Z" fill="#eab308" />
              </g>
            ) : config.outfit.includes('shadow-slayer') || config.outfit.includes('slayer') || config.outfit.includes('shadow') ? (
              <g>
                {/* Shadow Slayer Cloak: Midnight violet base coat, sharp silver panels, glowing crimson ruby eye clasp */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#1e1b4b" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,182 Z" fill="#111827" />
                <path d="M 83,160 L 117,160 L 100,175 Z" fill={config.skinTone} />
                {/* Silver trim overlap */}
                <path d="M 55,160 L 75,165 L 65,200 L 45,200 Z" fill="#312e81" stroke="#cbd5e1" strokeWidth="1" />
                <path d="M 145,160 L 125,165 L 135,200 L 155,200 Z" fill="#312e81" stroke="#cbd5e1" strokeWidth="1" />
                {/* Dark leather collar strap and central red jewel clasp */}
                <path d="M 72,165 L 128,165 L 128,171 L 72,171 Z" fill="#111827" />
                <circle cx="100" cy="168" r="5" fill="#ef4444" stroke="#e2e8f0" strokeWidth="1" filter="url(#premiumGlow)" />
                <circle cx="100" cy="168" r="1.5" fill="#ffffff" />
              </g>
            ) : config.outfit.includes('titan-scout') || config.outfit.includes('scout') || config.outfit.includes('titan') ? (
              <g>
                {/* Titan Scout Uniform: Tan military crop jacket, deep dark grey shirt, crossing brown harness straps, scout shield crest */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#374151" className="transition-all duration-300" />
                {/* White inner shirt */}
                <path d="M 85,160 L 115,160 L 100,178 Z" fill="#f8fafc" />
                <path d="M 88,160 L 112,160 L 100,172 Z" fill={config.skinTone} />
                {/* Sand Tan Jacket overlays */}
                <path d="M 54,160 L 78,164 L 70,200 L 45,200 Z" fill="#b45309" />
                <path d="M 146,160 L 122,164 L 130,200 L 155,200 Z" fill="#b45309" />
                {/* Crossing leather harness straps */}
                <path d="M 76,164 L 124,196 M 124,164 L 76,196" stroke="#1f2937" strokeWidth="2.5" />
                <circle cx="100" cy="180" r="3" fill="#9ca3af" />
                {/* Scout Wings Shield crest on left breast */}
                <path d="M 60,172 L 70,172 L 70,178 L 65,182 L 60,178 Z" fill="#f8fafc" stroke="#1d4ed8" strokeWidth="0.8" />
                <path d="M 62,174 C 65,174 68,176 68,178" stroke="#1d4ed8" strokeWidth="0.8" fill="none" />
              </g>
            ) : config.outfit.includes('spirit-samurai') || config.outfit.includes('samurai') || config.outfit.includes('spirit') ? (
              <g>
                {/* Spirit Samurai Armor: Deep purple and dark obsidian lacquer plates, golden chest bindings, white braided sash */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#2e1065" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,180 Z" fill="#dc2626" />
                <path d="M 83,160 L 117,160 L 100,174 Z" fill={config.skinTone} />
                {/* Obsidian Armor Plates with gold lining */}
                <path d="M 65,162 L 100,174 L 135,162 L 138,190 L 100,195 L 62,190 Z" fill="#0f172a" stroke="#eab308" strokeWidth="1" />
                {/* Golden chest crest binding cords */}
                <path d="M 80,164 L 100,172 L 120,164 M 82,176 L 100,184 L 118,176" stroke="#fbbf24" strokeWidth="1" fill="none" />
                {/* Braided white cloth waist belt */}
                <path d="M 46,192 L 154,192 L 155,200 L 45,200 Z" fill="#f8fafc" />
                <path d="M 46,192 Q 60,195 80,192 Q 100,195 120,192 Q 140,195 154,192" stroke="#e2e8f0" strokeWidth="1" fill="none" />
              </g>
            ) : config.outfit.includes('moon-sailor') || config.outfit.includes('moon') ? (
              <g>
                {/* Moon Sailor Outfit: Pure white bodice dress, deep blue sailor collar flaps, red ribbon, golden crescent moon emblem */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#f8fafc" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,180 Z" fill={config.skinTone} />
                {/* Deep Sailor Blue collar flaps */}
                <path d="M 72,160 L 100,180 L 128,160 L 138,160 L 100,190 L 62,160 Z" fill="#1e3a8a" />
                {/* Big bright red chest ribbon bow */}
                <path d="M 90,175 Q 82,165 92,183 L 100,180 Q 108,165 100,183 Z" fill="#ef4444" />
                <circle cx="100" cy="177" r="4.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                {/* Golden crescent moon emblem in centerpiece */}
                <path d="M 99,175 A 1.8,1.8 0 1,1 101,178 A 1.4,1.4 0 0,0 99,175 Z" fill="#ffffff" />
                {/* Sailor red waist ribbon wrap */}
                <path d="M 46,192 L 154,192 L 155,200 L 45,200 Z" fill="#ef4444" />
              </g>
            ) : config.outfit.includes('crystal-mage') ? (
              <g>
                {/* Crystal Mage Robe: Celestial dark violet robes, golden star stitches, glowing cyan crystal amulet */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#4c1d95" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,185 Z" fill="#1e1b4b" />
                <path d="M 83,160 L 117,160 L 100,176 Z" fill={config.skinTone} />
                {/* Gold lapels overlay */}
                <path d="M 75,160 L 100,185 L 125,160 L 132,160 L 100,192 L 68,160 Z" fill="#7c3aed" stroke="#eab308" strokeWidth="1" />
                {/* Glowing turquoise wizard crystal amulet */}
                <line x1="92" y1="160" x2="100" y2="176" stroke="#fbbf24" strokeWidth="1.5" />
                <line x1="108" y1="160" x2="100" y2="176" stroke="#fbbf24" strokeWidth="1.5" />
                <polygon points="100,172 104,177 100,182 96,177" fill="#22d3ee" stroke="#ffffff" strokeWidth="0.8" filter="url(#premiumGlow)" />
                {/* Star constellation highlights on shoulders */}
                <circle cx="62" cy="174" r="1.5" fill="#fef08a" className="animate-pulse" />
                <line x1="62" y1="174" x2="70" y2="182" stroke="#fef08a" strokeWidth="0.5" opacity="0.6" />
                <circle cx="70" cy="182" r="1" fill="#fef08a" />
                <circle cx="138" cy="174" r="1.5" fill="#fef08a" className="animate-pulse" />
              </g>
            ) : config.outfit.includes('speed-flash') || config.outfit.includes('flash') || config.outfit.includes('speed') ? (
              <g>
                {/* Speed Flash Suit: Intense scarlet crimson tech suit, sleek yellow lightning conduits, glowing flash shield emblem */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#991b1b" className="transition-all duration-300" />
                {/* Yellow lightning conduits */}
                <path d="M 55,160 Q 80,180 100,178 Q 120,180 145,160" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
                {/* Glowing flash shield badge */}
                <circle cx="100" cy="176" r="9" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" filter="url(#premiumGlow)" />
                <polygon points="102,169 93,177 99,177 96,183 105,175 99,175" fill="#dc2626" />
                {/* Lightning bolt belt */}
                <path d="M 46,192 L 100,195 L 154,192 L 155,200 L 45,200 Z" fill="#fbbf24" />
              </g>
            ) : config.outfit.includes('green-archer') || config.outfit.includes('archer') || config.outfit.includes('green') ? (
              <g>
                {/* Forest Archer Hood: Rich evergreen hunter jerkin, crossing leather bow strap, golden forest leaf pin */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#14532d" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,180 Z" fill={config.skinTone} />
                {/* Forest cowl hood wrapping neck */}
                <path d="M 75,160 Q 100,175 125,160 L 132,160 Q 100,188 68,160 Z" fill="#166534" />
                {/* Crossing leather brown quiver shoulder straps */}
                <path d="M 58,160 L 142,198 L 138,200 L 54,162 Z" fill="#78350f" />
                {/* Golden leaf pin brooch holding hood cowl */}
                <path d="M 96,168 L 100,164 L 104,168 L 100,172 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
                <line x1="96" y1="168" x2="104" y2="168" stroke="#d97706" strokeWidth="0.5" />
              </g>
            ) : config.outfit.includes('golden-hero') || config.outfit.includes('golden') ? (
              <g>
                {/* Golden Hero Armor: Solid gold plate armor, neon turquoise electric power channels, high-tech golden waist buckle */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#d97706" className="transition-all duration-300" />
                {/* Shiny Gold Plate overlays */}
                <path d="M 62,160 L 100,172 L 138,160 L 140,192 L 100,198 L 60,192 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
                {/* Glowing cyan electric channels */}
                <path d="M 72,166 L 90,176 L 90,190 M 128,166 L 110,176 L 110,190" fill="none" stroke="#22d3ee" strokeWidth="1.5" filter="url(#premiumGlow)" />
                {/* High tech waist belt */}
                <path d="M 46,192 L 154,192 L 155,200 L 45,200 Z" fill="#b45309" />
                <rect x="92" y="190" width="16" height="10" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" rx="1" />
              </g>
            ) : config.outfit.includes('wizard-school') ? (
              <g>
                {/* Wizard School Outfit: Royal purple wizard school robe, striped gold/crimson magic school tie, scrolls crest */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#4c1d95" className="transition-all duration-300" />
                {/* White inner shirt collars */}
                <path d="M 80,160 L 120,160 L 100,185 Z" fill="#f8fafc" />
                {/* Striped red and gold house tie */}
                <path d="M 97,165 L 103,165 L 105,190 L 100,196 L 95,190 Z" fill="#991b1b" />
                <path d="M 96,170 L 104,174 M 95,180 L 105,184 Z" stroke="#fbbf24" strokeWidth="2.5" />
                {/* Robe outer V neck */}
                <path d="M 76,160 L 100,186 L 124,160 L 132,160 L 100,192 L 68,160 Z" fill="#3b0764" />
              </g>
            ) : config.outfit.includes('elf-ranger') || config.outfit.includes('elf') ? (
              <g>
                {/* Elf Ranger Cloak: Sleek forest emerald jerkin, silver lace lining, dynamic forest green leaf chest clasp */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#065f46" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,180 Z" fill={config.skinTone} />
                {/* Silver lace borders along chest */}
                <path d="M 70,160 L 100,186 L 130,160" fill="none" stroke="#cbd5e1" strokeWidth="2.5" />
                <path d="M 75,160 L 100,182 L 125,160" fill="none" stroke="#065f46" strokeWidth="2" />
                {/* Leaf shaped emerald brooch clasp */}
                <path d="M 96,178 C 96,174 100,172 100,172 C 100,172 104,174 104,178 C 104,182 100,184 100,184 C 100,184 96,182 96,178 Z" fill="#10b981" stroke="#cbd5e1" strokeWidth="0.8" />
                <line x1="100" y1="172" x2="100" y2="184" stroke="#cbd5e1" strokeWidth="0.5" />
              </g>
) : config.outfit.includes('dragon-rider') || config.outfit.includes('rider') ? (
              <g>
                {/* Dragon Rider Armor: Hardened crimson dragon scales, obsidian tech rib plates, glowing orange dragon heart core */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#7f1d1d" className="transition-all duration-300" />
                {/* Obsidian Chest armor ribs */}
                <path d="M 64,160 L 100,174 L 136,160 L 140,192 L 100,198 L 60,192 Z" fill="#111827" stroke="#7f1d1d" strokeWidth="1" />
                {/* Layered dragon scale patterns */}
                <path d="M 72,166 Q 85,174 98,166 M 102,166 Q 115,174 128,166 M 68,178 Q 85,188 100,178 Q 115,188 132,178" stroke="#ef4444" strokeWidth="1" fill="none" />
                {/* Glowing orange dragon heart power crystal */}
                <polygon points="100,176 105,182 100,188 95,182" fill="#f97316" stroke="#fef08a" strokeWidth="0.8" filter="url(#premiumGlow)" />
              </g>
            ) : config.outfit.includes('fairy-wings') || config.outfit.includes('fairy') ? (
              <g>
                {/* Sparkle Fairy Wings: Elegant floral green/pink corset dress, matching soft translucent wings draped behind */}
                {/* Fairy wings behind shoulders */}
                <path d="M 55,160 C 25,120 15,165 48,180 Z" fill="#f472b6" opacity="0.5" filter="url(#premiumGlow)" />
                <path d="M 145,160 C 175,120 185,165 152,180 Z" fill="#f472b6" opacity="0.5" filter="url(#premiumGlow)" />
                {/* Corset Bodice */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#22c55e" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,185 Z" fill={config.skinTone} />
                {/* Pink floral wraps */}
                <path d="M 74,160 Q 100,180 126,160 L 134,160 Q 100,192 66,160 Z" fill="#f472b6" />
                <line x1="100" y1="178" x2="100" y2="200" stroke="#f472b6" strokeWidth="1.5" />
              </g>
            ) : config.outfit.includes('knight-armor') || config.outfit.includes('knight') ? (
              <g>
                {/* Royal Knight Armor: Burnished steel chestplate, bold crimson knight's cross crest, polished iron shoulder guards */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#4b5563" className="transition-all duration-300" />
                {/* Heavy steel breastplate plate */}
                <path d="M 64,160 L 100,172 L 136,160 L 140,192 L 100,196 L 60,192 Z" fill="#9ca3af" stroke="#374151" strokeWidth="1" />
                {/* Polished red knight's cross crest on chest */}
                <path d="M 97,166 L 103,166 L 103,178 L 115,178 L 115,184 L 103,184 L 103,194 L 97,194 L 97,184 L 85,184 L 85,178 L 97,178 Z" fill="#dc2626" />
                {/* Steel armor rivets */}
                <circle cx="68" cy="168" r="1.5" fill="#f3f4f6" />
                <circle cx="132" cy="168" r="1.5" fill="#f3f4f6" />
                <circle cx="66" cy="184" r="1.5" fill="#f3f4f6" />
                <circle cx="134" cy="184" r="1.5" fill="#f3f4f6" />
              </g>
            ) : config.outfit.includes('ice-queen') || config.outfit.includes('queen') || config.outfit.includes('ice') ? (
              <g>
                {/* Ice Queen Gown: Shimmering crystal cyan bodice, glittering snowflake chest seal, soft snow fur trim around collar */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#06b6d4" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,185 Z" fill={config.skinTone} />
                {/* Snow fur collar wrap */}
                <path d="M 72,160 Q 100,180 128,160 L 136,160 Q 100,192 64,160 Z" fill="#f8fafc" />
                {/* Shimmering icy blue bodice plate overlay */}
                <path d="M 75,172 L 100,184 L 125,172 L 128,200 L 72,200 Z" fill="#22d3ee" stroke="#e2e8f0" strokeWidth="0.8" />
                {/* Sparkling cyan snowflake emblem */}
                <circle cx="100" cy="186" r="4.5" fill="#ffffff" filter="url(#premiumGlow)" />
                <line x1="96" y1="186" x2="104" y2="186" stroke="#06b6d4" strokeWidth="1" />
                <line x1="100" y1="182" x2="100" y2="190" stroke="#06b6d4" strokeWidth="1" />
                <line x1="97" y1="183" x2="103" y2="189" stroke="#06b6d4" strokeWidth="0.8" />
                <line x1="103" y1="183" x2="97" y2="189" stroke="#06b6d4" strokeWidth="0.8" />
              </g>
            ) : config.outfit.includes('dark-mage') ? (
              <g>
                {/* Dark Mage Robes: Deep purple velvet fabric, ancient glowing violet runic stitches down center */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#311042" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,185 Z" fill="#111827" />
                <path d="M 83,160 L 117,160 L 100,175 Z" fill={config.skinTone} />
                {/* Dark cowl trim */}
                <path d="M 75,160 Q 100,182 125,160 L 132,160 Q 100,192 68,160 Z" fill="#581c87" />
                {/* Glowing violet runes down center */}
                <path d="M 100,176 L 100,196" stroke="#c084fc" strokeWidth="2.5" strokeDasharray="3,3" filter="url(#premiumGlow)" />
              </g>
            ) : config.outfit.includes('explorer-hat') || config.outfit.includes('explorer') ? (
              <g>
                {/* Explorer Archaeologist: Khaki travel shirt, dual crossing dark leather straps, gold compass seal */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#b45309" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,185 Z" fill={config.skinTone} />
                {/* Khaki shirt collar folds */}
                <path d="M 72,160 L 100,178 L 84,160 Z" fill="#d97706" />
                <path d="M 128,160 L 100,178 L 116,160 Z" fill="#d97706" />
                {/* Crossing leather survival harness straps */}
                <path d="M 64,160 L 80,178 L 74,178 L 56,160 Z" fill="#451a03" />
                <path d="M 136,160 L 120,178 L 126,178 L 144,160 Z" fill="#451a03" />
                {/* Gold travel compass medal on breast */}
                <circle cx="118" cy="182" r="5" fill="#facc15" stroke="#451a03" strokeWidth="1" />
                <path d="M 118,179 L 118,185 M 115,182 L 121,182" stroke="#451a03" strokeWidth="0.8" />
              </g>
            ) : config.outfit.includes('secret-agent') || config.outfit.includes('agent') || config.outfit.includes('secret') ? (
              <g>
                {/* Secret Agent Tuxedo: Clean charcoal tuxedo base, sharp white inner collar, elegant black bow tie, red rose badge */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#111827" className="transition-all duration-300" />
                {/* Crisp white inner collar */}
                <path d="M 80,160 L 120,160 L 100,185 Z" fill="#f8fafc" />
                {/* Elegant black silk bow tie */}
                <path d="M 94,168 L 100,173 L 106,168 L 103,178 L 97,178 Z" fill="#1f2937" />
                <circle cx="100" cy="171" r="2.5" fill="#111827" />
                {/* Charcoal double breasted lapels */}
                <path d="M 72,160 L 100,188 L 84,200 L 45,200 Z" fill="#1f2937" />
                <path d="M 128,160 L 100,188 L 116,200 L 155,200 Z" fill="#1f2937" />
                {/* Red rose boutique pin on left chest */}
                <circle cx="76" cy="180" r="3.5" fill="#ef4444" />
                <path d="M 76,180 Q 78,178 76,176 M 76,180 L 76,185" stroke="#22c55e" strokeWidth="1" fill="none" />
              </g>
            ) : config.outfit.includes('kung-fu') || config.outfit.includes('kung') ? (
              <g>
                {/* Kung Fu Master Outfit: Crisp white cotton gi shirt, thick black wrapped belt sash, red circular dragon mark */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,182 Z" fill={config.skinTone} />
                {/* Overlapping white robes wraps */}
                <path d="M 74,160 L 102,200 L 112,200 L 84,160 Z" fill="#f1f5f9" />
                <path d="M 126,160 L 98,200 L 88,200 L 116,160 Z" fill="#f1f5f9" />
                {/* Black master martial arts belt */}
                <path d="M 46,190 L 154,190 L 155,200 L 45,200 Z" fill="#111827" />
                {/* Red circular training seal badge */}
                <circle cx="78" cy="174" r="5.5" fill="#ef4444" />
                <path d="M 76,174 L 80,174 M 78,172 L 78,176" stroke="#ffffff" strokeWidth="1.2" fill="none" />
              </g>
            ) : config.outfit.includes('masked-heist') || config.outfit.includes('heist') || config.outfit.includes('masked') ? (
              <g>
                {/* Masked Heist Suit: Bright crimson jumpsuit body, metallic central zipper details, dark harness buckle straps */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#dc2626" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,185 Z" fill="#111827" />
                <path d="M 83,160 L 117,160 L 100,175 Z" fill={config.skinTone} />
                {/* High tech silver zipper pull down center */}
                <line x1="100" y1="172" x2="100" y2="200" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3,1" />
                <rect x="98.5" y="174" width="3" height="5" fill="#9ca3af" rx="0.5" />
                {/* Crossing black tactical web harness */}
                <path d="M 58,162 L 78,180 M 142,162 L 122,180" stroke="#1f2937" strokeWidth="3" />
                <rect x="74" y="177" width="6" height="5" fill="#111827" />
                <rect x="120" y="177" width="6" height="5" fill="#111827" />
              </g>
            ) : config.outfit.includes('space-explorer') || config.outfit.includes('space') ? (
              <g>
                {/* Space Explorer Suit: Futuristic white astronaut space armor, cyan neon vital control panel, indicator gauges */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" className="transition-all duration-300" />
                {/* Thick dark blue collar neck seal */}
                <path d="M 75,160 Q 100,178 125,160 L 132,160 Q 100,186 68,160 Z" fill="#1e293b" />
                {/* Glowing cyan electronic chest control unit */}
                <rect x="76" y="172" width="48" height="20" fill="#0f172a" stroke="#00e5ff" strokeWidth="1.5" rx="2" filter="url(#premiumGlow)" />
                <rect x="80" y="176" width="12" height="12" fill="#0284c7" rx="1" />
                <circle cx="86" cy="182" r="3.5" fill="#ffffff" />
                <circle cx="102" cy="178" r="2" fill="#ef4444" className="animate-pulse" />
                <circle cx="110" cy="178" r="2" fill="#22c55e" />
                <circle cx="118" cy="178" r="2" fill="#eab308" />
                <line x1="98" y1="186" x2="118" y2="186" stroke="#00e5ff" strokeWidth="1.5" />
              </g>
            ) : config.outfit.includes('jungle-safari') || config.outfit.includes('safari') || config.outfit.includes('jungle') ? (
              <g>
                {/* Jungle Safari Outfit: Khaki olive green safari vest, double chest pockets with gold button tabs, tan undershirt */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#d97706" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,185 Z" fill={config.skinTone} />
                {/* Olive Green vest overlays */}
                <path d="M 54,160 L 78,164 L 70,200 L 45,200 Z" fill="#166534" />
                <path d="M 146,160 L 122,164 L 130,200 L 155,200 Z" fill="#166534" />
                {/* Double utility pockets with gold button details */}
                <rect x="58" y="170" width="14" height="12" fill="#14532d" rx="1" />
                <circle cx="65" cy="173" r="1.5" fill="#fbbf24" />
                <rect x="128" y="170" width="14" height="12" fill="#14532d" rx="1" />
                <circle cx="135" cy="173" r="1.5" fill="#fbbf24" />
                {/* Red bandana tie around neck */}
                <path d="M 90,160 L 100,168 L 110,160 L 100,164 Z" fill="#ef4444" />
                <path d="M 98,165 L 94,175 L 100,170 Z" fill="#ef4444" />
                <path d="M 102,165 L 106,175 L 100,170 Z" fill="#ef4444" />
              </g>
            ) : config.outfit.includes('deep-sea-diver') || config.outfit.includes('diver') || config.outfit.includes('sea') ? (
              <g>
                {/* Deep Sea Diver: Vintage heavy brass diving suit, brass circular viewport chest shield, detailed side bolts and hoses */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#0284c7" className="transition-all duration-300" />
                {/* Brass heavy neck ring */}
                <ellipse cx="100" cy="164" rx="30" ry="8" fill="#d97706" stroke="#b45309" strokeWidth="1" />
                {/* Viewport dome and air valve panels */}
                <circle cx="100" cy="180" r="13" fill="#fbbf24" stroke="#d97706" strokeWidth="2.5" />
                <circle cx="100" cy="180" r="9" fill="#0ea5e9" opacity="0.6" stroke="#ffffff" strokeWidth="1" />
                <line x1="93" y1="174" x2="107" y2="186" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
                {/* Rivet studs along viewport border */}
                <circle cx="100" cy="169" r="1" fill="#78350f" />
                <circle cx="100" cy="191" r="1" fill="#78350f" />
                <circle cx="89" cy="180" r="1" fill="#78350f" />
                <circle cx="111" cy="180" r="1" fill="#78350f" />
                {/* Brass oxygen hose going over shoulders */}
                <path d="M 50,165 Q 60,185 70,165" fill="none" stroke="#d97706" strokeWidth="3" />
                <path d="M 150,165 Q 140,185 130,165" fill="none" stroke="#d97706" strokeWidth="3" />
              </g>
            ) : config.outfit.includes('dino-costume') || config.outfit.includes('dino') ? (
              <g>
                {/* Dino Costume: Vibrant green dinosaur pajamas, soft yellow belly patch, spiky orange plates, cute stitch lines */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#22c55e" className="transition-all duration-300" />
                {/* Big fluffy yellow belly patch */}
                <ellipse cx="100" cy="186" rx="26" ry="14" fill="#fef08a" />
                {/* Spiky orange plates on shoulders */}
                <polygon points="52,160 42,156 46,168" fill="#f97316" />
                <polygon points="148,160 158,156 154,168" fill="#f97316" />
                {/* Center front zip stitch line */}
                <line x1="100" y1="162" x2="100" y2="172" stroke="#15803d" strokeWidth="1.5" strokeDasharray="2,2" />
                {/* Cute black pocket badge mark */}
                <circle cx="80" cy="172" r="3" fill="#f97316" />
                <path d="M 78,172 L 82,172" stroke="#ffffff" strokeWidth="0.8" />
              </g>
            ) : config.outfit.includes('robot-suit') || config.outfit.includes('robot') ? (
              <g>
                {/* Robot Explorer: Retro heavy steel gray panels, detailed tech screen with pulsing neon blue wave, panel screws */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#6b7280" className="transition-all duration-300" />
                {/* Glowing cyan digital heart rate monitor panel */}
                <rect x="76" y="170" width="48" height="20" fill="#111827" stroke="#38bdf8" strokeWidth="1.5" rx="1.5" filter="url(#premiumGlow)" />
                {/* Pulse wave line inside monitor */}
                <path d="M 80,180 L 92,180 L 96,173 L 100,187 L 104,178 L 108,180 L 120,180" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Steel plate panel borders and rivets */}
                <path d="M 55,160 L 145,160 M 52,192 L 148,192" stroke="#374151" strokeWidth="1" />
                <circle cx="60" cy="165" r="1" fill="#111827" />
                <circle cx="140" cy="165" r="1" fill="#111827" />
                <circle cx="58" cy="187" r="1" fill="#111827" />
                <circle cx="142" cy="187" r="1" fill="#111827" />
              </g>
            ) : config.outfit.includes('banana-suit') || config.outfit.includes('banana') ? (
              <g>
                {/* Banana Suit: Big cheerful yellow banana tunic, peeling brown skin folds, custom "BANA-Q" blue sticker */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#eab308" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,185 Z" fill={config.skinTone} />
                {/* Peeling brown/white inner skin folds wrapping neck */}
                <path d="M 72,160 L 88,172 L 68,172 Z" fill="#ca8a04" />
                <path d="M 128,160 L 112,172 L 132,172 Z" fill="#ca8a04" />
                <path d="M 76,160 Q 100,185 124,160 Z" fill="#fef08a" />
                {/* Fun blue "BANA-Q" sticker on left chest */}
                <ellipse cx="78" cy="180" rx="7.5" ry="5.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" transform="rotate(-15 78 180)" />
                <text x="73" y="183" fontSize="6.5" fontWeight="900" fill="#ffffff" transform="rotate(-15 78 180)">B-Q</text>
              </g>
            ) : config.outfit.includes('pizza-hat') || config.outfit.includes('pizza') ? (
              <g>
                {/* Pizza Party Hat: Cheerful triangular pizza body wrapper, melting yellow cheese waves, red pepperonis */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#facc15" className="transition-all duration-300" />
                {/* Toasted brown crust collar */}
                <path d="M 72,160 Q 100,178 128,160 L 138,160 Q 100,192 62,160 Z" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
                {/* Melting yellow cheese drips */}
                <path d="M 75,178 Q 80,188 85,178 Q 90,192 95,178 Q 100,196 105,178 Q 110,188 115,178" fill="none" stroke="#facc15" strokeWidth="4.5" strokeLinecap="round" />
                {/* Red Pepperoni circles */}
                <circle cx="83" cy="182" r="4.5" fill="#dc2626" />
                <circle cx="85" cy="183" r="1.5" fill="#f87171" opacity="0.6" />
                <circle cx="120" cy="182" r="4.5" fill="#dc2626" />
                <circle cx="122" cy="183" r="1.5" fill="#f87171" opacity="0.6" />
                <circle cx="102" cy="192" r="5" fill="#dc2626" />
                <circle cx="104" cy="193" r="1.8" fill="#f87171" opacity="0.6" />
              </g>
            ) : config.outfit.includes('penguin-suit') || config.outfit.includes('penguin') ? (
              <g>
                {/* Penguin Tuxedo: Deep slate black body, pristine white penguin belly patch, cute yellow bowtie, orange beak fold */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#1e293b" className="transition-all duration-300" />
                {/* Big round white belly patch */}
                <ellipse cx="100" cy="184" rx="24" ry="16" fill="#f8fafc" />
                {/* Cute bright yellow bowtie at neck */}
                <path d="M 94,168 L 100,172 L 106,168 L 103,176 L 97,176 Z" fill="#fbbf24" />
                <circle cx="100" cy="170" r="2.5" fill="#d97706" />
              </g>
            ) : config.outfit.includes('ufo-alien') || config.outfit.includes('alien') || config.outfit.includes('ufo') ? (
              <g>
                {/* UFO Alien Suit: Martian lime green tunic, glowing purple center cosmic core, silver metallic flying saucer waist rim */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#22c55e" className="transition-all duration-300" />
                {/* Glowing purple cosmic energy core in center chest */}
                <circle cx="100" cy="176" r="8" fill="#a855f7" stroke="#ffffff" strokeWidth="1" filter="url(#premiumGlow)" />
                <circle cx="100" cy="176" r="3.5" fill="#f0abfc" />
                {/* Silver metallic flying saucer waist rim */}
                <ellipse cx="100" cy="194" rx="55" ry="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                <ellipse cx="100" cy="194" rx="45" ry="3.5" fill="#e2e8f0" />
                {/* Glowing green saucer indicator lights */}
                <circle cx="65" cy="194" r="1.5" fill="#22c55e" className="animate-pulse" />
                <circle cx="82" cy="194" r="1.5" fill="#22c55e" />
                <circle cx="100" cy="194" r="1.5" fill="#22c55e" className="animate-pulse" />
                <circle cx="118" cy="194" r="1.5" fill="#22c55e" />
                <circle cx="135" cy="194" r="1.5" fill="#22c55e" className="animate-pulse" />
              </g>
            ) : config.outfit.includes('cat-onesie') || config.outfit.includes('cat') || config.outfit.includes('onesie') ? (
              <g>
                {/* Cat Onesie: Cuddly orange tabby base, dark orange sleeve stripes, white fluffy chest patch, pink ribbon collar */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#f97316" className="transition-all duration-300" />
                {/* White fluffy chest patch */}
                <ellipse cx="100" cy="186" rx="22" ry="14" fill="#f8fafc" />
                {/* Pink ribbon collar with golden bell */}
                <path d="M 76,160 Q 100,176 124,160" fill="none" stroke="#f472b6" strokeWidth="3" />
                <circle cx="100" cy="170" r="3" fill="#eab308" stroke="#ca8a04" strokeWidth="0.8" />
                {/* Tabby stripes on shoulders */}
                <path d="M 54,170 Q 64,172 70,170 M 52,180 Q 62,182 68,180" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 146,170 Q 136,172 130,170 M 148,180 Q 138,182 132,180" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ) : config.outfit.includes('casual-cool') || config.outfit.includes('casual') ? (
              <g>
                {/* Casual Cool: Stylish cobalt blue jacket overlay, gray crewneck shirt, silver chain bling hanging from neck */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#64748b" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,185 Z" fill={config.skinTone} />
                {/* Grey crewneck inner shirt */}
                <path d="M 76,160 Q 100,182 124,160 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
                {/* Cobalt blue open hoodie jacket layers */}
                <path d="M 54,160 L 78,162 L 68,200 L 45,200 Z" fill="#2563eb" />
                <path d="M 146,160 L 122,162 L 132,200 L 155,200 Z" fill="#2563eb" />
                {/* Silver bead chain bling */}
                <path d="M 88,160 Q 100,176 112,160" fill="none" stroke="#cbd5e1" strokeWidth="1.8" strokeDasharray="3,2" />
              </g>
            ) : config.outfit.includes('royal-prince') || config.outfit.includes('prince') ? (
              <g>
                {/* Royal Prince doublet: Deep velvet purple tunic, elegant gold lace borders, royal crimson shoulder sash, white collar */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#581c87" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,185 Z" fill="#f8fafc" />
                {/* Royal crimson shoulder sash */}
                <path d="M 64,160 L 140,198 L 134,200 L 58,162 Z" fill="#dc2626" stroke="#fbbf24" strokeWidth="1" />
                {/* Gold lace double breasted trim */}
                <path d="M 75,160 L 75,200 M 125,160 L 125,200" stroke="#fbbf24" strokeWidth="1.5" />
                <circle cx="82" cy="172" r="2" fill="#fbbf24" />
                <circle cx="82" cy="186" r="2" fill="#fbbf24" />
                <circle cx="118" cy="172" r="2" fill="#fbbf24" />
                <circle cx="118" cy="186" r="2" fill="#fbbf24" />
              </g>
            ) : config.outfit.includes('royal-princess') || config.outfit.includes('princess') ? (
              <g>
                {/* Royal Princess: Magnificent rose pink ballgown bodice, gold lace filigree, sparkling white diamond necklace */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#ec4899" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,185 Z" fill={config.skinTone} />
                {/* White delicate lace V neck collar */}
                <path d="M 74,160 L 100,182 L 126,160 L 134,160 L 100,190 L 66,160 Z" fill="#fdf2f8" stroke="#f472b6" strokeWidth="0.8" />
                {/* Sparkling diamond crystal necklace */}
                <path d="M 86,160 Q 100,172 114,160" fill="none" stroke="#e2e8f0" strokeWidth="1.8" />
                <polygon points="100,169 103,172 100,175 97,172" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.5" filter="url(#premiumGlow)" />
                {/* Golden lace filigree chest crest */}
                <path d="M 78,184 Q 100,192 122,184 L 122,188 Q 100,196 78,188 Z" fill="#fbbf24" />
              </g>
            ) : config.outfit.includes('rock-star') || config.outfit.includes('rock') ? (
              <g>
                {/* Rock Star: Edgy black motorcycle leather jacket, metallic silver studs, bright red lightning emblem, crewneck */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#1e293b" className="transition-all duration-300" />
                {/* Grey inner shirt */}
                <path d="M 80,160 L 120,160 L 100,185 Z" fill="#475569" />
                <path d="M 83,160 L 117,160 L 100,174 Z" fill={config.skinTone} />
                {/* Bright red electric lightning logo on grey inner shirt */}
                <polygon points="102,166 93,177 99,177 96,183 105,172 99,172" fill="#ef4444" />
                {/* Open black leather jacket overlay folds with silver metal studs */}
                <path d="M 54,160 L 78,163 L 68,200 L 45,200 Z" fill="#0f172a" />
                <path d="M 146,160 L 122,163 L 132,200 L 155,200 Z" fill="#0f172a" />
                <circle cx="62" cy="172" r="1.5" fill="#e2e8f0" />
                <circle cx="60" cy="184" r="1.5" fill="#e2e8f0" />
                <circle cx="138" cy="172" r="1.5" fill="#e2e8f0" />
                <circle cx="140" cy="184" r="1.5" fill="#e2e8f0" />
              </g>
            ) : config.outfit.includes('hip-hop') || config.outfit.includes('hip') ? (
              <g>
                {/* Hip Hop: Street purple oversized hoodie, bold thick drawstrings, giant glowing solid gold dollar chain */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#6d28d9" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,180 Z" fill={config.skinTone} />
                {/* Purple hoodie cowl collar */}
                <path d="M 74,160 Q 100,178 126,160 L 136,160 Q 100,192 64,160 Z" fill="#5b21b6" />
                {/* Giant solid gold dollar medallion chain */}
                <path d="M 86,160 Q 100,176 114,160" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
                <g transform="translate(100, 178) scale(0.7) translate(-100, -178)">
                  <circle cx="100" cy="178" r="9" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" filter="url(#premiumGlow)" />
                  <text x="96" y="184" fontSize="15" fontWeight="900" fill="#b45309">$</text>
                </g>
              </g>
            ) : config.outfit.includes('beach-vibes') || config.outfit.includes('beach') ? (
              <g>
                {/* Beach Vibes: Turquoise Hawaiian vacation shirt, white palm leaves, vibrant red floral lei garland wraps */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#06b6d4" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,185 Z" fill={config.skinTone} />
                {/* White palm tree outlines on shirt */}
                <path d="M 62,168 L 68,174 M 68,174 L 74,168 M 68,174 L 68,188" stroke="#f8fafc" strokeWidth="1" fill="none" opacity="0.6" />
                <path d="M 138,168 L 132,174 M 132,174 L 126,168 M 132,174 L 132,188" stroke="#f8fafc" strokeWidth="1" fill="none" opacity="0.6" />
                {/* Red hibiscus flower lei garland wrap */}
                <path d="M 76,160 Q 100,176 124,160" fill="none" stroke="#ef4444" strokeWidth="3" />
                <circle cx="84" cy="164" r="2.5" fill="#f87171" />
                <circle cx="92" cy="168" r="2.5" fill="#f87171" />
                <circle cx="100" cy="170" r="2.5" fill="#f87171" />
                <circle cx="108" cy="168" r="2.5" fill="#f87171" />
                <circle cx="116" cy="164" r="2.5" fill="#f87171" />
              </g>
            ) : config.outfit.includes('winter-cozy') || config.outfit.includes('winter') ? (
              <g>
                {/* Winter Cozy: Warm gray Nordic cable knit sweater, neat horizontal red and white snowflake diamond patterns */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#475569" className="transition-all duration-300" />
                {/* Warm sweater high neck collar */}
                <path d="M 74,160 Q 100,175 126,160 L 122,154 Q 100,168 78,154 Z" fill="#334155" />
                {/* Nordic red/white patterns */}
                <rect x="52" y="168" width="96" height="6" fill="#ef4444" />
                <path d="M 52,171 L 148,171" stroke="#f8fafc" strokeWidth="1.5" strokeDasharray="3,3" />
                <rect x="54" y="184" width="92" height="4" fill="#f8fafc" />
              </g>
            ) : config.outfit.includes('outfit-veshti') || config.outfit.includes('veshti') ? (
              <g>
                {/* Traditional Royal Veshti: Crisp white silk shirt, diagonal pure gold-bordered traditional angavastram shawl */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,185 Z" fill={config.skinTone} />
                {/* Smart button line */}
                <line x1="100" y1="172" x2="100" y2="200" stroke="#cbd5e1" strokeWidth="1" />
                {/* Gold traditional border draped diagonal angavastram */}
                <path d="M 64,160 L 128,200 L 140,200 L 76,160 Z" fill="#f8fafc" stroke="#ca8a04" strokeWidth="2.5" />
                <path d="M 65,160 L 129,200 M 75,160 L 139,200" stroke="#ca8a04" strokeWidth="0.8" />
                {/* Fine gold link necklace */}
                <path d="M 84,160 Q 100,172 116,160" fill="none" stroke="#eab308" strokeWidth="1.5" />
              </g>
            ) : config.outfit.includes('outfit-saree') || config.outfit.includes('saree') ? (
              <g>
                {/* Traditional Royal Saree: Shimmering magenta/crimson silk wraps, pleated gold borders draped diagonally, royal jewel necklace */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#db2777" className="transition-all duration-300" />
                <path d="M 80,160 L 120,160 L 100,185 Z" fill={config.skinTone} />
                {/* Diagonally draped saree pallu wrap with golden brocade borders */}
                <path d="M 58,160 L 128,200 L 142,200 L 72,160 Z" fill="#be185d" stroke="#ca8a04" strokeWidth="2.5" />
                <path d="M 59,160 L 129,200 M 71,160 L 141,200" stroke="#fbbf24" strokeWidth="0.8" />
                {/* Royal golden emerald necklace */}
                <path d="M 85,160 Q 100,172 115,160" fill="none" stroke="#eab308" strokeWidth="1.8" />
                <circle cx="100" cy="169" r="2.5" fill="#10b981" stroke="#eab308" strokeWidth="0.8" filter="url(#premiumGlow)" />
              </g>
            ) : config.outfit.includes('lunar-festival') || config.outfit.includes('lunar') ? (
              <g>
                {/* Lunar Festival Tang suit: Scarlet red silk tunic, gold frog closure buttons down center line, golden waist sash */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#dc2626" className="transition-all duration-300" />
                {/* Gold collar trim */}
                <path d="M 74,160 Q 100,172 126,160 L 122,154 Q 100,164 78,154 Z" fill="#fbbf24" />
                {/* Golden horizontal frog button loops */}
                <line x1="90" y1="168" x2="110" y2="168" stroke="#fbbf24" strokeWidth="2" />
                <circle cx="100" cy="168" r="2" fill="#ca8a04" />
                <line x1="90" y1="178" x2="110" y2="178" stroke="#fbbf24" strokeWidth="2" />
                <circle cx="100" cy="178" r="2" fill="#ca8a04" />
                <line x1="90" y1="188" x2="110" y2="188" stroke="#fbbf24" strokeWidth="2" />
                <circle cx="100" cy="188" r="2" fill="#ca8a04" />
                {/* Golden belt sash */}
                <path d="M 46,192 L 154,192 L 155,200 L 45,200 Z" fill="#fbbf24" />
              </g>
            ) : config.outfit.includes('summer-champion') || config.outfit.includes('summer') ? (
              <g>
                {/* Summer Champion: Shiny gold track tank top, athletic crimson diagonal shoulder sash, large gold champion coin medal */}
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill="#fbbf24" className="transition-all duration-300" />
                <path d="M 72,160 L 128,160 L 100,190 Z" fill={config.skinTone} />
                {/* Crimson diagonal shoulder athletic sash */}
                <path d="M 64,160 L 138,198 L 134,200 L 58,162 Z" fill="#dc2626" />
                {/* Large gold champion medal on chest */}
                <circle cx="100" cy="178" r="7" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" filter="url(#premiumGlow)" />
                <circle cx="100" cy="178" r="4.5" fill="#d97706" />
                {/* Laurel wreath around collar */}
                <path d="M 80,160 C 84,168 96,168 100,168 C 104,168 116,168 120,160" fill="none" stroke="#22c55e" strokeWidth="2" />
              </g>
            ) : (
              /* Fallback for other premium outfits (Draws their base custom color and V-neck/V-collar) */
              <g>
                <path d="M 55,160 Q 100,145 145,160 L 155,200 L 45,200 Z" fill={
                  config.outfit?.includes('slayer') || config.outfit?.includes('shadow') ? "#1a1a2e" :
                  config.outfit?.includes('titan') ? "#3b4252" :
                  config.outfit?.includes('samurai') || config.outfit?.includes('spirit') ? "#4a1942" :
                  config.outfit?.includes('moon') ? "#312e81" :
                  config.outfit?.includes('crystal') || config.outfit?.includes('mage') ? "#581c87" :
                  config.outfit?.includes('bat') || config.outfit?.includes('dark-bat') ? "#111827" :
                  config.outfit?.includes('iron') ? "#b91c1c" :
                  config.outfit?.includes('shield') || config.outfit?.includes('captain') ? "#1d4ed8" :
                  config.outfit?.includes('wonder') ? "#9f1239" :
                  config.outfit?.includes('speed') || config.outfit?.includes('flash') ? "#dc2626" :
                  config.outfit?.includes('archer') || config.outfit?.includes('green') ? "#166534" :
                  config.outfit?.includes('golden-hero') ? "#d97706" :
                  config.outfit?.includes('wizard') ? "#4c1d95" :
                  config.outfit?.includes('elf') ? "#065f46" :
                  config.outfit?.includes('rider') ? "#7f1d1d" :
                  config.outfit?.includes('fairy') ? "#db2777" :
                  config.outfit?.includes('knight') ? "#6b7280" :
                  config.outfit?.includes('ice') || config.outfit?.includes('queen') ? "#67e8f9" :
                  config.outfit?.includes('explorer') ? "#92400e" :
                  config.outfit?.includes('agent') || config.outfit?.includes('secret') ? "#111827" :
                  config.outfit?.includes('kung') ? "#f8fafc" :
                  config.outfit?.includes('heist') || config.outfit?.includes('masked') ? "#1f2937" :
                  config.outfit?.includes('space') ? "#f8fafc" :
                  config.outfit?.includes('jungle') || config.outfit?.includes('safari') ? "#65a30d" :
                  config.outfit?.includes('diver') || config.outfit?.includes('sea') ? "#0284c7" :
                  config.outfit?.includes('dino') ? "#16a34a" :
                  config.outfit?.includes('robot') ? "#6b7280" :
                  config.outfit?.includes('banana') ? "#eab308" :
                  config.outfit?.includes('pizza') ? "#ea580c" :
                  config.outfit?.includes('penguin') ? "#1e293b" :
                  config.outfit?.includes('ufo') || config.outfit?.includes('alien') ? "#4ade80" :
                  config.outfit?.includes('cat') || config.outfit?.includes('onesie') ? "#f97316" :
                  config.outfit?.includes('jersey') || config.outfit?.includes('sport') ? "#16a34a" :
                  config.outfit?.includes('lab') ? "#f8fafc" :
                  config.outfit?.includes('smock') || config.outfit?.includes('art') ? "#a78bfa" :
                  config.outfit?.includes('prefect') ? "#1e3a5f" :
                  config.outfit?.includes('uniform') ? "#3B82F6" :
                  config.outfit?.includes('veshti') ? "#f8fafc" :
                  config.outfit?.includes('saree') ? "#db2777" :
                  config.outfit?.includes('lunar') ? "#b91c1c" :
                  config.outfit?.includes('summer') ? "#f59e0b" :
                  config.outfit?.includes('casual') ? "#3b82f6" :
                  config.outfit?.includes('prince') ? "#7c3aed" :
                  config.outfit?.includes('princess') ? "#ec4899" :
                  config.outfit?.includes('rock') ? "#1e293b" :
                  config.outfit?.includes('hip') ? "#7c3aed" :
                  config.outfit?.includes('beach') ? "#06b6d4" :
                  config.outfit?.includes('winter') ? "#475569" :
                  "#334155"
                } className="transition-all duration-300" />
                
                {/* Standard Neck Skin cut */}
                <path d="M 80,160 L 120,160 L 100,185 Z" fill={config.skinTone} />
                
                {/* Standard Embellishment V-collar */}
                <path d="M 82,160 L 100,180 L 118,160 L 125,160 L 100,192 L 75,160 Z" fill={
                  config.outfit?.includes('saree') ? "#e11d48" :
                  config.outfit?.includes('spider') ? "#1e40af" :
                  config.outfit?.includes('bat') ? "#facc15" :
                  config.outfit?.includes('thunder') ? "#fbbf24" :
                  config.outfit?.includes('iron') ? "#fbbf24" :
                  config.outfit?.includes('wonder') ? "#fbbf24" :
                  config.outfit?.includes('shield') || config.outfit?.includes('captain') ? "#f8fafc" :
                  config.outfit?.includes('wizard') ? "#a855f7" :
                  config.outfit?.includes('fairy') ? "#f0abfc" :
                  config.outfit?.includes('knight') ? "#d97706" :
                  config.outfit?.includes('ice') || config.outfit?.includes('queen') ? "#a5f3fc" :
                  config.outfit?.includes('dino') ? "#86efac" :
                  config.outfit?.includes('robot') ? "#38bdf8" :
                  config.outfit?.includes('banana') ? "#fef08a" :
                  config.outfit?.includes('penguin') ? "#f8fafc" :
                  config.outfit?.includes('cat') ? "#fcd34d" :
                  config.outfit?.includes('ufo') || config.outfit?.includes('alien') ? "#22c55e" :
                  config.outfit?.includes('slayer') || config.outfit?.includes('shadow') ? "#dc2626" :
                  config.outfit?.includes('moon') ? "#fbbf24" :
                  config.outfit?.includes('veshti') ? "#ca8a04" :
                  config.outfit?.includes('golden') ? "#fbbf24" :
                  config.outfit?.includes('space') ? "#0ea5e9" :
                  config.outfit?.includes('crystal') || config.outfit?.includes('mage') ? "#c084fc" :
                  config.outfit?.includes('titan') ? "#f97316" :
                  config.outfit?.includes('samurai') || config.outfit?.includes('spirit') ? "#dc2626" :
                  config.outfit?.includes('lab') ? "#22c55e" :
                  config.outfit?.includes('lunar') ? "#fbbf24" :
                  config.outfit?.includes('summer') ? "#f97316" :
                  config.outfit?.includes('prince') ? "#fbbf24" :
                  config.outfit?.includes('princess') ? "#f0abfc" :
                  config.outfit?.includes('rock') ? "#f97316" :
                  config.outfit?.includes('hip') ? "#fbbf24" :
                  "#facc15"
                } />
              </g>
            )}
          </g>
        ) : (
          /* NO OUTFIT EQUIPPED (Default School Uniform) */
          <g>
            {/* Male: broad-shoulder trapezoid; Female: hourglass (narrower waist) */}
            <path
              d={isMale
                ? "M 48,160 Q 100,144 152,160 L 158,200 L 42,200 Z"
                : "M 58,160 Q 100,148 142,160 L 148,175 Q 130,180 100,182 Q 70,180 52,175 L 58,160 Z"
              }
              fill={isMale ? "#3B82F6" : "#EC4899"}
              className="transition-all duration-300"
            />
            {/* Female: skirt/hip flare below waist */}
            {!isMale && (
              <path d="M 52,175 Q 70,180 100,182 Q 130,180 148,175 L 155,200 L 45,200 Z" fill="#F9A8D4" />
            )}
            {/* Male: extra lower body fill */}
            {isMale && (
              <path d="M 48,175 Q 100,168 152,175 L 158,200 L 42,200 Z" fill="#2563EB" opacity="0.4" />
            )}
            <path
              d={isMale
                ? "M 78,160 L 122,160 L 100,185 Z"
                : "M 82,160 L 118,160 L 100,182 Z"
              }
              fill={config.skinTone}
            />

            {/* Default Girl Uniform Sailor Bow + Collar */}
            {!isMale && (
              <g>
                <path d="M 74,160 L 100,178 L 126,160 L 118,160 L 100,172 L 82,160 Z" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
                <path d="M 94,178 L 106,178 L 100,185 Z" fill="#EF4444" />
                <circle cx="100" cy="178" r="3" fill="#EF4444" />
                <path d="M 97,178 L 92,192 L 99,186 Z" fill="#EF4444" />
                <path d="M 103,178 L 108,192 L 101,186 Z" fill="#EF4444" />
              </g>
            )}

            {/* Standard Boy Uniform V-collar */}
            {isMale && (
              <path d="M 82,160 L 100,180 L 118,160 L 125,160 L 100,192 L 75,160 Z" fill="#1E3A8A" />
            )}
          </g>
        )}
        </g>

        {/* 2.5 Jacket Overlay */}
        <g stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2.5 : 0} strokeLinejoin="round">
          {config.jacket && (
            <g>
              {config.jacket.includes('cyber') ? (
                <path d="M 50,158 Q 100,150 150,158 L 155,200 L 45,200 Z" fill="none" stroke="#00E5FF" strokeWidth="6" className={mini ? undefined : "animate-pulse"} />
              ) : config.jacket.includes('ninja') ? (
                <path d="M 60,155 L 140,155 L 140,200 L 60,200 Z" fill="#15803d" opacity="0.9" />
              ) : config.jacket.includes('pirate') ? (
                <g>
                  <path d="M 45,155 L 75,160 L 70,200 L 40,200 Z" fill="#7f1d1d" />
                  <path d="M 155,155 L 125,160 L 130,200 L 160,200 Z" fill="#7f1d1d" />
                </g>
              ) : null}
            </g>
          )}
        </g>
      </g>

      {/* HEAD GROUP (scaled up and shifted for Chibi) */}
      <g transform={isChibi ? "translate(100, 105) scale(1.22) translate(-100, -105)" : undefined}>
        {/* 3. Head / Face shape (Default or Overrides) */}
        {!hideDefaultHead ? (
          <g>
            {isCartoon && (
              <>
                {/* Cartoon Head and Ears — Male: wider, squarer; Female: rounder */}
                {/* Ears */}
                <circle cx="56" cy="102" r={isMale ? 8 : 6.5} fill={config.skinTone} stroke="#111" strokeWidth="2.5" />
                <path d={isMale ? "M 56,97 A 4,4 0 0 0 56,107" : "M 56,98 A 3,3 0 0 0 56,106"} fill="none" stroke="#111" strokeWidth="1.2" />
                <circle cx="144" cy="102" r={isMale ? 8 : 6.5} fill={config.skinTone} stroke="#111" strokeWidth="2.5" />
                <path d={isMale ? "M 144,97 A 4,4 0 0 1 144,107" : "M 144,98 A 3,3 0 0 1 144,106"} fill="none" stroke="#111" strokeWidth="1.2" />
                {/* Head shape: male = wide with flat bottom; female = oval/round */}
                {isMale ? (
                  <rect x="58" y="62" width="84" height="76" rx="20" fill={config.skinTone} stroke="#111" strokeWidth="2.5" />
                ) : (
                  <ellipse cx="100" cy="100" rx="40" ry="42" fill={config.skinTone} stroke="#111" strokeWidth="2.5" />
                )}
              </>
            )}
            {isAnime && (
              <>
                {/* === PREMIUM ANIME FACE === */}
                {/* Left ear */}
                <path d="M 63,97 Q 54,95 58,108 Q 62,112 66,105 Z" fill={config.skinTone} />
                <path d="M 64,101 Q 60,101 61,107 Q 63,106 64,101 Z" fill="#000" opacity="0.08" />
                {/* Right ear */}
                <path d="M 137,97 Q 146,95 142,108 Q 138,112 134,105 Z" fill={config.skinTone} />
                <path d="M 136,101 Q 140,101 139,107 Q 137,106 136,101 Z" fill="#000" opacity="0.08" />
                {/* Anime head — gender-distinct shape */}
                {/* Male: wider with squarer jaw; Female: wider cheeks, higher forehead, softer/rounder jaw */}
                <path 
                  d={isMale 
                    ? "M 60,88 C 60,64 76,54 100,54 C 124,54 140,64 140,88 C 140,108 130,125 100,144 C 70,125 60,108 60,88 Z"
                    : "M 62,86 C 62,64 76,53 100,53 C 124,53 138,64 138,86 C 138,105 127,119 100,137 C 73,119 62,105 62,86 Z"
                  }
                  fill={config.skinTone}
                  stroke={isMale ? "#c8a898" : "#c9a0a0"}
                  strokeWidth="0.8"
                />
                {/* Male: subtle jaw squaring overlay */}
                {isMale && (
                  <path d="M 65,115 Q 100,140 135,115 Q 130,130 100,135 Q 70,130 65,115 Z" fill={config.skinTone} opacity="0.6" />
                )}
                {/* Subtle face shading — temple shadows */}
                <path d="M 60,88 C 60,75 65,65 74,58 Q 66,72 63,88 Z" fill="#000" opacity="0.04" />
                <path d={isMale ? "M 140,88 C 140,75 135,65 126,58 Q 134,72 137,88 Z" : "M 138,88 C 138,75 133,65 125,58 Q 132,72 135,88 Z"} fill="#000" opacity="0.04" />
                {/* Cheekbone highlight */}
                <ellipse cx="75" cy="108" rx="7" ry="4" fill="#fff" opacity={isMale ? 0.06 : 0.12} transform="rotate(-15 75 108)" />
                <ellipse cx="125" cy="108" rx="7" ry="4" fill="#fff" opacity={isMale ? 0.06 : 0.12} transform="rotate(15 125 108)" />
                {/* Female: extra soft cheek fill for roundness */}
                {!isMale && (
                  <>
                    <ellipse cx="72" cy="105" rx="10" ry="7" fill={config.skinTone} opacity="0.35" />
                    <ellipse cx="128" cy="105" rx="10" ry="7" fill={config.skinTone} opacity="0.35" />
                  </>
                )}
              </>
            )}
            {isChibi && (
              <>
                {/* Chibi chubby squishy head */}
                <path 
                  d="M 58,90 C 58,68 70,58 100,58 C 130,58 142,68 142,90 C 142,118 126,134 100,134 C 74,134 58,118 58,90 Z"
                  fill={config.skinTone}
                  stroke="#111"
                  strokeWidth="1.8"
                />
              </>
            )}
          </g>
        ) : (
          <g>
            {/* Custom Full-Head Transformations */}
            {isSpider && (
              <g>
                {isCartoon ? (
                  <circle cx="100" cy="100" r="42" fill="#dc2626" stroke="#111" strokeWidth="2.5" />
                ) : isAnime ? (
                  <path 
                    d={isMale 
                      ? "M 58,90 C 58,68 75,58 100,58 C 125,58 142,68 142,90 C 142,108 128,124 100,145 C 72,124 58,108 58,90 Z"
                      : "M 58,90 C 58,68 75,58 100,58 C 125,58 142,68 142,90 C 142,108 126,122 100,140 C 74,122 58,108 58,90 Z"
                    }
                    fill="#dc2626"
                    stroke="#111"
                    strokeWidth="1.2"
                  />
                ) : (
                  <path 
                    d="M 58,90 C 58,68 70,58 100,58 C 130,58 142,68 142,90 C 142,118 126,134 100,134 C 74,134 58,118 58,90 Z"
                    fill="#dc2626"
                    stroke="#111"
                    strokeWidth="1.8"
                  />
                )}
                <g stroke="#111" strokeWidth="1" opacity="0.85" fill="none">
                  <path d="M 100,58 L 100,142" />
                  <path d="M 58,100 L 142,100" />
                  <path d="M 70,70 L 130,130" />
                  <path d="M 70,130 L 130,70" />
                  <path d="M 85,100 A 15,15 0 0,1 100,85 A 15,15 0 0,1 115,100 A 15,15 0 0,1 100,115 A 15,15 0 0,1 85,100" />
                  <path d="M 70,100 A 30,30 0 0,1 100,70 A 30,30 0 0,1 130,100 A 30,30 0 0,1 100,130 A 30,30 0 0,1 70,100" />
                </g>
                <path d="M 68,90 Q 82,90 88,102 Q 78,110 65,98 Z" fill="#fff" stroke="#111" strokeWidth="3" />
                <path d="M 132,90 Q 118,90 112,102 Q 122,110 135,98 Z" fill="#fff" stroke="#111" strokeWidth="3" />
              </g>
            )}

            {isNinja && (
              <g>
                {isCartoon ? (
                  <circle cx="100" cy="100" r="42" fill={config.skinTone} stroke="#111" strokeWidth="2.5" />
                ) : isAnime ? (
                  <path 
                    d={isMale 
                      ? "M 58,90 C 58,68 75,58 100,58 C 125,58 142,68 142,90 C 142,108 128,124 100,145 C 72,124 58,108 58,90 Z"
                      : "M 58,90 C 58,68 75,58 100,58 C 125,58 142,68 142,90 C 142,108 126,122 100,140 C 74,122 58,108 58,90 Z"
                    }
                    fill={config.skinTone}
                    stroke="#111"
                    strokeWidth="1.2"
                  />
                ) : (
                  <path 
                    d="M 58,90 C 58,68 70,58 100,58 C 130,58 142,68 142,90 C 142,118 126,134 100,134 C 74,134 58,118 58,90 Z"
                    fill={config.skinTone}
                    stroke="#111"
                    strokeWidth="1.8"
                  />
                )}
                <path d="M 58,100 A 42,42 0 0,1 142,100 L 138,80 C 120,60 80,60 62,80 Z" fill="#1e293b" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2.5 : 0} />
                <path d="M 66,74 Q 100,67 134,74 L 131,83 Q 100,76 69,83 Z" fill="#ea580c" />
                <circle cx="100" cy="78" r="4.5" fill="#f8fafc" />
                <path d="M 98,78 L 102,78 M 100,76 L 100,80" stroke="#ea580c" strokeWidth="1" />
                <path d="M 66,110 Q 100,122 134,110 L 128,135 Q 100,145 72,135 Z" fill="#1e293b" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2.5 : 0} />
              </g>
            )}

            {isDino && (
              <g>
                <circle cx="100" cy="100" r="43.5" fill="#15803d" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2.5 : 0} />
                <circle cx="100" cy="102" r="33" fill={config.skinTone} stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2 : 0} />
                <circle cx="100" cy="102" r="33" fill="none" stroke="#22c55e" strokeWidth="6" />
                <polygon points="100,56 88,42 96,56" fill="#f97316" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 1.5 : 0} />
                <polygon points="100,56 112,42 104,56" fill="#f97316" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 1.5 : 0} />
                <polygon points="80,63 66,54 78,65" fill="#f97316" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 1.5 : 0} />
                <polygon points="120,63 134,54 122,65" fill="#f97316" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 1.5 : 0} />
              </g>
            )}

            {isBanana && (
              <g>
                <path d="M 58,100 C 58,60 80,45 100,30 C 120,45 142,60 142,100 L 138,125 C 100,145 62,125 58,100 Z" fill="#fbbf24" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2.5 : 0} />
                <circle cx="100" cy="102" r="30" fill={config.skinTone} />
                <ellipse cx="100" cy="102" rx="30" ry="32" fill="none" stroke={isCartoon ? "#111" : "#eab308"} strokeWidth={isCartoon ? 8 : 6} />
                <path d="M 94,36 Q 100,20 106,36 Q 100,38 94,36 Z" fill="#78350f" />
              </g>
            )}

            {isPizza && (
              <g>
                <polygon points="100,42 54,124 146,124" fill="#fbbf24" stroke={isCartoon ? "#111" : "#d97706"} strokeWidth={isCartoon ? 3.5 : 3} />
                <path d="M 50,122 Q 100,132 150,122 L 146,128 Q 100,138 54,128 Z" fill="#b45309" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2.5 : 0} />
                <circle cx="100" cy="102" r="26" fill={config.skinTone} stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2 : 0} />
                <circle cx="100" cy="102" r="26" fill="none" stroke="#facc15" strokeWidth="4" />
                <circle cx="76" cy="102" r="4" fill="#dc2626" />
                <circle cx="124" cy="102" r="4" fill="#dc2626" />
                <circle cx="100" cy="74" r="5" fill="#dc2626" />
              </g>
            )}

            {isPenguin && (
              <g>
                {isCartoon ? (
                  <circle cx="100" cy="100" r="42" fill="#1e293b" stroke="#111" strokeWidth="2.5" />
                ) : isAnime ? (
                  <path 
                    d={isMale 
                      ? "M 58,90 C 58,68 75,58 100,58 C 125,58 142,68 142,90 C 142,108 128,124 100,145 C 72,124 58,108 58,90 Z"
                      : "M 58,90 C 58,68 75,58 100,58 C 125,58 142,68 142,90 C 142,108 126,122 100,140 C 74,122 58,108 58,90 Z"
                    }
                    fill="#1e293b"
                    stroke="#111"
                    strokeWidth="1.2"
                  />
                ) : (
                  <path 
                    d="M 58,90 C 58,68 70,58 100,58 C 130,58 142,68 142,90 C 142,118 126,134 100,134 C 74,134 58,118 58,90 Z"
                    fill="#1e293b"
                    stroke="#111"
                    strokeWidth="1.8"
                  />
                )}
                <path d="M 100,128 C 84,128 72,116 72,98 C 72,82 86,76 100,92 C 114,76 128,82 128,98 C 128,116 116,128 100,128 Z" fill={config.skinTone} stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 1.8 : 0} />
                <polygon points="100,112 96,118 104,118" fill="#f59e0b" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 1 : 0} />
              </g>
            )}

            {isCat && (
              <g>
                {isCartoon ? (
                  <circle cx="100" cy="100" r="42" fill="#f97316" stroke="#111" strokeWidth="2.5" />
                ) : isAnime ? (
                  <path 
                    d={isMale 
                      ? "M 58,90 C 58,68 75,58 100,58 C 125,58 142,68 142,90 C 142,108 128,124 100,145 C 72,124 58,108 58,90 Z"
                      : "M 58,90 C 58,68 75,58 100,58 C 125,58 142,68 142,90 C 142,108 126,122 100,140 C 74,122 58,108 58,90 Z"
                    }
                    fill="#f97316"
                    stroke="#111"
                    strokeWidth="1.2"
                  />
                ) : (
                  <path 
                    d="M 58,90 C 58,68 70,58 100,58 C 130,58 142,68 142,90 C 142,118 126,134 100,134 C 74,134 58,118 58,90 Z"
                    fill="#f97316"
                    stroke="#111"
                    strokeWidth="1.8"
                  />
                )}
                <ellipse cx="100" cy="102" rx="31" ry="31" fill="none" stroke={isCartoon ? "#111" : "#f8fafc"} strokeWidth={isCartoon ? 8 : 5} />
                <circle cx="100" cy="102" r="29" fill={config.skinTone} />
                <path d="M 60,98 L 68,98 M 60,104 L 66,104" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
                <path d="M 140,98 L 132,98 M 140,104 L 134,104" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
                <polygon points="62,68 50,42 78,58" fill="#f97316" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2 : 0} />
                <polygon points="64,66 54,46 76,58" fill="#f472b6" />
                <polygon points="138,68 150,42 122,58" fill="#f97316" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2 : 0} />
                <polygon points="136,66 146,46 124,58" fill="#f472b6" />
              </g>
            )}
          </g>
        )}

        {/* Eyebrows Layer */}
        {!hideEyebrows && (
          <g fill="none">
            {isAnime ? (
              <g fill={config.hairColor} stroke="none">
                {/* Male: bold flat-arc thick brows; Female: thin high-arched pencil brows */}
                {isMale ? (
                  <>
                    {/* Male Left brow — bold, flat, thick */}
                    <path d="M 68,84 Q 79,78 92,82 Q 79,80 68,84 Z" fill={config.hairColor} opacity="0.98" />
                    {/* Male Right brow — bold, flat, thick */}
                    <path d="M 108,82 Q 121,78 132,84 Q 121,80 108,82 Z" fill={config.hairColor} opacity="0.98" />
                  </>
                ) : (
                  <>
                    {/* Female Left brow — thin elegant stroke, high arch */}
                    <path d="M 72,82 Q 80,75 89,80" stroke={config.hairColor} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.92" />
                    {/* Female Right brow — thin elegant stroke, high arch */}
                    <path d="M 111,80 Q 120,75 128,82" stroke={config.hairColor} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.92" />
                  </>
                )}
              </g>
            ) : isCartoon ? (
              <g stroke="#111" strokeWidth="3.2" strokeLinecap="round">
                <path d="M 70,84 Q 80,76 90,81" />
                <path d="M 110,81 Q 120,76 130,84" />
              </g>
            ) : (
              <g stroke="#111" strokeWidth="2.2" strokeLinecap="round">
                <path d="M 73,81 Q 80,76 87,79" />
                <path d="M 113,79 Q 120,76 127,81" />
              </g>
            )}
          </g>
        )}

        {/* 4. Eyes */}
        {!hideEyes && (
          <g>
            {config.eyes === "anime" && (
              <>
                {isAnime ? (
                  <>
                    {/* ── PREMIUM ANIME EYES ── */}
                    {/* Eye socket whites (sclera) */}
                    <ellipse cx="80" cy="93" rx="10.5" ry="9.5" fill="#fff" />
                    <ellipse cx="120" cy="93" rx="10.5" ry="9.5" fill="#fff" />
                    {/* Upper lid arc */}
                    <path d="M 69,93 Q 80,82 91,93" stroke="#1a1a1a" strokeWidth="2.8" fill="none" strokeLinecap="round" />
                    <path d="M 109,93 Q 120,82 131,93" stroke="#1a1a1a" strokeWidth="2.8" fill="none" strokeLinecap="round" />
                    {/* Deep iris */}
                    <ellipse cx="80" cy="95" rx="8.5" ry="10" fill="#1e1b4b" />
                    <ellipse cx="120" cy="95" rx="8.5" ry="10" fill="#1e1b4b" />
                    {/* Inner iris colour layer */}
                    <ellipse cx="80" cy="97" rx="6.5" ry="7" fill="#6366f1" />
                    <ellipse cx="120" cy="97" rx="6.5" ry="7" fill="#6366f1" />
                    {/* Bottom iris shimmer (pink/magenta) */}
                    <ellipse cx="80" cy="100" rx="5" ry="4" fill="#EC4899" opacity="0.55" />
                    <ellipse cx="120" cy="100" rx="5" ry="4" fill="#EC4899" opacity="0.55" />
                    {/* Pupil */}
                    <ellipse cx="80" cy="95" rx="3.5" ry="4.5" fill="#0a0a1a" />
                    <ellipse cx="120" cy="95" rx="3.5" ry="4.5" fill="#0a0a1a" />
                    {/* Primary sparkle highlight */}
                    <circle cx="76.5" cy="89.5" r="3.2" fill="#fff" opacity="0.95" />
                    <circle cx="116.5" cy="89.5" r="3.2" fill="#fff" opacity="0.95" />
                    {/* Secondary sparkle */}
                    <circle cx="84" cy="98" r="1.6" fill="#fff" opacity="0.85" />
                    <circle cx="124" cy="98" r="1.6" fill="#fff" opacity="0.85" />
                    {/* Tiny star sparkle */}
                    <polygon points="78,92 79,90 80,92 79,94" fill="#fff" opacity="0.6" />
                    <polygon points="118,92 119,90 120,92 119,94" fill="#fff" opacity="0.6" />
                    {/* Lower lash line */}
                    <path d="M 70,101 Q 80,104 90,101" stroke="#1a1a1a" strokeWidth="1" fill="none" strokeLinecap="round" />
                    <path d="M 110,101 Q 120,104 130,101" stroke="#1a1a1a" strokeWidth="1" fill="none" strokeLinecap="round" />
                    {/* Female upper lashes */}
                    {!isMale && (
                      <>
                        <path d="M 69,93 Q 66,87 71,85" stroke="#1a1a1a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                        <path d="M 73,90 Q 72,84 77,83" stroke="#1a1a1a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                        <path d="M 109,93 Q 106,87 109,85" stroke="#1a1a1a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                        <path d="M 127,90 Q 128,84 123,83" stroke="#1a1a1a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                      </>
                    )}
                  </>
                ) : isCartoon ? (
                  <>
                    {/* Cartoon Classic Eyes */}
                    <ellipse cx="80" cy="98" rx={7.5} ry={11} fill="#ffffff" stroke="#111" strokeWidth="2.5" />
                    <ellipse cx="120" cy="98" rx={7.5} ry={11} fill="#ffffff" stroke="#111" strokeWidth="2.5" />
                    <ellipse cx="80.5" cy="99" rx={4.5} ry={7.5} fill="#111" />
                    <ellipse cx="120.5" cy="99" rx={4.5} ry={7.5} fill="#111" />
                    <circle cx="78.5" cy="95" r="2.2" fill="#fff" />
                    <circle cx="118.5" cy="95" r="2.2" fill="#fff" />
                  </>
                ) : (
                  <>
                    {/* Chibi Ultra Kawaii Starry Eyes */}
                    <ellipse cx="80" cy="98" rx={10} ry={14} fill="#111" />
                    <ellipse cx="120" cy="98" rx={10} ry={14} fill="#111" />
                    <ellipse cx="80" cy="104" rx={7.5} ry={5.5} fill="#38bdf8" opacity="0.4" />
                    <ellipse cx="120" cy="104" rx={7.5} ry={5.5} fill="#38bdf8" opacity="0.4" />
                    <circle cx="77" cy="93" r="4" fill="#fff" />
                    <circle cx="83.5" cy="102" r="2" fill="#fff" />
                    <circle cx="82.5" cy="95" r="1.2" fill="#fff" />
                    <circle cx="117" cy="93" r="4" fill="#fff" />
                    <circle cx="123.5" cy="102" r="2" fill="#fff" />
                    <circle cx="122.5" cy="95" r="1.2" fill="#fff" />
                    <polygon points="80,103 81.5,104.5 83,103 81.5,101.5" fill="#fff" opacity="0.85" />
                    <polygon points="120,103 121.5,104.5 123,103 121.5,101.5" fill="#fff" opacity="0.85" />
                  </>
                )}
              </>
            )}

            {config.eyes === "cool" && (
              <>
                {isAnime ? (
                  <>
                    {/* Anime cool visor — rainbow gradient sunshield at proper eye level */}
                    <path d="M 68,85 Q 100,77 132,85 L 129,100 Q 100,107 71,100 Z" fill="url(#rainbowGradient)" opacity="0.95" stroke="#111" strokeWidth="1.2" />
                    <path d="M 72,87 L 100,101" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
                    <path d="M 85,85 L 115,100" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
                    {/* Visor reflections */}
                    <circle cx="76" cy="88" r="2" fill="#fff" opacity="0.5" />
                    <circle cx="124" cy="88" r="2" fill="#fff" opacity="0.5" />
                  </>
                ) : isCartoon ? (
                  <>
                    <path d="M 66,90 Q 100,80 134,90 L 130,106 Q 100,114 70,106 Z" fill="#111827" stroke="#111" strokeWidth="2.8" />
                    <polygon points="76,93 94,91 88,104 72,102" fill="#ffffff" opacity="0.75" />
                    <polygon points="106,93 118,91 114,104 102,102" fill="#ffffff" opacity="0.75" />
                  </>
                ) : (
                  <>
                    <path d="M 64,88 Q 100,78 136,88 L 131,108 Q 100,116 69,108 Z" fill="#4f46e5" stroke="#111" strokeWidth="2" />
                    <polygon points="122,92 123.5,94 125,92 123.5,90" fill="#fff" />
                    <polygon points="72,92 73.5,94 75,92 73.5,90" fill="#fff" />
                  </>
                )}
              </>
            )}

            {config.eyes === "cute" && (
              <>
                {isAnime ? (
                  <>
                    {/* Anime cute eyes — large round gems with sclera and lid */}
                    {/* Sclera whites */}
                    <ellipse cx="80" cy="91" rx="10" ry="9" fill="#fff" />
                    <ellipse cx="120" cy="91" rx="10" ry="9" fill="#fff" />
                    {/* Upper lid arc */}
                    <path d="M 70,91 Q 80,81 90,91" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M 110,91 Q 120,81 130,91" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    {/* Iris */}
                    <circle cx="80" cy="93" r="8.5" fill="#2d3748" />
                    <circle cx="120" cy="93" r="8.5" fill="#2d3748" />
                    {/* Iris tint */}
                    <circle cx="80" cy="93" r="6.5" fill="#4a90d9" />
                    <circle cx="120" cy="93" r="6.5" fill="#4a90d9" />
                    {/* Pupil */}
                    <circle cx="80" cy="93" r="3.5" fill="#0a0a1a" />
                    <circle cx="120" cy="93" r="3.5" fill="#0a0a1a" />
                    {/* Sparkle highlights */}
                    <circle cx="76.5" cy="88" r="3.2" fill="#fff" opacity="0.95" />
                    <circle cx="116.5" cy="88" r="3.2" fill="#fff" opacity="0.95" />
                    <circle cx="84" cy="97" r="1.5" fill="#fff" opacity="0.8" />
                    <circle cx="124" cy="97" r="1.5" fill="#fff" opacity="0.8" />
                    {/* Lower lash */}
                    <path d="M 70,99 Q 80,102 90,99" stroke="#1a1a1a" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                    <path d="M 110,99 Q 120,102 130,99" stroke="#1a1a1a" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                  </>
                ) : isCartoon ? (
                  <>
                    <circle cx="82" cy="98" r="8.5" fill="#ffffff" stroke="#111" strokeWidth="2.5" />
                    <circle cx="118" cy="98" r="8.5" fill="#ffffff" stroke="#111" strokeWidth="2.5" />
                    <circle cx="82" cy="98" r="5" fill="#111" />
                    <circle cx="118" cy="98" r="5" fill="#111" />
                    <circle cx="80.5" cy="96" r="1.8" fill="#fff" />
                    <circle cx="116.5" cy="96" r="1.8" fill="#fff" />
                  </>
                ) : (
                  <>
                    <circle cx="82" cy="98" r="11" fill="#1f2937" />
                    <circle cx="118" cy="98" r="11" fill="#1f2937" />
                    <ellipse cx="82" cy="103" rx="7.5" ry="4" fill="#f472b6" opacity="0.4" />
                    <ellipse cx="118" cy="103" rx="7.5" ry="4" fill="#f472b6" opacity="0.4" />
                    <circle cx="79.5" cy="94" r="3.8" fill="#fff" />
                    <circle cx="115.5" cy="94" r="3.8" fill="#fff" />
                    <circle cx="84.5" cy="101" r="1.8" fill="#fff" />
                    <circle cx="120.5" cy="101" r="1.8" fill="#fff" />
                  </>
                )}
              </>
            )}

            {config.eyes === "gamer" && (
              <>
                {isAnime ? (
                  <g filter="url(#premiumGlow)">
                    <rect x="68" y="90" width="26" height="16" rx="4" fill="none" stroke="#00E5FF" strokeWidth="1.5" />
                    <rect x="106" y="90" width="26" height="16" rx="4" fill="none" stroke="#00E5FF" strokeWidth="1.5" />
                    <line x1="94" y1="98" x2="106" y2="98" stroke="#00E5FF" strokeWidth="1.5" />
                    <circle cx="81" cy="98" r="4" fill="none" stroke="#00E5FF" strokeWidth="0.8" />
                    <circle cx="119" cy="98" r="4" fill="none" stroke="#00E5FF" strokeWidth="0.8" />
                    <circle cx="81" cy="98" r="1.5" fill="#00E5FF" />
                    <circle cx="119" cy="98" r="1.5" fill="#00E5FF" />
                    <line x1="77" y1="98" x2="85" y2="98" stroke="#00E5FF" strokeWidth="0.5" />
                    <line x1="81" y1="94" x2="81" y2="102" stroke="#00E5FF" strokeWidth="0.5" />
                    <line x1="115" y1="98" x2="123" y2="98" stroke="#00E5FF" strokeWidth="0.5" />
                    <line x1="119" y1="94" x2="119" y2="102" stroke="#00E5FF" strokeWidth="0.5" />
                  </g>
                ) : isCartoon ? (
                  <>
                    <rect x="68" y="90" width="26" height="16" rx="4" fill="none" stroke="#22c55e" strokeWidth="3" />
                    <rect x="106" y="90" width="26" height="16" rx="4" fill="none" stroke="#22c55e" strokeWidth="3" />
                    <line x1="94" y1="98" x2="106" y2="98" stroke="#22c55e" strokeWidth="3" />
                    <circle cx="81" cy="98" r="3.5" fill="#22c55e" />
                    <circle cx="119" cy="98" r="3.5" fill="#22c55e" />
                  </>
                ) : (
                  <>
                    <rect x="65" y="88" width="28" height="19" rx="8" fill="none" stroke="#a855f7" strokeWidth="2.5" />
                    <rect x="107" y="88" width="28" height="19" rx="8" fill="none" stroke="#a855f7" strokeWidth="2.5" />
                    <line x1="93" y1="97" x2="107" y2="97" stroke="#a855f7" strokeWidth="2.5" />
                    <circle cx="79" cy="97" r="4.5" fill="#d8b4fe" />
                    <circle cx="121" cy="97" r="4.5" fill="#d8b4fe" />
                  </>
                )}
              </>
            )}
          </g>
        )}

        {/* 4.5 Nose */}
        {!hideDefaultHead && (
          <g>
            {isAnime && (
              <g>
                {/* Anime nose — small elegant highlight dot + soft shadow */}
                <path d="M 98,112 Q 100,110 102,112" stroke={config.skinTone === '#FCE3B6' ? '#d4956a' : '#a0623a'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                <circle cx="100" cy="113.5" r="1.2" fill={config.skinTone === '#FCE3B6' ? '#d4956a' : '#a0623a'} opacity="0.6" />
                {/* Nose tip highlight */}
                <circle cx="100" cy="112" r="1.5" fill="#fff" opacity="0.18" />
              </g>
            )}
            {isCartoon && (
              <ellipse cx="100" cy="111" rx="4.5" ry="3.5" fill="#f49b78" stroke="#111" strokeWidth="1.8" />
            )}
            {isChibi && (
              <circle cx="100" cy="112" r="1.8" fill="#f49b78" opacity="0.8" />
            )}
          </g>
        )}

        {/* 5. Mouth & Expression */}
        {!hideMouth && (
          <g>
            {config.expression === "confident" && (
              <>
                {isAnime ? (
                  /* Anime confident — gentle natural smile with subtle lip */
                  <>
                    <path d="M 89,121 Q 100,128 111,121" stroke="#b06070" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    {/* Female: filled rose lips */}
                    {!isMale && (
                      <>
                        <path d="M 91,121 Q 100,117 109,121 Q 100,125 91,121 Z" fill="#E8637A" opacity="0.85" />
                        <path d="M 91,121 Q 100,127 109,121" fill="#D64B6A" opacity="0.5" />
                        <path d="M 94,120 Q 100,118 106,120" stroke="#fff" strokeWidth="0.6" fill="none" opacity="0.45" strokeLinecap="round" />
                      </>
                    )}
                    <path d="M 92,121 Q 100,125 108,121" stroke="#e8a0a8" strokeWidth="0.7" fill="none" strokeLinecap="round" />
                  </>
                ) : isCartoon ? (
                  <>
                    <path d="M 86,118 Q 100,128 114,118" stroke="#111" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                    {!isMale && <path d="M 89,118 Q 100,122 111,118 Q 100,126 89,118 Z" fill="#f472b6" opacity="0.6" />}
                  </>
                ) : (
                  <>
                    <path d="M 88,120 Q 100,126 112,120" stroke="#111" strokeWidth="2.5" fill="none" />
                    {!isMale && <path d="M 91,120 Q 100,124 109,120 Q 100,127 91,120 Z" fill="#f472b6" opacity="0.55" />}
                  </>
                )}
              </>
            )}
            {config.expression === "excited" && (
              <>
                {isAnime ? (
                  /* Anime excited — open mouth with teeth visible */
                  <>
                    {/* Female: lip outline before open mouth */}
                    {!isMale && <path d="M 89,119 Q 100,116 111,119" stroke="#E8637A" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
                    <path d="M 87,119 Q 100,134 113,119 Z" fill={isMale ? "#E11D48" : "#c0304e"} opacity="0.9" />
                    <path d="M 89,120 Q 100,131 111,120" fill="#fff" opacity="0.85" />
                    <path d="M 87,119 Q 100,134 113,119" stroke="#b06070" strokeWidth="1.2" fill="none" />
                    {!isMale && <path d="M 92,120 Q 100,118 108,120" stroke="#fff" strokeWidth="0.6" fill="none" opacity="0.4" strokeLinecap="round" />}
                  </>
                ) : isCartoon ? (
                  <>
                    <path d="M 85,117 Q 100,138 115,117 Z" fill="#E11D48" stroke="#111" strokeWidth="3" />
                    {!isMale && <path d="M 87,117 Q 100,115 113,117" stroke="#f472b6" strokeWidth="2" fill="none" strokeLinecap="round" />}
                  </>
                ) : (
                  <path d="M 86,118 Q 100,135 114,118 Z" fill="#E11D48" stroke="#111" strokeWidth="2" />
                )}
              </>
            )}
            {config.expression === "smirk" && (
              <>
                {isAnime ? (
                  /* Anime smirk — asymmetric confident curve */
                  <>
                    <path d="M 91,122 Q 103,122 110,116" stroke="#b06070" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    {!isMale && (
                      <>
                        <path d="M 93,121 Q 103,121 109,116 Q 103,124 93,121 Z" fill="#E8637A" opacity="0.75" />
                        <path d="M 95,120 Q 103,119 108,116" stroke="#fff" strokeWidth="0.6" fill="none" opacity="0.4" strokeLinecap="round" />
                      </>
                    )}
                  </>
                ) : isCartoon ? (
                  <>
                    <path d="M 90,121 Q 106,121 114,113" stroke="#111" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                    {!isMale && <path d="M 92,121 Q 106,121 113,114 Q 106,124 92,121 Z" fill="#f472b6" opacity="0.55" />}
                  </>
                ) : (
                  <path d="M 92,122 Q 106,122 112,115" stroke="#111" strokeWidth="2.5" fill="none" />
                )}
              </>
            )}
            {config.expression === "focused" && (
              <>
                {isAnime ? (
                  /* Anime focused — straight flat line with slight compression */
                  <line x1="91" y1="121" x2="109" y2="121" stroke="#b06070" strokeWidth="1.8" strokeLinecap="round" />
                ) : isCartoon ? (
                  <line x1="88" y1="120" x2="112" y2="120" stroke="#111" strokeWidth="3.8" strokeLinecap="round" />
                ) : (
                  <line x1="90" y1="120" x2="110" y2="120" stroke="#111" strokeWidth="3" strokeLinecap="round" />
                )}
              </>
            )}
          </g>
        )}

        {/* 5.5 Beard */}
        {!hideBeard && config.beard && (
          <g>
            {config.beard.includes('stubble') ? (
              <path d="M 65,115 Q 100,140 135,115 Q 120,130 100,130 Q 80,130 65,115 Z" fill="#333" opacity="0.6" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 1.5 : 0} />
            ) : config.beard.includes('wizard') ? (
              <path d="M 75,118 L 100,155 L 125,118 Q 120,138 100,140 Q 80,138 75,118 Z" fill="#e2e8f0" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2.5 : 0} />
            ) : config.beard.includes('pirate') ? (
              <path d="M 72,118 C 72,138 85,150 100,150 C 115,150 128,138 128,118 Q 100,140 72,118 Z" fill="#27272a" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2.5 : 0} />
            ) : null}
          </g>
        )}

        {/* 5.6 Glasses (Overlaid) */}
        {!hideGlasses && config.glasses && config.eyes !== "gamer" && config.eyes !== "cool" && (
          <g stroke={config.glasses.includes('cyber') ? "#06b6d4" : "#1e293b"} strokeWidth={isCartoon ? 4.5 : 3} fill="none">
            {config.glasses.includes('mask') ? (
              <path d="M 62,110 L 138,110 L 130,130 L 70,130 Z" fill="#1e293b" stroke="none" />
            ) : (
              <>
                <rect x="68" y="90" width="26" height="16" rx="4" />
                <rect x="106" y="90" width="26" height="16" rx="4" />
                <line x1="94" y1="98" x2="106" y2="98" />
              </>
            )}
          </g>
        )}

        {/* Girl Eyelashes layer — only needed for non-anime (anime handles its own lashes above) */}
        {!hideEyelashes && !isMale && !isAnime && (
          <g stroke="#111" strokeWidth={isCartoon ? 3.2 : 2.2} strokeLinecap="round" fill="none">
            {/* Left Eye lashes */}
            <path d="M 68,96 Q 64,91 70,89" />
            <path d="M 70,91 Q 68,85 75,86" />
            {/* Right Eye lashes */}
            <path d="M 132,96 Q 136,91 130,89" />
            <path d="M 130,91 Q 132,85 125,86" />
          </g>
        )}

        {/* Blush cheeks */}
        {!hideBlush && (
          <g>
            {isAnime ? (
              <>
                {/* Soft oval anime blush — positioned below eyes on cheekbones */}
                <ellipse cx="71" cy="107" rx={isMale ? 9 : 11} ry={isMale ? 5 : 6} fill="#f9a8d4" opacity={isMale ? 0.28 : 0.52} transform="rotate(-8 71 107)" />
                <ellipse cx="129" cy="107" rx={isMale ? 9 : 11} ry={isMale ? 5 : 6} fill="#f9a8d4" opacity={isMale ? 0.28 : 0.52} transform="rotate(8 129 107)" />
                {/* Manga-style diagonal blush lines for females */}
                {!isMale && (
                  <g stroke="#f472b6" strokeWidth="1.4" opacity="0.65" strokeLinecap="round">
                    <path d="M 63,110 L 67,104" />
                    <path d="M 67,111 L 71,105" />
                    <path d="M 71,112 L 75,106" />
                    <path d="M 75,113 L 79,107" />
                    <path d="M 121,107 L 125,113" />
                    <path d="M 125,106 L 129,112" />
                    <path d="M 129,105 L 133,111" />
                    <path d="M 133,104 L 137,110" />
                  </g>
                )}
              </>
            ) : isCartoon ? (
              <>
                <circle cx="68" cy="110" r={isMale ? 5 : 8} fill={isMale ? "#EF4444" : "#f472b6"} opacity={isMale ? 0.18 : 0.35} />
                <circle cx="132" cy="110" r={isMale ? 5 : 8} fill={isMale ? "#EF4444" : "#f472b6"} opacity={isMale ? 0.18 : 0.35} />
              </>
            ) : (
              <>
                {/* Cute large Chibi rosy oval cheeks */}
                <ellipse cx="66" cy="112" rx={isMale ? 9 : 11} ry={isMale ? 5.5 : 7} fill={isMale ? "#EF4444" : "#f472b6"} opacity={isMale ? 0.32 : 0.45} />
                <ellipse cx="134" cy="112" rx={isMale ? 9 : 11} ry={isMale ? 5.5 : 7} fill={isMale ? "#EF4444" : "#f472b6"} opacity={isMale ? 0.32 : 0.45} />
              </>
            )}
          </g>
        )}

        {/* 6. Hairstyle */}
        {!hideHair && (
          <g fill={config.hairColor} stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2.5 : 0} strokeLinejoin="round">
            {config.hairstyle === "spiky" && (
              <>
                <path d="M 52,90 L 40,70 L 60,65 L 50,45 L 75,48 L 78,28 L 100,38 L 118,25 L 126,45 L 148,42 L 138,62 L 158,68 L 144,88 L 140,110 L 135,92 L 120,70 L 100,75 L 80,70 L 62,92 Z" />
                <path d="M 62,80 L 72,92 L 78,82 L 88,96 L 94,84 L 106,96 L 114,83 L 125,92 L 132,80 Z" stroke="none" />
                {isAnime && (
                  <path d="M 58,62 Q 80,50 100,53 Q 120,50 142,62 Q 120,58 100,59 Q 80,58 58,62 Z" fill="#ffffff" opacity="0.3" stroke="none" />
                )}
              </>
            )}

            {config.hairstyle === "long-waves" && (
              <>
                <path d="M 50,90 Q 30,110 32,150 Q 34,180 50,190 Q 42,160 46,120 L 58,80 Q 100,60 142,80 L 154,120 Q 158,160 150,190 Q 166,180 168,150 Q 170,110 150,90 Q 148,60 135,46 Q 100,30 65,46 Q 52,60 50,90 Z" />
                <path d="M 58,80 L 65,95 L 78,92 L 100,85 L 122,92 L 135,95 L 142,80 Q 100,70 58,80 Z" stroke="none" />
                {isAnime && (
                  <>
                    <path d="M 58,80 Q 100,66 142,80 Q 100,73 58,80 Z" fill="#ffffff" opacity="0.25" stroke="none" />
                    <path d="M 36,120 Q 44,140 40,165 Q 40,140 38,125 Z" fill="#ffffff" opacity="0.2" stroke="none" />
                    <path d="M 164,120 Q 156,140 160,165 Q 160,140 162,125 Z" fill="#ffffff" opacity="0.2" stroke="none" />
                  </>
                )}
              </>
            )}

            {config.hairstyle === "undercut" && (
              <>
                <path d="M 60,78 Q 100,50 140,78 L 144,60 Q 138,40 100,32 Q 62,40 56,60 Z" />
                <path d="M 56,68 Q 100,20 148,58 L 135,76 Q 100,45 68,76 Z" stroke="none" />
                <path d="M 50,100 L 60,95 M 48,108 L 56,104" stroke="#FFF" strokeWidth="2.5" opacity="0.3" />
                {isAnime && (
                  <path d="M 66,54 Q 100,38 132,54 Q 100,44 66,54 Z" fill="#ffffff" opacity="0.3" stroke="none" />
                )}
              </>
            )}

            {config.hairstyle === "buns" && (
              <>
                <circle cx="50" cy="42" r="18" />
                <circle cx="150" cy="42" r="18" />
                <path d="M 55,80 Q 100,52 145,80 L 140,90 Q 100,65 60,90 Z" />
                <path d="M 60,82 Q 78,102 85,92 Q 100,108 115,92 Q 122,102 140,82 Z" stroke="none" />
                {isAnime && (
                  <>
                    <path d="M 38,38 A 12,12 0 0 1 62,38 A 12,12 0 0 0 38,38 Z" fill="#ffffff" opacity="0.25" stroke="none" />
                    <path d="M 138,38 A 12,12 0 0 1 162,38 A 12,12 0 0 0 138,38 Z" fill="#ffffff" opacity="0.25" stroke="none" />
                    <path d="M 64,74 Q 100,62 136,74 Q 100,67 64,74 Z" fill="#ffffff" opacity="0.25" stroke="none" />
                  </>
                )}
              </>
            )}

            {config.hairstyle === "classic" && (
              <>
                <path d="M 55,82 Q 100,48 145,82 L 140,100 C 130,76 70,76 60,100 Z" />
                <path d="M 55,82 C 55,62 145,62 145,82 Z" />
                {isAnime && (
                  <path d="M 60,72 Q 100,54 140,72 Q 100,62 60,72 Z" fill="#ffffff" opacity="0.25" stroke="none" />
                )}
              </>
            )}

            {config.hairstyle === "pigtails" && (
              <>
                <path d="M 58,78 Q 100,52 142,78 C 145,95 138,100 135,90 Z" />
                <path d="M 45,75 Q 15,100 20,135 Q 25,115 48,92 Z" />
                <path d="M 155,75 Q 185,100 180,135 Q 175,115 152,92 Z" />
                <circle cx="48" cy="80" r="4" fill="#EF4444" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 1.5 : 0} />
                <circle cx="152" cy="80" r="4" fill="#EF4444" stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 1.5 : 0} />
                {isAnime && (
                  <>
                    <path d="M 62,68 Q 100,54 138,68 Q 100,60 62,68 Z" fill="#ffffff" opacity="0.25" stroke="none" />
                    <path d="M 22,102 C 26,112 28,122 28,128 C 22,122 18,112 22,102 Z" fill="#ffffff" opacity="0.2" stroke="none" />
                    <path d="M 178,102 C 174,112 172,122 172,128 C 178,122 182,112 178,102 Z" fill="#ffffff" opacity="0.2" stroke="none" />
                  </>
                )}
              </>
            )}

            {/* Premium Hairstyles */}
            {config.hairstyle === "classic-hair" && (
              <>
                <path d="M 55,82 Q 100,48 145,82 L 140,100 C 130,76 70,76 60,100 Z" />
                <path d="M 55,82 C 55,62 145,62 145,82 Z" />
                {isAnime && (
                  <path d="M 60,72 Q 100,54 140,72 Q 100,62 60,72 Z" fill="#ffffff" opacity="0.25" stroke="none" />
                )}
              </>
            )}

            {(config.hairstyle === "spiky-hair" || config.hairstyle === "spiky-power") && (
              <g>
                <path d="M 50,88 L 36,65 L 58,60 L 46,38 L 74,42 L 76,20 L 100,32 L 122,17 L 130,40 L 154,36 L 142,58 L 164,63 L 148,85 L 142,108 L 135,88 L 120,64 L 100,69 L 80,64 L 60,88 Z" fill="#00E5FF" opacity="0.35" filter="url(#premiumGlow)" stroke="none" />
                <path d="M 52,90 L 40,70 L 60,65 L 50,45 L 75,48 L 78,28 L 100,38 L 118,25 L 126,45 L 148,42 L 138,62 L 158,68 L 144,88 L 140,110 L 135,92 L 120,70 L 100,75 L 80,70 L 62,92 Z" fill="url(#spikyGradient)" />
                <path d="M 62,80 L 72,92 L 78,82 L 88,96 L 94,84 L 106,96 L 114,83 L 125,92 L 132,80 Z" fill="#FFFFFF" opacity="0.4" stroke="none" />
              </g>
            )}

            {(config.hairstyle === "rainbow-hair" || config.hairstyle === "rainbow-burst") && (
              <g>
                <path d="M 52,90 L 40,70 L 60,65 L 50,45 L 75,48 L 78,28 L 100,38 L 118,25 L 126,45 L 148,42 L 138,62 L 158,68 L 144,88 L 140,110 L 135,92 L 120,70 L 100,75 L 80,70 L 62,92 Z" fill="#F50057" opacity="0.3" filter="url(#premiumGlow)" stroke="none" />
                <path d="M 52,90 L 40,70 L 60,65 L 50,45 L 75,48 L 78,28 L 100,38 L 118,25 L 126,45 L 148,42 L 138,62 L 158,68 L 144,88 L 140,110 L 135,92 L 120,70 L 100,75 L 80,70 L 62,92 Z" fill="url(#rainbowGradient)" />
                <path d="M 62,80 L 72,92 L 78,82 L 88,96 L 94,84 L 106,96 L 114,83 L 125,92 L 132,80 Z" fill="#FFFFFF" opacity="0.35" stroke="none" />
              </g>
            )}

            {config.hairstyle === "crown-braid" && (
              <g>
                <path d="M 55,80 Q 100,52 145,80 L 140,90 Q 100,65 60,90 Z" fill="url(#crownGradient)" />
                {[...Array(8)].map((_, i) => {
                  const cx = 62 + i * 11;
                  const cy = 76 - Math.sin((i / 7) * Math.PI) * 12;
                  return (
                    <g key={i}>
                      <ellipse cx={cx} cy={cy} rx="7" ry="5" transform={`rotate(${-15 + i * 5}, ${cx}, ${cy})`} fill="url(#crownGradient)" stroke={isCartoon ? "#111" : "#8D6E63"} strokeWidth="1" />
                      {i % 2 === 0 && (
                        <circle cx={cx} cy={cy} r="2" fill="#FFE082" filter="url(#premiumGlow)" stroke="none" />
                      )}
                    </g>
                  );
                })}
                <path d="M 58,82 Q 78,102 85,92 Q 100,108 115,92 Q 122,102 140,82 Z" fill="url(#crownGradient)" stroke="none" />
              </g>
            )}

            {config.hairstyle === "flame-hair" && (
              <g>
                <path d="M 54,90 L 38,70 L 62,65 L 48,40 L 76,46 L 76,22 L 100,34 L 124,22 L 124,46 L 152,40 L 138,65 L 162,70 L 146,90 L 142,110 L 135,92 L 120,70 L 100,75 L 80,70 L 62,92 Z" fill="#FF3D00" opacity="0.4" filter="url(#premiumGlow)" stroke="none" />
                <path d="M 52,90 L 40,70 L 60,65 L 50,45 L 75,48 L 78,28 L 100,38 L 118,25 L 126,45 L 148,42 L 138,62 L 158,68 L 144,88 L 140,110 L 135,92 L 120,70 L 100,75 L 80,70 L 62,92 Z" fill="url(#flameGradient)" />
                <path d="M 64,85 L 52,72 L 66,68 L 60,54 L 78,56 L 82,42 L 100,48 L 118,42 L 122,56 L 140,54 L 134,68 L 148,72 L 136,85 Q 100,80 64,85 Z" fill="url(#flameCoreGradient)" stroke="none" />
                {!mini && [
                  { cx: 75, cy: 30, r: 2 },
                  { cx: 100, cy: 15, r: 2.5 },
                  { cx: 125, cy: 25, r: 1.5 },
                  { cx: 90, cy: 22, r: 2 },
                  { cx: 110, cy: 28, r: 1.8 }
                ].map((spark, idx) => (
                  <motion.circle
                    key={idx}
                    cx={spark.cx}
                    cy={spark.cy}
                    r={spark.r}
                    fill="#FFEB3B"
                    stroke="none"
                    animate={{ y: [-5, -25], opacity: [0.9, 0], scale: [1, 1.5] }}
                    transition={{ duration: 1.5 + idx * 0.3, repeat: Infinity, ease: "easeOut" }}
                  />
                ))}
              </g>
            )}

            {(config.hairstyle === "galaxy-hair" || config.hairstyle === "galaxy-waves") && (
              <g>
                <path d="M 50,90 Q 30,110 32,150 Q 34,180 50,190 Q 42,160 46,120 L 58,80 Q 100,60 142,80 L 154,120 Q 158,160 150,190 Q 166,180 168,150 Q 170,110 150,90 Q 148,60 135,46 Q 100,30 65,46 Q 52,60 50,90 Z" fill="#E040FB" opacity="0.3" filter="url(#premiumGlow)" stroke="none" />
                <path d="M 50,90 Q 30,110 32,150 Q 34,180 50,190 Q 42,160 46,120 L 58,80 Q 100,60 142,80 L 154,120 Q 158,160 150,190 Q 166,180 168,150 Q 170,110 150,90 Q 148,60 135,46 Q 100,30 65,46 Q 52,60 50,90 Z" fill="url(#galaxyGradient)" />
                <path d="M 58,80 L 65,95 L 78,92 L 100,85 L 122,92 L 135,95 L 142,80 Q 100,70 58,80 Z" fill="url(#galaxyHighlightGradient)" stroke="none" />
                {!mini && [
                  { cx: 48, cy: 110, r: 1.5 },
                  { cx: 42, cy: 140, r: 1 },
                  { cx: 152, cy: 110, r: 1.5 },
                  { cx: 158, cy: 140, r: 1 },
                  { cx: 70, cy: 60, r: 1.2 },
                  { cx: 100, cy: 45, r: 2 },
                  { cx: 130, cy: 60, r: 1.2 }
                ].map((star, idx) => (
                  <circle
                    key={idx}
                    cx={star.cx}
                    cy={star.cy}
                    r={star.r}
                    fill="#FFF"
                    stroke="none"
                    opacity={0.8}
                    className="animate-pulse"
                    style={{ animationDelay: `${idx * 0.2}s`, animationDuration: '1.5s' }}
                  />
                ))}
              </g>
            )}

            {(config.hairstyle === "ninja-hair" || config.hairstyle === "ninja-spikes") && (
              <g>
                <path d="M 52,90 L 40,70 L 60,65 L 50,45 L 75,48 L 78,28 L 100,38 L 118,25 L 126,45 L 148,42 L 138,62 L 158,68 L 144,88 L 140,110 L 135,92 L 120,70 L 100,75 L 80,70 L 62,92 Z" fill="#E11D48" opacity="0.25" filter="url(#premiumGlow)" stroke="none" />
                <path d="M 52,90 L 40,70 L 60,65 L 50,45 L 75,48 L 78,28 L 100,38 L 118,25 L 126,45 L 148,42 L 138,62 L 158,68 L 144,88 L 140,110 L 135,92 L 120,70 L 100,75 L 80,70 L 62,92 Z" fill="url(#ninjaGradient)" />
                <path d="M 62,80 L 72,92 L 78,82 L 88,96 L 94,84 L 106,96 L 114,83 L 125,92 L 132,80 Z" fill="#90A4AE" opacity="0.4" stroke="none" />
              </g>
            )}

            {config.hairstyle === "afro-power" && (
              <g>
                <circle cx="100" cy="62" r="44" fill="url(#afroGradient)" filter="url(#premiumGlow)" opacity="0.3" stroke="none" />
                <circle cx="100" cy="62" r="40" fill="url(#afroGradient)" />
                {[
                  { cx: 70, cy: 50, r: 15 },
                  { cx: 130, cy: 50, r: 15 },
                  { cx: 65, cy: 75, r: 16 },
                  { cx: 135, cy: 75, r: 16 },
                  { cx: 80, cy: 38, r: 16 },
                  { cx: 120, cy: 38, r: 16 },
                  { cx: 100, cy: 34, r: 18 }
                ].map((curl, idx) => (
                  <circle key={idx} cx={curl.cx} cy={curl.cy} r={curl.r} fill="url(#afroGradient)" stroke={isCartoon ? "#111" : "#5C3A21"} strokeWidth="1" />
                ))}
              </g>
            )}
          </g>
        )}

        {/* 7. Hat / Headgear */}
        <g stroke={isCartoon ? "#111" : "none"} strokeWidth={isCartoon ? 2.5 : 0} strokeLinejoin="round">
          {!hideHat && config.hat && (
            <g>
              {config.hat.includes('straw') ? (
                <>
                  <ellipse cx="100" cy="55" rx="55" ry="15" fill="#fcd34d" />
                  <path d="M 65,55 Q 100,20 135,55 Z" fill="#fbbf24" />
                  <path d="M 68,50 Q 100,60 132,50 L 130,45 Q 100,55 70,45 Z" fill="#ef4444" stroke="none" />
                </>
              ) : config.hat.includes('ninja') ? (
                <path d="M 58,75 Q 100,65 142,75 L 140,60 Q 100,50 60,60 Z" fill="#1e293b" />
              ) : config.hat.includes('crown') ? (
                <path d="M 62,65 L 75,30 L 100,50 L 125,30 L 138,65 Z" fill="#eab308" stroke={isCartoon ? "#111" : "#ca8a04"} strokeWidth={isCartoon ? 2.5 : 2} />
              ) : config.hat.includes('wizard') ? (
                <g>
                  <path d="M 55,68 L 100,10 L 145,68 Z" fill="#311042" />
                  <ellipse cx="100" cy="65" rx="52" ry="10" fill="#3b0764" />
                </g>
              ) : (
                <path d="M 60,65 Q 100,30 140,65 Z" fill="#1e293b" />
              )}
            </g>
          )}
        </g>

        {/* High-Fidelity Astronaut Helmet Overlay (Space explorer) */}
        {isSpace && (
          <g>
            <path d="M 68,135 Q 100,148 132,135 L 126,145 Q 100,156 74,145 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <path d="M 72,138 Q 100,150 128,138 L 124,143 Q 100,154 76,143 Z" fill="#0ea5e9" opacity="0.8" />
            <circle cx="100" cy="100" r="48" fill="url(#spaceHelmetGlow)" stroke="#00e5ff" strokeWidth="2.5" opacity="0.65" filter="url(#premiumGlow)" />
            <ellipse cx="100" cy="98" rx="44" ry="46" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.4" />
            <path d="M 72,72 Q 100,60 128,72" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
            <path d="M 80,78 Q 100,68 120,78" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.3" />
            <circle cx="125" cy="85" r="4" fill="#ffffff" opacity="0.4" />
          </g>
        )}

        {/* High-Fidelity Samurai Kabuto Helmet Overlay (Spirit Samurai) */}
        {isSamurai && (
          <g>
            <path d="M 52,90 C 52,48 74,38 100,38 C 126,38 148,48 148,90 L 145,95 Q 100,105 55,95 Z" fill="#0f172a" stroke="#ca8a04" strokeWidth="1" />
            <path d="M 52,90 Q 38,98 42,112 L 52,108 Q 50,98 56,92 Z" fill="#7f1d1d" stroke="#ca8a04" strokeWidth="1" />
            <path d="M 148,90 Q 162,98 158,112 L 148,108 Q 150,98 144,92 Z" fill="#7f1d1d" stroke="#ca8a04" strokeWidth="1" />
            <path d="M 100,52 C 90,38 72,32 58,36 C 76,46 92,54 100,68 C 108,54 124,46 142,36 C 128,32 110,38 100,52 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" filter="url(#premiumGlow)" />
            <circle cx="100" cy="58" r="5" fill="#ca8a04" stroke="#fbbf24" strokeWidth="1.5" />
            <path d="M 52,94 C 52,112 68,124 100,124 C 132,124 148,112 148,94 L 142,94 Q 100,106 58,94 Z" fill="#dc2626" opacity="0.9" />
            <path d="M 58,102 Q 100,112 142,102" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3,3" />
          </g>
        )}
      </g>

      {/* 8. Prop (Drawn last / in front) */}
      {config.prop && (
        <g className={mini ? undefined : "animate-pulse"} transform={isChibi ? "translate(100, 180) scale(0.8, 0.75) translate(-100, -180)" : undefined}>
          <circle cx="160" cy="160" r="20" fill="url(#faceGlow)" />
          {config.prop.includes('shuriken') && <text x="145" y="170" fontSize="24">⭐</text>}
          {config.prop.includes('cutlass') && <text x="145" y="170" fontSize="24">🗡️</text>}
          {config.prop.includes('wand') && <text x="145" y="170" fontSize="24">🪄</text>}
          {config.prop.includes('saber') && <text x="145" y="170" fontSize="24">⚔️</text>}
          {config.prop.includes('flute') && <text x="145" y="170" fontSize="24">🪈</text>}
          {!config.prop.includes('shuriken') && !config.prop.includes('cutlass') && !config.prop.includes('wand') && !config.prop.includes('saber') && !config.prop.includes('flute') && <text x="145" y="170" fontSize="24">✨</text>}
        </g>
      )}
    </motion.svg>
  );

  if (mini) {
    return content;
  }

  return (
    <div className={`relative w-64 h-64 md:w-80 md:h-80 mx-auto flex items-center justify-center rounded-full p-2 border-4 transition-all duration-500 ${frameBorderClass || "border-transparent"}`}>
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial-gradient from-purple-500/20 via-transparent to-transparent blur-2xl rounded-full pointer-events-none" />

      {/* Aura Effect Layer */}
      {aura && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-3xl opacity-60"
              style={{
                left: `${15 + Math.random() * 70}%`,
                top: `${15 + Math.random() * 70}%`,
              }}
              animate={{
                y: [-25, 25],
                scale: [0.6, 1.1, 0.6],
                opacity: [0.2, 0.7, 0.2],
              }}
              transition={{
                duration: 2.5 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            >
              {aura}
            </motion.div>
          ))}
        </div>
      )}

      {content}

      {/* Floating Pet Companion Display */}
      {pet && (
        <motion.div
          className="absolute -right-2 bottom-6 text-6xl pointer-events-none drop-shadow-lg"
          animate={{ y: [-4, 4, -4], rotate: [-3, 3, -3] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {pet}
        </motion.div>
      )}

      {/* Active Emote overlay icon */}
      {emote && (
        <motion.div
          className="absolute -left-2 top-10 text-5xl bg-black/40 backdrop-blur-md rounded-full w-14 h-14 flex items-center justify-center border border-white/20 shadow-xl"
          animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {emote}
        </motion.div>
      )}
    </div>
  );
}

export default function CharacterCreator({ onBack, onSaved }: CharacterCreatorProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguageStore();
  const isTamil = language === "ta";
  const [config, setConfig] = useState<CharacterConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<"body" | "hair" | "clothing" | "headgear" | "arsenal" | "companions">("body");
  const [saving, setSaving] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);

  // Economy & Inventory state
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]);
  const [coins, setCoins] = useState(0);
  const [gems, setGems] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);

  // Selected item for locked preview details
  const [previewedItem, setPreviewedItem] = useState<Cosmetic | null>(null);

  // Load configuration from database if exists
  useEffect(() => {
    if (profile?.avatar_url) {
      try {
        const parsed = JSON.parse(profile.avatar_url);
        if (parsed.gender) {
          setConfig({ ...DEFAULT_CONFIG, ...parsed });
        }
      } catch (e) {
        // Fallback
      }
    }
  }, [profile]);

  // Load inventory & economy data
  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const [ownedRes, progressRes, transactionsRes] = await Promise.all([
          supabase.from("student_avatar_items").select("item_id, is_equipped").eq("user_id", user.id),
          supabase.from("student_progress").select("xp_earned, score, quiz_id, status").eq("user_id", user.id),
          supabase.from("coin_transactions").select("amount").eq("user_id", user.id),
        ]);

        if (ownedRes.data) {
          setOwnedItemIds(ownedRes.data.map((o) => o.item_id));
        }

        let xp = 0;
        let perfect = 0;
        if (progressRes.data) {
          xp = progressRes.data.reduce((sum, p) => sum + (p.xp_earned || 0), 0);
          progressRes.data.forEach((p) => {
            if (p.quiz_id && p.status === "completed" && p.score && p.score >= 100) {
              perfect++;
            }
          });
        }
        setTotalXP(xp);
        setPerfectCount(perfect);

        const spent = transactionsRes.data?.reduce((sum, t) => sum + t.amount, 0) || 0;
        setCoins(xp + spent);

        // Compute gems including spent gems tracked in avatar_url
        let gemsSpent = 0;
        let gemsAwarded = 0;
        if (profile?.avatar_url) {
          try {
            const parsed = JSON.parse(profile.avatar_url);
            gemsSpent = parsed.gems_spent || 0;
            gemsAwarded = parsed.gems_awarded || 0;
          } catch (e) {}
        }
        const totalGems = Math.floor(xp / 100) + (perfect * 2) + gemsAwarded;
        setGems(Math.max(0, totalGems - gemsSpent));
      } catch (e) {
        console.error("Error loading creator data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user, profile]);

  const isItemOwned = (itemId: string) => {
    const uuid = getStableUuid(itemId);
    return ownedItemIds.includes(uuid) || itemId === "school-uniform" || itemId === "classic-hair";
  };

  const handlePurchaseItem = async (item: Cosmetic) => {
    if (!user) return;
    const costInfo = getItemCostType(item);
    
    if (costInfo.type === 'coins') {
      if (coins < costInfo.amount) {
        toast({
          title: "Not enough Coins! 💰",
          description: `You need ${costInfo.amount - coins} more coins. Complete more lessons and quizzes!`,
          variant: "destructive"
        });
        return;
      }
      
      // Deduct coins
      await supabase.from("coin_transactions").insert({
        user_id: user.id,
        amount: -costInfo.amount,
        description: `Purchased ${item.name} in Character Creator`
      });
      
      setCoins(prev => prev - costInfo.amount);
    } else {
      if (gems < costInfo.amount) {
        toast({
          title: "Not enough Gems! 💎",
          description: `You need ${costInfo.amount - gems} more gems. Complete perfect quizzes!`,
          variant: "destructive"
        });
        return;
      }
      
      // Deduct gems via JSON config update
      const { data: prof } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      
      let parsed: any = {};
      if (prof?.avatar_url) {
        try {
          parsed = JSON.parse(prof.avatar_url);
        } catch (e) {}
      }
      parsed.gems_spent = (parsed.gems_spent || 0) + costInfo.amount;
      
      await supabase
        .from("profiles")
        .update({ avatar_url: JSON.stringify(parsed) })
        .eq("user_id", user.id);
      
      setGems(prev => prev - costInfo.amount);
    }

    // Insert into student_avatar_items
    await supabase.from("student_avatar_items").insert({
      user_id: user.id,
      item_id: getStableUuid(item.id),
      is_equipped: true
    });

    setOwnedItemIds(prev => [...prev, getStableUuid(item.id)]);
    
    // Auto equip in config
    equipItemLocal(item);

    toast({
      title: "Item Unlocked! 🎉",
      description: `You purchased ${item.icon} ${item.name} and equipped it!`,
    });
    setPreviewedItem(null);
  };

  const equipItemLocal = (item: Cosmetic) => {
    // Determine the effective slot. Categories like anime, superhero, fantasy, adventure,
    // funny, school represent outfit types unless they have an explicit different equipSlot.
    const OUTFIT_CATEGORIES = ['outfit', 'anime', 'superhero', 'fantasy', 'adventure', 'funny', 'school'];
    let slot = item.equipSlot || item.category;
    // If the item's category is an outfit-type category and it has no explicit equipSlot,
    // treat it as an outfit
    if (!item.equipSlot && OUTFIT_CATEGORIES.includes(item.category)) {
      slot = 'outfit';
    }
    setConfig(prev => {
      const next = { ...prev };
      if (slot === 'outfit') next.outfit = item.id;
      else if (slot === 'jacket') next.jacket = item.id;
      else if (slot === 'hat') next.hat = item.id;
      else if (slot === 'glasses') next.glasses = item.id;
      else if (slot === 'prop') next.prop = item.id;
      else if (slot === 'backpack') next.backpack = item.id;
      else if (slot === 'beard') next.beard = item.id;
      else if (slot === 'pet') next.pet = item.id;
      else if (slot === 'aura') next.aura = item.id;
      else if (slot === 'background') next.background = item.id;
      else if (slot === 'frame') next.frame = item.id;
      else if (slot === 'pose') next.pose = item.id;
      else if (slot === 'hairstyle') next.hairstyle = item.id;
      return next;
    });
  };

  const handleSelectCosmetic = (item: Cosmetic) => {
    if (isItemOwned(item.id)) {
      equipItemLocal(item);
      setPreviewedItem(null);
    } else {
      // Temporarily equip for live preview
      equipItemLocal(item);
      setPreviewedItem(item);
    }
  };

  const handleRemoveCosmetic = (slot: keyof CharacterConfig) => {
    setConfig(prev => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
    setPreviewedItem(null);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Synchronize gems values inside the updated JSON
      const { data: prof } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      
      let gemsSpent = 0;
      let gemsAwarded = 0;
      if (prof?.avatar_url) {
        try {
          const parsed = JSON.parse(prof.avatar_url);
          gemsSpent = parsed.gems_spent || 0;
          gemsAwarded = parsed.gems_awarded || 0;
        } catch (e) {}
      }

      const finalConfig = {
        ...config,
        gems_spent: gemsSpent,
        gems_awarded: gemsAwarded
      };

      const avatarString = JSON.stringify(finalConfig);
      
      // Save config to profiles table
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarString })
        .eq("user_id", user.id);

      if (error) throw error;

      // Reset is_equipped for all items of the user
      await supabase.from("student_avatar_items")
        .update({ is_equipped: false })
        .eq("user_id", user.id);

      // Extract current equipped items UUIDs
      const equippedItemIds = [
        config.outfit,
        config.jacket,
        config.hat,
        config.glasses,
        config.prop,
        config.backpack,
        config.beard,
        config.pet,
        config.aura,
        config.background,
        config.frame,
        config.pose
      ].filter(Boolean).map(id => getStableUuid(id!));

      if (equippedItemIds.length > 0) {
        await supabase.from("student_avatar_items")
          .update({ is_equipped: true })
          .eq("user_id", user.id)
          .in("item_id", equippedItemIds);
      }

      toast({
        title: "Character Saved! 🏆",
        description: "Your hero character configuration has been loaded into the lobby.",
      });
      if (onSaved) onSaved();
      onBack();
    } catch (e) {
      console.error(e);
      toast({
        title: "Saving failed",
        description: "Could not save character options. Please check connection.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const tabs = [
    { id: "body" as const, label: isTamil ? "உடல்" : "Body", icon: UserCheck },
    { id: "hair" as const, label: isTamil ? "முடி" : "Hair", icon: RefreshCw },
    { id: "clothing" as const, label: isTamil ? "ஆடைகள்" : "Clothing", icon: Smile },
    { id: "headgear" as const, label: isTamil ? "தலைக்கவசம்" : "Headgear", icon: Flame },
    { id: "arsenal" as const, label: isTamil ? "உபகரணங்கள்" : "Arsenal", icon: Sparkles },
    { id: "companions" as const, label: isTamil ? "தோழர்கள்" : "Companions", icon: Sparkles },
  ];

  // Helper lists of categories
  // Only include items whose effective equip slot is 'outfit' (either via equipSlot or by category default)
  const outfits = ALL_COSMETICS.filter(i => {
    const effectiveSlot = i.equipSlot || i.category;
    if (effectiveSlot !== 'outfit' && effectiveSlot !== 'school' && effectiveSlot !== 'anime' && effectiveSlot !== 'superhero' && effectiveSlot !== 'fantasy' && effectiveSlot !== 'adventure' && effectiveSlot !== 'funny') return false;
    // Exclude items that explicitly equip to a non-outfit slot
    if (i.equipSlot && i.equipSlot !== 'outfit') return false;
    return true;
  });
  const jackets = ALL_COSMETICS.filter(i => i.category === 'jacket' || i.equipSlot === 'jacket');
  const hats = ALL_COSMETICS.filter(i => i.category === 'hat' || i.equipSlot === 'hat');
  const glasses = ALL_COSMETICS.filter(i => i.category === 'glasses' || i.equipSlot === 'glasses');
  const props = ALL_COSMETICS.filter(i => i.category === 'prop' || i.equipSlot === 'prop');
  const backpacks = ALL_COSMETICS.filter(i => i.category === 'backpack' || i.equipSlot === 'backpack');
  const beards = ALL_COSMETICS.filter(i => i.category === 'beard' || i.equipSlot === 'beard');
  const hairstylesList = ALL_COSMETICS.filter(i => i.category === 'hairstyle');
  const petsList = ALL_COSMETICS.filter(i => i.category === 'pet');
  const aurasList = ALL_COSMETICS.filter(i => i.category === 'aura');
  const backgroundsList = ALL_COSMETICS.filter(i => i.category === 'background');
  const framesList = ALL_COSMETICS.filter(i => i.category === 'frame');
  const posesList = ALL_COSMETICS.filter(i => i.category === 'pose');

  // ── Lobby Background Preview Gradient Map ──
  const getLobbyBgStyle = (bgId?: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      'bg-school': { background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 40%, #a5f3fc 100%)' },
      'bg-library': { background: 'linear-gradient(135deg, #78350f 0%, #92400e 30%, #b45309 60%, #d97706 100%)' },
      'bg-space': { background: 'linear-gradient(135deg, #0f0c29 0%, #1a0533 40%, #302b63 70%, #24243e 100%)' },
      'bg-jungle': { background: 'linear-gradient(135deg, #052e16 0%, #14532d 40%, #166534 70%, #15803d 100%)' },
      'bg-cyberpunk': { background: 'linear-gradient(135deg, #1a0533 0%, #0d0d2b 40%, #1e003f 70%, #0d1b4b 100%)' },
      'bg-castle': { background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #3730a3 70%, #4338ca 100%)' },
      'bg-forest': { background: 'linear-gradient(135deg, #052e16 0%, #064e3b 50%, #065f46 100%)' },
    };
    return map[bgId || 'bg-school'] || map['bg-school'];
  };

  // ── Tiny Hair SVG Preview for hairstyle cards ──
  const HairPreviewSVG = ({ hairstyleId, hairColor, skinTone, size = 56 }: { hairstyleId: string; hairColor: string; skinTone: string; size?: number }) => (
    <svg viewBox="0 0 60 60" width={size} height={size}>
      <defs>
        <radialGradient id="prevFaceGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={skinTone} stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id="prevGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="prevSpiky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#1A237E" />
        </linearGradient>
        <linearGradient id="prevRainbow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF007F" />
          <stop offset="50%" stopColor="#FFEB3B" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
        <linearGradient id="prevCrown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="100%" stopColor="#795548" />
        </linearGradient>
        <linearGradient id="prevFlame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFEB3B" />
          <stop offset="50%" stopColor="#FF9800" />
          <stop offset="100%" stopColor="#D84315" />
        </linearGradient>
        <linearGradient id="prevGalaxy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4A148C" />
          <stop offset="50%" stopColor="#311B92" />
          <stop offset="100%" stopColor="#006064" />
        </linearGradient>
        <linearGradient id="prevNinja" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#37474F" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        <radialGradient id="prevAfro" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#A1887F" />
          <stop offset="100%" stopColor="#3E2723" />
        </radialGradient>
      </defs>

      {/* Face background aura glow */}
      {['classic-hair','spiky-hair','spiky-power','rainbow-hair','rainbow-burst','crown-braid','flame-hair','galaxy-hair','galaxy-waves','ninja-hair','ninja-spikes','afro-power'].includes(hairstyleId) && (
        <circle cx="30" cy="34" r="16" fill="url(#prevFaceGlow)" filter="url(#prevGlow)" />
      )}

      {/* Face */}
      <circle cx="30" cy="34" r="16" fill={skinTone} />
      <circle cx="30" cy="38" r="1.2" fill="#00000022" />
      <ellipse cx="24" cy="32" rx="2.5" ry="3" fill="#111" />
      <ellipse cx="36" cy="32" rx="2.5" ry="3" fill="#111" />
      <circle cx="23" cy="31" r="0.9" fill="#fff" />
      <circle cx="35" cy="31" r="0.9" fill="#fff" />
      <path d="M25,40 Q30,44 35,40" stroke="#33333380" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Hair */}
      <g fill={hairColor}>
        {hairstyleId === 'spiky' && (
          <>
            <path d="M14,30 L9,20 L17,19 L14,10 L22,14 L24,8 L30,12 L36,7 L38,14 L45,11 L43,20 L50,21 L45,30 L42,32 L36,24 L30,26 L24,24 L18,32 Z" />
            <path d="M18,27 L22,30 L24,26 L26,30 L30,27 L34,30 L37,26 L40,30 L42,27 Z" />
          </>
        )}
        {hairstyleId === 'long-waves' && (
          <>
            <path d="M14,30 Q8,38 9,50 Q10,56 14,58 Q10,48 13,38 L16,26 Q30,18 44,26 L47,38 Q50,48 46,58 Q50,56 51,50 Q52,38 46,30 Q44,18 40,14 Q30,8 20,14 Q16,18 14,30 Z" />
            <path d="M16,26 L18,30 L22,28 L30,26 L38,28 L42,30 L44,26 Q30,20 16,26 Z" />
          </>
        )}
        {hairstyleId === 'undercut' && (
          <>
            <path d="M16,26 Q30,12 44,26 L46,20 Q42,10 30,8 Q18,10 14,20 Z" />
            <path d="M14,22 Q30,6 46,20 L43,26 Q30,14 17,26 Z" />
          </>
        )}
        {hairstyleId === 'buns' && (
          <>
            <circle cx="14" cy="14" r="7" />
            <circle cx="46" cy="14" r="7" />
            <path d="M16,28 Q30,16 44,28 L42,32 Q30,20 18,32 Z" />
          </>
        )}
        {hairstyleId === 'classic' && (
          <>
            <path d="M15,28 Q30,14 45,28 L43,34 Q36,24 24,24 L17,34 Z" />
            <path d="M15,28 Q15,18 45,18 L45,28 Z" />
          </>
        )}
        {hairstyleId === 'pigtails' && (
          <>
            <path d="M17,26 Q30,14 43,26 L42,30 L18,30 Z" />
            <path d="M13,26 Q4,34 6,46 Q8,38 14,30 Z" />
            <path d="M47,26 Q56,34 54,46 Q52,38 46,30 Z" />
            <circle cx="15" cy="27" r="2" fill="#ef4444" />
            <circle cx="45" cy="27" r="2" fill="#ef4444" />
          </>
        )}
        
        {/* Premium hairstyles */}
        {hairstyleId === 'classic-hair' && (
          <path d="M15,28 Q30,14 45,28 L43,34 Q36,24 24,24 L17,34 Z" />
        )}
        
        {(hairstyleId === 'spiky-hair' || hairstyleId === 'spiky-power') && (
          <g>
            <path d="M10,28 L6,12 L15,16 L12,4 L22,10 L24,4 L30,9 L36,4 L38,10 L48,4 L45,16 L54,12 L50,28 Z" fill="url(#prevSpiky)" filter="url(#prevGlow)" />
            <path d="M14,25 L18,28 L22,24 L26,28 L30,24 L34,28 L38,24 L42,28 L46,25 Z" fill="#fff" opacity="0.25" />
          </g>
        )}
        
        {(hairstyleId === 'rainbow-hair' || hairstyleId === 'rainbow-burst') && (
          <g>
            <path d="M10,28 L6,12 L15,16 L12,4 L22,10 L24,4 L30,9 L36,4 L38,10 L48,4 L45,16 L54,12 L50,28 Z" fill="url(#prevRainbow)" />
            <path d="M14,25 L18,28 L22,24 L26,28 L30,24 L34,28 L38,24 L42,28 L46,25 Z" fill="#fff" opacity="0.3" />
          </g>
        )}
        
        {hairstyleId === 'crown-braid' && (
          <g>
            <path d="M14,24 Q30,10 46,24 L44,28 Q30,16 16,28 Z" fill="url(#prevCrown)" />
            {[...Array(6)].map((_, i) => (
              <ellipse key={i} cx={16 + i * 6} cy={22} rx="3" ry="2" fill="url(#prevCrown)" stroke="#8D6E63" strokeWidth="0.8" />
            ))}
          </g>
        )}
        
        {hairstyleId === 'flame-hair' && (
          <g>
            <path d="M14,28 L10,14 L18,18 L16,6 L24,12 L26,5 L30,10 L34,5 L36,12 L44,6 L42,18 L50,14 L46,28 Z" fill="url(#prevFlame)" filter="url(#prevGlow)" />
            <path d="M16,26 L20,18 L24,22 L28,14 L32,22 L36,18 L40,26 Z" fill="#FFEB3B" opacity="0.6" />
          </g>
        )}
        
        {(hairstyleId === 'galaxy-hair' || hairstyleId === 'galaxy-waves') && (
          <g>
            <path d="M14,30 Q8,40 9,52 Q10,58 14,60 Q10,50 13,40 L16,26 Q30,18 44,26 L47,40 Q50,50 46,60 Q50,58 51,52 Q52,40 46,30 Q44,18 40,14 Q30,8 20,14 Q16,18 14,30 Z" fill="url(#prevGalaxy)" />
            <path d="M16,26 L18,30 L22,28 L30,26 L38,28 L42,30 L44,26 Q30,20 16,26 Z" fill="#FFC107" opacity="0.3" />
            {/* Stars */}
            <circle cx="28" cy="18" r="0.7" fill="#fff" />
            <circle cx="34" cy="22" r="0.5" fill="#fff" />
            <circle cx="16" cy="40" r="0.6" fill="#fff" />
            <circle cx="44" cy="40" r="0.6" fill="#fff" />
          </g>
        )}
        
        {(hairstyleId === 'ninja-hair' || hairstyleId === 'ninja-spikes') && (
          <g>
            <path d="M12,30 L8,16 L16,20 L14,8 L22,14 L24,8 L30,12 L36,8 L38,14 L46,8 L44,20 L52,16 L48,30 Z" fill="url(#prevNinja)" />
            <path d="M14,27 L18,30 L22,26 L26,30 L30,27 L34,30 L38,26 L42,30 L46,27 Z" fill="#607D8B" opacity="0.4" />
          </g>
        )}
        
        {hairstyleId === 'afro-power' && (
          <g>
            <circle cx="30" cy="22" r="13" fill="url(#prevAfro)" filter="url(#prevGlow)" />
            {[
              { cx: 20, cy: 19, r: 5 },
              { cx: 40, cy: 19, r: 5 },
              { cx: 18, cy: 26, r: 5.5 },
              { cx: 42, cy: 26, r: 5.5 },
              { cx: 24, cy: 14, r: 5.5 },
              { cx: 36, cy: 14, r: 5.5 },
              { cx: 30, cy: 12, r: 6 }
            ].map((curl, idx) => (
              <circle key={idx} cx={curl.cx} cy={curl.cy} r={curl.r} fill="url(#prevAfro)" stroke="#5C3A21" strokeWidth="0.4" />
            ))}
          </g>
        )}
        
        {/* fallback */}
        {!['spiky','long-waves','undercut','buns','classic','pigtails','classic-hair','spiky-hair','spiky-power','rainbow-hair','rainbow-burst','crown-braid','flame-hair','galaxy-hair','galaxy-waves','ninja-hair','ninja-spikes','afro-power'].includes(hairstyleId) && (
          <path d="M15,28 Q30,14 45,28 L43,34 Q36,24 24,24 L17,34 Z" />
        )}
      </g>
    </svg>
  );

  // ── Reusable AAA Game Style Cosmetic Card ──
  const CosmeticStoreCard = ({ 
    item, 
    equipped, 
    onClick 
  }: { 
    item: Cosmetic; 
    equipped: boolean; 
    onClick: () => void; 
  }) => {
    const owned = isItemOwned(item.id);
    const cost = getItemCostType(item);
    
    // Dynamic style tokens based on Rarity
    const rarityColorClass = item.rarity === 'legendary' ? 'text-amber-500 bg-amber-500/10 border-amber-500/25'
      : item.rarity === 'mythic' ? 'text-rose-500 bg-rose-500/10 border-rose-500/25 animate-pulse'
      : item.rarity === 'epic' ? 'text-purple-500 bg-purple-500/10 border-purple-500/25'
      : item.rarity === 'rare' ? 'text-blue-500 bg-blue-500/10 border-blue-500/25'
      : 'text-slate-500 bg-slate-500/10 border-slate-500/25';
      
    const rarityGlow = item.rarity === 'legendary' ? 'shadow-[0_0_15px_rgba(245,158,11,0.22)] border-amber-500/50' 
      : item.rarity === 'mythic' ? 'shadow-[0_0_20px_rgba(244,63,94,0.25)] border-rose-500/50 animate-pulse'
      : item.rarity === 'epic' ? 'shadow-[0_0_15px_rgba(168,85,247,0.22)] border-purple-500/50'
      : item.rarity === 'rare' ? 'shadow-[0_0_10px_rgba(59,130,246,0.15)] border-blue-500/40'
      : 'border-border/30';
      
    const activeBg = equipped 
      ? 'bg-gradient-to-b from-purple-500/15 to-purple-500/2 border-purple-500'
      : 'bg-card/45 hover:bg-card/75 border-border/30 hover:border-purple-500/25';
      
    return (
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.04, y: -4 }}
        whileTap={{ scale: 0.95 }}
        className={`rounded-2xl border-2 text-xs font-bold transition-all duration-300 relative flex flex-col items-center justify-between overflow-hidden min-h-[132px] ${activeBg} ${equipped ? rarityGlow : ''} w-full`}
      >
        {/* Rarity top indicator bar */}
        <div className={`w-full h-1 ${
          item.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
          item.rarity === 'mythic' ? 'bg-gradient-to-r from-rose-500 to-pink-500 animate-pulse' :
          item.rarity === 'epic' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500' :
          item.rarity === 'rare' ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
          'bg-gradient-to-r from-gray-400 to-gray-500'
        }`} />
        
        {/* Card Content */}
        <div className="flex flex-col items-center w-full p-2 pt-3 flex-1 justify-center">
          {/* Rarity capsule tag */}
          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border mb-1.5 ${rarityColorClass}`}>
            {item.rarity}
          </span>
          
          <div className="text-3xl filter drop-shadow-md mb-1 transition-transform duration-300 group-hover:scale-110">
            {item.icon}
          </div>
          
          <span className="font-extrabold text-[11px] text-center px-1 leading-tight text-foreground line-clamp-1">{getCosmeticName(item, isTamil)}</span>
        </div>

        {/* Price / Ownership Tag Bar */}
        <div className="w-full flex items-center justify-center gap-1 py-1.5 px-2 mt-auto border-t border-border/10 bg-black/10">
          {owned ? (
            <span className={equipped 
              ? "text-purple-500 dark:text-purple-300 font-extrabold text-[9px] uppercase tracking-wider flex items-center gap-0.5" 
              : "text-muted-foreground font-black text-[9px] uppercase tracking-wider"
            }>
              {equipped ? (isTamil ? "பயன்பாட்டில் ✓" : "Equipped ✓") : (isTamil ? "உள்ளது" : "Owned")}
            </span>
          ) : (
            <span className={equipped
              ? "text-amber-500 dark:text-amber-300 font-black text-[9.5px] uppercase tracking-widest flex items-center gap-0.5 animate-pulse"
              : "font-extrabold text-[10px] text-foreground flex items-center gap-0.5"
            }>
              {equipped ? (isTamil ? "✨ அணிந்து பார் ✨" : "✨ Try On ✨") : <>{cost.type === 'gems' ? '💎' : '🪙'} {cost.amount}</>}
            </span>
          )}
        </div>
        
        {/* Sleek Corner Padlock Overlay */}
        {!owned && (
          <div className="absolute top-2 right-2 bg-amber-500/90 text-white rounded-full p-1.5 shadow-md z-20 border border-white/20">
            <Lock className="w-2.5 h-2.5" />
          </div>
        )}
        
        {/* Sparkling star particles inside legendary/mythic cards */}
        {['legendary', 'mythic'].includes(item.rarity) && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
            <div className="absolute top-4 left-4 w-1 h-1 rounded-full bg-yellow-300 animate-ping" />
            <div className="absolute bottom-6 right-6 w-1 h-1 rounded-full bg-amber-400 animate-ping" style={{ animationDelay: '0.6s' }} />
          </div>
        )}
      </motion.button>
    );
  };

  // ── Unified Default Empty/None Option Button ──
  const DefaultOptionCard = ({ 
    label, 
    emoji, 
    active, 
    onClick 
  }: { 
    label: string; 
    emoji: string; 
    active: boolean; 
    onClick: () => void; 
  }) => {
    return (
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.96 }}
        className={`rounded-2xl border-2 border-dashed p-3 text-xs font-bold transition-all duration-300 relative flex flex-col items-center justify-center min-h-[132px] w-full ${
          active 
            ? "border-purple-500 bg-purple-500/10 text-foreground shadow-lg shadow-purple-500/5" 
            : "border-border/30 bg-card/25 hover:bg-card/60 hover:border-purple-500/25 text-muted-foreground hover:text-foreground"
        }`}
      >
        <span className="text-3xl mb-2 filter drop-shadow-sm">{emoji}</span>
        <span className="font-extrabold text-[11px] text-center leading-tight">{label}</span>
        {active && (
          <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest mt-1">{isTamil ? "செயலில் ✓" : "Active ✓"}</span>
        )}
      </motion.button>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-foreground">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-sm tracking-wider text-muted-foreground uppercase">{isTamil ? "தனிப்பயனாக்கப் பொருட்களை ஒத்திசைக்கிறது..." : "Syncing customization inventory..."}</p>
      </div>
    );
  }

  // Get active pet and aura icons
  const activePetIcon = ALL_COSMETICS.find(c => c.id === config.pet)?.icon;
  const activeAuraIcon = ALL_COSMETICS.find(c => c.id === config.aura)?.icon;

  return (
    <div className="min-h-screen bg-transparent text-foreground p-4 md:p-6 pb-40 md:pb-6 relative overflow-hidden">
      {/* Decorative cyber grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(128,128,128,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(128,128,128,0.04)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none opacity-50" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header HUD */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 w-full">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl px-3 sm:px-4 shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" /> {isTamil ? "முகப்பு" : "Lobby"}
            </Button>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 250, damping: 20 }}
              className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-cyan-500 to-fuchsia-500 bg-clip-text text-transparent uppercase tracking-wider text-gradient-flow text-center shrink-0"
            >
              {isTamil ? "அவதார் கலைஞர்" : "Character Creator"}
            </motion.h1>
          </div>

          {/* Currency HUD */}
          <div className="flex items-center justify-center gap-4 bg-card/70 backdrop-blur-md border border-border/40 px-4 py-2 rounded-2xl w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <span>🪙</span>
              <span className="font-black text-amber-600 dark:text-amber-300 text-sm">{coins.toLocaleString()}</span>
            </div>
            <div className="h-4 w-[1px] bg-border/60" />
            <div className="flex items-center gap-1.5">
              <span>💎</span>
              <span className="font-black text-purple-600 dark:text-purple-300 text-sm">{gems.toLocaleString()}</span>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold text-white shadow-lg shadow-emerald-500/25 rounded-xl px-6 h-11 btn-bounce-hover btn-glow-pulse"
            style={{ '--glow-color': 'rgba(16, 185, 129, 0.4)' } as React.CSSProperties}
          >
            {saving ? "..." : <><Save className="w-4 h-4 mr-2" /> {isTamil ? "அவதாரைச் சேமி" : "Save Character"}</>}
          </Button>
        </div>

        {/* Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* LEFT: Rendering Preview */}
          {/* LEFT: Rendering Preview */}
          <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
            className="lg:col-span-5 relative flex flex-col justify-between overflow-hidden shadow-2xl rounded-3xl border border-border/40 min-h-[500px]"
          >
            {/* Dynamic lobby background preview */}
            <div
              className="absolute inset-0 transition-all duration-700"
              style={getLobbyBgStyle(config.background)}
            />
            {/* Overlay for premium contrast & glassmorphism details */}
            <div className="absolute inset-0 bg-black/25 backdrop-blur-[0.5px]" />

            {/* Cyber scanline overlay for futuristic themes */}
            {['bg-cyberpunk', 'bg-space'].includes(config.background || '') && (
              <div className="absolute inset-0 bg-[linear-gradient(rgba(128,128,128,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none opacity-40 z-10 animate-[pulse_6s_infinite]" />
            )}

            {/* Animated background particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              {(config.background === 'bg-space' || !config.background) && (
                [...Array(18)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-white"
                    style={{ left: `${(i * 17 + 5) % 95}%`, top: `${(i * 23 + 3) % 90}%` }}
                    animate={{ opacity: [0.1, 0.9, 0.1], scale: [0.5, 1.2, 0.5] }}
                    transition={{ duration: 1.5 + (i % 4) * 0.5, repeat: Infinity, delay: i * 0.12 }}
                  />
                ))
              )}
              {config.background === 'bg-library' && (
                [...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-yellow-300"
                    style={{ left: `${(i * 19 + 8) % 90}%`, top: `${(i * 31 + 5) % 85}%` }}
                    animate={{ y: [-8, 8, -8], opacity: [0.2, 0.7, 0.2] }}
                    transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.2 }}
                  />
                ))
              )}
              {config.background === 'bg-jungle' && (
                [...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-lg"
                    style={{ left: `${(i * 22 + 5) % 88}%`, top: `${(i * 13 + 10) % 80}%` }}
                    animate={{ rotate: [-10, 10, -10], y: [-5, 5, -5], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3 + (i % 3), repeat: Infinity, ease: "easeInOut" }}
                  >🍃</motion.div>
                ))
              )}
              {config.background === 'bg-cyberpunk' && (
                [...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-px w-full opacity-20"
                    style={{ top: `${15 + i * 18}%`, background: i % 2 === 0 ? '#d946ef' : '#22d3ee' }}
                    animate={{ opacity: [0.05, 0.25, 0.05], scaleX: [0.8, 1, 0.8] }}
                    transition={{ duration: 2 + i, repeat: Infinity }}
                  />
                ))
              )}
              {config.background === 'bg-castle' && (
                [...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-indigo-300"
                    style={{ left: `${(i * 21 + 6) % 92}%`, top: `${(i * 17 + 4) % 88}%` }}
                    animate={{ y: [-12, 0, -12], opacity: [0.1, 0.6, 0.1] }}
                    transition={{ duration: 2.5 + (i % 4) * 0.4, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))
              )}
              {config.background === 'bg-school' && (
                [...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-sm"
                    style={{ left: `${(i * 25 + 5) % 88}%`, top: `${(i * 20 + 8) % 80}%` }}
                    animate={{ y: [-10, 10, -10], rotate: [0, 180, 360], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 3 + i * 0.3, repeat: Infinity }}
                  >⭐</motion.div>
                ))
              )}
            </div>



            {/* Active background badge */}
            <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-xl border border-white/10 shadow-lg uppercase tracking-wider">
              🏞️ {backgroundsList.find(b => b.id === config.background)?.name || 'EduSpark Campus'}
            </div>

            {/* Preview Column Area — restructured to prevent purchase/rotation collapse */}
            <div className="relative z-10 flex-1 flex flex-col items-center pt-8 px-6 overflow-hidden">
              
              {/* Immersive 3D Locker Perspective zoom and rotation container */}
              <div className="flex-1 w-full flex items-center justify-center min-h-0">
                <motion.div
                  animate={{ scale: zoom, rotateY: rotation }}
                  transition={{ type: "spring", stiffness: 150, damping: 20 }}
                  style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                  className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing max-h-[280px]"
                >
                  <CharacterSVG config={config} pet={activePetIcon} aura={activeAuraIcon} />
                </motion.div>
              </div>

              {/* 3D Locker Navigation HUD Overlay (Zoom Controls) — right side, clear of bottom panels */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40">
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-8 h-8 rounded-xl bg-black/60 hover:bg-black/80 border border-white/15 text-white backdrop-blur-md shadow-lg shadow-black/30 transition-all font-bold hover:scale-105 text-sm"
                  onClick={() => setZoom(prev => Math.min(prev + 0.15, 1.6))}
                  title="Zoom In"
                >
                  ＋
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-8 h-8 rounded-xl bg-black/60 hover:bg-black/80 border border-white/15 text-white backdrop-blur-md shadow-lg shadow-black/30 transition-all font-bold hover:scale-105 text-xs"
                  onClick={() => { setZoom(1); setRotation(0); }}
                  title="Reset Angle"
                >
                  🔄
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-8 h-8 rounded-xl bg-black/60 hover:bg-black/80 border border-white/15 text-white backdrop-blur-md shadow-lg shadow-black/30 transition-all font-bold hover:scale-105 text-sm"
                  onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.85))}
                  title="Zoom Out"
                >
                  －
                </Button>
              </div>

              {/* Bottom controls — stacked properly: rotate bar, then purchase overlay */}
              <div className="w-full flex flex-col gap-2 pb-3 mt-auto shrink-0 z-30">
                {/* 3D Rotate Navigation HUD Bar */}
                <div className="flex items-center justify-between bg-black/55 border border-white/10 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRotation(prev => prev - 45)}
                    className="text-xs font-black text-cyan-400 hover:text-cyan-300 hover:bg-white/5 px-2.5 py-1 h-auto rounded-lg transition-all"
                  >
                    {isTamil ? "◀ சுழற்று" : "◀ ROTATE"}
                  </Button>
                  <div className="text-[9px] text-white/70 font-mono tracking-wider uppercase font-bold select-none">
                    {isTamil ? "கோணம்: " : "Angle: "}{rotation}° | {isTamil ? "பெரிதாக்கு: " : "Zoom: "}{Math.round(zoom * 100)}%
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRotation(prev => prev + 45)}
                    className="text-xs font-black text-cyan-400 hover:text-cyan-300 hover:bg-white/5 px-2.5 py-1 h-auto rounded-lg transition-all"
                  >
                    {isTamil ? "சுழற்று ▶" : "ROTATE ▶"}
                  </Button>
                </div>

                {/* Buy & Equip Purchase Dialog — always visible below rotate bar, never collapsed */}
                <AnimatePresence>
                  {previewedItem && (
                    <motion.div 
                      initial={{ opacity: 0, y: 12, scale: 0.95 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                      className="w-full bg-card/95 border border-amber-500/40 rounded-2xl p-3.5 flex flex-col items-center text-center shadow-2xl backdrop-blur-md relative"
                    >
                      {/* Rarity Border Glow */}
                      <div className={`absolute inset-0 rounded-2xl border pointer-events-none opacity-40 ${
                        previewedItem.rarity === 'legendary' ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse' :
                        previewedItem.rarity === 'mythic' ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse' :
                        previewedItem.rarity === 'epic' ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]' :
                        previewedItem.rarity === 'rare' ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' :
                        'border-slate-500'
                      }`} />
                      
                      {/* Compact Preview Info + Purchase CTA in row layout */}
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <motion.div
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="shrink-0"
                          >
                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                          </motion.div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-lg shrink-0">{previewedItem.icon}</span>
                            <span className="font-black text-xs text-foreground uppercase tracking-wide truncate">{getCosmeticName(previewedItem, isTamil)}</span>
                          </div>
                        </div>
                        
                        {/* Purchase CTA Button */}
                        <Button
                          onClick={() => handlePurchaseItem(previewedItem)}
                          className="shrink-0 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black rounded-xl h-9 px-4 flex items-center justify-center gap-1.5 text-xs btn-bounce-hover btn-glow-pulse"
                          style={{ '--glow-color': 'rgba(245, 158, 11, 0.5)' } as React.CSSProperties}
                        >
                          {getItemCostType(previewedItem).type === 'coins' ? (
                            <><Coins className="w-3.5 h-3.5" /> {getItemCostType(previewedItem).amount} {isTamil ? "நாணயங்கள்" : "Coins"}</>
                          ) : (
                            <>💎 {getItemCostType(previewedItem).amount} {isTamil ? "ரத்தினங்கள்" : "Gems"}</>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Customize Style Toggle */}
            <div className="relative z-20 flex flex-wrap justify-center gap-2 p-4 pt-0 bg-black/20 border-t border-white/5">
              <Button
                variant={config.style === "anime" ? "default" : "outline"}
                onClick={() => setConfig((c) => ({ ...c, style: "anime" }))}
                className={`flex-1 min-w-[90px] rounded-xl font-bold text-xs md:text-sm transition-all ${
                  config.style === "anime" 
                    ? "bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-lg shadow-fuchsia-600/25 border-transparent" 
                    : "border-border/50 text-foreground hover:bg-muted"
                }`}
              >
                {isTamil ? "அனிம் பயன்முறை ⚔️" : "Anime Mode ⚔️"}
              </Button>
              <Button
                variant={config.style === "cartoon" ? "default" : "outline"}
                onClick={() => setConfig((c) => ({ ...c, style: "cartoon" }))}
                className={`flex-1 min-w-[90px] rounded-xl font-bold text-xs md:text-sm transition-all ${
                  config.style === "cartoon" 
                    ? "bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-lg shadow-fuchsia-600/25 border-transparent" 
                    : "border-border/50 text-foreground hover:bg-muted"
                }`}
              >
                {isTamil ? "கார்ட்டூன் பயன்முறை 🎨" : "Cartoon Mode 🎨"}
              </Button>
              <Button
                variant={config.style === "chibi" ? "default" : "outline"}
                onClick={() => setConfig((c) => ({ ...c, style: "chibi" }))}
                className={`flex-1 min-w-[90px] rounded-xl font-bold text-xs md:text-sm transition-all ${
                  config.style === "chibi" 
                    ? "bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-lg shadow-fuchsia-600/25 border-transparent" 
                    : "border-border/50 text-foreground hover:bg-muted"
                }`}
              >
                {isTamil ? "சிபி பயன்முறை 🧸" : "Chibi Mode 🧸"}
              </Button>
            </div>
          </motion.div>

          {/* RIGHT: Customizer Options */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.2 }}
            className="lg:col-span-7 bg-card/60 backdrop-blur-md border border-border/40 p-6 rounded-3xl flex flex-col shadow-xl"
          >
            {/* Customizer Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border/50 mb-6 scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.93 }}
                    className={`flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/45"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </motion.button>
                );
              })}
            </div>

            {/* Customizer Options Content */}
            <div className="flex-1 overflow-y-auto max-h-[50vh] pr-2">
              <AnimatePresence mode="wait">
                
                {/* ── TAB 1: BODY ── */}
                {activeTab === "body" && (
                  <motion.div
                    key="body"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "பாலினம்" : "Model Gender"}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setConfig((c) => ({ ...c, gender: "male", hairstyle: ['long-waves', 'buns', 'pigtails', 'crown-braid', 'galaxy-hair', 'galaxy-waves'].includes(c.hairstyle) ? 'spiky' : c.hairstyle }))}
                          className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                            config.gender === "male"
                              ? "border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20 text-foreground"
                              : "border-border/40 bg-card/40 hover:bg-card/85 text-foreground"
                          }`}
                        >
                          <span className="text-4xl">👦</span>
                          <span className="font-black text-xs">{isTamil ? "ஆண் அவதார்" : "Boy Avatar"}</span>
                        </button>
                        <button
                          onClick={() => setConfig((c) => ({ ...c, gender: "female", hairstyle: ['spiky', 'spiky-hair', 'spiky-power', 'undercut'].includes(c.hairstyle) ? 'long-waves' : c.hairstyle }))}
                          className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                            config.gender === "female"
                              ? "border-fuchsia-500 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-500/20 text-foreground"
                              : "border-border/40 bg-card/40 hover:bg-card/85 text-foreground"
                          }`}
                        >
                          <span className="text-4xl">👧</span>
                          <span className="font-black text-xs">{isTamil ? "பெண் அவதார்" : "Girl Avatar"}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "தோல் நிறம்" : "Skin Tone"}</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {SKIN_TONES.map((tone) => (
                          <button
                            key={tone.value}
                            onClick={() => setConfig((c) => ({ ...c, skinTone: tone.value }))}
                            className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                              config.skinTone === tone.value 
                                ? "border-amber-500 scale-105" 
                                : "border-border/40 bg-card/40 hover:bg-card/80"
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full border border-black/25" style={{ backgroundColor: tone.value }} />
                            <span className="text-[10px] font-bold">{isTamil && (tone as any).label_ta ? (tone as any).label_ta : tone.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "கண்கள்" : "Eyes Lens"}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {EYE_STYLES.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setConfig((c) => ({ ...c, eyes: style.id }))}
                            className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${
                              config.eyes === style.id
                                ? "border-pink-500 bg-pink-500/10 text-foreground"
                                : "border-border/40 bg-card/40 hover:bg-card/80"
                            }`}
                          >
                            {isTamil && (style as any).label_ta ? (style as any).label_ta : style.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "வாய் பாவம்" : "Mouth Expression"}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {EXPRESSIONS.map((exp) => (
                          <button
                            key={exp.id}
                            onClick={() => setConfig((c) => ({ ...c, expression: exp.id }))}
                            className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${
                              config.expression === exp.id
                                ? "border-indigo-500 bg-indigo-500/10 text-foreground"
                                : "border-border/40 bg-card/40 hover:bg-card/80"
                            }`}
                          >
                            {isTamil && (exp as any).label_ta ? (exp as any).label_ta : exp.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {config.gender === "male" && (
                      <div>
                        <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "தாடி / மீசை" : "Beard / Facial Hair"}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <button
                            onClick={() => handleRemoveCosmetic("beard")}
                            className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${
                              !config.beard ? "border-amber-500 bg-amber-500/10" : "border-border/40 bg-card/40 hover:bg-card/80"
                            }`}
                          >
                            {isTamil ? "இல்லை 🪒" : "None 🪒"}
                          </button>
                          {beards.map((b) => {
                            const owned = isItemOwned(b.id);
                            const equipped = config.beard === b.id;
                            return (
                              <button
                                key={b.id}
                                onClick={() => handleSelectCosmetic(b)}
                                className={`p-3 rounded-xl border-2 text-xs font-bold transition-all relative flex flex-col items-center justify-center gap-1 ${
                                  equipped ? "border-amber-500 bg-amber-500/10" : "border-border/40 bg-card/40 hover:bg-card/80"
                                }`}
                              >
                                <span className="text-xl">{b.icon}</span>
                                <span>{getCosmeticName(b, isTamil)}</span>
                                {!owned && <Lock className="absolute top-1.5 right-1.5 w-3 h-3 text-amber-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── TAB 2: HAIR ── */}
                {activeTab === "hair" && (
                  <motion.div
                    key="hair"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "அடிப்படை தலைமுடி" : "Basic Hairstyle"}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {HAIR_STYLES.map((style) => (
                          <motion.button
                            key={style.id}
                            onClick={() => setConfig((c) => ({ ...c, hairstyle: style.id }))}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className={`p-2 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${
                              config.hairstyle === style.id
                                ? "border-purple-500 bg-purple-500/15 shadow-lg shadow-purple-500/20 text-foreground"
                                : "border-border/40 bg-card/40 hover:bg-card/80 hover:border-purple-300/50"
                            }`}
                          >
                            <HairPreviewSVG hairstyleId={style.id} hairColor={config.hairColor} skinTone={config.skinTone} size={52} />
                            <span className="text-[10px] font-black truncate max-w-full">{isTamil && (style as any).label_ta ? (style as any).label_ta : style.label}</span>
                            {config.hairstyle === style.id && <span className="text-[8px] font-black text-purple-500 uppercase tracking-wider">{isTamil ? "செயலில் ✓" : "Active ✓"}</span>}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "பிரீமியம் தலைமுடி ஆடைகள்" : "Premium Hairstyle Cosmetics"}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {hairstylesList.map((h) => {
                          const owned = isItemOwned(h.id);
                          const equipped = config.hairstyle === h.id;
                          const cost = getItemCostType(h);
                          
                          // Dynamic style tokens based on Rarity
                          const rarityColorClass = h.rarity === 'legendary' ? 'text-amber-500 bg-amber-500/10 border-amber-500/25'
                            : h.rarity === 'mythic' ? 'text-rose-500 bg-rose-500/10 border-rose-500/25'
                            : h.rarity === 'epic' ? 'text-purple-500 bg-purple-500/10 border-purple-500/25'
                            : 'text-cyan-500 bg-cyan-500/10 border-cyan-500/25';
                            
                          const rarityGlow = h.rarity === 'legendary' ? 'shadow-[0_0_15px_rgba(245,158,11,0.22)] border-amber-500/50' 
                            : h.rarity === 'mythic' ? 'shadow-[0_0_20px_rgba(244,63,94,0.25)] border-rose-500/50'
                            : h.rarity === 'epic' ? 'shadow-[0_0_15px_rgba(168,85,247,0.22)] border-purple-500/50'
                            : h.rarity === 'rare' ? 'shadow-[0_0_10px_rgba(6,182,212,0.15)] border-cyan-500/40'
                            : 'border-border/30';
                            
                          const activeBg = equipped 
                            ? 'bg-gradient-to-b from-purple-500/15 to-purple-500/2 border-purple-500'
                            : 'bg-card/45 hover:bg-card/75 border-border/30 hover:border-purple-500/25';
                          
                          return (
                            <motion.button
                              key={h.id}
                              onClick={() => handleSelectCosmetic(h)}
                              whileHover={{ scale: 1.04, y: -4 }}
                              whileTap={{ scale: 0.95 }}
                              className={`rounded-2xl border-2 text-xs font-bold transition-all duration-300 relative flex flex-col items-center justify-between overflow-hidden min-h-[148px] ${activeBg} ${equipped ? rarityGlow : ''}`}
                            >
                              {/* Rarity top indicator bar */}
                              <div className={`w-full h-1 ${
                                h.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                                h.rarity === 'mythic' ? 'bg-gradient-to-r from-rose-500 to-pink-500 animate-pulse' :
                                h.rarity === 'epic' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500' :
                                h.rarity === 'rare' ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                                'bg-gradient-to-r from-gray-400 to-gray-500'
                              }`} />
                              
                              {/* Card Content */}
                              <div className="flex flex-col items-center w-full p-2 pt-2.5">
                                {/* Rarity capsule tag */}
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border mb-1.5 ${rarityColorClass}`}>
                                  {h.rarity}
                                </span>
                                
                                <HairPreviewSVG hairstyleId={h.id} hairColor={config.hairColor} skinTone={config.skinTone} size={64} />
                                
                                <span className="font-extrabold text-[11px] text-center mt-1 leading-tight text-foreground">{getCosmeticName(h, isTamil)}</span>
                              </div>

                              {/* Price / Ownership Tag Bar */}
                              <div className="w-full flex items-center justify-center gap-1 py-1.5 px-2 mt-auto border-t border-border/10 bg-black/10">
                                {owned ? (
                                  <span className={equipped 
                                    ? "text-purple-500 dark:text-purple-300 font-extrabold text-[9px] uppercase tracking-wider flex items-center gap-0.5" 
                                    : "text-muted-foreground font-black text-[9px] uppercase tracking-wider"
                                  }>
                                    {equipped ? (isTamil ? "பயன்பாட்டில் ✓" : "Equipped ✓") : (isTamil ? "உள்ளது" : "Owned")}
                                  </span>
                                ) : (
                                  <span className="font-extrabold text-[10px] text-foreground flex items-center gap-0.5">
                                    {cost.type === 'gems' ? '💎' : '🪙'} {cost.amount}
                                  </span>
                                )}
                              </div>
                              
                              {/* Sleek Corner Padlock Overlay */}
                              {!owned && (
                                <div className="absolute top-2 right-2 bg-amber-500/90 text-white rounded-full p-1.5 shadow-md z-20 border border-white/20">
                                  <Lock className="w-2.5 h-2.5" />
                                </div>
                              )}
                              
                              {/* Glowing particles / sparkles inside legendary card */}
                              {h.rarity === 'legendary' && (
                                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
                                  <div className="absolute top-4 left-4 w-1 h-1 rounded-full bg-yellow-300 animate-ping" />
                                  <div className="absolute bottom-6 right-6 w-1 h-1 rounded-full bg-amber-400 animate-ping" style={{ animationDelay: '0.6s' }} />
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "முடி நிறம்" : "Hair Color"}</h3>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                        {HAIR_COLORS.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setConfig((c) => ({ ...c, hairColor: color.value }))}
                            className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                              config.hairColor === color.value 
                                ? "border-purple-500 scale-105" 
                                : "border-border/40 bg-card/40 hover:bg-card/80"
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full border border-black/25" style={{ backgroundColor: color.value }} />
                            <span className="text-[9px] font-bold truncate max-w-full">{isTamil && color.label_ta ? color.label_ta : color.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── TAB 3: CLOTHING ── */}
                {activeTab === "clothing" && (
                  <motion.div
                    key="clothing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "ஆடைகள் & உடைகள்" : "Outfits & Costumes"}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <DefaultOptionCard 
                          label={isTamil ? "இயல்புநிலை சீருடை" : "Default Uniform"} 
                          emoji="👕" 
                          active={!config.outfit} 
                          onClick={() => handleRemoveCosmetic("outfit")} 
                        />
                        {outfits.map((o) => (
                          <CosmeticStoreCard 
                            key={o.id}
                            item={o}
                            equipped={config.outfit === o.id}
                            onClick={() => handleSelectCosmetic(o)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "வெளி அங்கிகள் & ஜாக்கெட்டுகள்" : "Outerwear & Jackets"}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <DefaultOptionCard 
                          label={isTamil ? "ஜாக்கெட் இல்லை" : "No Jacket"} 
                          emoji="🧥" 
                          active={!config.jacket} 
                          onClick={() => handleRemoveCosmetic("jacket")} 
                        />
                        {jackets.map((j) => (
                          <CosmeticStoreCard 
                            key={j.id}
                            item={j}
                            equipped={config.jacket === j.id}
                            onClick={() => handleSelectCosmetic(j)}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── TAB 4: HEADGEAR ── */}
                {activeTab === "headgear" && (
                  <motion.div
                    key="headgear"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "தொப்பிகள் & தலைக்கவசங்கள்" : "Hats & Headbands"}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <DefaultOptionCard 
                          label={isTamil ? "தலைக்கவசம் இல்லை" : "No Headgear"} 
                          emoji="🎩" 
                          active={!config.hat} 
                          onClick={() => handleRemoveCosmetic("hat")} 
                        />
                        {hats.map((h) => (
                          <CosmeticStoreCard 
                            key={h.id}
                            item={h}
                            equipped={config.hat === h.id}
                            onClick={() => handleSelectCosmetic(h)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "கண்ணாடிகள்" : "Eyewear & Glasses"}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <DefaultOptionCard 
                          label={isTamil ? "கண்ணாடி இல்லை" : "No Eyewear"} 
                          emoji="👓" 
                          active={!config.glasses} 
                          onClick={() => handleRemoveCosmetic("glasses")} 
                        />
                        {glasses.map((gl) => (
                          <CosmeticStoreCard 
                            key={gl.id}
                            item={gl}
                            equipped={config.glasses === gl.id}
                            onClick={() => handleSelectCosmetic(gl)}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── TAB 5: ARSENAL ── */}
                {activeTab === "arsenal" && (
                  <motion.div
                    key="arsenal"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "பள்ளி-பாதுகாப்பான உபகரணங்கள்" : "School-Safe Hero Props"}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <DefaultOptionCard 
                          label={isTamil ? "வெற்று கைகள்" : "Empty Hands"} 
                          emoji="👐" 
                          active={!config.prop} 
                          onClick={() => handleRemoveCosmetic("prop")} 
                        />
                        {props.map((p) => (
                          <CosmeticStoreCard 
                            key={p.id}
                            item={p}
                            equipped={config.prop === p.id}
                            onClick={() => handleSelectCosmetic(p)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "சாகச முதுகுப்பைகள்" : "Adventure Backpacks"}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <DefaultOptionCard 
                          label={isTamil ? "பை இல்லை" : "No Bag"} 
                          emoji="🎒" 
                          active={!config.backpack} 
                          onClick={() => handleRemoveCosmetic("backpack")} 
                        />
                        {backpacks.map((bk) => (
                          <CosmeticStoreCard 
                            key={bk.id}
                            item={bk}
                            equipped={config.backpack === bk.id}
                            onClick={() => handleSelectCosmetic(bk)}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── TAB 6: COMPANIONS & MORE ── */}
                {activeTab === "companions" && (
                  <motion.div
                    key="companions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "செல்லப்பிராணிகள் & தோழர்கள்" : "Pets & Companions"}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <DefaultOptionCard 
                          label={isTamil ? "செல்லப்பிராணி இல்லை" : "No Pet"} 
                          emoji="🐾" 
                          active={!config.pet} 
                          onClick={() => handleRemoveCosmetic("pet")} 
                        />
                        {petsList.map((pt) => (
                          <CosmeticStoreCard 
                            key={pt.id}
                            item={pt}
                            equipped={config.pet === pt.id}
                            onClick={() => handleSelectCosmetic(pt)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "ஒளிவட்டங்கள் & விளைவுகள்" : "Auras & Visual Effects"}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <DefaultOptionCard 
                          label={isTamil ? "ஒளிவட்டம் இல்லை" : "No Aura"} 
                          emoji="✨" 
                          active={!config.aura} 
                          onClick={() => handleRemoveCosmetic("aura")} 
                        />
                        {aurasList.map((au) => (
                          <CosmeticStoreCard 
                            key={au.id}
                            item={au}
                            equipped={config.aura === au.id}
                            onClick={() => handleSelectCosmetic(au)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "அறை பின்னணிகள்" : "Lobby Backgrounds"}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {backgroundsList.map((bg) => {
                          const owned = isItemOwned(bg.id);
                          const equipped = config.background === bg.id || (!config.background && bg.id === "bg-school");
                          const cost = getItemCostType(bg);
                          
                          const rarityColorClass = bg.rarity === 'legendary' ? 'text-amber-500 bg-amber-500/10 border-amber-500/25'
                            : bg.rarity === 'mythic' ? 'text-rose-500 bg-rose-500/10 border-rose-500/25 animate-pulse'
                            : bg.rarity === 'epic' ? 'text-purple-500 bg-purple-500/10 border-purple-500/25'
                            : bg.rarity === 'rare' ? 'text-blue-500 bg-blue-500/10 border-blue-500/25'
                            : 'text-slate-500 bg-slate-500/10 border-slate-500/25';
                            
                          const rarityGlow = bg.rarity === 'legendary' ? 'shadow-[0_0_15px_rgba(245,158,11,0.22)] border-amber-500/50' 
                            : bg.rarity === 'mythic' ? 'shadow-[0_0_20px_rgba(244,63,94,0.25)] border-rose-500/50 animate-pulse'
                            : bg.rarity === 'epic' ? 'shadow-[0_0_15px_rgba(168,85,247,0.22)] border-purple-500/50'
                            : bg.rarity === 'rare' ? 'shadow-[0_0_10px_rgba(59,130,246,0.15)] border-blue-500/40'
                            : 'border-border/30';
                            
                          const activeBg = equipped 
                            ? 'bg-gradient-to-b from-purple-500/15 to-purple-500/2 border-purple-500'
                            : 'bg-card/45 hover:bg-card/75 border-border/30 hover:border-purple-500/25';
                            
                          return (
                            <motion.button
                              key={bg.id}
                              onClick={() => handleSelectCosmetic(bg)}
                              whileHover={{ scale: 1.04, y: -4 }}
                              whileTap={{ scale: 0.95 }}
                              className={`rounded-2xl border-2 text-xs font-bold transition-all duration-300 relative flex flex-col items-center justify-between overflow-hidden min-h-[148px] ${activeBg} ${equipped ? rarityGlow : ''} w-full`}
                            >
                              {/* Rarity top indicator bar */}
                              <div className={`w-full h-1 ${
                                bg.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                                bg.rarity === 'mythic' ? 'bg-gradient-to-r from-rose-500 to-pink-500 animate-pulse' :
                                bg.rarity === 'epic' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500' :
                                bg.rarity === 'rare' ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                                'bg-gradient-to-r from-gray-400 to-gray-500'
                              }`} />
                              
                              {/* Card Content with Gradient Swatch */}
                              <div className="w-full flex-1 flex flex-col items-center justify-between">
                                {/* Gradient preview swatch */}
                                <div
                                  className="w-full h-14 transition-all duration-700 relative border-b border-border/10 flex items-center justify-center text-2xl filter drop-shadow-md"
                                  style={getLobbyBgStyle(bg.id)}
                                >
                                  {/* Overlay rarity capsule badge */}
                                  <span className={`absolute top-2 left-2 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${rarityColorClass}`}>
                                    {bg.rarity}
                                  </span>
                                  
                                  {bg.icon}
                                </div>
                                
                                <div className="p-2 w-full flex flex-col items-center justify-center flex-grow">
                                  <span className="font-extrabold text-[11px] text-center px-1 leading-tight text-foreground line-clamp-1">{getCosmeticName(bg, isTamil)}</span>
                                </div>
                              </div>

                              {/* Price / Ownership Tag Bar */}
                              <div className="w-full flex items-center justify-center gap-1 py-1.5 px-2 mt-auto border-t border-border/10 bg-black/10">
                                {owned ? (
                                  <span className={equipped 
                                    ? "text-purple-500 dark:text-purple-300 font-extrabold text-[9px] uppercase tracking-wider flex items-center gap-0.5" 
                                    : "text-muted-foreground font-black text-[9px] uppercase tracking-wider"
                                  }>
                                    {equipped ? (isTamil ? "பயன்பாட்டில் ✓" : "Equipped ✓") : (isTamil ? "உள்ளது" : "Owned")}
                                  </span>
                                ) : (
                                  <span className="font-extrabold text-[10px] text-foreground flex items-center gap-0.5">
                                    {cost.type === 'gems' ? '💎' : '🪙'} {cost.amount}
                                  </span>
                                )}
                              </div>
                              
                              {/* Sleek Corner Padlock Overlay */}
                              {!owned && (
                                <div className="absolute top-2 right-2 bg-amber-500/90 text-white rounded-full p-1.5 shadow-md z-20 border border-white/20">
                                  <Lock className="w-2.5 h-2.5" />
                                </div>
                              )}
                              
                              {/* Sparkling star particles inside legendary/mythic cards */}
                              {['legendary', 'mythic'].includes(bg.rarity) && (
                                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
                                  <div className="absolute top-4 left-4 w-1 h-1 rounded-full bg-yellow-300 animate-ping" />
                                  <div className="absolute bottom-6 right-6 w-1 h-1 rounded-full bg-amber-400 animate-ping" style={{ animationDelay: '0.6s' }} />
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-primary mb-3 uppercase tracking-wider">{isTamil ? "விவரக்குறிப்பு பிரேம்கள்" : "Profile Frames"}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <DefaultOptionCard 
                          label={isTamil ? "பிரேம் இல்லை" : "No Frame"} 
                          emoji="🖼️" 
                          active={!config.frame} 
                          onClick={() => handleRemoveCosmetic("frame")} 
                        />
                        {framesList.map((fr) => (
                          <CosmeticStoreCard 
                            key={fr.id}
                            item={fr}
                            equipped={config.frame === fr.id}
                            onClick={() => handleSelectCosmetic(fr)}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

interface ThemeCfg {
  bg: string;
  auroraLeft: { color: string; opacity: number };
  auroraRight: { color: string; opacity: number };
  gridColor?: string;
  particle: { color: string; glow: string };
  particleScale?: number;
}

const THEME_CFG: Record<string, ThemeCfg> = {
  light: {
    bg: "linear-gradient(to bottom, #f3f6ff, #e8eeff, #fcfdff)",
    auroraLeft:  { color: "#f9a8d4", opacity: 0.35 }, // pink-300
    auroraRight: { color: "#7dd3fc", opacity: 0.35 }, // sky-300
    particle: { color: "#38bdf8", glow: "0 0 10px rgba(56,189,248,0.5)" },
    particleScale: 2.2,
  },
  dark: {
    bg: "linear-gradient(to bottom, #05070f, #090b18, #04050a)",
    auroraLeft:  { color: "#06b6d4", opacity: 0.12 }, // cyan-500
    auroraRight: { color: "#a855f7", opacity: 0.12 }, // purple-500
    gridColor: "rgba(255,255,255,0.06)",
    particle: { color: "#c084fc", glow: "0 0 14px rgba(192,132,252,0.6)" },
  },
  cyberpunk: {
    bg: "linear-gradient(to bottom, #0a0212, #0d0418, #050109)",
    auroraLeft:  { color: "#d946ef", opacity: 0.18 }, // fuchsia-500
    auroraRight: { color: "#06b6d4", opacity: 0.15 }, // cyan-500
    gridColor: "rgba(217,70,239,0.12)",
    particle: { color: "#e879f9", glow: "0 0 16px rgba(232,121,249,0.8)" },
  },
  "anime-neon": {
    bg: "linear-gradient(to bottom, #070514, #0b0820, #04030d)",
    auroraLeft:  { color: "#2dd4bf", opacity: 0.18 }, // teal-400
    auroraRight: { color: "#d946ef", opacity: 0.15 }, // fuchsia-500
    gridColor: "rgba(20,184,166,0.12)",
    particle: { color: "#2dd4bf", glow: "0 0 16px rgba(45,212,191,0.8)" },
  },
  space: {
    bg: "linear-gradient(to bottom, #03040c, #060818, #020208)",
    auroraLeft:  { color: "#6366f1", opacity: 0.14 }, // indigo-500
    auroraRight: { color: "#9333ea", opacity: 0.14 }, // purple-600
    particle: { color: "rgba(255,255,255,0.9)", glow: "0 0 10px rgba(255,255,255,0.9)" },
    particleScale: 0.55,
  },
  sunset: {
    bg: "linear-gradient(to bottom, #140b07, #1a0f0a, #0c0604)",
    auroraLeft:  { color: "#d97706", opacity: 0.15 }, // amber-600
    auroraRight: { color: "#e11d48", opacity: 0.15 }, // rose-600
    particle: { color: "#fbbf24", glow: "0 0 14px rgba(251,191,36,0.7)" },
  },
};

// Extra space stars that only appear in the "space" theme
function SpaceStars({ count = 80 }: { count?: number }) {
  const stars = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      dur: Math.random() * 4 + 2,
      delay: Math.random() * 4,
    }))
  ).current;

  return (
    <>
      {stars.map((s) => (
        <motion.div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: "white",
            boxShadow: "0 0 4px rgba(255,255,255,0.8)",
            pointerEvents: "none",
          }}
          animate={{ opacity: [0.1, 0.9, 0.1] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

// Cyberpunk scanline overlay
function CyberScanlines() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.018) 2px, rgba(0,255,255,0.018) 4px)",
        pointerEvents: "none",
        zIndex: 2,
        opacity: 0.6,
      }}
    />
  );
}

export const GameBackground: React.FC = () => {
  const { theme } = useTheme();
  const cfg = THEME_CFG[theme] || THEME_CFG.dark;

  const particles = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: (Math.random() * 5 + 2) * (THEME_CFG[theme]?.particleScale ?? 1),
      dur: Math.random() * 10 + 12,
      dx: Math.random() * 40 - 20,
    }))
  );

  // regenerate when theme changes
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const newScale = THEME_CFG[theme]?.particleScale ?? 1;
    particles.current = Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: (Math.random() * 5 + 2) * newScale,
      dur: Math.random() * 10 + 12,
      dx: Math.random() * 40 - 20,
    }));
    forceUpdate((n) => n + 1);
  }, [theme]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -50,
        overflow: "hidden",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${theme}-bg`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          style={{ position: "absolute", inset: 0, background: cfg.bg }}
        >
          {/* Aurora Left */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [cfg.auroraLeft.opacity, cfg.auroraLeft.opacity * 1.4, cfg.auroraLeft.opacity] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: "-10%",
              left: "-10%",
              width: "55%",
              height: "55%",
              borderRadius: "50%",
              background: cfg.auroraLeft.color,
              filter: "blur(110px)",
            }}
          />

          {/* Aurora Right */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [cfg.auroraRight.opacity, cfg.auroraRight.opacity * 1.4, cfg.auroraRight.opacity] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              bottom: "-10%",
              right: "-10%",
              width: "55%",
              height: "55%",
              borderRadius: "50%",
              background: cfg.auroraRight.color,
              filter: "blur(110px)",
            }}
          />

          {/* Optional Grid Overlay */}
          {cfg.gridColor && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.45,
                backgroundImage: `linear-gradient(${cfg.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${cfg.gridColor} 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Space-only: twinkling star field */}
          {theme === "space" && <SpaceStars count={90} />}

          {/* Cyberpunk-only: scanlines */}
          {theme === "cyberpunk" && <CyberScanlines />}

          {/* Floating Particles */}
          {particles.current.map((p) => (
            <motion.div
              key={`${theme}-p-${p.id}`}
              style={{
                position: "absolute",
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                borderRadius: "50%",
                background: cfg.particle.color,
                boxShadow: cfg.particle.glow,
                pointerEvents: "none",
              }}
              animate={{
                y: [0, -80, 0],
                x: [0, p.dx, 0],
                opacity: [0.1, 0.75, 0.1],
              }}
              transition={{
                duration: p.dur,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

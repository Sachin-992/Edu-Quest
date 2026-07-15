import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift } from "lucide-react";
import { getLoginState, claimLoginBonus, LOGIN_BONUS_CYCLE } from "@/lib/retentionEngine";
import ConfettiCelebration from "./ConfettiCelebration";
import { useLanguageStore } from "@/store/useLanguageStore";

const DailyLoginBonus = () => {
    const { language } = useLanguageStore();
    const isTamil = language === 'ta';
    const [visible, setVisible] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const [claimedXP, setClaimedXP] = useState(0);
    const [dayInCycle, setDayInCycle] = useState(1);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        const state = getLoginState();
        if (!state.claimedToday) {
            // Show after a short delay so dashboard renders first
            const t = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(t);
        }
    }, []);

    if (!visible) return null;

    const state = getLoginState();
    const currentDay = ((state.consecutiveDays) % 7); // 0-indexed, next day to claim

    const handleClaim = () => {
        const result = claimLoginBonus();
        if (result.xp > 0) {
            setClaimedXP(result.xp);
            setDayInCycle(result.dayInCycle);
            setClaimed(true);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
        }
    };

    const handleDismiss = () => setVisible(false);

    return (
        <>
            <ConfettiCelebration show={showConfetti} />
            <AnimatePresence>
                {visible && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDismiss} />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 30 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden"
                        >
                            {/* Gradient glow */}
                            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-primary/15 to-transparent pointer-events-none" />

                            <button onClick={handleDismiss} className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                                <X className="w-4 h-4" />
                            </button>

                            <div className="relative z-10 p-6 pt-7">
                                {!claimed ? (
                                    <>
                                        <div className="text-center mb-5">
                                            <div className="text-5xl mb-2 inline-block anim-wiggle">
                                                🎁
                                            </div>
                                            <h2 className="text-xl font-black">{isTamil ? "தினசரி உள்நுழைவு போனஸ்!" : "Daily Login Bonus!"}</h2>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {isTamil ? "மீண்டும் வரவேற்கிறோம்! இதோ உங்கள் வெகுமதி 🎉" : "Welcome back! Here's your reward 🎉"}
                                            </p>
                                        </div>

                                        {/* 7-day strip */}
                                        <div className="flex gap-1.5 mb-5 justify-center">
                                            {LOGIN_BONUS_CYCLE.map((bonus, i) => {
                                                const isPast = i < currentDay;
                                                const isCurrent = i === currentDay;
                                                const isFuture = i > currentDay;

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl text-center min-w-[42px] ${isCurrent
                                                            ? "bg-primary/15 border-2 border-primary/40 ring-2 ring-primary/20 anim-pulse-scale"
                                                            : isPast
                                                                ? "bg-green-100 dark:bg-green-900/20 border border-green-300/50"
                                                                : isFuture
                                                                    ? "bg-muted/30 border border-transparent"
                                                                    : ""
                                                            }`}
                                                    >
                                                        <span className="text-[10px] font-bold text-muted-foreground">{isTamil ? "நாள்" : "D"}{i + 1}</span>
                                                        <span className="text-sm">
                                                            {isPast ? "✅" : isCurrent ? "🎁" : bonus.special ? "🌟" : "📦"}
                                                        </span>
                                                        <span className="text-[9px] font-bold">{bonus.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Claim button */}
                                        <motion.button
                                            whileTap={{ scale: 0.96 }}
                                            onClick={handleClaim}
                                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
                                        >
                                            <Gift className="w-5 h-5" />
                                            {isTamil ? "இன்றைய வெகுமதியைப் பெறுங்கள்!" : "Claim Today's Reward!"}
                                        </motion.button>
                                    </>
                                ) : (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                        className="text-center py-4"
                                    >
                                        <div className="text-5xl mb-3">🎉</div>
                                        <h2 className="text-xl font-black">{isTamil ? "பெறப்பட்டது!" : "Claimed!"}</h2>
                                        <motion.p
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: "spring" }}
                                            className="text-3xl font-black text-primary mt-2"
                                        >
                                            +{claimedXP} XP
                                        </motion.p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {isTamil ? `${dayInCycle}-வது நாள் தொடர்! நாளை மீண்டும் வாருங்கள்! 🔥` : `Day ${dayInCycle} streak! Come back tomorrow! 🔥`}
                                        </p>
                                        <button
                                            onClick={handleDismiss}
                                            className="mt-4 px-6 py-2.5 rounded-2xl bg-muted hover:bg-muted/80 font-bold text-sm transition-colors"
                                        >
                                            {isTamil ? "அற்புதம்!" : "Awesome!"}
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default DailyLoginBonus;

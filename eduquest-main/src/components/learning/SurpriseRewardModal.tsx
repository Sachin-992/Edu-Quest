import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { RewardResult } from "@/hooks/useCompletionReward";
import ConfettiCelebration from "./ConfettiCelebration";

interface SurpriseRewardModalProps {
    isOpen: boolean;
    reward: RewardResult | null;
    onDismiss: () => void;
}

const SurpriseRewardModal = ({ isOpen, reward, onDismiss }: SurpriseRewardModalProps) => {
    const [opened, setOpened] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const handleOpen = () => {
        setOpened(true);
        setShowConfetti(true);
        // Auto-dismiss confetti
        setTimeout(() => setShowConfetti(false), 3500);
    };

    const handleDismiss = () => {
        setOpened(false);
        setShowConfetti(false);
        onDismiss();
    };

    if (!reward || reward.kind === "none") return null;

    return (
        <>
            <ConfettiCelebration show={showConfetti} />
            <AnimatePresence
                onExitComplete={() => {
                    setOpened(false);
                    setShowConfetti(false);
                }}
            >
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    >
                        {/* Backdrop — click to dismiss */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDismiss} />

                        {/* Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.3, y: 60, rotate: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: 40 }}
                            transition={{ type: "spring", stiffness: 250, damping: 18 }}
                            className="relative w-full max-w-xs bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden rainbow-shadow"
                            style={{ borderRadius: '1.5rem' }}
                        >
                            {/* Golden glow overlay */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 bg-gradient-to-b from-amber-400/15 via-transparent to-amber-400/10 animate-pulse" />
                                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full bg-amber-400/20 blur-3xl animate-pulse" />
                            </div>

                            {/* Close button */}
                            <button
                                onClick={handleDismiss}
                                className="absolute top-3 right-3 z-20 h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="relative z-10 p-6 text-center">
                                {!opened ? (
                                    /* ── Chest (pre-open) ── */
                                    <div className="anim-bounce">
                                        <button
                                            onClick={handleOpen}
                                            className="focus:outline-none group"
                                        >
                                            <div className="text-7xl mb-3 inline-block anim-wiggle">
                                                🎁
                                            </div>
                                            <p className="text-lg font-black text-foreground mb-1">
                                                You got a surprise!
                                            </p>
                                            <p className="text-sm font-bold text-primary animate-pulse">
                                                Tap to open! 👆
                                            </p>
                                        </button>
                                    </div>
                                ) : (
                                    /* ── Reward Revealed ── */
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.3, rotate: -10 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                    >
                                        {/* Reward emoji with glow ring */}
                                        <div className="relative inline-block mb-4">
                                            <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-xl scale-150 anim-glow" />
                                            <div className="relative text-6xl">
                                                {reward.emoji}
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black text-foreground mb-1">
                                            {reward.label}
                                        </h3>

                                        {reward.value && (
                                            <motion.p
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.2, type: "spring" }}
                                                className="text-2xl font-black text-amber-500 mb-1"
                                            >
                                                +{reward.value}
                                            </motion.p>
                                        )}

                                        <p className="text-sm text-muted-foreground mb-5">
                                            {reward.description}
                                        </p>

                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleDismiss}
                                            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white font-bold text-base shadow-lg shadow-amber-500/25 btn-bounce-hover btn-glow-pulse"
                                            style={{ '--glow-color': 'rgba(245, 158, 11, 0.45)' } as React.CSSProperties}
                                        >
                                            Awesome! 🎉
                                        </motion.button>
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

export default SurpriseRewardModal;

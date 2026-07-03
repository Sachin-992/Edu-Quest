import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock } from "lucide-react";
import type { ReflectionData } from "@/hooks/useCompletionReward";

interface ReflectionModalProps {
    isOpen: boolean;
    onSubmit: (data: ReflectionData) => void;
    onSkip: () => void;
}

const WHAT_YOU_LEARNT_OPTIONS = [
    { value: "medium" as const, label: "Interesting", labelTamil: "சுவாரஸ்யமானது", emoji: "🌟", color: "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-900/50" },
    { value: "easy" as const, label: "Easy", labelTamil: "எளிதானது", emoji: "🟢", color: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50" },
    { value: "hard" as const, label: "Need practice", labelTamil: "பயிற்சி தேவை", emoji: "📚", color: "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50" },
];

const HOW_TO_USE_OPTIONS = [
    { value: 3 as const, label: "In Daily Life", labelTamil: "தினசரி வாழ்வில்", emoji: "🏠" },
    { value: 2 as const, label: "In My School", labelTamil: "பள்ளி வகுப்பில்", emoji: "🎒" },
    { value: 1 as const, label: "To Teach Friends", labelTamil: "நண்பர்களுக்கு கற்பிக்க", emoji: "🤝" },
];

const ReflectionModal = ({ isOpen, onSubmit, onSkip }: ReflectionModalProps) => {
    const [difficulty, setDifficulty] = useState<ReflectionData["difficulty"]>(null);
    const [enjoyment, setEnjoyment] = useState<ReflectionData["enjoyment"]>(null);
    const [timeLeft, setTimeLeft] = useState(10);

    // Auto-skip after 10 seconds to not block user progression
    useEffect(() => {
        if (!isOpen) return;
        setTimeLeft(10);

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onSkip();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, onSkip]);

    const handleSubmit = () => {
        onSubmit({ difficulty, enjoyment });
        // Reset state for next trigger
        setDifficulty(null);
        setEnjoyment(null);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onSkip}
                    />

                    {/* Content Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 350, damping: 26 }}
                        className="relative w-full max-w-md bg-card border border-border/60 rounded-3xl shadow-2xl overflow-hidden z-10"
                    >
                        {/* Interactive Header Accent */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-purple-500 to-amber-400" />
                        
                        {/* Auto-skip Timer Bar */}
                        <div className="absolute top-2 left-0 right-0 h-1 bg-muted">
                            <motion.div 
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 10, ease: "linear" }}
                                className="h-full bg-primary"
                            />
                        </div>

                        {/* Top close button */}
                        <button
                            onClick={onSkip}
                            className="absolute top-5 right-5 z-20 h-8 w-8 rounded-full bg-muted/65 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="p-6 pt-10">
                            {/* Reflection Header */}
                            <div className="text-center mb-6">
                                <span className="text-4xl inline-block anim-bounce mb-2">💡</span>
                                <h2 className="text-xl font-black text-foreground">
                                    Knowledge Reflection
                                </h2>
                                <p className="text-xs text-muted-foreground font-medium">
                                    சிந்தனைப் பெட்டி
                                </p>
                            </div>

                            {/* Question 1: What did you learn? */}
                            <div className="mb-5">
                                <div className="mb-2">
                                    <p className="text-sm font-black text-foreground leading-tight">
                                        What did you learn?
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-tamil">
                                        நீங்கள் என்ன கற்றுக்கொண்டீர்கள்?
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {WHAT_YOU_LEARNT_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setDifficulty(opt.value)}
                                            className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                                                difficulty === opt.value
                                                    ? `${opt.color} ring-2 ring-primary/40 scale-[1.03]`
                                                    : "bg-muted/30 border-transparent hover:bg-muted/65"
                                            }`}
                                        >
                                            <span className="text-2xl">{opt.emoji}</span>
                                            <div className="text-center">
                                                <p className="text-[11px] font-extrabold leading-none">{opt.label}</p>
                                                <p className="text-[9px] text-muted-foreground font-tamil mt-0.5 leading-none">{opt.labelTamil}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Question 2: How can you use it? */}
                            <div className="mb-6">
                                <div className="mb-2">
                                    <p className="text-sm font-black text-foreground leading-tight">
                                        How can you use it?
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-tamil">
                                        இதை நீங்கள் எங்கு பயன்படுத்துவீர்கள்?
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {HOW_TO_USE_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setEnjoyment(opt.value)}
                                            className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                                                enjoyment === opt.value
                                                    ? "bg-primary/10 border-primary/40 ring-2 ring-primary/20 scale-[1.03]"
                                                    : "bg-muted/30 border-transparent hover:bg-muted/65"
                                            }`}
                                        >
                                            <span className="text-2xl">{opt.emoji}</span>
                                            <div className="text-center">
                                                <p className="text-[11px] font-extrabold leading-none">{opt.label}</p>
                                                <p className="text-[9px] text-muted-foreground font-tamil mt-0.5 leading-none">{opt.labelTamil}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit & Skip Actions */}
                            <div className="space-y-2.5">
                                <button
                                    onClick={handleSubmit}
                                    disabled={!difficulty || !enjoyment}
                                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary/80 disabled:opacity-50 disabled:pointer-events-none text-primary-foreground font-black text-sm tracking-wide shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all transform active:scale-[0.98]"
                                >
                                    Reflect and Continue ✨
                                </button>
                                
                                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5 text-primary anim-pulse" />
                                    <span>Skipping automatically in <b className="text-foreground font-extrabold">{timeLeft}s</b></span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ReflectionModal;

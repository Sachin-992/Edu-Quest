import { motion } from "framer-motion";
import { Sparkles, Gift } from "lucide-react";
import { useLanguageStore } from "@/store/useLanguageStore";

interface ComeBackBannerProps {
    hasActivityToday: boolean;
}

const ComeBackBanner = ({ hasActivityToday }: ComeBackBannerProps) => {
    const { language } = useLanguageStore();
    const isTamil = language === 'ta';
    if (!hasActivityToday) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500/15 via-pink-500/12 to-amber-500/15 border border-violet-400/25 p-6 flex items-center gap-4 shadow-xl shadow-violet-500/15 hover:shadow-2xl transition-shadow"
        >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent anim-shimmer pointer-events-none" />

            <div className="relative z-10 flex items-center gap-4 w-full">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center shrink-0 anim-wiggle">
                    <Gift className="w-6 h-6 text-violet-500" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-foreground">
                        {isTamil ? "🎁 ஆச்சரியமான வெகுமதிக்கு நாளை மீண்டும் வாருங்கள்!" : "🎁 Come back tomorrow for a surprise!"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isTamil ? "பெரிய வெகுமதிகளைப் பெற உங்கள் தொடரைத் தக்கவைத்துக் கொள்ளுங்கள் ✨" : "Keep your streak alive for bigger rewards ✨"}
                    </p>
                </div>

                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 anim-pulse-scale" />
            </div>
        </motion.div>
    );
};

export default ComeBackBanner;

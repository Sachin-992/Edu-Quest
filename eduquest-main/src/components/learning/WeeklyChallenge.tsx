import { motion } from "framer-motion";
import { getCurrentWeeklyChallenge, type BadgeStats } from "@/lib/retentionEngine";
import { useLanguageStore } from "@/store/useLanguageStore";

interface WeeklyChallengeProps {
    stats: BadgeStats;
}

const WeeklyChallenge = ({ stats }: WeeklyChallengeProps) => {
    const { language } = useLanguageStore();
    const isTamil = language === 'ta';
    const challenge = getCurrentWeeklyChallenge();
    const progress = challenge.getProgress(stats);
    const pct = Math.min((progress / challenge.target) * 100, 100);
    const done = progress >= challenge.target;

    const getChallengeTitle = (id: string, originalTitle: string, isTamil: boolean) => {
        if (!isTamil) return originalTitle;
        const titles: Record<string, string> = {
            "lessons_10": "இந்த வாரம் 10 பாடங்களை முடிக்கவும்",
            "quizzes_5": "இந்த வாரம் 5 குவிஸ்களில் தேர்ச்சி பெறவும்",
            "streak_7": "7 நாள் தொடரை பராமரிக்கவும்",
            "xp_200": "இந்த வாரம் 200 XP பெறவும்",
            "perfect_3": "3 சரியான குவிஸ் மதிப்பெண்களைப் பெறவும்",
        };
        return titles[id] || originalTitle;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ scale: 1.02, y: -3 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 250, damping: 18 }}
            className={`rounded-2xl p-6 flex items-center gap-5 shadow-xl card-shimmer ${done
                ? "bg-gradient-to-br from-amber-400/15 to-yellow-500/15 border-2 border-amber-400/30 shadow-amber-500/15"
                : "bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-400/20 shadow-purple-500/15"
                }`}
        >
            {/* Icon */}
            <div className={`h-14 w-14 rounded-xl flex items-center justify-center text-2xl shrink-0 ${done ? "bg-amber-100 dark:bg-amber-800/30 anim-pulse-scale" : "bg-gradient-to-br from-purple-500/20 to-indigo-500/15"
                }`}>
                {done ? "🏆" : challenge.emoji}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base leading-tight">
                    {done 
                        ? (isTamil ? "🎉 வாராந்திர சவால் முடிந்தது!" : "🎉 Weekly Challenge Complete!") 
                        : (isTamil ? "📅 வாராந்திர சவால்" : "📅 Weekly Challenge")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-tight truncate">
                    {done 
                        ? (isTamil ? `+${challenge.xpReward} XP பெறப்பட்டது! ✨` : `+${challenge.xpReward} XP earned! ✨`) 
                        : getChallengeTitle(challenge.id, challenge.title, isTamil)}
                </p>
            </div>

            {/* Progress ring — larger with glow */}
            <div className={`shrink-0 relative w-14 h-14 ${done ? "anim-glow" : ""}`}>
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" stroke="hsl(var(--muted)/0.3)" strokeWidth="4" fill="none" />
                    <motion.circle
                        cx="28" cy="28" r="22"
                        stroke={done ? "hsl(40 90% 50%)" : "hsl(var(--primary))"}
                        strokeWidth="4" fill="none" strokeLinecap="round"
                        initial={{ strokeDasharray: "138.2", strokeDashoffset: "138.2" }}
                        animate={{ strokeDashoffset: 138.2 - (138.2 * pct / 100) }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black">
                    {done ? "✅" : `${Math.min(progress, challenge.target)}/${challenge.target}`}
                </span>
            </div>
        </motion.div>
    );
};

export default WeeklyChallenge;

import { motion } from "framer-motion";
import { getRank, getNextRank } from "@/lib/retentionEngine";

interface RankTierBadgeProps {
    totalXP: number;
    size?: "sm" | "md";
}

const RankTierBadge = ({ totalXP, size = "md" }: RankTierBadgeProps) => {
    const rank = getRank(totalXP);
    const next = getNextRank(totalXP);

    const sizeClasses = size === "sm" ? "h-9 w-9 text-lg" : "h-12 w-12 text-2xl";
    const ringSize = size === "sm" ? "ring-2" : "ring-[3px]";

    return (
        <div className="flex flex-col items-center gap-1">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="relative"
            >
                {/* Glow */}
                <div
                    className={`absolute inset-0 rounded-xl blur-md opacity-40 bg-gradient-to-br ${rank.gradient}`}
                />
                {/* Badge */}
                <div
                    className={`relative ${sizeClasses} rounded-xl bg-gradient-to-br ${rank.gradient} ${ringSize} ${rank.ring} flex items-center justify-center shadow-lg`}
                >
                    {rank.emoji}
                </div>
            </motion.div>

            {/* Label */}
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                {rank.name}
            </span>

            {/* Progress to next */}
            {next && size === "md" && (
                <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-14 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(5, ((totalXP - getRank(totalXP).minXP) / (next.rank.minXP - getRank(totalXP).minXP)) * 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full bg-gradient-to-r ${rank.gradient}`}
                        />
                    </div>
                    <span className="text-[9px] text-muted-foreground font-bold">
                        {next.xpNeeded} to {next.rank.emoji}
                    </span>
                </div>
            )}
        </div>
    );
};

export default RankTierBadge;

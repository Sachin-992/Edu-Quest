import { useState, useCallback, useRef } from "react";

/* ─── Types ─── */
export type CompletionType = "lesson" | "quiz" | "adventure" | "daily_mission";

export type RewardKind =
    | "bonus_xp"
    | "double_coins"
    | "mystery_badge"
    | "streak_shield"
    | "avatar_discount"
    | "streak_boost"
    | "none";

export interface RewardResult {
    kind: RewardKind;
    label: string;
    emoji: string;
    description: string;
    value?: number;
}

export interface ReflectionData {
    difficulty: "easy" | "medium" | "hard" | null;
    enjoyment: 1 | 2 | 3 | null;
}

/* ─── Reward Table ─── */
const REWARD_TABLE: { kind: RewardKind; weight: number; label: string; emoji: string; description: string; valueFn?: () => number }[] = [
    { kind: "bonus_xp", weight: 25, label: "Bonus XP!", emoji: "⭐", description: "Extra XP added to your total!", valueFn: () => 15 + Math.floor(Math.random() * 16) },
    { kind: "double_coins", weight: 20, label: "Bonus Coins!", emoji: "💰", description: "Extra coins added to your wallet!", valueFn: () => 15 + Math.floor(Math.random() * 16) },
    { kind: "streak_boost", weight: 15, label: "Streak Boost!", emoji: "🔥", description: "Earn a streak milestone boost! (+10 Coins)" },
    { kind: "streak_shield", weight: 10, label: "Streak Shield!", emoji: "🛡️", description: "Your streak is protected for 1 day! (Streak Freeze +1)" },
    { kind: "avatar_discount", weight: 15, label: "Avatar Discount!", emoji: "👕", description: "20% off on your next purchase in the avatar shop!" },
    { kind: "mystery_badge", weight: 10, label: "Mystery Badge!", emoji: "🏅", description: "You unlocked a rare achievement badge! (+5 Gems)" },
    { kind: "none", weight: 5, label: "", emoji: "", description: "" },
];

function rollReward(): RewardResult {
    const totalWeight = REWARD_TABLE.reduce((sum, r) => sum + r.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const entry of REWARD_TABLE) {
        roll -= entry.weight;
        if (roll <= 0) {
            return {
                kind: entry.kind,
                label: entry.label,
                emoji: entry.emoji,
                description: entry.description,
                value: entry.valueFn?.(),
            };
        }
    }
    return { kind: "none", label: "", emoji: "", description: "" };
}

/* ─── LocalStorage persistence ─── */
const REFLECTION_STORAGE_KEY = "eduspark_reflections";

interface StoredReflection {
    type: CompletionType;
    difficulty: string | null;
    enjoyment: number | null;
    reward: RewardKind;
    timestamp: string;
}

function storeReflection(data: StoredReflection) {
    try {
        const raw = localStorage.getItem(REFLECTION_STORAGE_KEY);
        const arr: StoredReflection[] = raw ? JSON.parse(raw) : [];
        arr.push(data);
        // Keep last 100 entries
        if (arr.length > 100) arr.splice(0, arr.length - 100);
        localStorage.setItem(REFLECTION_STORAGE_KEY, JSON.stringify(arr));
    } catch {
        // storage full or unavailable — silently fail
    }
}

/* ─── Hook ─── */
export function useCompletionReward(userId?: string) {
    const [showReflection, setShowReflection] = useState(false);
    const [showReward, setShowReward] = useState(false);
    const [reward, setReward] = useState<RewardResult | null>(null);
    const completionTypeRef = useRef<CompletionType>("lesson");

    const triggerCompletion = useCallback((type: CompletionType) => {
        completionTypeRef.current = type;
        setShowReflection(true);
    }, []);

    /** Persist bonus XP to database so it actually counts */
    const persistBonusXP = useCallback(async (result: RewardResult) => {
        if (result.kind !== "bonus_xp" || !result.value || !userId) return;
        try {
            const { supabase } = await import("@/integrations/supabase/client");
            const { error } = await supabase.from("student_progress").insert({
                user_id: userId,
                status: "completed" as const,
                xp_earned: result.value,
                completed_at: new Date().toISOString(),
            });
            if (error) {
                console.error("[useCompletionReward] Failed to insert student_progress:", error);
            }
        } catch (e) {
            console.error("[useCompletionReward] Unexpected error persisting bonus XP:", e);
        }
    }, [userId]);

    const applyRewardEffects = useCallback((result: RewardResult) => {
        try {
            if (result.kind === "double_coins" && result.value) {
                const curCoins = parseInt(localStorage.getItem("eq_coins") || "0", 10);
                localStorage.setItem("eq_coins", String(curCoins + result.value));
            } else if (result.kind === "streak_shield") {
                const curFreezes = parseInt(localStorage.getItem("eq_streak_freezes") || "0", 10);
                localStorage.setItem("eq_streak_freezes", String(Math.min(3, curFreezes + 1)));
            } else if (result.kind === "avatar_discount") {
                localStorage.setItem("eq_avatar_discount", "0.8");
            } else if (result.kind === "streak_boost") {
                const curCoins = parseInt(localStorage.getItem("eq_coins") || "0", 10);
                localStorage.setItem("eq_coins", String(curCoins + 10));
            } else if (result.kind === "mystery_badge") {
                const curGems = parseInt(localStorage.getItem("eq_gems") || "10", 10);
                localStorage.setItem("eq_gems", String(curGems + 5));
            }
            
            // Trigger storage sync across widgets
            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new Event("wallet_update"));
        } catch (e) {
            console.error("[useCompletionReward] Failed to write rewards to localStorage:", e);
        }
    }, []);

    const handleReflectionSubmit = useCallback((data: ReflectionData) => {
        setShowReflection(false);

        // Roll for reward
        const result = rollReward();
        setReward(result);

        // Store reflection locally
        storeReflection({
            type: completionTypeRef.current,
            difficulty: data.difficulty,
            enjoyment: data.enjoyment,
            reward: result.kind,
            timestamp: new Date().toISOString(),
        });

        // Persist bonus XP to DB
        persistBonusXP(result);

        // Apply local storage wallet rewards
        applyRewardEffects(result);

        if (result.kind !== "none") {
            setTimeout(() => setShowReward(true), 400);
        }
    }, [persistBonusXP, applyRewardEffects]);

    const handleReflectionSkip = useCallback(() => {
        setShowReflection(false);

        // Still roll for reward even if skipped
        const result = rollReward();
        setReward(result);

        storeReflection({
            type: completionTypeRef.current,
            difficulty: null,
            enjoyment: null,
            reward: result.kind,
            timestamp: new Date().toISOString(),
        });

        // Persist bonus XP to DB
        persistBonusXP(result);

        // Apply local storage wallet rewards
        applyRewardEffects(result);

        if (result.kind !== "none") {
            setTimeout(() => setShowReward(true), 400);
        }
    }, [persistBonusXP, applyRewardEffects]);

    const handleRewardDismiss = useCallback(() => {
        setShowReward(false);
        setReward(null);
    }, []);

    return {
        triggerCompletion,
        showReflection,
        showReward,
        reward,
        handleReflectionSubmit,
        handleReflectionSkip,
        handleRewardDismiss,
    };
}

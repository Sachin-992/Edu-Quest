/* ═══════════════════════════════════════════════════
   Retention Engine — central config + pure functions
   ═══════════════════════════════════════════════════ */

// ── Streak Multiplier ──────────────────────────────
export const STREAK_TIERS = [
    { minDays: 30, multiplier: 3.0, label: "🌟 Legendary!", color: "text-amber-400" },
    { minDays: 14, multiplier: 2.5, label: "🔥🔥🔥 Unstoppable!", color: "text-orange-500" },
    { minDays: 7, multiplier: 2.0, label: "🔥🔥 On Fire!", color: "text-orange-400" },
    { minDays: 3, multiplier: 1.5, label: "🔥 Streak Bonus!", color: "text-orange-300" },
    { minDays: 0, multiplier: 1.0, label: "", color: "" },
] as const;

export function getStreakMultiplier(streakDays: number) {
    const tier = STREAK_TIERS.find((t) => streakDays >= t.minDays)!;
    return { multiplier: tier.multiplier, label: tier.label, color: tier.color };
}

// ── Rank Tiers ─────────────────────────────────────
export type RankId = "bronze" | "silver" | "gold" | "platinum";

export interface RankTier {
    id: RankId;
    name: string;
    emoji: string;
    minXP: number;
    level: number;
    color: string;
    gradient: string;
    ring: string;
}

export const RANK_TIERS: RankTier[] = [
    { id: "platinum", name: "Platinum", emoji: "💎", minXP: 1200, level: 4, color: "#E5E4E2", gradient: "from-slate-300 via-white to-slate-400", ring: "ring-slate-300" },
    { id: "gold", name: "Gold", emoji: "🥇", minXP: 500, level: 3, color: "#FFD700", gradient: "from-amber-300 via-yellow-200 to-amber-400", ring: "ring-amber-400" },
    { id: "silver", name: "Silver", emoji: "🥈", minXP: 150, level: 2, color: "#C0C0C0", gradient: "from-gray-300 via-gray-100 to-gray-400", ring: "ring-gray-400" },
    { id: "bronze", name: "Bronze", emoji: "🥉", minXP: 0, level: 1, color: "#CD7F32", gradient: "from-orange-400 via-orange-200 to-orange-500", ring: "ring-orange-400" },
];

export function getRank(totalXP: number): RankTier {
    return RANK_TIERS.find((r) => totalXP >= r.minXP)!;
}

export function getNextRank(totalXP: number): { rank: RankTier; xpNeeded: number } | null {
    const currentIdx = RANK_TIERS.findIndex((r) => totalXP >= r.minXP);
    if (currentIdx <= 0) return null; // already platinum
    const next = RANK_TIERS[currentIdx - 1];
    return { rank: next, xpNeeded: next.minXP - totalXP };
}

// ── Daily Login Bonus ──────────────────────────────
export const LOGIN_BONUS_CYCLE = [
    { day: 1, xp: 5, label: "+5 XP", special: false },
    { day: 2, xp: 10, label: "+10 XP", special: false },
    { day: 3, xp: 15, label: "+15 XP + 🏅", special: true },
    { day: 4, xp: 20, label: "+20 XP", special: false },
    { day: 5, xp: 25, label: "+25 XP", special: false },
    { day: 6, xp: 30, label: "+30 XP", special: false },
    { day: 7, xp: 50, label: "+50 XP + 🎁", special: true },
];

const LOGIN_STORAGE_KEY = "eduspark_daily_login";

interface LoginState {
    lastClaimDate: string; // YYYY-MM-DD
    consecutiveDays: number;
    claimedToday: boolean;
}

function todayStr(): string {
    const now = new Date();
    const istMs = now.getTime() + 330 * 60 * 1000;
    return new Date(istMs).toISOString().slice(0, 10);
}

function yesterdayStr(): string {
    const now = new Date();
    const istMs = now.getTime() + 330 * 60 * 1000 - 86400000;
    return new Date(istMs).toISOString().slice(0, 10);
}

export function getLoginState(): LoginState {
    try {
        const raw = localStorage.getItem(LOGIN_STORAGE_KEY);
        if (!raw) return { lastClaimDate: "", consecutiveDays: 0, claimedToday: false };
        const state: LoginState = JSON.parse(raw);
        const today = todayStr();
        // Check if already claimed today
        if (state.lastClaimDate === today) {
            return { ...state, claimedToday: true };
        }
        // Check if chain is broken (not yesterday)
        if (state.lastClaimDate !== yesterdayStr()) {
            return { lastClaimDate: state.lastClaimDate, consecutiveDays: 0, claimedToday: false };
        }
        return { ...state, claimedToday: false };
    } catch {
        return { lastClaimDate: "", consecutiveDays: 0, claimedToday: false };
    }
}

export function claimLoginBonus(): { xp: number; dayInCycle: number; special: boolean } {
    const state = getLoginState();
    if (state.claimedToday) return { xp: 0, dayInCycle: 0, special: false };

    const newConsecutive = state.consecutiveDays + 1;
    const dayInCycle = ((newConsecutive - 1) % 7); // 0-indexed
    const bonus = LOGIN_BONUS_CYCLE[dayInCycle];

    const newState: LoginState = {
        lastClaimDate: todayStr(),
        consecutiveDays: newConsecutive,
        claimedToday: true,
    };
    localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(newState));

    return { xp: bonus.xp, dayInCycle: dayInCycle + 1, special: bonus.special };
}

// ── Badges — expanded ──────────────────────────────
export interface BadgeDef {
    id: string;
    icon: string;
    name: string;
    description: string;
    category: "learning" | "streaks" | "quizzes" | "adventure" | "special";
    condition: (s: BadgeStats) => boolean;
    progress: (s: BadgeStats) => { current: number; target: number };
}

export interface BadgeStats {
    totalXP: number;
    lessonsCompleted: number;
    quizzesCompleted: number;
    perfectQuizzes: number;
    streakDays: number;
    avgScore: number;
    adventureLevels: number;
    adventureStars: number;
    loginDays: number;
}

export const ALL_BADGES: BadgeDef[] = [
    // Learning
    {
        id: "first_lesson", icon: "📖", name: "First Steps", description: "Complete your first lesson", category: "learning",
        condition: (s) => s.lessonsCompleted >= 1, progress: (s) => ({ current: Math.min(s.lessonsCompleted, 1), target: 1 })
    },
    {
        id: "five_lessons", icon: "📚", name: "Bookworm", description: "Complete 5 lessons", category: "learning",
        condition: (s) => s.lessonsCompleted >= 5, progress: (s) => ({ current: Math.min(s.lessonsCompleted, 5), target: 5 })
    },
    {
        id: "ten_lessons", icon: "🎒", name: "Scholar", description: "Complete 10 lessons", category: "learning",
        condition: (s) => s.lessonsCompleted >= 10, progress: (s) => ({ current: Math.min(s.lessonsCompleted, 10), target: 10 })
    },
    {
        id: "twenty_lessons", icon: "🏫", name: "Professor", description: "Complete 20 lessons", category: "learning",
        condition: (s) => s.lessonsCompleted >= 20, progress: (s) => ({ current: Math.min(s.lessonsCompleted, 20), target: 20 })
    },

    // Quizzes
    {
        id: "quiz_ace", icon: "🎯", name: "Quiz Ace", description: "Complete your first quiz", category: "quizzes",
        condition: (s) => s.quizzesCompleted >= 1, progress: (s) => ({ current: Math.min(s.quizzesCompleted, 1), target: 1 })
    },
    {
        id: "perfect_quiz", icon: "💯", name: "Perfect Score", description: "Get 100% on a quiz", category: "quizzes",
        condition: (s) => s.perfectQuizzes >= 1, progress: (s) => ({ current: Math.min(s.perfectQuizzes, 1), target: 1 })
    },
    {
        id: "five_perfect", icon: "🌟", name: "Quiz Master", description: "Get 5 perfect scores", category: "quizzes",
        condition: (s) => s.perfectQuizzes >= 5, progress: (s) => ({ current: Math.min(s.perfectQuizzes, 5), target: 5 })
    },
    {
        id: "ten_quizzes", icon: "📝", name: "Quiz Champion", description: "Complete 10 quizzes", category: "quizzes",
        condition: (s) => s.quizzesCompleted >= 10, progress: (s) => ({ current: Math.min(s.quizzesCompleted, 10), target: 10 })
    },

    // Streaks
    {
        id: "streak_3", icon: "🔥", name: "On Fire", description: "3-day streak", category: "streaks",
        condition: (s) => s.streakDays >= 3, progress: (s) => ({ current: Math.min(s.streakDays, 3), target: 3 })
    },
    {
        id: "streak_7", icon: "⚡", name: "Week Warrior", description: "7-day streak", category: "streaks",
        condition: (s) => s.streakDays >= 7, progress: (s) => ({ current: Math.min(s.streakDays, 7), target: 7 })
    },
    {
        id: "streak_14", icon: "💪", name: "Unstoppable", description: "14-day streak", category: "streaks",
        condition: (s) => s.streakDays >= 14, progress: (s) => ({ current: Math.min(s.streakDays, 14), target: 14 })
    },
    {
        id: "streak_30", icon: "🌟", name: "Legendary", description: "30-day streak", category: "streaks",
        condition: (s) => s.streakDays >= 30, progress: (s) => ({ current: Math.min(s.streakDays, 30), target: 30 })
    },

    // XP milestones
    {
        id: "xp_100", icon: "💫", name: "Century", description: "Earn 100 XP", category: "special",
        condition: (s) => s.totalXP >= 100, progress: (s) => ({ current: Math.min(s.totalXP, 100), target: 100 })
    },
    {
        id: "xp_500", icon: "🏅", name: "Gold Rush", description: "Earn 500 XP", category: "special",
        condition: (s) => s.totalXP >= 500, progress: (s) => ({ current: Math.min(s.totalXP, 500), target: 500 })
    },
    {
        id: "xp_1000", icon: "👑", name: "XP King", description: "Earn 1000 XP", category: "special",
        condition: (s) => s.totalXP >= 1000, progress: (s) => ({ current: Math.min(s.totalXP, 1000), target: 1000 })
    },

    // Adventure
    {
        id: "adventure_1", icon: "🗺️", name: "Explorer", description: "Complete 1 adventure level", category: "adventure",
        condition: (s) => s.adventureLevels >= 1, progress: (s) => ({ current: Math.min(s.adventureLevels, 1), target: 1 })
    },
    {
        id: "adventure_5", icon: "⚔️", name: "Adventurer", description: "Complete 5 adventure levels", category: "adventure",
        condition: (s) => s.adventureLevels >= 5, progress: (s) => ({ current: Math.min(s.adventureLevels, 5), target: 5 })
    },
    {
        id: "adventure_stars", icon: "⭐", name: "Star Collector", description: "Earn 15 adventure stars", category: "adventure",
        condition: (s) => s.adventureStars >= 15, progress: (s) => ({ current: Math.min(s.adventureStars, 15), target: 15 })
    },

    // Special / Rank
    {
        id: "rank_silver", icon: "🥈", name: "Silver Rank", description: "Reach Silver rank", category: "special",
        condition: (s) => s.totalXP >= 150, progress: (s) => ({ current: Math.min(s.totalXP, 150), target: 150 })
    },
    {
        id: "rank_gold", icon: "🥇", name: "Gold Rank", description: "Reach Gold rank", category: "special",
        condition: (s) => s.totalXP >= 500, progress: (s) => ({ current: Math.min(s.totalXP, 500), target: 500 })
    },
    {
        id: "rank_platinum", icon: "💎", name: "Platinum Rank", description: "Reach Platinum rank", category: "special",
        condition: (s) => s.totalXP >= 1200, progress: (s) => ({ current: Math.min(s.totalXP, 1200), target: 1200 })
    },
];

// ── Weekly Challenge ───────────────────────────────
export interface WeeklyChallengeDef {
    id: string;
    title: string;
    emoji: string;
    target: number;
    xpReward: number;
    getProgress: (s: BadgeStats) => number;
}

// Rotate challenges weekly using ISO week number
function getISOWeek(): number {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

const WEEKLY_CHALLENGES: WeeklyChallengeDef[] = [
    { id: "lessons_10", title: "Complete 10 lessons this week", emoji: "📚", target: 10, xpReward: 50, getProgress: (s) => s.lessonsCompleted },
    { id: "quizzes_5", title: "Pass 5 quizzes this week", emoji: "📝", target: 5, xpReward: 40, getProgress: (s) => s.quizzesCompleted },
    { id: "streak_7", title: "Maintain a 7-day streak", emoji: "🔥", target: 7, xpReward: 60, getProgress: (s) => s.streakDays },
    { id: "xp_200", title: "Earn 200 XP this week", emoji: "⭐", target: 200, xpReward: 45, getProgress: (s) => s.totalXP },
    { id: "perfect_3", title: "Get 3 perfect quiz scores", emoji: "💯", target: 3, xpReward: 55, getProgress: (s) => s.perfectQuizzes },
];

export function getCurrentWeeklyChallenge(): WeeklyChallengeDef {
    const week = getISOWeek();
    return WEEKLY_CHALLENGES[week % WEEKLY_CHALLENGES.length];
}

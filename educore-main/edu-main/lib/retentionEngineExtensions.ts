/* ═══════════════════════════════════════════════════
   Retention Engine Extensions — Phase 4 utilities
   Adds: Daily Quest generation, Streak Freeze, Gem economy
   ═══════════════════════════════════════════════════ */

// ── Gem Economy ────────────────────────────────────

const GEM_STORAGE_KEY = "eq_gems";
const STREAK_FREEZE_KEY = "eq_streak_freezes";
const MAX_STREAK_FREEZES = 3;
const STREAK_FREEZE_COST = 5; // gems

export function getGemBalance(): number {
  return parseInt(localStorage.getItem(GEM_STORAGE_KEY) || "0");
}

export function addGems(amount: number): number {
  const newBalance = getGemBalance() + amount;
  localStorage.setItem(GEM_STORAGE_KEY, String(Math.max(0, newBalance)));
  return newBalance;
}

export function spendGems(amount: number): boolean {
  const balance = getGemBalance();
  if (balance < amount) return false;
  localStorage.setItem(GEM_STORAGE_KEY, String(balance - amount));
  return true;
}

// ── Streak Freeze ──────────────────────────────────

export function getStreakFreezeCount(): number {
  return Math.min(
    parseInt(localStorage.getItem(STREAK_FREEZE_KEY) || "0"),
    MAX_STREAK_FREEZES
  );
}

export function buyStreakFreeze(): { success: boolean; freezes: number; gems: number } {
  const freezes = getStreakFreezeCount();
  if (freezes >= MAX_STREAK_FREEZES) {
    return { success: false, freezes, gems: getGemBalance() };
  }
  if (!spendGems(STREAK_FREEZE_COST)) {
    return { success: false, freezes, gems: getGemBalance() };
  }
  const newFreezes = freezes + 1;
  localStorage.setItem(STREAK_FREEZE_KEY, String(newFreezes));
  return { success: true, freezes: newFreezes, gems: getGemBalance() };
}

export function useStreakFreeze(): boolean {
  const freezes = getStreakFreezeCount();
  if (freezes <= 0) return false;
  localStorage.setItem(STREAK_FREEZE_KEY, String(freezes - 1));
  return true;
}

// ── Daily Quest Generation ─────────────────────────

export interface DailyQuest {
  id: string;
  type: "complete_lessons" | "earn_xp" | "perfect_quiz" | "streak_maintain" | "word_of_day";
  title: string;
  description: string;
  emoji: string;
  target: number;
  xpReward: number;
}

const QUEST_POOL: DailyQuest[] = [
  { id: "q_lessons_2", type: "complete_lessons", title: "Study Session", description: "Complete 2 lessons today", emoji: "📖", target: 2, xpReward: 15 },
  { id: "q_lessons_3", type: "complete_lessons", title: "Triple Study", description: "Complete 3 lessons today", emoji: "📚", target: 3, xpReward: 20 },
  { id: "q_xp_30", type: "earn_xp", title: "XP Hunter", description: "Earn 30 XP today", emoji: "⭐", target: 30, xpReward: 10 },
  { id: "q_xp_50", type: "earn_xp", title: "XP Champion", description: "Earn 50 XP today", emoji: "🌟", target: 50, xpReward: 15 },
  { id: "q_perfect", type: "perfect_quiz", title: "Perfectionist", description: "Score 100% on a quiz", emoji: "💯", target: 1, xpReward: 20 },
  { id: "q_streak_3", type: "streak_maintain", title: "Fire Keeper", description: "Maintain a 3-day streak", emoji: "🔥", target: 3, xpReward: 10 },
  { id: "q_streak_5", type: "streak_maintain", title: "Blaze Trail", description: "Maintain a 5-day streak", emoji: "🔥", target: 5, xpReward: 15 },
  { id: "q_word", type: "word_of_day", title: "Word Explorer", description: "Complete Word of the Day", emoji: "📝", target: 1, xpReward: 10 },
];

function seededRandom(seed: number): () => number {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    return x / 0x7fffffff;
  };
}

function dateSeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export function getTodayQuests(): DailyQuest[] {
  const rand = seededRandom(dateSeed());
  const shuffled = [...QUEST_POOL].sort(() => rand() - 0.5);
  
  // Pick 3 quests with unique types
  const selected: DailyQuest[] = [];
  const usedTypes = new Set<string>();
  
  for (const quest of shuffled) {
    if (selected.length >= 3) break;
    if (!usedTypes.has(quest.type)) {
      selected.push(quest);
      usedTypes.add(quest.type);
    }
  }
  
  // Fallback: if we somehow have < 3, fill from shuffled
  while (selected.length < 3) {
    selected.push(shuffled[selected.length]);
  }
  
  return selected;
}

// ── Mystery Box Prizes ─────────────────────────────

export interface MysteryPrize {
  type: "xp" | "gems" | "streak_freeze";
  amount: number;
  emoji: string;
  label: string;
  rarity: "common" | "rare" | "epic";
}

export function rollMysteryPrize(): MysteryPrize {
  const roll = Math.random();
  
  if (roll < 0.05) {
    return { type: "streak_freeze", amount: 1, emoji: "❄️", label: "Streak Freeze", rarity: "epic" };
  } else if (roll < 0.25) {
    const gems = Math.floor(Math.random() * 4) + 2;
    return { type: "gems", amount: gems, emoji: "💎", label: `${gems} Gems`, rarity: "rare" };
  } else {
    const xp = (Math.floor(Math.random() * 4) + 1) * 10;
    return { type: "xp", amount: xp, emoji: "⭐", label: `${xp} Bonus XP`, rarity: "common" };
  }
}

export function applyMysteryPrize(prize: MysteryPrize): void {
  switch (prize.type) {
    case "gems":
      addGems(prize.amount);
      break;
    case "streak_freeze": {
      const current = getStreakFreezeCount();
      if (current < MAX_STREAK_FREEZES) {
        localStorage.setItem(STREAK_FREEZE_KEY, String(current + 1));
      } else {
        // Convert to gems if maxed
        addGems(3);
      }
      break;
    }
    case "xp":
      // XP is handled by the calling component
      break;
  }
}

// ── Title System ───────────────────────────────────

export interface TitleDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  condition: (stats: TitleStats) => boolean;
}

export interface TitleStats {
  totalXP: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  perfectQuizzes: number;
  streakDays: number;
  gamesPlayed: number;
}

export const ALL_TITLES: TitleDef[] = [
  { id: "newcomer", name: "Newcomer", emoji: "🌱", description: "Just getting started!", condition: () => true },
  { id: "bookworm", name: "Bookworm", emoji: "📚", description: "Complete 5 lessons", condition: (s) => s.lessonsCompleted >= 5 },
  { id: "quiz_master", name: "Quiz Master", emoji: "🎯", description: "Complete 10 quizzes", condition: (s) => s.quizzesCompleted >= 10 },
  { id: "perfectionist", name: "Perfectionist", emoji: "💯", description: "Get 5 perfect scores", condition: (s) => s.perfectQuizzes >= 5 },
  { id: "streak_champion", name: "Streak Champion", emoji: "🔥", description: "7-day streak", condition: (s) => s.streakDays >= 7 },
  { id: "xp_legend", name: "XP Legend", emoji: "⭐", description: "Earn 500 XP", condition: (s) => s.totalXP >= 500 },
  { id: "scholar", name: "Scholar", emoji: "🎓", description: "Complete 20 lessons", condition: (s) => s.lessonsCompleted >= 20 },
  { id: "game_master", name: "Game Master", emoji: "🎮", description: "Play 10 mini-games", condition: (s) => s.gamesPlayed >= 10 },
  { id: "diamond_rank", name: "Diamond Rank", emoji: "💎", description: "Reach 1200 XP", condition: (s) => s.totalXP >= 1200 },
  { id: "unstoppable", name: "Unstoppable", emoji: "⚡", description: "14-day streak", condition: (s) => s.streakDays >= 14 },
];

export function getUnlockedTitles(stats: TitleStats): TitleDef[] {
  return ALL_TITLES.filter((t) => t.condition(stats));
}

export function getActiveTitle(): string {
  return localStorage.getItem("eq_active_title") || "newcomer";
}

export function setActiveTitle(titleId: string): void {
  localStorage.setItem("eq_active_title", titleId);
}

export { MAX_STREAK_FREEZES, STREAK_FREEZE_COST };

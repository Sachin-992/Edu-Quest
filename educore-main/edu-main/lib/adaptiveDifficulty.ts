/* ═══════════════════════════════════════════════════
   Adaptive Difficulty Engine — Phase 5
   Tracks student performance across English Buddy games
   and recommends appropriate difficulty levels.
   ═══════════════════════════════════════════════════ */

const STORAGE_KEY = 'eq_adaptive_history';
const RECENT_WINDOW = 10; // last N attempts used for analysis

// ── Types ──────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';
export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';

export interface AttemptRecord {
  gameType: string;
  difficulty: string;
  score: number;
  maxScore: number;
  percentage: number;
  timestamp: number;
}

export interface PerformanceSummary {
  gamesPlayed: number;
  averageScore: number;
  level: StudentLevel;
  bestGameType: string | null;
  weakestGameType: string | null;
  recommendedNextSteps: string[];
  recentTrend: 'improving' | 'declining' | 'stable';
}

export interface GameTypeStats {
  gameType: string;
  gamesPlayed: number;
  averageScore: number;
  bestScore: number;
  recommendedDifficulty: Difficulty;
}

// ── Storage Helpers ────────────────────────────────

function getHistory(): AttemptRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AttemptRecord[];
  } catch {
    return [];
  }
}

function saveHistory(history: AttemptRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// ── Core Functions ─────────────────────────────────

/**
 * Records a student's attempt at a game.
 * Stores the result in localStorage for future analysis.
 */
export function recordAttempt(
  gameType: string,
  difficulty: string,
  score: number,
  maxScore: number,
): void {
  const history = getHistory();
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  const record: AttemptRecord = {
    gameType,
    difficulty,
    score,
    maxScore,
    percentage,
    timestamp: Date.now(),
  };

  history.push(record);

  // Keep only last 500 records to avoid storage bloat
  if (history.length > 500) {
    history.splice(0, history.length - 500);
  }

  saveHistory(history);
}

/**
 * Analyzes the last 10 attempts for a given game type
 * and recommends an appropriate difficulty level.
 *
 * - avg > 80%  → suggest harder
 * - avg < 40%  → suggest easier
 * - otherwise  → maintain current
 */
export function getRecommendedDifficulty(gameType: string): Difficulty {
  const history = getHistory();
  const gameAttempts = history
    .filter((a) => a.gameType === gameType)
    .slice(-RECENT_WINDOW);

  if (gameAttempts.length === 0) return 'easy';

  const avgScore =
    gameAttempts.reduce((sum, a) => sum + a.percentage, 0) / gameAttempts.length;

  // Determine current difficulty from most recent attempt
  const lastAttempt = gameAttempts[gameAttempts.length - 1];
  const currentDifficulty = (lastAttempt.difficulty as Difficulty) || 'easy';

  if (avgScore > 80) {
    // Suggest harder
    if (currentDifficulty === 'easy') return 'medium';
    if (currentDifficulty === 'medium') return 'hard';
    return 'hard'; // already at max
  }

  if (avgScore < 40) {
    // Suggest easier
    if (currentDifficulty === 'hard') return 'medium';
    if (currentDifficulty === 'medium') return 'easy';
    return 'easy'; // already at min
  }

  // Maintain current
  return currentDifficulty;
}

/**
 * Determines the student's overall English level
 * based on all recorded attempts.
 */
export function getStudentLevel(): StudentLevel {
  const history = getHistory();
  if (history.length === 0) return 'beginner';

  const recentAttempts = history.slice(-30);
  const avgScore =
    recentAttempts.reduce((sum, a) => sum + a.percentage, 0) / recentAttempts.length;

  // Factor in difficulty weights
  const difficultyWeights: Record<string, number> = {
    easy: 1,
    medium: 1.5,
    hard: 2,
  };

  const weightedAvg =
    recentAttempts.reduce((sum, a) => {
      const weight = difficultyWeights[a.difficulty] || 1;
      return sum + a.percentage * weight;
    }, 0) /
    recentAttempts.reduce((sum, a) => {
      return sum + (difficultyWeights[a.difficulty] || 1) * 100;
    }, 0) *
    100;

  // Combine raw average and weighted average
  const combinedScore = (avgScore + weightedAvg) / 2;

  if (combinedScore >= 70 && history.length >= 15) return 'advanced';
  if (combinedScore >= 45 && history.length >= 5) return 'intermediate';
  return 'beginner';
}

/**
 * Returns a comprehensive performance summary
 * with stats, level, and recommended next steps.
 */
export function getPerformanceSummary(): PerformanceSummary {
  const history = getHistory();
  const level = getStudentLevel();
  const strengths = getStrengths();
  const weaknesses = getWeaknesses();

  if (history.length === 0) {
    return {
      gamesPlayed: 0,
      averageScore: 0,
      level,
      bestGameType: null,
      weakestGameType: null,
      recommendedNextSteps: [
        'Try your first English Buddy game!',
        'Start with an easy difficulty to warm up',
      ],
      recentTrend: 'stable',
    };
  }

  const avgScore =
    Math.round(
      history.reduce((sum, a) => sum + a.percentage, 0) / history.length,
    );

  // Calculate trend from recent vs older attempts
  const recentTrend = calculateTrend(history);

  // Build recommended next steps
  const nextSteps: string[] = [];

  if (weaknesses.length > 0) {
    nextSteps.push(`Practice more ${weaknesses[0].gameType} — it's your weakest area`);
  }
  if (strengths.length > 0 && strengths[0].averageScore > 75) {
    const rec = getRecommendedDifficulty(strengths[0].gameType);
    if (rec !== 'hard') {
      nextSteps.push(`Try ${strengths[0].gameType} on ${rec} difficulty — you're ready!`);
    } else {
      nextSteps.push(`You're mastering ${strengths[0].gameType} — keep it up! 🌟`);
    }
  }
  if (level === 'beginner') {
    nextSteps.push('Play more games to build your skills');
  }
  if (recentTrend === 'improving') {
    nextSteps.push('Great progress! Try bumping up the difficulty');
  }
  if (recentTrend === 'declining') {
    nextSteps.push('Consider lowering the difficulty to rebuild confidence');
  }

  // Ensure at least 2 tips
  if (nextSteps.length < 2) {
    nextSteps.push('Consistent daily practice leads to the best results');
  }

  return {
    gamesPlayed: history.length,
    averageScore: avgScore,
    level,
    bestGameType: strengths.length > 0 ? strengths[0].gameType : null,
    weakestGameType: weaknesses.length > 0 ? weaknesses[0].gameType : null,
    recommendedNextSteps: nextSteps,
    recentTrend,
  };
}

/**
 * Identifies game types where the student performs best.
 * Returns sorted list (strongest first).
 */
export function getStrengths(): GameTypeStats[] {
  return getGameTypeStats()
    .filter((g) => g.gamesPlayed >= 2)
    .sort((a, b) => b.averageScore - a.averageScore);
}

/**
 * Identifies game types where the student struggles.
 * Returns sorted list (weakest first).
 */
export function getWeaknesses(): GameTypeStats[] {
  return getGameTypeStats()
    .filter((g) => g.gamesPlayed >= 2)
    .sort((a, b) => a.averageScore - b.averageScore);
}

// ── Internal Helpers ───────────────────────────────

function getGameTypeStats(): GameTypeStats[] {
  const history = getHistory();
  const gameTypes = new Map<string, AttemptRecord[]>();

  for (const attempt of history) {
    const existing = gameTypes.get(attempt.gameType) || [];
    existing.push(attempt);
    gameTypes.set(attempt.gameType, existing);
  }

  const stats: GameTypeStats[] = [];

  for (const [gameType, attempts] of gameTypes) {
    const avgScore = Math.round(
      attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length,
    );
    const bestScore = Math.max(...attempts.map((a) => a.percentage));

    stats.push({
      gameType,
      gamesPlayed: attempts.length,
      averageScore: avgScore,
      bestScore,
      recommendedDifficulty: getRecommendedDifficulty(gameType),
    });
  }

  return stats;
}

function calculateTrend(
  history: AttemptRecord[],
): 'improving' | 'declining' | 'stable' {
  if (history.length < 6) return 'stable';

  const recent = history.slice(-5);
  const older = history.slice(-10, -5);

  if (older.length === 0) return 'stable';

  const recentAvg =
    recent.reduce((sum, a) => sum + a.percentage, 0) / recent.length;
  const olderAvg =
    older.reduce((sum, a) => sum + a.percentage, 0) / older.length;

  const diff = recentAvg - olderAvg;

  if (diff > 10) return 'improving';
  if (diff < -10) return 'declining';
  return 'stable';
}

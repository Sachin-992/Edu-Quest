// ═══════════════════════════════════════════════════════════════
// Skill World Learning Ecosystem — Shared Types
// ═══════════════════════════════════════════════════════════════

export interface SkillCategory {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  glowColor: string;
  description: string;
}

export interface StoryScene {
  title: string;
  text: string;
  illustration: string;   // emoji
  speaker: string;
  dialogue: string;
}

export interface DecisionOption {
  id: string;
  text: string;
  emoji: string;
  consequence: {
    title: string;
    text: string;
    illustration: string;
    dialogue: string;
    isCorrect: boolean;
    lesson: string;
  };
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SkillLesson {
  id: string;
  categoryId: string;
  gradeMin: number;
  gradeMax: number;
  difficulty: Difficulty;
  order: number;
  title: string;
  subtitle: string;
  character: string;
  characterEmoji: string;
  valuesTaught: string[];
  scenes: StoryScene[];
  decision: {
    question: string;
    options: DecisionOption[];
  };
  quiz: QuizQuestion[];
  xpReward: number;
  coinReward: number;
  badgeName?: string;
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'master' | 'legend';

export interface GradeBandInfo {
  id: string;
  label: string;
  grades: number[];
  emoji: string;
  color: string;
  description: string;
}

export const GRADE_BANDS: GradeBandInfo[] = [
  { id: '1-2', label: 'Little Stars',       grades: [1, 2], emoji: '⭐', color: 'from-yellow-400 to-orange-400',  description: 'Fun visual learning with simple stories!' },
  { id: '3-4', label: 'Rising Explorers',   grades: [3, 4], emoji: '🚀', color: 'from-blue-400 to-cyan-400',     description: 'Build skills through exciting adventures!' },
  { id: '5-6', label: 'Smart Challengers',  grades: [5, 6], emoji: '🧠', color: 'from-purple-400 to-pink-400',   description: 'Tackle real-world challenges!' },
  { id: '7-8', label: 'Future Leaders',     grades: [7, 8], emoji: '👑', color: 'from-emerald-400 to-teal-400',  description: 'Prepare for leadership & career!' },
];

export const DIFFICULTY_META: Record<Difficulty, { label: string; emoji: string; color: string }> = {
  beginner:     { label: 'Beginner',      emoji: '🌱', color: 'text-green-500' },
  intermediate: { label: 'Intermediate',  emoji: '⚡', color: 'text-blue-500' },
  advanced:     { label: 'Advanced',      emoji: '🔥', color: 'text-orange-500' },
  master:       { label: 'Master',        emoji: '💎', color: 'text-purple-500' },
  legend:       { label: 'Legend',        emoji: '👑', color: 'text-amber-500' },
};

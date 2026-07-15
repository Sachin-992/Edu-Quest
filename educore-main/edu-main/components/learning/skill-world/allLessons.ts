// ═══════════════════════════════════════════════════════════════
// Skill World — Combined Lesson Data (barrel export)
// ═══════════════════════════════════════════════════════════════

import PRIMARY_LESSONS from './lessonDataPrimary';
import SECONDARY_LESSONS from './lessonDataSecondary';
import type { SkillLesson } from './types';

const ALL_SKILL_LESSONS: SkillLesson[] = [
  ...PRIMARY_LESSONS,
  ...SECONDARY_LESSONS,
];

export default ALL_SKILL_LESSONS;

/** Helper: get lessons for a specific category + grade band */
export function getLessonsForCategoryAndGrade(
  categoryId: string,
  gradeMin: number,
  gradeMax: number,
): SkillLesson[] {
  return ALL_SKILL_LESSONS
    .filter(l => l.categoryId === categoryId && l.gradeMin === gradeMin && l.gradeMax === gradeMax)
    .sort((a, b) => a.order - b.order);
}

/** Helper: get all lessons for a grade band */
export function getLessonsForGradeBand(gradeMin: number, gradeMax: number): SkillLesson[] {
  return ALL_SKILL_LESSONS
    .filter(l => l.gradeMin === gradeMin && l.gradeMax === gradeMax)
    .sort((a, b) => a.order - b.order);
}

/** Helper: get unique categories that have lessons for a grade band */
export function getCategoriesWithLessons(gradeMin: number, gradeMax: number): string[] {
  const ids = new Set<string>();
  ALL_SKILL_LESSONS
    .filter(l => l.gradeMin === gradeMin && l.gradeMax === gradeMax)
    .forEach(l => ids.add(l.categoryId));
  return Array.from(ids);
}

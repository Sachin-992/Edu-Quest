/* ═══════════════════════════════════════════════════
   Engagement Analytics — pure computation functions
   ═══════════════════════════════════════════════════ */

export interface ProgressRow {
    user_id: string;
    lesson_id?: string | null;
    quiz_id?: string | null;
    status: string;
    xp_earned: number;
    score?: number | null;
    completed_at?: string | null;
}

export interface AdventureRow {
    user_id: string;
    world_id: string;
    level_number: number;
    stars_earned: number;
    is_completed: boolean;
    completed_at?: string | null;
}

export interface StudentProfile {
    id: string;
    full_name: string;
    class_level?: string | null;
}

export interface LessonRow {
    id: string;
    title: string;
    subject_id: string;
}

export interface SubjectRow {
    id: string;
    name: string;
    class_level?: number | null;
}

// ── Subject Enjoyment ──────────────────────────────
export interface SubjectEnjoyment {
    subjectId: string;
    subjectName: string;
    completionCount: number;
    avgScore: number;
    enjoymentScore: number; // 0-100
}

export function computeSubjectEnjoyment(
    progress: ProgressRow[],
    lessons: LessonRow[],
    subjects: SubjectRow[]
): SubjectEnjoyment[] {
    const lessonToSubject = new Map<string, string>();
    lessons.forEach((l) => lessonToSubject.set(l.id, l.subject_id));

    const subjectMap = new Map<string, { completions: number; totalScore: number; quizCount: number }>();
    subjects.forEach((s) => subjectMap.set(s.id, { completions: 0, totalScore: 0, quizCount: 0 }));

    progress.forEach((p) => {
        if (p.status !== "completed") return;
        if (p.lesson_id) {
            const sid = lessonToSubject.get(p.lesson_id);
            if (sid && subjectMap.has(sid)) {
                subjectMap.get(sid)!.completions++;
            }
        }
        if (p.quiz_id && p.score != null) {
            // Try to find subject through lesson-quiz relationship (approximate)
            // For now, count all quiz scores
        }
    });

    const maxCompletions = Math.max(1, ...Array.from(subjectMap.values()).map((v) => v.completions));

    return subjects.map((s) => {
        const data = subjectMap.get(s.id) || { completions: 0, totalScore: 0, quizCount: 0 };
        const completionRate = (data.completions / maxCompletions) * 100;
        return {
            subjectId: s.id,
            subjectName: s.class_level ? `${s.name} — Class ${s.class_level}` : s.name,
            completionCount: data.completions,
            avgScore: data.quizCount > 0 ? Math.round(data.totalScore / data.quizCount) : 0,
            enjoymentScore: Math.round(completionRate),
        };
    }).sort((a, b) => b.enjoymentScore - a.enjoymentScore);
}

// ── Hardest Lessons ────────────────────────────────
export interface HardLesson {
    lessonId: string;
    lessonTitle: string;
    subjectName: string;
    avgScore: number;
    attempts: number;
}

export function computeHardestLessons(
    progress: ProgressRow[],
    lessons: LessonRow[],
    subjects: SubjectRow[]
): HardLesson[] {
    const subjectNames = new Map<string, string>();
    subjects.forEach((s) => subjectNames.set(s.id, s.class_level ? `${s.name} — Class ${s.class_level}` : s.name));

    const lessonMap = new Map<string, { title: string; subjectName: string; totalScore: number; count: number }>();
    lessons.forEach((l) => {
        lessonMap.set(l.id, {
            title: l.title,
            subjectName: subjectNames.get(l.subject_id) || "Unknown",
            totalScore: 0,
            count: 0,
        });
    });

    progress.forEach((p) => {
        if (p.lesson_id && p.status === "completed") {
            const lesson = lessonMap.get(p.lesson_id);
            if (lesson) {
                lesson.count++;
                if (p.score != null) {
                    lesson.totalScore += p.score;
                }
            }
        }
    });

    return Array.from(lessonMap.entries())
        .filter(([, v]) => v.count > 0)
        .map(([id, v]) => ({
            lessonId: id,
            lessonTitle: v.title,
            subjectName: v.subjectName,
            avgScore: v.count > 0 ? Math.round(v.totalScore / v.count) : 0,
            attempts: v.count,
        }))
        .sort((a, b) => a.avgScore - b.avgScore)
        .slice(0, 10);
}

// ── Engagement Heatmap ─────────────────────────────
// Returns a 7×24 matrix: [dayOfWeek][hour] = count
export function computeHeatmap(progress: ProgressRow[]): number[][] {
    const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

    progress.forEach((p) => {
        if (!p.completed_at) return;
        const d = new Date(p.completed_at);
        const istMs = d.getTime() + 330 * 60 * 1000;
        const ist = new Date(istMs);
        const day = ist.getUTCDay(); // 0=Sun
        const hour = ist.getUTCHours();
        matrix[day][hour]++;
    });

    return matrix;
}

// ── Streak per student ─────────────────────────────
export interface StudentStreak {
    userId: string;
    fullName: string;
    streakDays: number;
    lastActive: string | null;
}

function toISTDateStr(d: string): string {
    const date = new Date(d);
    const istMs = date.getTime() + 330 * 60 * 1000;
    return new Date(istMs).toISOString().slice(0, 10);
}

export function computeStudentStreaks(
    progress: ProgressRow[],
    students: StudentProfile[]
): StudentStreak[] {
    const byUser = new Map<string, string[]>();
    progress.forEach((p) => {
        if (!p.completed_at) return;
        if (!byUser.has(p.user_id)) byUser.set(p.user_id, []);
        byUser.get(p.user_id)!.push(p.completed_at);
    });

    const nowIST = toISTDateStr(new Date().toISOString());
    const yesterdayIST = toISTDateStr(new Date(Date.now() - 86400000).toISOString());

    return students.map((s) => {
        const timestamps = byUser.get(s.id) || [];
        const dates = timestamps
            .map((t) => toISTDateStr(t))
            .filter((v, i, a) => a.indexOf(v) === i)
            .sort((a, b) => b.localeCompare(a));

        let streakDays = 0;
        if (dates.length > 0 && (dates[0] === nowIST || dates[0] === yesterdayIST)) {
            streakDays = 1;
            for (let i = 1; i < dates.length; i++) {
                const diff = new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime();
                if (diff <= 86400000 * 1.5) streakDays++;
                else break;
            }
        }

        return {
            userId: s.id,
            fullName: s.full_name,
            streakDays,
            lastActive: dates[0] || null,
        };
    });
}

// ── Motivation Score (0-100) ───────────────────────
export interface StudentMotivation {
    userId: string;
    fullName: string;
    classLevel: string;
    motivationScore: number;
    streakDays: number;
    totalXP: number;
    daysSinceLastActive: number;
    trend: "up" | "down" | "stable";
    needsEncouragement: boolean;
}

export function computeMotivationScores(
    progress: ProgressRow[],
    students: StudentProfile[],
    streaks: StudentStreak[]
): StudentMotivation[] {
    const streakMap = new Map<string, StudentStreak>();
    streaks.forEach((s) => streakMap.set(s.userId, s));

    const nowIST = toISTDateStr(new Date().toISOString());

    return students.map((student) => {
        const streak = streakMap.get(student.id);
        const userProgress = progress.filter((p) => p.user_id === student.id && p.status === "completed");
        const totalXP = userProgress.reduce((sum, p) => sum + (p.xp_earned || 0), 0);

        // Days since last active
        const lastActive = streak?.lastActive || null;
        const daysSinceLastActive = lastActive
            ? Math.max(0, Math.floor((new Date(nowIST).getTime() - new Date(lastActive).getTime()) / 86400000))
            : 999;

        // Recent activity (last 7 days) vs prior 7 days
        const now = Date.now();
        const recentCount = userProgress.filter((p) =>
            p.completed_at && now - new Date(p.completed_at).getTime() < 7 * 86400000
        ).length;
        const priorCount = userProgress.filter((p) =>
            p.completed_at &&
            now - new Date(p.completed_at).getTime() >= 7 * 86400000 &&
            now - new Date(p.completed_at).getTime() < 14 * 86400000
        ).length;

        // Trend
        const trend: "up" | "down" | "stable" =
            recentCount > priorCount + 1 ? "up" :
                recentCount < priorCount - 1 ? "down" : "stable";

        // Motivation score formula:
        // 40% streak contribution (capped at 30 days)
        // 30% recency contribution (inverse of days since active, max 7)
        // 20% XP velocity (recent completions, capped at 10)
        // 10% total XP (capped at 1000)
        const streakScore = Math.min((streak?.streakDays || 0) / 30, 1) * 40;
        const recencyScore = Math.max(0, 1 - daysSinceLastActive / 7) * 30;
        const velocityScore = Math.min(recentCount / 10, 1) * 20;
        const xpScore = Math.min(totalXP / 1000, 1) * 10;

        const motivationScore = Math.round(streakScore + recencyScore + velocityScore + xpScore);

        return {
            userId: student.id,
            fullName: student.full_name,
            classLevel: student.class_level || "—",
            motivationScore,
            streakDays: streak?.streakDays || 0,
            totalXP,
            daysSinceLastActive,
            trend,
            needsEncouragement: motivationScore < 30 || daysSinceLastActive >= 5,
        };
    }).sort((a, b) => a.motivationScore - b.motivationScore); // Lowest first
}

// ── Engagement Trend (daily active users, last 30d) ─
export interface DailyEngagement {
    date: string;
    activeUsers: number;
    completions: number;
}

export function computeEngagementTrend(progress: ProgressRow[]): DailyEngagement[] {
    const days = 30;
    const result: DailyEngagement[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dateStr = toISTDateStr(d.toISOString());

        const dayProgress = progress.filter((p) =>
            p.completed_at && toISTDateStr(p.completed_at) === dateStr
        );

        const uniqueUsers = new Set(dayProgress.map((p) => p.user_id));

        result.push({
            date: dateStr,
            activeUsers: uniqueUsers.size,
            completions: dayProgress.length,
        });
    }

    return result;
}

// ── Streak Distribution ────────────────────────────
export interface StreakBucket {
    label: string;
    count: number;
    color: string;
}

export function computeStreakDistribution(streaks: StudentStreak[]): StreakBucket[] {
    const buckets = [
        { label: "0 days", min: 0, max: 0, count: 0, color: "bg-red-400" },
        { label: "1-2 days", min: 1, max: 2, count: 0, color: "bg-orange-400" },
        { label: "3-6 days", min: 3, max: 6, count: 0, color: "bg-amber-400" },
        { label: "7-13 days", min: 7, max: 13, count: 0, color: "bg-green-400" },
        { label: "14-29 days", min: 14, max: 29, count: 0, color: "bg-emerald-400" },
        { label: "30+ days", min: 30, max: Infinity, count: 0, color: "bg-cyan-400" },
    ];

    streaks.forEach((s) => {
        const bucket = buckets.find((b) => s.streakDays >= b.min && s.streakDays <= b.max);
        if (bucket) bucket.count++;
    });

    return buckets.map(({ label, count, color }) => ({ label, count, color }));
}

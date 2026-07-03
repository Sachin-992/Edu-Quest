import type { HardLesson } from "@/lib/engagementAnalytics";

interface Props {
    data: HardLesson[];
}

const HardestLessonsTable = ({ data }: Props) => {
    return (
        <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
            <div className="flex items-center gap-2">
                <span className="text-lg">📉</span>
                <h3 className="font-bold text-sm">Hardest Lessons</h3>
            </div>

            {data.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No scored lessons yet</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-muted-foreground text-left border-b border-border/30">
                                <th className="pb-2 font-semibold">#</th>
                                <th className="pb-2 font-semibold">Lesson</th>
                                <th className="pb-2 font-semibold">Subject</th>
                                <th className="pb-2 font-semibold text-center">Avg Score</th>
                                <th className="pb-2 font-semibold text-center">Attempts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((lesson, i) => (
                                <tr
                                    key={lesson.lessonId}
                                    className="border-b border-border/10 last:border-0"
                                >
                                    <td className="py-2.5 font-bold text-muted-foreground">{i + 1}</td>
                                    <td className="py-2.5 font-semibold text-foreground truncate max-w-[150px]">
                                        {lesson.lessonTitle}
                                    </td>
                                    <td className="py-2.5 text-muted-foreground">{lesson.subjectName}</td>
                                    <td className="py-2.5 text-center">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${lesson.avgScore < 40
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                                    : lesson.avgScore < 70
                                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                                        : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                                }`}
                                        >
                                            {lesson.avgScore}%
                                        </span>
                                    </td>
                                    <td className="py-2.5 text-center font-semibold">{lesson.attempts}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <p className="text-[10px] text-muted-foreground">
                Lessons sorted by lowest average score
            </p>
        </div>
    );
};

export default HardestLessonsTable;

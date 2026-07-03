import { Trophy, ChevronRight } from "lucide-react";

interface StudentScore {
    user_id: string;
    full_name: string;
    avg_score: number;
    total_xp: number;
    quizzes_taken: number;
}

interface StudentTableProps {
    students: StudentScore[];
    onSelectStudent: (student: StudentScore) => void;
}

const StudentTable = ({ students, onSelectStudent }: StudentTableProps) => {
    return (
        <div className="bg-card rounded-2xl shadow-card p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Top 5 Students
            </h3>
            {students.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No data yet</p>
            ) : (
                <div className="space-y-2">
                    {students.map((s, i) => (
                        <div
                            key={s.user_id}
                            onClick={() => onSelectStudent(s)}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-black w-7 text-center">
                                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                                </span>
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                                    {s.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{s.full_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {s.total_xp} XP · {s.quizzes_taken} quizzes
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">{s.avg_score}%</span>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentTable;

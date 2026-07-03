import { Button } from "@/components/ui/button";
import AddStudentDialog from "@/components/admin/AddStudentDialog";
import BulkImportDialog from "@/components/admin/BulkImportDialog";
import { ClipboardList, FileText, LayoutGrid, Sparkles } from "lucide-react";

interface QuickActionsBarProps {
    schoolId: string;
    onStudentAdded: () => void;
    onNavigate: (tab: string) => void;
    isTeacher?: boolean;
}

const QuickActionsBar = ({ schoolId, onStudentAdded, onNavigate, isTeacher = false }: QuickActionsBarProps) => {
    const navActions = isTeacher
        ? [
            { label: "Create Quiz", icon: ClipboardList, tab: "quizzes", gradient: "from-amber-500 to-orange-500" },
            { label: "Add Lesson", icon: FileText, tab: "lessons", gradient: "from-blue-500 to-indigo-500" },
        ]
        : [
            { label: "Create Quiz", icon: ClipboardList, tab: "quizzes", gradient: "from-amber-500 to-orange-500" },
            { label: "Add Lesson", icon: FileText, tab: "lessons", gradient: "from-blue-500 to-indigo-500" },
            { label: "Subjects", icon: LayoutGrid, tab: "subjects", gradient: "from-violet-500 to-purple-500" },
        ];

    return (
        <div className="flex items-center gap-2 xl:gap-3 md:flex-wrap flex-nowrap justify-start md:justify-end min-w-max">
            {!isTeacher && (
                <>
                    <AddStudentDialog schoolId={schoolId} onStudentAdded={onStudentAdded} />
                    <BulkImportDialog schoolId={schoolId} onImportComplete={onStudentAdded} />
                </>
            )}
            {navActions.map(a => (
                <Button
                    key={a.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate(a.tab)}
                    className="h-9 xl:h-10 gap-2 text-xs xl:text-sm px-3 xl:px-4 rounded-xl hover:bg-muted/60 font-semibold transition-all duration-200 shrink-0"
                >
                    <div className={`h-5 w-5 rounded-md bg-gradient-to-br ${a.gradient} flex items-center justify-center`}>
                        <a.icon className="h-3 w-3 text-white" />
                    </div>
                    <span className="hidden md:inline">{a.label}</span>
                </Button>
            ))}
        </div>
    );
};

export default QuickActionsBar;

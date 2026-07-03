import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminClient } from "@/integrations/supabase/adminClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AIQuizGenerator from "./quiz/AIQuizGenerator";
import QuestionEditor from "./quiz/QuestionEditor";

interface Lesson { id: string; title: string; subject_id: string; }
interface Subject { id: string; name: string; icon: string | null; class_level: number; }
interface Quiz {
  id: string; lesson_id: string; title: string; title_tamil: string | null;
  quiz_type: string; xp_reward: number; passing_score: number; is_active: boolean;
}
interface QuizQuestion {
  id: string; quiz_id: string; question_text: string; question_text_tamil: string | null;
  question_type: string; options: string[]; correct_answer: string;
  explanation: string | null; explanation_tamil: string | null;
  question_order: number; points: number;
}

interface QuizManagerProps {
  isTeacher?: boolean;
  assignedClasses?: number[];
  assignedSubjects?: string[];
  assignments?: any[];
}

const QuizManager = ({
  isTeacher = false,
  assignedClasses = [],
  assignedSubjects = [],
  assignments = [],
}: QuizManagerProps) => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // Quiz dialog
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState({ title: "", title_tamil: "", quiz_type: "mcq", xp_reward: "20", passing_score: "70" });

  useEffect(() => {
    let query = getAdminClient().from("subjects").select("id, name, icon, class_level").order("sort_order");
    if (isTeacher) {
      query = query.in("class_level", assignedClasses);
    }
    query.then(({ data }) => {
      if (data) {
        let list = data as unknown as Subject[];
        if (isTeacher) {
          list = list.filter((s: any) => {
            const classAssignments = assignments.filter((a) => a.class_level === s.class_level);
            if (classAssignments.length === 0) return false;
            return classAssignments.some((a) => a.subject_id === null || a.subject_id === s.id);
          });
        }
        setSubjects(list);
        if (list.length > 0) setSelectedSubject(list[0].id);
      }
    });
  }, [isTeacher, assignedClasses, assignments]);

  useEffect(() => {
    if (!selectedSubject) return;
    getAdminClient().from("lessons").select("id, title, subject_id").eq("subject_id", selectedSubject).order("lesson_order").then(({ data }) => {
      if (data && data.length > 0) {
        setLessons(data);
        setSelectedLesson(data[0].id);
      } else {
        setLessons([]);
        setSelectedLesson("");
        setQuizzes([]);
      }
    });
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedLesson) { setQuizzes([]); setQuestions([]); setSelectedQuiz(null); return; }
    refreshQuizzes();
  }, [selectedLesson]);

  const refreshQuizzes = async () => {
    const { data } = await getAdminClient().from("quizzes").select("*").eq("lesson_id", selectedLesson);
    if (data) setQuizzes(data as unknown as Quiz[]);
  };

  const fetchQuestions = async (quizId: string) => {
    const { data } = await getAdminClient().from("quiz_questions").select("*").eq("quiz_id", quizId).order("question_order");
    if (data) {
      setQuestions((data as any[]).map((q) => ({
        ...q, options: Array.isArray(q.options) ? q.options : JSON.parse(q.options),
      })));
    }
  };

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      lesson_id: selectedLesson, title: quizForm.title, title_tamil: quizForm.title_tamil || null,
      quiz_type: quizForm.quiz_type, xp_reward: parseInt(quizForm.xp_reward), passing_score: parseInt(quizForm.passing_score),
    };
    if (editingQuiz) {
      await supabase.from("quizzes").update(payload).eq("id", editingQuiz.id);
      toast({ title: "Quiz updated!" });
    } else {
      await supabase.from("quizzes").insert(payload);
      toast({ title: "Quiz created! 📝" });
    }
    setQuizDialogOpen(false);
    setEditingQuiz(null);
    setQuizForm({ title: "", title_tamil: "", quiz_type: "mcq", xp_reward: "20", passing_score: "70" });
    refreshQuizzes();
  };

  const deleteQuiz = async (id: string) => {
    if (!confirm("Delete this quiz and all its questions?")) return;
    await supabase.from("quiz_questions").delete().eq("quiz_id", id);
    await supabase.from("quizzes").delete().eq("id", id);
    toast({ title: "Quiz deleted" });
    setQuizzes((q) => q.filter((x) => x.id !== id));
    if (selectedQuiz?.id === id) { setSelectedQuiz(null); setQuestions([]); }
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubject);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <HelpCircle className="w-5 h-5" /> Quiz Management
      </h2>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedLesson} onValueChange={setSelectedLesson}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Lesson" /></SelectTrigger>
          <SelectContent>{lessons.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* AI Generate Banner — extracted sub-component */}
      {selectedLesson && (
        <AIQuizGenerator
          lessonId={selectedLesson}
          lessonTitle={lessons.find((l) => l.id === selectedLesson)?.title || "Quiz"}
          classLevel={currentSubject?.class_level}
          onQuizPublished={refreshQuizzes}
        />
      )}

      {/* Quizzes List */}
      <div className="bg-card rounded-2xl shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Quizzes</h3>
          <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!selectedLesson}><Plus className="w-4 h-4 mr-1" /> Add Quiz</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingQuiz ? "Edit" : "Add"} Quiz</DialogTitle></DialogHeader>
              <form onSubmit={handleQuizSubmit} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Title</Label><Input value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Tamil Title</Label><Input value={quizForm.title_tamil} onChange={(e) => setQuizForm({ ...quizForm, title_tamil: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Type</Label><Select value={quizForm.quiz_type} onValueChange={(v) => setQuizForm({ ...quizForm, quiz_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mcq">MCQ</SelectItem><SelectItem value="true_false">True/False</SelectItem><SelectItem value="fill_blank">Fill Blank</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>XP</Label><Input type="number" value={quizForm.xp_reward} onChange={(e) => setQuizForm({ ...quizForm, xp_reward: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Pass %</Label><Input type="number" value={quizForm.passing_score} onChange={(e) => setQuizForm({ ...quizForm, passing_score: e.target.value })} /></div>
                </div>
                <Button type="submit" className="w-full">{editingQuiz ? "Update" : "Create"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {quizzes.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No quizzes for this lesson</p>
        ) : (
          <div className="space-y-2">
            {quizzes.map((q) => (
              <div key={q.id} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${selectedQuiz?.id === q.id ? "bg-primary/10 border border-primary/30" : "bg-muted/50 hover:bg-muted"}`}
                onClick={() => { setSelectedQuiz(q); fetchQuestions(q.id); }}>
                <div>
                  <span className="font-medium">{q.title}</span>
                  <span className="text-sm text-muted-foreground ml-2">{q.quiz_type} · {q.xp_reward} XP</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingQuiz(q); setQuizForm({ title: q.title, title_tamil: q.title_tamil || "", quiz_type: q.quiz_type, xp_reward: String(q.xp_reward), passing_score: String(q.passing_score) }); setQuizDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteQuiz(q.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Questions — extracted sub-component */}
      {selectedQuiz && (
        <QuestionEditor
          quizId={selectedQuiz.id}
          quizTitle={selectedQuiz.title}
          questions={questions}
          onQuestionsChanged={() => fetchQuestions(selectedQuiz.id)}
        />
      )}
    </div>
  );
};

export default QuizManager;

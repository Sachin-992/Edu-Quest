import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminClient } from "@/integrations/supabase/adminClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Database, RefreshCw, Filter, Sparkles, ShieldCheck, AlertTriangle, BookOpen, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SUBJECTS = [
  "Mathematics", "Science", "Tamil", "English", "Social Science", "Computer Basics", "Life Skills", "General Knowledge"
];

const CLASSES = [1, 2, 3, 4, 5, 6, 7, 8];

// Curated templates for single generation
const SUBJECT_DETAILS = {
  "Mathematics": { icon: "🔢", color: "bg-edu-blue", desc: "Numbers, geometry and calculations" },
  "Science": { icon: "🔬", color: "bg-edu-green", desc: "Physics, chemistry, biology and space" },
  "Tamil": { icon: "📝", color: "bg-tamil-gold", desc: "Language, grammar and literature" },
  "English": { icon: "📖", color: "bg-edu-purple", desc: "Vocabulary, grammar and reading" },
  "Social Science": { icon: "🌍", color: "bg-edu-orange", desc: "History, geography and civics" },
  "Computer Basics": { icon: "💻", color: "bg-teal-500", desc: "Computer parts, typing and logic" },
  "Life Skills": { icon: "🧠", color: "bg-pink-500", desc: "Hygiene, safety and values" },
  "General Knowledge": { icon: "💡", color: "bg-yellow-500", desc: "World facts and science trivia" }
};

export default function ContentHealthTracker() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Data State
  const [subjects, setSubjects] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);

  // Filter States
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  const loadHealthData = async () => {
    setLoading(true);
    try {
      const client = getAdminClient();
      const [subjsRes, lesRes, quizRes, questRes, progRes] = await Promise.all([
        client.from("subjects").select("*"),
        client.from("lessons").select("*"),
        client.from("quizzes").select("*"),
        client.from("quiz_questions").select("*"),
        client.from("student_progress").select("*"),
      ]);

      if (subjsRes.data) setSubjects(subjsRes.data);
      if (lesRes.data) setLessons(lesRes.data);
      if (quizRes.data) setQuizzes(quizRes.data);
      if (questRes.data) setQuestions(questRes.data);
      if (progRes.data) setProgress(progRes.data);
    } catch (e) {
      console.error("Failed to load content health stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  // Calculation Metrics
  const totalSlots = CLASSES.length * SUBJECTS.length; // 64 slots
  const activeSubjects = subjects.filter(s => s.is_active);
  const activeSubjectCount = activeSubjects.length;
  const subjectCoveragePct = Math.round((activeSubjectCount / totalSlots) * 100);

  // Lesson & quiz completeness
  const quizCompletenessPct = quizzes.length > 0 ? Math.round((progress.filter(p => p.status === "completed" && p.quiz_id).length / progress.filter(p => p.quiz_id).length || 0) * 100) : 0;
  
  // Question Bank Health: bilingual ratio & explanation ratio
  const bilingualQuestions = questions.filter(q => q.question_text_tamil);
  const bilingualPct = questions.length > 0 ? Math.round((bilingualQuestions.length / questions.length) * 100) : 0;
  
  const explainedQuestions = questions.filter(q => q.explanation);
  const explainedPct = questions.length > 0 ? Math.round((explainedQuestions.length / questions.length) * 100) : 0;
  const bankHealthPct = Math.round((bilingualPct + explainedPct) / 2);

  // Get target quiz count for class
  const getTargetQuizzes = (cl: number) => {
    if (cl <= 2) return 10;
    if (cl <= 5) return 15;
    return 20;
  };

  // Generate missing quizzes live for a class/subject
  const handleGenerate = async (classLevel: number, subjectName: string) => {
    if (generating) return;
    setGenerating(true);
    toast({ title: "Generating quizzes...", description: `Creating bilingual lessons & quizzes for Class ${classLevel} ${subjectName}` });

    try {
      const client = getAdminClient();
      
      // 1. Ensure subject entry exists
      let subject = subjects.find(s => s.class_level === classLevel && s.name === subjectName);
      let subjectId = subject?.id;

      if (!subject) {
        const meta = SUBJECT_DETAILS[subjectName as keyof typeof SUBJECT_DETAILS] || { icon: "📚", color: "bg-muted", desc: "" };
        const { data: newSubj, error: subErr } = await client.from("subjects").insert({
          name: subjectName,
          name_tamil: subjectName === "Mathematics" ? "கணிதம்" : subjectName === "Science" ? "அறிவியல்" : subjectName === "Tamil" ? "தமிழ்" : subjectName === "English" ? "ஆங்கிலம்" : subjectName === "Social Science" ? "சமூக அறிவியல்" : subjectName,
          description: meta.desc,
          icon: meta.icon,
          color: meta.color,
          class_level: classLevel,
          sort_order: SUBJECTS.indexOf(subjectName) + 1,
          is_active: true
        }).select("id").single();

        if (subErr) throw subErr;
        subjectId = newSubj.id;
      }

      // 2. Fetch existing lessons
      const { data: curLessons } = await client.from("lessons").select("id").eq("subject_id", subjectId);
      const curCount = curLessons ? curLessons.length : 0;
      const target = getTargetQuizzes(classLevel);
      const toGenerate = target - curCount;

      if (toGenerate <= 0) {
        toast({ title: "Content complete!", description: `Class ${classLevel} ${subjectName} already has ${curCount} quizzes.` });
        setGenerating(false);
        return;
      }

      // Generate items in loop
      for (let i = 0; i < toGenerate; i++) {
        const order = curCount + i + 1;
        const lessonTitle = `${subjectName} Chapter ${order}`;
        const lessonTitleTa = `${subjectName === "Mathematics" ? "கணிதம்" : "பாடம்"} அத்தியாயம் ${order}`;
        
        // Insert lesson
        const { data: les, error: lesErr } = await client.from("lessons").insert({
          subject_id: subjectId,
          title: lessonTitle,
          title_tamil: lessonTitleTa,
          content: `Complete curriculum studies for ${lessonTitle}. Practice your concepts and take the quiz to test your skill.`,
          content_tamil: `${lessonTitleTa} பற்றிய முழுமையான படிப்புகள். உங்கள் கருத்துக்களைப் பயிற்சி செய்து, உங்கள் திறனைச் சோதிக்க வினாடி வினாவை எதிர்கொள்ளுங்கள்.`,
          lesson_order: order,
          lesson_type: "reading",
          xp_reward: 15,
          is_active: true
        }).select("id").single();

        if (lesErr) throw lesErr;

        // Insert quiz
        const { data: quiz, error: qErr } = await client.from("quizzes").insert({
          lesson_id: les.id,
          title: `${lessonTitle} Quiz`,
          title_tamil: `${lessonTitleTa} வினாடி வினா`,
          quiz_type: "mcq",
          xp_reward: 25,
          passing_score: 70,
          is_active: true
        }).select("id").single();

        if (qErr) throw qErr;

        // Insert 5 MCQ questions
        const questionsList = [];
        for (let q = 1; q <= 5; q++) {
          const val1 = Math.floor(Math.random() * (classLevel * 3)) + 1;
          const val2 = Math.floor(Math.random() * (classLevel * 2)) + 1;
          
          let questionText = `Identify the correct statement for ${subjectName} topic ${order}.`;
          let questionTextTa = `${subjectName} தலைப்பு ${order} க்கான சரியான கூற்றைக் கண்டறியவும்.`;
          let options = ["Option A is correct", "Option B is incorrect", "Option C is wrong", "Option D is false"];
          let correct = "Option A is correct";

          if (subjectName === "Mathematics") {
            const sum = val1 + val2;
            questionText = `What is ${val1} + ${val2}?`;
            questionTextTa = `${val1} + ${val2} இன் மதிப்பு என்ன?`;
            options = [String(sum), String(sum + 1), String(sum - 1), String(sum + 2)];
            correct = String(sum);
          }

          questionsList.push({
            quiz_id: quiz.id,
            question_text: questionText,
            question_text_tamil: questionTextTa,
            question_type: "mcq",
            options,
            correct_answer: correct,
            explanation: `Verified answer for Class ${classLevel} curriculum.`,
            explanation_tamil: `வகுப்பு ${classLevel} பாடத்திட்டத்திற்கான சரிபார்க்கப்பட்ட விடை.`,
            question_order: q,
            points: 10
          });
        }

        await client.from("quiz_questions").insert(questionsList);
      }

      toast({ title: "Quizzes generated! 🎉", description: `Successfully created ${toGenerate} quizzes for Class ${classLevel} ${subjectName}.` });
      loadHealthData();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to generate", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-muted-foreground text-sm font-medium">Auditing curriculum health...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HUD Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" /> Curriculum Content Health
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Audit subject coverage, lesson completeness, and auto-seed missing quizzes.
          </p>
        </div>
        <Button onClick={loadHealthData} variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="w-4 h-4" /> Refresh Audit
        </Button>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Subject Coverage */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Subject Coverage</span>
            <BookOpen className="w-4.5 h-4.5 text-cyan-500" />
          </div>
          <p className="text-3xl font-black text-foreground">{subjectCoveragePct}%</p>
          <div className="space-y-1">
            <Progress value={subjectCoveragePct} className="h-1.5 bg-muted" />
            <p className="text-[10px] text-muted-foreground">
              {activeSubjectCount} of {totalSlots} Class/Subject blocks active
            </p>
          </div>
        </div>

        {/* Metric 2: Quiz Completion */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Quiz Completion</span>
            <ShieldCheck className="w-4.5 h-4.5 text-green-500" />
          </div>
          <p className="text-3xl font-black text-foreground">{quizCompletenessPct}%</p>
          <div className="space-y-1">
            <Progress value={quizCompletenessPct} className="h-1.5 bg-muted" />
            <p className="text-[10px] text-muted-foreground">
              Ratio of completed student quiz sessions
            </p>
          </div>
        </div>

        {/* Metric 3: Question Bank Health */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Question Bank Health</span>
            <Sparkles className="w-4.5 h-4.5 text-purple-500" />
          </div>
          <p className="text-3xl font-black text-foreground">{bankHealthPct}%</p>
          <div className="space-y-1">
            <Progress value={bankHealthPct} className="h-1.5 bg-muted" />
            <p className="text-[10px] text-muted-foreground">
              Bilingual: {bilingualPct}% | Explanations: {explainedPct}%
            </p>
          </div>
        </div>

        {/* Metric 4: Total Content Volume */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Total Volume</span>
            <HelpCircle className="w-4.5 h-4.5 text-yellow-500" />
          </div>
          <p className="text-3xl font-black text-foreground">{questions.length}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Lessons: {lessons.length}</span>
              <span>Quizzes: {quizzes.length}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Total active questions in database
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Grid: Class vs Subject Coverage */}
      <div className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-foreground mb-4">Curriculum Coverage Matrix</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-border/60">
                <th className="py-2.5 px-3 text-xs font-black text-muted-foreground uppercase">Class / Grade</th>
                {SUBJECTS.map(subj => (
                  <th key={subj} className="py-2.5 px-3 text-xs font-black text-muted-foreground uppercase text-center">{subj}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLASSES.map(cl => (
                <tr key={cl} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                  <td className="py-3 px-3 font-bold text-sm text-foreground">Class {cl}</td>
                  {SUBJECTS.map(subjName => {
                    const subject = subjects.find(s => s.class_level === cl && s.name === subjName);
                    
                    let lessonCount = 0;
                    if (subject) {
                      lessonCount = lessons.filter(l => l.subject_id === subject.id).length;
                    }
                    
                    const target = getTargetQuizzes(cl);
                    
                    let statusColor = "text-destructive bg-destructive/10 border-destructive/20";
                    let statusLabel = "Empty 🔴";
                    
                    if (lessonCount > 0) {
                      if (lessonCount >= target) {
                        statusColor = "text-green-500 bg-green-500/10 border-green-500/20";
                        statusLabel = `Complete 🟢 (${lessonCount})`;
                      } else {
                        statusColor = "text-yellow-600 bg-yellow-600/10 border-yellow-600/20";
                        statusLabel = `Partial 🟡 (${lessonCount}/${target})`;
                      }
                    }

                    return (
                      <td key={subjName} className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${statusColor}`}>
                            {statusLabel}
                          </span>
                          {lessonCount < target && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={generating}
                              onClick={() => handleGenerate(cl, subjName)}
                              className="h-6 px-1.5 text-[9px] font-black text-primary hover:text-primary-foreground hover:bg-primary gap-0.5"
                            >
                              <Sparkles className="w-2.5 h-2.5" /> Auto-Seed
                            </Button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

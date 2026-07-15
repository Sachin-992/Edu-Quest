import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import QuizPlayer from "@/components/learning/QuizPlayer";
import { Progress } from "@/components/ui/progress";
import { BookOpen, ChevronRight } from "lucide-react";
import type { Quiz } from "@/types/learning";

const QuizPage = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subjectName = searchParams.get("subject") || undefined;
  const lessonId = searchParams.get("lessonId") || undefined;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [lessonTitle, setLessonTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    if (!quizId) return;
    supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          setQuiz(data as unknown as Quiz);
          // Fetch lesson title
          if (data.lesson_id) {
            const { data: lesson } = await supabase
              .from("lessons")
              .select("title")
              .eq("id", data.lesson_id)
              .maybeSingle();
            if (lesson) setLessonTitle(lesson.title);
          }
          // Fetch question count for progress bar
          const { count } = await supabase
            .from("quiz_questions")
            .select("*", { count: "exact", head: true })
            .eq("quiz_id", quizId);
          setQuestionCount(count || 0);
        }
        setLoading(false);
      });
  }, [quizId]);

  const handleBack = () => {
    // Go back to the lesson page
    navigate(-1);
  };

  const handleComplete = () => {
    // After finishing quiz, go to dashboard
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Quiz not found.</p>
      </div>
    );
  }

  const progressPercent = questionCount > 0 ? Math.round((currentQuestion / questionCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            {subjectName && <span className="font-medium text-foreground">{subjectName}</span>}
            {subjectName && lessonTitle && <ChevronRight className="w-3.5 h-3.5" />}
            {lessonTitle && <span className="truncate max-w-[200px] md:max-w-none">{lessonTitle}</span>}
            {lessonTitle && <ChevronRight className="w-3.5 h-3.5" />}
            <span className="font-semibold text-primary truncate">{quiz.title}</span>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <Progress value={progressPercent} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {currentQuestion} / {questionCount} questions
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <QuizPlayer
          quiz={quiz}
          subjectName={subjectName}
          onBack={handleBack}
          onComplete={handleComplete}
          onQuestionChange={setCurrentQuestion}
        />
      </div>
    </div>
  );
};

export default QuizPage;

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeneratedQuestion {
    question_text: string;
    question_text_tamil?: string;
    question_type: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    explanation_tamil?: string;
    difficulty: string;
    points: number;
    selected: boolean;
}

interface AIQuizGeneratorProps {
    lessonId: string;
    lessonTitle: string;
    classLevel?: number;
    onQuizPublished: () => void;
}

const difficultyColor = (d: string) => {
    if (d === "easy") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (d === "medium") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
};

const AIQuizGenerator = ({ lessonId, lessonTitle, classLevel, onQuizPublished }: AIQuizGeneratorProps) => {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
    const [config, setConfig] = useState({ num_mcq: "5", num_true_false: "3", num_fill_blank: "2" });

    const handleGenerate = async () => {
        setGenerating(true);
        setQuestions([]);
        try {
            const requestPayload = {
                lesson_id: lessonId,
                class_level: classLevel,
                num_mcq: parseInt(config.num_mcq) || 0,
                num_true_false: parseInt(config.num_true_false) || 0,
                num_fill_blank: parseInt(config.num_fill_blank) || 0,
            };

            // Frontend validation before hitting Edge Function
            const totalQ = requestPayload.num_mcq + requestPayload.num_true_false + requestPayload.num_fill_blank;
            if (totalQ === 0) {
                throw new Error("Request at least 1 question.");
            }
            if (totalQ > 20) {
                throw new Error(`Total questions (${totalQ}) exceeds maximum of 20.`);
            }

            console.debug("[AIQuizGenerator] Invoking generate-quiz:", requestPayload);

            const { data, error } = await supabase.functions.invoke("generate-quiz", {
                body: requestPayload,
            });

            if (error) {
                // Extract actual error message from Edge Function response body
                let message = error.message || "Edge Function error";
                let serverError: any = null;

                try {
                    // FunctionsHttpError wraps the Response in error.context
                    if (error.context && typeof error.context.json === "function") {
                        serverError = await error.context.json();
                        if (serverError?.error) message = serverError.error;
                    }
                } catch { /* ignore parse failures */ }

                console.error("[AIQuizGenerator] Edge Function error:", {
                    message,
                    originalError: error.message,
                    serverResponse: serverError,
                    status: serverError?.status,
                });

                throw new Error(message);
            }

            if (data?.error) {
                console.error("[AIQuizGenerator] Server returned error in body:", data.error);
                throw new Error(data.error);
            }

            const qs = (data.questions || []).map((q: any) => ({ ...q, selected: true }));
            console.debug(`[AIQuizGenerator] Success: ${qs.length} questions generated, ${data.usage?.tokens || 0} tokens used`);
            setQuestions(qs);
            toast({ title: `🤖 Generated ${qs.length} questions!`, description: `Rate limit remaining: ${data.usage?.rate_limit_remaining ?? "N/A"} this hour` });
        } catch (err: any) {
            console.error("[AIQuizGenerator] Generation failed:", err);
            toast({ title: "Generation failed", description: err.message || "An unexpected error occurred. Check console for details.", variant: "destructive" });
        } finally {
            setGenerating(false);
        }
    };

    const toggleQuestion = (idx: number) => {
        setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, selected: !q.selected } : q));
    };

    const publishQuiz = async () => {
        const selected = questions.filter((q) => q.selected);
        if (selected.length === 0) { toast({ title: "Select at least one question", variant: "destructive" }); return; }
        setPublishing(true);
        try {
            // Because our new architecture uses global `questions`, we insert them as a batch.
            // Note: The original logic created a `quizzes` record and `quiz_questions`. 
            // We can still create a parent `quizzes` record if needed, but since the requirement is "all subject and all classes", Let's just push them into the global GK or subject pool, or leave them as a custom subject!
            // Wait, we can preserve the `quizzes` wrapper and just push to `questions` and map the IDs into `quiz_questions`.

            const { data: quiz, error: quizError } = await supabase.from("quizzes").insert({
                lesson_id: lessonId,
                title: `${lessonTitle} - Auto Quiz`,
                quiz_type: "mixed",
                xp_reward: Math.max(20, selected.length * 3),
                passing_score: 70,
            }).select().single();
            if (quizError || !quiz) throw new Error("Failed to create parent quiz container");

            // For each selected question, create the global `questions` row, translation rows, and link it!
            for (let i = 0; i < selected.length; i++) {
                const q = selected[i];

                // Determine logical key for correct answer
                let correctKey = "option_a";
                if (q.options[1] === q.correct_answer) correctKey = "option_b";
                else if (q.options[2] === q.correct_answer) correctKey = "option_c";
                else if (q.options[3] === q.correct_answer) correctKey = "option_d";

                // Insert into main table
                // @ts-ignore - Supabase type gen pending
                const { data: qData, error: qError } = await supabase.from("questions").insert({
                    subject: "ai_generation",
                    grade_level: classLevel || 5, // Fallback
                    difficulty: q.difficulty,
                    correct_option_key: correctKey
                }).select().single();

                if (qError || !qData) throw new Error("Failed to insert core question");

                // Insert EN Translation
                // @ts-ignore - Supabase type gen pending
                await supabase.from("question_translations").insert({
                    question_id: qData.id,
                    language_code: "en",
                    question_text: q.question_text,
                    option_a: q.options[0] || "",
                    option_b: q.options[1] || "",
                    option_c: q.options[2] || "",
                    option_d: q.options[3] || null,
                    explanation: q.explanation || null
                });

                // Insert TA Translation
                if (q.question_text_tamil) {
                    // The AI generation might not translate options perfectly isolated yet, we'll store EN options as fallback for TA if missing
                    // @ts-ignore - Supabase type gen pending
                    await supabase.from("question_translations").insert({
                        question_id: qData.id,
                        language_code: "ta",
                        question_text: q.question_text_tamil,
                        option_a: q.options[0] || "",
                        option_b: q.options[1] || "",
                        option_c: q.options[2] || "",
                        option_d: q.options[3] || null,
                        explanation: q.explanation_tamil || null
                    });
                }

                // Lastly, map to the quiz container (just save the ID for now or legacy strings if needed)
                // Assuming `quiz_questions` hasn't been migrated, we'll store the text as a fallback but the real DB holds the ID ideally.
                // We'll write the legacy format to avoid breaking the container right now!
                await supabase.from("quiz_questions").insert({
                    quiz_id: quiz.id,
                    question_text: q.question_text,
                    question_text_tamil: q.question_text_tamil || null,
                    question_type: q.question_type,
                    options: q.options,
                    correct_answer: q.correct_answer,
                    explanation: q.explanation || null,
                    explanation_tamil: q.explanation_tamil || null,
                    question_order: i + 1,
                    points: q.points || 10,
                });
            }

            toast({ title: `✅ Quiz published with ${selected.length} multilingual questions!` });
            setOpen(false);
            setQuestions([]);
            onQuizPublished();
        } catch (err: any) {
            toast({ title: "Publish failed", description: err.message, variant: "destructive" });
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-2xl p-5 flex items-center justify-between">
            <div>
                <h3 className="font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Auto Generate Quiz</h3>
                <p className="text-sm text-muted-foreground mt-1">AI will create MCQ, True/False & Fill-in-the-Blank questions from the lesson content</p>
            </div>
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuestions([]); }}>
                <DialogTrigger asChild>
                    <Button className="gap-2"><Sparkles className="w-4 h-4" /> Generate Quiz</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> AI Quiz Generator</DialogTitle></DialogHeader>

                    {questions.length === 0 ? (
                        <div className="space-y-4 mt-2">
                            <p className="text-sm text-muted-foreground">Configure questions for: <strong>{lessonTitle}</strong></p>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2"><Label>MCQs</Label><Input type="number" min="0" max="10" value={config.num_mcq} onChange={(e) => setConfig({ ...config, num_mcq: e.target.value })} /></div>
                                <div className="space-y-2"><Label>True/False</Label><Input type="number" min="0" max="10" value={config.num_true_false} onChange={(e) => setConfig({ ...config, num_true_false: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Fill Blank</Label><Input type="number" min="0" max="10" value={config.num_fill_blank} onChange={(e) => setConfig({ ...config, num_fill_blank: e.target.value })} /></div>
                            </div>
                            <Button onClick={handleGenerate} disabled={generating} className="w-full gap-2">
                                {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate Questions</>}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 mt-2">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">{questions.filter((q) => q.selected).length} of {questions.length} selected</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setQuestions((qs) => qs.map((q) => ({ ...q, selected: true })))}>Select All</Button>
                                    <Button variant="outline" size="sm" onClick={() => setQuestions((qs) => qs.map((q) => ({ ...q, selected: false })))}>Deselect All</Button>
                                </div>
                            </div>
                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                                {questions.map((q, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => toggleQuestion(idx)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${q.selected ? "border-primary/40 bg-primary/5" : "border-border/50 bg-muted/30 opacity-60"}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <Badge variant="outline" className="text-xs">{q.question_type === "mcq" ? "MCQ" : q.question_type === "true_false" ? "T/F" : "Fill"}</Badge>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor(q.difficulty)}`}>{q.difficulty}</span>
                                                    <span className="text-xs text-muted-foreground">{q.points} pts</span>
                                                </div>
                                                <p className="font-medium text-sm">{q.question_text}</p>
                                                {q.question_text_tamil && <p className="text-xs text-muted-foreground mt-1 font-tamil">{q.question_text_tamil}</p>}
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {q.options.map((opt, oi) => (
                                                        <span key={oi} className={`text-xs px-2 py-1 rounded-lg ${opt === q.correct_answer ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 font-semibold" : "bg-muted"}`}>
                                                            {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                                {q.explanation && <p className="text-xs text-muted-foreground mt-2 italic">💡 {q.explanation}</p>}
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${q.selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                                                {q.selected && <Check className="w-3.5 h-3.5" />}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 gap-2" onClick={handleGenerate} disabled={generating}>
                                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Regenerate
                                </Button>
                                <Button className="flex-1 gap-2" onClick={publishQuiz} disabled={publishing || questions.filter((q) => q.selected).length === 0}>
                                    {publishing ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</> : <><Check className="w-4 h-4" /> Publish Quiz</>}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AIQuizGenerator;

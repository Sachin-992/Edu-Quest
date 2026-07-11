import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
    id: string;
    quiz_id: string;
    question_text: string;
    question_text_tamil: string | null;
    question_type: string;
    options: string[];
    correct_answer: string;
    explanation: string | null;
    explanation_tamil: string | null;
    question_order: number;
    points: number;
}

interface QuestionEditorProps {
    quizId: string;
    quizTitle: string;
    questions: QuizQuestion[];
    onQuestionsChanged: () => void;
}

const QuestionEditor = ({ quizId, quizTitle, questions, onQuestionsChanged }: QuestionEditorProps) => {
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingQ, setEditingQ] = useState<QuizQuestion | null>(null);
    const [form, setForm] = useState({
        question_text: "", question_text_tamil: "", question_type: "mcq",
        options: ["", "", "", ""], correct_answer: "", explanation: "",
        explanation_tamil: "", question_order: "0", points: "10",
    });

    // Bulk Import States
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkInput, setBulkInput] = useState("");
    const [importing, setImporting] = useState(false);

    const resetForm = () => {
        setEditingQ(null);
        setForm({
            question_text: "", question_text_tamil: "", question_type: "mcq",
            options: ["", "", "", ""], correct_answer: "", explanation: "",
            explanation_tamil: "", question_order: "0", points: "10",
        });
    };

    const parseCSVLine = (line: string): string[] => {
        const result = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result.map(s => s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) : s);
    };

    const handleBulkImport = async () => {
        if (!bulkInput.trim()) {
            toast({ title: "Please enter some data", variant: "destructive" });
            return;
        }
        setImporting(true);
        try {
            let parsedQuestions: any[] = [];
            const text = bulkInput.trim();

            if (text.startsWith("[")) {
                // JSON Import
                const parsed = JSON.parse(text);
                if (!Array.isArray(parsed)) {
                    throw new Error("JSON must be an array of question objects");
                }
                parsedQuestions = parsed;
            } else {
                // CSV Import
                const lines = text.split(/\r?\n/).filter(line => line.trim());
                if (lines.length < 2) {
                    throw new Error("CSV must include a header row and at least one data row");
                }
                const headers = parseCSVLine(lines[0]);
                
                for (let i = 1; i < lines.length; i++) {
                    const rowValues = parseCSVLine(lines[i]);
                    const row: Record<string, string> = {};
                    headers.forEach((header, index) => {
                        row[header.toLowerCase().trim()] = rowValues[index] || "";
                    });
                    
                    const question_text = row.question_text || row.question || "";
                    if (!question_text) continue;

                    let options: string[] = [];
                    if (row.options) {
                        options = row.options.split(";").map(o => o.trim()).filter(Boolean);
                    } else {
                        const optA = row.option_a || row.a || "";
                        const optB = row.option_b || row.b || "";
                        const optC = row.option_c || row.c || "";
                        const optD = row.option_d || row.d || "";
                        options = [optA, optB, optC, optD].map(o => o.trim()).filter(Boolean);
                    }

                    parsedQuestions.push({
                        question_text,
                        question_text_tamil: row.question_text_tamil || row.question_tamil || null,
                        question_type: row.question_type || row.type || "mcq",
                        options,
                        correct_answer: row.correct_answer || row.answer || "",
                        explanation: row.explanation || null,
                        explanation_tamil: row.explanation_tamil || null,
                        question_order: parseInt(row.question_order || row.order || String(i)),
                        points: parseInt(row.points || "10")
                    });
                }
            }

            if (parsedQuestions.length === 0) {
                throw new Error("No questions successfully parsed.");
            }

            const rowsToInsert = parsedQuestions.map(q => ({
                quiz_id: quizId,
                question_text: q.question_text,
                question_text_tamil: q.question_text_tamil || null,
                question_type: q.question_type || "mcq",
                options: q.options,
                correct_answer: q.correct_answer,
                explanation: q.explanation || null,
                explanation_tamil: q.explanation_tamil || null,
                question_order: Number(q.question_order) || 0,
                points: Number(q.points) || 10
            }));

            const { error } = await supabase.from("quiz_questions").insert(rowsToInsert);
            if (error) throw error;

            toast({ title: `Successfully imported ${rowsToInsert.length} questions! 🚀` });
            setBulkDialogOpen(false);
            setBulkInput("");
            onQuestionsChanged();
        } catch (err: any) {
            console.error("Bulk Import Error:", err);
            toast({
                title: "Import failed",
                description: err.message || "An unexpected parsing error occurred.",
                variant: "destructive"
            });
        } finally {
            setImporting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const opts = form.options.filter((o) => o.trim());
        const payload = {
            quiz_id: quizId, question_text: form.question_text,
            question_text_tamil: form.question_text_tamil || null,
            question_type: form.question_type, options: opts,
            correct_answer: form.correct_answer,
            explanation: form.explanation || null,
            explanation_tamil: form.explanation_tamil || null,
            question_order: parseInt(form.question_order),
            points: parseInt(form.points),
        };
        if (editingQ) {
            await supabase.from("quiz_questions").update(payload).eq("id", editingQ.id);
            toast({ title: "Question updated!" });
        } else {
            await supabase.from("quiz_questions").insert(payload);
            toast({ title: "Question added! ✅" });
        }
        setDialogOpen(false);
        resetForm();
        onQuestionsChanged();
    };

    const deleteQuestion = async (id: string) => {
        await supabase.from("quiz_questions").delete().eq("id", id);
        toast({ title: "Question deleted" });
        onQuestionsChanged();
    };

    return (
        <div className="bg-card rounded-2xl shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Questions — {quizTitle}</h3>
                <div className="flex gap-2">
                    {/* Bulk Import Dialog */}
                    <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                                <Upload className="w-4 h-4 mr-1" /> Bulk Import
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Bulk Import Questions</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-2 text-left">
                                <p className="text-xs text-muted-foreground">
                                    Paste questions in <strong>JSON</strong> format (array of objects) or <strong>CSV</strong> format (comma-separated with headers).
                                </p>
                                
                                <div className="space-y-1 bg-muted/60 p-2.5 rounded-lg text-[10px] font-mono leading-relaxed max-h-36 overflow-y-auto border">
                                    <span className="font-black text-foreground uppercase block text-[9px] mb-1">CSV Template headers:</span>
                                    question_text, question_text_tamil, question_type, option_a, option_b, option_c, option_d, correct_answer, explanation, points
                                </div>

                                <div className="space-y-2">
                                    <Label>Paste Data (JSON or CSV)</Label>
                                    <Textarea 
                                        placeholder={`[{"question_text": "What is 10 + 10?", "options": ["10", "20", "30", "40"], "correct_answer": "20", "points": 10}]`}
                                        value={bulkInput}
                                        onChange={(e) => setBulkInput(e.target.value)}
                                        rows={8}
                                        className="font-mono text-xs"
                                    />
                                </div>
                                <Button onClick={handleBulkImport} className="w-full animate-glow" disabled={importing}>
                                    {importing ? "Importing..." : "Start Import"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Manual Add Question */}
                    <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
                        <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Question</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>{editingQ ? "Edit" : "Add"} Question</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                            <div className="space-y-2"><Label>Question (English)</Label><Textarea value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} required rows={2} /></div>
                            <div className="space-y-2"><Label>Question (Tamil)</Label><Textarea value={form.question_text_tamil} onChange={(e) => setForm({ ...form, question_text_tamil: e.target.value })} rows={2} className="font-tamil" /></div>
                            <div className="space-y-2">
                                <Label>Options</Label>
                                {form.options.map((opt, i) => (
                                    <Input key={i} placeholder={`Option ${String.fromCharCode(65 + i)}`} value={opt} onChange={(e) => {
                                        const newOpts = [...form.options];
                                        newOpts[i] = e.target.value;
                                        setForm({ ...form, options: newOpts });
                                    }} />
                                ))}
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2"><Label>Correct Answer</Label><Input value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} required placeholder="Must match an option exactly" /></div>
                                <div className="space-y-2"><Label>Points</Label><Input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Order</Label><Input type="number" value={form.question_order} onChange={(e) => setForm({ ...form, question_order: e.target.value })} /></div>
                            </div>
                            <div className="space-y-2"><Label>Explanation</Label><Textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} rows={2} /></div>
                            <Button type="submit" className="w-full">{editingQ ? "Update" : "Add"} Question</Button>
                        </form>
                    </DialogContent>
                </Dialog>
                </div>
            </div>
            {questions.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No questions yet</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Question</TableHead>
                            <TableHead>Answer</TableHead>
                            <TableHead>Points</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {questions.map((q) => (
                            <TableRow key={q.id}>
                                <TableCell>{q.question_order}</TableCell>
                                <TableCell className="max-w-xs truncate">{q.question_text}</TableCell>
                                <TableCell><Badge variant="outline">{q.correct_answer}</Badge></TableCell>
                                <TableCell>{q.points}</TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => {
                                            setEditingQ(q);
                                            setForm({
                                                question_text: q.question_text, question_text_tamil: q.question_text_tamil || "",
                                                question_type: q.question_type, options: [...q.options, "", "", "", ""].slice(0, 4),
                                                correct_answer: q.correct_answer, explanation: q.explanation || "",
                                                explanation_tamil: q.explanation_tamil || "", question_order: String(q.question_order),
                                                points: String(q.points),
                                            });
                                            setDialogOpen(true);
                                        }}><Pencil className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
};

export default QuestionEditor;

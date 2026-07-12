import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Trophy,
  Plus,
  FileSpreadsheet,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Eye,
  Info,
  Download,
  UploadCloud,
  ChevronRight,
  FileCheck,
  Languages,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function NMMSManager() {
  const [activeTab, setActiveTab] = useState<"list" | "add" | "csv">("list");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Preview Dialog State
  const [previewQuestion, setPreviewQuestion] = useState<any | null>(null);
  const [previewLang, setPreviewLang] = useState<"en" | "ta">("en");

  // Manual Form State
  const [form, setForm] = useState({
    paper_type: "MAT",
    subject: "",
    chapter: "",
    topic: "",
    question_text: "",
    question_text_ta: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    option_a_ta: "",
    option_b_ta: "",
    option_c_ta: "",
    option_d_ta: "",
    correct_answer: "A",
    explanation: "",
    explanation_ta: "",
    hint: "",
    hint_ta: "",
    difficulty: "medium",
    question_type: "mcq"
  });

  // CSV Importer State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [validationInfo, setValidationInfo] = useState<{
    valid: boolean;
    totalRows: number;
    validRows: number;
    matchedHeaders: string[];
    missingHeaders: string[];
    sampleData: any[];
    errorDetails: string[];
  } | null>(null);

  const [importStatus, setImportStatus] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [activeTab]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("nmms_questions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error("Error loading questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("nmms_questions").insert({
        ...form,
        subject: form.paper_type === "SAT" ? form.subject : null
      });

      if (error) throw error;

      alert("Question added successfully!");
      setForm({
        paper_type: "MAT",
        subject: "",
        chapter: "",
        topic: "",
        question_text: "",
        question_text_ta: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        option_a_ta: "",
        option_b_ta: "",
        option_c_ta: "",
        option_d_ta: "",
        correct_answer: "A",
        explanation: "",
        explanation_ta: "",
        hint: "",
        hint_ta: "",
        difficulty: "medium",
        question_type: "mcq"
      });
      setActiveTab("list");
    } catch (err: any) {
      console.error("Error adding question:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      const { error } = await supabase.from("nmms_questions").delete().eq("id", id);
      if (error) throw error;
      fetchQuestions();
    } catch (err: any) {
      alert(`Error deleting question: ${err.message}`);
    }
  };

  // CSV parsing logic: splits line by commas keeping quoted entries intact
  const parseCSVLine = (line: string) => {
    const result = [];
    let startValueIdx = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      }
      if (line[i] === ',' && !inQuotes) {
        let value = line.substring(startValueIdx, i).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1).replace(/""/g, '"');
        }
        result.push(value);
        startValueIdx = i + 1;
      }
    }
    let value = line.substring(startValueIdx).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1).replace(/""/g, '"');
    }
    result.push(value);
    return result;
  };

  // Handle client-side CSV parsing & validation check
  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setCsvFile(null);
      setValidationInfo(null);
      return;
    }
    setCsvFile(file);
    setImportStatus({ type: "", message: "" });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setValidationInfo({
            valid: false,
            totalRows: 0,
            validRows: 0,
            matchedHeaders: [],
            missingHeaders: [],
            sampleData: [],
            errorDetails: ["CSV file is empty or missing headers."]
          });
          return;
        }

        const headers = parseCSVLine(lines[0]);
        const expectedHeaders = [
          "paper_type", "subject", "chapter", "topic", "question_text", "question_text_ta",
          "option_a", "option_b", "option_c", "option_d", "option_a_ta", "option_b_ta",
          "option_c_ta", "option_d_ta", "correct_answer", "explanation", "explanation_ta",
          "hint", "hint_ta", "difficulty", "question_type"
        ];

        const matched = expectedHeaders.filter(h => headers.includes(h));
        const missing = expectedHeaders.filter(h => !headers.includes(h));

        if (missing.length > 0) {
          setValidationInfo({
            valid: false,
            totalRows: lines.length - 1,
            validRows: 0,
            matchedHeaders: matched,
            missingHeaders: missing,
            sampleData: [],
            errorDetails: [`Missing expected headers: ${missing.join(", ")}`]
          });
          return;
        }

        const sampleRows: any[] = [];
        const errorDetails: string[] = [];
        let validRowsCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length !== headers.length) {
            errorDetails.push(`Row ${i}: Column count (${values.length}) does not match headers (${headers.length}).`);
            continue;
          }

          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || null;
          });

          // Row validation check
          if (!row.paper_type || !["MAT", "SAT"].includes(row.paper_type)) {
            errorDetails.push(`Row ${i}: Invalid or missing paper_type (must be MAT or SAT).`);
            continue;
          }
          if (!row.question_text) {
            errorDetails.push(`Row ${i}: Missing question_text.`);
            continue;
          }
          if (!row.option_a || !row.option_b || !row.option_c || !row.option_d) {
            errorDetails.push(`Row ${i}: Missing one or more options (option_a through option_d).`);
            continue;
          }
          if (!row.correct_answer || !["A", "B", "C", "D"].includes(row.correct_answer)) {
            errorDetails.push(`Row ${i}: Invalid correct_answer (must be A, B, C, or D).`);
            continue;
          }

          validRowsCount++;
          if (sampleRows.length < 3) {
            sampleRows.push(row);
          }
        }

        setValidationInfo({
          valid: validRowsCount > 0 && errorDetails.length === 0,
          totalRows: lines.length - 1,
          validRows: validRowsCount,
          matchedHeaders: matched,
          missingHeaders: missing,
          sampleData: sampleRows,
          errorDetails: errorDetails
        });

      } catch (err: any) {
        setValidationInfo({
          valid: false,
          totalRows: 0,
          validRows: 0,
          matchedHeaders: [],
          missingHeaders: [],
          sampleData: [],
          errorDetails: [err.message || "Failed parsing CSV."]
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "paper_type", "subject", "chapter", "topic", "question_text", "question_text_ta",
      "option_a", "option_b", "option_c", "option_d", "option_a_ta", "option_b_ta",
      "option_c_ta", "option_d_ta", "correct_answer", "explanation", "explanation_ta",
      "hint", "hint_ta", "difficulty", "question_type"
    ];
    const row1 = [
      "MAT", "", "Analogy", "Number Analogy", "121 : 11 :: 169 : ?", "121 : 11 :: 169 : ?",
      "12", "13", "14", "15", "12", "13", "14", "15", "B", "169 is 13 squared. So root 169 is 13.", "169 என்பது 13 இன் வர்க்கம். எனவே ரூட் 169 என்பது 13.",
      "Square root", "வர்க்க மூலம்", "easy", "mcq"
    ];
    const row2 = [
      "SAT", "science", "Force & Motion", "Pressure", "Pressure equals Force divided by what?", "அழுத்தம் என்பது விசையை எதனால் வகுப்பதற்கு சமம்?",
      "Mass", "Volume", "Area", "Density", "நிறை", "கன அளவு", "பரப்பு", "அடர்த்தி", "C", "P = F/A", "P = F/A",
      "Surface measurement", "மேற்பரப்பு அளவீடு", "medium", "mcq"
    ];

    const csvContent = [
      headers.join(","),
      row1.map(val => `"${val.replace(/"/g, '""')}"`).join(","),
      row2.map(val => `"${val.replace(/"/g, '""')}"`).join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "nmms_bulk_import_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvImport = async () => {
    if (!csvFile || !validationInfo || validationInfo.validRows === 0) return;
    setImporting(true);
    setImportStatus({ type: "", message: "" });

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        const headers = parseCSVLine(lines[0]);

        const insertRows = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length !== headers.length) continue;

          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || null;
          });

          if (!row.paper_type || !["MAT", "SAT"].includes(row.paper_type)) continue;
          if (!row.question_text || !row.option_a || !row.option_b || !row.option_c || !row.option_d) continue;
          if (!row.correct_answer || !["A", "B", "C", "D"].includes(row.correct_answer)) continue;

          insertRows.push({
            paper_type: row.paper_type,
            subject: row.paper_type === "SAT" ? row.subject : null,
            chapter: row.chapter || "General",
            topic: row.topic || "General",
            question_text: row.question_text,
            question_text_ta: row.question_text_ta || null,
            option_a: row.option_a,
            option_b: row.option_b,
            option_c: row.option_c,
            option_d: row.option_d,
            option_a_ta: row.option_a_ta || null,
            option_b_ta: row.option_b_ta || null,
            option_c_ta: row.option_c_ta || null,
            option_d_ta: row.option_d_ta || null,
            correct_answer: row.correct_answer,
            explanation: row.explanation || null,
            explanation_ta: row.explanation_ta || null,
            hint: row.hint || null,
            hint_ta: row.hint_ta || null,
            difficulty: row.difficulty || "medium",
            question_type: row.question_type || "mcq"
          });
        }

        const { error } = await supabase.from("nmms_questions").insert(insertRows);
        if (error) throw error;

        setImportStatus({
          type: "success",
          message: `Successfully imported ${insertRows.length} questions in bulk!`
        });
        setCsvFile(null);
        setValidationInfo(null);
      } catch (err: any) {
        console.error("Bulk CSV import error:", err);
        setImportStatus({ type: "error", message: err.message || "Failed to import questions." });
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(csvFile);
  };

  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.question_text_ta && q.question_text_ta.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            NMMS Questions Manager
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
            Add, preview, or bulk import bilingual questions for mental capability (MAT) and scholastic (SAT) exams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeTab === "list" ? "default" : "outline"}
            onClick={() => setActiveTab("list")}
            size="sm"
            className="rounded-xl font-bold cursor-pointer"
          >
            All Questions
          </Button>
          <Button
            variant={activeTab === "add" ? "default" : "outline"}
            onClick={() => setActiveTab("add")}
            size="sm"
            className="rounded-xl font-bold cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Question
          </Button>
          <Button
            variant={activeTab === "csv" ? "default" : "outline"}
            onClick={() => setActiveTab("csv")}
            size="sm"
            className="rounded-xl font-bold cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            Bulk Import (CSV)
          </Button>
        </div>
      </div>

      {/* ── ALL QUESTIONS TABLE ── */}
      {activeTab === "list" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/20 border-border/40 max-w-md rounded-xl text-xs font-semibold"
            />
          </div>

          {loading ? (
            <div className="text-center py-16 text-muted-foreground font-semibold flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading questions...</span>
            </div>
          ) : (
            <div className="border border-border/30 rounded-2xl overflow-hidden bg-card/40 backdrop-blur-sm shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border/20">
                  <tr className="text-muted-foreground text-[10px] uppercase font-black tracking-wider text-left">
                    <th className="p-4">Paper</th>
                    <th className="p-4">Chapter</th>
                    <th className="p-4">Question Text</th>
                    <th className="p-4">Correct Answer</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 font-semibold text-xs text-foreground">
                  {filteredQuestions.map((q) => (
                    <tr key={q.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase ${
                          q.paper_type === "MAT"
                            ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        }`}>
                          {q.paper_type} {q.subject ? `(${q.subject.replace("_", " ")})` : ""}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">{q.chapter}</td>
                      <td className="p-4 max-w-[280px] truncate font-medium">{q.question_text}</td>
                      <td className="p-4 text-center">
                        <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-black text-xs">
                          {q.correct_answer}
                        </span>
                      </td>
                      <td className="p-4 flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPreviewQuestion(q);
                            setPreviewLang("en");
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-lg cursor-pointer"
                          title="Quick View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(q.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredQuestions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground">
                        No NMMS questions found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MANUAL ADD FORM ── */}
      {activeTab === "add" && (
        <form onSubmit={handleManualSubmit} className="space-y-6">
          {/* Card 1: Meta Information */}
          <div className="bg-card border border-border/30 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-border/20 pb-2">
              <Info className="w-4 h-4" />
              1. Subject & Scope Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase">Paper Type</label>
                <select
                  value={form.paper_type}
                  onChange={(e) => setForm({ ...form, paper_type: e.target.value })}
                  className="w-full bg-muted/20 border border-border/40 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-amber-500/50"
                >
                  <option value="MAT">Paper 1 (MAT)</option>
                  <option value="SAT">Paper 2 (SAT)</option>
                </select>
              </div>

              {form.paper_type === "SAT" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full bg-muted/20 border border-border/40 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-amber-500/50"
                    required
                  >
                    <option value="">Select subject</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="science">Science</option>
                    <option value="social_science">Social Science</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase">Chapter</label>
                <Input
                  type="text"
                  placeholder="e.g. Force & Pressure"
                  value={form.chapter}
                  onChange={(e) => setForm({ ...form, chapter: e.target.value })}
                  className="bg-muted/20 border-border/40 rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase">Topic</label>
                <Input
                  type="text"
                  placeholder="e.g. Atmospheric Pressure"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="bg-muted/20 border-border/40 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Question Statement */}
          <div className="bg-card border border-border/30 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-border/20 pb-2">
              <Languages className="w-4 h-4" />
              2. Question Statement (Bilingual)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase">English Content</label>
                <Textarea
                  placeholder="Enter the question text in English..."
                  value={form.question_text}
                  onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                  className="bg-muted/20 border-border/40 rounded-xl text-xs font-semibold min-h-[90px]"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase">Tamil Content</label>
                <Textarea
                  placeholder="வினாவை தமிழில் உள்ளிடவும்..."
                  value={form.question_text_ta}
                  onChange={(e) => setForm({ ...form, question_text_ta: e.target.value })}
                  className="bg-muted/20 border-border/40 rounded-xl text-xs font-semibold min-h-[90px]"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Options */}
          <div className="bg-card border border-border/30 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-border/20 pb-2">
              <BookOpen className="w-4 h-4" />
              3. Option Choices (Bilingual)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Option A */}
              <div className="border border-border/30 rounded-xl p-3 bg-muted/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-primary">Option A</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="English A"
                    value={form.option_a}
                    onChange={(e) => setForm({ ...form, option_a: e.target.value })}
                    className="bg-card border-border/40 rounded-lg text-xs font-semibold"
                    required
                  />
                  <Input
                    placeholder="Tamil A"
                    value={form.option_a_ta}
                    onChange={(e) => setForm({ ...form, option_a_ta: e.target.value })}
                    className="bg-card border-border/40 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Option B */}
              <div className="border border-border/30 rounded-xl p-3 bg-muted/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-primary">Option B</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="English B"
                    value={form.option_b}
                    onChange={(e) => setForm({ ...form, option_b: e.target.value })}
                    className="bg-card border-border/40 rounded-lg text-xs font-semibold"
                    required
                  />
                  <Input
                    placeholder="Tamil B"
                    value={form.option_b_ta}
                    onChange={(e) => setForm({ ...form, option_b_ta: e.target.value })}
                    className="bg-card border-border/40 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Option C */}
              <div className="border border-border/30 rounded-xl p-3 bg-muted/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-primary">Option C</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="English C"
                    value={form.option_c}
                    onChange={(e) => setForm({ ...form, option_c: e.target.value })}
                    className="bg-card border-border/40 rounded-lg text-xs font-semibold"
                    required
                  />
                  <Input
                    placeholder="Tamil C"
                    value={form.option_c_ta}
                    onChange={(e) => setForm({ ...form, option_c_ta: e.target.value })}
                    className="bg-card border-border/40 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Option D */}
              <div className="border border-border/30 rounded-xl p-3 bg-muted/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-primary">Option D</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="English D"
                    value={form.option_d}
                    onChange={(e) => setForm({ ...form, option_d: e.target.value })}
                    className="bg-card border-border/40 rounded-lg text-xs font-semibold"
                    required
                  />
                  <Input
                    placeholder="Tamil D"
                    value={form.option_d_ta}
                    onChange={(e) => setForm({ ...form, option_d_ta: e.target.value })}
                    className="bg-card border-border/40 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Answer & Explanation */}
          <div className="bg-card border border-border/30 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-border/20 pb-2">
              <Sparkles className="w-4 h-4" />
              4. Answers, Solutions & Explanations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase">Correct Option</label>
                <select
                  value={form.correct_answer}
                  onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
                  className="w-full bg-muted/20 border border-border/40 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-amber-500/50"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase">Difficulty Level</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  className="w-full bg-muted/20 border border-border/40 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-amber-500/50"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase">Explanation (EN)</label>
                <Textarea
                  placeholder="Explain step-by-step resolution in English..."
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                  className="bg-muted/20 border-border/40 rounded-xl text-xs font-semibold min-h-[75px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase">Explanation (TA)</label>
                <Textarea
                  placeholder="விளக்கத்தை தமிழில் உள்ளிடவும்..."
                  value={form.explanation_ta}
                  onChange={(e) => setForm({ ...form, explanation_ta: e.target.value })}
                  className="bg-muted/20 border-border/40 rounded-xl text-xs font-semibold min-h-[75px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase">Hint (EN)</label>
                <Textarea
                  placeholder="Provide small English hint to help students..."
                  value={form.hint}
                  onChange={(e) => setForm({ ...form, hint: e.target.value })}
                  className="bg-muted/20 border-border/40 rounded-xl text-xs font-semibold min-h-[60px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase">Hint (TA)</label>
                <Textarea
                  placeholder="குறிப்பை தமிழில் உள்ளிடவும்..."
                  value={form.hint_ta}
                  onChange={(e) => setForm({ ...form, hint_ta: e.target.value })}
                  className="bg-muted/20 border-border/40 rounded-xl text-xs font-semibold min-h-[60px]"
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full py-3 bg-amber-500 hover:bg-amber-600 font-extrabold text-white text-xs uppercase tracking-wider rounded-xl cursor-pointer">
            {loading ? "Adding Question..." : "Create Question"}
          </Button>
        </form>
      )}

      {/* ── BULK CSV IMPORT TAB ── */}
      {activeTab === "csv" && (
        <div className="space-y-6">
          {/* Card 1: Template Info & Download */}
          <div className="bg-card border border-border/30 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/20 pb-3">
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                  Bulk CSV Uploader
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
                  Import multiple bilingual questions at once using a standardized `.csv` file schema.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="gap-1.5 text-xs font-bold border-amber-500/30 text-amber-500 hover:bg-amber-500/5 hover:text-amber-600 rounded-xl cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Download Template (.csv)
              </Button>
            </div>

            {/* Structured Schema Layout */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Expected Column Headers Mapping:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[10px] font-bold text-muted-foreground">
                <div className="bg-muted/30 border border-border/20 rounded-lg p-2">
                  <span className="text-primary font-black block">paper_type *</span>
                  MAT or SAT
                </div>
                <div className="bg-muted/30 border border-border/20 rounded-lg p-2">
                  <span className="text-primary font-black block">subject</span>
                  science, math, social_science
                </div>
                <div className="bg-muted/30 border border-border/20 rounded-lg p-2">
                  <span className="text-primary font-black block">chapter *</span>
                  Chapter title (e.g. Analogy)
                </div>
                <div className="bg-muted/30 border border-border/20 rounded-lg p-2">
                  <span className="text-primary font-black block">question_text *</span>
                  Question text in English
                </div>
                <div className="bg-muted/30 border border-border/20 rounded-lg p-2">
                  <span className="text-primary font-black block">question_text_ta</span>
                  Question text in Tamil
                </div>
                <div className="bg-muted/30 border border-border/20 rounded-lg p-2">
                  <span className="text-primary font-black block">option_a * / option_b *</span>
                  English choices A and B
                </div>
                <div className="bg-muted/30 border border-border/20 rounded-lg p-2">
                  <span className="text-primary font-black block">option_a_ta / option_b_ta</span>
                  Tamil choices A and B
                </div>
                <div className="bg-muted/30 border border-border/20 rounded-lg p-2">
                  <span className="text-primary font-black block">correct_answer *</span>
                  A, B, C, or D
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground font-semibold">
                * fields represent strict required parameters for bulk import inserts.
              </p>
            </div>
          </div>

          {/* Card 2: Drag Drop/File Selection */}
          <div className="bg-card border border-border/30 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-2 border-dashed border-border/40 hover:border-amber-500/40 transition-colors rounded-2xl p-8 text-center space-y-4 relative bg-muted/5">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="mx-auto flex flex-col items-center justify-center gap-3.5 cursor-pointer max-w-max"
              >
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-black text-foreground block">
                    {csvFile ? csvFile.name : "Select or drag & drop CSV file"}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold block">
                    Supported format: .csv comma-separated text files.
                  </span>
                </div>
              </label>
            </div>

            {/* Real-time Pre-validation & Preview UI */}
            {validationInfo && (
              <div className="border border-border/30 rounded-2xl p-5 space-y-4 bg-muted/5">
                <div className="flex items-center justify-between border-b border-border/20 pb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-amber-500" />
                    <span className="text-xs font-black text-foreground">CSV Pre-Check Validation</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                    validationInfo.valid
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                      : "bg-red-500/10 border-red-500/20 text-red-500"
                  }`}>
                    {validationInfo.valid ? "Format Valid" : "Format Errors Found"}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold text-muted-foreground">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold block">Total Rows Detected</span>
                    <span className="text-sm font-black text-foreground">{validationInfo.totalRows}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold block">Valid Questions Mapping</span>
                    <span className="text-sm font-black text-foreground text-emerald-500">{validationInfo.validRows}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold block">Header columns matched</span>
                    <span className="text-sm font-black text-foreground">{validationInfo.matchedHeaders.length} / 21</span>
                  </div>
                </div>

                {validationInfo.errorDetails.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-red-500 tracking-wider">Formatting Issues:</span>
                    <div className="max-h-32 overflow-y-auto bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-[10px] font-bold text-red-400 space-y-1 leading-relaxed">
                      {validationInfo.errorDetails.map((err, i) => (
                        <div key={i} className="flex items-start gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400 mt-0.5" />
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question Preview Table */}
                {validationInfo.sampleData.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Sample Questions Preview:</span>
                    <div className="border border-border/30 rounded-xl overflow-hidden bg-card/60">
                      <table className="w-full text-[10px] font-semibold text-muted-foreground">
                        <thead className="bg-muted/40 border-b border-border/20 text-foreground font-black uppercase">
                          <tr>
                            <th className="p-2.5 text-left">Paper</th>
                            <th className="p-2.5 text-left">Chapter</th>
                            <th className="p-2.5 text-left">Question Preview</th>
                            <th className="p-2.5 text-center">Key</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10 font-medium">
                          {validationInfo.sampleData.map((row, i) => (
                            <tr key={i} className="hover:bg-muted/10">
                              <td className="p-2.5 uppercase font-bold text-primary">{row.paper_type}</td>
                              <td className="p-2.5">{row.chapter}</td>
                              <td className="p-2.5 text-foreground truncate max-w-[200px]">{row.question_text}</td>
                              <td className="p-2.5 text-center font-black text-primary">{row.correct_answer}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {validationInfo.validRows > 0 && (
                  <Button
                    onClick={handleCsvImport}
                    disabled={importing}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-extrabold text-white text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    {importing ? "Importing questions in bulk..." : `Import ${validationInfo.validRows} Valid Questions`}
                  </Button>
                )}
              </div>
            )}

            {importStatus.type && (
              <div className={`p-4 rounded-xl flex items-start gap-3 border ${
                importStatus.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {importStatus.type === "success" ? (
                  <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                )}
                <div className="text-xs font-semibold leading-relaxed">
                  {importStatus.message}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PREVIEW QUICK VIEW MODAL (EASY VIEW) ── */}
      <Dialog open={!!previewQuestion} onOpenChange={(open) => !open && setPreviewQuestion(null)}>
        {previewQuestion && (
          <DialogContent className="max-w-xl text-left rounded-3xl p-6 bg-card border border-border/40 shadow-2xl">
            <DialogHeader className="border-b border-border/20 pb-3 flex flex-row items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Question Preview (Easy View)
                </DialogTitle>
                <DialogDescription className="text-[10px] font-semibold mt-0.5">
                  Realistic simulation of how this question is displayed in the student panel.
                </DialogDescription>
              </div>

              {/* Language Switch Toggle inside Modal */}
              <div className="flex items-center gap-1 shrink-0 bg-muted/30 border border-border/40 p-1 rounded-xl">
                <Button
                  size="sm"
                  variant={previewLang === "en" ? "default" : "ghost"}
                  onClick={() => setPreviewLang("en")}
                  className="h-7 px-2.5 text-[10px] rounded-lg font-black uppercase cursor-pointer"
                >
                  EN
                </Button>
                <Button
                  size="sm"
                  variant={previewLang === "ta" ? "default" : "ghost"}
                  onClick={() => setPreviewLang("ta")}
                  className="h-7 px-2.5 text-[10px] rounded-lg font-black uppercase cursor-pointer"
                >
                  தமிழ்
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {/* Scope details */}
              <div className="flex flex-wrap gap-2 text-[10px] font-black text-muted-foreground uppercase">
                <span className="bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-primary">
                  {previewQuestion.paper_type} {previewQuestion.subject ? `| ${previewQuestion.subject.replace("_", " ")}` : ""}
                </span>
                <span className="bg-muted/40 border border-border/20 px-2 py-0.5 rounded">
                  Chapter: {previewQuestion.chapter}
                </span>
                <span className="bg-muted/40 border border-border/20 px-2 py-0.5 rounded">
                  Topic: {previewQuestion.topic || "General"}
                </span>
                <span className={`border px-2 py-0.5 rounded ${
                  previewQuestion.difficulty === "easy"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    : previewQuestion.difficulty === "medium"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                      : "bg-red-500/10 border-red-500/20 text-red-500"
                }`}>
                  {previewQuestion.difficulty}
                </span>
              </div>

              {/* Question Statement */}
              <div className="bg-muted/15 border border-border/20 rounded-2xl p-5">
                <p className="text-sm font-extrabold text-foreground leading-relaxed">
                  {previewLang === "ta" && previewQuestion.question_text_ta
                    ? previewQuestion.question_text_ta
                    : previewQuestion.question_text}
                </p>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-2.5">
                {([
                  { id: "A", text: previewLang === "ta" && previewQuestion.option_a_ta ? previewQuestion.option_a_ta : previewQuestion.option_a },
                  { id: "B", text: previewLang === "ta" && previewQuestion.option_b_ta ? previewQuestion.option_b_ta : previewQuestion.option_b },
                  { id: "C", text: previewLang === "ta" && previewQuestion.option_c_ta ? previewQuestion.option_c_ta : previewQuestion.option_c },
                  { id: "D", text: previewLang === "ta" && previewQuestion.option_d_ta ? previewQuestion.option_d_ta : previewQuestion.option_d }
                ] as const).map((opt) => {
                  const isCorrect = previewQuestion.correct_answer === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                        isCorrect
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-sm"
                          : "bg-card border-border/30"
                      }`}
                    >
                      <span className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center text-[10px] font-black border ${
                        isCorrect
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-muted/30 border-border/30 text-muted-foreground"
                      }`}>
                        {opt.id}
                      </span>
                      <span className="flex-1 leading-snug">{opt.text}</span>
                      {isCorrect && (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Hint & Explanation */}
              <div className="border-t border-border/20 pt-4 space-y-3 text-xs font-semibold leading-relaxed">
                {(previewQuestion.hint || previewQuestion.hint_ta) && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 space-y-1">
                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Student Hint:
                    </span>
                    <p className="text-muted-foreground">
                      {previewLang === "ta" && previewQuestion.hint_ta ? previewQuestion.hint_ta : previewQuestion.hint}
                    </p>
                  </div>
                )}

                {(previewQuestion.explanation || previewQuestion.explanation_ta) && (
                  <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3.5 space-y-1">
                    <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Solution Explanation:
                    </span>
                    <p className="text-muted-foreground">
                      {previewLang === "ta" && previewQuestion.explanation_ta ? previewQuestion.explanation_ta : previewQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

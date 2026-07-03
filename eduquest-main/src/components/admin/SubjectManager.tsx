import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Subject {
  id: string;
  name: string;
  name_tamil: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  class_level: number;
  is_active: boolean;
  sort_order: number;
}

const ICONS = ["📚", "🔢", "🔬", "📝", "📖", "🌍", "🎨", "🎵", "💻", "🏃"];

const SubjectManager = () => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState({
    name: "", name_tamil: "", description: "", icon: "📚",
    color: "bg-primary", class_level: "7", sort_order: "0",
  });

  const fetchSubjects = async () => {
    const { data } = await supabase.from("subjects").select("*").order("class_level").order("sort_order");
    if (data) setSubjects(data as unknown as Subject[]);
    setLoading(false);
  };

  useEffect(() => { fetchSubjects(); }, []);

  const resetForm = () => {
    setForm({ name: "", name_tamil: "", description: "", icon: "📚", color: "bg-primary", class_level: "7", sort_order: "0" });
    setEditing(null);
  };

  const openEdit = (s: Subject) => {
    setEditing(s);
    setForm({
      name: s.name, name_tamil: s.name_tamil || "", description: s.description || "",
      icon: s.icon || "📚", color: s.color || "bg-primary",
      class_level: String(s.class_level), sort_order: String(s.sort_order),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name, name_tamil: form.name_tamil || null,
      description: form.description || null, icon: form.icon, color: form.color,
      class_level: parseInt(form.class_level), sort_order: parseInt(form.sort_order),
    };

    if (editing) {
      const { error } = await supabase.from("subjects").update(payload).eq("id", editing.id);
      if (error) {
        console.error("Error updating subject:", error);
        toast({ title: "Error updating subject", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Subject updated! ✏️" });
    } else {
      const { data: newSubject, error } = await supabase.from("subjects").insert(payload).select().single();
      if (error) {
        console.error("Error creating subject:", error);
        toast({ title: "Error creating subject", description: error.message, variant: "destructive" });
        return;
      }

      // Seed an initial "Section 1" lesson so quizzes have a home
      if (newSubject) {
        await supabase.from("lessons").insert({
          subject_id: newSubject.id,
          title: "Section 1",
          description: `Initial section for ${payload.name}`,
          lesson_order: 1,
          is_active: true
        });
      }

      toast({ title: "Subject created! 📚" });
    }
    setDialogOpen(false);
    resetForm();
    fetchSubjects();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subject and ALL its lessons, quizzes, and questions? This cannot be undone.")) return;

    // Cascade delete: questions → quizzes → lessons → subject
    const { data: lessons } = await supabase.from("lessons").select("id").eq("subject_id", id);
    if (lessons && lessons.length > 0) {
      const lessonIds = lessons.map(l => l.id);
      const { data: quizzes } = await supabase.from("quizzes").select("id").in("lesson_id", lessonIds);
      if (quizzes && quizzes.length > 0) {
        const quizIds = quizzes.map(q => q.id);
        await supabase.from("quiz_questions").delete().in("quiz_id", quizIds);
        await supabase.from("quizzes").delete().in("lesson_id", lessonIds);
      }
      await supabase.from("lessons").delete().eq("subject_id", id);
    }
    await supabase.from("subjects").delete().eq("id", id);
    toast({ title: "Subject and all related data deleted" });
    fetchSubjects();
  };

  const toggleActive = async (s: Subject) => {
    await supabase.from("subjects").update({ is_active: !s.is_active }).eq("id", s.id);
    fetchSubjects();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Subject Management
        </h2>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Subject</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Subject" : "Add Subject"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name (English)</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Name (Tamil)</Label>
                  <Input value={form.name_tamil} onChange={(e) => setForm({ ...form, name_tamil: e.target.value })} placeholder="தமிழ் பெயர்" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ICONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class Level</Label>
                  <Select value={form.class_level} onValueChange={(v) => setForm({ ...form, class_level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Array.from({ length: 12 }, (_, i) => <SelectItem key={i + 1} value={String(i + 1)}>Class {i + 1}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full">{editing ? "Update" : "Create"} Subject</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : subjects.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-card p-8 text-center">
          <span className="text-5xl block mb-3">📚</span>
          <h3 className="text-lg font-bold mb-1">No subjects yet</h3>
          <p className="text-sm text-muted-foreground">Click "Add Subject" to create your first subject.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-card overflow-x-auto">
          <Table className="min-w-[650px] md:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Tamil</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-2xl">{s.icon}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-tamil text-sm">{s.name_tamil || "–"}</TableCell>
                  <TableCell>Class {s.class_level}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? "default" : "secondary"} className="cursor-pointer" onClick={() => toggleActive(s)}>
                      {s.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SubjectManager;

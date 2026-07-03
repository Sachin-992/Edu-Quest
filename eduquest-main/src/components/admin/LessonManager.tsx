import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminClient } from "@/integrations/supabase/adminClient";
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
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Subject { id: string; name: string; icon: string | null; class_level?: number; }
interface Lesson {
  id: string; subject_id: string; title: string; title_tamil: string | null;
  content: string | null; content_tamil: string | null; lesson_order: number;
  lesson_type: string; xp_reward: number; is_active: boolean;
}

const LESSON_TYPES = [
  { value: "reading", label: "📖 Reading" },
  { value: "video", label: "🎬 Video" },
  { value: "interactive", label: "🎮 Interactive" },
  { value: "game", label: "🕹️ Game" },
];

interface LessonManagerProps {
  isTeacher?: boolean;
  assignedClasses?: number[];
  assignedSubjects?: string[];
  assignments?: any[];
}

const LessonManager = ({
  isTeacher = false,
  assignedClasses = [],
  assignedSubjects = [],
  assignments = [],
}: LessonManagerProps) => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [form, setForm] = useState({
    title: "", title_tamil: "", content: "", content_tamil: "",
    lesson_type: "reading", xp_reward: "15", lesson_order: "0",
  });

  useEffect(() => {
    const fetch = async () => {
      let query = getAdminClient().from("subjects").select("id, name, icon, class_level").order("sort_order");
      if (isTeacher) {
        query = query.in("class_level", assignedClasses);
      }
      const { data } = await query;
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
      setLoading(false);
    };
    fetch();
  }, [isTeacher, assignedClasses, assignments]);

  useEffect(() => {
    if (!selectedSubject) return;
    const fetchLessons = async () => {
      const { data } = await getAdminClient().from("lessons").select("*").eq("subject_id", selectedSubject).order("lesson_order");
      if (data) setLessons(data as unknown as Lesson[]);
    };
    fetchLessons();
  }, [selectedSubject]);

  const resetForm = () => {
    setForm({ title: "", title_tamil: "", content: "", content_tamil: "", lesson_type: "reading", xp_reward: "15", lesson_order: "0" });
    setEditing(null);
  };

  const openEdit = (l: Lesson) => {
    setEditing(l);
    setForm({
      title: l.title, title_tamil: l.title_tamil || "", content: l.content || "",
      content_tamil: l.content_tamil || "", lesson_type: l.lesson_type,
      xp_reward: String(l.xp_reward), lesson_order: String(l.lesson_order),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      subject_id: selectedSubject,
      title: form.title, title_tamil: form.title_tamil || null,
      content: form.content || null, content_tamil: form.content_tamil || null,
      lesson_type: form.lesson_type, xp_reward: parseInt(form.xp_reward),
      lesson_order: parseInt(form.lesson_order),
    };

    if (editing) {
      const { error } = await supabase.from("lessons").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error updating lesson", variant: "destructive" }); return; }
      toast({ title: "Lesson updated! ✏️" });
    } else {
      const { error } = await supabase.from("lessons").insert(payload);
      if (error) { toast({ title: "Error creating lesson", variant: "destructive" }); return; }
      toast({ title: "Lesson created! 📝" });
    }
    setDialogOpen(false);
    resetForm();
    // Refresh
    const { data } = await getAdminClient().from("lessons").select("*").eq("subject_id", selectedSubject).order("lesson_order");
    if (data) setLessons(data as unknown as Lesson[]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    await supabase.from("lessons").delete().eq("id", id);
    toast({ title: "Lesson deleted" });
    const { data } = await getAdminClient().from("lessons").select("*").eq("subject_id", selectedSubject).order("lesson_order");
    if (data) setLessons(data as unknown as Lesson[]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-5 h-5" /> Lesson Management
        </h2>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={!selectedSubject}><Plus className="w-4 h-4" /> Add Lesson</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Lesson" : "Add Lesson"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title (English)</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Title (Tamil)</Label>
                  <Input value={form.title_tamil} onChange={(e) => setForm({ ...form, title_tamil: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Content (English)</Label>
                <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Content (Tamil)</Label>
                <Textarea value={form.content_tamil} onChange={(e) => setForm({ ...form, content_tamil: e.target.value })} rows={3} className="font-tamil" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.lesson_type} onValueChange={(v) => setForm({ ...form, lesson_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LESSON_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>XP Reward</Label>
                  <Input type="number" value={form.xp_reward} onChange={(e) => setForm({ ...form, xp_reward: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Order</Label>
                  <Input type="number" value={form.lesson_order} onChange={(e) => setForm({ ...form, lesson_order: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full">{editing ? "Update" : "Create"} Lesson</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subject Filter */}
      <div className="mb-4">
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-x-auto">
        <Table className="min-w-[650px] md:min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>XP</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No lessons yet</TableCell></TableRow>
            ) : lessons.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{l.lesson_order}</TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium">{l.title}</span>
                    {l.title_tamil && <span className="block text-sm text-muted-foreground font-tamil">{l.title_tamil}</span>}
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline">{l.lesson_type}</Badge></TableCell>
                <TableCell>{l.xp_reward}</TableCell>
                <TableCell>
                  <Badge variant={l.is_active ? "default" : "secondary"}>
                    {l.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(l)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(l.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LessonManager;

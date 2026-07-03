import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  UserPlus,
  Book,
  GraduationCap,
  Mail,
  Lock,
  User,
  Search,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TeacherManagerProps {
  schoolId: string;
}

interface Teacher {
  id: string; // user_id
  full_name: string;
  avatar_url: string | null;
  email?: string;
  assignments: Assignment[];
}

interface Assignment {
  id: string;
  class_level: number;
  subject_id: string | null;
  subject_name?: string;
  subject_icon?: string;
}

interface Subject {
  id: string;
  name: string;
  icon: string;
}

const MIN_PASSWORD = 6;

const TeacherManager = ({ schoolId }: TeacherManagerProps) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Create Teacher Form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [createdTeacher, setCreatedTeacher] = useState<{ email: string } | null>(null);

  // Assignment Modal/Selection
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignClass, setAssignClass] = useState("");
  const [assignSubject, setAssignSubject] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  const { toast } = useToast();

  const fetchTeachersAndSubjects = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      // 1. Fetch all subjects for this school or globally
      const { data: subjectData } = await supabase
        .from("subjects")
        .select("id, name, icon")
        .eq("school_id", schoolId)
        .eq("is_active", true);
      
      const subList = (subjectData || []) as Subject[];
      setSubjects(subList);

      // 2. Fetch profiles that are teachers. 
      // We do this by querying user_roles with role = 'teacher'
      const { data: roleData, error: roleErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "teacher");

      if (roleErr) throw roleErr;

      const teacherUserIds = (roleData || []).map((r) => r.user_id);
      if (teacherUserIds.length === 0) {
        setTeachers([]);
        setLoading(false);
        return;
      }

      // Fetch profiles
      const { data: profileData, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", teacherUserIds)
        .eq("school_id", schoolId);

      if (profErr) throw profErr;

      // Fetch assignments
      // Check if table exists. We wrap in try-catch to prevent crash if table doesn't exist yet
      let assignmentsData: any[] = [];
      try {
        const { data: assData } = await supabase
          .from("teacher_assignments" as any)
          .select("id, teacher_id, class_level, subject_id")
          .eq("school_id", schoolId);
        
        assignmentsData = assData || [];
      } catch (err) {
        console.warn("teacher_assignments table query failed. Ensure migration is applied.", err);
      }

      // Map profiles to Teacher interface
      const list: Teacher[] = (profileData || []).map((p) => {
        const tAssignments = assignmentsData
          .filter((a) => a.teacher_id === p.user_id)
          .map((a) => {
            const subject = subList.find((s) => s.id === a.subject_id);
            return {
              id: a.id,
              class_level: a.class_level,
              subject_id: a.subject_id,
              subject_name: subject?.name || "All Subjects",
              subject_icon: subject?.icon || "📚",
            };
          });

        return {
          id: p.user_id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          assignments: tAssignments.sort((a, b) => a.class_level - b.class_level),
        };
      });

      setTeachers(list);
    } catch (err: any) {
      console.error("[TeacherManager] Fetch error:", err);
      toast({
        title: "Error fetching teachers",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachersAndSubjects();
  }, [schoolId]);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (password.length < MIN_PASSWORD) {
      toast({ title: `Password must be at least ${MIN_PASSWORD} characters`, variant: "destructive" });
      return;
    }

    setAddLoading(true);
    try {
      const res = await supabase.functions.invoke("manage-teacher", {
        body: {
          action: "create-teacher",
          full_name: fullName,
          email,
          password,
          school_id: schoolId,
        },
      });

      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);

      setCreatedTeacher({ email });
      toast({ title: "Teacher account created successfully! 🧑‍🏫" });
      fetchTeachersAndSubjects();
    } catch (err: any) {
      console.error("[AddTeacher] Error:", err);
      toast({
        title: "Error creating teacher",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !assignClass) {
      toast({ title: "Please select a class", variant: "destructive" });
      return;
    }

    setAssignLoading(true);
    try {
      const payload = {
        teacher_id: selectedTeacher.id,
        school_id: schoolId,
        class_level: parseInt(assignClass),
        subject_id: assignSubject && assignSubject !== "all" ? assignSubject : null,
      };

      const { error } = await supabase
        .from("teacher_assignments" as any)
        .insert(payload);

      if (error) throw error;

      toast({ title: "Assignment added! 📚" });
      setAssignClass("");
      setAssignSubject("");
      setIsAssignOpen(false);
      fetchTeachersAndSubjects();
    } catch (err: any) {
      console.error("[AssignTeacher] Error:", err);
      toast({
        title: "Error adding assignment",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("teacher_assignments" as any)
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      toast({ title: "Assignment removed!" });
      fetchTeachersAndSubjects();
    } catch (err: any) {
      console.error("[RemoveAssignment] Error:", err);
      toast({
        title: "Error removing assignment",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    if (!confirm("Are you sure you want to remove this teacher? This will delete their profile and role. (Auth login is preserved but they lose school access).")) return;
    
    try {
      const res = await supabase.functions.invoke("manage-teacher", {
        body: {
          action: "remove-teacher",
          teacher_id: teacherId,
        },
      });

      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);

      toast({ title: "Teacher removed successfully." });
      fetchTeachersAndSubjects();
    } catch (err: any) {
      console.error("[RemoveTeacher] Error:", err);
      toast({
        title: "Error removing teacher",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const filteredTeachers = teachers.filter((t) =>
    t.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            🧑‍🏫 Teacher Management
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add teachers, assign classes, and link subjects for analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog
            open={isAddOpen}
            onOpenChange={(isOpen) => {
              setIsAddOpen(isOpen);
              if (!isOpen) {
                setFullName("");
                setEmail("");
                setPassword("");
                setCreatedTeacher(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-primary/95 text-primary-foreground font-semibold rounded-xl px-4 py-2.5 shadow-md shadow-primary/10">
                <UserPlus className="w-4 h-4" /> Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {createdTeacher ? "Teacher Created! 🎉" : "Add New Teacher"}
                </DialogTitle>
              </DialogHeader>

              {createdTeacher ? (
                <div className="space-y-4 mt-2">
                  <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-2xl border border-border/40 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                    <p className="font-bold text-base">Account Created Successfully</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Credentials sent to <b>{createdTeacher.email}</b>. They can now log in using the Admin login portal.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setCreatedTeacher(null);
                      setFullName("");
                      setEmail("");
                      setPassword("");
                    }}
                    className="w-full rounded-xl"
                  >
                    Add Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleAddTeacher} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="e.g. Mrs. Priya Govind"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="pl-10 h-11 rounded-xl bg-card border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="priya@school.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-11 rounded-xl bg-card border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pin" className="text-sm font-semibold">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="pin"
                        type="password"
                        placeholder={`Min ${MIN_PASSWORD} characters`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={MIN_PASSWORD}
                        className="pl-10 h-11 rounded-xl bg-card border-border"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition-transform"
                    disabled={addLoading}
                  >
                    {addLoading ? "Creating account..." : "Create Teacher Account"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search teachers by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-10 rounded-xl bg-card/65 border-border"
        />
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground font-semibold">Loading teachers...</p>
          </div>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-muted/5 py-12 text-center rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <span className="text-4xl mb-3">🧑‍🏫</span>
            <p className="font-bold text-muted-foreground text-sm">No teachers found</p>
            <p className="text-xs text-muted-foreground/80 mt-1 max-w-xs mx-auto">
              Add new teachers to assign them classes and view class analytics.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeachers.map((teacher) => (
            <motion.div
              key={teacher.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border/40 hover:border-primary/20 hover:shadow-md transition-all rounded-2xl flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 flex items-center justify-center text-lg select-none text-primary font-black">
                    {teacher.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground truncate max-w-[180px]">
                      {teacher.full_name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 uppercase tracking-wider mt-0.5">
                      Teacher Persona
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Assignments ({teacher.assignments.length})</span>
                    <button
                      onClick={() => {
                        setSelectedTeacher(teacher);
                        setIsAssignOpen(true);
                      }}
                      className="text-primary hover:underline font-extrabold flex items-center gap-0.5 lowercase text-xs"
                    >
                      + Add
                    </button>
                  </div>

                  {teacher.assignments.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-1">
                      No classes or subjects assigned.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 py-1">
                      {teacher.assignments.map((ass) => (
                        <div
                          key={ass.id}
                          className="flex items-center gap-1 bg-muted/65 hover:bg-muted border border-border/50 rounded-lg pl-2 pr-1.5 py-1 text-xs text-foreground font-semibold group transition-colors"
                        >
                          <span className="text-xs font-bold text-primary">Class {ass.class_level}</span>
                          <span className="text-[10px] text-muted-foreground px-1 bg-card/60 rounded border border-border/40 flex items-center gap-0.5">
                            <span>{ass.subject_icon}</span>
                            <span>{ass.subject_name}</span>
                          </span>
                          <button
                            onClick={() => handleRemoveAssignment(ass.id)}
                            className="text-muted-foreground hover:text-destructive p-0.5 rounded-md hover:bg-destructive/10 transition-colors"
                            title="Remove assignment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/30 border-t border-border/40 px-5 py-3 flex items-center justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveTeacher(teacher.id)}
                  className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-semibold"
                >
                  Remove Teacher
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Assignment Creator Dialog */}
      <Dialog
        open={isAssignOpen}
        onOpenChange={(isOpen) => {
          setIsAssignOpen(isOpen);
          if (!isOpen) {
            setAssignClass("");
            setAssignSubject("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" /> Assign Class & Subject
            </DialogTitle>
          </DialogHeader>

          {selectedTeacher && (
            <form onSubmit={handleAssignSubmit} className="space-y-4 mt-2">
              <div className="bg-muted/40 p-3 rounded-xl border border-border/40 mb-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {selectedTeacher.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground leading-none">Assigning for</p>
                  <p className="text-sm font-bold text-foreground mt-1 leading-none">{selectedTeacher.full_name}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Select Class</Label>
                <Select value={assignClass} onValueChange={setAssignClass}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select Grade / Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((c) => (
                      <SelectItem key={c} value={String(c)}>
                        Grade / Class {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Select Subject</Label>
                <Select value={assignSubject} onValueChange={setAssignSubject}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="All Subjects (General Teacher)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects (General Teacher)</SelectItem>
                    {subjects.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.icon} {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Linking a subject scopes this assignment to only that subject's analytics.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition-transform"
                disabled={assignLoading}
              >
                {assignLoading ? "Saving..." : "Add Assignment"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherManager;

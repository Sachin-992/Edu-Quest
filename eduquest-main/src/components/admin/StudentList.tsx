import { useEffect, useState, useMemo } from "react";
import { getAdminClient } from "@/integrations/supabase/adminClient";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Search, ArrowUpDown, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Key, Eye, EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  roll_number: string | null;
  class_level: number | null;
  is_active: boolean;
  created_at: string;
  avg_score: number;
  last_active: string | null;
}

interface StudentListProps {
  refreshKey: number;
  isTeacher?: boolean;
  assignedClasses?: number[];
  assignedSubjects?: string[];
  assignments?: any[];
}

type SortField = "full_name" | "roll_number" | "class_level" | "created_at" | "avg_score" | "last_active";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const avatarGradients = [
  "bg-gradient-to-br from-blue-400 to-blue-600 text-white",
  "bg-gradient-to-br from-violet-400 to-purple-600 text-white",
  "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white",
  "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
  "bg-gradient-to-br from-rose-400 to-pink-600 text-white",
  "bg-gradient-to-br from-cyan-400 to-teal-600 text-white",
];

const timeAgo = (d: string | null) => {
  if (!d) return "Never";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const StudentList = ({
  refreshKey,
  isTeacher = false,
  assignedClasses = [],
  assignedSubjects = [],
  assignments = [],
}: StudentListProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [newPin, setNewPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinChangeOpen, setPinChangeOpen] = useState(false);
  const { toast } = useToast();

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !newPin) return;

    if (newPin.length < 6) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPin(true);
    try {
      const { data, error } = await getAdminClient().functions.invoke(
        "reset-student-pin",
        {
          body: {
            student_id: selectedStudent.user_id,
            new_pin: newPin,
          },
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "PIN Updated! 🔑",
        description: `Successfully changed PIN for ${selectedStudent.full_name}.`,
      });
      setPinChangeOpen(false);
      setNewPin("");
    } catch (err: any) {
      console.error("[StudentList] Error updating PIN:", err);
      toast({
        title: "Failed to update PIN",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPin(false);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch profiles
      let profileQuery = getAdminClient()
        .from("profiles")
        .select("id, user_id, full_name, roll_number, class_level, is_active, created_at")
        .not("roll_number", "is", null);

      if (isTeacher) {
        profileQuery = profileQuery.in("class_level", assignedClasses);
      }

      const { data: profiles, error: profileError } = await profileQuery
        .order("created_at", { ascending: false });

      if (profileError) throw profileError;
      if (!profiles) { setStudents([]); setLoading(false); return; }

      // Fetch all quiz scores + latest activity per student
      const userIds = profiles.map(p => p.user_id);
      const { data: progressData } = await getAdminClient()
        .from("student_progress")
        .select("user_id, score, quiz_id, completed_at, status")
        .in("user_id", userIds)
        .eq("status", "completed");

      // Aggregate per user
      const userStats = new Map<string, { scores: number[]; lastActive: string | null }>();
      (progressData || []).forEach(p => {
        if (!userStats.has(p.user_id)) {
          userStats.set(p.user_id, { scores: [], lastActive: null });
        }
        const stat = userStats.get(p.user_id)!;
        if (p.quiz_id && p.score != null) stat.scores.push(p.score);
        if (p.completed_at && (!stat.lastActive || p.completed_at > stat.lastActive)) {
          stat.lastActive = p.completed_at;
        }
      });

      const enriched: Student[] = profiles.map(p => {
        const stat = userStats.get(p.user_id);
        return {
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name,
          roll_number: p.roll_number,
          class_level: p.class_level,
          is_active: p.is_active,
          created_at: p.created_at,
          avg_score: stat && stat.scores.length > 0
            ? Math.round(stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length)
            : 0,
          last_active: stat?.lastActive ?? null,
        };
      });

      setStudents(enriched);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load students");
    }
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, [refreshKey, isTeacher, assignedClasses]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [search, classFilter, statusFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "avg_score" || field === "last_active" ? "desc" : "asc");
    }
  };

  const filtered = useMemo(() => {
    let result = students;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.full_name.toLowerCase().includes(q) || s.roll_number?.toLowerCase().includes(q)
      );
    }
    if (classFilter !== "all") result = result.filter((s) => s.class_level === parseInt(classFilter));
    if (statusFilter !== "all") result = result.filter((s) => (statusFilter === "active" ? s.is_active : !s.is_active));

    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "full_name") cmp = a.full_name.localeCompare(b.full_name);
      else if (sortField === "roll_number") cmp = (a.roll_number ?? "").localeCompare(b.roll_number ?? "");
      else if (sortField === "class_level") cmp = (a.class_level ?? 0) - (b.class_level ?? 0);
      else if (sortField === "avg_score") cmp = a.avg_score - b.avg_score;
      else if (sortField === "last_active") {
        const aTime = a.last_active ? new Date(a.last_active).getTime() : 0;
        const bTime = b.last_active ? new Date(b.last_active).getTime() : 0;
        cmp = aTime - bTime;
      } else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [students, search, classFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const classLevels = useMemo(
    () => {
      if (isTeacher) return assignedClasses;
      return [...new Set(students.map((s) => s.class_level).filter(Boolean))].sort((a, b) => (a ?? 0) - (b ?? 0));
    },
    [students, isTeacher, assignedClasses]
  );

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-primary" />
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-20 ml-auto" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-destructive" />
        </div>
        <h3 className="text-sm font-bold text-foreground mb-1">Failed to load students</h3>
        <p className="text-xs text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchStudents} className="rounded-xl text-xs">
          Retry
        </Button>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">No Students Yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Click "Add Student" above to create your first student account.
        </p>
      </div>
    );
  }

  const SortableHead = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground transition-colors font-bold text-[11px] uppercase tracking-wider"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        <SortIcon field={field} />
      </span>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      {/* ── Search & Filter Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or roll number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-sm rounded-xl bg-background border-border/50 focus:border-primary/50 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="h-10 w-[130px] text-xs rounded-xl bg-background border-border/50 font-medium">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classLevels.map((c) => (
                <SelectItem key={c} value={String(c)}>Class {c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-[120px] text-xs rounded-xl bg-background border-border/50 font-medium">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
            {filtered.length} of {students.length}
          </span>
        </div>
      </div>

      {/* ── Table with Sticky Header ── */}
      <div className="rounded-xl border border-border/40 overflow-hidden">
        <div className="max-h-[560px] overflow-auto">
          <Table className="min-w-[750px] md:min-w-full">
            <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent border-border/30">
                <SortableHead field="full_name">Name</SortableHead>
                <SortableHead field="roll_number">Roll No.</SortableHead>
                <SortableHead field="class_level">Class</SortableHead>
                <SortableHead field="avg_score">Avg Score</SortableHead>
                <SortableHead field="last_active">Last Active</SortableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                    No students match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((s, idx) => (
                  <TableRow
                    key={s.id}
                    className="group hover:bg-primary/[0.03] border-border/20 transition-colors duration-150"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 text-[11px] font-bold shadow-sm">
                          <AvatarFallback className={avatarGradients[(page * PAGE_SIZE + idx) % avatarGradients.length]}>
                            {getInitials(s.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm text-foreground">{s.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground font-mono bg-muted/40 px-2 py-0.5 rounded">
                        {s.roll_number}
                      </code>
                    </TableCell>
                    <TableCell>
                      {s.class_level ? (
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10 text-primary text-xs font-black">
                          {s.class_level}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.avg_score > 0 ? (
                        <span className={`font-bold text-sm ${s.avg_score >= 70 ? "text-emerald-600 dark:text-emerald-400" :
                          s.avg_score >= 40 ? "text-amber-600 dark:text-amber-400" :
                            "text-red-600 dark:text-red-400"
                          }`}>
                          {s.avg_score}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No data</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-medium">
                        {timeAgo(s.last_active)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {s.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 shadow-none font-semibold text-[11px]">
                          <span className="relative flex h-1.5 w-1.5 mr-1.5">
                            <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-500" />
                          </span>
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-muted/60 text-muted-foreground border-muted/40 shadow-none font-medium text-[11px]">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                        onClick={() => {
                          setSelectedStudent(s);
                          setPinChangeOpen(true);
                        }}
                      >
                        <Key className="w-3.5 h-3.5 text-primary" />
                        Change PIN
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "ghost"}
                  size="icon"
                  className={`h-8 w-8 rounded-lg text-xs font-bold ${page === pageNum ? "shadow-sm" : ""}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Change PIN Dialog ── */}
      <Dialog open={pinChangeOpen} onOpenChange={(open) => {
        setPinChangeOpen(open);
        if (!open) {
          setSelectedStudent(null);
          setNewPin("");
          setShowPin(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" /> Change PIN
            </DialogTitle>
            <DialogDescription>
              Update the login PIN for <strong>{selectedStudent?.full_name}</strong> (Roll No: {selectedStudent?.roll_number}).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePinChange} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="newPin">New Login PIN</Label>
              <div className="relative">
                <Input
                  id="newPin"
                  type={showPin ? "text" : "password"}
                  placeholder="Enter new 6-character PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  minLength={6}
                  required
                  className="h-10 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                The student will use this PIN to log in to their dashboard. Minimum 6 characters.
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPinChangeOpen(false)}
                disabled={isChangingPin}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isChangingPin}>
                {isChangingPin ? "Updating..." : "Update PIN"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentList;

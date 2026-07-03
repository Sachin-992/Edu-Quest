import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getAdminClient } from "@/integrations/supabase/adminClient";
import { onQuizComplete, onActivityComplete } from "@/lib/quizSyncBus";
import { Button } from "@/components/ui/button";
import {
  LogOut, Users, Target, BookOpen, HelpCircle,
  GraduationCap, TrendingUp, LayoutGrid, RefreshCw, Heart, Database,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dashboard overview — HeroStatCards is critical (loads first)
import HeroStatCards from "@/components/admin/dashboard/HeroStatCards";
import QuickActionsBar from "@/components/admin/dashboard/QuickActionsBar";
import SectionErrorBoundary from "@/components/admin/dashboard/SectionErrorBoundary";

// Deferred overview components — lazy-loaded so HeroStatCards renders first
const ClassOverview = lazy(() => import("@/components/admin/dashboard/ClassOverview"));
const RecentActivityFeed = lazy(() => import("@/components/admin/dashboard/RecentActivityFeed"));
const EngagementInsights = lazy(() => import("@/components/admin/dashboard/EngagementInsights"));

// Lazy-loaded tab components — only loaded when clicked
const StudentList = lazy(() => import("@/components/admin/StudentList"));
const ClassPerformance = lazy(() => import("@/components/admin/ClassPerformance"));
const StudentGrowthTracker = lazy(() => import("@/components/admin/StudentGrowthTracker"));
const LeaderboardControls = lazy(() => import("@/components/admin/LeaderboardControls"));
const SubjectManager = lazy(() => import("@/components/admin/SubjectManager"));
const LessonManager = lazy(() => import("@/components/admin/LessonManager"));
const QuizManager = lazy(() => import("@/components/admin/QuizManager"));
const SchoolAnalytics = lazy(() => import("@/components/admin/SchoolAnalytics"));
const EngagementDashboard = lazy(() => import("@/components/admin/EngagementDashboard"));
const EnglishBuddyManager = lazy(() => import("@/components/admin/EnglishBuddyManager"));
const TeacherManager = lazy(() => import("@/components/admin/TeacherManager"));
const ClassAnalytics = lazy(() => import("@/components/admin/ClassAnalytics"));
const ContentHealthTracker = lazy(() => import("@/components/admin/ContentHealthTracker"));

/* ── Tab loading skeleton ── */
const TabSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 w-48 bg-muted rounded-lg" />
    <div className="h-64 w-full bg-muted/50 rounded-xl" />
  </div>
);

/* ── Overview skeleton ── */
const OverviewSkeleton = () => (
  <div className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-6 shadow-sm space-y-4 animate-pulse">
    <div className="h-6 w-40 bg-muted rounded-lg" />
    <div className="h-12 w-full bg-muted/50 rounded-xl" />
    <div className="h-12 w-full bg-muted/50 rounded-xl" />
    <div className="h-12 w-full bg-muted/50 rounded-xl" />
  </div>
);

const AdminDashboard = () => {
  const { role, profile, user, signOut } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState(role === "teacher" ? "class_analytics" : "students");
  const [schoolId, setSchoolId] = useState<string>("");
  const tabsRef = useRef<HTMLDivElement>(null);

  const [assignedClasses, setAssignedClasses] = useState<number[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  useEffect(() => {
    if (role !== "teacher" || !user) {
      setAssignmentsLoading(false);
      return;
    }

    const fetchAssignments = async () => {
      try {
        const { data, error } = await getAdminClient()
          .from("teacher_assignments" as any)
          .select("id, class_level, subject_id")
          .eq("teacher_id", user.id);

        if (error) throw error;

        const list = data || [];
        setAssignments(list);

        const classes = list.map((a) => a.class_level);
        setAssignedClasses(Array.from(new Set(classes)).sort((a, b) => a - b));

        const subjects = list.map((a) => a.subject_id).filter(Boolean) as string[];
        setAssignedSubjects(Array.from(new Set(subjects)));
      } catch (err) {
        console.error("Error fetching teacher assignments:", err);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    fetchAssignments();
  }, [role, user]);

  useEffect(() => {
    if (role === "teacher" && activeTab === "students") {
      setActiveTab("class_analytics");
    }
  }, [role, activeTab]);

  const handleNavigate = useCallback((tab: string) => {
    setActiveTab(tab);
    // Scroll tabs into view after a brief delay for state to update
    setTimeout(() => {
      tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });

  useEffect(() => {
    const resolveSchool = async () => {
      if (profile?.school_id) {
        setSchoolId(profile.school_id);
        return;
      }
      // Fallback: use admin client to bypass RLS for teacher role
      const { data } = await getAdminClient().from("schools").select("id").limit(1).maybeSingle();
      if (data) setSchoolId(data.id);
    };
    resolveSchool();
  }, [profile?.school_id]);

  // Auto-refresh StudentList when any student completes a quiz or activity
  useEffect(() => {
    const unsub1 = onQuizComplete(() => setRefreshKey(k => k + 1));
    const unsub2 = onActivityComplete(() => setRefreshKey(k => k + 1));
    return () => { unsub1(); unsub2(); };
  }, []);

  if (role === "teacher" && assignmentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium text-sm font-semibold">Loading assignments...</p>
        </div>
      </div>
    );
  }

  const tabs = role === "teacher"
    ? [
        { value: "class_analytics", label: "Class Analytics", icon: TrendingUp },
        { value: "students", label: "Students", icon: Users },
        { value: "performance", label: "Performance", icon: Target },
        { value: "lessons", label: "Lessons", icon: BookOpen },
        { value: "quizzes", label: "Quizzes", icon: HelpCircle },
      ]
    : [
        { value: "students", label: "Students", icon: Users },
        { value: "teachers", label: "Teachers", icon: Users },
        { value: "class_analytics", label: "Class Analytics", icon: TrendingUp },
        { value: "performance", label: "Performance", icon: Target },
        { value: "growth", label: "Growth", icon: TrendingUp },
        { value: "leaderboard", label: "Leaderboard", icon: GraduationCap },
        { value: "subjects", label: "Subjects", icon: LayoutGrid },
        { value: "lessons", label: "Lessons", icon: BookOpen },
        { value: "quizzes", label: "Quizzes", icon: HelpCircle },
        { value: "content_health", label: "Content Health", icon: Database },
        { value: "engagement", label: "Engagement", icon: Heart },
        { value: "analytics", label: "Analytics", icon: Target },
        { value: "english_buddy", label: "English Buddy", icon: BookOpen },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 overflow-x-hidden">
      {/* ── Premium Sticky Header ── */}
      <header className="sticky top-0 z-30 border-b border-border/30 bg-card/70 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-3 md:py-0 md:h-16 gap-3 md:gap-0">
          
          {/* Greeting Row (Left on Desktop, Full Width with mobile buttons on Mobile) */}
          <div className="w-full md:w-auto flex items-center justify-between gap-3.5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="leading-tight">
                <h1 className="text-base xl:text-lg font-extrabold text-foreground tracking-tight whitespace-nowrap">
                  {greeting}, {(() => {
                    const raw = profile?.full_name || "Admin";
                    if (!raw.includes("@")) return raw;
                    const local = raw.split("@")[0];
                    const name = local.replace(/[0-9_.]+/g, " ").trim().split(" ")[0];
                    return name.charAt(0).toUpperCase() + name.slice(1);
                  })()} 👋
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                  {dateStr}
                </p>
              </div>
            </div>

            {/* Mobile Actions: Refresh & Logout placed in the greeting row on mobile */}
            <div className="flex md:hidden items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRefreshKey(k => k + 1)}
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60"
                title="Refresh data"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <div className="h-4 w-px bg-border/50 mx-0.5" />
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* QuickActionsBar Row (Middle on Desktop, 2nd Row horizontally scrollable on Mobile) */}
          <div className="w-full md:flex-1 flex justify-start md:justify-end md:mr-4 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <QuickActionsBar
              schoolId={schoolId}
              onStudentAdded={() => setRefreshKey(k => k + 1)}
              onNavigate={handleNavigate}
              isTeacher={role === "teacher"}
            />
          </div>

          {/* Desktop Actions: Refresh & Logout (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRefreshKey(k => k + 1)}
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="h-5 w-px bg-border/50 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

        </div>
      </header>

      <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-6 md:py-8 lg:py-10 space-y-6 lg:space-y-8">
        {/* ── Hero Stat Cards — loads FIRST (critical above-the-fold) ── */}
        <SectionErrorBoundary fallbackTitle="Stats failed to load">
          <HeroStatCards
            key={refreshKey}
            onCardClick={handleNavigate}
            isTeacher={role === "teacher"}
            assignedClasses={assignedClasses}
            assignedSubjects={assignedSubjects}
            assignments={assignments}
          />
        </SectionErrorBoundary>

        {/* ── Overview Row — DEFERRED (lazy-loaded, renders after hero stats) ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6 xl:gap-8">
          <SectionErrorBoundary fallbackTitle="Class overview failed">
            <Suspense fallback={<OverviewSkeleton />}>
              <ClassOverview
                isTeacher={role === "teacher"}
                assignedClasses={assignedClasses}
                assignedSubjects={assignedSubjects}
                assignments={assignments}
              />
            </Suspense>
          </SectionErrorBoundary>
          <SectionErrorBoundary fallbackTitle="Activity feed failed">
            <Suspense fallback={<OverviewSkeleton />}>
              <RecentActivityFeed
                isTeacher={role === "teacher"}
                assignedClasses={assignedClasses}
                assignedSubjects={assignedSubjects}
                assignments={assignments}
              />
            </Suspense>
          </SectionErrorBoundary>
          <SectionErrorBoundary fallbackTitle="Engagement insights failed">
            <Suspense fallback={<OverviewSkeleton />}>
              <EngagementInsights
                onNavigate={handleNavigate}
                isTeacher={role === "teacher"}
                assignedClasses={assignedClasses}
                assignedSubjects={assignedSubjects}
                assignments={assignments}
              />
            </Suspense>
          </SectionErrorBoundary>
        </section>



        {/* ── Management Tabs — LAZY-LOADED per tab ── */}
        <div ref={tabsRef}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
            <div className="overflow-x-auto pb-1.5 -mx-5 px-5 md:mx-0 md:px-0">
              <TabsList className="min-w-full w-max flex h-12 bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-1 gap-1 shadow-sm">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex-1 shrink-0 rounded-xl px-3 py-2.5 xl:px-5 xl:py-3 text-sm xl:text-base font-semibold text-muted-foreground gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:text-foreground transition-all duration-200 whitespace-nowrap"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-5 md:p-7 shadow-sm min-h-[420px]">
              <TabsContent value="students" className="mt-0 animate-fade-in">
                <SectionErrorBoundary fallbackTitle="Student list failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <StudentList
                      refreshKey={refreshKey}
                      isTeacher={role === "teacher"}
                      assignedClasses={assignedClasses}
                      assignedSubjects={assignedSubjects}
                      assignments={assignments}
                    />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="performance" className="mt-0 animate-fade-in">
                <SectionErrorBoundary fallbackTitle="Performance data failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <ClassPerformance
                      isTeacher={role === "teacher"}
                      assignedClasses={assignedClasses}
                      assignedSubjects={assignedSubjects}
                      assignments={assignments}
                    />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="growth" className="mt-0 animate-fade-in">
                <SectionErrorBoundary fallbackTitle="Growth tracker failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <StudentGrowthTracker />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="content_health" className="mt-0 animate-fade-in">
                <SectionErrorBoundary fallbackTitle="Content health tracker failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <ContentHealthTracker />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="leaderboard" className="mt-0 animate-fade-in">
                <SectionErrorBoundary fallbackTitle="Leaderboard failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <LeaderboardControls />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="subjects" className="mt-0 animate-fade-in">
                <SectionErrorBoundary fallbackTitle="Subject manager failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <SubjectManager />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="lessons" className="mt-0 animate-fade-in">
                <SectionErrorBoundary fallbackTitle="Lesson manager failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <LessonManager
                      isTeacher={role === "teacher"}
                      assignedClasses={assignedClasses}
                      assignedSubjects={assignedSubjects}
                      assignments={assignments}
                    />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="quizzes" className="mt-0 animate-fade-in">
                <SectionErrorBoundary fallbackTitle="Quiz manager failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <QuizManager
                      isTeacher={role === "teacher"}
                      assignedClasses={assignedClasses}
                      assignedSubjects={assignedSubjects}
                      assignments={assignments}
                    />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="engagement" className="mt-0 animate-fade-in">
                <SectionErrorBoundary fallbackTitle="Engagement analytics failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <EngagementDashboard />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="analytics" className="mt-0 animate-fade-in">
                <SectionErrorBoundary fallbackTitle="Analytics failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <SchoolAnalytics />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="english_buddy" className="mt-0 animate-fade-in">
                <SectionErrorBoundary fallbackTitle="English Buddy manager failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <EnglishBuddyManager />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="teachers" className="mt-0 animate-fade-in">
                <SectionErrorBoundary fallbackTitle="Teacher manager failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <TeacherManager schoolId={schoolId} />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="class_analytics" className="mt-0 animate-fade-in">
                <SectionErrorBoundary fallbackTitle="Class analytics failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <ClassAnalytics
                      isTeacher={role === "teacher"}
                      assignedClasses={assignedClasses}
                      assignedSubjects={assignedSubjects}
                      assignments={assignments}
                    />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

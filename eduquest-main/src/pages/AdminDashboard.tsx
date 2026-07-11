import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getAdminClient } from "@/integrations/supabase/adminClient";
import { onQuizComplete, onActivityComplete } from "@/lib/quizSyncBus";
import { Button } from "@/components/ui/button";
import {
  LogOut, Users, Target, BookOpen, HelpCircle,
  GraduationCap, TrendingUp, LayoutGrid, RefreshCw, Heart, Database, Trophy,
  Menu, X
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
const NMMSManager = lazy(() => import("@/components/admin/NMMSManager"));

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
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Group navigation tabs into categories
  const categories = [
    {
      id: "core",
      title: "Core",
      items: [{ value: "overview", label: "Overview", icon: LayoutGrid }]
    },
    {
      id: "academic",
      title: "Academic",
      items: [
        ...(role !== "teacher" ? [{ value: "subjects", label: "Subjects", icon: LayoutGrid }] : []),
        { value: "lessons", label: "Lessons", icon: BookOpen },
        { value: "quizzes", label: "Quizzes", icon: HelpCircle },
        ...(role !== "teacher" ? [{ value: "english_buddy", label: "English Buddy", icon: BookOpen }] : []),
        { value: "nmms", label: "NMMS Prep", icon: Trophy }
      ]
    },
    {
      id: "users",
      title: "Management",
      items: [
        { value: "students", label: "Students", icon: Users },
        ...(role !== "teacher" ? [
          { value: "teachers", label: "Teachers", icon: Users },
          { value: "leaderboard", label: "Leaderboard", icon: GraduationCap }
        ] : [])
      ]
    },
    {
      id: "insights",
      title: "Insights",
      items: [
        { value: "class_analytics", label: "Class Analytics", icon: TrendingUp },
        { value: "performance", label: "Performance", icon: Target },
        ...(role !== "teacher" ? [
          { value: "growth", label: "Growth", icon: TrendingUp },
          { value: "engagement", label: "Engagement", icon: Heart },
          { value: "analytics", label: "Analytics", icon: Target },
          { value: "content_health", label: "Content Health", icon: Database }
        ] : [])
      ]
    }
  ];

  const tabs = categories.flatMap((cat) => cat.items);

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between py-6 px-4 select-none">
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <GraduationCap className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-black text-foreground tracking-tight whitespace-nowrap">
              Edu-Quest
            </h1>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">
              {role === "teacher" ? "Teacher Portal" : "Admin Panel"}
            </p>
          </div>
        </div>

        {/* Categories & Links */}
        <div className="space-y-5 overflow-y-auto max-h-[calc(100vh-230px)] pr-1 scrollbar-thin">
          {categories.map((cat) => (
            <div key={cat.id} className="space-y-1">
              <span className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest px-2 block">
                {cat.title}
              </span>
              <div className="space-y-0.5">
                {cat.items.map((tab) => {
                  const isActive = activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setActiveTab(tab.value);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <tab.icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Footer */}
      <div className="border-t border-border/40 pt-4 mt-4 space-y-3">
        <div className="flex items-center gap-2.5 px-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-xs font-black text-white shrink-0">
            {profile?.full_name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="leading-tight min-w-0 flex-1">
            <p className="text-xs font-extrabold text-foreground truncate">
              {profile?.full_name || "Admin User"}
            </p>
            <p className="text-[9px] text-muted-foreground truncate uppercase font-bold tracking-wider">
              {role}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey(k => k + 1)}
            className="flex-1 rounded-xl h-8 text-[11px] font-bold"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="flex-1 rounded-xl h-8 text-[11px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-3 w-3 mr-1" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/10 flex text-foreground">
      {/* 1. Large Screen Docked Sidebar */}
      <aside className="w-64 border-r border-border/30 bg-card h-screen sticky top-0 hidden lg:flex flex-col shrink-0">
        {renderSidebarContent()}
      </aside>

      {/* 2. Mobile Responsive Drawer Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-card border-r border-border/30 flex flex-col h-full animate-slide-in-left">
            <button 
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* 3. Main Dashboard Frame */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-30 border-b border-border/30 bg-card/75 backdrop-blur-xl py-3 px-4 flex items-center justify-between lg:hidden">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <span className="font-extrabold text-sm tracking-tight">Edu-Quest Portal</span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRefreshKey(k => k + 1)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </header>

        {/* Page Main Content Area */}
        <main className="w-full flex-1 p-4 sm:p-6 md:p-8 lg:p-10 space-y-6">
          
          {/* Header Row on Large Screens */}
          <div className="hidden lg:flex items-center justify-between border-b border-border/20 pb-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">
                {tabs.find(t => t.value === activeTab)?.label || "Dashboard"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                {greeting}, {profile?.full_name?.split(" ")[0] || "Admin"} · {dateStr}
              </p>
            </div>
            
            {/* QuickActionsBar */}
            <div className="flex items-center gap-3">
              <QuickActionsBar
                schoolId={schoolId}
                onStudentAdded={() => setRefreshKey(k => k + 1)}
                onNavigate={handleNavigate}
                isTeacher={role === "teacher"}
              />
            </div>
          </div>

          {/* Quick Actions Row on Mobile Header */}
          <div className="flex lg:hidden bg-card/50 border border-border/30 p-2.5 rounded-2xl overflow-x-auto pb-1 scrollbar-none">
            <QuickActionsBar
              schoolId={schoolId}
              onStudentAdded={() => setRefreshKey(k => k + 1)}
              onNavigate={handleNavigate}
              isTeacher={role === "teacher"}
            />
          </div>

          {/* Tabs Container */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
            {/* Managed by the Sidebar button triggers */}
            <TabsList className="hidden">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>

            {/* ══ Overview Tab Content (Metrics + Grid overview) ══ */}
            <TabsContent value="overview" className="mt-0 space-y-6 outline-none">
              {/* Stats above the fold */}
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

              {/* Three card columns */}
              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
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
            </TabsContent>

            {/* Other Tabs content */}
            <div className={`${activeTab === "overview" ? "hidden" : "bg-card border border-border/30 rounded-2xl p-5 md:p-7 shadow-sm mt-0 min-h-[420px]"}`}>
              <TabsContent value="students" className="mt-0 animate-fade-in outline-none">
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
              <TabsContent value="performance" className="mt-0 animate-fade-in outline-none">
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
              <TabsContent value="growth" className="mt-0 animate-fade-in outline-none">
                <SectionErrorBoundary fallbackTitle="Growth tracker failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <StudentGrowthTracker />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="content_health" className="mt-0 animate-fade-in outline-none">
                <SectionErrorBoundary fallbackTitle="Content health tracker failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <ContentHealthTracker />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="leaderboard" className="mt-0 animate-fade-in outline-none">
                <SectionErrorBoundary fallbackTitle="Leaderboard failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <LeaderboardControls />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="subjects" className="mt-0 animate-fade-in outline-none">
                <SectionErrorBoundary fallbackTitle="Subject manager failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <SubjectManager />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="lessons" className="mt-0 animate-fade-in outline-none">
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
              <TabsContent value="quizzes" className="mt-0 animate-fade-in outline-none">
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
              <TabsContent value="engagement" className="mt-0 animate-fade-in outline-none">
                <SectionErrorBoundary fallbackTitle="Engagement analytics failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <EngagementDashboard />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="analytics" className="mt-0 animate-fade-in outline-none">
                <SectionErrorBoundary fallbackTitle="Analytics failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <SchoolAnalytics />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="english_buddy" className="mt-0 animate-fade-in outline-none">
                <SectionErrorBoundary fallbackTitle="English Buddy manager failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <EnglishBuddyManager />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="nmms" className="mt-0 animate-fade-in outline-none">
                <SectionErrorBoundary fallbackTitle="NMMS manager failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <NMMSManager />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="teachers" className="mt-0 animate-fade-in outline-none">
                <SectionErrorBoundary fallbackTitle="Teacher manager failed">
                  <Suspense fallback={<TabSkeleton />}>
                    <TeacherManager schoolId={schoolId} />
                  </Suspense>
                </SectionErrorBoundary>
              </TabsContent>
              <TabsContent value="class_analytics" className="mt-0 animate-fade-in outline-none">
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
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

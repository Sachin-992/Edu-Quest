import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import OfflineBanner from "@/components/OfflineBanner";
import PageSkeleton from "@/components/ui/PageSkeleton";
import "@/styles/performance.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { GameBackground } from "@/components/layout/GameBackground";
import ScrollToTop from "@/components/ScrollToTop";

/* ── Lazy-loaded pages (code-split per route) ── */
const Index = lazy(() => import("./pages/Index"));
const StudentLogin = lazy(() => import("./pages/StudentLogin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PlatformAdmin = lazy(() => import("./pages/PlatformAdmin"));
const SchoolRegister = lazy(() => import("./pages/SchoolRegister"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes cache stale time
      refetchOnWindowFocus: false, // Disable automatic reloading of data on tab focus
      retry: 2,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <GameBackground />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <BrowserRouter basename={import.meta.env.PROD ? "/quest" : undefined}>
          <ScrollToTop />
          <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<StudentLogin />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/quiz/:quizId"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <QuizPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "super_admin", "school_admin", "teacher"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/platform"
                  element={
                    <ProtectedRoute allowedRoles={["platform_admin"]}>
                      <PlatformAdmin />
                    </ProtectedRoute>
                  }
                />
                <Route path="/register" element={<SchoolRegister />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;


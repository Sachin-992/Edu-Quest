import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, loading, roleLoading } = useAuth();

  // Step 1: Still checking if a session exists at all
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Step 2: No session → redirect to home page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Step 3: Role still loading — show spinner if role is not yet loaded
  if (allowedRoles && roleLoading && !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Preparing dashboard...</p>
        </div>
      </div>
    );
  }

  // Step 4: Role loaded but doesn't match → redirect
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    if (role === "student") return <Navigate to="/dashboard" replace />;
    if (role === "admin" || role === "super_admin" || role === "school_admin" || role === "teacher") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  // Step 5: All good → render
  return <>{children}</>;
};

export default ProtectedRoute;

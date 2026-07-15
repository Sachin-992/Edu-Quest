import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, Flame, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface StudyTimeTrackerProps {
  refreshTrigger?: number;
}

const DAILY_GOAL_MINUTES = 30;

const StudyTimeTracker = ({ refreshTrigger }: StudyTimeTrackerProps) => {
  const { user } = useAuth();
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start session on mount
  useEffect(() => {
    if (!user) return;

    const startSession = async () => {
      const { data } = await supabase
        .from("study_sessions")
        .insert({ user_id: user.id, started_at: new Date().toISOString(), duration_seconds: 0 })
        .select("id")
        .single();

      if (data) setSessionId(data.id);
    };

    startSession();

    // Fetch historical data
    const fetchHistory = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const monday = new Date(today);
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("duration_seconds, started_at")
        .eq("user_id", user.id)
        .gte("started_at", monday.toISOString());

      if (sessions) {
        const todayStr = new Date().toDateString();
        let todaySecs = 0;
        let weekSecs = 0;
        sessions.forEach((s) => {
          weekSecs += s.duration_seconds || 0;
          if (new Date(s.started_at).toDateString() === todayStr) {
            todaySecs += s.duration_seconds || 0;
          }
        });
        setTodayMinutes(Math.floor(todaySecs / 60));
        setWeekMinutes(Math.floor(weekSecs / 60));
      }
    };

    fetchHistory();

    return () => {
      // End session on unmount
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);

  // Timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Save session periodically (every 30 seconds)
  const saveSession = useCallback(async () => {
    if (!sessionId || !user) return;
    await supabase
      .from("study_sessions")
      .update({ duration_seconds: sessionSeconds, ended_at: new Date().toISOString() })
      .eq("id", sessionId);
  }, [sessionId, sessionSeconds, user]);

  useEffect(() => {
    if (sessionSeconds > 0 && sessionSeconds % 30 === 0) {
      saveSession();
    }
  }, [sessionSeconds, saveSession]);

  // Also save on page unload
  useEffect(() => {
    const handleUnload = () => saveSession();
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [saveSession]);

  const totalTodayMinutes = todayMinutes + Math.floor(sessionSeconds / 60);
  const dailyProgress = Math.min((totalTodayMinutes / DAILY_GOAL_MINUTES) * 100, 100);
  const goalReached = totalTodayMinutes >= DAILY_GOAL_MINUTES;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 shadow-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-sm">Study Time</h3>
        <span className="ml-auto text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {formatTime(sessionSeconds)} ⏱
        </span>
      </div>

      {/* Daily progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Today</span>
          <span className="font-bold">
            {totalTodayMinutes} / {DAILY_GOAL_MINUTES} min
            {goalReached && " 🎉"}
          </span>
        </div>
        <Progress value={dailyProgress} className="h-2" />
      </div>

      {/* Stats row */}
      <div className="flex gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          <Target className="w-3.5 h-3.5 text-green-500" />
          <span className="text-muted-foreground">This week:</span>
          <span className="font-bold">{weekMinutes + Math.floor(sessionSeconds / 60)} min</span>
        </div>
        {goalReached && (
          <div className="flex items-center gap-1 text-xs">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="font-bold text-orange-600">Goal reached!</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StudyTimeTracker;

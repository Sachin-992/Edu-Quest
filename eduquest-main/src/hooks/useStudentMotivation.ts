import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MilestoneProgress {
  current_chapter: number;
  current_level: number;
  cumulative_xp: number;
  academic_rating: number;
  chapter_xp_earned: number;
  chapter_xp_required: number;
  knowledge_points: number;
  skill_stars: number;
  wisdom_points: number;
  scholar_points: number;
  coins: number;
  gems: number;
}

export function useStudentMotivation() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<MilestoneProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("student_milestone_progress")
        .select("*")
        .eq("student_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProgress(data);
      }
    } catch (err) {
      console.error("Error fetching motivation progress:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const updateProgress = async (updates: Partial<MilestoneProgress>) => {
    if (!user || !progress) return;
    try {
      const newProgress = { ...progress, ...updates };
      setProgress(newProgress);

      const { error } = await supabase
        .from("student_milestone_progress")
        .update(updates)
        .eq("student_id", user.id);

      if (error) throw error;
      
      // Dispatch custom wallet update event
      window.dispatchEvent(new Event("wallet_update"));
    } catch (err) {
      console.error("Error updating motivation progress:", err);
    }
  };

  const addXp = async (amount: number) => {
    if (!progress) return;
    const newXp = progress.cumulative_xp + amount;
    let level = progress.current_level;
    let requiredXp = level * 500;
    let chapterXp = progress.chapter_xp_earned + amount;
    
    while (chapterXp >= requiredXp) {
      chapterXp -= requiredXp;
      level += 1;
      requiredXp = level * 500;
      
      // Trigger level-up event
      window.dispatchEvent(new CustomEvent("eq_level_up", { detail: { level } }));
    }

    await updateProgress({
      cumulative_xp: newXp,
      current_level: level,
      chapter_xp_earned: chapterXp,
      chapter_xp_required: requiredXp
    });
  };

  const addRating = async (amount: number) => {
    if (!progress) return;
    const newRating = Math.max(100, progress.academic_rating + amount);
    await updateProgress({ academic_rating: newRating });
    
    // Trigger rating adjustment notification
    window.dispatchEvent(new CustomEvent("eq_rating_change", { detail: { rating: newRating, delta: amount } }));
  };

  return {
    progress,
    loading,
    refresh: fetchProgress,
    updateProgress,
    addXp,
    addRating
  };
}

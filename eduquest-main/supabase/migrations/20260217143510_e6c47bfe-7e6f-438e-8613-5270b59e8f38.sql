
-- Leaderboard settings (one row per school, using school_id as key)
CREATE TABLE public.leaderboard_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id),
  is_visible boolean NOT NULL DEFAULT true,
  mode text NOT NULL DEFAULT 'all_time', -- 'all_time' or 'weekly'
  show_most_improved boolean NOT NULL DEFAULT true,
  reward_most_improved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(school_id)
);

ALTER TABLE public.leaderboard_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage leaderboard settings"
ON public.leaderboard_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Students can view leaderboard settings"
ON public.leaderboard_settings FOR SELECT
USING (true);

CREATE TRIGGER update_leaderboard_settings_updated_at
BEFORE UPDATE ON public.leaderboard_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

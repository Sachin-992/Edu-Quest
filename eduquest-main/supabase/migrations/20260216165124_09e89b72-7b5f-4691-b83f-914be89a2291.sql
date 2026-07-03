
-- Adventure progress tracking table
CREATE TABLE public.adventure_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  world_id TEXT NOT NULL, -- 'forest_math', 'space_science', 'ocean_english', 'history_social'
  level_number INTEGER NOT NULL DEFAULT 1,
  stars_earned INTEGER NOT NULL DEFAULT 0, -- 0-3 stars per level
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_boss_level BOOLEAN NOT NULL DEFAULT false,
  score INTEGER DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, world_id, level_number)
);

-- Enable RLS
ALTER TABLE public.adventure_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own adventure progress"
ON public.adventure_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adventure progress"
ON public.adventure_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adventure progress"
ON public.adventure_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_adventure_progress_updated_at
BEFORE UPDATE ON public.adventure_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

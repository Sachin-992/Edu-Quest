-- ============================================================
-- SQL SCRIPT: UNIFIED DATABASE SCHEMA - PART 2
-- Run this script in the Supabase SQL Editor to deploy remaining tables
-- ============================================================

-- ── 1. CREATE PROGRESS & AVATAR TABLES ──

-- Student detailed progress mapping
CREATE TABLE IF NOT EXISTS public.student_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score INTEGER,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id),
  UNIQUE(user_id, quiz_id)
);
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- Leaderboard Settings
CREATE TABLE IF NOT EXISTS public.leaderboard_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  mode TEXT NOT NULL DEFAULT 'all_time',
  show_most_improved BOOLEAN NOT NULL DEFAULT true,
  reward_most_improved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id)
);
ALTER TABLE public.leaderboard_settings ENABLE ROW LEVEL SECURITY;

-- Avatar shop items
CREATE TABLE IF NOT EXISTS public.avatar_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'outfit',
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '👕',
  cost INTEGER NOT NULL DEFAULT 10,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.avatar_items ENABLE ROW LEVEL SECURITY;

-- Equipped/Owned avatar items
CREATE TABLE IF NOT EXISTS public.student_avatar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES public.avatar_items(id) ON DELETE CASCADE,
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);
ALTER TABLE public.student_avatar_items ENABLE ROW LEVEL SECURITY;


-- ── 2. SEED DEFAULT AVATAR SHOP ITEMS ──
INSERT INTO public.avatar_items (id, category, name, icon, cost, sort_order) VALUES
  ('school-uniform', 'school', 'School Uniform', '👔', 0, 1),
  ('sports-jersey', 'school', 'Sports Jersey', '🏃', 10, 2),
  ('lab-coat', 'school', 'Science Lab Coat', '🥼', 25, 3),
  ('art-smock', 'school', 'Artist Smock', '🎨', 15, 4),
  ('head-prefect', 'school', 'Head Prefect Badge', '🎖', 60, 5),
  ('graduation-gown', 'school', 'Graduation Gown', '🎓', 100, 6),
  ('orange-ninja', 'anime', 'Orange Ninja Set', '🍥', 120, 7),
  ('ninja-headband', 'anime', 'Ninja Headband', '🥷', 30, 8),
  ('pirate-captain', 'anime', 'Pirate King Captain', '🏴‍☠️', 200, 9),
  ('straw-hat', 'anime', 'Straw Adventure Hat', '👒', 80, 10),
  ('caped-hero', 'anime', 'Caped Hero Outfit', '🦲', 150, 11)
ON CONFLICT (id) DO NOTHING;


-- ── 3. ROW LEVEL SECURITY (RLS) POLICIES ──

-- Student Progress policies
DROP POLICY IF EXISTS "Students can view own progress" ON public.student_progress;
CREATE POLICY "Students can view own progress"
  ON public.student_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can insert own progress" ON public.student_progress;
CREATE POLICY "Students can insert own progress"
  ON public.student_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can update own progress" ON public.student_progress;
CREATE POLICY "Students can update own progress"
  ON public.student_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Leaderboard Settings policies
DROP POLICY IF EXISTS "Anyone can read leaderboard settings" ON public.leaderboard_settings;
CREATE POLICY "Anyone can read leaderboard settings"
  ON public.leaderboard_settings FOR SELECT TO authenticated
  USING (true);

-- Avatar items policies
DROP POLICY IF EXISTS "Anyone can view avatar items" ON public.avatar_items;
CREATE POLICY "Anyone can view avatar items"
  ON public.avatar_items FOR SELECT TO authenticated
  USING (true);

-- Student avatar items policies
DROP POLICY IF EXISTS "Users can view own avatar items" ON public.student_avatar_items;
CREATE POLICY "Users can view own avatar items"
  ON public.student_avatar_items FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own avatar items" ON public.student_avatar_items;
CREATE POLICY "Users can manage own avatar items"
  ON public.student_avatar_items FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

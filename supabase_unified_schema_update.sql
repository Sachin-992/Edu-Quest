-- ============================================================
-- SQL SCRIPT: UNIFIED DATABASE SCHEMA FOR EDUCORE + EDUQUEST
-- Run this script in the Supabase SQL Editor of the shared project
-- ============================================================

-- ── 1. CREATE CO-EXISTING CORE SCHOOLS TABLE ──
-- Schools table (from EduQuest) must exist first for foreign key references
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- ── 2. ALTER CORE ERP TABLES TO SUPPORT SCHOOL SCOPING ──
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

-- ── 3. MERGE SUBJECTS COLUMNS ──
-- Add EduQuest specific columns to the existing public.subjects table in EduCore
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS name_tamil TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '📚';
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'bg-primary';
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS class_level INTEGER;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create default Demo School if not exists
INSERT INTO public.schools (name, code)
VALUES ('Demo School', 'DEMO001')
ON CONFLICT (code) DO NOTHING;

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  max_students INTEGER NOT NULL,
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_tamil TEXT,
  content TEXT NOT NULL,
  content_tamil TEXT,
  estimated_minutes INTEGER DEFAULT 10,
  xp_reward INTEGER DEFAULT 25,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_tamil TEXT,
  description TEXT,
  description_tamil TEXT,
  time_limit_minutes INTEGER DEFAULT 15,
  passing_score INTEGER DEFAULT 50,
  xp_reward INTEGER DEFAULT 50,
  coins_reward INTEGER DEFAULT 10,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Quiz Questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_text_tamil TEXT,
  options TEXT[] NOT NULL,
  options_tamil TEXT[],
  correct_option_index INTEGER NOT NULL,
  explanation TEXT,
  explanation_tamil TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Student Milestone Progress
CREATE TABLE IF NOT EXISTS public.student_milestone_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  current_chapter INTEGER DEFAULT 1,
  current_level INTEGER DEFAULT 1,
  cumulative_xp INTEGER DEFAULT 0,
  academic_rating INTEGER DEFAULT 800,
  chapter_xp_earned INTEGER DEFAULT 0,
  chapter_xp_required INTEGER DEFAULT 500,
  knowledge_points INTEGER DEFAULT 0,
  skill_stars INTEGER DEFAULT 0,
  wisdom_points INTEGER DEFAULT 0,
  scholar_points INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  gems INTEGER DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.student_milestone_progress ENABLE ROW LEVEL SECURITY;

-- Adventure Progress
CREATE TABLE IF NOT EXISTS public.adventure_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  world_id TEXT NOT NULL,
  unlocked_chapters INTEGER DEFAULT 1,
  stars_earned INTEGER DEFAULT 0,
  completed_nodes TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, world_id)
);
ALTER TABLE public.adventure_progress ENABLE ROW LEVEL SECURITY;

-- Coin Transactions
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn_quiz', 'earn_lesson', 'earn_streak', 'spend_shop', 'spend_freeze', 'refund')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Study Sessions
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('lesson', 'quiz', 'game')),
  reference_id UUID,
  duration_seconds INTEGER DEFAULT 0,
  xp_gained INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Leaderboard Bans
CREATE TABLE IF NOT EXISTS public.leaderboard_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leaderboard_bans ENABLE ROW LEVEL SECURITY;


-- ── 3. CREATE UNIFIED COMPATIBILITY VIEWS ──
-- Clean up legacy tables before converting them to views
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- A. Profiles Compatibility View
-- Maps EduQuest profiles queries directly to EduCore users & students tables
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
  u.auth_id AS user_id,
  u.id AS core_user_id,
  s.school_id,
  u.name AS full_name,
  s.roll_no::text AS roll_number,
  c.grade_level AS class_level,
  s.avatar_url,
  (u.status = 'active') AS is_active,
  u.created_at,
  u.updated_at
FROM public.users u
LEFT JOIN public.students s ON s.user_id = u.id
LEFT JOIN public.classes c ON c.name = s.class;

-- Trigger Function to handle updating the profiles view (e.g., from the Avatar Shop)
CREATE OR REPLACE FUNCTION public.update_profiles_view_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_core_user_id UUID;
BEGIN
  -- Fetch the core user ID matching the auth user ID
  SELECT id INTO v_core_user_id FROM public.users WHERE auth_id = OLD.user_id;

  -- 1. Update Core User Details if name changed
  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    UPDATE public.users 
    SET name = NEW.full_name
    WHERE id = v_core_user_id;
  END IF;

  -- 2. Update Student Specific Details (like avatar configurations)
  UPDATE public.students
  SET 
    avatar_url = COALESCE(NEW.avatar_url, avatar_url),
    school_id = COALESCE(NEW.school_id, school_id)
  WHERE user_id = v_core_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_profiles
  INSTEAD OF UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profiles_view_trigger();


-- B. User Roles Compatibility View
-- Maps EduQuest user_roles queries directly to EduCore users table role column
CREATE OR REPLACE VIEW public.user_roles AS
SELECT 
  id AS id,
  auth_id AS user_id,
  role::text AS role
FROM public.users
WHERE auth_id IS NOT NULL;

-- Trigger Function to handle inserting roles into the user_roles view
CREATE OR REPLACE FUNCTION public.insert_user_roles_view_trigger()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET role = NEW.role::public.user_role
  WHERE auth_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_insert_user_roles
  INSTEAD OF INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.insert_user_roles_view_trigger();


-- ── 4. RLS POLICIES FOR UNIFIED VIEWS & TABLES ──

-- Allow read on progress
CREATE POLICY "Allow read on progress" ON public.student_milestone_progress
  FOR SELECT TO authenticated USING (true);

-- Allow students to select and manage milestone progress
CREATE POLICY "Students can manage own progress" ON public.student_milestone_progress
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can read all progress" ON public.student_milestone_progress
  FOR SELECT TO authenticated USING (true);

-- Allow students to manage adventure progress
CREATE POLICY "Students can manage own adventure" ON public.adventure_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow read on adventure progress
CREATE POLICY "Students can read all adventure" ON public.adventure_progress
  FOR SELECT TO authenticated USING (true);

-- Allow coin transactions
CREATE POLICY "Students can manage own transactions" ON public.coin_transactions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can read own transactions" ON public.coin_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Allow study sessions
CREATE POLICY "Students can insert own study sessions" ON public.study_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can read own study sessions" ON public.study_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

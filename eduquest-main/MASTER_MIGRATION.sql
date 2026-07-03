-- ============================================================
-- EDUQUEST — MASTER MIGRATION SCRIPT
-- New Supabase Project: oeaowgbycenftvhwonyb
-- Run this ENTIRE script in:
--   Supabase Dashboard → SQL Editor → New Query → Paste → Run
--
-- This script is idempotent (safe to run multiple times).
-- Sections are labeled. If a section fails, fix it and re-run
-- from that section only.
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- SECTION 1: EXTENSIONS
-- ══════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ══════════════════════════════════════════════════════════════
-- SECTION 2: CUSTOM ENUM
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('student', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'school_admin';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platform_admin';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ══════════════════════════════════════════════════════════════
-- SECTION 3: CORE TABLES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  plan_id UUID,
  subscription_status TEXT DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ DEFAULT now() + interval '30 days',
  billing_email TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  max_students INT NOT NULL,
  max_admins INT NOT NULL DEFAULT 2,
  ai_quiz_quota_monthly INT NOT NULL,
  price_inr_monthly INT NOT NULL DEFAULT 0,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.schools
  ADD CONSTRAINT schools_plan_id_fkey
  FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id)
  NOT VALID;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  roll_number TEXT,
  class_level INT CHECK (class_level >= 1 AND class_level <= 12),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, roll_number)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_tamil TEXT,
  description TEXT,
  icon TEXT DEFAULT '📚',
  color TEXT DEFAULT 'bg-primary',
  class_level INTEGER NOT NULL,
  school_id UUID REFERENCES public.schools(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_tamil TEXT,
  content TEXT,
  content_tamil TEXT,
  lesson_order INTEGER NOT NULL DEFAULT 0,
  lesson_type TEXT NOT NULL DEFAULT 'reading'
    CHECK (lesson_type IN ('reading', 'video', 'interactive', 'game')),
  xp_reward INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_tamil TEXT,
  quiz_type TEXT NOT NULL DEFAULT 'mcq'
    CHECK (quiz_type IN ('mcq', 'true_false', 'fill_blank', 'match', 'mixed')),
  xp_reward INTEGER NOT NULL DEFAULT 20,
  passing_score INTEGER NOT NULL DEFAULT 70,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_text_tamil TEXT,
  question_type TEXT NOT NULL DEFAULT 'mcq'
    CHECK (question_type IN ('mcq', 'true_false', 'fill_blank')),
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  explanation_tamil TEXT,
  question_order INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 10,
  difficulty TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.student_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  school_id UUID REFERENCES public.schools(id),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score INTEGER,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id),
  UNIQUE(user_id, quiz_id)
);
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.adventure_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  school_id UUID REFERENCES public.schools(id),
  world_id TEXT NOT NULL,
  level_number INTEGER NOT NULL DEFAULT 1,
  stars_earned INTEGER NOT NULL DEFAULT 0,
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_boss_level BOOLEAN NOT NULL DEFAULT false,
  score INTEGER DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, world_id, level_number)
);
ALTER TABLE public.adventure_progress ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.leaderboard_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id),
  is_visible boolean NOT NULL DEFAULT true,
  mode text NOT NULL DEFAULT 'all_time',
  show_most_improved boolean NOT NULL DEFAULT true,
  reward_most_improved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id)
);
ALTER TABLE public.leaderboard_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.leaderboard_bans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id),
  user_id uuid NOT NULL,
  banned_by uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leaderboard_bans ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.avatar_items (
  id text PRIMARY KEY,
  category text NOT NULL DEFAULT 'outfit',
  name text NOT NULL,
  icon text NOT NULL DEFAULT '👕',
  cost integer NOT NULL DEFAULT 10,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.avatar_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.student_avatar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id text NOT NULL REFERENCES public.avatar_items(id) ON DELETE CASCADE,
  is_equipped boolean NOT NULL DEFAULT false,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);
ALTER TABLE public.student_avatar_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  school_id uuid REFERENCES public.schools(id),
  amount integer NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  school_id uuid REFERENCES public.schools(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  school_id uuid REFERENCES public.schools(id),
  subject_id uuid REFERENCES public.subjects(id),
  class_level integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════════
-- SECTION 4: FOREIGN KEY CONSTRAINTS
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER TABLE public.student_progress
    ADD CONSTRAINT fk_student_progress_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.adventure_progress
    ADD CONSTRAINT fk_adventure_progress_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.coin_transactions
    ADD CONSTRAINT fk_coin_transactions_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.study_sessions
    ADD CONSTRAINT fk_study_sessions_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.student_avatar_items
    ADD CONSTRAINT fk_student_avatar_items_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ══════════════════════════════════════════════════════════════
-- SECTION 5: HELPER FUNCTIONS
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_admin')
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
    OR has_role(auth.uid(), 'school_admin')
$$;

CREATE OR REPLACE FUNCTION public.get_school_ai_usage(_school_id UUID)
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::INT, 0)
  FROM public.ai_usage
  WHERE school_id = _school_id
    AND created_at >= date_trunc('month', now())
$$;

CREATE OR REPLACE FUNCTION public.get_school_ai_quota(_school_id UUID)
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(sp.ai_quiz_quota_monthly, 20)
  FROM public.schools s
  LEFT JOIN public.subscription_plans sp ON sp.id = s.plan_id
  WHERE s.id = _school_id
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM public.audit_log WHERE created_at < now() - interval '90 days';
$$;

CREATE OR REPLACE FUNCTION public.refresh_school_analytics()
RETURNS void LANGUAGE sql AS $$
  REFRESH MATERIALIZED VIEW public.school_analytics;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.auto_fill_school_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.school_id IS NULL THEN
    SELECT school_id INTO NEW.school_id FROM public.profiles WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User')
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;


-- ══════════════════════════════════════════════════════════════
-- SECTION 6: TRIGGERS
-- ══════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_schools_updated_at ON public.schools;
CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subjects_updated_at ON public.subjects;
CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lessons_updated_at ON public.lessons;
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_progress_updated_at ON public.student_progress;
CREATE TRIGGER update_student_progress_updated_at
  BEFORE UPDATE ON public.student_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_adventure_progress_updated_at ON public.adventure_progress;
CREATE TRIGGER update_adventure_progress_updated_at
  BEFORE UPDATE ON public.adventure_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_leaderboard_settings_updated_at ON public.leaderboard_settings;
CREATE TRIGGER update_leaderboard_settings_updated_at
  BEFORE UPDATE ON public.leaderboard_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_student_progress_school_id ON public.student_progress;
CREATE TRIGGER trg_student_progress_school_id
  BEFORE INSERT OR UPDATE ON public.student_progress
  FOR EACH ROW EXECUTE FUNCTION public.auto_fill_school_id();

DROP TRIGGER IF EXISTS trg_adventure_progress_school_id ON public.adventure_progress;
CREATE TRIGGER trg_adventure_progress_school_id
  BEFORE INSERT OR UPDATE ON public.adventure_progress
  FOR EACH ROW EXECUTE FUNCTION public.auto_fill_school_id();

DROP TRIGGER IF EXISTS trg_coin_transactions_school_id ON public.coin_transactions;
CREATE TRIGGER trg_coin_transactions_school_id
  BEFORE INSERT OR UPDATE ON public.coin_transactions
  FOR EACH ROW EXECUTE FUNCTION public.auto_fill_school_id();

DROP TRIGGER IF EXISTS trg_study_sessions_school_id ON public.study_sessions;
CREATE TRIGGER trg_study_sessions_school_id
  BEFORE INSERT OR UPDATE ON public.study_sessions
  FOR EACH ROW EXECUTE FUNCTION public.auto_fill_school_id();


-- ══════════════════════════════════════════════════════════════
-- SECTION 7: INDEXES
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_student_progress_user_id ON public.student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_school ON public.student_progress(school_id);
CREATE INDEX IF NOT EXISTS idx_adventure_progress_user_id ON public.adventure_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_adventure_progress_school ON public.adventure_progress(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_active ON public.profiles(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_roll_number ON public.profiles(roll_number);
CREATE INDEX IF NOT EXISTS idx_subjects_school ON public.subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_active ON public.subjects(class_level, is_active);
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON public.lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_school_time ON public.audit_log(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_ai_usage_school_month ON public.ai_usage(school_id, created_at);


-- ══════════════════════════════════════════════════════════════
-- SECTION 8: RLS POLICIES
-- ══════════════════════════════════════════════════════════════

-- ── schools ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can view schools" ON public.schools;
CREATE POLICY "Authenticated users can view schools"
  ON public.schools FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage schools" ON public.schools;
CREATE POLICY "Admins can manage schools"
  ON public.schools FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'school_admin'));

DROP POLICY IF EXISTS "Teachers can view own school" ON public.schools;
CREATE POLICY "Teachers can view own school"
  ON public.schools FOR SELECT TO authenticated
  USING (
    id = get_user_school_id(auth.uid())
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
    OR has_role(auth.uid(), 'school_admin')
  );

-- ── profiles ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Tenant-scoped profiles admin read" ON public.profiles;
CREATE POLICY "Tenant-scoped profiles admin read"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      school_id = get_user_school_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'school_admin'))
    )
    OR is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Teachers can view school profiles" ON public.profiles;
CREATE POLICY "Teachers can view school profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'teacher'))
  );

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT USING (public.is_admin());

-- ── user_roles ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'platform_admin'));

DROP POLICY IF EXISTS "Admins can read all user_roles" ON public.user_roles;
CREATE POLICY "Admins can read all user_roles"
  ON public.user_roles FOR SELECT USING (public.is_admin());

-- ── subjects ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Students can view active subjects for their class" ON public.subjects;
CREATE POLICY "Students can view active subjects for their class"
  ON public.subjects FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Tenant-scoped subjects admin" ON public.subjects;
CREATE POLICY "Tenant-scoped subjects admin"
  ON public.subjects FOR ALL TO authenticated
  USING (
    (school_id = get_user_school_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'school_admin')))
    OR school_id IS NULL
    OR is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Teachers can view subjects" ON public.subjects;
CREATE POLICY "Teachers can view subjects"
  ON public.subjects FOR SELECT TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) OR school_id IS NULL);

DROP POLICY IF EXISTS "Admins can read all subjects" ON public.subjects;
CREATE POLICY "Admins can read all subjects"
  ON public.subjects FOR SELECT USING (public.is_admin());

-- ── lessons ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Students can view active lessons" ON public.lessons;
CREATE POLICY "Students can view active lessons"
  ON public.lessons FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Teachers can view lessons" ON public.lessons;
CREATE POLICY "Teachers can view lessons"
  ON public.lessons FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Teachers can manage lessons" ON public.lessons;
CREATE POLICY "Teachers can manage lessons"
  ON public.lessons FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
    OR has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'teacher')
  );

DROP POLICY IF EXISTS "Admins can read all lessons" ON public.lessons;
CREATE POLICY "Admins can read all lessons"
  ON public.lessons FOR SELECT USING (public.is_admin());

-- ── quizzes ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Students can view active quizzes" ON public.quizzes;
CREATE POLICY "Students can view active quizzes"
  ON public.quizzes FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Teachers can view quizzes" ON public.quizzes;
CREATE POLICY "Teachers can view quizzes"
  ON public.quizzes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Teachers can manage quizzes" ON public.quizzes;
CREATE POLICY "Teachers can manage quizzes"
  ON public.quizzes FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
    OR has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'teacher')
  );

DROP POLICY IF EXISTS "Admins can read all quizzes" ON public.quizzes;
CREATE POLICY "Admins can read all quizzes"
  ON public.quizzes FOR SELECT USING (public.is_admin());

-- ── quiz_questions ────────────────────────────────────────────
DROP POLICY IF EXISTS "Students can view quiz questions" ON public.quiz_questions;
CREATE POLICY "Students can view quiz questions"
  ON public.quiz_questions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Teachers can manage quiz questions" ON public.quiz_questions;
CREATE POLICY "Teachers can manage quiz questions"
  ON public.quiz_questions FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
    OR has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'teacher')
  );

DROP POLICY IF EXISTS "Admins can read all quiz_questions" ON public.quiz_questions;
CREATE POLICY "Admins can read all quiz_questions"
  ON public.quiz_questions FOR SELECT USING (public.is_admin());

-- ── student_progress ──────────────────────────────────────────
DROP POLICY IF EXISTS "student_progress_select_own" ON public.student_progress;
CREATE POLICY "student_progress_select_own"
  ON public.student_progress FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "student_progress_insert_own" ON public.student_progress;
CREATE POLICY "student_progress_insert_own"
  ON public.student_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "student_progress_update_own" ON public.student_progress;
CREATE POLICY "student_progress_update_own"
  ON public.student_progress FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "student_progress_select_admin" ON public.student_progress;
CREATE POLICY "student_progress_select_admin"
  ON public.student_progress FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
    OR has_role(auth.uid(), 'school_admin') OR is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Teachers can view school progress" ON public.student_progress;
CREATE POLICY "Teachers can view school progress"
  ON public.student_progress FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'teacher'))
  );

DROP POLICY IF EXISTS "Admins can read all student_progress" ON public.student_progress;
CREATE POLICY "Admins can read all student_progress"
  ON public.student_progress FOR SELECT USING (public.is_admin());

-- ── adventure_progress ────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert their own adventure progress" ON public.adventure_progress;
CREATE POLICY "Users can insert their own adventure progress"
  ON public.adventure_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own adventure progress" ON public.adventure_progress;
CREATE POLICY "Users can update their own adventure progress"
  ON public.adventure_progress FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Tenant-scoped adventure read" ON public.adventure_progress;
CREATE POLICY "Tenant-scoped adventure read"
  ON public.adventure_progress FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (school_id = get_user_school_id(auth.uid())
        AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'school_admin')))
    OR is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Teachers can view school adventure progress" ON public.adventure_progress;
CREATE POLICY "Teachers can view school adventure progress"
  ON public.adventure_progress FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'teacher'))
  );

DROP POLICY IF EXISTS "Admins can read all adventure_progress" ON public.adventure_progress;
CREATE POLICY "Admins can read all adventure_progress"
  ON public.adventure_progress FOR SELECT USING (public.is_admin());

-- ── leaderboard_settings ──────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage leaderboard settings" ON public.leaderboard_settings;
CREATE POLICY "Admins can manage leaderboard settings"
  ON public.leaderboard_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Students can view leaderboard settings" ON public.leaderboard_settings;
CREATE POLICY "Students can view leaderboard settings"
  ON public.leaderboard_settings FOR SELECT USING (true);

-- ── leaderboard_bans ──────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage leaderboard_bans" ON public.leaderboard_bans;
CREATE POLICY "Admins can manage leaderboard_bans"
  ON public.leaderboard_bans FOR ALL USING (public.is_admin());

-- ── avatar_items ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view avatar items" ON public.avatar_items;
CREATE POLICY "Anyone can view avatar items"
  ON public.avatar_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage avatar items" ON public.avatar_items;
CREATE POLICY "Admins can manage avatar items"
  ON public.avatar_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- ── student_avatar_items ─────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own avatar items" ON public.student_avatar_items;
CREATE POLICY "Users can view own avatar items"
  ON public.student_avatar_items FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own avatar items" ON public.student_avatar_items;
CREATE POLICY "Users can insert own avatar items"
  ON public.student_avatar_items FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own avatar items" ON public.student_avatar_items;
CREATE POLICY "Users can update own avatar items"
  ON public.student_avatar_items FOR UPDATE USING (auth.uid() = user_id);

-- ── coin_transactions ─────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own transactions" ON public.coin_transactions;
CREATE POLICY "Users can view own transactions"
  ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.coin_transactions;
CREATE POLICY "Users can insert own transactions"
  ON public.coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Tenant-scoped coin read" ON public.coin_transactions;
CREATE POLICY "Tenant-scoped coin read"
  ON public.coin_transactions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (school_id = get_user_school_id(auth.uid())
        AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')))
    OR is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can read all coin_transactions" ON public.coin_transactions;
CREATE POLICY "Admins can read all coin_transactions"
  ON public.coin_transactions FOR SELECT USING (public.is_admin());

-- ── study_sessions ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own sessions" ON public.study_sessions;
CREATE POLICY "Users can view own sessions"
  ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.study_sessions;
CREATE POLICY "Users can insert own sessions"
  ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON public.study_sessions;
CREATE POLICY "Users can update own sessions"
  ON public.study_sessions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Tenant-scoped study read" ON public.study_sessions;
CREATE POLICY "Tenant-scoped study read"
  ON public.study_sessions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (school_id = get_user_school_id(auth.uid())
        AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')))
    OR is_platform_admin(auth.uid())
  );

-- ── teacher_assignments ───────────────────────────────────────
DROP POLICY IF EXISTS "Admins can read all teacher_assignments" ON public.teacher_assignments;
CREATE POLICY "Admins can read all teacher_assignments"
  ON public.teacher_assignments FOR SELECT USING (public.is_admin());

-- ── audit_log ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view own school audit" ON public.audit_log;
CREATE POLICY "Admins can view own school audit"
  ON public.audit_log FOR SELECT TO authenticated
  USING (
    (school_id = get_user_school_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'school_admin')))
    OR is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Service can insert audit" ON public.audit_log;
CREATE POLICY "Service can insert audit"
  ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read audit_log" ON public.audit_log;
CREATE POLICY "Admins can read audit_log"
  ON public.audit_log FOR SELECT USING (public.is_admin());

-- ── subscription_plans ────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view plans"
  ON public.subscription_plans FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Platform admin can manage plans" ON public.subscription_plans;
CREATE POLICY "Platform admin can manage plans"
  ON public.subscription_plans FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can read subscription_plans" ON public.subscription_plans;
CREATE POLICY "Admins can read subscription_plans"
  ON public.subscription_plans FOR SELECT USING (public.is_admin());

-- ── ai_usage ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view own school AI usage" ON public.ai_usage;
CREATE POLICY "Admins can view own school AI usage"
  ON public.ai_usage FOR SELECT TO authenticated
  USING (
    (school_id = get_user_school_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'school_admin')))
    OR is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Service can insert AI usage" ON public.ai_usage;
CREATE POLICY "Service can insert AI usage"
  ON public.ai_usage FOR INSERT TO authenticated WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 9: MATERIALIZED VIEW
-- ══════════════════════════════════════════════════════════════

DROP MATERIALIZED VIEW IF EXISTS public.school_analytics;
CREATE MATERIALIZED VIEW public.school_analytics AS
SELECT
  p.school_id,
  COUNT(DISTINCT p.user_id) AS total_students,
  COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'completed' AND sp.lesson_id IS NOT NULL) AS lessons_completed,
  COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'completed' AND sp.quiz_id IS NOT NULL) AS quizzes_completed,
  ROUND(AVG(sp.score) FILTER (WHERE sp.quiz_id IS NOT NULL), 1) AS avg_quiz_score,
  COALESCE(SUM(sp.xp_earned), 0) AS total_xp_earned,
  COUNT(DISTINCT sp.user_id) FILTER (WHERE sp.updated_at > now() - interval '7 days') AS active_7d,
  COUNT(DISTINCT sp.user_id) FILTER (WHERE sp.updated_at > now() - interval '30 days') AS active_30d
FROM public.profiles p
LEFT JOIN public.student_progress sp ON sp.user_id = p.user_id
WHERE p.school_id IS NOT NULL
GROUP BY p.school_id;


-- ══════════════════════════════════════════════════════════════
-- SECTION 10: SEED DATA
-- ══════════════════════════════════════════════════════════════

-- Subscription plans
INSERT INTO public.subscription_plans (name, max_students, max_admins, ai_quiz_quota_monthly, price_inr_monthly, features)
VALUES
  ('Free',       50,   1,   20,      0, '{"support": "community", "analytics": "basic"}'),
  ('Basic',      200,  3,   100,   999, '{"support": "email", "analytics": "standard", "bulk_import": true}'),
  ('Premium',    1000, 10,  500,  2999, '{"support": "priority", "analytics": "advanced", "bulk_import": true, "ai_quiz": true, "custom_branding": true}'),
  ('Enterprise', -1,   -1,  -1,      0, '{"support": "dedicated", "analytics": "enterprise", "custom": true}')
ON CONFLICT (name) DO NOTHING;

-- Demo school
INSERT INTO public.schools (name, code, plan_id, subscription_status)
SELECT
  'Demo School', 'DEMO001',
  (SELECT id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1),
  'active'
WHERE NOT EXISTS (SELECT 1 FROM public.schools WHERE code = 'DEMO001');

-- Avatar items
INSERT INTO public.avatar_items (id, category, name, icon, cost, sort_order) VALUES
  ('school-uniform','school','School Uniform','👔',0,1),
  ('sports-jersey','school','Sports Jersey','🏃',10,2),
  ('lab-coat','school','Science Lab Coat','🥼',25,3),
  ('art-smock','school','Artist Smock','🎨',15,4),
  ('head-prefect','school','Head Prefect Badge','🎖',60,5),
  ('graduation-gown','school','Graduation Gown','🎓',100,6),
  ('orange-ninja','anime','Orange Ninja Set','🍥',120,7),
  ('ninja-headband','anime','Ninja Headband','🥷',30,8),
  ('pirate-captain','anime','Pirate King Captain','🏴‍☠️',200,9),
  ('straw-hat','anime','Straw Adventure Hat','👒',80,10),
  ('caped-hero','anime','Caped Hero Outfit','🦲',150,11),
  ('dragon-warrior','anime','Dragon Warrior Armor','🐉',140,12),
  ('shadow-slayer','anime','Shadow Slayer Cloak','⚔️',90,13),
  ('titan-scout','anime','Titan Scout Uniform','🛡️',85,14),
  ('spirit-samurai','anime','Spirit Samurai Set','🗡️',180,15),
  ('moon-sailor','anime','Moon Guardian Outfit','🌙',130,16),
  ('crystal-mage','anime','Crystal Mage Robe','🔮',75,17),
  ('spider-hero','superhero','Spider Hero Suit','🕷️',130,18),
  ('dark-bat','superhero','Dark Bat Armor','🦇',140,19),
  ('thunder-god','superhero','Thunder God Cape','⚡',180,20),
  ('iron-tech','superhero','Iron Tech Armor','🤖',160,21),
  ('shield-captain','superhero','Shield Captain Suit','🛡️',95,22),
  ('wonder-warrior','superhero','Wonder Warrior Armor','👸',130,23),
  ('speed-flash','superhero','Speed Flash Suit','💨',85,24),
  ('green-archer','superhero','Forest Archer Hood','🏹',50,25),
  ('wizard-school','fantasy','Wizard School Outfit','🧙',120,26),
  ('wizard-hat','fantasy','Sorting Wizard Hat','🎩',70,27),
  ('elf-ranger','fantasy','Elf Ranger Cloak','🧝',80,28),
  ('dragon-rider','fantasy','Dragon Rider Armor','🐲',200,29),
  ('fairy-wings','fantasy','Sparkle Fairy Wings','🧚',110,30),
  ('knight-armor','fantasy','Royal Knight Armor','⚔️',90,31),
  ('ice-queen','fantasy','Ice Queen Gown','❄️',130,32),
  ('dark-mage','fantasy','Dark Mage Robes','🌑',75,33),
  ('explorer-hat','adventure','Explorer Archaeologist','🤠',70,34),
  ('secret-agent','adventure','Secret Agent Tuxedo','🕶️',110,35),
  ('kung-fu','adventure','Kung Fu Master Outfit','🥋',80,36),
  ('masked-heist','adventure','Masked Heist Suit','🎭',120,37),
  ('space-explorer','adventure','Space Explorer Suit','🚀',85,38),
  ('jungle-safari','adventure','Jungle Safari Outfit','🌿',40,39),
  ('deep-sea-diver','adventure','Deep Sea Diver','🤿',75,40),
  ('dino-costume','funny','Dino Costume','🦕',35,41),
  ('robot-suit','funny','Robot Explorer','🤖',40,42),
  ('banana-suit','funny','Banana Suit','🍌',20,43),
  ('pizza-hat','funny','Pizza Party Hat','🍕',15,44),
  ('penguin-suit','funny','Penguin Tuxedo','🐧',30,45),
  ('ufo-alien','funny','UFO Alien Suit','👽',65,46),
  ('cat-onesie','funny','Cat Onesie','🐱',35,47),
  ('panda-hoodie','funny','Panda Hoodie','🐼',30,48),
  ('casual-cool','outfit','Casual Cool','😎',10,49),
  ('royal-prince','outfit','Royal Prince','🤴',80,50),
  ('royal-princess','outfit','Royal Princess','👸',80,51),
  ('rock-star','outfit','Rock Star Outfit','🎸',45,52),
  ('hip-hop','outfit','Hip Hop Style','🎤',40,53),
  ('beach-vibes','outfit','Beach Vibes','🏖️',20,54),
  ('winter-cozy','outfit','Winter Cozy','🧥',15,55),
  ('reading-glasses','accessory','Reading Glasses','🤓',10,56),
  ('cool-shades','accessory','Cool Shades','😎',15,57),
  ('magic-wand','accessory','Magic Wand','🪄',35,58),
  ('pet-dragon','accessory','Pet Dragon','🐉',100,59),
  ('golden-trophy','accessory','Golden Trophy','🏆',75,60),
  ('angel-wings','accessory','Angel Wings','👼',120,61),
  ('katana-blade','accessory','Katana Blade','⚔️',70,62),
  ('shield-guard','accessory','Guardian Shield','🛡️',45,63),
  ('treasure-map','accessory','Treasure Map','🗺️',30,64),
  ('boombox','accessory','Boombox','📻',40,65),
  ('classic-hair','hairstyle','Classic','💇',0,66),
  ('spiky-hair','hairstyle','Spiky Power','⚡',20,67),
  ('rainbow-hair','hairstyle','Rainbow Burst','🌈',50,68),
  ('crown-braid','hairstyle','Crown Braid','👸',30,69),
  ('flame-hair','hairstyle','Flame Hair','🔥',90,70),
  ('galaxy-hair','hairstyle','Galaxy Waves','🌌',60,71),
  ('ninja-hair','hairstyle','Ninja Spikes','🍃',35,72),
  ('afro-power','hairstyle','Afro Power','✊',25,73)
ON CONFLICT (id) DO UPDATE
  SET category=EXCLUDED.category, name=EXCLUDED.name,
      icon=EXCLUDED.icon, cost=EXCLUDED.cost, sort_order=EXCLUDED.sort_order;

-- Sample subjects for Class 7 (global)
INSERT INTO public.subjects (name, name_tamil, description, icon, color, class_level, sort_order)
SELECT v.name, v.name_tamil, v.description, v.icon, v.color, v.class_level, v.sort_order
FROM (VALUES
  ('Mathematics','கணிதம்','Numbers, algebra, geometry and more','🔢','bg-edu-blue',7,1),
  ('Science','அறிவியல்','Physics, chemistry and biology','🔬','bg-edu-green',7,2),
  ('Tamil','தமிழ்','Tamil language, literature and grammar','📝','bg-tamil-gold',7,3),
  ('English','ஆங்கிலம்','English language and literature','📖','bg-edu-purple',7,4),
  ('Social Science','சமூக அறிவியல்','History, geography and civics','🌍','bg-edu-orange',7,5)
) AS v(name, name_tamil, description, icon, color, class_level, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.subjects WHERE class_level = 7 AND school_id IS NULL LIMIT 1
);


-- ══════════════════════════════════════════════════════════════
-- SECTION 11: ADMIN USER SETUP
-- ⚠️  Run this AFTER creating the admin in:
--     Supabase Dashboard → Authentication → Users → Add User
--     Email: balanperiyasamy21@gmail.com
--     ✅ Check "Auto Confirm User"
-- ══════════════════════════════════════════════════════════════

DO $$
DECLARE
  admin_uid UUID;
  demo_school_id UUID;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'balanperiyasamy21@gmail.com';
  SELECT id INTO demo_school_id FROM public.schools WHERE code = 'DEMO001' LIMIT 1;

  IF admin_uid IS NULL THEN
    RAISE NOTICE '⚠️  Admin user not found. Create it in Auth dashboard first, then re-run Section 11.';
  ELSE
    -- Remove auto-assigned student role
    DELETE FROM public.user_roles WHERE user_id = admin_uid AND role = 'student';

    -- Assign super_admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_uid, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Ensure profile linked to demo school
    INSERT INTO public.profiles (user_id, full_name, school_id)
    VALUES (admin_uid, 'Admin', demo_school_id)
    ON CONFLICT (user_id) DO UPDATE
      SET full_name = 'Admin', school_id = demo_school_id;

    RAISE NOTICE '✅ Admin setup complete! user_id=%, role=super_admin', admin_uid;
  END IF;
END $$;


-- ══════════════════════════════════════════════════════════════
-- SECTION 12: VERIFICATION
-- ══════════════════════════════════════════════════════════════

SELECT '✅ MASTER MIGRATION COMPLETE' AS status;

SELECT
  (SELECT COUNT(*) FROM public.schools)            AS schools,
  (SELECT COUNT(*) FROM public.subscription_plans) AS plans,
  (SELECT COUNT(*) FROM public.subjects)            AS subjects,
  (SELECT COUNT(*) FROM public.avatar_items)        AS avatar_items,
  (SELECT COUNT(*) FROM public.profiles)            AS profiles,
  (SELECT COUNT(*) FROM public.user_roles)          AS user_roles;

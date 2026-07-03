-- ============================================================
-- Admin RLS Policies Migration
-- ============================================================
-- This migration adds RLS policies that allow users with
-- admin / super_admin / school_admin roles to read data
-- that was previously accessed via the service-role key.
--
-- PREREQUISITE: The has_role() function must already exist:
--   has_role(_user_id uuid, _role text) RETURNS boolean
-- ============================================================

-- Helper: check if the current user is any kind of admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
    OR has_role(auth.uid(), 'school_admin')
$$;

-- ─── profiles ────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all profiles' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Admins can read all profiles"
      ON public.profiles FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ─── student_progress ────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all student_progress' AND tablename = 'student_progress'
  ) THEN
    CREATE POLICY "Admins can read all student_progress"
      ON public.student_progress FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ─── quizzes ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all quizzes' AND tablename = 'quizzes'
  ) THEN
    CREATE POLICY "Admins can read all quizzes"
      ON public.quizzes FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ─── quiz_questions ──────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all quiz_questions' AND tablename = 'quiz_questions'
  ) THEN
    CREATE POLICY "Admins can read all quiz_questions"
      ON public.quiz_questions FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ─── lessons ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all lessons' AND tablename = 'lessons'
  ) THEN
    CREATE POLICY "Admins can read all lessons"
      ON public.lessons FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ─── subjects ────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all subjects' AND tablename = 'subjects'
  ) THEN
    CREATE POLICY "Admins can read all subjects"
      ON public.subjects FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ─── adventure_progress ──────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all adventure_progress' AND tablename = 'adventure_progress'
  ) THEN
    CREATE POLICY "Admins can read all adventure_progress"
      ON public.adventure_progress FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ─── schools ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all schools' AND tablename = 'schools'
  ) THEN
    CREATE POLICY "Admins can read all schools"
      ON public.schools FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ─── user_roles ──────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all user_roles' AND tablename = 'user_roles'
  ) THEN
    CREATE POLICY "Admins can read all user_roles"
      ON public.user_roles FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ─── coin_transactions ──────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all coin_transactions' AND tablename = 'coin_transactions'
  ) THEN
    CREATE POLICY "Admins can read all coin_transactions"
      ON public.coin_transactions FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ─── leaderboard_bans ────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage leaderboard_bans' AND tablename = 'leaderboard_bans'
  ) THEN
    CREATE POLICY "Admins can manage leaderboard_bans"
      ON public.leaderboard_bans FOR ALL
      USING (public.is_admin());
  END IF;
END $$;

-- ─── teacher_assignments ────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all teacher_assignments' AND tablename = 'teacher_assignments'
  ) THEN
    CREATE POLICY "Admins can read all teacher_assignments"
      ON public.teacher_assignments FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ─── subscription_plans ──────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read subscription_plans' AND tablename = 'subscription_plans'
  ) THEN
    CREATE POLICY "Admins can read subscription_plans"
      ON public.subscription_plans FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ─── audit_log ───────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read audit_log' AND tablename = 'audit_log'
  ) THEN
    CREATE POLICY "Admins can read audit_log"
      ON public.audit_log FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ============================================================
-- FIX: Student progress RLS policies
-- Run this in Supabase SQL Editor → SQL tab
-- This ensures students CAN insert/update their own progress
-- ============================================================

-- 1. Ensure helper functions exist (required by tenant-scoped policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
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

-- 2. Drop ALL existing student_progress policies (clean slate)
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'student_progress' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.student_progress', pol.policyname);
  END LOOP;
END $$;

-- 3. Re-create simple, working policies
-- Students can SELECT their own progress
CREATE POLICY "student_progress_select_own"
  ON public.student_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can SELECT all progress (for dashboard)
CREATE POLICY "student_progress_select_admin"
  ON public.student_progress FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

-- Students can INSERT their own progress
CREATE POLICY "student_progress_insert_own"
  ON public.student_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Students can UPDATE their own progress
CREATE POLICY "student_progress_update_own"
  ON public.student_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- 4. Ensure RLS is enabled (safety check)
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- 5. Verify: show current policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'student_progress' AND schemaname = 'public'
ORDER BY policyname;

-- 6. Verify: check if dhoni has any progress rows
SELECT sp.*, p.full_name
FROM public.student_progress sp
JOIN public.profiles p ON p.user_id = sp.user_id
ORDER BY sp.completed_at DESC
LIMIT 20;

-- 7. Check student_progress table columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'student_progress' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================
-- SQL SCRIPT: UNIFIED DATABASE SCHEMA - PART 3 (HOTFIXES)
-- Run this script in the Supabase SQL Editor to fix signup & dashboard errors
-- ============================================================

-- ── 1. FIX CLASSES TABLE MISMATCH ──
-- The classes table must have a section column to support legacy queries.
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Re-apply UNIQUE constraint for name, grade_level and section
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_name_grade_key;
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_name_grade_section_key;
DO $$ BEGIN
    ALTER TABLE public.classes ADD CONSTRAINT classes_name_grade_section_key UNIQUE (name, grade_level, section);
EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- ── 2. FIX AUDIT LOGS COLUMN MISMATCH ──
-- Reconcile the audit_logs table columns to prevent PGRST204 errors.
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_email TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE public.audit_logs ALTER COLUMN severity DROP NOT NULL;


-- ── 3. FIX DYNAMIC SIGNUP TRIGGER (PREVENTS DATABASE ERROR SAVING NEW USER) ──
-- This redefines public.handle_new_user() to safely insert new signups
-- into the unified tables without throwing foreign key or undefined relation errors.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_name TEXT;
  v_role TEXT;
BEGIN
  -- Extract name and role from metadata
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'name', 
    SPLIT_PART(NEW.email, '@', 1)
  );
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  -- A. Insert into public.users (Unified School ERP users table)
  INSERT INTO public.users (auth_id, email, name, role, status, first_login)
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_role::user_role,
    'active'::user_status,
    true
  )
  ON CONFLICT (auth_id) DO UPDATE
  SET email = EXCLUDED.email,
      name = EXCLUDED.name;

  -- B. Insert into public.profiles (EduQuest Compatibility table - if exists)
  BEGIN
    INSERT INTO public.profiles (user_id, full_name, avatar_url)
    VALUES (NEW.id, v_name, 'default_avatar')
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN 
    -- Ignore if table does not exist
  END;

  -- C. Insert into public.user_roles (EduQuest Compatibility table - if exists)
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if table does not exist
  END;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists and is connected
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT '✓ Database schema hotfixes compiled successfully' AS status;

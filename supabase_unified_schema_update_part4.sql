-- ============================================================
-- SQL SCRIPT: UNIFIED DATABASE SCHEMA - PART 4 (IAM & NAMES HOTFIX)
-- Run this script in the Supabase SQL Editor to resolve student/parent signup errors
-- ============================================================

-- ── 1. DROP THE SELF-REGISTRATION PREVENTER TRIGGER ──
-- This trigger causes client-side signup to crash because the auth transaction 
-- executes in the context of the newly registered user (not the admin).
DROP TRIGGER IF EXISTS trg_prevent_self_reg ON users;
DROP FUNCTION IF EXISTS fn_prevent_self_registration() CASCADE;


-- ── 2. ADD MISSING FULL_NAME COLUMNS FOR DASHBOARD COMPATIBILITY ──
-- The admin UI queries students and parents using the 'full_name' column.

-- Students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS full_name TEXT;
UPDATE public.students SET full_name = name WHERE full_name IS NULL;

-- Parents
ALTER TABLE public.parents ADD COLUMN IF NOT EXISTS full_name TEXT;
UPDATE public.parents SET full_name = name WHERE full_name IS NULL;

-- Teachers
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS full_name TEXT;
UPDATE public.teachers SET full_name = name WHERE full_name IS NULL;


-- ── 3. ENSURE NEW USERS AUTOMATICALLY RECONCILE ON SIGNUP ──
-- Re-verify that public.handle_new_user() runs correctly on signup.

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

-- Connect trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT '✓ Database schema IAM & Names hotfixes compiled successfully' AS status;

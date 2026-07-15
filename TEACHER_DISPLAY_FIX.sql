-- ================================================================
-- TEACHER DISPLAY FIX
-- Run in Supabase SQL Editor to fix:
-- 1. Teachers not showing in TeacherManager list
-- 2. Teachers not being able to log in
-- ================================================================

-- Step 1: Add school_id column to users table (for non-student users)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS school_id UUID;

-- Step 2: Drop and recreate profiles view with school_id from both sources
-- (Safe to drop - no RLS policies directly on this view)
DROP VIEW IF EXISTS public.profiles CASCADE;

CREATE VIEW public.profiles AS
SELECT 
  u.auth_id AS id,
  u.auth_id AS user_id,
  u.id AS core_user_id,
  COALESCE(s.school_id, u.school_id) AS school_id,
  u.name AS full_name,
  COALESCE(s.roll_number, s.roll_no::text) AS roll_number,
  c.grade_level AS class_level,
  s.avatar_url,
  (u.status = 'active') AS is_active,
  u.created_at,
  u.updated_at
FROM public.users u
LEFT JOIN public.students s ON s.user_id = u.id
LEFT JOIN public.classes c ON c.name = s.class;

-- Step 3: Recreate the INSTEAD OF UPDATE trigger on profiles
CREATE OR REPLACE FUNCTION public.update_profiles_view_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_core_user_id UUID;
BEGIN
  SELECT id INTO v_core_user_id FROM public.users WHERE auth_id = OLD.user_id;

  -- Update user name if changed
  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    UPDATE public.users SET name = NEW.full_name WHERE id = v_core_user_id;
  END IF;

  -- Save school_id on users table (for teachers/admins who are not in students)
  IF NEW.school_id IS NOT NULL THEN
    UPDATE public.users SET school_id = NEW.school_id WHERE id = v_core_user_id;
  END IF;

  -- Also update students table (avatar_url + school_id for students)
  UPDATE public.students
  SET 
    avatar_url = COALESCE(NEW.avatar_url, avatar_url),
    school_id = COALESCE(NEW.school_id, school_id)
  WHERE user_id = v_core_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_update_profiles
  INSTEAD OF UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profiles_view_trigger();

-- Step 4: Fix any teachers who were added but don't have a users row
-- (Finds auth users with teacher role in user_metadata that are missing from users table)
-- NOTE: Run manage-teacher CREATE again for any failed teacher - 
-- the updated code now explicitly inserts into users table.

-- Step 5: Ensure user_roles view is still correct
-- (user_roles is a view of the users table - confirm it works)
SELECT 
  'Profiles view recreated' AS action,
  (SELECT COUNT(*) FROM public.profiles) AS profile_count,
  (SELECT COUNT(*) FROM public.users) AS users_count;

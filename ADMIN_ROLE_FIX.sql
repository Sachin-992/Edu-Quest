-- ============================================================
-- ADMIN FIX v2: Fix has_role function and sync admin user_roles
-- Run this in Supabase SQL Editor to fix "Forbidden: Admin access required"
-- NOTE: Uses CREATE OR REPLACE only (no DROP) to preserve RLS policies
-- ============================================================

-- Step 1: Drop ONLY the text overload (no dependents)
DROP FUNCTION IF EXISTS public.has_role(_user_id UUID, _role text);

-- Step 2: Replace has_role body using CREATE OR REPLACE (preserves dependencies)
-- Now also checks the users table so Educore admins pass the check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role::text
  )
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = _user_id AND role::text = _role::text
  )
$$;


-- Step 3: Ensure every user in the users table has a matching user_roles row
INSERT INTO public.user_roles (user_id, role)
SELECT u.auth_id, u.role::text::public.app_role
FROM public.users u
WHERE u.auth_id IS NOT NULL
  AND u.role::text IN ('admin', 'teacher', 'student', 'parent', 'super_admin', 'school_admin')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = u.auth_id AND ur.role::text = u.role::text
  );

SELECT 'Admin fix v2 applied successfully' AS status,
       (SELECT COUNT(*) FROM public.user_roles) AS total_user_roles,
       (SELECT COUNT(*) FROM public.users) AS total_users;

-- ============================================================
-- FIX: Auto-assign default role on user signup
-- Prevents the "Please wait..." stuck issue from ever happening again
--
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Update the handle_new_user trigger to also assign a default 'student' role
--    This ensures EVERY new user gets a role, even if created via Dashboard
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User')
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Auto-assign default 'student' role
  -- (Admins can be upgraded later via SQL or admin panel)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Backfill: Find any existing users that are missing a role and assign 'student'
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'student'::app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Verify: Show all users and their roles
SELECT
  u.email,
  ur.role,
  p.full_name,
  CASE WHEN ur.role IS NULL THEN '❌ MISSING ROLE' ELSE '✅ OK' END AS status
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.profiles p ON p.user_id = u.id
ORDER BY u.created_at;

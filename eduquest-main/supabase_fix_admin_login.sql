-- ============================================
-- ADMIN LOGIN DIAGNOSTIC & FIX
-- Run this in Supabase SQL Editor
-- ============================================

-- ========== STEP 1: DIAGNOSE ==========

-- 1a. Check if the admin user exists in auth
SELECT 
  id, 
  email, 
  created_at,
  last_sign_in_at,
  email_confirmed_at,
  CASE WHEN encrypted_password != '' THEN '✅ Has password' ELSE '❌ No password' END AS password_status
FROM auth.users 
WHERE email = 'balanperiyasamy21@gmail.com';

-- 1b. Check what roles this user has
SELECT ur.user_id, ur.role, u.email
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'balanperiyasamy21@gmail.com';

-- 1c. Check if profile exists
SELECT p.id, p.user_id, p.full_name, p.school_id, p.is_active
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'balanperiyasamy21@gmail.com';

-- 1d. Check RLS policies on user_roles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_roles';

-- ========== STEP 2: FIX ==========
-- Run these ONLY if Step 1 shows problems

-- 2a. If user exists but has NO role → assign admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'balanperiyasamy21@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.users.id
  );

-- 2b. If user exists but has NO profile → create profile
INSERT INTO public.profiles (user_id, full_name, school_id)
SELECT 
  u.id, 
  'Admin',
  (SELECT id FROM public.schools LIMIT 1)
FROM auth.users u
WHERE u.email = 'balanperiyasamy21@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
  );

-- 2c. If user does NOT exist at all → create via Supabase Auth
-- NOTE: You cannot INSERT into auth.users directly.
-- Instead, go to Supabase Dashboard → Authentication → Users → "Add User"
-- Email: balanperiyasamy21@gmail.com
-- Password: Admin@2026
-- Then re-run 2a and 2b above.

-- 2d. Reset password (if user exists but password is wrong)
-- Go to Supabase Dashboard → Authentication → Users
-- Find the user → Click "..." menu → "Send password reset email"
-- OR update directly:
UPDATE auth.users
SET encrypted_password = crypt('Admin@2026', gen_salt('bf'))
WHERE email = 'balanperiyasamy21@gmail.com';

-- ========== STEP 3: VERIFY ==========

-- 3a. Confirm everything is in place
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  ur.role,
  p.full_name,
  p.school_id,
  p.is_active
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'balanperiyasamy21@gmail.com';

-- Expected output:
-- email                          | email_confirmed | role  | full_name | school_id | is_active
-- balanperiyasamy21@gmail.com    | true            | admin | Admin     | <uuid>    | true

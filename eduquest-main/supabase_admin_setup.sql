-- ============================================================
-- ADMIN USER SETUP
-- Run this in Supabase SQL Editor AFTER creating the admin user
-- via Supabase Dashboard > Authentication > Users > Add User
--
-- Admin email: balanperiyasamy21@gmail.com
-- ============================================================

-- Step 1: Find the admin user's UUID
-- (Replace the email below if different)
DO $$
DECLARE
  admin_uid UUID;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO admin_uid
  FROM auth.users
  WHERE email = 'balanperiyasamy21@gmail.com';

  IF admin_uid IS NULL THEN
    RAISE EXCEPTION 'Admin user not found! Create the user first in Supabase Dashboard > Authentication > Users > Add User with email: balanperiyasamy21@gmail.com';
  END IF;

  -- Step 2: Insert admin role (skip if already exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_uid, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Step 3: Ensure profile exists
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (admin_uid, 'Admin')
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Admin setup complete! User ID: %, Role: super_admin', admin_uid;
END $$;

-- Verify the setup worked:
SELECT
  u.email,
  ur.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'balanperiyasamy21@gmail.com';

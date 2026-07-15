-- ============================================
-- DEBUG: Check if admin user exists correctly
-- Run these in Supabase SQL Editor
-- ============================================

-- 1. Check if user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@myschool.edu';

-- 2. Check if user exists in public.users table
SELECT * FROM users WHERE email = 'admin@myschool.edu';

-- 3. Check if IDs match (they MUST be the same!)
SELECT 
    a.id as auth_id, 
    a.email as auth_email,
    u.id as users_id,
    u.email as users_email,
    u.role,
    CASE WHEN a.id = u.id THEN '✓ IDs MATCH' ELSE '✗ IDS DO NOT MATCH!' END as status
FROM auth.users a
LEFT JOIN users u ON a.id = u.id
WHERE a.email = 'admin@myschool.edu';

-- ============================================
-- 4. If the user exists in auth but NOT in users table,
--    or if the IDs don't match, run this FIX:
-- ============================================

-- First get the correct UUID:
-- SELECT id FROM auth.users WHERE email = 'admin@myschool.edu';

-- Then delete any wrong entry and insert the correct one:
-- DELETE FROM users WHERE email = 'admin@myschool.edu';
-- INSERT INTO users (id, email, role, status, first_login)
-- SELECT id, 'admin@myschool.edu', 'admin', 'active', false
-- FROM auth.users WHERE email = 'admin@myschool.edu';

-- ============================================
-- 5. QUICK FIX - Run this to auto-sync:
-- ============================================
DELETE FROM users WHERE email = 'admin@myschool.edu';
INSERT INTO users (id, email, role, status, first_login)
SELECT id, email, 'admin', 'active', false
FROM auth.users 
WHERE email = 'admin@myschool.edu';

-- Verify it worked:
SELECT * FROM users WHERE email = 'admin@myschool.edu';

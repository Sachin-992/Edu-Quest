-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFY ADMIN STATUS & FIX CREDENTIALS
-- ═══════════════════════════════════════════════════════════════════════════════

-- The "Infinite Recursion" error is GONE.
-- Now we are seeing "Invalid Credentials".
-- Run this script to check your user status and (optionally) reset your password.

-- 1. Ensure encryption extension exists (for password reset)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. DIAGNOSTICS: Check if your user exists and has correct metadata
SELECT 
    id, 
    email, 
    raw_user_meta_data, 
    last_sign_in_at,
    created_at
FROM auth.users 
WHERE email = 'balanp212121@gmail.com';

-- 3. DIAGNOSTICS: Check if your public profile exists
SELECT * FROM public.users WHERE email = 'balanp212121@gmail.com';

-- 4. OPTIONAL: PASSWORD RESET (Uncomment and run ONLY if you can't login)
-- UPDATE auth.users 
-- SET encrypted_password = crypt('Admin@1234', gen_salt('bf')) 
-- WHERE email = 'balanp212121@gmail.com';

-- 5. OPTIONAL: METADATA REPAIR (Uncomment if 'role' is missing in Step 2)
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_build_object('role', 'admin', 'full_name', 'System Administrator')
-- WHERE email = 'balanp212121@gmail.com';

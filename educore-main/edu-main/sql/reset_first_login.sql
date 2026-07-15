-- ═══════════════════════════════════════════════════════════════════════════════
-- MANUALLY RESET FIRST_LOGIN FLAGG
-- ═══════════════════════════════════════════════════════════════════════════════

-- You suspected that 'first_login' being FALSE is causing the "Unable to initialize" issue.
-- This script sets it back to TRUE, which should force the application to treat you as a new user
-- and attempt the initialization flow again.

UPDATE public.users 
SET first_login = true 
WHERE email = 'balanp212121@gmail.com';

-- Verify the change
SELECT email, role, first_login FROM public.users WHERE email = 'balanp212121@gmail.com';

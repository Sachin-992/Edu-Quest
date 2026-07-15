-- ═══════════════════════════════════════════════════════════════════════════════
-- AUTO-CONFIRM EMAILS (Disable Verification)
-- ═══════════════════════════════════════════════════════════════════════════════
-- This trigger automatically marks all new users as "email confirmed" immediately.
-- Run this in: Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Create the function
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on auth.users
-- Note: Requires permissions to modify auth schema (Standard Dashboard SQL Editor has this)
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;

CREATE TRIGGER on_auth_user_created_confirm
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.auto_confirm_email();

-- 3. Confirm existing unconfirmed users (Optional cleanup)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

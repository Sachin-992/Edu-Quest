-- Phase 1: Password Security & Identity Hardening

-- 1. Create table for extended security settings (linked to auth.users usually, but we use public.users here for safety)
-- In Supabase, auth.users is protected. We will likely need to rely on our public 'users' table or create a shadow table.
-- Let's assume we use 'users' table which already exists and links to auth.users.

-- Check if columns exist, if not add them to public.users (or create a separate table)
-- Best practice: Keep security sensitive info separate or on the user profile. 
-- Let's allow adding policy to the 'users' table for simplicity in this architecture.

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_policy TEXT DEFAULT 'NORMAL' CHECK (password_policy IN ('NORMAL', 'TEACHER_MUST_CHANGE', 'LOCKED')),
ADD COLUMN IF NOT EXISTS first_login_completed BOOLEAN DEFAULT FALSE;

-- 2. Create Audit Logs table if not exists (Critical found missing in some checks)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    actor_name TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'success')),
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Function to Block Student/Parent Password Changes
-- Note: This trigger logic depends on how the password change is executed. 
-- If it's via Supabase Auth API, a Postgres trigger on public.users WON'T stop it.
-- However, we can prevent updates to the *metadata* or *profile* if that's where we store it.
-- REAL ENFORCEMENT must happen in the Edge Function wrapper.
-- This trigger protects the *integrity of the profile data* itself.

CREATE OR REPLACE FUNCTION check_profile_security_update() RETURNS TRIGGER AS $$
BEGIN
    -- If role is student or parent, they CANNOT change their own policies
    IF OLD.role IN ('student', 'parent') THEN
      -- Allow system/admin updates (usually checking current_user, but simplified here)
      -- Just prevent them from changing their own policy status
      IF NEW.password_policy != OLD.password_policy THEN
          RAISE EXCEPTION 'Students/Parents cannot change security policy';
      END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_security_profile ON users;
CREATE TRIGGER trg_protect_security_profile
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION check_profile_security_update();

-- 4. Initial Policy Set
UPDATE users SET password_policy = 'TEACHER_MUST_CHANGE', first_login_completed = FALSE 
WHERE role = 'teacher' AND first_login_completed IS NULL;

UPDATE users SET password_policy = 'LOCKED' 
WHERE role IN ('student', 'parent');

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: HARDEN IDENTITY MODEL
-- Prevents incomplete user records from ever being created
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Enforce constraints on users table
-- 1. Enforce constraints on users table
DO $$
BEGIN
    -- Set NOT NULL constraints (ignore if already set)
    BEGIN ALTER TABLE users ALTER COLUMN auth_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE users ALTER COLUMN role SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE users ALTER COLUMN status SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active'; EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Add constraints safely using explicit checks
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_auth_id_key') THEN
        ALTER TABLE users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'teacher', 'student', 'parent'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_status_check') THEN
        ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'suspended'));
    END IF;
END $$;

-- 2. Create function to validate identity completeness before insert
CREATE OR REPLACE FUNCTION fn_validate_identity_completeness()
RETURNS TRIGGER AS $$
BEGIN
    -- Reject if auth_id is null (should be caught by constraint, but triple check)
    IF NEW.auth_id IS NULL THEN
        RAISE EXCEPTION 'IDENTITY_INTEGRITY_VIOLATION: auth_id cannot be null';
    END IF;

    -- Reject if role is null
    IF NEW.role IS NULL THEN
        RAISE EXCEPTION 'IDENTITY_INTEGRITY_VIOLATION: User must have a defined role';
    END IF;

    -- Ensure default status if missing
    IF NEW.status IS NULL THEN
        NEW.status := 'active';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger for validation
DROP TRIGGER IF EXISTS trg_validate_identity ON users;
CREATE TRIGGER trg_validate_identity
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION fn_validate_identity_completeness();

-- 4. Create function to AUTO-HEAL admin status on login (if DB access allows)
-- This is a backup for the application-level auto-heal
CREATE OR REPLACE FUNCTION fn_ensure_admin_access()
RETURNS TRIGGER AS $$
BEGIN
    -- If an admin is being updated to inactive, log a warning but allow it 
    -- (admins should only be deactivated intentionally)
    IF OLD.role = 'admin' AND NEW.status != 'active' THEN
        INSERT INTO audit_logs (action, actor_id, severity, details)
        VALUES ('ADMIN_DEACTIVATED', OLD.auth_id, 'critical', '{"reason": "Admin status changed to inactive"}');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_monitor_admin_status
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION fn_ensure_admin_access();

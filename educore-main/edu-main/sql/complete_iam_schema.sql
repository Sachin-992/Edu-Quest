-- ═══════════════════════════════════════════════════════════════════════════════
-- EDUCORE-OMEGA: COMPLETE IAM PRODUCTION SCHEMA
-- VERSION: 2.0.0 | GOVERNMENT-GRADE | ZERO-TRUST
-- 
-- Platform: Supabase (PostgreSQL 15+)
-- Sections: A (Schema) + B (Helper Functions) + C (RLS Policies) + D (DOB-Sync Triggers)
--
-- CORE IDENTITY LAWS ENFORCED:
--   ✓ Email is the only login ID
--   ✓ No self-registration
--   ✓ Student password = Student DOB (ALWAYS)
--   ✓ Parent password = Linked Child DOB (ALWAYS)
--   ✓ Teacher password = Own DOB (initial, must change)
--   ✓ DOB is NEVER stored in plaintext
--   ✓ All actions are audited
-- ═══════════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION A: COMPLETE MIGRATION-SAFE SQL SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- A1: ENUM TYPES
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE password_policy_type AS ENUM (
        'STUDENT_DOB_LOCKED',
        'PARENT_CHILD_DOB_LOCKED',
        'TEACHER_MUST_CHANGE',
        'USER_CHANGEABLE'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM (
        'USER_CREATE',
        'USER_UPDATE',
        'USER_DELETE',
        'PASSWORD_SET',
        'PASSWORD_CHANGE',
        'PASSWORD_RESET',
        'PASSWORD_DENIED',
        'DOB_UPDATE',
        'DOB_SYNC',
        'PARENT_LINK',
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'UNAUTHORIZED_ACCESS'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE parent_relationship AS ENUM ('father', 'mother', 'guardian', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- A2: USERS TABLE (Core Identity)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE,  -- Links to Supabase Auth
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL,
    status user_status NOT NULL DEFAULT 'active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Core identity table - all users - v2.0';

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- A3: STUDENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    admission_number TEXT UNIQUE,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    roll_number INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE students IS 'Student records - v2.0';

CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_class_section ON students(class, section);

-- ─────────────────────────────────────────────────────────────────────────────
-- A4: TEACHERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE,
    department TEXT,
    subjects TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE teachers IS 'Teacher records - v2.0';

CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- A5: PARENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE parents IS 'Parent records - v2.0';

CREATE INDEX IF NOT EXISTS idx_parents_user ON parents(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- A6: PARENT-STUDENT LINKS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS parent_student_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    relationship parent_relationship NOT NULL DEFAULT 'guardian',
    is_primary_for_password BOOLEAN NOT NULL DEFAULT TRUE,
    linked_by UUID NOT NULL REFERENCES users(id),
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_parent_student UNIQUE (parent_id, student_id)
);

COMMENT ON TABLE parent_student_links IS 'Parent-child links for password derivation - v2.0';

CREATE INDEX IF NOT EXISTS idx_links_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_links_student ON parent_student_links(student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- A7: USER IDENTITY SECRETS TABLE (Encrypted DOB Storage)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_identity_secrets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- DOB encrypted with AES-256-GCM using server key
    -- Key stored in Supabase Vault, never in code
    dob_encrypted BYTEA NOT NULL,
    
    -- Masked for display: "**/**/YYYY"
    dob_masked TEXT NOT NULL,
    
    -- Password policy enforcement
    password_policy password_policy_type NOT NULL,
    
    -- First login tracking (teachers must change password)
    first_login_completed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Password is locked (students & parents)
    password_locked BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Last password change
    password_last_changed_at TIMESTAMPTZ,
    password_change_count INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_identity_secrets IS 'Secure DOB and password policy storage - v2.0';
COMMENT ON COLUMN user_identity_secrets.dob_encrypted IS 'AES-256-GCM encrypted DOB (DDMMYYYY format)';

CREATE INDEX IF NOT EXISTS idx_secrets_user ON user_identity_secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_secrets_policy ON user_identity_secrets(password_policy);

-- ─────────────────────────────────────────────────────────────────────────────
-- A8: AUDIT LOGS TABLE (Migration-Safe)
-- ─────────────────────────────────────────────────────────────────────────────

-- Create base table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id TEXT,
    actor_role TEXT NOT NULL DEFAULT 'unknown',
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    severity TEXT NOT NULL DEFAULT 'info',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration-safe: Add columns if they don't exist
DO $$ BEGIN
    ALTER TABLE audit_logs ADD COLUMN target_user_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE audit_logs ADD COLUMN ip_address INET;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE audit_logs ADD COLUMN user_agent TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

COMMENT ON TABLE audit_logs IS 'Complete action audit trail - v2.0';

-- Create indexes (IF NOT EXISTS handles existing)
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit_logs(severity);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION B: RLS HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- B1: Get current user's internal UUID
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
    SELECT id FROM users WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- B2: Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE auth_id = auth.uid() AND role = 'admin' AND status = 'active'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- B3: Check if current user is teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE auth_id = auth.uid() AND role = 'teacher' AND status = 'active'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- B4: Check if current user is student
CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE auth_id = auth.uid() AND role = 'student' AND status = 'active'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- B5: Check if current user is parent
CREATE OR REPLACE FUNCTION is_parent()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE auth_id = auth.uid() AND role = 'parent' AND status = 'active'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- B6: Get current teacher's ID
CREATE OR REPLACE FUNCTION get_my_teacher_id()
RETURNS UUID AS $$
    SELECT t.id FROM teachers t
    JOIN users u ON u.id = t.user_id
    WHERE u.auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- B7: Get current student's ID
CREATE OR REPLACE FUNCTION get_my_student_id()
RETURNS UUID AS $$
    SELECT s.id FROM students s
    JOIN users u ON u.id = s.user_id
    WHERE u.auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- B8: Get students assigned to current teacher (via timetable)
CREATE OR REPLACE FUNCTION get_my_assigned_student_ids()
RETURNS SETOF UUID AS $$
    SELECT DISTINCT s.id FROM students s
    JOIN timetables t ON t.class = s.class AND t.section = s.section
    JOIN timetable_periods tp ON tp.timetable_id = t.id
    WHERE tp.teacher_id = get_my_teacher_id()
      AND t.status = 'published';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- B9: Check if teacher can reset student's password
CREATE OR REPLACE FUNCTION can_teacher_reset_student(p_student_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_student_id UUID;
BEGIN
    IF NOT is_teacher() THEN
        RETURN FALSE;
    END IF;
    
    SELECT id INTO v_student_id FROM students WHERE user_id = p_student_user_id;
    
    IF v_student_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN v_student_id IN (SELECT get_my_assigned_student_ids());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- B10: Get linked parent user IDs for a student
CREATE OR REPLACE FUNCTION get_linked_parent_user_ids(p_student_user_id UUID)
RETURNS SETOF UUID AS $$
    SELECT p.user_id FROM parents p
    JOIN parent_student_links psl ON psl.parent_id = p.id
    JOIN students s ON s.id = psl.student_id
    WHERE s.user_id = p_student_user_id
      AND psl.is_primary_for_password = TRUE;
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION C: RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_identity_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- C1: USERS TABLE POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "users_admin_all" ON users;
CREATE POLICY "users_admin_all" ON users FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "users_self_select" ON users;
CREATE POLICY "users_self_select" ON users FOR SELECT 
    USING (auth_id = auth.uid());

DROP POLICY IF EXISTS "users_teacher_select_students" ON users;
CREATE POLICY "users_teacher_select_students" ON users FOR SELECT
    USING (is_teacher() AND role = 'student' AND 
           id IN (SELECT user_id FROM students WHERE id IN (SELECT get_my_assigned_student_ids())));

-- ─────────────────────────────────────────────────────────────────────────────
-- C2: STUDENTS TABLE POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "students_admin_all" ON students;
CREATE POLICY "students_admin_all" ON students FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "students_self_select" ON students;
CREATE POLICY "students_self_select" ON students FOR SELECT 
    USING (user_id = current_user_id());

DROP POLICY IF EXISTS "students_teacher_select" ON students;
CREATE POLICY "students_teacher_select" ON students FOR SELECT
    USING (is_teacher() AND id IN (SELECT get_my_assigned_student_ids()));

DROP POLICY IF EXISTS "students_parent_select" ON students;
CREATE POLICY "students_parent_select" ON students FOR SELECT
    USING (is_parent() AND id IN (
        SELECT psl.student_id FROM parent_student_links psl
        JOIN parents p ON p.id = psl.parent_id
        WHERE p.user_id = current_user_id()
    ));

-- ─────────────────────────────────────────────────────────────────────────────
-- C3: TEACHERS TABLE POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "teachers_admin_all" ON teachers;
CREATE POLICY "teachers_admin_all" ON teachers FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "teachers_self_select" ON teachers;
CREATE POLICY "teachers_self_select" ON teachers FOR SELECT 
    USING (user_id = current_user_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- C4: PARENTS TABLE POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "parents_admin_all" ON parents;
CREATE POLICY "parents_admin_all" ON parents FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "parents_self_select" ON parents;
CREATE POLICY "parents_self_select" ON parents FOR SELECT 
    USING (user_id = current_user_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- C5: PARENT_STUDENT_LINKS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "links_admin_all" ON parent_student_links;
CREATE POLICY "links_admin_all" ON parent_student_links FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "links_parent_select" ON parent_student_links;
CREATE POLICY "links_parent_select" ON parent_student_links FOR SELECT
    USING (is_parent() AND parent_id IN (
        SELECT id FROM parents WHERE user_id = current_user_id()
    ));

DROP POLICY IF EXISTS "links_teacher_select" ON parent_student_links;
CREATE POLICY "links_teacher_select" ON parent_student_links FOR SELECT
    USING (is_teacher() AND student_id IN (SELECT get_my_assigned_student_ids()));

-- ─────────────────────────────────────────────────────────────────────────────
-- C6: USER_IDENTITY_SECRETS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Admin: Full access (but DOB decryption only via Edge Function)
DROP POLICY IF EXISTS "secrets_admin_all" ON user_identity_secrets;
CREATE POLICY "secrets_admin_all" ON user_identity_secrets FOR ALL USING (is_admin());

-- Users: Can view own record (only masked DOB visible, encrypted is opaque)
DROP POLICY IF EXISTS "secrets_self_select" ON user_identity_secrets;
CREATE POLICY "secrets_self_select" ON user_identity_secrets FOR SELECT 
    USING (user_id = current_user_id());

-- Teachers: Can view (not update) secrets of assigned students
DROP POLICY IF EXISTS "secrets_teacher_select" ON user_identity_secrets;
CREATE POLICY "secrets_teacher_select" ON user_identity_secrets FOR SELECT
    USING (is_teacher() AND user_id IN (
        SELECT user_id FROM students WHERE id IN (SELECT get_my_assigned_student_ids())
    ));

-- CRITICAL: No UPDATE policies for students/parents = they cannot modify

-- ─────────────────────────────────────────────────────────────────────────────
-- C7: AUDIT_LOGS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "audit_admin_all" ON audit_logs;
CREATE POLICY "audit_admin_all" ON audit_logs FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "audit_self_select" ON audit_logs;
CREATE POLICY "audit_self_select" ON audit_logs FOR SELECT 
    USING (
        target_user_id = current_user_id() 
        OR (actor_id IS NOT NULL AND actor_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND actor_id::UUID = current_user_id())
    );

-- Allow INSERT for logging (all authenticated users can create logs)
DROP POLICY IF EXISTS "audit_insert" ON audit_logs;
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (TRUE);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION D: DOB-SYNC TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- D1: Log DOB change and queue parent password sync
CREATE OR REPLACE FUNCTION fn_on_dob_change()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id UUID;
    v_parent_record RECORD;
BEGIN
    -- Only trigger if dob_encrypted actually changed
    IF OLD.dob_encrypted = NEW.dob_encrypted THEN
        RETURN NEW;
    END IF;
    
    -- Log the DOB change
    INSERT INTO audit_logs (
        actor_id, actor_role, action, entity, entity_id, target_user_id,
        details, severity
    ) VALUES (
        current_user_id()::TEXT,
        COALESCE((SELECT role::TEXT FROM users WHERE id = current_user_id()), 'system'),
        'DOB_UPDATE',
        'user_identity_secrets',
        NEW.id::TEXT,
        NEW.user_id,
        jsonb_build_object(
            'old_masked', OLD.dob_masked,
            'new_masked', NEW.dob_masked
        ),
        'warning'
    );
    
    -- Check if this is a student (parents need sync)
    SELECT id INTO v_student_id FROM students WHERE user_id = NEW.user_id;
    
    IF v_student_id IS NOT NULL THEN
        -- Find all linked parents with primary flag
        FOR v_parent_record IN 
            SELECT p.user_id AS parent_user_id, psl.parent_id
            FROM parent_student_links psl
            JOIN parents p ON p.id = psl.parent_id
            WHERE psl.student_id = v_student_id
              AND psl.is_primary_for_password = TRUE
        LOOP
            -- Update parent's DOB to match child's
            UPDATE user_identity_secrets
            SET dob_encrypted = NEW.dob_encrypted,
                dob_masked = NEW.dob_masked,
                updated_at = NOW()
            WHERE user_id = v_parent_record.parent_user_id;
            
            -- Log the sync
            INSERT INTO audit_logs (
                actor_id, actor_role, action, entity, entity_id, target_user_id,
                details, severity
            ) VALUES (
                NULL,
                'SYSTEM',
                'DOB_SYNC',
                'user_identity_secrets',
                NULL,
                v_parent_record.parent_user_id,
                jsonb_build_object(
                    'reason', 'Child DOB updated',
                    'student_user_id', NEW.user_id,
                    'student_id', v_student_id
                ),
                'warning'
            );
        END LOOP;
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_dob_change ON user_identity_secrets;
CREATE TRIGGER trg_dob_change
    AFTER UPDATE OF dob_encrypted ON user_identity_secrets
    FOR EACH ROW
    EXECUTE FUNCTION fn_on_dob_change();

-- D2: Prevent password unlock for locked policies
CREATE OR REPLACE FUNCTION fn_enforce_password_lock()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent unlocking password for locked policies
    IF OLD.password_locked = TRUE AND NEW.password_locked = FALSE THEN
        IF OLD.password_policy IN ('STUDENT_DOB_LOCKED', 'PARENT_CHILD_DOB_LOCKED') THEN
            -- Log the denied attempt
            INSERT INTO audit_logs (
                actor_id, actor_role, action, entity, entity_id, target_user_id,
                details, severity
            ) VALUES (
                current_user_id()::TEXT,
                COALESCE((SELECT role::TEXT FROM users WHERE id = current_user_id()), 'unknown'),
                'PASSWORD_DENIED',
                'user_identity_secrets',
                NEW.id::TEXT,
                NEW.user_id,
                jsonb_build_object('attempt', 'unlock_password', 'policy', OLD.password_policy::TEXT),
                'critical'
            );
            
            RAISE EXCEPTION 'DENIED: Cannot unlock password for policy %', OLD.password_policy;
        END IF;
    END IF;
    
    -- Track password changes
    IF NEW.password_last_changed_at IS DISTINCT FROM OLD.password_last_changed_at THEN
        NEW.password_change_count := OLD.password_change_count + 1;
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_password_lock ON user_identity_secrets;
CREATE TRIGGER trg_enforce_password_lock
    BEFORE UPDATE ON user_identity_secrets
    FOR EACH ROW
    EXECUTE FUNCTION fn_enforce_password_lock();

-- D3: Prevent self-registration (users must be admin-created)
CREATE OR REPLACE FUNCTION fn_prevent_self_registration()
RETURNS TRIGGER AS $$
BEGIN
    -- If created_by is NULL and creator is not admin, reject
    IF NEW.created_by IS NULL THEN
        -- Allow system/service role operations
        IF auth.uid() IS NULL THEN
            RETURN NEW;
        END IF;
        
        -- Check if creator is admin
        IF NOT is_admin() THEN
            RAISE EXCEPTION 'DENIED: Users can only be created by administrators';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_self_reg ON users;
CREATE TRIGGER trg_prevent_self_reg
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevent_self_registration();


-- ═══════════════════════════════════════════════════════════════════════════════
-- FINAL VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- Verify RLS is enabled
DO $$
DECLARE
    v_table TEXT;
    v_rls BOOLEAN;
BEGIN
    FOR v_table, v_rls IN 
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'students', 'teachers', 'parents', 
                          'parent_student_links', 'user_identity_secrets', 'audit_logs')
    LOOP
        IF NOT v_rls THEN
            RAISE EXCEPTION 'CRITICAL: RLS not enabled on table %', v_table;
        END IF;
    END LOOP;
    RAISE NOTICE 'VERIFIED: RLS enabled on all identity tables';
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════

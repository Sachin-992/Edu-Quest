-- ═══════════════════════════════════════════════════════════════════════════════
-- EDUCORE-OMEGA GOVERNMENT ID SECURITY SCHEMA
-- Aadhaar ID Fields with Encryption & RLS
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: ADD AADHAAR COLUMNS TO STUDENTS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE students ADD COLUMN IF NOT EXISTS aadhaar_encrypted TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS aadhaar_last4 TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS aadhaar_verified BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS aadhaar_updated_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS aadhaar_updated_by UUID REFERENCES users(id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: ADD AADHAAR COLUMNS TO TEACHERS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS aadhaar_encrypted TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS aadhaar_last4 TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS aadhaar_verified BOOLEAN DEFAULT false;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS aadhaar_updated_at TIMESTAMPTZ;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS aadhaar_updated_by UUID REFERENCES users(id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: CREATE AADHAAR ACCESS AUDIT TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aadhaar_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id TEXT NOT NULL,
    actor_name TEXT,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('VIEW', 'UPDATE', 'VERIFY', 'ACCESS_DENIED')),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('student', 'teacher')),
    entity_id UUID NOT NULL,
    entity_name TEXT,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_aadhaar_access_actor ON aadhaar_access_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_aadhaar_access_entity ON aadhaar_access_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_aadhaar_access_created ON aadhaar_access_logs(created_at DESC);

-- Enable RLS on aadhaar_access_logs
ALTER TABLE aadhaar_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view aadhaar access logs
DROP POLICY IF EXISTS "aadhaar_logs_admin_read" ON aadhaar_access_logs;
CREATE POLICY "aadhaar_logs_admin_read" ON aadhaar_access_logs 
    FOR SELECT USING (is_admin());

-- All authenticated users can insert logs (for access denied logging)
DROP POLICY IF EXISTS "aadhaar_logs_insert" ON aadhaar_access_logs;
CREATE POLICY "aadhaar_logs_insert" ON aadhaar_access_logs 
    FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: CREATE SECURE VIEW FOR NON-ADMINS (HIDES AADHAAR)
-- ═══════════════════════════════════════════════════════════════════════════════

-- View for students that hides Aadhaar for non-admins
CREATE OR REPLACE VIEW students_safe AS
SELECT 
    id,
    user_id,
    name,
    class,
    section,
    roll_no,
    fee_status,
    status,
    created_at,
    updated_at,
    -- Aadhaar fields: Only show if admin
    CASE WHEN is_admin() THEN aadhaar_encrypted ELSE NULL END as aadhaar_encrypted,
    CASE WHEN is_admin() THEN aadhaar_last4 ELSE NULL END as aadhaar_last4,
    aadhaar_verified,
    aadhaar_updated_at
FROM students;

-- View for teachers that hides Aadhaar for non-admins
CREATE OR REPLACE VIEW teachers_safe AS
SELECT 
    id,
    user_id,
    name,
    email,
    phone,
    subject,
    classes,
    experience_years,
    qualification,
    status,
    join_date,
    created_at,
    updated_at,
    -- Aadhaar fields: Only show if admin
    CASE WHEN is_admin() THEN aadhaar_encrypted ELSE NULL END as aadhaar_encrypted,
    CASE WHEN is_admin() THEN aadhaar_last4 ELSE NULL END as aadhaar_last4,
    aadhaar_verified,
    aadhaar_updated_at
FROM teachers;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: FUNCTION TO LOG AADHAAR ACCESS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION log_aadhaar_access(
    p_actor_id TEXT,
    p_actor_name TEXT,
    p_actor_role TEXT,
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_entity_name TEXT,
    p_success BOOLEAN DEFAULT true,
    p_failure_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO aadhaar_access_logs (
        actor_id, actor_name, actor_role, action, 
        entity_type, entity_id, entity_name, 
        success, failure_reason
    )
    VALUES (
        p_actor_id, p_actor_name, p_actor_role, p_action,
        p_entity_type, p_entity_id, p_entity_name,
        p_success, p_failure_reason
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: FUNCTION TO UPDATE AADHAAR (ADMIN ONLY)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_student_aadhaar(
    p_student_id UUID,
    p_aadhaar_encrypted TEXT,
    p_aadhaar_last4 TEXT,
    p_actor_id TEXT,
    p_actor_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if caller is admin
    IF NOT is_admin() THEN
        -- Log unauthorized attempt
        PERFORM log_aadhaar_access(
            p_actor_id, p_actor_name, 'non-admin', 'UPDATE',
            'student', p_student_id, NULL, false, 'Unauthorized: Not admin'
        );
        RAISE EXCEPTION 'SECURITY VIOLATION: Only administrators can update Aadhaar';
    END IF;
    
    -- Update student record
    UPDATE students SET
        aadhaar_encrypted = p_aadhaar_encrypted,
        aadhaar_last4 = p_aadhaar_last4,
        aadhaar_verified = true,
        aadhaar_updated_at = NOW(),
        aadhaar_updated_by = (SELECT id FROM users WHERE auth_id = auth.uid())
    WHERE id = p_student_id;
    
    -- Log successful update
    PERFORM log_aadhaar_access(
        p_actor_id, p_actor_name, 'admin', 'UPDATE',
        'student', p_student_id, 
        (SELECT name FROM students WHERE id = p_student_id),
        true, NULL
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Same for teachers
CREATE OR REPLACE FUNCTION update_teacher_aadhaar(
    p_teacher_id UUID,
    p_aadhaar_encrypted TEXT,
    p_aadhaar_last4 TEXT,
    p_actor_id TEXT,
    p_actor_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT is_admin() THEN
        PERFORM log_aadhaar_access(
            p_actor_id, p_actor_name, 'non-admin', 'UPDATE',
            'teacher', p_teacher_id, NULL, false, 'Unauthorized: Not admin'
        );
        RAISE EXCEPTION 'SECURITY VIOLATION: Only administrators can update Aadhaar';
    END IF;
    
    UPDATE teachers SET
        aadhaar_encrypted = p_aadhaar_encrypted,
        aadhaar_last4 = p_aadhaar_last4,
        aadhaar_verified = true,
        aadhaar_updated_at = NOW(),
        aadhaar_updated_by = (SELECT id FROM users WHERE auth_id = auth.uid())
    WHERE id = p_teacher_id;
    
    PERFORM log_aadhaar_access(
        p_actor_id, p_actor_name, 'admin', 'UPDATE',
        'teacher', p_teacher_id,
        (SELECT name FROM teachers WHERE id = p_teacher_id),
        true, NULL
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DEPLOYMENT COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- SUMMARY:
-- ✅ Aadhaar columns added to students and teachers
-- ✅ Aadhaar access audit table created
-- ✅ Secure views hide Aadhaar from non-admins
-- ✅ Admin-only update functions with logging
-- ✅ RLS policies enforced
--
-- ═══════════════════════════════════════════════════════════════════════════════

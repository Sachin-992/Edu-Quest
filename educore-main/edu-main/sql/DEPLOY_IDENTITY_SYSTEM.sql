-- ═══════════════════════════════════════════════════════════════════════════════
-- EDUCORE-OMEGA: UNIFIED IDENTITY DEPLOYMENT SCRIPT
-- Run this ONCE in Supabase SQL Editor to enable automatic login creation
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: ADD REQUIRED COLUMNS (safe if already exists)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add 'name' column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

-- Add 'email' column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS email TEXT;

-- Add 'date_of_birth' column to students if not exists
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add 'email' column to parents table
ALTER TABLE parents ADD COLUMN IF NOT EXISTS email TEXT;

-- Add 'date_of_birth' column to teachers if not exists  
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: ADD FOREIGN KEY CONSTRAINTS (safe if already exists)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Students -> Users FK
DO $$ BEGIN
    ALTER TABLE students ADD CONSTRAINT fk_students_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Teachers -> Users FK
DO $$ BEGIN
    ALTER TABLE teachers ADD CONSTRAINT fk_teachers_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Parents -> Users FK
DO $$ BEGIN
    ALTER TABLE parents ADD CONSTRAINT fk_parents_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: CREATE USER PROFILES VIEW (for User Management module)
-- ═══════════════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS user_profiles_view;
CREATE OR REPLACE VIEW user_profiles_view AS
SELECT 
    u.id,
    u.auth_id,
    u.email,
    u.name,
    u.role::TEXT AS role,
    u.status::TEXT AS status,
    u.created_at,
    CASE 
        WHEN u.role::TEXT = 'student' THEN s.class || '-' || s.section
        WHEN u.role::TEXT = 'teacher' THEN t.subject
        WHEN u.role::TEXT = 'parent' THEN 'Parent/Guardian'
        ELSE 'Administrator'
    END AS info,
    CASE
        WHEN u.role::TEXT = 'student' THEN s.id::TEXT
        WHEN u.role::TEXT = 'teacher' THEN t.id::TEXT
        WHEN u.role::TEXT = 'parent' THEN p.id::TEXT
        ELSE u.id::TEXT
    END AS profile_id
FROM users u
LEFT JOIN students s ON s.user_id = u.id
LEFT JOIN teachers t ON t.user_id = u.id
LEFT JOIN parents p ON p.user_id = u.id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: INTEGRITY CHECK FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_identity_integrity()
RETURNS TABLE (
    issue_type TEXT,
    table_name TEXT,
    record_id UUID,
    details TEXT
) AS $$
BEGIN
    -- Orphan students
    RETURN QUERY
    SELECT 'ORPHAN_PROFILE'::TEXT, 'students'::TEXT, s.id,
        'Student has no login: ' || s.name
    FROM students s WHERE s.user_id IS NULL AND s.status::TEXT != 'inactive';
    
    -- Orphan teachers
    RETURN QUERY
    SELECT 'ORPHAN_PROFILE'::TEXT, 'teachers'::TEXT, t.id,
        'Teacher has no login: ' || t.name
    FROM teachers t WHERE t.user_id IS NULL AND t.status::TEXT NOT IN ('inactive', 'resigned');
    
    -- Orphan parents
    RETURN QUERY
    SELECT 'ORPHAN_PROFILE'::TEXT, 'parents'::TEXT, p.id,
        'Parent has no login: ' || p.name
    FROM parents p WHERE p.user_id IS NULL;
    
    -- Users without auth
    RETURN QUERY
    SELECT 'NO_AUTH'::TEXT, 'users'::TEXT, u.id,
        'Cannot login (no auth): ' || u.email
    FROM users u WHERE u.auth_id IS NULL AND u.status::TEXT = 'active';
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: LINK ORPHAN FUNCTION (for migrating existing profiles)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION link_orphan_to_auth(
    p_email TEXT,
    p_auth_uuid UUID,
    p_role TEXT
) RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_name TEXT;
    v_profile_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE auth_id = p_auth_uuid) THEN
        RETURN 'ERROR: Auth user already linked';
    END IF;
    
    IF p_role = 'student' THEN
        SELECT id, name INTO v_profile_id, v_name FROM students WHERE email = p_email AND user_id IS NULL;
    ELSIF p_role = 'teacher' THEN
        SELECT id, name INTO v_profile_id, v_name FROM teachers WHERE email = p_email AND user_id IS NULL;
    ELSIF p_role = 'parent' THEN
        SELECT id, name INTO v_profile_id, v_name FROM parents WHERE email = p_email AND user_id IS NULL;
    ELSE
        RETURN 'ERROR: Invalid role';
    END IF;
    
    IF v_profile_id IS NULL THEN
        RETURN 'ERROR: No orphan found with email: ' || p_email;
    END IF;
    
    INSERT INTO users (auth_id, email, name, role, status)
    VALUES (p_auth_uuid, p_email, v_name, p_role::user_role, 'active')
    RETURNING id INTO v_user_id;
    
    IF p_role = 'student' THEN
        UPDATE students SET user_id = v_user_id WHERE id = v_profile_id;
    ELSIF p_role = 'teacher' THEN
        UPDATE teachers SET user_id = v_user_id WHERE id = v_profile_id;
    ELSIF p_role = 'parent' THEN
        UPDATE parents SET user_id = v_user_id WHERE id = v_profile_id;
    END IF;
    
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_build_object('role', p_role, 'name', v_name)
    WHERE id = p_auth_uuid;
    
    RETURN 'SUCCESS: Linked ' || p_email || ' (' || p_role || ')';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: RUN INTEGRITY CHECK (see current orphans)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT * FROM check_identity_integrity();

-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ DEPLOYMENT COMPLETE!
-- 
-- NEXT STEPS:
-- 1. Deploy Edge Function (see below)
-- 2. Test by creating a new teacher from Admin Dashboard
-- ═══════════════════════════════════════════════════════════════════════════════

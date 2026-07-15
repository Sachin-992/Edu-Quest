-- ═══════════════════════════════════════════════════════════════════════════════
-- EDUCORE-OMEGA: MIGRATE ORPHAN PROFILES TO HAVE LOGIN CREDENTIALS
-- 
-- This script identifies orphan profiles (students/teachers/parents without
-- auth users) and provides the steps to create login credentials for them.
--
-- NOTE: Creating auth users requires the Supabase Admin API or Dashboard.
-- This script generates the SQL to run AFTER creating auth users manually.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: IDENTIFY ALL ORPHAN PROFILES
-- ═══════════════════════════════════════════════════════════════════════════════

-- View all orphan students
SELECT 
    'STUDENT' as type,
    id,
    name,
    COALESCE(email, 'NO_EMAIL') as email,
    date_of_birth,
    class,
    section,
    CASE 
        WHEN date_of_birth IS NOT NULL 
        THEN TO_CHAR(date_of_birth::DATE, 'DDMMYYYY')
        ELSE '23012026' -- Default password if no DOB
    END as suggested_password
FROM students 
WHERE user_id IS NULL AND status::TEXT != 'inactive';

-- View all orphan teachers
SELECT 
    'TEACHER' as type,
    id,
    name,
    COALESCE(email, 'NO_EMAIL') as email,
    date_of_birth,
    subject,
    CASE 
        WHEN date_of_birth IS NOT NULL 
        THEN TO_CHAR(date_of_birth::DATE, 'DDMMYYYY')
        ELSE '23012026' -- Default password if no DOB
    END as suggested_password
FROM teachers 
WHERE user_id IS NULL AND status::TEXT NOT IN ('inactive', 'resigned');

-- View all orphan parents  
SELECT 
    'PARENT' as type,
    id,
    name,
    COALESCE(email, 'NO_EMAIL') as email,
    NULL::DATE as date_of_birth,
    NULL as extra_info,
    '23012026' as suggested_password -- Will need child's DOB
FROM parents 
WHERE user_id IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: CREATE FUNCTION TO LINK ORPHAN PROFILE TO AUTH USER
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION link_orphan_to_auth(
    p_email TEXT,
    p_auth_uuid UUID,
    p_role TEXT  -- 'student', 'teacher', or 'parent'
)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_name TEXT;
    v_profile_id UUID;
BEGIN
    -- Check if auth user already linked
    IF EXISTS (SELECT 1 FROM users WHERE auth_id = p_auth_uuid) THEN
        RETURN 'ERROR: Auth user already linked to a users record';
    END IF;
    
    -- Get profile info based on role
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
        RETURN 'ERROR: No orphan profile found with email: ' || p_email;
    END IF;
    
    -- Create users record
    INSERT INTO users (auth_id, email, name, role, status)
    VALUES (p_auth_uuid, p_email, v_name, p_role::user_role, 'active')
    RETURNING id INTO v_user_id;
    
    -- Link to domain profile
    IF p_role = 'student' THEN
        UPDATE students SET user_id = v_user_id WHERE id = v_profile_id;
    ELSIF p_role = 'teacher' THEN
        UPDATE teachers SET user_id = v_user_id WHERE id = v_profile_id;
    ELSIF p_role = 'parent' THEN
        UPDATE parents SET user_id = v_user_id WHERE id = v_profile_id;
    END IF;
    
    -- Update auth metadata
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_build_object('role', p_role, 'name', v_name)
    WHERE id = p_auth_uuid;
    
    RETURN 'SUCCESS: Linked ' || p_email || ' (' || p_role || ') to auth user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: INSTRUCTIONS FOR EACH ORPHAN
-- ═══════════════════════════════════════════════════════════════════════════════

/*
FOR EACH ORPHAN PROFILE:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter:
   - Email: (from the query above)
   - Password: (suggested_password from above, or use DOB format DDMMYYYY)
4. Check "Auto-confirm email"
5. Click "Create User" and copy the UUID

6. Run this SQL (replace with actual values):

   SELECT link_orphan_to_auth(
       'email@example.com',           -- Email
       'paste-auth-uuid-here'::UUID,  -- Auth UUID from step 5
       'teacher'                       -- Role: 'student', 'teacher', or 'parent'
   );
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: EXAMPLE - MIGRATE TEACHER "madhu"
-- ═══════════════════════════════════════════════════════════════════════════════

/*
-- After creating auth user for madhu03@gmail.com in Supabase Dashboard:

SELECT link_orphan_to_auth(
    'madhu03@gmail.com',
    'PASTE_AUTH_UUID_HERE'::UUID,
    'teacher'
);

-- Password should be DOB in DDMMYYYY format
-- Example: DOB 2026-01-23 → Password: 23012026
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: VERIFY AFTER MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- Check remaining orphans (should be empty after migration)
-- SELECT * FROM check_identity_integrity();

-- Verify linked profiles
-- SELECT u.email, u.role, t.name, t.subject 
-- FROM users u JOIN teachers t ON t.user_id = u.id
-- WHERE u.role = 'teacher';

-- ═══════════════════════════════════════════════════════════════════════════════
-- QUICK SUMMARY:
-- 
-- 1. Run the SELECT queries in Step 1 to see all orphans
-- 2. For each orphan, create auth user in Supabase Dashboard
-- 3. Run link_orphan_to_auth() for each one
-- 4. Test login with email + DOB password
-- ═══════════════════════════════════════════════════════════════════════════════

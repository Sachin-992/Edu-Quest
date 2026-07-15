-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: Invalid 'superuser' role enum error - ROBUST VERSION
-- Run this ENTIRE script in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- The error occurs because is_admin() reads from JWT user_metadata, but if the
-- auth user was created without setting user_metadata.role, it fails.
-- We need role checks that fallback to the users table if JWT metadata is missing.

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: Create SAFE role-checking functions that NEVER throw enum errors
-- ═══════════════════════════════════════════════════════════════════════════════

-- Safe function to get role as TEXT (never enum)
CREATE OR REPLACE FUNCTION get_safe_user_role()
RETURNS TEXT AS $$
DECLARE
    v_jwt_role TEXT;
    v_db_role TEXT;
BEGIN
    -- 1. Try JWT user_metadata first (fast, no table query)
    BEGIN
        v_jwt_role := auth.jwt() -> 'user_metadata' ->> 'role';
    EXCEPTION WHEN OTHERS THEN
        v_jwt_role := NULL;
    END;
    
    -- If JWT has valid role, use it
    IF v_jwt_role IN ('admin', 'teacher', 'student', 'parent') THEN
        RETURN v_jwt_role;
    END IF;
    
    -- 2. Fallback to users table (slower but reliable)
    SELECT role::TEXT INTO v_db_role
    FROM users
    WHERE auth_id = auth.uid()
    LIMIT 1;
    
    IF v_db_role IS NOT NULL THEN
        RETURN v_db_role;
    END IF;
    
    -- 3. No role found - return 'unknown' (never NULL, never throws)
    RETURN 'unknown';
EXCEPTION WHEN OTHERS THEN
    RETURN 'unknown';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: Update is_admin() to be completely safe
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    v_role := get_safe_user_role();
    RETURN (v_role = 'admin');
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: Update is_teacher() to be completely safe
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_teacher() 
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    v_role := get_safe_user_role();
    RETURN (v_role = 'teacher');
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: Update is_student() to be completely safe
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_student() 
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    v_role := get_safe_user_role();
    RETURN (v_role = 'student');
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: Update is_parent() to be completely safe
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_parent() 
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    v_role := get_safe_user_role();
    RETURN (v_role = 'parent');
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: Update your auth.users metadata (one-time fix)
-- ═══════════════════════════════════════════════════════════════════════════════

-- This updates the JWT user_metadata so is_admin() works from JWT
-- Find your auth user ID first
DO $$
DECLARE
    v_auth_id UUID;
BEGIN
    -- Get auth_id for the admin user
    SELECT auth_id INTO v_auth_id FROM users WHERE email = 'balanp212121@gmail.com';
    
    IF v_auth_id IS NOT NULL THEN
        -- Update auth.users raw_user_meta_data
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
        WHERE id = v_auth_id;
        
        RAISE NOTICE 'Updated auth.users metadata for admin user';
    ELSE
        RAISE WARNING 'No auth_id found for admin user - please verify users table';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: Test the functions
-- ═══════════════════════════════════════════════════════════════════════════════

-- Verify safe role function works
SELECT get_safe_user_role() as current_role;

-- Verify is_admin works
SELECT is_admin() as is_admin_check;

-- Verify user data
SELECT id, email, role::TEXT, status::TEXT 
FROM users 
WHERE email = 'balanp212121@gmail.com';

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPLETE! Now LOG OUT and LOG BACK IN to get a fresh JWT with the new metadata.
-- Then refresh the Teacher Management page.
-- ═══════════════════════════════════════════════════════════════════════════════

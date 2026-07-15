-- ═══════════════════════════════════════════════════════════════════════════════
-- EDUCORE-OMEGA: DEPLOYMENT BOOTSTRAP SCRIPT
-- Run this AFTER complete_iam_schema.sql has been executed successfully
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: CREATE FIRST ADMIN USER
-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: First, create an auth user in Supabase Dashboard:
--   1. Go to Authentication > Users
--   2. Click "Add User"
--   3. Enter email: admin@educore.school (or your email)
--   4. Enter password: (use a strong password, change immediately)
--   5. Check "Auto-confirm email"
--   6. Click "Create User"
--   7. Copy the user's UUID from the table
--   8. Replace 'YOUR_AUTH_USER_UUID_HERE' below with that UUID

-- Insert admin into users table (replace UUID)
INSERT INTO users (auth_id, email, name, role, status, created_by)
VALUES (
    'YOUR_AUTH_USER_UUID_HERE',  -- Replace with actual auth.users.id
    'admin@educore.school',       -- Replace with your admin email
    'System Administrator',
    'admin',
    'active',
    NULL  -- Self-created (bootstrap)
)
ON CONFLICT (auth_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: VERIFY RLS IS ENABLED ON ALL TABLES
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
    v_table TEXT;
    v_enabled BOOLEAN;
BEGIN
    FOR v_table IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE '_prisma_%'
    LOOP
        SELECT relrowsecurity INTO v_enabled 
        FROM pg_class 
        WHERE relname = v_table AND relnamespace = 'public'::regnamespace;
        
        IF v_enabled = FALSE THEN
            RAISE WARNING 'RLS NOT ENABLED on table: %', v_table;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'RLS verification complete.';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: CREATE DEMO DATA (Optional - for testing)
-- ─────────────────────────────────────────────────────────────────────────────

-- Skip if you don't want demo data
-- Comment out this section for production

-- Create demo classes
INSERT INTO classes (name, grade_level) VALUES
    ('Class 1', 1),
    ('Class 6', 6),
    ('Class 10', 10),
    ('Class 12', 12)
ON CONFLICT DO NOTHING;

-- Create demo subjects
INSERT INTO subjects (name, code, grade_levels) VALUES
    ('Mathematics', 'MATH', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
    ('Science', 'SCI', ARRAY[1,2,3,4,5,6,7,8,9,10]),
    ('English', 'ENG', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
    ('Social Studies', 'SST', ARRAY[3,4,5,6,7,8,9,10]),
    ('Hindi', 'HIN', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12])
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: GRANT NECESSARY PERMISSIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Ensure anon and authenticated roles can access tables (with RLS)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: FINAL VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
    v_user_count INT;
    v_admin_count INT;
BEGIN
    SELECT COUNT(*) INTO v_user_count FROM users;
    SELECT COUNT(*) INTO v_admin_count FROM users WHERE role = 'admin';
    
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE 'DEPLOYMENT VERIFICATION';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE 'Total users: %', v_user_count;
    RAISE NOTICE 'Admin users: %', v_admin_count;
    
    IF v_admin_count = 0 THEN
        RAISE WARNING '⚠️ NO ADMIN USER FOUND! Please create one.';
    ELSE
        RAISE NOTICE '✅ Admin user exists';
    END IF;
    
    RAISE NOTICE '════════════════════════════════════════';
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF BOOTSTRAP SCRIPT
-- ═══════════════════════════════════════════════════════════════════════════════

-- ============================================================
-- ADMIN USER CREATION SCRIPT
-- Run this AFTER creating the admin user in Supabase Dashboard
-- ============================================================
-- 
-- STEP 1: Create admin user in Supabase Dashboard
--   1. Go to Authentication → Users → Add User
--   2. Email: admin@educore.in (or your email)
--   3. Password: Admin@123 (or your password)
--   4. Click "Create User"
--   5. Note the User UID shown (copy it)
--
-- STEP 2: Run this SQL (replace the UID below with your actual UID)
-- ============================================================

-- Replace this with the ACTUAL UID from Supabase Dashboard
DO $$
DECLARE
    admin_uid UUID;
BEGIN
    -- Try to find existing admin user by email patterns
    SELECT id INTO admin_uid 
    FROM auth.users 
    WHERE email ILIKE '%admin%' 
    ORDER BY created_at DESC 
    LIMIT 1;

    IF admin_uid IS NULL THEN
        RAISE NOTICE 'No admin user found in auth.users. Please create one in Dashboard first.';
        RETURN;
    END IF;

    RAISE NOTICE 'Found admin user with UID: %', admin_uid;

    -- Confirm email if not confirmed
    UPDATE auth.users 
    SET email_confirmed_at = NOW() 
    WHERE id = admin_uid AND email_confirmed_at IS NULL;

    -- Create entry in users table
    INSERT INTO users (id, auth_id, full_name, email, role, status, created_at, updated_at)
    VALUES (
        admin_uid,
        admin_uid,
        'System Administrator',
        (SELECT email FROM auth.users WHERE id = admin_uid),
        'ADMIN',
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'ADMIN',
        status = 'active',
        updated_at = NOW();

    -- Also try ON CONFLICT for auth_id
    INSERT INTO users (id, auth_id, full_name, email, role, status, created_at, updated_at)
    SELECT 
        admin_uid,
        admin_uid,
        'System Administrator',
        email,
        'ADMIN',
        'active',
        NOW(),
        NOW()
    FROM auth.users WHERE id = admin_uid
    ON CONFLICT (auth_id) DO UPDATE SET
        role = 'ADMIN',
        status = 'active',
        updated_at = NOW();

    RAISE NOTICE 'Admin user setup complete!';
END $$;

-- Verify the setup
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.role,
    u.status,
    CASE WHEN a.email_confirmed_at IS NOT NULL THEN 'YES' ELSE 'NO' END as email_confirmed
FROM users u
JOIN auth.users a ON u.auth_id = a.id
WHERE u.role = 'ADMIN';

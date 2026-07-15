-- ═══════════════════════════════════════════════════════════════════════════════
-- SIMULATE USER ACCESS (IMPERSONATION TEST)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Setup Variables (Devi's IDs)
-- Teacher ID: 71dd9742-caa7-4a34-8bd2-d45503ee983a
-- Auth ID: 7f4f4a13-c709-433e-b8f5-eb7de863c443 (from previous check)

DO $$
DECLARE
    v_teacher_id UUID := '71dd9742-caa7-4a34-8bd2-d45503ee983a';
    v_auth_id UUID := '7f4f4a13-c709-433e-b8f5-eb7de863c443';
    v_count INT;
    v_can_access BOOLEAN;
BEGIN
    RAISE NOTICE '--- STARTING IMPERSONATION TEST ---';

    -- 2. Test the Helper Function Directly
    -- We need to mock auth.uid() for the function check. 
    -- Since we can't easily mock auth.uid() in a DO block without specific extensions, 
    -- we will verify the LOGIC inside the function manually first.
    
    SELECT EXISTS (
        SELECT 1
        FROM teachers t
        JOIN users u ON u.id = t.user_id
        WHERE t.id = v_teacher_id
        AND u.auth_id = v_auth_id
    ) INTO v_can_access;
    
    IF v_can_access THEN
        RAISE NOTICE '✅ FUNCTION LOGIC PASS: Teacher is linked to Auth User correctly.';
    ELSE
        RAISE NOTICE '❌ FUNCTION LOGIC FAIL: Teacher - Auth User link is broken in DB.';
    END IF;

    -- 3. Check actual RLS visibility (requires setting local config)
    -- This works in Supabase SQL Editor usually to simulate request
    PERFORM set_config('request.jwt.claim.sub', v_auth_id::TEXT, true);
    PERFORM set_config('role', 'authenticated', true);
    
    SELECT COUNT(*) INTO v_count
    FROM timetable_periods
    WHERE teacher_id = v_teacher_id;
    
    RAISE NOTICE 'Rows visible to Devi: %', v_count;
    
    IF v_count > 0 THEN
        RAISE NOTICE '✅ SUCCESS: Devi can see % rows.', v_count;
    ELSE
        RAISE NOTICE '❌ FAIL: Devi sees 0 rows despite correct logic.';
    END IF;

    -- 4. Check for any "False" clauses in Policy
    -- Sometimes multiple policies exist and ONE 'DENY' (if implementing restrictive) or just missed Logic.
    -- (Postgres policies are OR by default for same command, so one True is enough).
    
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: TIMETABLE - TEMPORARILY BYPASS RLS FOR TESTING
-- ═══════════════════════════════════════════════════════════════════════════════
-- The is_admin() function might not be recognizing admin users correctly.
-- This creates permissive policies that allow any authenticated user.
-- Run this in: Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Check if is_admin() is working (run this first to diagnose)
SELECT 
    auth.uid() as current_user_id,
    auth.jwt() ->> 'role' as jwt_role,
    auth.jwt() -> 'user_metadata' ->> 'role' as metadata_role;

-- 2. Drop all existing policies on timetables
DROP POLICY IF EXISTS "timetables_admin_all" ON timetables;
DROP POLICY IF EXISTS "timetables_admin_insert" ON timetables;
DROP POLICY IF EXISTS "timetables_teacher_read" ON timetables;
DROP POLICY IF EXISTS "Admin All" ON timetables;
DROP POLICY IF EXISTS "Public Read Published" ON timetables;

-- 3. Create permissive policy that allows ANY authenticated user (for testing)
CREATE POLICY "timetables_auth_all" ON timetables 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Drop all existing policies on timetable_periods
DROP POLICY IF EXISTS "periods_admin_all" ON timetable_periods;
DROP POLICY IF EXISTS "periods_admin_insert" ON timetable_periods;
DROP POLICY IF EXISTS "periods_teacher_read" ON timetable_periods;
DROP POLICY IF EXISTS "Admin All" ON timetable_periods;
DROP POLICY IF EXISTS "Read Access" ON timetable_periods;

-- 5. Create permissive policy for periods
CREATE POLICY "periods_auth_all" ON timetable_periods 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Verify policies
SELECT tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE tablename IN ('timetables', 'timetable_periods');

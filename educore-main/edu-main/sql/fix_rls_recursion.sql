-- ═══════════════════════════════════════════════════════════════════════════════
-- CRITICAL FIX: INFINITE RECURSION IN RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- PROBLEM: 
-- The policy "users_admin_all" calls is_admin().
-- is_admin() queries the "users" table.
-- Querying "users" triggers "users_admin_all".
-- LOOP -> Infinite Recursion -> Error.

-- SOLUTION:
-- Change is_admin() and other role checks to look at the JWT/Auth Metadata directly.
-- This breaks the loop because it no longer queries the table protected by the policy.

CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    FALSE
  );
$$ LANGUAGE sql IMMUTABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_teacher() 
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher',
    FALSE
  );
$$ LANGUAGE sql IMMUTABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_student() 
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'student',
    FALSE
  );
$$ LANGUAGE sql IMMUTABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_parent() 
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'parent',
    FALSE
  );
$$ LANGUAGE sql IMMUTABLE SECURITY DEFINER;

-- Also verify the self-select policy exists (it was added in hotfix but ensuring it)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_self_select') THEN
        CREATE POLICY "users_self_select" ON users FOR SELECT USING (auth_id = auth.uid());
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- KILL HIDDEN RECURSION: DELETE LEGACY PUBLIC POLICY
-- ═══════════════════════════════════════════════════════════════════════════════

-- The previous verification revealed a policy: "users_teacher_select_students".
-- It applies to role "{public}", meaning it affects EVERYONE (including Admins).
-- It was NOT removed by previous scripts because the name wasn't known.
-- This policy is almost certainly the source of the persistent "infinite recursion".

-- 1. DROP the culprit
DROP POLICY IF EXISTS "users_teacher_select_students" ON users;

-- 2. Verify CLEAN state
-- You should ONLY see policies ending in "_final" after this.
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'users';

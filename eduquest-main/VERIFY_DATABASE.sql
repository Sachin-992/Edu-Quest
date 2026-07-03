-- ============================================================
-- EDUQUEST — DATABASE VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to confirm everything is set up correctly
-- ============================================================

-- ── 1. CHECK ALL REQUIRED TABLES EXIST ───────────────────────
SELECT
  t.table_name,
  CASE WHEN t.table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status,
  (SELECT COUNT(*) FROM information_schema.columns c
   WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS column_count
FROM (VALUES
  ('schools'), ('subscription_plans'), ('profiles'), ('user_roles'),
  ('subjects'), ('lessons'), ('quizzes'), ('quiz_questions'),
  ('student_progress'), ('adventure_progress'), ('leaderboard_settings'),
  ('leaderboard_bans'), ('avatar_items'), ('student_avatar_items'),
  ('coin_transactions'), ('study_sessions'), ('teacher_assignments'),
  ('audit_log'), ('ai_usage')
) AS t(table_name)
ORDER BY t.table_name;


-- ── 2. CHECK RLS IS ENABLED ON ALL TABLES ────────────────────
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'schools','subscription_plans','profiles','user_roles',
    'subjects','lessons','quizzes','quiz_questions',
    'student_progress','adventure_progress','leaderboard_settings',
    'leaderboard_bans','avatar_items','student_avatar_items',
    'coin_transactions','study_sessions','teacher_assignments',
    'audit_log','ai_usage'
  )
ORDER BY tablename;


-- ── 3. CHECK APP_ROLE ENUM VALUES ─────────────────────────────
SELECT enumlabel AS role, enumsortorder AS sort
FROM pg_enum
WHERE enumtypid = 'public.app_role'::regtype
ORDER BY enumsortorder;


-- ── 4. CHECK ALL REQUIRED FUNCTIONS EXIST ────────────────────
SELECT
  p.proname AS function_name,
  '✅ EXISTS' AS status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'has_role', 'get_user_role', 'get_user_school_id',
    'is_platform_admin', 'is_admin', 'handle_new_user',
    'update_updated_at_column', 'auto_fill_school_id',
    'get_school_ai_usage', 'get_school_ai_quota',
    'cleanup_old_audit_logs', 'refresh_school_analytics'
  )
ORDER BY p.proname;


-- ── 5. CHECK ALL REQUIRED TRIGGERS EXIST ─────────────────────
SELECT
  trigger_name,
  event_object_table AS on_table,
  '✅ EXISTS' AS status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
   OR (event_object_schema = 'public')
ORDER BY event_object_table, trigger_name;


-- ── 6. CHECK SEED DATA ────────────────────────────────────────
SELECT 'schools' AS table_name, COUNT(*) AS row_count FROM public.schools
UNION ALL
SELECT 'subscription_plans', COUNT(*) FROM public.subscription_plans
UNION ALL
SELECT 'avatar_items', COUNT(*) FROM public.avatar_items
UNION ALL
SELECT 'subjects', COUNT(*) FROM public.subjects
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'user_roles', COUNT(*) FROM public.user_roles;


-- ── 7. CHECK ADMIN USER SETUP ─────────────────────────────────
SELECT
  u.email,
  ur.role,
  p.full_name,
  p.school_id IS NOT NULL AS has_school,
  p.is_active,
  CASE
    WHEN ur.role IN ('admin','super_admin','school_admin') THEN '✅ Admin OK'
    WHEN ur.role = 'student' THEN '❌ Still student role — run admin setup!'
    WHEN ur.role IS NULL THEN '❌ No role — run admin setup!'
    ELSE '⚠️  Role: ' || ur.role::text
  END AS admin_check
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'sachinchinnasamy2021@gmail.com';


-- ── 8. CHECK MATERIALIZED VIEW ───────────────────────────────
SELECT
  matviewname,
  '✅ EXISTS' AS status
FROM pg_matviews
WHERE schemaname = 'public' AND matviewname = 'school_analytics';


-- ── 9. CHECK INDEXES ──────────────────────────────────────────
SELECT
  indexname,
  tablename,
  '✅' AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;


-- ── 10. OVERALL SUMMARY ───────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS total_tables,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public') AS total_functions,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_schema = 'public') AS total_triggers,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') AS total_rls_policies,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%') AS total_indexes,
  (SELECT COUNT(*) FROM public.avatar_items) AS avatar_items_count,
  (SELECT COUNT(*) FROM public.subscription_plans) AS plans_count;

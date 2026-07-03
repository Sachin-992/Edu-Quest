-- ============================================================
-- STEP 2 OF 2: SaaS MIGRATION (tables, RLS, plans, tracking)
-- ⚠️ Run supabase_saas_step1_roles.sql FIRST to add enum values!
-- Then run THIS file in Supabase SQL Editor
-- ============================================================

-- 1B. Add school_id to tables that need tenant scoping
DO $$ BEGIN
  ALTER TABLE public.student_progress ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
  ALTER TABLE public.adventure_progress ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
  ALTER TABLE public.coin_transactions ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
  ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
END $$;

-- 1C. Tenant-scoped helper function
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 1D. Backfill school_id from profiles for existing data
UPDATE public.student_progress sp
SET school_id = p.school_id
FROM public.profiles p
WHERE p.user_id = sp.user_id AND sp.school_id IS NULL;

UPDATE public.adventure_progress ap
SET school_id = p.school_id
FROM public.profiles p
WHERE p.user_id = ap.user_id AND ap.school_id IS NULL;

UPDATE public.coin_transactions ct
SET school_id = p.school_id
FROM public.profiles p
WHERE p.user_id = ct.user_id AND ct.school_id IS NULL;

UPDATE public.study_sessions ss
SET school_id = p.school_id
FROM public.profiles p
WHERE p.user_id = ss.user_id AND ss.school_id IS NULL;

-- 1E. Add indexes for tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_student_progress_school ON public.student_progress(school_id);
CREATE INDEX IF NOT EXISTS idx_adventure_progress_school ON public.adventure_progress(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school ON public.subjects(school_id);


-- ══════════════════════════════════════════
-- PHASE 1: STRICT TENANT-SCOPED RLS POLICIES
-- ══════════════════════════════════════════

-- Helper: Check if user is platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_admin')
$$;

-- ── student_progress: Tenant-scoped ──
DROP POLICY IF EXISTS "Students can view own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON public.student_progress;
DROP POLICY IF EXISTS "Tenant-scoped progress read" ON public.student_progress;

CREATE POLICY "Tenant-scoped progress read"
  ON public.student_progress FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      school_id = get_user_school_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'school_admin'))
    )
    OR is_platform_admin(auth.uid())
  );

-- Keep existing insert/update policies for students
DROP POLICY IF EXISTS "Students can insert own progress" ON public.student_progress;
CREATE POLICY "Students can insert own progress"
  ON public.student_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can update own progress" ON public.student_progress;
CREATE POLICY "Students can update own progress"
  ON public.student_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ── adventure_progress: Tenant-scoped ──
DROP POLICY IF EXISTS "Users can view their own adventure progress" ON public.adventure_progress;
DROP POLICY IF EXISTS "Tenant-scoped adventure read" ON public.adventure_progress;

CREATE POLICY "Tenant-scoped adventure read"
  ON public.adventure_progress FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      school_id = get_user_school_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'school_admin'))
    )
    OR is_platform_admin(auth.uid())
  );

-- ── profiles: Tenant-scoped admin access ──
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Tenant-scoped profiles admin read" ON public.profiles;

CREATE POLICY "Tenant-scoped profiles admin read"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      school_id = get_user_school_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'school_admin'))
    )
    OR is_platform_admin(auth.uid())
  );

-- ── subjects: Tenant-scoped ──
DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Tenant-scoped subjects admin" ON public.subjects;

CREATE POLICY "Tenant-scoped subjects admin"
  ON public.subjects FOR ALL TO authenticated
  USING (
    (
      school_id = get_user_school_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'school_admin'))
    )
    OR school_id IS NULL  -- global subjects
    OR is_platform_admin(auth.uid())
  );

-- ── coin_transactions: Tenant-scoped ──
DROP POLICY IF EXISTS "Tenant-scoped coin read" ON public.coin_transactions;

CREATE POLICY "Tenant-scoped coin read"
  ON public.coin_transactions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      school_id = get_user_school_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
    )
    OR is_platform_admin(auth.uid())
  );

-- ── study_sessions: Tenant-scoped ──
DROP POLICY IF EXISTS "Tenant-scoped study read" ON public.study_sessions;

CREATE POLICY "Tenant-scoped study read"
  ON public.study_sessions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      school_id = get_user_school_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
    )
    OR is_platform_admin(auth.uid())
  );


-- ══════════════════════════════════════════
-- PHASE 2: SECURITY & COMPLIANCE
-- ══════════════════════════════════════════

-- 2A. Audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_school_time ON public.audit_log(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_log(action);

DROP POLICY IF EXISTS "Admins can view own school audit" ON public.audit_log;
CREATE POLICY "Admins can view own school audit"
  ON public.audit_log FOR SELECT TO authenticated
  USING (
    (
      school_id = get_user_school_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'school_admin'))
    )
    OR is_platform_admin(auth.uid())
  );

-- Service role can always insert (edge functions use service key)
DROP POLICY IF EXISTS "Service can insert audit" ON public.audit_log;
CREATE POLICY "Service can insert audit"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- 2B. Data retention cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM public.audit_log WHERE created_at < now() - interval '90 days';
$$;


-- ══════════════════════════════════════════
-- PHASE 3: COST CONTROL & MONETIZATION
-- ══════════════════════════════════════════

-- 3A. Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  max_students INT NOT NULL,
  max_admins INT NOT NULL DEFAULT 2,
  ai_quiz_quota_monthly INT NOT NULL,
  price_inr_monthly INT NOT NULL DEFAULT 0,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view plans"
  ON public.subscription_plans FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Platform admin can manage plans" ON public.subscription_plans;
CREATE POLICY "Platform admin can manage plans"
  ON public.subscription_plans FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Seed default plans (skip if already exist)
INSERT INTO public.subscription_plans (name, max_students, max_admins, ai_quiz_quota_monthly, price_inr_monthly, features)
VALUES
  ('Free',       50,   1,   20,      0, '{"support": "community", "analytics": "basic"}'),
  ('Basic',      200,  3,   100,   999, '{"support": "email", "analytics": "standard", "bulk_import": true}'),
  ('Premium',    1000, 10,  500,  2999, '{"support": "priority", "analytics": "advanced", "bulk_import": true, "ai_quiz": true, "custom_branding": true}'),
  ('Enterprise', -1,   -1,  -1,      0, '{"support": "dedicated", "analytics": "enterprise", "custom": true}')
ON CONFLICT (name) DO NOTHING;

-- 3B. Extend schools table for subscriptions
DO $$ BEGIN
  ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id);
  ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';
  ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT now() + interval '30 days';
  ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS billing_email TEXT;
  ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS logo_url TEXT;
  ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
END $$;

-- Set existing schools to Free plan
UPDATE public.schools s
SET plan_id = (SELECT id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1)
WHERE s.plan_id IS NULL;

-- 3C. AI usage tracking
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_usage_school_month ON public.ai_usage(school_id, created_at);

DROP POLICY IF EXISTS "Admins can view own school AI usage" ON public.ai_usage;
CREATE POLICY "Admins can view own school AI usage"
  ON public.ai_usage FOR SELECT TO authenticated
  USING (
    (
      school_id = get_user_school_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'school_admin'))
    )
    OR is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Service can insert AI usage" ON public.ai_usage;
CREATE POLICY "Service can insert AI usage"
  ON public.ai_usage FOR INSERT TO authenticated
  WITH CHECK (true);

-- 3D. Helper: Get school's monthly AI usage count
CREATE OR REPLACE FUNCTION public.get_school_ai_usage(_school_id UUID)
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::INT, 0)
  FROM public.ai_usage
  WHERE school_id = _school_id
    AND created_at >= date_trunc('month', now())
$$;

-- 3E. Helper: Get school's AI quota from their plan
CREATE OR REPLACE FUNCTION public.get_school_ai_quota(_school_id UUID)
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(sp.ai_quiz_quota_monthly, 20)
  FROM public.schools s
  LEFT JOIN public.subscription_plans sp ON sp.id = s.plan_id
  WHERE s.id = _school_id
$$;


-- ══════════════════════════════════════════
-- PHASE 4: ANALYTICS
-- ══════════════════════════════════════════

-- 4A. School analytics materialized view
DROP MATERIALIZED VIEW IF EXISTS public.school_analytics;
CREATE MATERIALIZED VIEW public.school_analytics AS
SELECT
  p.school_id,
  COUNT(DISTINCT p.user_id) AS total_students,
  COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'completed' AND sp.lesson_id IS NOT NULL) AS lessons_completed,
  COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'completed' AND sp.quiz_id IS NOT NULL) AS quizzes_completed,
  ROUND(AVG(sp.score) FILTER (WHERE sp.quiz_id IS NOT NULL), 1) AS avg_quiz_score,
  COALESCE(SUM(sp.xp_earned), 0) AS total_xp_earned,
  COUNT(DISTINCT sp.user_id) FILTER (WHERE sp.updated_at > now() - interval '7 days') AS active_7d,
  COUNT(DISTINCT sp.user_id) FILTER (WHERE sp.updated_at > now() - interval '30 days') AS active_30d
FROM public.profiles p
LEFT JOIN public.student_progress sp ON sp.user_id = p.user_id
WHERE p.school_id IS NOT NULL
GROUP BY p.school_id;

-- Function to refresh analytics (call via cron or manually)
CREATE OR REPLACE FUNCTION public.refresh_school_analytics()
RETURNS void LANGUAGE sql AS $$
  REFRESH MATERIALIZED VIEW public.school_analytics;
$$;


-- ══════════════════════════════════════════
-- VERIFICATION QUERY
-- ══════════════════════════════════════════
SELECT '✅ SaaS migration complete!' AS status,
  (SELECT COUNT(*) FROM public.subscription_plans) AS plans_created,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'plan_id') AS schools_extended,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'audit_log') AS audit_log_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'ai_usage') AS ai_usage_exists;

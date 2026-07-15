-- ============================================================================
-- UNIFIED IDENTITY SCHEMA FIX (EduCore & EduQuest Master Fix)
-- Run this entire script in Supabase SQL Editor.
-- ============================================================================

-- 0. Ensure 'parent' is added to app_role enum for EduCore parent management compatibility
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';

-- 1. Ensure public.users has school_id column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Ensure public.students has all compat columns
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE public.students ALTER COLUMN roll_no DROP NOT NULL;
ALTER TABLE public.students ALTER COLUMN admission_number DROP NOT NULL;

-- 3. Cleanup conflicting older functions/triggers
DROP TRIGGER IF EXISTS tr_update_profiles ON public.profiles;
DROP TRIGGER IF EXISTS tr_insert_user_roles ON public.user_roles;
DROP VIEW IF EXISTS public.profiles CASCADE;
DROP VIEW IF EXISTS public.user_roles CASCADE;
DROP FUNCTION IF EXISTS public.has_role(_user_id UUID, _role text);


-- 4. Recreate Compatibility View: user_roles
-- Explicitly cast role back to app_role enum for full compatibility with EduQuest policies
CREATE OR REPLACE VIEW public.user_roles AS
SELECT 
  id AS id,
  auth_id AS user_id,
  role::text::public.app_role AS role
FROM public.users
WHERE auth_id IS NOT NULL;

-- Recreate Trigger for inserting roles into user_roles view
CREATE OR REPLACE FUNCTION public.insert_user_roles_view_trigger()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET role = NEW.role::text::public.user_role
  WHERE auth_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_insert_user_roles
  INSTEAD OF INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.insert_user_roles_view_trigger();

-- 5. Recreate Compatibility View: profiles
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
  u.auth_id AS id, -- Compatibility UUID
  u.auth_id AS user_id,
  u.id AS core_user_id,
  COALESCE(s.school_id, u.school_id) AS school_id,
  u.name AS full_name,
  COALESCE(s.roll_number, s.roll_no::text) AS roll_number,
  CASE 
    WHEN s.class IS NOT NULL AND s.class ~ '^\d+$' THEN s.class::integer
    ELSE c.grade_level
  END AS class_level,
  s.avatar_url,
  (u.status = 'active') AS is_active,
  u.created_at,
  u.updated_at
FROM public.users u
LEFT JOIN public.students s ON s.user_id = u.id
LEFT JOIN public.classes c ON c.name = s.class;

-- Recreate Trigger for updating profiles view (e.g. avatar shop)
CREATE OR REPLACE FUNCTION public.update_profiles_view_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_core_user_id UUID;
BEGIN
  SELECT id INTO v_core_user_id FROM public.users WHERE auth_id = OLD.user_id;

  IF v_core_user_id IS NOT NULL THEN
    -- Update base name in users
    IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
      UPDATE public.users SET name = NEW.full_name WHERE id = v_core_user_id;
    END IF;

    -- Update school_id in users
    IF NEW.school_id IS DISTINCT FROM OLD.school_id THEN
      UPDATE public.users SET school_id = NEW.school_id WHERE id = v_core_user_id;
    END IF;

    -- Update student-specific columns if student exists
    UPDATE public.students
    SET 
      avatar_url = COALESCE(NEW.avatar_url, avatar_url),
      school_id = COALESCE(NEW.school_id, school_id),
      roll_number = COALESCE(NEW.roll_number, roll_number),
      class = COALESCE(NEW.class_level::text, class)
    WHERE user_id = v_core_user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_update_profiles
  INSTEAD OF UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profiles_view_trigger();

-- 6. Recreate robust has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role::text
  )
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = _user_id AND role::text = _role::text
  )
$$;

-- 7. Sync user_roles from users for existing records safely
DO $$
BEGIN
  -- Insert missing records by using the view insert trigger
  INSERT INTO public.user_roles (user_id, role)
  SELECT u.auth_id, u.role::text::public.app_role
  FROM public.users u
  WHERE u.auth_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = u.auth_id AND ur.role::text = u.role::text
    );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Automatic user_roles sync failed or skipped: %', SQLERRM;
END $$;

-- 8. Sync student_milestone_progress for existing student accounts
INSERT INTO public.student_milestone_progress (student_id)
SELECT u.auth_id
FROM public.users u
WHERE u.role::text = 'student'
  AND u.auth_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.student_milestone_progress sm
    WHERE sm.student_id = u.auth_id
  );

-- 9. Create missing database tables required by EduCore
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    target_role TEXT,
    type TEXT NOT NULL DEFAULT 'info',
    category TEXT DEFAULT 'system',
    priority TEXT DEFAULT 'normal',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    action_label TEXT,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    sender_name TEXT,
    read BOOLEAN DEFAULT FALSE,
    dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id TEXT,
    type TEXT NOT NULL CHECK (type IN ('homework', 'announcement', 'exam', 'event')),
    title TEXT NOT NULL,
    content TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.daily_homework (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    content TEXT NOT NULL,
    homework_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT daily_homework_unique UNIQUE (class_id, subject_id, homework_date)
);
ALTER TABLE public.daily_homework ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'published')),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- 10. Fix assignments class_id vs class column mismatch
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS class_id TEXT;
UPDATE public.assignments SET class_id = class WHERE class_id IS NULL;

-- 11. Core RLS Policies for Students, Teachers, and Parents
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_admin_all" ON public.students;
CREATE POLICY "students_admin_all" ON public.students FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);
DROP POLICY IF EXISTS "students_teacher_read" ON public.students;
CREATE POLICY "students_teacher_read" ON public.students FOR SELECT USING (
  public.has_role(auth.uid(), 'teacher')
);
DROP POLICY IF EXISTS "students_self_read" ON public.students;
CREATE POLICY "students_self_read" ON public.students FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id)
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teachers_admin_all" ON public.teachers;
CREATE POLICY "teachers_admin_all" ON public.teachers FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);
DROP POLICY IF EXISTS "teachers_read_all" ON public.teachers;
CREATE POLICY "teachers_read_all" ON public.teachers FOR SELECT USING (
  auth.uid() IS NOT NULL
);

ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parents_admin_all" ON public.parents;
CREATE POLICY "parents_admin_all" ON public.parents FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);
DROP POLICY IF EXISTS "parents_self_read" ON public.parents;
CREATE POLICY "parents_self_read" ON public.parents FOR SELECT USING (
  auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id)
);

-- 12. Notices, Homework, Exams & Notifications RLS Policies
DROP POLICY IF EXISTS "notifications_self_view" ON public.notifications;
CREATE POLICY "notifications_self_view" ON public.notifications FOR SELECT
    USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));
DROP POLICY IF EXISTS "notifications_self_update" ON public.notifications;
CREATE POLICY "notifications_self_update" ON public.notifications FOR UPDATE
    USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
CREATE POLICY "notifications_insert_policy" ON public.notifications FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "notices_admin_all" ON public.notices;
CREATE POLICY "notices_admin_all" ON public.notices FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);
DROP POLICY IF EXISTS "notices_read_all" ON public.notices;
CREATE POLICY "notices_read_all" ON public.notices FOR SELECT USING (true);

DROP POLICY IF EXISTS "homework_admin_all" ON public.daily_homework;
CREATE POLICY "homework_admin_all" ON public.daily_homework FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);
DROP POLICY IF EXISTS "homework_read_all" ON public.daily_homework;
CREATE POLICY "homework_read_all" ON public.daily_homework FOR SELECT USING (true);

DROP POLICY IF EXISTS "exams_admin_all" ON public.exams;
CREATE POLICY "exams_admin_all" ON public.exams FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);
DROP POLICY IF EXISTS "exams_read_all" ON public.exams;
CREATE POLICY "exams_read_all" ON public.exams FOR SELECT USING (true);

-- 14. Populate sections in classes table if null
UPDATE public.classes SET section = 'A', status = 'active' WHERE section IS NULL;

-- 15. Create remaining missing database tables for Razorpay collection, exam approvals, feedback, and push subscriptions
CREATE TABLE IF NOT EXISTS public.fee_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.parents(id) ON DELETE SET NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    fee_type TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.fee_invoices ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.payment_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    receipt_number TEXT UNIQUE NOT NULL,
    pdf_url TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- Add invoice and online payment columns to payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.fee_invoices(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.parents(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_status TEXT DEFAULT 'successful' CHECK (transaction_status IN ('pending', 'successful', 'failed', 'refunded'));
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.exam_marks_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher_id UUID REFERENCES public.users(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    rejection_reason TEXT,
    release_at TIMESTAMPTZ,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, class, section, subject)
);
ALTER TABLE public.exam_marks_approvals ENABLE ROW LEVEL SECURITY;

-- Add columns to Marks table
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS pass_mark NUMERIC(5,2) DEFAULT 35.0;
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS class TEXT;
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Medical Leave', 'Withheld', 'Pending Verification'));
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS result_status TEXT CHECK (result_status IN ('Pass', 'Fail', 'Absent', 'Medical Leave', 'Withheld', 'Pending Verification'));
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft' CHECK (approval_status IN ('draft', 'submitted', 'approved', 'rejected'));
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS school_rank INTEGER;
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS class_rank INTEGER;
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS section_rank INTEGER;
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS subject_rank INTEGER;
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS release_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_role       TEXT NOT NULL CHECK (user_role IN ('student', 'parent')),
    category        TEXT NOT NULL CHECK (category IN ('academic', 'teacher', 'infrastructure', 'complaint', 'suggestion', 'general')),
    title           VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL CHECK (char_length(description) <= 2000),
    rating          INT CHECK (rating >= 1 AND rating <= 5),
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'archived')),
    admin_response  TEXT,
    admin_notes     TEXT,
    responded_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
    responded_at    TIMESTAMPTZ,
    is_anonymous    BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.feedback_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id     UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
    action          TEXT NOT NULL CHECK (action IN ('created', 'status_changed', 'responded', 'archived')),
    changed_by      UUID NOT NULL,
    previous_value  JSONB,
    new_value       JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback_audit_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    device_name VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    enable_in_app BOOLEAN DEFAULT TRUE,
    enable_push BOOLEAN DEFAULT TRUE,
    enable_email BOOLEAN DEFAULT FALSE,
    mute_system BOOLEAN DEFAULT FALSE,
    mute_academic BOOLEAN DEFAULT FALSE,
    mute_financial BOOLEAN DEFAULT FALSE,
    mute_announcements BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.subject_teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT idx_unique_subject_teacher UNIQUE (subject_id)
);
ALTER TABLE public.subject_teacher_assignments ENABLE ROW LEVEL SECURITY;

-- 16. Invoices, Receipts, and Payments RLS Policies
DROP POLICY IF EXISTS "invoices_parent_read" ON public.fee_invoices;
CREATE POLICY "invoices_parent_read" ON public.fee_invoices FOR SELECT 
USING (
  public.has_role(auth.uid(), 'parent') OR public.has_role(auth.uid(), 'student')
);
DROP POLICY IF EXISTS "invoices_admin_all" ON public.fee_invoices;
CREATE POLICY "invoices_admin_all" ON public.fee_invoices FOR ALL 
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "receipts_parent_read" ON public.payment_receipts;
CREATE POLICY "receipts_parent_read" ON public.payment_receipts FOR SELECT USING (true);
DROP POLICY IF EXISTS "receipts_admin_all" ON public.payment_receipts;
CREATE POLICY "receipts_admin_all" ON public.payment_receipts FOR ALL 
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "payments_parent_read_new" ON public.payments;
CREATE POLICY "payments_parent_read_new" ON public.payments FOR SELECT USING (true);
DROP POLICY IF EXISTS "payments_parent_insert" ON public.payments;
CREATE POLICY "payments_parent_insert" ON public.payments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
CREATE POLICY "payments_admin_all" ON public.payments FOR ALL 
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);

-- 17. Exam Marks Approvals RLS Policies
DROP POLICY IF EXISTS "approvals_admin_all" ON public.exam_marks_approvals;
CREATE POLICY "approvals_admin_all" ON public.exam_marks_approvals FOR ALL 
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);
DROP POLICY IF EXISTS "approvals_teacher_all" ON public.exam_marks_approvals;
CREATE POLICY "approvals_teacher_all" ON public.exam_marks_approvals FOR ALL 
USING (
  public.has_role(auth.uid(), 'teacher')
);
DROP POLICY IF EXISTS "approvals_student_parent_read" ON public.exam_marks_approvals;
CREATE POLICY "approvals_student_parent_read" ON public.exam_marks_approvals FOR SELECT USING (true);

-- 18. Feedback System RLS Policies
DROP POLICY IF EXISTS "feedback_admin_all" ON public.feedback;
CREATE POLICY "feedback_admin_all" ON public.feedback FOR ALL 
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);
DROP POLICY IF EXISTS "feedback_user_all" ON public.feedback;
CREATE POLICY "feedback_user_all" ON public.feedback FOR ALL 
USING (
  auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id)
);
DROP POLICY IF EXISTS "feedback_select_all" ON public.feedback;
CREATE POLICY "feedback_select_all" ON public.feedback FOR SELECT USING (true);

DROP POLICY IF EXISTS "feedback_audit_admin_all" ON public.feedback_audit_log;
CREATE POLICY "feedback_audit_admin_all" ON public.feedback_audit_log FOR ALL 
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);
DROP POLICY IF EXISTS "feedback_audit_read_all" ON public.feedback_audit_log;
CREATE POLICY "feedback_audit_read_all" ON public.feedback_audit_log FOR SELECT USING (true);

-- 19. Push Subscriptions & Preferences RLS Policies
DROP POLICY IF EXISTS "push_subscriptions_admin_all" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_admin_all" ON public.push_subscriptions FOR ALL 
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);
DROP POLICY IF EXISTS "push_subscriptions_user_all" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_user_all" ON public.push_subscriptions FOR ALL 
USING (
  auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id)
);

DROP POLICY IF EXISTS "notification_preferences_admin_all" ON public.notification_preferences;
CREATE POLICY "notification_preferences_admin_all" ON public.notification_preferences FOR ALL 
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);
DROP POLICY IF EXISTS "notification_preferences_user_all" ON public.notification_preferences;
CREATE POLICY "notification_preferences_user_all" ON public.notification_preferences FOR ALL 
USING (
  auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id)
);

-- 20. Subject Teacher Assignments RLS Policies
DROP POLICY IF EXISTS "subject_teacher_assignments_admin_all" ON public.subject_teacher_assignments;
CREATE POLICY "subject_teacher_assignments_admin_all" ON public.subject_teacher_assignments FOR ALL 
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);
DROP POLICY IF EXISTS "subject_teacher_assignments_read_all" ON public.subject_teacher_assignments;
CREATE POLICY "subject_teacher_assignments_read_all" ON public.subject_teacher_assignments FOR SELECT USING (true);

-- 21. Trigger Sync for Invoices
CREATE OR REPLACE FUNCTION sync_fee_records_to_invoices()
RETURNS TRIGGER AS $$
DECLARE
    target_parent_id UUID;
BEGIN
    SELECT parent_id INTO target_parent_id FROM public.parent_student_links WHERE student_id = NEW.student_id LIMIT 1;
    INSERT INTO public.fee_invoices (id, student_id, parent_id, invoice_number, fee_type, amount, due_date, status, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.student_id,
        target_parent_id,
        'INV-' || to_char(NEW.created_at, 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 8),
        NEW.fee_type,
        NEW.amount,
        NEW.due_date,
        NEW.status::text,
        NEW.created_at,
        NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE
    SET status = NEW.status::text,
        amount = NEW.amount,
        due_date = NEW.due_date,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_fee_records_to_invoices ON public.fee_records;
CREATE TRIGGER trigger_sync_fee_records_to_invoices
AFTER INSERT OR UPDATE ON public.fee_records
FOR EACH ROW
EXECUTE FUNCTION sync_fee_records_to_invoices();

-- Backfill invoices
INSERT INTO public.fee_invoices (id, student_id, parent_id, invoice_number, fee_type, amount, due_date, status, created_at, updated_at)
SELECT 
    id,
    student_id,
    (SELECT parent_id FROM public.parent_student_links WHERE student_id = fee_records.student_id LIMIT 1),
    'INV-' || to_char(created_at, 'YYYYMMDD') || '-' || substring(id::text, 1, 8),
    fee_type,
    amount,
    due_date,
    status::text,
    created_at,
    updated_at
FROM public.fee_records
ON CONFLICT (id) DO NOTHING;

-- 22. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

SELECT '✅ Unified identity schema changes applied successfully!' AS status;





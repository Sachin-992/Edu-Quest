-- ============================================================
-- TEACHER ROLE RLS MIGRATION
-- Adds 'teacher' role to existing RLS policies so teachers
-- can read student data for their assigned classes via the
-- regular Supabase client (anon key with RLS).
--
-- NOTE: The application primarily uses a service-role client 
-- (getAdminClient) for cross-user reads, so these policies
-- serve as a safety net / fallback.
-- ============================================================

-- ── profiles: Allow teachers to view student profiles in their school ──
DROP POLICY IF EXISTS "Teachers can view school profiles" ON public.profiles;
CREATE POLICY "Teachers can view school profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      school_id = get_user_school_id(auth.uid())
      AND has_role(auth.uid(), 'teacher')
    )
  );

-- ── student_progress: Allow teachers to view student progress in their school ──
DROP POLICY IF EXISTS "Teachers can view school progress" ON public.student_progress;
CREATE POLICY "Teachers can view school progress"
  ON public.student_progress FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      school_id = get_user_school_id(auth.uid())
      AND has_role(auth.uid(), 'teacher')
    )
  );

-- ── subjects: Allow teachers to view subjects ──
DROP POLICY IF EXISTS "Teachers can view subjects" ON public.subjects;
CREATE POLICY "Teachers can view subjects"
  ON public.subjects FOR SELECT TO authenticated
  USING (
    school_id = get_user_school_id(auth.uid())
    OR school_id IS NULL
  );

-- ── lessons: Allow teachers to view and manage lessons ──
DROP POLICY IF EXISTS "Teachers can view lessons" ON public.lessons;
CREATE POLICY "Teachers can view lessons"
  ON public.lessons FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Teachers can manage lessons" ON public.lessons;
CREATE POLICY "Teachers can manage lessons"
  ON public.lessons FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
    OR has_role(auth.uid(), 'school_admin')
    OR has_role(auth.uid(), 'teacher')
  );

-- ── quizzes: Allow teachers to view and manage quizzes ──
DROP POLICY IF EXISTS "Teachers can view quizzes" ON public.quizzes;
CREATE POLICY "Teachers can view quizzes"
  ON public.quizzes FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Teachers can manage quizzes" ON public.quizzes;
CREATE POLICY "Teachers can manage quizzes"
  ON public.quizzes FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
    OR has_role(auth.uid(), 'school_admin')
    OR has_role(auth.uid(), 'teacher')
  );

-- ── quiz_questions: Allow teachers to view and manage quiz questions ──
DROP POLICY IF EXISTS "Teachers can view quiz questions" ON public.quiz_questions;
CREATE POLICY "Teachers can view quiz questions"
  ON public.quiz_questions FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Teachers can manage quiz questions" ON public.quiz_questions;
CREATE POLICY "Teachers can manage quiz questions"
  ON public.quiz_questions FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
    OR has_role(auth.uid(), 'school_admin')
    OR has_role(auth.uid(), 'teacher')
  );

-- ── schools: Allow teachers to view their school ──
DROP POLICY IF EXISTS "Teachers can view own school" ON public.schools;
CREATE POLICY "Teachers can view own school"
  ON public.schools FOR SELECT TO authenticated
  USING (
    id = get_user_school_id(auth.uid())
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
    OR has_role(auth.uid(), 'school_admin')
  );

-- ── adventure_progress: Allow teachers to view school adventure progress ──
DROP POLICY IF EXISTS "Teachers can view school adventure progress" ON public.adventure_progress;
CREATE POLICY "Teachers can view school adventure progress"
  ON public.adventure_progress FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      school_id = get_user_school_id(auth.uid())
      AND has_role(auth.uid(), 'teacher')
    )
  );

-- ══════════════════════════════════════════
-- VERIFICATION QUERY
-- ══════════════════════════════════════════
SELECT '✅ Teacher RLS migration complete!' AS status;

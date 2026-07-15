-- ==============================================================================
-- EDUCORE-OMEGA: Transition Feedback to Questions & Doubts Schema
-- ==============================================================================

-- 1. ADD COLUMNS
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_feedback_subject_id ON public.feedback(subject_id);
CREATE INDEX IF NOT EXISTS idx_feedback_teacher_id ON public.feedback(teacher_id);

-- 3. DEFINE TEACHER RLS POLICIES
DROP POLICY IF EXISTS feedback_teacher_select ON public.feedback;
CREATE POLICY feedback_teacher_select ON public.feedback
    FOR SELECT
    USING (
        is_teacher() AND teacher_id = get_my_teacher_id()
    );

DROP POLICY IF EXISTS feedback_teacher_update ON public.feedback;
CREATE POLICY feedback_teacher_update ON public.feedback
    FOR UPDATE
    USING (
        is_teacher() AND teacher_id = get_my_teacher_id()
    );

-- 4. VERIFY POLICY CO-EXISTENCE
-- Users can select their own: USING (user_id = auth.uid()) - Already exists
-- Admins can do all: USING (is_admin()) or users role check - Already exists

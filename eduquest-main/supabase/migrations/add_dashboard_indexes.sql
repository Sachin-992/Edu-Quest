-- ============================================================
-- Admin Dashboard Performance Indexes
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Speed up role lookups during login (AuthContext)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON public.user_roles(user_id);

-- Speed up dashboard queries that filter by completed_at (HeroStatCards, RecentActivityFeed)
CREATE INDEX IF NOT EXISTS idx_student_progress_completed_at
  ON public.student_progress(completed_at DESC)
  WHERE status = 'completed';

-- Speed up quiz lookup by lesson (QuizManager, LessonViewer)
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id
  ON public.quizzes(lesson_id);

-- Speed up student progress aggregation (StudentDashboard, ClassOverview, SchoolAnalytics)
CREATE INDEX IF NOT EXISTS idx_student_progress_user_status
  ON public.student_progress(user_id, status);

-- Verify: These should already exist from previous migrations
-- idx_profiles_school ON profiles(school_id)
-- idx_student_progress_user_id ON student_progress(user_id)
-- idx_lessons_subject_id ON lessons(subject_id)
-- idx_quiz_questions_quiz_id ON quiz_questions(quiz_id)
-- idx_profiles_roll_number ON profiles(roll_number)

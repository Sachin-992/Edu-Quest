-- ============================================================
-- MIGRATION: Security Hardening — FK constraints + Indexes
-- Run in Supabase SQL Editor after the initial setup
-- ============================================================

-- 1. Add FK constraints on user_id columns (5 tables)
-- These prevent orphaned data when users are deleted.

-- student_progress
ALTER TABLE public.student_progress
  ADD CONSTRAINT fk_student_progress_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- adventure_progress
ALTER TABLE public.adventure_progress
  ADD CONSTRAINT fk_adventure_progress_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- coin_transactions
ALTER TABLE public.coin_transactions
  ADD CONSTRAINT fk_coin_transactions_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- study_sessions
ALTER TABLE public.study_sessions
  ADD CONSTRAINT fk_study_sessions_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- student_avatar_items
ALTER TABLE public.student_avatar_items
  ADD CONSTRAINT fk_student_avatar_items_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- 2. Add indexes on hot query columns

-- Student progress lookups (every dashboard load)
CREATE INDEX IF NOT EXISTS idx_student_progress_user_id
  ON public.student_progress(user_id);

-- Profile lookups by school (admin views)
CREATE INDEX IF NOT EXISTS idx_profiles_school_active
  ON public.profiles(school_id, is_active);

-- Subject browsing by class level
CREATE INDEX IF NOT EXISTS idx_subjects_class_active
  ON public.subjects(class_level, is_active);

-- Lesson lookups by subject
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id
  ON public.lessons(subject_id);

-- Quiz question lookups by quiz
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id
  ON public.quiz_questions(quiz_id);

-- Adventure progress lookups
CREATE INDEX IF NOT EXISTS idx_adventure_progress_user_id
  ON public.adventure_progress(user_id);

-- Coin transaction lookups
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id
  ON public.coin_transactions(user_id);

-- Study session lookups
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id
  ON public.study_sessions(user_id);

-- Roll number lookup for student login
CREATE INDEX IF NOT EXISTS idx_profiles_roll_number
  ON public.profiles(roll_number);


-- ============================================================
-- DONE. FK constraints and indexes created.
-- ============================================================

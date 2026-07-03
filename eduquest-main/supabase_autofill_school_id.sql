-- ==============================================================================
-- FIX: AUTO-FILL SCHOOL_ID FOR PROPER ANALYTICS AND RLS
-- Run this in the Supabase SQL Editor to permanently fix the zeroed analytics
-- ==============================================================================

-- 1. Backfill any existing data that was inserted while the frontend was missing the ID
UPDATE public.student_progress sp SET school_id = p.school_id FROM public.profiles p WHERE p.user_id = sp.user_id AND sp.school_id IS NULL;
UPDATE public.adventure_progress ap SET school_id = p.school_id FROM public.profiles p WHERE p.user_id = ap.user_id AND ap.school_id IS NULL;
UPDATE public.coin_transactions ct SET school_id = p.school_id FROM public.profiles p WHERE p.user_id = ct.user_id AND ct.school_id IS NULL;
UPDATE public.study_sessions ss SET school_id = p.school_id FROM public.profiles p WHERE p.user_id = ss.user_id AND ss.school_id IS NULL;

-- 2. Create an automated backend function to ALWAYS assign the student's school_id silently
CREATE OR REPLACE FUNCTION public.auto_fill_school_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.school_id IS NULL THEN
    SELECT school_id INTO NEW.school_id FROM public.profiles WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach the automatons to all tracking tables so the React frontend never has to worry about it
DROP TRIGGER IF EXISTS trg_student_progress_school_id ON public.student_progress;
CREATE TRIGGER trg_student_progress_school_id BEFORE INSERT OR UPDATE ON public.student_progress FOR EACH ROW EXECUTE FUNCTION public.auto_fill_school_id();

DROP TRIGGER IF EXISTS trg_adventure_progress_school_id ON public.adventure_progress;
CREATE TRIGGER trg_adventure_progress_school_id BEFORE INSERT OR UPDATE ON public.adventure_progress FOR EACH ROW EXECUTE FUNCTION public.auto_fill_school_id();

DROP TRIGGER IF EXISTS trg_coin_transactions_school_id ON public.coin_transactions;
CREATE TRIGGER trg_coin_transactions_school_id BEFORE INSERT OR UPDATE ON public.coin_transactions FOR EACH ROW EXECUTE FUNCTION public.auto_fill_school_id();

DROP TRIGGER IF EXISTS trg_study_sessions_school_id ON public.study_sessions;
CREATE TRIGGER trg_study_sessions_school_id BEFORE INSERT OR UPDATE ON public.study_sessions FOR EACH ROW EXECUTE FUNCTION public.auto_fill_school_id();

-- Done! Analytics will instantly populate.

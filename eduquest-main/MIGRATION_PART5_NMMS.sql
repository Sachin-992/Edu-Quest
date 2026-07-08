-- ============================================================
-- EDUQUEST — MIGRATION PART 5: NMMS Preparation Module
-- Project: oeaowgbycenftvhwonyb
--
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ── 1. NMMS QUESTIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nmms_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_type VARCHAR(3) NOT NULL CHECK (paper_type IN ('MAT', 'SAT')),
  subject VARCHAR(50),
  chapter VARCHAR(100),
  topic VARCHAR(100),
  question_text TEXT NOT NULL,
  question_text_ta TEXT,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_a_ta TEXT,
  option_b_ta TEXT,
  option_c_ta TEXT,
  option_d_ta TEXT,
  correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  explanation TEXT,
  explanation_ta TEXT,
  hint TEXT,
  hint_ta TEXT,
  difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  question_type VARCHAR(30),
  source VARCHAR(30) DEFAULT 'ai_generated',
  year INT,
  estimated_seconds INT DEFAULT 60,
  marks INT DEFAULT 1,
  bloom_level VARCHAR(20),
  tags TEXT[] DEFAULT '{}',
  class_level INT DEFAULT 8 CHECK (class_level IN (7, 8)),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nmms_q_paper ON public.nmms_questions(paper_type);
CREATE INDEX IF NOT EXISTS idx_nmms_q_subject ON public.nmms_questions(subject);
CREATE INDEX IF NOT EXISTS idx_nmms_q_chapter ON public.nmms_questions(chapter);
CREATE INDEX IF NOT EXISTS idx_nmms_q_difficulty ON public.nmms_questions(difficulty);

ALTER TABLE public.nmms_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read nmms questions" ON public.nmms_questions;
CREATE POLICY "Anyone can read nmms questions" ON public.nmms_questions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage nmms questions" ON public.nmms_questions;
CREATE POLICY "Admins can manage nmms questions" ON public.nmms_questions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));


-- ── 2. NMMS SESSIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nmms_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('mock_test','practice','daily_challenge','previous_paper')),
  paper_type VARCHAR(4) CHECK (paper_type IN ('MAT','SAT','FULL')),
  subject VARCHAR(50),
  total_questions INT NOT NULL,
  answered INT DEFAULT 0,
  correct INT DEFAULT 0,
  wrong INT DEFAULT 0,
  skipped INT DEFAULT 0,
  time_taken_seconds INT DEFAULT 0,
  time_limit_seconds INT,
  score INT DEFAULT 0,
  max_score INT,
  xp_earned INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  paper_year INT,
  is_completed BOOLEAN DEFAULT false,
  answers JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_nmms_sess_user ON public.nmms_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_nmms_sess_type ON public.nmms_sessions(session_type);

ALTER TABLE public.nmms_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own nmms sessions" ON public.nmms_sessions;
CREATE POLICY "Users can view own nmms sessions" ON public.nmms_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create own nmms sessions" ON public.nmms_sessions;
CREATE POLICY "Users can create own nmms sessions" ON public.nmms_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own nmms sessions" ON public.nmms_sessions;
CREATE POLICY "Users can update own nmms sessions" ON public.nmms_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());


-- ── 3. NMMS PROGRESS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nmms_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paper_type VARCHAR(3) NOT NULL,
  subject VARCHAR(50),
  chapter VARCHAR(100) NOT NULL,
  questions_attempted INT DEFAULT 0,
  questions_correct INT DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  last_practiced TIMESTAMPTZ,
  is_weak_chapter BOOLEAN DEFAULT false,
  mastery_level INT DEFAULT 0,
  UNIQUE(user_id, paper_type, chapter)
);

CREATE INDEX IF NOT EXISTS idx_nmms_prog_user ON public.nmms_progress(user_id);

ALTER TABLE public.nmms_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own nmms progress" ON public.nmms_progress;
CREATE POLICY "Users can view own nmms progress" ON public.nmms_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can manage own nmms progress" ON public.nmms_progress;
CREATE POLICY "Users can manage own nmms progress" ON public.nmms_progress
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ── 4. NMMS DAILY CHALLENGES ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nmms_daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE NOT NULL UNIQUE,
  question_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.nmms_daily_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read nmms daily challenges" ON public.nmms_daily_challenges;
CREATE POLICY "Anyone can read nmms daily challenges" ON public.nmms_daily_challenges
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage nmms daily challenges" ON public.nmms_daily_challenges;
CREATE POLICY "Admins can manage nmms daily challenges" ON public.nmms_daily_challenges
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));


-- ── 5. NMMS DAILY COMPLETIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nmms_daily_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES public.nmms_daily_challenges(id),
  score INT DEFAULT 0,
  total INT DEFAULT 10,
  xp_earned INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.nmms_daily_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own nmms daily completions" ON public.nmms_daily_completions;
CREATE POLICY "Users can view own nmms daily completions" ON public.nmms_daily_completions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can insert own nmms daily completions" ON public.nmms_daily_completions;
CREATE POLICY "Users can insert own nmms daily completions" ON public.nmms_daily_completions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());


SELECT '✅ MIGRATION PART 5 COMPLETE — NMMS tables ready!' AS status;

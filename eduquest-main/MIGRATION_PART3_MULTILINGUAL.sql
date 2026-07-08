-- ============================================================
-- EDUQUEST — MIGRATION PART 3 (Multilingual Questions & Stories)
-- New Project: oeaowgbycenftvhwonyb
--
-- Run this script in your Supabase SQL Editor first.
-- ============================================================

-- ── 1. CORE QUESTIONS TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(50) NOT NULL, -- e.g., 'science_lab', 'vocabulary', 'gk_quiz'
    grade_level INT NOT NULL,     -- e.g., 1 to 12
    difficulty VARCHAR(20) DEFAULT 'medium',
    correct_option_key VARCHAR(10) NOT NULL, -- 'option_a', 'option_b', 'option_c', 'option_d'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. QUESTION TRANSLATIONS TABLE ───────────────────────────
CREATE TABLE IF NOT EXISTS public.question_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL, -- 'en', 'ta'
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT,                     -- Nullable for true/false
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(question_id, language_code) -- Exactly one translation per language per question
);

-- Index for fast multilingual query joins
CREATE INDEX IF NOT EXISTS idx_q_translations_lang ON public.question_translations(question_id, language_code);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.questions;
CREATE POLICY "Enable read access for all users" ON public.questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON public.question_translations;
CREATE POLICY "Enable read access for all users" ON public.question_translations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
CREATE POLICY "Admins can manage questions" ON public.questions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'school_admin'));

DROP POLICY IF EXISTS "Admins can manage question_translations" ON public.question_translations;
CREATE POLICY "Admins can manage question_translations" ON public.question_translations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'school_admin'));


-- ── 3. STORIES TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL, -- Unique identifier e.g., 'story_magic_sandbox'
    subject VARCHAR(50) NOT NULL,
    emoji VARCHAR(10),
    min_class INT NOT NULL,
    max_class INT NOT NULL,
    xp_reward INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. STORY TRANSLATIONS TABLE ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.story_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL, -- 'en', 'ta'
    title TEXT NOT NULL,
    pages JSONB NOT NULL DEFAULT '[]',     -- Array of {text, character, keywords, thinkMoment}
    questions JSONB NOT NULL DEFAULT '[]', -- Array of 10 {question, options, answer}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, language_code)
);

-- Index for fast story lookups
CREATE INDEX IF NOT EXISTS idx_s_translations_lang ON public.story_translations(story_id, language_code);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stories;
CREATE POLICY "Enable read access for all users" ON public.stories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON public.story_translations;
CREATE POLICY "Enable read access for all users" ON public.story_translations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage stories" ON public.stories;
CREATE POLICY "Admins can manage stories" ON public.stories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'school_admin'));

DROP POLICY IF EXISTS "Admins can manage story_translations" ON public.story_translations;
CREATE POLICY "Admins can manage story_translations" ON public.story_translations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'school_admin'));


SELECT '✅ MIGRATION PART 3 COMPLETE - Multilingual tables ready!' AS status;

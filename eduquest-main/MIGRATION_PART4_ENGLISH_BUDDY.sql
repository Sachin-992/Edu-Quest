-- ============================================================
-- EDUQUEST — MIGRATION PART 4 (English Buddy Tables)
-- New Project: oeaowgbycenftvhwonyb
--
-- Run this script in your Supabase SQL Editor.
-- ============================================================

-- ── 1. ENGLISH BUDDY LESSONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.english_buddy_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL, -- e.g., 'Hospitality', 'Restaurant', 'Airport'
    level VARCHAR(20) NOT NULL,    -- 'beginner', 'intermediate', 'advanced'
    title TEXT NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    content JSONB NOT NULL DEFAULT '[]', -- Dialogue lines array
    practice_game JSONB NOT NULL DEFAULT '{}',
    real_usage JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.english_buddy_lessons ENABLE ROW LEVEL SECURITY;

-- Policies for Lessons
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.english_buddy_lessons;
CREATE POLICY "Enable read access for all authenticated users" ON public.english_buddy_lessons
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage lessons" ON public.english_buddy_lessons;
CREATE POLICY "Admins can manage lessons" ON public.english_buddy_lessons
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'teacher'));


-- ── 2. ENGLISH BUDDY WORDS OF THE DAY ───────────────────────
CREATE TABLE IF NOT EXISTS public.english_buddy_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL,
    meaning TEXT NOT NULL,
    pronunciation TEXT,
    emoji TEXT,
    example_sentence TEXT,
    explanation TEXT,
    date DATE NOT NULL UNIQUE, -- Only one word of the day per calendar date
    synonyms TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.english_buddy_words ENABLE ROW LEVEL SECURITY;

-- Policies for Words
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.english_buddy_words;
CREATE POLICY "Enable read access for all authenticated users" ON public.english_buddy_words
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage words" ON public.english_buddy_words;
CREATE POLICY "Admins can manage words" ON public.english_buddy_words
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'teacher'));


-- ── 3. ENGLISH BUDDY WORD COMPLETIONS (Student Log) ─────────
CREATE TABLE IF NOT EXISTS public.english_buddy_word_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    word_id UUID REFERENCES public.english_buddy_words(id) ON DELETE CASCADE NOT NULL,
    user_sentence TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, word_id) -- Prevent completing the same word twice
);

-- Enable RLS
ALTER TABLE public.english_buddy_word_completions ENABLE ROW LEVEL SECURITY;

-- Policies for Word Completions
DROP POLICY IF EXISTS "Users can view their own completions" ON public.english_buddy_word_completions;
CREATE POLICY "Users can view their own completions" ON public.english_buddy_word_completions
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "Users can log their own completions" ON public.english_buddy_word_completions;
CREATE POLICY "Users can log their own completions" ON public.english_buddy_word_completions
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());


-- ── 4. ENGLISH BUDDY STREAKS (Student Streak Tracking) ───────
CREATE TABLE IF NOT EXISTS public.english_buddy_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    streak_count INT DEFAULT 0,
    last_activity_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.english_buddy_streaks ENABLE ROW LEVEL SECURITY;

-- Policies for Streaks
DROP POLICY IF EXISTS "Users can view their own streak" ON public.english_buddy_streaks;
CREATE POLICY "Users can view their own streak" ON public.english_buddy_streaks
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "Users can manage their own streak" ON public.english_buddy_streaks;
CREATE POLICY "Users can manage their own streak" ON public.english_buddy_streaks
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


SELECT '✅ MIGRATION PART 4 COMPLETE - English Buddy tables ready!' AS status;

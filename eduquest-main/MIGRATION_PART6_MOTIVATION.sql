-- ============================================================
-- EDUQUEST — MIGRATION PART 6: Student Motivation & Milestone System (SMMS)
-- Project: oeaowgbycenftvhwonyb
--
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ── 1. STUDENT MILESTONE PROGRESS ───────────────────────────
CREATE TABLE IF NOT EXISTS public.student_milestone_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    current_chapter INT DEFAULT 1,
    current_level INT DEFAULT 1,
    cumulative_xp INT DEFAULT 0,
    academic_rating INT DEFAULT 800, -- Chess.com-style Elo Rating
    chapter_xp_earned INT DEFAULT 0,
    chapter_xp_required INT DEFAULT 1000,
    knowledge_points INT DEFAULT 0,
    skill_stars INT DEFAULT 0,
    wisdom_points INT DEFAULT 0,
    scholar_points INT DEFAULT 0,
    last_milestone_claim_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_s_milestone_user ON public.student_milestone_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_s_milestone_rating ON public.student_milestone_progress(academic_rating);

ALTER TABLE public.student_milestone_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own milestone progress" ON public.student_milestone_progress;
CREATE POLICY "Users can view own milestone progress" ON public.student_milestone_progress
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "Users can update own milestone progress" ON public.student_milestone_progress;
CREATE POLICY "Users can update own milestone progress" ON public.student_milestone_progress
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());


-- ── 2. DAILY MISSIONS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mission_date DATE DEFAULT CURRENT_DATE,
    objectives JSONB NOT NULL, -- list of daily challenge items
    reward_claimed BOOLEAN DEFAULT FALSE,
    xp_reward INT DEFAULT 100,
    coin_reward INT DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_d_missions_user ON public.daily_missions(student_id);
CREATE INDEX IF NOT EXISTS idx_d_missions_date ON public.daily_missions(mission_date);

ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own daily missions" ON public.daily_missions;
CREATE POLICY "Users can view own daily missions" ON public.daily_missions
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "Users can manage own daily missions" ON public.daily_missions;
CREATE POLICY "Users can manage own daily missions" ON public.daily_missions
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());


-- ── 3. SEASON PASS PROGRESS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.season_pass_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    season_id VARCHAR(50) NOT NULL,
    current_tier INT DEFAULT 1,
    unlocked_tiers INT[] DEFAULT ARRAY[1],
    claimed_rewards INT[] DEFAULT '{}',
    keys_earned INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_s_pass_user ON public.season_pass_progress(student_id);

ALTER TABLE public.season_pass_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own season progress" ON public.season_pass_progress;
CREATE POLICY "Users can view own season progress" ON public.season_pass_progress
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "Users can update own season progress" ON public.season_pass_progress;
CREATE POLICY "Users can update own season progress" ON public.season_pass_progress
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());


-- ── 4. WEEKLY LEAGUES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_name VARCHAR(50) NOT NULL CHECK (league_name IN ('Bronze', 'Silver', 'Gold', 'Sapphire', 'Diamond')),
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_w_leagues_active ON public.weekly_leagues(is_active);

ALTER TABLE public.weekly_leagues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read weekly leagues" ON public.weekly_leagues;
CREATE POLICY "Anyone can read weekly leagues" ON public.weekly_leagues
  FOR SELECT TO authenticated USING (true);


-- ── 5. WEEKLY LEAGUE PARTICIPANTS ───────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_league_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID REFERENCES public.weekly_leagues(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    weekly_xp_earned INT DEFAULT 0,
    is_promoted BOOLEAN DEFAULT FALSE,
    is_demoted BOOLEAN DEFAULT FALSE,
    last_active TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wl_participant_user ON public.weekly_league_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_wl_participant_league ON public.weekly_league_participants(league_id);

ALTER TABLE public.weekly_league_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own league standings" ON public.weekly_league_participants;
CREATE POLICY "Users can view own league standings" ON public.weekly_league_participants
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "Users can update own league xp" ON public.weekly_league_participants;
CREATE POLICY "Users can update own league xp" ON public.weekly_league_participants
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());


-- ── 6. AUTO-CREATE SYSTEM INITIALIZER ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_student_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.student_milestone_progress (student_id)
    VALUES (NEW.user_id)
    ON CONFLICT (student_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger safely
DROP TRIGGER IF EXISTS on_student_profile_created ON public.profiles;
CREATE TRIGGER on_student_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_student_progress();

-- ── 7. BACKFILL EXISTING PROFILES ─────────────────────────────
INSERT INTO public.student_milestone_progress (student_id)
SELECT user_id FROM public.profiles
ON CONFLICT (student_id) DO NOTHING;

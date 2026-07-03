-- ============================================================
-- EDUSPARK QUEST — FULL DATABASE SETUP
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- Project: lsmrnujbrsaqlspbvezs
-- ============================================================

-- ==========================================
-- MIGRATION 1: Core tables (roles, schools, profiles, user_roles)
-- ==========================================

-- Role enum
CREATE TYPE public.app_role AS ENUM ('student', 'admin', 'super_admin');

-- Schools table (multi-tenancy ready)
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  roll_number TEXT,
  class_level INT CHECK (class_level >= 1 AND class_level <= 8),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, roll_number)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate from profiles!)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile AND assign default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User')
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Auto-assign default 'student' role (admins upgraded later)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Schools: anyone authenticated can read
CREATE POLICY "Authenticated users can view schools"
  ON public.schools FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage schools"
  ON public.schools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Profiles: users see own, admins see all in school
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- User roles: only admins can manage, users can read own
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Insert a default school for demo
INSERT INTO public.schools (name, code) VALUES ('Demo School', 'DEMO001');


-- ==========================================
-- MIGRATION 2: Learning tables (subjects, lessons, quizzes, progress)
-- ==========================================

-- SUBJECTS TABLE
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_tamil TEXT,
  description TEXT,
  icon TEXT DEFAULT '📚',
  color TEXT DEFAULT 'bg-primary',
  class_level INTEGER NOT NULL,
  school_id UUID REFERENCES public.schools(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view active subjects for their class"
  ON public.subjects FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage subjects"
  ON public.subjects FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- LESSONS TABLE
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_tamil TEXT,
  content TEXT,
  content_tamil TEXT,
  lesson_order INTEGER NOT NULL DEFAULT 0,
  lesson_type TEXT NOT NULL DEFAULT 'reading' CHECK (lesson_type IN ('reading', 'video', 'interactive', 'game')),
  xp_reward INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view active lessons"
  ON public.lessons FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage lessons"
  ON public.lessons FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- QUIZZES TABLE
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_tamil TEXT,
  quiz_type TEXT NOT NULL DEFAULT 'mcq' CHECK (quiz_type IN ('mcq', 'true_false', 'fill_blank', 'match', 'mixed')),
  xp_reward INTEGER NOT NULL DEFAULT 20,
  passing_score INTEGER NOT NULL DEFAULT 70,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view active quizzes"
  ON public.quizzes FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage quizzes"
  ON public.quizzes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- QUIZ QUESTIONS TABLE
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_text_tamil TEXT,
  question_type TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'true_false', 'fill_blank')),
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  explanation_tamil TEXT,
  question_order INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view quiz questions"
  ON public.quiz_questions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage quiz questions"
  ON public.quiz_questions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- STUDENT PROGRESS TABLE
CREATE TABLE public.student_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score INTEGER,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id),
  UNIQUE(user_id, quiz_id)
);

ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own progress"
  ON public.student_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Students can insert own progress"
  ON public.student_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can update own progress"
  ON public.student_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all progress"
  ON public.student_progress FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_student_progress_updated_at
  BEFORE UPDATE ON public.student_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- SEED DATA: Sample subjects for Class 7
-- ==========================================
INSERT INTO public.subjects (name, name_tamil, description, icon, color, class_level, sort_order) VALUES
  ('Mathematics', 'கணிதம்', 'Numbers, algebra, geometry and more', '🔢', 'bg-edu-blue', 7, 1),
  ('Science', 'அறிவியல்', 'Physics, chemistry and biology', '🔬', 'bg-edu-green', 7, 2),
  ('Tamil', 'தமிழ்', 'Tamil language, literature and grammar', '📝', 'bg-tamil-gold', 7, 3),
  ('English', 'ஆங்கிலம்', 'English language and literature', '📖', 'bg-edu-purple', 7, 4),
  ('Social Science', 'சமூக அறிவியல்', 'History, geography and civics', '🌍', 'bg-edu-orange', 7, 5);

-- Seed sample lessons for Mathematics
INSERT INTO public.lessons (subject_id, title, title_tamil, content, content_tamil, lesson_order, xp_reward)
SELECT 
  s.id,
  lesson.title,
  lesson.title_tamil,
  lesson.content,
  lesson.content_tamil,
  lesson.lesson_order,
  lesson.xp_reward
FROM public.subjects s
CROSS JOIN (VALUES
  ('Integers', 'முழு எண்கள்', 'Learn about positive and negative integers, their properties, and operations.', 'நேர்மறை மற்றும் எதிர்மறை முழு எண்கள், அவற்றின் பண்புகள் மற்றும் செயல்பாடுகள் பற்றி அறிக.', 1, 15),
  ('Fractions and Decimals', 'பின்னங்கள் மற்றும் தசமங்கள்', 'Understanding fractions, decimals and their interconversion.', 'பின்னங்கள், தசமங்கள் மற்றும் அவற்றின் மாற்றம் பற்றி புரிந்துகொள்ளுதல்.', 2, 15),
  ('Algebraic Expressions', 'இயற்கணித கோவைகள்', 'Introduction to variables, constants and algebraic expressions.', 'மாறிகள், மாறிலிகள் மற்றும் இயற்கணித கோவைகள் அறிமுகம்.', 3, 20)
) AS lesson(title, title_tamil, content, content_tamil, lesson_order, xp_reward)
WHERE s.name = 'Mathematics' AND s.class_level = 7;

-- Seed sample lessons for Tamil
INSERT INTO public.lessons (subject_id, title, title_tamil, content, content_tamil, lesson_order, xp_reward, lesson_type)
SELECT
  s.id,
  lesson.title,
  lesson.title_tamil,
  lesson.content,
  lesson.content_tamil,
  lesson.lesson_order,
  lesson.xp_reward,
  lesson.lesson_type
FROM public.subjects s
CROSS JOIN (VALUES
  ('Tamil Alphabets Revision', 'தமிழ் எழுத்துகள் மறுபார்வை', 'Revise உயிர், மெய், and உயிர்மெய் letters with interactive exercises.', 'உயிர், மெய், உயிர்மெய் எழுத்துகளை ஊடாடும் பயிற்சிகளுடன் மறுபார்வை செய்யுங்கள்.', 1, 15, 'interactive'),
  ('Simple Prose', 'எளிய உரைநடை', 'Read and understand simple Tamil prose passages.', 'எளிய தமிழ் உரைநடை பகுதிகளைப் படித்து புரிந்துகொள்ளுங்கள்.', 2, 15, 'reading'),
  ('Grammar: Noun Types', 'இலக்கணம்: பெயர்ச்சொல் வகைகள்', 'Learn different types of nouns in Tamil grammar.', 'தமிழ் இலக்கணத்தில் பல்வேறு வகையான பெயர்ச்சொற்களைக் கற்றுக்கொள்ளுங்கள்.', 3, 20, 'reading')
) AS lesson(title, title_tamil, content, content_tamil, lesson_order, xp_reward, lesson_type)
WHERE s.name = 'Tamil' AND s.class_level = 7;

-- Seed quiz for first Math lesson
INSERT INTO public.quizzes (lesson_id, title, title_tamil, quiz_type, xp_reward)
SELECT l.id, 'Integers Quiz', 'முழு எண்கள் வினாடி வினா', 'mcq', 25
FROM public.lessons l
JOIN public.subjects s ON s.id = l.subject_id
WHERE s.name = 'Mathematics' AND l.title = 'Integers';

-- Seed quiz questions
INSERT INTO public.quiz_questions (quiz_id, question_text, question_text_tamil, options, correct_answer, explanation, question_order, points)
SELECT q.id, qq.question_text, qq.question_text_tamil, qq.options::jsonb, qq.correct_answer, qq.explanation, qq.question_order, qq.points
FROM public.quizzes q
JOIN public.lessons l ON l.id = q.lesson_id
CROSS JOIN (VALUES
  ('What is -3 + 5?', '(-3) + 5 = ?', '["2", "-2", "8", "-8"]', '2', 'Adding a positive number to a negative: -3 + 5 = 2', 1, 10),
  ('Which is the smallest integer: -5, 0, 3, -1?', 'மிகச்சிறிய முழு எண்: -5, 0, 3, -1?', '["-5", "0", "-1", "3"]', '-5', '-5 is the smallest because it is furthest to the left on the number line.', 2, 10),
  ('What is (-2) × (-3)?', '(-2) × (-3) = ?', '["6", "-6", "5", "-5"]', '6', 'Negative × Negative = Positive. So (-2) × (-3) = 6', 3, 10),
  ('Is -7 > -3 true or false?', '-7 > -3 சரியா தவறா?', '["True", "False"]', 'False', '-7 is less than -3 on the number line.', 4, 10)
) AS qq(question_text, question_text_tamil, options, correct_answer, explanation, question_order, points)
WHERE l.title = 'Integers';


-- ==========================================
-- MIGRATION 3: Adventure progress
-- ==========================================

CREATE TABLE public.adventure_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  world_id TEXT NOT NULL,
  level_number INTEGER NOT NULL DEFAULT 1,
  stars_earned INTEGER NOT NULL DEFAULT 0,
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_boss_level BOOLEAN NOT NULL DEFAULT false,
  score INTEGER DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, world_id, level_number)
);

ALTER TABLE public.adventure_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own adventure progress"
ON public.adventure_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adventure progress"
ON public.adventure_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adventure progress"
ON public.adventure_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_adventure_progress_updated_at
BEFORE UPDATE ON public.adventure_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- ==========================================
-- MIGRATION 4: Leaderboard settings
-- ==========================================

CREATE TABLE public.leaderboard_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id),
  is_visible boolean NOT NULL DEFAULT true,
  mode text NOT NULL DEFAULT 'all_time',
  show_most_improved boolean NOT NULL DEFAULT true,
  reward_most_improved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(school_id)
);

ALTER TABLE public.leaderboard_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage leaderboard settings"
ON public.leaderboard_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Students can view leaderboard settings"
ON public.leaderboard_settings FOR SELECT
USING (true);

CREATE TRIGGER update_leaderboard_settings_updated_at
BEFORE UPDATE ON public.leaderboard_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ==========================================
-- MIGRATION 5: Avatar shop, coins, study sessions
-- ==========================================

-- Avatar items shop
CREATE TABLE public.avatar_items (
  id text PRIMARY KEY,
  category text NOT NULL DEFAULT 'outfit',
  name text NOT NULL,
  icon text NOT NULL DEFAULT '👕',
  cost integer NOT NULL DEFAULT 10,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.avatar_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view avatar items"
  ON public.avatar_items FOR SELECT USING (true);

CREATE POLICY "Admins can manage avatar items"
  ON public.avatar_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Student owned items
CREATE TABLE public.student_avatar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id text NOT NULL REFERENCES public.avatar_items(id) ON DELETE CASCADE,
  is_equipped boolean NOT NULL DEFAULT false,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.student_avatar_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own avatar items"
  ON public.student_avatar_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatar items"
  ON public.student_avatar_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar items"
  ON public.student_avatar_items FOR UPDATE USING (auth.uid() = user_id);

-- Coin transactions
CREATE TABLE public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Study sessions tracking
CREATE TABLE public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.study_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Seed default avatar items
INSERT INTO public.avatar_items (id, category, name, icon, cost, sort_order) VALUES
  ('school-uniform', 'school', 'School Uniform', '👔', 0, 1),
  ('sports-jersey', 'school', 'Sports Jersey', '🏃', 10, 2),
  ('lab-coat', 'school', 'Science Lab Coat', '🥼', 25, 3),
  ('art-smock', 'school', 'Artist Smock', '🎨', 15, 4),
  ('head-prefect', 'school', 'Head Prefect Badge', '🎖', 60, 5),
  ('graduation-gown', 'school', 'Graduation Gown', '🎓', 100, 6),
  ('orange-ninja', 'anime', 'Orange Ninja Set', '🍥', 120, 7),
  ('ninja-headband', 'anime', 'Ninja Headband', '🥷', 30, 8),
  ('pirate-captain', 'anime', 'Pirate King Captain', '🏴‍☠️', 200, 9),
  ('straw-hat', 'anime', 'Straw Adventure Hat', '👒', 80, 10),
  ('caped-hero', 'anime', 'Caped Hero Outfit', '🦲', 150, 11),
  ('dragon-warrior', 'anime', 'Dragon Warrior Armor', '🐉', 140, 12),
  ('shadow-slayer', 'anime', 'Shadow Slayer Cloak', '⚔️', 90, 13),
  ('titan-scout', 'anime', 'Titan Scout Uniform', '🛡️', 85, 14),
  ('spirit-samurai', 'anime', 'Spirit Samurai Set', '🗡️', 180, 15),
  ('moon-sailor', 'anime', 'Moon Guardian Outfit', '🌙', 130, 16),
  ('crystal-mage', 'anime', 'Crystal Mage Robe', '🔮', 75, 17),
  ('spider-hero', 'superhero', 'Spider Hero Suit', '🕷️', 130, 18),
  ('dark-bat', 'superhero', 'Dark Bat Armor', '🦇', 140, 19),
  ('thunder-god', 'superhero', 'Thunder God Cape', '⚡', 180, 20),
  ('iron-tech', 'superhero', 'Iron Tech Armor', '🤖', 160, 21),
  ('shield-captain', 'superhero', 'Shield Captain Suit', '🛡️', 95, 22),
  ('wonder-warrior', 'superhero', 'Wonder Warrior Armor', '👸', 130, 23),
  ('speed-flash', 'superhero', 'Speed Flash Suit', '💨', 85, 24),
  ('green-archer', 'superhero', 'Forest Archer Hood', '🏹', 50, 25),
  ('wizard-school', 'fantasy', 'Wizard School Outfit', '🧙', 120, 26),
  ('wizard-hat', 'fantasy', 'Sorting Wizard Hat', '🎩', 70, 27),
  ('elf-ranger', 'fantasy', 'Elf Ranger Cloak', '🧝', 80, 28),
  ('dragon-rider', 'fantasy', 'Dragon Rider Armor', '🐲', 200, 29),
  ('fairy-wings', 'fantasy', 'Sparkle Fairy Wings', '🧚', 110, 30),
  ('knight-armor', 'fantasy', 'Royal Knight Armor', '⚔️', 90, 31),
  ('ice-queen', 'fantasy', 'Ice Queen Gown', '❄️', 130, 32),
  ('dark-mage', 'fantasy', 'Dark Mage Robes', '🌑', 75, 33),
  ('explorer-hat', 'adventure', 'Explorer Archaeologist', '🤠', 70, 34),
  ('secret-agent', 'adventure', 'Secret Agent Tuxedo', '🕶️', 110, 35),
  ('kung-fu', 'adventure', 'Kung Fu Master Outfit', '🥋', 80, 36),
  ('masked-heist', 'adventure', 'Masked Heist Suit', '🎭', 120, 37),
  ('space-explorer', 'adventure', 'Space Explorer Suit', '🚀', 85, 38),
  ('jungle-safari', 'adventure', 'Jungle Safari Outfit', '🌿', 40, 39),
  ('deep-sea-diver', 'adventure', 'Deep Sea Diver', '🤿', 75, 40),
  ('dino-costume', 'funny', 'Dino Costume', '🦕', 35, 41),
  ('robot-suit', 'funny', 'Robot Explorer', '🤖', 40, 42),
  ('banana-suit', 'funny', 'Banana Suit', '🍌', 20, 43),
  ('pizza-hat', 'funny', 'Pizza Party Hat', '🍕', 15, 44),
  ('penguin-suit', 'funny', 'Penguin Tuxedo', '🐧', 30, 45),
  ('ufo-alien', 'funny', 'UFO Alien Suit', '👽', 65, 46),
  ('cat-onesie', 'funny', 'Cat Onesie', '🐱', 35, 47),
  ('panda-hoodie', 'funny', 'Panda Hoodie', '🐼', 30, 48),
  ('casual-cool', 'outfit', 'Casual Cool', '😎', 10, 49),
  ('royal-prince', 'outfit', 'Royal Prince', '🤴', 80, 50),
  ('royal-princess', 'outfit', 'Royal Princess', '👸', 80, 51),
  ('rock-star', 'outfit', 'Rock Star Outfit', '🎸', 45, 52),
  ('hip-hop', 'outfit', 'Hip Hop Style', '🎤', 40, 53),
  ('beach-vibes', 'outfit', 'Beach Vibes', '🏖️', 20, 54),
  ('winter-cozy', 'outfit', 'Winter Cozy', '🧥', 15, 55),
  ('reading-glasses', 'accessory', 'Reading Glasses', '🤓', 10, 56),
  ('cool-shades', 'accessory', 'Cool Shades', '😎', 15, 57),
  ('magic-wand', 'accessory', 'Magic Wand', '🪄', 35, 58),
  ('pet-dragon', 'accessory', 'Pet Dragon', '🐉', 100, 59),
  ('golden-trophy', 'accessory', 'Golden Trophy', '🏆', 75, 60),
  ('angel-wings', 'accessory', 'Angel Wings', '👼', 120, 61),
  ('katana-blade', 'accessory', 'Katana Blade', '⚔️', 70, 62),
  ('shield-guard', 'accessory', 'Guardian Shield', '🛡️', 45, 63),
  ('treasure-map', 'accessory', 'Treasure Map', '🗺️', 30, 64),
  ('boombox', 'accessory', 'Boombox', '📻', 40, 65),
  ('classic-hair', 'hairstyle', 'Classic', '💇', 0, 66),
  ('spiky-hair', 'hairstyle', 'Spiky Power', '⚡', 20, 67),
  ('rainbow-hair', 'hairstyle', 'Rainbow Burst', '🌈', 50, 68),
  ('crown-braid', 'hairstyle', 'Crown Braid', '👸', 30, 69),
  ('flame-hair', 'hairstyle', 'Flame Hair', '🔥', 90, 70),
  ('galaxy-hair', 'hairstyle', 'Galaxy Waves', '🌌', 60, 71),
  ('ninja-hair', 'hairstyle', 'Ninja Spikes', '🍃', 35, 72),
  ('afro-power', 'hairstyle', 'Afro Power', '✊', 25, 73);


-- ==========================================
-- DONE! All tables, policies, triggers, and seed data created.
-- ==========================================

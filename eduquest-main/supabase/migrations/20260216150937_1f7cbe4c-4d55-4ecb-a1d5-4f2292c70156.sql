
-- ==========================================
-- SUBJECTS TABLE
-- ==========================================
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

-- ==========================================
-- LESSONS TABLE
-- ==========================================
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

-- ==========================================
-- QUIZZES TABLE
-- ==========================================
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_tamil TEXT,
  quiz_type TEXT NOT NULL DEFAULT 'mcq' CHECK (quiz_type IN ('mcq', 'true_false', 'fill_blank', 'match')),
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

-- ==========================================
-- QUIZ QUESTIONS TABLE
-- ==========================================
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

-- ==========================================
-- STUDENT PROGRESS TABLE
-- ==========================================
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
-- SEED: Sample subjects for Class 7
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

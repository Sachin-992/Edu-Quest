-- ═══════════════════════════════════════════════════════════════════════════════
-- EDUCORE-OMEGA: GOVERNANCE SCHEMA
-- PART 1: STRICT DATA MODELS
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. EXAMS TABLE (Admin Controlled Structure)
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL, -- e.g. "Unit Test 1 - 2025"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'locked', 'archived')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. UPDATE MARKS TABLE (Link to Exams)
ALTER TABLE marks 
ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Enforce uniqueness: One mark entry per student per exam per subject
-- (Dropping old constraint if exists, or adding new one)
DO $$ BEGIN
    ALTER TABLE marks DROP CONSTRAINT IF EXISTS unique_student_exam_subject;
    ALTER TABLE marks ADD CONSTRAINT unique_student_exam_subject UNIQUE (student_id, exam_id, subject);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. UPDATE ATTENDANCE (Period-wise linking)
-- We reference timetable_periods to ensure it matches a specific slot
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES timetable_periods(id) ON DELETE SET NULL;

-- 4. NOTICES TABLE (Communication Governance)
CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE, -- NULL = School-wide
    type TEXT NOT NULL CHECK (type IN ('homework', 'announcement', 'exam', 'emergency')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. DAILY HOMEWORK TABLE (Strict Subject/Date/Class)
CREATE TABLE IF NOT EXISTS daily_homework (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    homework_date DATE NOT NULL DEFAULT CURRENT_DATE,
    content TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_homework_per_day UNIQUE (class_id, subject_id, homework_date)
);

-- 6. UPDATE ASSIGNMENTS (Submission Modes)
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS submission_mode TEXT NOT NULL DEFAULT 'offline' CHECK (submission_mode IN ('online', 'offline')),
ADD COLUMN IF NOT EXISTS allow_late_submission BOOLEAN NOT NULL DEFAULT FALSE;

-- 7. ENABLE RLS ON NEW TABLES
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_homework ENABLE ROW LEVEL SECURITY;

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_marks_exam ON marks(exam_id);
CREATE INDEX IF NOT EXISTS idx_notices_class ON notices(class_id);
CREATE INDEX IF NOT EXISTS idx_homework_class_date ON daily_homework(class_id, homework_date);

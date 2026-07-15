-- ═══════════════════════════════════════════════════════════════════════════════
-- EDUCORE-OMEGA: EXAM & MARKS PUBLISHING SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Create Exam Marks Approvals Table
CREATE TABLE IF NOT EXISTS exam_marks_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    rejection_reason TEXT,
    release_at TIMESTAMPTZ,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, class, section, subject)
);

-- 2. Add columns to Marks table to support validation, grading, ranks, and release flow
ALTER TABLE marks ADD COLUMN IF NOT EXISTS pass_mark NUMERIC(5,2) DEFAULT 35.0;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS class TEXT;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Medical Leave', 'Withheld', 'Pending Verification'));
ALTER TABLE marks ADD COLUMN IF NOT EXISTS result_status TEXT CHECK (result_status IN ('Pass', 'Fail', 'Absent', 'Medical Leave', 'Withheld', 'Pending Verification'));
ALTER TABLE marks ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft' CHECK (approval_status IN ('draft', 'submitted', 'approved', 'rejected'));
ALTER TABLE marks ADD COLUMN IF NOT EXISTS school_rank INTEGER;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS class_rank INTEGER;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS section_rank INTEGER;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS subject_rank INTEGER;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS release_at TIMESTAMPTZ;

-- 3. Enable RLS on new table
ALTER TABLE exam_marks_approvals ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for exam_marks_approvals
DROP POLICY IF EXISTS "approvals_admin_all" ON exam_marks_approvals;
CREATE POLICY "approvals_admin_all" ON exam_marks_approvals FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "approvals_teacher_all" ON exam_marks_approvals;
CREATE POLICY "approvals_teacher_all" ON exam_marks_approvals FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "approvals_student_parent_read" ON exam_marks_approvals;
CREATE POLICY "approvals_student_parent_read" ON exam_marks_approvals FOR SELECT USING (true);

-- 5. Redefine RLS Policies on marks table to enforce publish date
DROP POLICY IF EXISTS "marks_admin_all" ON marks;
CREATE POLICY "marks_admin_all" ON marks FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "marks_teacher_crud" ON marks;
CREATE POLICY "marks_teacher_crud" ON marks FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "marks_student_read" ON marks;
CREATE POLICY "marks_student_read" ON marks FOR SELECT USING (
    student_id = get_my_student_id() 
    AND approval_status = 'approved' 
    AND (release_at IS NULL OR NOW() >= release_at)
);

DROP POLICY IF EXISTS "marks_parent_read" ON marks;
CREATE POLICY "marks_parent_read" ON marks FOR SELECT USING (
    student_id IN (SELECT get_my_student_ids()) 
    AND approval_status = 'approved' 
    AND (release_at IS NULL OR NOW() >= release_at)
);

-- 6. Ranking Engine Function
CREATE OR REPLACE FUNCTION calculate_exam_rankings(p_exam_id UUID)
RETURNS VOID AS $$
BEGIN
    -- A. Calculate Subject-wise Ranks (School-wide rank for that subject)
    WITH ranked_subjects AS (
        SELECT 
            id,
            RANK() OVER (PARTITION BY exam_type, subject ORDER BY CASE WHEN status = 'Present' THEN marks ELSE -1 END DESC) as s_rank
        FROM marks
        WHERE exam_type = p_exam_id::TEXT
    )
    UPDATE marks m
    SET subject_rank = rs.s_rank
    FROM ranked_subjects rs
    WHERE m.id = rs.id;

    -- B. Calculate School, Class, and Section Ranks (overall sum-of-marks based)
    WITH student_totals AS (
        SELECT 
            student_id,
            class,
            section,
            SUM(marks) as total_marks
        FROM marks
        WHERE exam_type = p_exam_id::TEXT AND status = 'Present'
        GROUP BY student_id, class, section
    ),
    ranked_totals AS (
        SELECT 
            student_id,
            RANK() OVER (ORDER BY total_marks DESC) as s_rank,
            RANK() OVER (PARTITION BY class ORDER BY total_marks DESC) as c_rank,
            RANK() OVER (PARTITION BY class, section ORDER BY total_marks DESC) as sec_rank
        FROM student_totals
    )
    UPDATE marks m
    SET 
        school_rank = rt.s_rank,
        class_rank = rt.c_rank,
        section_rank = rt.sec_rank
    FROM ranked_totals rt
    WHERE m.student_id = rt.student_id AND m.exam_type = p_exam_id::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

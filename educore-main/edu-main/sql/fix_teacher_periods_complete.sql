-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPLETE FIX FOR TEACHER PERIODS AND ATTENDANCE
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- STEP 1: Check total periods count
SELECT 'timetable_periods count' as check_type, COUNT(*) as count FROM timetable_periods;

-- STEP 2: Check teachers
SELECT 'teachers' as table_name, id, name, user_id FROM teachers;

-- STEP 3: Check timetables
SELECT 'timetables' as table_name, id, class_id, status FROM timetables;

-- STEP 4: Check periods with their teacher_id
SELECT 
    'periods' as check_type,
    tp.id,
    tp.teacher_id,
    tp.subject,
    tp.day_of_week,
    tp.period_number,
    t.name as teacher_name
FROM timetable_periods tp
LEFT JOIN teachers t ON t.id = tp.teacher_id;

-- =============================================================================
-- IF THE ABOVE SHOWS 0 PERIODS OR NULL teacher_id, RUN THE FIX BELOW:
-- =============================================================================

-- STEP 5: Insert sample periods for testing (UNCOMMENT AND RUN IF NEEDED)
-- This will create test periods for the first teacher found

/*
DO $$
DECLARE
    v_timetable_id UUID;
    v_teacher_id UUID;
    v_subject_id UUID;
BEGIN
    -- Get first timetable
    SELECT id INTO v_timetable_id FROM timetables LIMIT 1;
    
    -- Get first teacher
    SELECT id INTO v_teacher_id FROM teachers LIMIT 1;
    
    -- Get first subject
    SELECT id INTO v_subject_id FROM subjects LIMIT 1;
    
    IF v_timetable_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
        -- Insert sample periods for Monday (day 1)
        INSERT INTO timetable_periods (
            timetable_id, day_of_week, period_number, 
            subject_id, teacher_id, subject,
            start_time, end_time
        ) VALUES 
        (v_timetable_id, 'Monday', 1, v_subject_id, v_teacher_id, 'English', '09:00', '09:45'),
        (v_timetable_id, 'Monday', 2, v_subject_id, v_teacher_id, 'Mathematics', '09:45', '10:30'),
        (v_timetable_id, 'Tuesday', 1, v_subject_id, v_teacher_id, 'Science', '09:00', '09:45')
        ON CONFLICT (timetable_id, day_of_week, period_number) DO UPDATE 
        SET teacher_id = EXCLUDED.teacher_id,
            subject = EXCLUDED.subject;
        
        RAISE NOTICE 'Created test periods for teacher %', v_teacher_id;
    ELSE
        RAISE NOTICE 'No timetable or teacher found!';
    END IF;
END $$;
*/

-- STEP 6: Verify the fix
SELECT 
    tp.id,
    tp.teacher_id,
    t.name as teacher_name,
    tp.subject,
    tp.day_of_week,
    tp.period_number,
    tt.class_id,
    c.grade_level,
    c.section
FROM timetable_periods tp
LEFT JOIN teachers t ON t.id = tp.teacher_id
LEFT JOIN timetables tt ON tt.id = tp.timetable_id
LEFT JOIN classes c ON c.id = tt.class_id
ORDER BY tp.day_of_week, tp.period_number;

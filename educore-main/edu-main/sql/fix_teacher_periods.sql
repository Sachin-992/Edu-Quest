-- ================================================================
-- FIX: LINK TEACHER PERIODS FOR ATTENDANCE
-- This creates timetable periods for assigned teachers
-- ================================================================

-- 1. First, check if timetables exist for each class
SELECT id, class, section, is_published, created_at 
FROM timetables
WHERE is_published = true
ORDER BY class, section;

-- 2. Check what periods exist
SELECT tp.id, tp.period_number, tp.subject, tp.day_of_week, tp.teacher_id,
       t.class, t.section
FROM timetable_periods tp
JOIN timetables t ON tp.timetable_id = t.id
ORDER BY t.class, t.section, tp.day_of_week, tp.period_number;

-- 3. Check what teachers are assigned to classes
SELECT ca.id, ca.teacher_id, ca.class_id, ca.role,
       c.grade_level, c.section,
       te.name as teacher_name
FROM class_assignments ca
JOIN classes c ON ca.class_id = c.id
JOIN teachers te ON ca.teacher_id = te.id;

-- 4. Find the teacher 'devi' and their ID
SELECT id, name, user_id FROM teachers WHERE LOWER(name) LIKE '%devi%';

-- ================================================================
-- RUN THIS SEPARATELY AFTER GETTING THE TEACHER ID
-- Replace 'YOUR_TEACHER_ID' and 'YOUR_TIMETABLE_ID' with actual UUIDs
-- ================================================================

-- 5. Create sample periods for the teacher (uncomment and run after getting IDs)
/*
-- First get timetable ID for Class 1-A
SELECT id FROM timetables WHERE class = 'Class 1' AND section = 'A';

-- Then insert periods (replace UUIDs)
INSERT INTO timetable_periods (timetable_id, period_number, subject, start_time, end_time, day_of_week, teacher_id)
VALUES 
    ('YOUR_TIMETABLE_ID', 1, 'English', '09:00', '09:45', 1, 'YOUR_TEACHER_ID'),
    ('YOUR_TIMETABLE_ID', 2, 'Mathematics', '09:45', '10:30', 1, 'YOUR_TEACHER_ID'),
    ('YOUR_TIMETABLE_ID', 3, 'Science', '10:45', '11:30', 1, 'YOUR_TEACHER_ID'),
    ('YOUR_TIMETABLE_ID', 1, 'English', '09:00', '09:45', 2, 'YOUR_TEACHER_ID'),
    ('YOUR_TIMETABLE_ID', 2, 'Mathematics', '09:45', '10:30', 2, 'YOUR_TEACHER_ID');
*/

-- 6. QUICK FIX: Auto-create periods from class assignments (if timetable exists)
DO $$
DECLARE
    v_assignment RECORD;
    v_timetable_id UUID;
    v_day INTEGER;
BEGIN
    -- For each class assignment, find timetable and create periods
    FOR v_assignment IN 
        SELECT ca.teacher_id, c.grade_level as class, c.section, te.name
        FROM class_assignments ca
        JOIN classes c ON ca.class_id = c.id
        JOIN teachers te ON ca.teacher_id = te.id
    LOOP
        -- Find matching timetable
        SELECT id INTO v_timetable_id
        FROM timetables 
        WHERE class = 'Class ' || v_assignment.class 
          AND section = v_assignment.section
          AND is_published = true
        LIMIT 1;
        
        IF v_timetable_id IS NOT NULL THEN
            -- Check if periods already exist for this teacher in this timetable
            IF NOT EXISTS (
                SELECT 1 FROM timetable_periods 
                WHERE timetable_id = v_timetable_id AND teacher_id = v_assignment.teacher_id
            ) THEN
                -- Create default periods for Monday-Friday
                FOR v_day IN 1..5 LOOP
                    INSERT INTO timetable_periods (timetable_id, period_number, subject, start_time, end_time, day_of_week, teacher_id)
                    VALUES 
                        (v_timetable_id, 1, 'Period 1', '09:00', '09:45', v_day, v_assignment.teacher_id),
                        (v_timetable_id, 2, 'Period 2', '09:45', '10:30', v_day, v_assignment.teacher_id),
                        (v_timetable_id, 3, 'Period 3', '10:45', '11:30', v_day, v_assignment.teacher_id);
                END LOOP;
                RAISE NOTICE 'Created periods for teacher % in class %-% ', v_assignment.name, v_assignment.class, v_assignment.section;
            END IF;
        ELSE
            RAISE NOTICE 'No published timetable found for Class %-%, skipping teacher %', v_assignment.class, v_assignment.section, v_assignment.name;
        END IF;
    END LOOP;
END $$;

-- 7. Verify periods were created
SELECT tp.id, tp.period_number, tp.subject, tp.day_of_week, 
       t.class, t.section, te.name as teacher_name
FROM timetable_periods tp
JOIN timetables t ON tp.timetable_id = t.id
LEFT JOIN teachers te ON tp.teacher_id = te.id
ORDER BY t.class, t.section, tp.day_of_week, tp.period_number;

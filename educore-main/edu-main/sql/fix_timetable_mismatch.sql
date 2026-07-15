-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: MOVE TIMETABLE FROM CLASS 1 (Generic) TO CLASS 1-A
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor.
-- It moves all timetable entries from "Class 1" (no section) to "Class 1-A".

DO $$
DECLARE
    source_class_id uuid;
    target_class_id uuid;
    moved_count int;
BEGIN
    -- 1. Find the Generic Class 1 (Source)
    SELECT id INTO source_class_id 
    FROM classes 
    WHERE grade_level = '1' AND (section IS NULL OR section = '');

    -- 2. Find the Specific Class 1-A (Target)
    SELECT id INTO target_class_id 
    FROM classes 
    WHERE grade_level = '1' AND section = 'A';

    -- 3. Execute Move
    IF source_class_id IS NOT NULL AND target_class_id IS NOT NULL THEN
        WITH moved AS (
            UPDATE timetable_periods 
            SET class_id = target_class_id 
            WHERE class_id = source_class_id
            RETURNING id
        )
        SELECT COUNT(*) INTO moved_count FROM moved;
        
        RAISE NOTICE 'SUCCESS: Moved % timetable periods from Class 1 to Class 1-A', moved_count;
    
    ELSIF target_class_id IS NULL THEN
        RAISE NOTICE 'ERROR: Target Class 1-A not found. Please create it first.';
    ELSIF source_class_id IS NULL THEN
        RAISE NOTICE 'WARNING: Source Class 1 (Generic) not found. Nothing to move.';
    END IF;
END $$;


-- Deep inspection of dependencies on attendance_periods
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'attendance_periods';

-- Check for any function that contains 'attendance' in its source code
SELECT proname, prosrc 
FROM pg_proc 
WHERE prosrc ILIKE '%attendance_periods%';

-- Check constraints
SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'attendance_periods';

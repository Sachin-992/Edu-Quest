
-- List triggers on attendance_periods
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'attendance_periods';

-- Also check if there are any other triggers in the schema that might be relevant
SELECT 
    event_object_table,
    trigger_name
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('attendance_periods', 'students', 'users');

-- CHECK CONSTRAINTS on timetable_periods
SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'timetable_periods';

-- Also check indexes just in case the unique constraint is an index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'timetable_periods';

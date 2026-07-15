-- CHECK Notifications Table
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'notifications'
);

-- Check Notifications Columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications';

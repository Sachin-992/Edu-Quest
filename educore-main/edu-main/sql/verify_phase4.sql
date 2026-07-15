-- Phase 4: Security & Audit Verification Script
-- Run this in Supabase SQL Editor to verify RLS and Triggers

-- 1. Verify Password Change Restrictions
-- Attempt to change password as a student (should fail if blocked, but here we check the trigger existence)
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'user_identity_secrets';

-- 2. Verify Audit Logs for Timetable Operations
-- Check if recent TIMETABLE_PUBLISH events exist
SELECT * FROM audit_logs 
WHERE action = 'TIMETABLE_PUBLISH' 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Verify Teacher Access to Class Data (RLS)
-- Simulate Teacher View: Should only see assigned classes
-- (This is a manual check or unit test, but we can verify the policy exists)
SELECT * FROM pg_policies 
WHERE tablename = 'class_teacher_assignments';

-- 4. Verify Timetable RLS Policies
SELECT * FROM pg_policies 
WHERE tablename = 'timetables';

-- 5. Check Identity Policy
SELECT * FROM pg_policies 
WHERE tablename = 'user_identity_secrets';

-- ==============================================================================
-- 🚀 EDUCORE-OMEGA FINAL DEPLOYMENT SCRIPT
-- ==============================================================================
-- This script applies all Phase 6 upgrades and ensures the system is audit-ready.
-- Run this in your Supabase SQL Editor.

-- ==============================================================================
-- 1. UPGRADE SCHEMA: Subject-Teacher Assignments
-- ==============================================================================
CREATE TABLE IF NOT EXISTS subject_teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_subject_teacher UNIQUE (subject_id, teacher_id)
);

ALTER TABLE subject_teacher_assignments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "sta_admin_all" ON subject_teacher_assignments FOR ALL USING (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "sta_view_all" ON subject_teacher_assignments FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==============================================================================
-- 2. UPGRADE SCHEMA: Timetable Periods (Activity Support)
-- ==============================================================================
DO $$ BEGIN
    ALTER TABLE timetable_periods ADD COLUMN subject_id UUID REFERENCES subjects(id);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE timetable_periods ADD COLUMN activity_label TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Allow legacy text columns to be null now that we have structural columns
ALTER TABLE timetable_periods ALTER COLUMN subject DROP NOT NULL;
ALTER TABLE timetable_periods ALTER COLUMN teacher_id DROP NOT NULL;

-- ==============================================================================
-- 3. APPLY INTEGRITY CONSTRAINTS (XOR Logic)
-- ==============================================================================
-- Rule: Either (Subject + Teacher) OR (Activity Label) must exist.
ALTER TABLE timetable_periods DROP CONSTRAINT IF EXISTS check_period_content;
ALTER TABLE timetable_periods ADD CONSTRAINT check_period_content CHECK (
    (subject_id IS NOT NULL AND activity_label IS NULL) OR 
    (subject_id IS NULL AND activity_label IS NOT NULL)
);

-- Rule: If Subject is set, Teacher is mandatory.
ALTER TABLE timetable_periods DROP CONSTRAINT IF EXISTS check_teacher_presence;
ALTER TABLE timetable_periods ADD CONSTRAINT check_teacher_presence CHECK (
    (subject_id IS NOT NULL AND teacher_id IS NOT NULL) OR
    (subject_id IS NULL)
);

-- ==============================================================================
-- 4. ENABLE AUDIT LOGGING FOR PERIOD CHANGES
-- ==============================================================================
CREATE OR REPLACE FUNCTION fn_log_timetable_period_change()
RETURNS TRIGGER AS $$
DECLARE
    v_details JSONB;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_details := jsonb_build_object(
            'day', OLD.day_of_week, 
            'period', OLD.period_number, 
            'subject_id', OLD.subject_id, 
            'activity', OLD.activity_label
        );
        INSERT INTO audit_logs (actor_id, actor_role, action, entity, entity_id, details)
        VALUES (current_user_id()::TEXT, 'unknown', 'TIMETABLE_PERIOD_DELETE', 'timetable_periods', OLD.id::TEXT, v_details);
        RETURN OLD;
    ELSE
        v_details := jsonb_build_object(
            'day', NEW.day_of_week, 
            'period', NEW.period_number, 
            'subject_id', NEW.subject_id, 
            'activity', NEW.activity_label, 
            'teacher_id', NEW.teacher_id
        );
        INSERT INTO audit_logs (actor_id, actor_role, action, entity, entity_id, details)
        VALUES (
            current_user_id()::TEXT, 
            'unknown', 
            CASE WHEN TG_OP = 'INSERT' THEN 'TIMETABLE_PERIOD_CREATE' ELSE 'TIMETABLE_PERIOD_UPDATE' END, 
            'timetable_periods', 
            NEW.id::TEXT, 
            v_details
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_period_changes ON timetable_periods;
CREATE TRIGGER trg_audit_period_changes
    AFTER INSERT OR UPDATE OR DELETE ON timetable_periods
    FOR EACH ROW
    EXECUTE FUNCTION fn_log_timetable_period_change();

-- ==============================================================================
-- 5. VERIFY RLS STATUS
-- ==============================================================================
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Done!

-- Phase 6: Advanced Timetable Logic Migration
-- Upgrades schema to support Manual Activities, Subject Links, and Strict Validation

-- 1. Create Subject-Teacher Assignments Table (if missing)
-- Links a specific teacher to a specific subject (e.g. "Mr. Smith" -> "Maths")
CREATE TABLE IF NOT EXISTS subject_teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_subject_teacher UNIQUE (subject_id, teacher_id)
);

ALTER TABLE subject_teacher_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sta_admin_all" ON subject_teacher_assignments;
CREATE POLICY "sta_admin_all" ON subject_teacher_assignments FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "sta_view_all" ON subject_teacher_assignments;
CREATE POLICY "sta_view_all" ON subject_teacher_assignments FOR SELECT USING (TRUE); -- Visible to all for lookup

-- 2. Upgrade Timetable Periods Table
-- Add new columns
DO $$ BEGIN
    ALTER TABLE timetable_periods ADD COLUMN subject_id UUID REFERENCES subjects(id);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE timetable_periods ADD COLUMN activity_label TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 3. Modify Constraints (Allow Nulls for Subject/Teacher if Activity is present)
ALTER TABLE timetable_periods ALTER COLUMN subject DROP NOT NULL;
ALTER TABLE timetable_periods ALTER COLUMN teacher_id DROP NOT NULL;

-- 4. Add Strict Content Integrity Check
-- Rule: MUST have (Subject + Teacher) OR (Activity Label). XOR Logic.
-- ALSO: If Subject is present, Teacher IS required (unless we allow self-study? Prompt says "A timetable period cannot be saved without: Subject... Teacher").
-- Prompt: "A timetable period cannot be saved without: Subject (OR manual activity)" and "Teacher (if subject selected)"
-- Logic: 
-- Case A: Subject ID is SET -> Teacher ID MUST be SET, Activity MUST be NULL.
-- Case B: Activity IS SET -> Subject ID MUST be NULL, Teacher ID MUST be NULL (Prompt: "Manual entry does not require a teacher").
-- Wait, Prompt says "Manual entry ... teacher_id (nullable)".
-- Let's stick to the prompt: "Either subject_id OR activity_label must exist". "FAIL if both are empty. FAIL if both are filled."

ALTER TABLE timetable_periods DROP CONSTRAINT IF EXISTS check_period_content;
ALTER TABLE timetable_periods ADD CONSTRAINT check_period_content CHECK (
    (subject_id IS NOT NULL AND activity_label IS NULL) OR 
    (subject_id IS NULL AND activity_label IS NOT NULL)
);

-- Ensure Teacher is present if Subject is present (as per prompt "Teacher (if subject selected)")
ALTER TABLE timetable_periods DROP CONSTRAINT IF EXISTS check_teacher_presence;
ALTER TABLE timetable_periods ADD CONSTRAINT check_teacher_presence CHECK (
    (subject_id IS NOT NULL AND teacher_id IS NOT NULL) OR
    (subject_id IS NULL) -- If subject is null (Activity mode), teacher can be null (managed by application logic, but loose constraint allows optional chaperones if needed in future, but prompt implies 'no teacher required')
);

-- 5. Audit Logging for New Fields
-- Update the audit function to capture these new fields details if needed. 
-- The existing trigger dumps the whole row or specific fields?
-- Existing `fn_log_timetable_publish` logs the timetable (parent).
-- We need to ensure period updates are logged. 
-- Wait, `timetable_periods` changes usually happen in batch or one-by-one. 
-- Let's add specific audit trigger for `timetable_periods` if not already present.
-- The previous schema didn't have a specific `timetable_periods` trigger in Section G, only `timetables` publish and `attendance`.
-- Requirement: "Log actions: TIMETABLE_PERIOD_CREATE, UPDATE, DELETE".

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

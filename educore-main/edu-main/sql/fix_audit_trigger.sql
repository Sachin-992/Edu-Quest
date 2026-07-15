-- FIX BROKEN TRIGGER FUNCTION
-- The previous function called "current_user_id()" which does not exist.
-- Replacing with "auth.uid()" which is the correct Supabase function.

CREATE OR REPLACE FUNCTION fn_log_timetable_period_change()
RETURNS TRIGGER AS $$
DECLARE
    v_details JSONB;
    v_actor TEXT;
BEGIN
    -- Safely get user ID or default to 'system'
    v_actor := COALESCE(auth.uid()::TEXT, 'system');

    IF TG_OP = 'DELETE' THEN
        v_details := jsonb_build_object(
            'day', OLD.day_of_week, 
            'period', OLD.period_number, 
            'subject_id', OLD.subject_id, 
            'activity', OLD.activity_label
        );
        INSERT INTO audit_logs (actor_id, actor_role, action, entity, entity_id, details)
        VALUES (v_actor, 'unknown', 'TIMETABLE_PERIOD_DELETE', 'timetable_periods', OLD.id::TEXT, v_details);
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
            v_actor, 
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

-- Verification
SELECT 'Trigger Function Repairs' as status;

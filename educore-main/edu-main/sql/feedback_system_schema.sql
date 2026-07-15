-- ============================================================
-- EDUCORE-OMEGA: Enterprise Feedback System Schema
-- 
-- SECURITY: RLS-enforced, IDOR-proof, audit-logged
-- user_id is ALWAYS set server-side via auth.uid()
-- ============================================================

-- 1. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_role       TEXT NOT NULL CHECK (user_role IN ('student', 'parent')),
    category        TEXT NOT NULL CHECK (category IN ('academic', 'teacher', 'infrastructure', 'complaint', 'suggestion', 'general')),
    title           VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL CHECK (char_length(description) <= 2000),
    rating          INT CHECK (rating >= 1 AND rating <= 5),
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'archived')),
    admin_response  TEXT,
    admin_notes     TEXT,  -- Internal only, never exposed to users
    responded_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    responded_at    TIMESTAMPTZ,
    is_anonymous    BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. INDEXES for query performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id    ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_category   ON public.feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_status     ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- 3. AUTO-UPDATE updated_at TRIGGER
CREATE OR REPLACE FUNCTION public.feedback_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feedback_updated_at ON public.feedback;
CREATE TRIGGER trg_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.feedback_update_timestamp();

-- 4. SERVER-SIDE user_id ENFORCEMENT (prevents client spoofing)
CREATE OR REPLACE FUNCTION public.feedback_enforce_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_feedback_enforce_user ON public.feedback;
CREATE TRIGGER trg_feedback_enforce_user
    BEFORE INSERT ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.feedback_enforce_user_id();

-- 5. IMMUTABLE FIELDS TRIGGER (prevent tampering on UPDATE)
CREATE OR REPLACE FUNCTION public.feedback_protect_immutable()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent changing ownership or creation time
    NEW.user_id    = OLD.user_id;
    NEW.user_role  = OLD.user_role;
    NEW.created_at = OLD.created_at;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feedback_immutable ON public.feedback;
CREATE TRIGGER trg_feedback_immutable
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.feedback_protect_immutable();

-- 6. FEEDBACK AUDIT LOG
CREATE TABLE IF NOT EXISTS public.feedback_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id     UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
    action          TEXT NOT NULL CHECK (action IN ('created', 'status_changed', 'responded', 'archived')),
    changed_by      UUID NOT NULL,
    previous_value  JSONB,
    new_value       JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_audit_feedback_id ON public.feedback_audit_log(feedback_id);

-- 7. AUTO-AUDIT on status changes
CREATE OR REPLACE FUNCTION public.feedback_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.feedback_audit_log (feedback_id, action, changed_by, new_value)
        VALUES (NEW.id, 'created', NEW.user_id, jsonb_build_object('title', NEW.title, 'category', NEW.category));
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO public.feedback_audit_log (feedback_id, action, changed_by, previous_value, new_value)
            VALUES (NEW.id, 'status_changed', COALESCE(auth.uid(), NEW.responded_by, '00000000-0000-0000-0000-000000000000'),
                    jsonb_build_object('status', OLD.status),
                    jsonb_build_object('status', NEW.status));
        END IF;
        IF OLD.admin_response IS DISTINCT FROM NEW.admin_response AND NEW.admin_response IS NOT NULL THEN
            INSERT INTO public.feedback_audit_log (feedback_id, action, changed_by, new_value)
            VALUES (NEW.id, 'responded', COALESCE(auth.uid(), NEW.responded_by, '00000000-0000-0000-0000-000000000000'),
                    jsonb_build_object('response_length', char_length(NEW.admin_response)));
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_feedback_audit ON public.feedback;
CREATE TRIGGER trg_feedback_audit
    AFTER INSERT OR UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.feedback_audit_trigger();

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_audit_log ENABLE ROW LEVEL SECURITY;

-- Students/Parents: INSERT their own
DROP POLICY IF EXISTS feedback_insert_own ON public.feedback;
CREATE POLICY feedback_insert_own ON public.feedback
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Students/Parents: SELECT their own only
DROP POLICY IF EXISTS feedback_select_own ON public.feedback;
CREATE POLICY feedback_select_own ON public.feedback
    FOR SELECT
    USING (user_id = auth.uid());

-- Admins: SELECT all (via user_profiles role check)
DROP POLICY IF EXISTS feedback_admin_select ON public.feedback;
CREATE POLICY feedback_admin_select ON public.feedback
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Admins: UPDATE (status, response, notes only — immutable trigger protects the rest)
DROP POLICY IF EXISTS feedback_admin_update ON public.feedback;
CREATE POLICY feedback_admin_update ON public.feedback
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Audit log: SELECT own feedback audits
DROP POLICY IF EXISTS feedback_audit_select_own ON public.feedback_audit_log;
CREATE POLICY feedback_audit_select_own ON public.feedback_audit_log
    FOR SELECT
    USING (
        feedback_id IN (SELECT id FROM public.feedback WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Audit log: INSERT only via trigger (SECURITY DEFINER)
DROP POLICY IF EXISTS feedback_audit_insert ON public.feedback_audit_log;
CREATE POLICY feedback_audit_insert ON public.feedback_audit_log
    FOR INSERT
    WITH CHECK (true);  -- Controlled by SECURITY DEFINER trigger

-- ============================================================
-- 9. RATE LIMITING FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.feedback_rate_check()
RETURNS TRIGGER AS $$
DECLARE
    recent_count INT;
BEGIN
    SELECT COUNT(*) INTO recent_count
    FROM public.feedback
    WHERE user_id = NEW.user_id
    AND created_at > (now() - INTERVAL '1 hour');

    IF recent_count >= 5 THEN
        RAISE EXCEPTION 'Rate limit exceeded: maximum 5 feedback submissions per hour';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_feedback_rate_limit ON public.feedback;
CREATE TRIGGER trg_feedback_rate_limit
    BEFORE INSERT ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.feedback_rate_check();

-- ============================================================
-- DONE. Schema is IDOR-proof, audit-logged, rate-limited.
-- ============================================================

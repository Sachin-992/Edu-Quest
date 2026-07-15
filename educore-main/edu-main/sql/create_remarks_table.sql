-- ═══════════════════════════════════════════════════════════════════════════════
-- FEATURE: Teacher-Only Remarks (Private Notes)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Create remarks table (if not exists)
CREATE TABLE IF NOT EXISTS remarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general', -- 'general', 'behavior', 'academic'
    is_private BOOLEAN DEFAULT TRUE, -- TRUE = Only teachers/admins can see
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_remarks_student ON remarks(student_id);

-- 3. Enable RLS
ALTER TABLE remarks ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES (STRICT)

-- ADMIN: Full Access
DROP POLICY IF EXISTS "remarks_admin_all" ON remarks;
CREATE POLICY "remarks_admin_all" ON remarks FOR ALL 
    USING (is_admin());

-- TEACHER: CRUD Access (Can view/edit all remarks for now, or restrict to detailed logic)
-- Letting all teachers see all remarks is useful for collaboration
DROP POLICY IF EXISTS "remarks_teacher_all" ON remarks;
CREATE POLICY "remarks_teacher_all" ON remarks FOR ALL 
    USING (is_teacher());

-- STUDENT: NO ACCESS (Explicitly block or just don't create a policy)
-- We strictly DO NOT create a policy for students. Default is DENY.
DROP POLICY IF EXISTS "remarks_student_view" ON remarks;
-- (No Create)

-- PARENT: NO ACCESS
DROP POLICY IF EXISTS "remarks_parent_view" ON remarks;
-- (No Create)

-- 5. Grant Permissions
GRANT ALL ON remarks TO authenticated;
GRANT ALL ON remarks TO service_role;

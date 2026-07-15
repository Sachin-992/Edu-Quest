-- ══════════════════════════════════════════════════════════════════════════════
-- CREATE STUDENT RPC FUNCTION (Optional - for future use)
-- Run in Supabase SQL Editor if you want RPC-based creation
-- ══════════════════════════════════════════════════════════════════════════════

-- This function allows secure student creation with admin-only access
-- Currently not needed since we use direct insert with RLS policies

CREATE OR REPLACE FUNCTION create_student_profile(
    p_name TEXT,
    p_class TEXT,
    p_section TEXT,
    p_roll_no INTEGER,
    p_date_of_birth DATE DEFAULT NULL,
    p_admission_number TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_parent_name TEXT DEFAULT NULL,
    p_parent_phone TEXT DEFAULT NULL,
    p_blood_group TEXT DEFAULT NULL,
    p_year_of_joining INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_caller_role TEXT;
BEGIN
    -- Check caller is admin
    SELECT role::TEXT INTO v_caller_role
    FROM users 
    WHERE auth_id = auth.uid();
    
    IF v_caller_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can create students';
    END IF;
    
    -- Insert student record
    INSERT INTO students (
        name,
        class,
        section,
        roll_no,
        date_of_birth,
        admission_number,
        address,
        parent_name,
        parent_phone,
        blood_group,
        year_of_joining,
        fee_status,
        status
    ) VALUES (
        p_name,
        p_class,
        p_section,
        p_roll_no,
        p_date_of_birth,
        COALESCE(p_admission_number, 'ADM' || EXTRACT(EPOCH FROM NOW())::BIGINT),
        p_address,
        p_parent_name,
        p_parent_phone,
        p_blood_group,
        COALESCE(p_year_of_joining, EXTRACT(YEAR FROM NOW())::INTEGER),
        'pending',
        'active'
    )
    RETURNING id INTO v_student_id;
    
    RETURN v_student_id;
END;
$$;

-- Grant execute permission to authenticated users (RLS will enforce admin-only)
GRANT EXECUTE ON FUNCTION create_student_profile TO authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
-- USAGE FROM CLIENT:
-- const { data, error } = await supabase.rpc('create_student_profile', {
--     p_name: 'John Doe',
--     p_class: '10',
--     p_section: 'A',
--     p_roll_no: 1
-- });
-- ══════════════════════════════════════════════════════════════════════════════

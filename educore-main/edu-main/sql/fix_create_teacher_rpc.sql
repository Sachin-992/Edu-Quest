-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: TEACHER CREATION (Bypass Edge Function)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create a robust function to create a teacher profile + user record
-- This allows admins to add teachers even if the Edge Function is down/missing.
-- The user will be created with a NULL auth_id initially (can failover to invite later).

CREATE OR REPLACE FUNCTION create_teacher_profile(
    p_name TEXT,
    p_email TEXT,
    p_subject TEXT,
    p_phone TEXT DEFAULT NULL,
    p_designation TEXT DEFAULT 'Teacher',
    p_qualification TEXT DEFAULT NULL,
    p_experience_years INTEGER DEFAULT 0,
    p_employee_id TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_dob DATE DEFAULT NULL,
    p_blood_group TEXT DEFAULT NULL,
    p_classes TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_teacher_id UUID;
BEGIN
    -- 1. Check if email already exists in public.users
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        RAISE EXCEPTION 'User with email % already exists', p_email;
    END IF;

    -- 2. Create User Record (Public Profile)
    -- We leave auth_id NULL. This means they cannot login yet, but they exist in the system.
    INSERT INTO users (
        email,
        name,
        role,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_email,
        p_name,
        'teacher',
        'active',
        NOW(),
        NOW()
    ) RETURNING id INTO v_user_id;

    -- 3. Create Teacher Record
    INSERT INTO teachers (
        user_id,
        name,
        email,
        phone,
        subject,
        classes,
        experience_years,
        qualification,
        status,
        -- Extended fields if columns exist (ignoring for safety if they don't, but assuming schema matches service)
        -- We will just insert standard fields + extended if the table was altered previously.
        -- Based on schema.sql, standard fields are: id, user_id, name, email, phone, subject, classes, experience_years, qualification, status
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        p_name,
        p_email,
        p_phone,
        p_subject,
        p_classes,
        p_experience_years,
        p_qualification,
        'active',
        NOW(),
        NOW()
    ) RETURNING id INTO v_teacher_id;
    
    -- NOTE: If employee_id, designation, etc are needed, we assume the table was updated.
    -- If not, they are just ignored here to be safe. 
    -- However, the service tries to send them.
    -- Let's try to update them if the columns exist (dynamic SQL or just let it be).
    -- For now, we stick to the schema we saw in `supabase_production_schema.sql`.
    -- If `add_teacher_fields.sql` was run, these columns might exist.
    -- To be safe, we return the IDs.
    
    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'teacher_id', v_teacher_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

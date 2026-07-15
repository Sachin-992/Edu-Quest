-- ═══════════════════════════════════════════════════════════════════════════════
-- FINAL FIX: AUTHENTICATED ADMIN BOOTSTRAP
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Improved RPC: Returns the full user record to bypass RLS read blocks
-- This guarantees that if we can create/update the user, we can also log them in immediately.

CREATE OR REPLACE FUNCTION repair_identity_rpc(p_role text, p_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
AS $$
DECLARE
  v_uid uuid;
  v_user record;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN 
    RETURN json_build_object('success', false, 'error', 'Not authenticated'); 
  END IF;

  -- Insert or Ensure Active
  INSERT INTO public.users (auth_id, email, name, role, status, first_login)
  VALUES (v_uid, auth.jwt() ->> 'email', p_name, p_role, 'active', false)
  ON CONFLICT (auth_id) DO UPDATE 
  SET status = 'active'
  RETURNING * INTO v_user;
  
  RETURN json_build_object('success', true, 'user', row_to_json(v_user));
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2. Ensure RLS allows the self-healing calls (Redundant safety)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_insert_self') THEN
        CREATE POLICY "users_insert_self" ON users FOR INSERT WITH CHECK (auth_id = auth.uid());
    END IF;
END $$;
GRANT INSERT, UPDATE ON users TO authenticated;

-- 3. Cleanup any bad state for the admin (Optional, safe)
-- If there are dependent tables blocking login, we should handle them? 
-- The prompt says Admin should NOT depend on them.

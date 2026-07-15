-- ═══════════════════════════════════════════════════════════════════════════════
-- HOTFIX: ALLOW IDENTITY SELF-HEALING (RLS FIX)
-- ═══════════════════════════════════════════════════════════════════════════════

-- The self-healing logic requires the authenticated user to INSERT their own record.
-- By default, RLS prevents this. We must explicitly allow it.

DO $$
BEGIN
    -- 1. Create policy to allow self-insertion of identity
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'users_insert_self'
    ) THEN
        CREATE POLICY "users_insert_self" ON users FOR INSERT 
        WITH CHECK (auth_id = auth.uid());
    END IF;

    -- 2. Create policy to allow self-update of identity (needed for some repair flows)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'users_update_self'
    ) THEN
        CREATE POLICY "users_update_self" ON users FOR UPDATE
        USING (auth_id = auth.uid());
    END IF;

END $$;

-- 3. Also grant necessary permissions if missing (just in case)
GRANT INSERT, UPDATE ON users TO authenticated;

-- 4. EMERGENCY BACKUP: RPC Function to repair identity avoiding RLS entirely
-- If the client-side insert still fails, we can call this function interactively or via code.
CREATE OR REPLACE FUNCTION repair_identity_rpc(p_role text, p_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
AS $$
DECLARE
  v_uid uuid;
  v_email text;
BEGIN
  v_uid := auth.uid();
  v_email := auth.jwt() ->> 'email';
  
  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  INSERT INTO public.users (auth_id, email, name, role, status, first_login)
  VALUES (v_uid, v_email, p_name, p_role, 'active', true)
  ON CONFLICT (auth_id) DO UPDATE
  SET status = 'active'; -- Re-activate if exists
  
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

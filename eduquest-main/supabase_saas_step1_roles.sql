-- ============================================================
-- STEP 1 OF 2: Add new enum values
-- Run this FIRST in Supabase SQL Editor, then run Step 2
-- ============================================================

-- Add new role types (must be in a separate transaction)
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'school_admin';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platform_admin';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

SELECT '✅ Step 1 complete — new roles added. Now run Step 2!' AS status;

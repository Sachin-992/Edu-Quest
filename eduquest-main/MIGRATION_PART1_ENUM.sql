-- ============================================================
-- EDUQUEST — MIGRATION PART 1 of 2
-- New Project: oeaowgbycenftvhwonyb
--
-- ⚠️  RUN THIS FIRST — then STOP — then run PART 2
--
-- This file ONLY creates the enum type and adds all values.
-- PostgreSQL requires a separate committed transaction before
-- you can USE new enum values in functions/policies.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create base enum (student, admin, super_admin)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('student', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'app_role enum already exists — skipping.';
END $$;

-- Add school_admin value
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'school_admin';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add platform_admin value
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platform_admin';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add teacher value
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ✅ Verify
SELECT
  enumlabel AS role_value,
  enumsortorder AS sort_order
FROM pg_enum
WHERE enumtypid = 'public.app_role'::regtype
ORDER BY enumsortorder;

SELECT '✅ PART 1 DONE — Now run MIGRATION_PART2.sql' AS next_step;

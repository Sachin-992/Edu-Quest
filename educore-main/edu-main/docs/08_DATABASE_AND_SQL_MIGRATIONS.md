# EDUCORE-OMEGA: Database & SQL Migrations

> **Document Version**: 1.0  
> **Last Updated**: January 2026  
> **For**: IT Administrators and Database Operators

---

## CRITICAL: Authoritative Schema

> [!IMPORTANT]
> **USE ONLY THIS FILE FOR NEW DEPLOYMENTS:**
> 
> `supabase_production_schema.sql` (592 lines)
> 
> This is the SINGLE SOURCE OF TRUTH for database setup.

---

## SQL File Classification

### ✅ AUTHORITATIVE (Use This)

| File | Purpose | Lines |
|------|---------|-------|
| `supabase_production_schema.sql` | Complete production schema | 592 |

### ⚠️ LEGACY (Do NOT Run)

The `/sql/` folder contains **89 migration files** that are:
- Historical fixes
- Already merged into production schema
- May cause conflicts if run

| Status | Files | Action |
|--------|-------|--------|
| Legacy | All files in `/sql/` | **DO NOT RUN** |

### Why So Many SQL Files?

During development, individual fixes were applied. They have been:
1. ✅ Merged into `supabase_production_schema.sql`
2. ✅ Tested together
3. ❌ Should NOT be run again

---

## Fresh Deployment Steps

### Step 1: Prepare Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project (or use existing)
3. Note your project credentials:
   - Project URL
   - Anon Key
   - Service Role Key

### Step 2: Run Production Schema

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Open `supabase_production_schema.sql` from your local files
4. Copy entire contents
5. Paste into SQL Editor
6. Click **Run**
7. Wait for completion (may take 30-60 seconds)

### Step 3: Verify Tables

After running, verify 16 tables exist:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- assignments
- attendance
- audit_logs
- classes
- fee_records
- files
- marks
- parent_student_links
- parents
- payments
- remarks
- sections
- students
- subjects
- teachers
- users

### Step 4: Create Storage Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **New Bucket**
3. Name: `academic-files`
4. **UNCHECK** "Public bucket"
5. Click **Create**

---

## What the Schema Creates

### Tables (16)

| Table | Purpose |
|-------|---------|
| `users` | Identity store linked to Supabase Auth |
| `students` | Student profiles |
| `teachers` | Teacher profiles |
| `parents` | Parent profiles |
| `parent_student_links` | Parent-child relationships |
| `classes` | School classes (1-12) |
| `sections` | Class sections (A, B, etc.) |
| `subjects` | Academic subjects |
| `attendance` | Daily attendance |
| `marks` | Exam grades |
| `assignments` | Homework/projects |
| `remarks` | Student remarks |
| `fee_records` | Fee tracking |
| `payments` | Payment transactions |
| `files` | File metadata |
| `audit_logs` | Immutable action logs |

### Enums

| Enum | Values |
|------|--------|
| `user_role` | admin, teacher, parent, student |
| `user_status` | active, inactive, suspended |
| `fee_status` | paid, partial, pending, overdue |
| `attendance_status` | present, absent, late |
| `audit_severity` | info, success, warning, error, critical |

### Indexes (15)

Performance indexes on frequently queried columns.

### Triggers (2)

| Trigger | Purpose |
|---------|---------|
| `audit_no_update` | Prevent UPDATE on audit_logs |
| `audit_no_delete` | Prevent DELETE on audit_logs |

### RLS Policies (30+)

Row Level Security policies for each table. See [09_RLS_AND_SECURITY.md](./09_RLS_AND_SECURITY.md).

### Seed Data

- 12 classes (Class 1-12)
- 9 subjects (Math, Science, English, etc.)

---

## DO NOT Run These Files

> [!CAUTION]
> **These files are LEGACY and will BREAK your database:**

| File Pattern | Why Dangerous |
|--------------|---------------|
| `fix_*.sql` | Already merged, will cause conflicts |
| `*_schema.sql` (except production) | Partial schemas |
| `enable_admin_access.sql` | Disables RLS (security risk) |
| `disable_email_confirm.sql` | Security bypass |

---

## What Breaks If Order Is Wrong?

| Mistake | Consequence |
|---------|------------|
| Running partial schema first | Missing tables, foreign key failures |
| Running fix files on fresh DB | Errors (tables don't exist) |
| Running `enable_admin_access.sql` | RLS disabled, security vulnerability |
| Not running seed data | Empty dropdowns in UI |

---

## Verification Query

Run this to verify your setup:

```sql
-- Check table count (should be 16)
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check audit immutability triggers
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'audit_logs';
```

---

*End of Database & SQL Migrations Document*

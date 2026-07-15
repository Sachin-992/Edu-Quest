# EDUCORE-OMEGA: Failure & Recovery

> **Document Version**: 1.0  
> **Last Updated**: January 2026  
> **For**: IT Administrators

---

## System Failure Scenarios

### 1. Supabase Downtime

**Symptoms:**
- Login fails with network error
- Dashboard shows "Unable to connect"
- All operations fail

**Diagnosis:**
1. Check [status.supabase.com](https://status.supabase.com)
2. Check your Supabase Dashboard
3. Verify internet connectivity

**Action:**
| Status | Action |
|--------|--------|
| Supabase outage | Wait for Supabase to resolve |
| Your project issue | Check project settings |
| Network issue | Check school's internet |

**User Communication:**
> "The system is temporarily unavailable due to server maintenance. Please try again in [X] minutes."

---

### 2. Edge Function Failure

**Symptoms:**
- User creation fails with "Server error"
- File upload fails
- "Edge Function failed" in logs

**Diagnosis:**
1. Go to Supabase Dashboard → **Edge Functions**
2. Click on failing function
3. Check **Logs** tab

**Common Causes:**

| Error | Cause | Fix |
|-------|-------|-----|
| "Missing SERVICE_ROLE_KEY" | Secret not set | Run `supabase secrets set SERVICE_ROLE_KEY=...` |
| "Function not found" | Not deployed | Run `supabase functions deploy iam` |
| "Timeout" | Function too slow | Check network, retry |

**Recovery:**
```bash
# Re-deploy functions
supabase functions deploy iam
supabase functions deploy academic-actions

# Verify secrets
supabase secrets list
```

---

### 3. Partial User Creation

**Scenario:** Admin clicked "Create Student" but got error mid-way.

**Possible States:**

| State | Auth User | Users Table | Students Table |
|-------|-----------|-------------|----------------|
| Fully created | ✅ | ✅ | ✅ |
| Partial (1) | ✅ | ❌ | ❌ |
| Partial (2) | ✅ | ✅ | ❌ |

**Diagnosis:**
```sql
-- Check auth.users for orphaned entries
SELECT id, email, created_at FROM auth.users 
WHERE email = 'student@school.edu';

-- Check public.users
SELECT * FROM users WHERE email = 'student@school.edu';

-- Check students
SELECT * FROM students WHERE name LIKE '%Student Name%';
```

**Recovery:**

**If auth user exists but not in users table:**
```sql
-- Delete auth user (Supabase Dashboard → Authentication → Users → Delete)
-- Then retry creation from Admin Dashboard
```

**If users row exists but not in students table:**
```sql
-- Add student profile manually
INSERT INTO students (user_id, name, class, section, roll_no, date_of_birth, status)
SELECT id, name, 'Class 5', 'A', 1, '2010-05-15', 'active'
FROM users WHERE email = 'student@school.edu';
```

---

### 4. RLS Accidentally Disabled

**Symptoms:**
- Users can see data they shouldn't
- Security audit shows FAILED

**Emergency Fix:**
```sql
-- Re-enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

**Verify:**
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;
-- Should return 0 rows
```

---

### 5. Database Connection Issues

**Symptoms:**
- "Database connection unavailable"
- Slow loading
- Timeout errors

**Diagnosis:**
1. Check Supabase Dashboard → **Database** → **Connections**
2. Check pool exhaustion
3. Check for long-running queries

**Recovery:**

If connections exhausted:
```sql
-- Kill long-running connections (admin only)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'active' 
AND query_start < NOW() - INTERVAL '5 minutes';
```

---

## Rollback Procedures

### Database Rollback

**If bad data was inserted:**
```sql
-- Find recent changes
SELECT * FROM audit_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Delete specific records
DELETE FROM students WHERE id = 'uuid-here';
DELETE FROM users WHERE id = 'uuid-here';
```

### Frontend Rollback

If bad deployment:
1. Redeploy previous version
2. Keep previous `dist/` folder as backup

---

## Backup Strategy

### Database Backups

Supabase provides automatic daily backups (Pro plan).

**Manual backup:**
```bash
pg_dump -h your-db-host -U postgres -d postgres > backup.sql
```

### Export Critical Data

```sql
-- Export students
COPY students TO '/tmp/students_backup.csv' WITH CSV HEADER;

-- Export via Supabase Dashboard
-- Table Editor → Export as CSV
```

---

## Emergency Contacts

| Issue | Contact |
|-------|---------|
| Supabase outage | support@supabase.io |
| Database issue | School IT Lead |
| Security incident | School IT Lead + Admin |

---

*End of Failure & Recovery Document*

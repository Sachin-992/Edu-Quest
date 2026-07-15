# EDUCORE-OMEGA: Troubleshooting

> **Document Version**: 1.0  
> **Last Updated**: January 2026  
> **For**: IT Administrators and Support Staff

---

## Quick Reference: Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid login credentials" | Wrong password | Use DOB (DDMMYYYY) |
| "Email not confirmed" | User not verified | Admin: confirm in Auth dashboard |
| "User not active" | Account suspended | Admin: check status in users table |
| "Permission denied" | Role restriction | Verify user role |
| "Database unavailable" | Supabase issue | Check status.supabase.com |
| "Edge Function failed" | Server-side error | Check Edge Function logs |
| "File upload failed" | Storage issue | Check bucket exists |
| "Session expired" | Token expired | Refresh page, re-login |

---

## Login Issues

### "Invalid login credentials"

**For Students/Parents:**
1. Password is date of birth: **DDMMYYYY**
   - March 15, 2010 → `15032010`
2. Use child's DOB for parents
3. Email must match exactly (case-sensitive)

**For Teachers:**
1. Initial password is DOB
2. Must change password on first login
3. If forgotten, admin must reset

**For Admin:**
- Contact system administrator

---

### "Email not confirmed"

**Solution (Admin only):**
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find user by email
3. Click "Confirm Email" or delete and recreate

---

### Blank Screen After Login

**Causes & Fixes:**

| Cause | Fix |
|-------|-----|
| User exists in auth but not in `users` table | Add users table entry |
| Role is NULL | Set role in users table |
| Browser cache issue | Clear cache, re-login |

**SQL Check:**
```sql
SELECT u.email, u.role, u.status 
FROM users u 
JOIN auth.users a ON u.auth_id = a.id 
WHERE a.email = 'user@school.edu';
```

**SQL Fix:**
```sql
-- If user missing from public.users
INSERT INTO users (auth_id, email, name, role, status)
SELECT id, email, raw_user_meta_data->>'name', 
       (raw_user_meta_data->>'role')::user_role, 'active'
FROM auth.users 
WHERE email = 'user@school.edu';
```

---

## Data Visibility Issues

### "Student cannot see their marks"

**Check:**
1. Marks entered for correct student ID
2. Student logged in with correct account
3. RLS enabled and policies correct

**SQL Check:**
```sql
-- Find student's user_id
SELECT s.id as student_id, s.name, u.auth_id 
FROM students s 
JOIN users u ON s.user_id = u.id 
WHERE s.name LIKE '%Student Name%';

-- Check marks for that student
SELECT * FROM marks WHERE student_id = 'student-uuid-here';
```

---

### "Parent cannot see child's data"

**Check:**
1. Parent-student link exists
2. Child DOB password correct

**SQL Check:**
```sql
-- Check parent-student link
SELECT p.name as parent, s.name as student, psl.relationship
FROM parent_student_links psl
JOIN parents p ON p.id = psl.parent_id
JOIN students s ON s.id = psl.student_id
WHERE p.email = 'parent@email.com';
```

**SQL Fix:**
```sql
-- Create missing link
INSERT INTO parent_student_links (parent_id, student_id, relationship, is_primary)
SELECT p.id, s.id, 'parent', true
FROM parents p, students s
WHERE p.email = 'parent@email.com' 
AND s.name = 'Child Name';
```

---

## User Creation Issues

### "Email already registered"

**Cause:** Duplicate email in auth.users

**Solution:**
1. Use different email, OR
2. Delete existing user first (if intended)

---

### "Server error" on Create Student

**Check Edge Function logs:**
1. Supabase Dashboard → **Edge Functions** → `iam`
2. Check **Logs** tab
3. Look for error message

**Common issues:**

| Log Error | Fix |
|-----------|-----|
| "Missing SERVICE_ROLE_KEY" | `supabase secrets set SERVICE_ROLE_KEY=...` |
| "Invalid email format" | Check email format |
| "Database error" | Check table schema matches |

---

## Performance Issues

### Slow Loading

**Quick fixes:**
1. Refresh page
2. Check internet connection
3. Clear browser cache

**If persistent:**
1. Check Supabase Dashboard → **Database** → **Query Performance**
2. Look for slow queries
3. Check index usage

---

### Timeout Errors

**Cause:** Query taking too long

**Fix:**
```sql
-- Find slow queries
SELECT query, calls, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 5;
```

---

## Mobile-Specific Issues

### "Page not loading on phone"

**Check:**
1. Mobile data or WiFi connected
2. Try refreshing
3. Try different browser

### "Can't click buttons"

**Fix:**
1. Zoom out to see full button
2. Turn phone sideways
3. Clear browser cache

---

## Admin-Specific Issues

### Cannot See Audit Logs

**Check:**
1. User role is `admin`
2. audit_logs table has data

**SQL Check:**
```sql
SELECT COUNT(*) FROM audit_logs;
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;
```

---

### Fee Records Not Updating

**Check:**
1. Payment recorded correctly
2. `fee_records.paid` column updated

**SQL Check:**
```sql
SELECT * FROM fee_records 
WHERE student_id = 'student-uuid-here';

SELECT * FROM payments 
WHERE fee_record_id = 'fee-record-uuid';
```

---

## Quick Recovery Commands

### Reset User Password

```sql
-- Via Supabase Dashboard:
-- Authentication → Users → Find User → Send Password Reset
```

### Force User Logout (All Sessions)

```sql
-- Delete all sessions for user
-- Only works via Supabase Admin API
```

### Check System Health

```sql
-- Table counts
SELECT 
  'users' as table, COUNT(*) as count FROM users
  UNION ALL
  SELECT 'students', COUNT(*) FROM students
  UNION ALL
  SELECT 'teachers', COUNT(*) FROM teachers
  UNION ALL
  SELECT 'parents', COUNT(*) FROM parents;

-- RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
```

---

## When to Escalate

| Situation | Escalate To |
|-----------|-------------|
| Database corruption | Supabase Support |
| Security breach | IT Lead + Admin |
| Data loss | IT Lead |
| Supabase outage | Wait / Supabase Status |

---

*End of Troubleshooting Document*

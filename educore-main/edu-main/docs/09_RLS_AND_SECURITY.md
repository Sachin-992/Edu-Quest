# EDUCORE-OMEGA: RLS & Security

> **Document Version**: 1.0  
> **Last Updated**: January 2026  
> **For**: IT Administrators and Security Auditors

---

## CRITICAL: RLS Status Declaration

> [!IMPORTANT]
> **PRODUCTION RLS STATUS: ✅ ENABLED**
> 
> The authoritative schema (`supabase_production_schema.sql`) has RLS **ENABLED** on all 16 tables with proper policies.

---

## Historical Clarification

### Why Do Some Docs Say "RLS Disabled"?

During development, a file `enable_admin_access.sql` was used to temporarily disable RLS for debugging. This file:
- ❌ Should **NEVER** be run in production
- ❌ Is NOT part of the production schema
- ✅ Is marked as legacy in [08_DATABASE_AND_SQL_MIGRATIONS.md](./08_DATABASE_AND_SQL_MIGRATIONS.md)

### Current Production State

| Table | RLS | Policies |
|-------|-----|----------|
| users | ✅ Enabled | 2 policies |
| students | ✅ Enabled | 4 policies |
| teachers | ✅ Enabled | 2 policies |
| parents | ✅ Enabled | 2 policies |
| parent_student_links | ✅ Enabled | 2 policies |
| classes | ✅ Enabled | 2 policies |
| sections | ✅ Enabled | Inherited from classes |
| subjects | ✅ Enabled | 2 policies |
| attendance | ✅ Enabled | 4 policies |
| marks | ✅ Enabled | 4 policies |
| assignments | ✅ Enabled | 3 policies |
| remarks | ✅ Enabled | 3 policies |
| fee_records | ✅ Enabled | 2 policies |
| payments | ✅ Enabled | 2 policies |
| files | ✅ Enabled | 3 policies |
| audit_logs | ✅ Enabled | 2 policies (insert-only) |

---

## Verification Query

Run this query to verify RLS is enabled:

```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Expected:** All `rls_enabled` values should be `true`.

---

## RLS Policy Summary

### Admin Policies

Admins have full access to all tables:

```sql
CREATE POLICY "table_admin_all" ON table_name FOR ALL USING (is_admin());
```

### Teacher Policies

Teachers can:
- READ students (all for assigned classes)
- CREATE/UPDATE marks, attendance
- CREATE/DELETE own files

### Student Policies

Students can:
- READ own records only
- No CREATE/UPDATE/DELETE

### Parent Policies

Parents can:
- READ linked children's records only
- No CREATE/UPDATE/DELETE

---

## Helper Functions

These SQL functions support RLS policies:

| Function | Purpose |
|----------|---------|
| `is_admin()` | Returns true if current user is admin |
| `is_teacher()` | Returns true if current user is teacher |
| `get_my_role()` | Returns current user's role |
| `get_my_student_id()` | Returns student ID for current user |
| `get_my_student_ids()` | Returns student IDs linked to parent |

---

## Audit Log Immutability

Audit logs are protected by database triggers:

```sql
-- Prevents UPDATE
CREATE TRIGGER audit_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_update();

-- Prevents DELETE
CREATE TRIGGER audit_no_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_delete();
```

**Result**: Audit logs CANNOT be modified or deleted, even by admins.

---

## RBAC Permission Matrix

### Frontend RBAC (rbacService.ts)

| Resource | Admin | Teacher | Student | Parent |
|----------|-------|---------|---------|--------|
| student:profile | CRUD+E+A | R+U | R | R |
| student:marks | CRUD+E+A | CRUD | R | R |
| student:attendance | CRUD+A | CRUD | R | R |
| teacher:profile | CRUD+E+A | R | - | - |
| school:classes | CRUD+A | R | R | R |
| finance:fees | CRUD+A | - | - | R |
| files:upload | C+D+A | C+D | - | - |
| files:download | R | R | R | R |
| admin:audit | R+E | - | - | - |

Legend: C=Create, R=Read, U=Update, D=Delete, E=Export, A=Admin

---

## Security Best Practices

### DO:
- ✅ Always run `supabase_production_schema.sql` for new deployments
- ✅ Verify RLS with the verification query
- ✅ Keep `SERVICE_ROLE_KEY` secret
- ✅ Use IAM Edge Function for user creation

### DON'T:
- ❌ Run `enable_admin_access.sql`
- ❌ Disable RLS for debugging in production
- ❌ Expose `SERVICE_ROLE_KEY` in frontend
- ❌ Allow direct table access bypassing RLS

---

## Security Incident Response

If RLS is accidentally disabled:

1. **Immediately** run:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables
```

2. Check audit logs for unauthorized access:
```sql
SELECT * FROM audit_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

3. Re-run production schema if policies are missing

---

*End of RLS & Security Document*

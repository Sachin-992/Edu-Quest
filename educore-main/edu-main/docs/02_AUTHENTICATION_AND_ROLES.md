# EDUCORE-OMEGA: Authentication & Roles

> **Document Version**: 1.0  
> **Last Updated**: January 2026

---

## Authentication Provider

- **Provider**: Supabase Auth
- **Method**: Email + Password
- **Session**: JWT tokens with automatic refresh
- **Storage**: Local browser storage

---

## Password Policy

| Role | Password Format | Can Change? |
|------|-----------------|-------------|
| **Student** | Date of Birth (DDMMYYYY) | ❌ No |
| **Parent** | Child's Date of Birth (DDMMYYYY) | ❌ No |
| **Teacher** | Date of Birth (DDMMYYYY) initially | ✅ Yes (must change on first login) |
| **Admin** | Set by system administrator | ✅ Yes |

### Password Examples

| DOB | Password |
|-----|----------|
| March 15, 2010 | `15032010` |
| January 1, 2005 | `01012005` |
| December 25, 2008 | `25122008` |

---

## User Roles

### Admin (`admin`)
- **Access**: Full system access
- **Can Create**: Students, Teachers, Parents
- **Can Modify**: All records
- **Can Delete**: All records
- **Portal**: Admin Dashboard (10 modules)

### Teacher (`teacher`)
- **Access**: Assigned classes only
- **Can Create**: Marks, Attendance, Assignments
- **Can Modify**: Own records only
- **Cannot**: Create users, delete students
- **Portal**: Teacher Dashboard

### Student (`student`)
- **Access**: Own records only
- **Can Create**: Nothing (VIEW-ONLY)
- **Cannot**: Modify any data
- **Portal**: Student Dashboard

### Parent (`parent`)
- **Access**: Linked children only
- **Can Create**: Nothing (VIEW-ONLY)
- **Cannot**: Modify any data
- **Portal**: Parent Dashboard

---

## Login Flow

### Step-by-Step

1. User enters email + password
2. System calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials
4. JWT token stored in browser
5. System queries `users` table for role
6. User redirected to appropriate portal

### Login Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Login Form  │────▶│ Supabase Auth│────▶│ JWT Session  │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
                                         ┌──────────────┐
                                         │ users table  │
                                         │ (get role)   │
                                         └──────┬───────┘
                                                  │
       ┌──────────────┬──────────────┬──────────┴───────────┐
       ▼              ▼              ▼                      ▼
┌─────────┐    ┌─────────┐    ┌─────────┐           ┌─────────┐
│ Admin   │    │ Teacher │    │ Student │           │ Parent  │
│ Portal  │    │ Portal  │    │ Portal  │           │ Portal  │
└─────────┘    └─────────┘    └─────────┘           └─────────┘
```

---

## Session Behavior

| Event | Behavior |
|-------|----------|
| Login | JWT token created, stored locally |
| Page Refresh | Session restored from token |
| Token Expiry | Automatic refresh (handled by Supabase) |
| Logout | Token cleared, redirected to login |
| Inactive | Session persists until logout |

---

## First Login Detection

- `users.first_login` flag tracks if user has logged in before
- Teachers are prompted to change password on first login
- Students/Parents cannot change password (policy decision)

---

## Account Status

| Status | Can Login? | Description |
|--------|-----------|-------------|
| `active` | ✅ Yes | Normal account |
| `inactive` | ❌ No | Temporarily disabled |
| `suspended` | ❌ No | Suspended by admin |

---

## Role Resolution

Role is determined by `users.role` column, NOT by frontend:

```typescript
// From AuthContext.tsx
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('auth_id', session.user.id)
  .single();

// Role locked to database value
user.role = userData.role; // 'admin' | 'teacher' | 'student' | 'parent'
```

> **SECURITY**: Role cannot be changed by user. Only Admin can modify roles.

---

## User Creation

### Who Can Create Users?

| Role | Can Create Students | Can Create Teachers | Can Create Parents |
|------|---------------------|---------------------|-------------------|
| Admin | ✅ Yes | ✅ Yes | ✅ Yes |
| Teacher | ❌ No | ❌ No | ❌ No |
| Student | ❌ No | ❌ No | ❌ No |
| Parent | ❌ No | ❌ No | ❌ No |

### How User Creation Works

User creation uses the **IAM Edge Function** (not client-side):

1. Admin submits form in dashboard
2. Frontend calls `supabase.functions.invoke('iam', {action: 'createStudent'})`
3. Edge Function uses `SERVICE_ROLE_KEY` to create user
4. Admin's session is **NOT affected** (no session switching)

> See [07_EDGE_FUNCTIONS.md](./07_EDGE_FUNCTIONS.md) for full IAM documentation.

---

## Common Login Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid login credentials" | Wrong password | Use DOB in DDMMYYYY format |
| "Email not confirmed" | Email not verified | Contact admin |
| "User not active" | Account suspended | Contact admin |
| Blank screen after login | Role not in users table | Admin must link user |

---

*End of Authentication Document*

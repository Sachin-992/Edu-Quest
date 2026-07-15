# EDUCORE-OMEGA: Architecture

> **Document Version**: 1.0  
> **Last Updated**: January 2026

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Admin   │ │ Teacher │ │ Student │ │ Parent  │               │
│  │ Portal  │ │ Portal  │ │ Portal  │ │ Portal  │               │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘               │
│       └───────────┴───────────┴───────────┘                     │
├─────────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER                               │
│  authService │ rbacService │ auditService │ studentService      │
├─────────────────────────────────────────────────────────────────┤
│                    SUPABASE PLATFORM                             │
│  ┌────────────┬────────────┬────────────┬────────────┐         │
│  │   Auth     │  Database  │  Storage   │ Edge Funcs │         │
│  │  (JWT)     │ (Postgres) │  (Files)   │  (Deno)    │         │
│  └────────────┴────────────┴────────────┴────────────┘         │
│                     Row Level Security (RLS)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Login Flow
```
User → Login Form → Supabase Auth → JWT Token → AuthContext
                                           ↓
                                    users table → Role
                                           ↓
                                    Portal Routing (Admin/Teacher/Student/Parent)
```

### User Creation Flow (Admin Only)
```
Admin Dashboard → IAM Edge Function (SERVICE_ROLE_KEY)
                         ↓
              1. Create auth.users entry
              2. Create public.users entry
              3. Create role-specific profile (students/teachers/parents)
              4. Log to audit_logs
                         ↓
              Return to Admin (session unchanged)
```

---

## Database Tables (16 Core)

| Table | Purpose | RLS |
|-------|---------|-----|
| `users` | Identity store | ✅ |
| `students` | Student profiles | ✅ |
| `teachers` | Teacher profiles | ✅ |
| `parents` | Parent profiles | ✅ |
| `parent_student_links` | Parent-child relationships | ✅ |
| `classes` | School classes (1-12) | ✅ |
| `sections` | Class sections (A, B, etc.) | ✅ |
| `subjects` | Academic subjects | ✅ |
| `attendance` | Daily attendance records | ✅ |
| `marks` | Academic grades | ✅ |
| `assignments` | Homework/projects | ✅ |
| `remarks` | Student remarks | ✅ |
| `fee_records` | Fee tracking | ✅ |
| `payments` | Payment transactions | ✅ |
| `files` | File metadata | ✅ |
| `audit_logs` | Immutable action logs | ✅ (Insert-only) |

---

## Service Layer

| Service | Location | Purpose |
|---------|----------|---------|
| `authService` | `services/authService.ts` | Login/logout, session |
| `rbacService` | `services/rbacService.ts` | Permission checks |
| `auditService` | `services/auditService.ts` | Audit logging |
| `studentService` | `services/studentService.ts` | Student CRUD |
| `teacherService` | `services/teacherService.ts` | Teacher CRUD |
| `financeService` | `services/financeService.ts` | Fee management |
| `fileStorageService` | `services/fileStorageService.ts` | File uploads |

---

## Edge Functions

| Function | Path | Purpose |
|----------|------|---------|
| `iam` | `supabase/functions/iam/` | User creation (Admin only) |
| `academic-actions` | `supabase/functions/academic-actions/` | File upload, marks entry |

> See [07_EDGE_FUNCTIONS.md](./07_EDGE_FUNCTIONS.md) for full documentation.

---

## File Structure

```
edu-main/
├── components/
│   ├── admin/           # Admin portal modules
│   ├── student/         # Student dashboard
│   ├── teacher/         # Teacher dashboard
│   └── ParentDashboard.tsx
├── services/            # Business logic
├── contexts/
│   ├── AuthContext.tsx  # Authentication state
│   └── ThemeContext.tsx # Dark mode
├── supabase/
│   └── functions/       # Edge Functions
│       ├── iam/
│       └── academic-actions/
├── sql/                 # Migration scripts (legacy)
└── docs/               # This documentation
```

---

*End of Architecture Document*

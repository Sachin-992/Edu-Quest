# EDUCORE-OMEGA: System Overview

> **Document Version**: 1.0  
> **Last Updated**: January 2026  
> **Authority**: Production Documentation

---

## What is EDUCORE-OMEGA?

EDUCORE-OMEGA is a governance-first school management platform designed for K-12 institutions. It provides role-locked portals for Administrators, Teachers, Students, and Parents.

### Core Principle

> **IDENTITY DEFINES ACCESS. DATA IS TRACEABLE. ADMIN IS SUPREME.**

---

## System Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React + TypeScript + Vite | User interface |
| Database | Supabase (PostgreSQL) | Data persistence |
| Authentication | Supabase Auth | Login/session management |
| Storage | Supabase Storage | File uploads |
| Edge Functions | Deno (Supabase) | Secure user creation |

---

## User Roles

| Role | Access Level | Can Create Data |
|------|--------------|-----------------|
| **Admin** | Full system access | ✅ All entities |
| **Teacher** | Assigned classes only | ✅ Marks, Attendance |
| **Student** | Own records only | ❌ View-only |
| **Parent** | Linked children only | ❌ View-only |

---

## Key Features

- ✅ **Role-locked portals** — No role switching after login
- ✅ **Immutable audit logs** — Cannot be edited or deleted
- ✅ **Row Level Security (RLS)** — Database-enforced access control
- ✅ **DOB-based passwords** — Simple, memorable for students/parents
- ✅ **Multi-child parent linking** — One parent can view multiple children

---

## Document Map

| Document | Purpose |
|----------|---------|
| [01_ARCHITECTURE.md](./01_ARCHITECTURE.md) | Technical architecture details |
| [02_AUTHENTICATION_AND_ROLES.md](./02_AUTHENTICATION_AND_ROLES.md) | Login flow, password policy |
| [03_ADMIN_GUIDE.md](./03_ADMIN_GUIDE.md) | Step-by-step admin workflows |
| [04_TEACHER_GUIDE.md](./04_TEACHER_GUIDE.md) | Teacher daily tasks |
| [05_STUDENT_GUIDE.md](./05_STUDENT_GUIDE.md) | Student portal usage |
| [06_PARENT_GUIDE.md](./06_PARENT_GUIDE.md) | Parent portal usage |
| [07_EDGE_FUNCTIONS.md](./07_EDGE_FUNCTIONS.md) | Server-side functions |
| [08_DATABASE_AND_SQL_MIGRATIONS.md](./08_DATABASE_AND_SQL_MIGRATIONS.md) | Schema & migration guide |
| [09_RLS_AND_SECURITY.md](./09_RLS_AND_SECURITY.md) | Security configuration |
| [10_MOBILE_UX_GUIDE.md](./10_MOBILE_UX_GUIDE.md) | Mobile usage guidance |
| [11_DEPLOYMENT_AND_ENV.md](./11_DEPLOYMENT_AND_ENV.md) | Deployment checklist |
| [12_FAILURE_RECOVERY.md](./12_FAILURE_RECOVERY.md) | Error handling & recovery |
| [13_TROUBLESHOOTING.md](./13_TROUBLESHOOTING.md) | Common issues & fixes |

---

## Quick Start for IT Admins

1. **Read** [11_DEPLOYMENT_AND_ENV.md](./11_DEPLOYMENT_AND_ENV.md) — Deploy the system
2. **Read** [08_DATABASE_AND_SQL_MIGRATIONS.md](./08_DATABASE_AND_SQL_MIGRATIONS.md) — Set up database
3. **Read** [03_ADMIN_GUIDE.md](./03_ADMIN_GUIDE.md) — Learn admin workflows
4. **Read** [12_FAILURE_RECOVERY.md](./12_FAILURE_RECOVERY.md) — Know recovery procedures

---

## Contact & Support

- **Repository**: Internal deployment
- **Issue Tracking**: Contact school IT administrator

---

*End of System Overview*

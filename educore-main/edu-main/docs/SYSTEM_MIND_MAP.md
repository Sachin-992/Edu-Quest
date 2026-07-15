# EDUCORE-OMEGA System Mind Map

> Complete architectural visualization of the Institutional Operating System

---

## System Overview

```
EDUCORE-OMEGA
├── 🔐 Authentication & Identity
├── 🖥️ Portals (4)
├── 📦 Core Modules (16)
├── ⚙️ Service Layer (16)
├── 🗄️ Data Layer
├── 🛡️ Security & RLS
├── 📜 Audit & Compliance
├── 🤖 LLM Intelligence Layer
├── 💼 Business Layer
└── ⚠️ Risks & Roadmap
```

---

## 1. 🔐 Authentication & Identity

```
Authentication & Identity
├── Provider: Supabase Auth
│   ├── Login Flow
│   │   ├── Email + Password → supabase.auth.signIn()
│   │   ├── Validate → auth.users table
│   │   └── Resolve Role → public.users table
│   │
│   ├── Session Management
│   │   ├── JWT Tokens
│   │   ├── Automatic refresh
│   │   └── Logout → clear local state + Supabase signOut
│   │
│   └── Security Controls
│       ├── Password hashing (bcrypt)
│       ├── First-login detection (first_login flag)
│       └── Account status (active/inactive/suspended)
│
├── Identity Store: public.users
│   ├── id (UUID) ← Links to auth.users
│   ├── email
│   ├── role (admin/teacher/student/parent)
│   ├── status
│   ├── first_login
│   └── created_by
│
└── Role Resolution
    ├── NO client-side role selection
    ├── Role from database ONLY
    └── mapDbRoleToUserRole() in App.tsx
```

---

## 2. 🖥️ Portals

```
Portals (Single Portal Per User)
│
├── 👑 ADMIN PORTAL [UserRole.ADMIN]
│   ├── Owner: School Administrators
│   ├── Access: UNIVERSAL (all data)
│   ├── Modules:
│   │   ├── OverviewDashboard → System metrics
│   │   ├── UserManagement → Identity admin
│   │   ├── SchoolStructure → Classes, sections
│   │   ├── StudentProfiles → Student CRUD
│   │   ├── TeacherManagement → Teacher CRUD
│   │   ├── ParentManagement → Parent CRUD + linking
│   │   ├── FinanceFees → Fee management
│   │   ├── AnalyticsDashboard → Reports
│   │   ├── AuditCompliance → Security logs
│   │   └── SystemIntegrity → Health checks
│   │
│   └── Capabilities: CREATE, READ, UPDATE, DELETE, EXPORT, ADMIN
│
├── 📚 TEACHER PORTAL [UserRole.TEACHER]
│   ├── Owner: Faculty Members
│   ├── Access: Assigned classes/subjects ONLY
│   ├── Modules:
│   │   ├── Class Overview → My classes
│   │   ├── Attendance → Mark attendance
│   │   ├── Assignments → Create/grade
│   │   ├── Marks Entry → Enter grades
│   │   ├── Resources → Upload materials
│   │   └── AI Assistant → Curriculum-bound
│   │
│   └── Capabilities: READ, CREATE (marks/attendance), UPDATE (assigned)
│
├── 🎓 STUDENT PORTAL [UserRole.STUDENT]
│   ├── Owner: Enrolled Students
│   ├── Access: OWN RECORDS ONLY (VIEW-ONLY)
│   ├── Modules:
│   │   ├── Dashboard → My performance
│   │   ├── Subjects → My curriculum
│   │   ├── Attendance → My attendance
│   │   ├── Resources → Download materials
│   │   └── AI Tutor → Learning assistant
│   │
│   └── Capabilities: READ ONLY (no upload, no edit)
│
└── 👨‍👩‍👧 PARENT PORTAL [UserRole.PARENT]
    ├── Owner: Guardians
    ├── Access: LINKED CHILDREN ONLY
    ├── Modules:
    │   ├── Child Overview → Each child's data
    │   ├── Attendance → View child attendance
    │   ├── Marks → View child performance
    │   └── Fees → View fee status
    │
    └── Capabilities: READ ONLY (linked students)
```

---

## 3. ⚙️ Service Layer

```
Service Layer (16 Services)
│
├── 🔐 IDENTITY SERVICES
│   ├── authService.ts
│   │   ├── signIn() → Supabase Auth
│   │   ├── signOut() → Clear session
│   │   ├── createUser() → Admin-only user creation
│   │   ├── resetPassword() → Password update
│   │   ├── getCurrentUser() → Session info
│   │   └── Audit: Logs all auth events
│   │
│   └── rbacService.ts
│       ├── PERMISSION_MATRIX → 15+ resource types
│       ├── hasPermission() → Check access
│       ├── checkAndLog() → Check + audit
│       ├── enforce() → Throw if denied
│       ├── canAccessPortal() → Portal gate
│       └── setCurrentUser() → Context management
│
├── 📊 DATA SERVICES
│   ├── studentService.ts
│   │   ├── getStudents() → List with filters
│   │   ├── createStudent() → With column mapping
│   │   ├── updateStudent() → With column mapping
│   │   ├── deleteStudent() → Hard delete
│   │   └── Column Mapping: name↔full_name, roll_no↔roll_number
│   │
│   ├── teacherService.ts
│   │   ├── getTeachers()
│   │   ├── createTeacher() → With column mapping
│   │   ├── updateTeacher()
│   │   └── deleteTeacher()
│   │
│   ├── schoolService.ts
│   │   ├── Classes management
│   │   ├── Sections management
│   │   └── Subjects management
│   │
│   ├── financeService.ts
│   │   ├── Fee records
│   │   ├── Payment tracking
│   │   └── Financial reports
│   │
│   └── academicService.ts
│       ├── Attendance records
│       └── Marks/grades
│
├── 📁 STORAGE SERVICES
│   ├── fileStorageService.ts
│   │   ├── uploadFile() → Supabase Storage
│   │   ├── getSignedUrl() → Secure download
│   │   ├── listFilesForClass()
│   │   ├── listFilesForStudent()
│   │   └── RBAC: Permission checks before access
│   │
│   └── aadhaarService.ts
│       ├── Encrypted storage
│       ├── Masked display
│       └── Verification
│
├── 🤖 AI SERVICES
│   └── geminiService.ts
│       ├── sendMessageToGemini()
│       ├── Role injection: {{USER_ROLE}}
│       ├── Curriculum binding: {{CURRICULUM}}
│       └── Model: gemini-2.0-flash-exp
│
├── 📊 ANALYTICS SERVICES
│   ├── analyticsService.ts
│   │   └── Session logging
│   │
│   └── reportService.ts
│       └── Report generation
│
└── 📜 AUDIT SERVICES
    └── auditService.ts
        ├── log() → Write to audit_logs (IMMUTABLE)
        ├── logLogin() → Auth events
        ├── logLogout() → Session end
        ├── logAccess() → Data access
        ├── logAccessDenied() → RBAC violations
        ├── getLogs() → Query with filters
        ├── exportLogs() → JSON export
        └── Immutability: DB triggers prevent UPDATE/DELETE
```

---

## 4. 🗄️ Data Layer

```
Data Layer (Supabase PostgreSQL)
│
├── IDENTITY TABLES
│   ├── auth.users (Supabase-managed)
│   │   ├── id (UUID)
│   │   ├── email
│   │   ├── encrypted_password
│   │   └── Managed by Supabase Auth
│   │
│   └── public.users
│       ├── id (UUID) → FK to auth.users
│       ├── email
│       ├── role (admin/teacher/student/parent)
│       ├── status (active/inactive/suspended)
│       ├── first_login (boolean)
│       ├── created_by (UUID)
│       └── RLS: user_self_read, admin_manage_users
│
├── PROFILE TABLES
│   ├── students
│   │   ├── id, user_id
│   │   ├── full_name (DB) ↔ name (UI)
│   │   ├── roll_number (DB) ↔ roll_no (UI)
│   │   ├── class, section
│   │   ├── admission_number
│   │   ├── parent_name, parent_phone
│   │   ├── aadhaar_encrypted, aadhaar_masked
│   │   ├── fee_status, status
│   │   └── RLS: student_self, teacher_assigned, parent_linked, admin_all
│   │
│   ├── teachers
│   │   ├── id, user_id
│   │   ├── full_name, email, phone
│   │   ├── subject, classes[]
│   │   ├── experience_years, designation
│   │   ├── status, join_date
│   │   └── RLS: teacher_self, admin_all
│   │
│   └── parents
│       ├── id, user_id
│       ├── full_name, email, phone
│       └── RLS: parent_self, admin_all
│
├── RELATIONSHIP TABLES
│   └── parent_student_links
│       ├── id, parent_id, student_id
│       ├── relationship (parent/guardian)
│       └── Multi-child support
│
├── ACADEMIC TABLES
│   ├── attendance
│   │   ├── student_id, date, status
│   │   ├── marked_by
│   │   └── RLS: student_own, parent_linked, teacher_create
│   │
│   └── marks
│       ├── student_id, subject, exam_type
│       ├── marks_obtained, max_marks, grade
│       ├── entered_by
│       └── RLS: student_own, parent_linked, teacher_create
│
├── STORAGE TABLES
│   └── academic_files
│       ├── id, name, storage_path
│       ├── mime_type, size_bytes
│       ├── owner_id, owner_role
│       ├── assigned_to_class, assigned_to_student
│       └── Stored in: Supabase Storage bucket
│
└── AUDIT TABLES
    └── audit_logs
        ├── id, timestamp
        ├── actor_id, actor_email, actor_role
        ├── action, entity, entity_id
        ├── details, severity
        ├── ip_address, session_id
        └── IMMUTABLE: Triggers prevent UPDATE/DELETE
```

---

## 5. 🛡️ Security & RLS

```
Security Architecture
│
├── Row Level Security (RLS)
│   ├── Policy Types:
│   │   ├── user_self_read → Own record
│   │   ├── admin_full_access → All operations
│   │   ├── teacher_assigned → Assigned classes
│   │   └── parent_linked → Linked children
│   │
│   ├── Current Status: ⚠️ DISABLED (enable_admin_access.sql)
│   │
│   └── Schema Policies (dormant):
│       ├── students: 4 policies
│       ├── teachers: 2 policies
│       ├── parents: 2 policies
│       ├── attendance: 4 policies
│       └── marks: 4 policies
│
├── RBAC Implementation
│   ├── Location: rbacService.ts
│   ├── Enforcement: Service layer
│   ├── Resources: 15+ types
│   │   ├── student:profile
│   │   ├── student:attendance
│   │   ├── student:marks
│   │   ├── teacher:profile
│   │   ├── parent:profile
│   │   ├── school:classes
│   │   ├── finance:fees
│   │   ├── files:upload
│   │   ├── files:download
│   │   ├── ai:chat
│   │   └── admin:audit
│   │
│   └── Permissions: read, create, update, delete, export, admin
│
└── Audit Points
    ├── Authentication: Login/logout events
    ├── RBAC: All permission checks
    ├── Data Access: CRUD operations
    ├── File Access: Upload/download
    └── Denied Access: Failed permission checks
```

---

## 6. 🤖 LLM Intelligence Layer

```
LLM Governance
│
├── Provider: Google Gemini 2.0 Flash
│
├── System Instruction (140 lines)
│   ├── Identity: "EDUCORE-OMEGA"
│   ├── Core Principle: "IDENTITY DEFINES ACCESS"
│   │
│   ├── 6 FOUNDER LAWS
│   │   ├── LAW 1: Identity over Interface
│   │   ├── LAW 2: Governance over Convenience
│   │   ├── LAW 3: Curriculum over Generic Knowledge
│   │   ├── LAW 4: Mastery over Memorization
│   │   ├── LAW 5: Employability over Certificates
│   │   └── LAW 6: Trust over Virality
│   │
│   ├── Context Injection
│   │   ├── {{USER_ROLE}} → Current role
│   │   ├── {{CLASS}} → Student class
│   │   └── {{CURRICULUM}} → Current curriculum
│   │
│   └── Prohibitions
│       ├── ✘ No guest/anonymous access
│       ├── ✘ No role spoofing
│       ├── ✘ No data access pre-login
│       ├── ✘ No shared accounts
│       ├── ✘ No multiple portals
│       └── ✘ No role switching
│
├── 15 Platform Engines
│   ├── Engine 1-5: Pedagogy, Curriculum, Exams, Faculty, Security
│   ├── Engine 6-10: Analytics, Teacher Ops, Student UX, Career, Parent
│   └── Engine 11-15: APIs, Academic, Admin, DB RBAC, Role Screens
│
└── Risk Mitigations
    ├── Role injected server-side
    ├── Curriculum bound in prompt
    ├── Explicit portal lock rules
    └── ⚠️ GAP: Interactions not logged
```

---

## 7. 📜 Audit & Compliance

```
Audit System
│
├── Audit Log Table: audit_logs
│   ├── Fields:
│   │   ├── timestamp (auto)
│   │   ├── actor_id, actor_email, actor_role
│   │   ├── action (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, ACCESS_DENIED)
│   │   ├── entity, entity_id
│   │   ├── details (JSON)
│   │   ├── severity (info/warning/error/critical)
│   │   ├── ip_address, session_id
│   │   └── Indexed for performance
│   │
│   └── Immutability:
│       ├── DB Trigger: audit_no_update
│       ├── DB Trigger: audit_no_delete
│       └── "Audit logs are immutable and cannot be modified or deleted"
│
├── Logged Events
│   ├── ✅ Authentication events
│   ├── ✅ Profile CRUD
│   ├── ✅ Attendance/marks operations
│   ├── ✅ File uploads/downloads
│   ├── ✅ Permission denials
│   ├── ✅ Admin actions
│   └── ⚠️ LLM interactions (NOT logged)
│
└── Compliance Readiness
    ├── Institutional audits: ✅ Ready
    ├── Legal discovery: ✅ Ready (immutable)
    ├── Security incidents: ✅ Traceable
    └── GDPR/privacy: ⚠️ Partial
```

---

## 8. 💼 Business Layer

```
Business Model
│
├── Target Segments
│   ├── K-12 Schools ✅
│   ├── Colleges ✅
│   ├── Government Schools ⚠️ (needs certs)
│   └── Coaching Centers ✅
│
├── Value Proposition
│   ├── Governance-first design
│   ├── Role-locked portals
│   ├── Immutable audit logs
│   ├── LLM curriculum-bound
│   └── Enterprise compliance
│
├── Revenue Model Options
│   ├── Per-student SaaS ✅ Ready
│   ├── Institution license ✅ Ready
│   ├── Freemium ⚠️ Possible
│   └── White-label ⚠️ Needs work
│
└── Cost Structure
    ├── Supabase: $25-100/mo
    ├── Gemini API: $50-200/mo
    ├── Hosting: $20-100/mo
    └── Support: Variable
```

---

## 9. ⚠️ Risks & Roadmap

```
Current Gaps
│
├── 🔴 CRITICAL
│   ├── G1: RLS disabled on data tables
│   │   └── Fix: Re-enable before production
│   │
│   └── G2: Schema column mismatches
│       └── Fix: Standardize naming convention
│
├── 🟠 MEDIUM
│   ├── G3: Service role key not configured
│   │   └── Fix: Configure for admin.createUser()
│   │
│   ├── G4: LLM interactions not audited
│   │   └── Fix: Add logging to geminiService
│   │
│   └── G5: Demo fallback masks errors
│       └── Fix: Separate demo mode from error handling
│
└── 🟡 LOW
    ├── G6: Hard deletes (no soft delete)
    ├── G7: No email confirmation flow
    └── G8: Type safety gaps (any types)

Roadmap
│
├── IMMEDIATE (Pre-Pilot)
│   ├── Re-enable RLS
│   ├── Fix column mapping
│   └── Configure service role
│
├── SHORT-TERM (Pre-Enterprise)
│   ├── Implement soft deletes
│   ├── Add GDPR flows
│   └── Automated RBAC tests
│
└── LONG-TERM (Government-grade)
    ├── Security certifications
    ├── Multi-tenancy
    └── SLA infrastructure
```

---

## Data Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    USER      │────▶│  LOGIN UI   │────▶│ authService  │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌────────────────────────────┼────────────────────────────┐
                     │                            ▼                            │
                     │              ┌──────────────────────┐                   │
                     │              │   Supabase Auth      │                   │
                     │              │   (auth.users)       │                   │
                     │              └──────────┬───────────┘                   │
                     │                         │                               │
                     │                         ▼                               │
                     │              ┌──────────────────────┐                   │
                     │              │   public.users       │                   │
                     │              │   (role resolution)  │                   │
                     │              └──────────┬───────────┘                   │
                     │                         │                               │
                     │                         ▼                               │
                     │              ┌──────────────────────┐                   │
                     │              │    rbacService       │                   │
                     │              │   (set user context) │                   │
                     │              └──────────┬───────────┘                   │
                     │                         │                               │
                     │                         ▼                               │
                     │    ┌────────────────────┼────────────────────┐          │
                     │    │                    │                    │          │
                     │    ▼                    ▼                    ▼          │
                     │ ┌──────┐           ┌──────┐            ┌──────┐         │
                     │ │ADMIN │           │TEACHER│           │STUDENT│        │
                     │ │PORTAL│           │PORTAL │           │PORTAL │        │
                     │ └──┬───┘           └──┬────┘           └──┬────┘        │
                     │    │                  │                   │             │
                     │    ▼                  ▼                   ▼             │
                     │ ┌────────────────────────────────────────────┐          │
                     │ │            SERVICE LAYER                    │          │
                     │ │  studentService │ teacherService │ etc.    │          │
                     │ └──────────────────────┬─────────────────────┘          │
                     │                        │                                │
                     │                        ▼                                │
                     │ ┌────────────────────────────────────────────┐          │
                     │ │            SUPABASE                         │          │
                     │ │  PostgreSQL │ Storage │ Auth                │          │
                     │ │  RLS Policies (currently disabled)          │          │
                     │ └────────────────────────────────────────────┘          │
                     │                                                         │
                     └─────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                     ┌────────────────────────────────────────────┐
                     │            AUDIT_LOGS (IMMUTABLE)          │
                     │  All actions logged with actor, timestamp  │
                     └────────────────────────────────────────────┘
```

---

**End of System Mind Map**

*Generated: January 21, 2026*

# EDUCORE-OMEGA: Edge Functions

> **Document Version**: 1.0  
> **Last Updated**: January 2026  
> **For**: IT Administrators and Developers

---

## Overview

Edge Functions are server-side functions running on Supabase (Deno runtime). They use `SERVICE_ROLE_KEY` for privileged operations like user creation.

---

## Edge Function Inventory

| Function | Path | Purpose |
|----------|------|---------|
| `iam` | `supabase/functions/iam/` | Identity and Access Management |
| `academic-actions` | `supabase/functions/academic-actions/` | Academic operations |

---

## Function 1: IAM (Identity and Access Management)

**Path:** `supabase/functions/iam/index.ts`

### Purpose
Server-side user creation that:
- Creates auth.users entry
- Creates public.users entry
- Creates role-specific profile
- Logs to audit_logs
- Does NOT affect caller's session

### Required Environment Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `SUPABASE_URL` | Project URL | Supabase Dashboard |
| `SUPABASE_ANON_KEY` | Public anon key | Supabase Dashboard |
| `SERVICE_ROLE_KEY` | Admin key | Supabase Dashboard → Settings → API |

> **SECURITY**: Never expose `SERVICE_ROLE_KEY` in frontend code.

### Actions

#### `createStudent`

| Field | Description | Required |
|-------|-------------|----------|
| `action` | `"createStudent"` | ✅ |
| `email` | Student email | ✅ |
| `full_name` | Student name | ✅ |
| `dob` | Date of birth (YYYY-MM-DD) | ✅ |
| `class` | Class name | ✅ |
| `section` | Section | Optional |
| `roll_number` | Roll number | Optional |
| `admission_number` | Admission ID | Optional |
| `address` | Address | Optional |
| `guardian_phone` | Phone | Optional |

**Response:**
```json
{
  "success": true,
  "message": "Student created",
  "user_id": "uuid"
}
```

**Errors:**
| Error | Cause |
|-------|-------|
| "Admin only action" | Caller is not admin |
| "Missing fields" | Required fields empty |
| "Email already registered" | Duplicate email |

---

#### `createTeacher`

| Field | Description | Required |
|-------|-------------|----------|
| `action` | `"createTeacher"` | ✅ |
| `email` | Teacher email | ✅ |
| `full_name` | Teacher name | ✅ |
| `dob` | Date of birth | ✅ |
| `subject` | Primary subject | ✅ |
| `phone` | Phone | Optional |
| `experience_years` | Experience | Optional |
| `qualification` | Qualification | Optional |

---

#### `createParent`

| Field | Description | Required |
|-------|-------------|----------|
| `action` | `"createParent"` | ✅ |
| `email` | Parent email | ✅ |
| `full_name` | Parent name | ✅ |
| `student_id` | Linked student UUID | ✅ |
| `child_dob` | Child's DOB (for password) | ✅ |
| `phone` | Phone | Optional |
| `relationship` | parent/guardian | Optional |

---

### Calling from Frontend

```typescript
const { data, error } = await supabase.functions.invoke('iam', {
  body: {
    action: 'createStudent',
    payload: {
      email: 'student@school.edu',
      full_name: 'John Doe',
      dob: '2010-05-15',
      class: 'Class 5',
      section: 'A'
    }
  }
});
```

---

## Function 2: Academic Actions

**Path:** `supabase/functions/academic-actions/index.ts`

### Purpose
Teacher operations for file upload, attendance, homework, and marks.

### Actions

#### `uploadFile`
Upload study material to storage.

| Field | Required |
|-------|----------|
| `class_id` | ✅ |
| `subject_id` | Optional |
| `file_name` | ✅ |
| `mime_type` | ✅ |
| `base64` | ✅ (file content) |

---

#### `createNotice`
Create school notice.

| Field | Required |
|-------|----------|
| `class_id` | ✅ |
| `type` | ✅ |
| `title` | ✅ |
| `content` | ✅ |

---

#### `updateHomework`
Create/update daily homework.

| Field | Required |
|-------|----------|
| `class_id` | ✅ |
| `subject_id` | ✅ |
| `content` | ✅ |
| `date` | Optional (defaults to today) |

---

#### `markAttendance`
Mark period attendance.

| Field | Required |
|-------|----------|
| `period_id` | ✅ |
| `records` | ✅ (array of {student_id, status}) |

---

#### `submitMarks`
Submit exam marks.

| Field | Required |
|-------|----------|
| `exam_id` | ✅ |
| `records` | ✅ (array of {student_id, subject, marks, max_marks}) |

---

## Deployment

### Deploy Edge Functions

```bash
# Login to Supabase CLI
npx supabase login

# Link to project
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy IAM function
npx supabase functions deploy iam

# Deploy academic-actions function
npx supabase functions deploy academic-actions
```

### Set Secrets

```bash
# Set SERVICE_ROLE_KEY secret
npx supabase secrets set SERVICE_ROLE_KEY=your_service_role_key
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing Authorization header" | Include Bearer token in request |
| "Admin only action" | Verify caller has admin role |
| "Invalid token" | Token expired, re-login |
| Function not responding | Check Supabase Edge Functions logs |

---

*End of Edge Functions Document*

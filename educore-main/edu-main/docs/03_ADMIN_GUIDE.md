# EDUCORE-OMEGA: Admin Guide

> **Document Version**: 1.0  
> **Last Updated**: January 2026  
> **For**: School Administrators

---

## Admin Portal Overview

The Admin Portal provides full system control with 10 modules:

| Module | Purpose |
|--------|---------|
| Overview Dashboard | System metrics, quick actions |
| User Management | View all users |
| School Structure | Classes, sections, subjects |
| Student Profiles | Enroll/manage students |
| Teacher Management | Hire/manage teachers |
| Parent Management | Link parents to students |
| Finance & Fees | Fee tracking, payments |
| Analytics | Reports and insights |
| Audit & Compliance | Security logs |
| System Integrity | Health checks |

---

## Daily Workflows

### 1. Login as Admin

1. Go to application URL
2. Enter admin email
3. Enter password
4. Click **Login**
5. Verify you see the Admin Dashboard

---

### 2. Enroll a New Student

**Step-by-step:**

1. Click **Student Profiles** in sidebar
2. Click **+ Enroll Student** button
3. Fill in student details:
   - Name (required)
   - Email (required)
   - Date of Birth (required) — becomes password
   - Class (required)
   - Section (required)
   - Roll Number
   - Address
   - Parent Phone
4. Click **Enroll Student**
5. **SUCCESS**: See confirmation with temporary password
6. **VERIFY**: Student appears in the list

**What happens behind the scenes:**
- IAM Edge Function creates user (not client-side)
- Your admin session is NOT affected
- Student can now login with DOB as password

**Common Errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| "Email already registered" | Duplicate email | Use different email |
| "Server error" | Edge Function down | Check Supabase dashboard |

---

### 3. Add a New Teacher

**Step-by-step:**

1. Click **Teacher Management** in sidebar
2. Click **+ Add Teacher** button
3. Fill in teacher details:
   - Name (required)
   - Email (required)
   - Date of Birth (required) — initial password
   - Subject (required)
   - Phone
   - Experience Years
   - Qualification
4. Click **Add Teacher**
5. **SUCCESS**: Teacher appears in list
6. Share login credentials with teacher

---

### 4. Link Parent to Student

**Step-by-step:**

1. Click **Parent Management** in sidebar
2. Click **+ Add Parent** button
3. Fill in parent details:
   - Name (required)
   - Email (required)
   - Phone
   - Select Student (required) — dropdown of existing students
   - Relationship (parent/guardian)
4. Click **Add Parent**
5. **SUCCESS**: Parent linked to student
6. Parent's password = child's DOB

---

### 5. View Audit Logs

**Step-by-step:**

1. Click **Audit & Compliance** in sidebar
2. See list of all system actions
3. Use filters:
   - By date range
   - By user
   - By action type
   - By severity
4. Click **Export** to download logs

**Actions logged:**
- Login/logout events
- User creation/modification
- Data access
- Permission denials

---

### 6. Manage Fees

**Step-by-step:**

1. Click **Finance & Fees** in sidebar
2. See fee records by student
3. To record payment:
   - Find student
   - Click **Record Payment**
   - Enter amount
   - Select payment method
   - Click **Save**
4. Fee status auto-updates (Paid/Partial/Pending)

---

### 7. View Analytics

**Step-by-step:**

1. Click **Analytics** in sidebar
2. See dashboards:
   - Attendance trends
   - Fee collection status
   - Class performance
3. Export reports as CSV/JSON

---

## Error Handling

| Error | What to Do |
|-------|-----------|
| "Database connection unavailable" | Check Supabase status |
| "Permission denied" | Verify you're logged in as admin |
| "Edge Function failed" | Check Supabase Edge Functions logs |
| Blank screen | Clear browser cache, re-login |

---

## Mobile Usage

- All admin features work on mobile
- Sidebar collapses to hamburger menu
- Forms scroll vertically
- Tables are scrollable horizontally

---

*End of Admin Guide*

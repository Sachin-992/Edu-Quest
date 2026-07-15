# EDUCORE-OMEGA Production Setup Guide

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Database Schema
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the contents of `supabase_production_schema.sql`
4. Click **Run**

### Step 2: Create Storage Bucket
1. Go to **Storage** in Supabase dashboard
2. Click **New Bucket**
3. Name: `academic-files`
4. **Uncheck** "Public bucket" (keep private)
5. Click **Create bucket**

### Step 3: Verify Configuration
Your `.env.local` should have:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 📋 What Gets Created

### Database Tables (16 total)
| Table | Purpose |
|-------|---------|
| `users` | All user accounts |
| `classes` | School classes (1-12) |
| `sections` | Class sections (A, B, etc.) |
| `subjects` | Academic subjects |
| `students` | Student records |
| `teachers` | Teacher records |
| `parents` | Parent/guardian records |
| `parent_student_links` | Parent-child relationships |
| `attendance` | Daily attendance |
| `marks` | Academic marks/grades |
| `assignments` | Homework/projects |
| `remarks` | Student remarks |
| `fee_records` | Fee tracking |
| `payments` | Payment transactions |
| `files` | Uploaded file metadata |
| `audit_logs` | Immutable action logs |

### Security Features
- ✅ Row Level Security (RLS) on all tables
- ✅ Role-based access policies
- ✅ Immutable audit logs (triggers block update/delete)
- ✅ Performance indexes

### Demo Data Included
- 12 classes
- 9 subjects
- 6 teachers
- 6 students
- Fee records

---

## 🔐 RLS Policy Summary

| Role | Read | Create | Update | Delete |
|------|------|--------|--------|--------|
| Admin | All | All | All | All |
| Teacher | Own + Assigned | Attendance, Marks | Own Records | Own Files |
| Parent | Linked Child | None | None | None |
| Student | Own Records | None | None | None |

---

## ✅ Verification Checklist

After running the schema:

- [ ] Go to **Table Editor** - verify 16 tables exist
- [ ] Check **Authentication** - ensure Email provider is enabled
- [ ] Check **Storage** - verify `academic-files` bucket exists
- [ ] Run the app at `npm run dev`
- [ ] Login as Admin and check all modules load real data

---

## 🎯 You're Done!

Your EDUCORE-OMEGA system is now production-ready with:
- Real database persistence
- Secure role-based access
- Immutable audit logging
- File storage with signed URLs

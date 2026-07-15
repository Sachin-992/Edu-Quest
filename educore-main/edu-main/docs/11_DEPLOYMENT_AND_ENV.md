# EDUCORE-OMEGA: Deployment & Environment

> **Document Version**: 1.0  
> **Last Updated**: January 2026  
> **For**: IT Administrators

---

## Pre-Deployment Checklist

### 1. Supabase Project Setup

- [ ] Create Supabase project at [supabase.com](https://supabase.com)
- [ ] Note Project URL
- [ ] Note Anon Key (public)
- [ ] Note Service Role Key (secret)

### 2. Database Setup

- [ ] Run `supabase_production_schema.sql` in SQL Editor
- [ ] Verify 16 tables created
- [ ] Verify RLS enabled on all tables
- [ ] Create `academic-files` storage bucket

### 3. Edge Functions

- [ ] Deploy `iam` function
- [ ] Deploy `academic-actions` function
- [ ] Set `SERVICE_ROLE_KEY` secret

### 4. Frontend Configuration

- [ ] Create `.env` file
- [ ] Set all environment variables
- [ ] Build production bundle
- [ ] Deploy to hosting

---

## Environment Variables

### Required Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Public anon key | Supabase Dashboard → Settings → API |

### Example .env File

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **SECURITY**: Never commit `.env` to repositories.

---

## Deployment Steps

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd edu-main
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### Step 4: Build Production Bundle

```bash
npm run build
```

Output will be in `dist/` folder.

### Step 5: Deploy to Hosting

**Option A: Netlify**
1. Go to [netlify.com](https://netlify.com)
2. Drag `dist` folder to deploy
3. Set environment variables in Site Settings

**Option B: Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Import repository
3. Set environment variables
4. Deploy

**Option C: Custom Server**
1. Copy `dist/` folder to web server
2. Configure server for SPA routing
3. Ensure HTTPS is enabled

---

## Edge Function Deployment

### Install Supabase CLI

```bash
npm install -g supabase
```

### Login and Link

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### Deploy Functions

```bash
supabase functions deploy iam
supabase functions deploy academic-actions
```

### Set Secrets

```bash
supabase secrets set SERVICE_ROLE_KEY=your_service_role_key
```

---

## Storage Bucket Setup

1. Go to Supabase Dashboard → **Storage**
2. Create bucket: `academic-files`
3. Keep bucket **PRIVATE** (not public)
4. Add policies (see [08_DATABASE_AND_SQL_MIGRATIONS.md](./08_DATABASE_AND_SQL_MIGRATIONS.md))

---

## Post-Deployment Verification

### Verify Database

```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return 16
```

### Verify RLS

```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';
-- All should show TRUE
```

### Verify Frontend

1. Open application URL
2. Should see login page
3. No console errors

### Verify Edge Functions

1. Go to Supabase Dashboard → **Edge Functions**
2. All functions should show "Running"

---

## First Admin User

After deployment, create first admin:

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **Add User**
3. Enter admin email and password
4. Copy the user's **UUID**
5. Go to **SQL Editor** and run:

```sql
INSERT INTO users (auth_id, email, name, role, status)
VALUES (
  'paste-uuid-here',
  'admin@school.edu',
  'School Admin',
  'admin',
  'active'
);
```

---

## DNS and SSL

- Ensure HTTPS is enabled
- Set up custom domain if needed
- SSL certificates should be valid

---

*End of Deployment Document*

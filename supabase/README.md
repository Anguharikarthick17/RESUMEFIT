# Supabase Setup Guide for ResumeFit

This directory contains the database migration for ResumeFit.

## 1. Apply Migration via Supabase SQL Editor

1. Open your Supabase Project Dashboard.
2. Go to the **SQL Editor** tab.
3. Copy the contents of [`migrations/20260820_init_resumefit_schema.sql`](file:///Users/ahk/ResumeFit/supabase/migrations/20260820_init_resumefit_schema.sql) and paste it into the query editor.
4. Click **Run** to execute the migration and create all tables, indexes, and constraints.

## 2. Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**.
2. Click **New Bucket**.
3. Set Name to `resume-files`.
4. Leave Public unchecked (private bucket).
5. Save the bucket.

## 3. Environment Variables Setup

### Backend (`backend/.env`)
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Frontend (`frontend/.env`)
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key
```

# Complete Database Schemas - Supabase

## Overview
This document lists the actual column names and requirements for all tables in the Supabase database.

---

## 1. SECTIONS Table

### Columns:
- `id` (UUID, PRIMARY KEY) - Auto-generated
- `section_code` (VARCHAR, **REQUIRED**) - Unique code like "GR7-A"
- `section_name` (VARCHAR, **REQUIRED**) - Full name like "Grade 7 - Section A"
- `grade_level` (VARCHAR, **REQUIRED**) - Grade as string: "7", "8", "9", etc.
- `adviser_id` (UUID, OPTIONAL) - Reference to teacher
- `capacity` (INTEGER, OPTIONAL) - Max students
- `created_at` (TIMESTAMPTZ) - Auto-generated
- `updated_at` (TIMESTAMPTZ) - Auto-generated

### Example Insert:
```json
{
  "section_code": "GR7-A",
  "section_name": "Grade 7 - Section A",
  "grade_level": "7"
}
```

### Fixed In:
- `public/admin/sections.html` - Auto-generates section_code from name and grade

---

## 2. SUBJECTS Table

### Columns:
- `id` (UUID, PRIMARY KEY) - Auto-generated
- `code` (VARCHAR, **REQUIRED**) - Subject code like "MATH7"
- `name` (VARCHAR, **REQUIRED**) - Subject name like "Mathematics 7"
- `description` (TEXT, OPTIONAL) - Description
- `grade_level` (VARCHAR, OPTIONAL) - Target grade level
- `created_at` (TIMESTAMPTZ) - Auto-generated

### Example Record:
```json
{
  "id": "0383f5c4-7eb0-48ac-a510-03b60612eea8",
  "code": "MATH7",
  "name": "Mathematics 7",
  "description": "Basic Mathematics for Grade 7",
  "grade_level": "7",
  "created_at": "2025-11-19T01:19:49+00:00"
}
```

### Status:
✅ **Already Correct** - `public/admin/js/subjects.js` uses correct columns

---

## 3. TEACHING_LOADS Table

### Columns:
- `id` (UUID, PRIMARY KEY) - Auto-generated
- `teacher_id` (UUID, **REQUIRED**) - Foreign key to users table
- `subject_id` (UUID, **REQUIRED**) - Foreign key to subjects table  
- `section_id` (UUID, **REQUIRED**) - Foreign key to sections table
- `academic_year` (VARCHAR, **REQUIRED**) - Like "2024-2025"
- `schedule` (VARCHAR, OPTIONAL) - Schedule string
- `room` (VARCHAR, OPTIONAL) - Room number
- `created_at` (TIMESTAMPTZ) - Auto-generated
- `updated_at` (TIMESTAMPTZ) - Auto-generated

### Example Insert:
```json
{
  "teacher_id": "a860a579-2c4c-4726-b220-2ef6adcfcc23",
  "subject_id": "0383f5c4-7eb0-48ac-a510-03b60612eea8",
  "section_id": "65bbdbee-966d-4503-946f-f5c1150480e9",
  "academic_year": "2024-2025",
  "schedule": "Monday, Wednesday, Friday 08:00-09:00",
  "room": "Room 101"
}
```

### Fixed In:
- `public/admin/js/teaching-loads.js` - Changed from `school_year` to `academic_year`
- Auto-generates academic_year as current year + next year
- Builds schedule string from selected days and times

---

## 4. USERS Table

### Columns:
- `id` (UUID, PRIMARY KEY) - Auto-generated
- `auth_id` (UUID, OPTIONAL) - Supabase auth user ID
- `email` (VARCHAR, **REQUIRED**) - User email
- `role` (VARCHAR, **REQUIRED**) - 'admin', 'teacher', 'student'
- `first_name` (VARCHAR, OPTIONAL)
- `last_name` (VARCHAR, OPTIONAL)
- `full_name` (VARCHAR, OPTIONAL)
- `phone` (VARCHAR, OPTIONAL)
- `contact_email` (VARCHAR, OPTIONAL)
- `address` (TEXT, OPTIONAL)
- `sex` (VARCHAR, OPTIONAL)
- `nationality` (VARCHAR, OPTIONAL)
- `birth_date` (DATE, OPTIONAL)
- `birth_place` (VARCHAR, OPTIONAL)
- `department` (VARCHAR, OPTIONAL)
- `position` (VARCHAR, OPTIONAL)
- `profile_photo` (VARCHAR, OPTIONAL)
- `status` (VARCHAR, DEFAULT 'active')
- `created_at` (TIMESTAMPTZ) - Auto-generated
- `updated_at` (TIMESTAMPTZ) - Auto-generated
- `created_by` (UUID, OPTIONAL)

### Example Record:
```json
{
  "id": "a860a579-2c4c-4726-b220-2ef6adcfcc23",
  "auth_id": "96778f10-5d22-4855-8da0-f8e39bd4ba52",
  "email": "admin@mabinihs.local",
  "role": "admin",
  "first_name": "System",
  "last_name": "Administrator",
  "full_name": "System Administrator",
  "status": "active"
}
```

### Status:
✅ **Already Correct** - `public/admin/js/users.js` uses correct columns

---

## 5. STUDENTS Table

### Columns (Expected):
- `id` (UUID, PRIMARY KEY)
- `student_number` (VARCHAR, **REQUIRED**)
- `first_name` (VARCHAR, **REQUIRED**)
- `last_name` (VARCHAR, **REQUIRED**)
- `grade_level` (VARCHAR)
- `section` (VARCHAR)
- `status` (VARCHAR)
- `qr_code` (TEXT, OPTIONAL)
- `contact_email` (VARCHAR, OPTIONAL)
- Additional fields as per schema

### Status:
⚠️ **Needs Verification** - Schema not fully tested yet

---

## Common Issues Fixed

### 1. Column Name Mismatches
- ❌ `name` → ✅ `section_name` (sections table)
- ❌ `school_year` → ✅ `academic_year` (teaching_loads table)
- ❌ `section` (as column) → ✅ Not needed in sections table

### 2. Missing Required Fields
- `sections` - Required: section_code (was missing, now auto-generated)
- `teaching_loads` - Required: academic_year (was missing, now auto-generated)

### 3. Data Type Issues
- `grade_level` stored as **STRING**, not INTEGER (in all tables)

---

## Testing Credentials

### Service Role Key (for bypassing RLS):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYmxnd3p5bHZ3dXVjbnBtdHppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgwMzgyMiwiZXhwIjoyMDc5Mzc5ODIyfQ.6vl2qD8ivLgHM_WCCvWdj61-peSQDNktxmjjEw34OrI
```

### Admin Account:
- Email: `admin@mabinihs.local`
- Password: `admin123`

---

## RLS (Row Level Security) Status

⚠️ **Currently ENABLED** on all tables, which blocks regular authenticated users.

### Recommended Actions:
1. Run `fix_rls_policies.sql` to disable RLS on users table
2. Run `fix_sections_schema.sql` to disable RLS on sections table
3. Create similar policies for subjects, teaching_loads, students tables

### Alternative:
All operations use **service role key** in backend which bypasses RLS automatically.

---

## Deployment Status

✅ **Latest Deployment**: https://mabini-hs-attendance-bl8ilcoji-wr3ckage7719s-projects.vercel.app

### Pages Fixed:
1. ✅ Sections - Uses correct schema
2. ✅ Subjects - Already correct
3. ✅ Teaching Loads - Fixed academic_year requirement
4. ✅ Users - Already correct
5. ⚠️ Students - Needs verification

### Last Updated:
November 23, 2025

# Mabini HS Attendance System - Complete Database Setup Guide

## 📋 Overview

This guide contains **ALL** information needed to set up and maintain the Mabini HS Attendance System database in Supabase.

**Last Updated:** December 5, 2025  
**Version:** 2.0

---

## 🚀 Quick Start (First Time Setup)

### Step 1: Run the Master SQL Script

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **Mabini HS Attendance**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file: `server/COMPLETE_DATABASE_SETUP.sql`
6. Copy the **entire contents**
7. Paste into Supabase SQL Editor
8. Click **Run** (or press F5)
9. Wait for completion (should show "✅ DATABASE SETUP COMPLETED SUCCESSFULLY!")

### Step 2: Verify Installation

After running the script, check the verification queries at the bottom of the output. You should see:

- ✅ Students table has: `profile_picture_url`, `qr_code_url`, `section_id`, `grade_level`
- ✅ Teachers table has: `qr_code_url`
- ✅ Teaching_loads table has: `day_of_week`, `start_time`, `end_time`
- ✅ Sections table has: `strand`
- ✅ Student_notifications table exists
- ✅ Password_reset_tokens table exists

---

## 📊 Complete Database Schema

### Core Tables

#### 1. **students**
Student profiles with attendance tracking and section assignment.

**Key Columns:**
- `id` (UUID, Primary Key)
- `student_number` (VARCHAR, Unique) - Student ID number
- `first_name`, `last_name` (VARCHAR)
- `email` (VARCHAR, Unique) - For login and notifications
- `username`, `password` (VARCHAR) - Authentication
- `grade_level` (VARCHAR) - Grade 7, 8, 9, 10, 11, or 12
- `section_id` (UUID) - Foreign key to sections table
- `strand` (VARCHAR) - For Senior High (STEM, HUMSS, ABM, etc.)
- `profile_picture_url` (TEXT) - Supabase Storage URL
- `qr_code_url` (TEXT) - Supabase Storage URL for QR login
- `status` (VARCHAR) - active, inactive, graduated

**Storage URLs:**
- Profile pictures: `student-images/profile-pictures/student-{number}-profile.{ext}`
- QR codes: `student-images/qr-codes/student-{number}-qr.png`

#### 2. **teachers**
Teacher profiles and assignments.

**Key Columns:**
- `id` (UUID, Primary Key)
- `employee_number` (VARCHAR, Unique) - Format: TCHR-YYYYMMDD-XXXX
- `first_name`, `last_name` (VARCHAR)
- `email` (VARCHAR, Unique)
- `department`, `position` (VARCHAR)
- `qr_code_url` (TEXT) - Supabase Storage URL for QR login
- `status` (VARCHAR) - active, inactive

#### 3. **sections**
Class sections/groups.

**Key Columns:**
- `id` (UUID, Primary Key)
- `section_code` (VARCHAR, Unique)
- `section_name` (VARCHAR)
- `grade_level` (VARCHAR) - 7, 8, 9, 10, 11, 12
- `strand` (VARCHAR) - STEM, HUMSS, ABM, GAS, TVL, ARTS, SPORTS (for Grades 11-12)
- `adviser_id` (UUID) - Foreign key to teachers
- `capacity` (INTEGER)
- `status` (VARCHAR) - active, inactive

**Strands (Senior High School):**
- STEM (Science, Technology, Engineering, Mathematics)
- HUMSS (Humanities and Social Sciences)
- ABM (Accountancy, Business, and Management)
- GAS (General Academic Strand)
- TVL (Technical-Vocational-Livelihood)
- ARTS (Arts and Design)
- SPORTS (Sports)
- NULL for Junior High School (Grades 7-10)

#### 4. **subjects**
Subject catalog.

**Key Columns:**
- `id` (UUID, Primary Key)
- `code` (VARCHAR, Unique) - Subject code
- `name` (VARCHAR) - Subject name
- `description` (TEXT)
- `grade_level` (VARCHAR)
- `strand` (VARCHAR) - For Senior High subjects
- `units` (INTEGER)
- `status` (VARCHAR)

#### 5. **teaching_loads**
Teacher-Section-Subject assignments with schedule.

**Key Columns:**
- `id` (UUID, Primary Key)
- `teacher_id` (UUID) - Foreign key to teachers
- `section_id` (UUID) - Foreign key to sections
- `subject_id` (UUID) - Foreign key to subjects
- `school_year` (VARCHAR) - e.g., "2023-2024"
- `day_of_week` (VARCHAR) - Monday, Tuesday, Wednesday, Thursday, Friday
- `start_time` (TIME) - e.g., 08:00:00
- `end_time` (TIME) - e.g., 09:00:00
- `room` (VARCHAR)
- `status` (VARCHAR)

#### 6. **student_notifications**
Admin-to-student notifications system.

**Key Columns:**
- `id` (UUID, Primary Key)
- `title` (VARCHAR)
- `message` (TEXT)
- `type` (VARCHAR) - info, warning, success, danger
- `target_type` (VARCHAR) - all, grade, section, individual
- `target_value` (TEXT) - The grade/section/student ID
- `student_id` (UUID) - For individual student tracking
- `is_read` (BOOLEAN)
- `read_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

**Notification Types:**
- `all` - Broadcast to all students
- `grade` - Send to specific grade level (e.g., "11")
- `section` - Send to specific section (section_id)
- `individual` - Send to one student (student_id)

#### 7. **password_reset_tokens**
OTP tokens for password recovery.

**Key Columns:**
- `id` (UUID, Primary Key)
- `email` (VARCHAR)
- `token` (VARCHAR) - 6-digit OTP
- `user_type` (VARCHAR) - student, teacher
- `expires_at` (TIMESTAMPTZ) - 15 minutes from creation
- `used` (BOOLEAN)
- `used_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

---

## 🔐 Row Level Security (RLS) Policies

All tables have RLS enabled with the following policies:

### Public Read Access
These tables allow anyone to read (required for login and public features):
- ✅ students (for login verification)
- ✅ teachers (for login verification)
- ✅ sections (for dropdowns and displays)
- ✅ subjects (for schedule display)
- ✅ teaching_loads (for teacher schedules)
- ✅ student_notifications (filtered by application logic)
- ✅ password_reset_tokens (for OTP verification)

### Write Access
- ✅ Admin users can create/update/delete via service role key
- ✅ Application handles authentication at the API level
- ✅ Students cannot modify their own records (prevents grade tampering)

---

## 🗂️ Storage Buckets

### Bucket: `student-images` (Public)

**Folders:**
1. **profile-pictures/**
   - Student profile photos
   - Format: `student-{number}-profile.{ext}`
   - Example: `student-233294-profile.jpg`

2. **qr-codes/**
   - Student and teacher QR codes for login
   - Format: `student-{number}-qr.png` or `teacher-{empnum}-qr.png`
   - Example: `student-233294-qr.png`, `teacher-TCHR-20251205-1234-qr.png`

**URL Pattern:**
```
https://[project-id].supabase.co/storage/v1/object/public/student-images/[folder]/[filename]
```

**Storage Policies:**
- SELECT: Public (anyone can view)
- INSERT/UPDATE/DELETE: Authenticated users only

---

## 🔧 Database Maintenance

### Cleanup Expired Password Reset Tokens

Run this function periodically (or set up a cron job):

```sql
SELECT cleanup_expired_password_reset_tokens();
```

This removes tokens older than 24 hours.

### Check Student Section Assignments

```sql
SELECT 
    s.student_number,
    s.first_name,
    s.last_name,
    s.grade_level,
    sec.section_name,
    sec.strand,
    CASE 
        WHEN s.section_id IS NULL THEN 'Not Assigned'
        ELSE 'Assigned'
    END as assignment_status
FROM students s
LEFT JOIN sections sec ON s.section_id = sec.id
WHERE s.status = 'active'
ORDER BY s.grade_level, s.last_name;
```

### View Teaching Schedule

```sql
SELECT 
    t.first_name || ' ' || t.last_name as teacher_name,
    sec.section_name,
    sub.name as subject_name,
    tl.day_of_week,
    tl.start_time,
    tl.end_time,
    tl.room
FROM teaching_loads tl
JOIN teachers t ON t.id = tl.teacher_id
JOIN sections sec ON sec.id = tl.section_id
JOIN subjects sub ON sub.id = tl.subject_id
WHERE tl.status = 'active'
ORDER BY tl.day_of_week, tl.start_time;
```

---

## 📝 Common Operations

### Assign Student to Section

```sql
UPDATE students
SET section_id = '[section-uuid-here]',
    grade_level = '11'
WHERE student_number = '233294';
```

### Create Notification for All Grade 11 Students

```sql
INSERT INTO student_notifications (title, message, type, target_type, target_value)
VALUES (
    'Grade 11 Assembly',
    'All Grade 11 students please report to the gym at 2 PM.',
    'info',
    'grade',
    '11'
);
```

### Generate Student QR Codes (Bulk)

After generating QR codes via the admin panel, they are automatically saved to:
- Database column: `students.qr_code_url`
- Storage location: `student-images/qr-codes/`

Students can download their QR code from the admin panel or use any QR code containing their student number for login.

---

## 🐛 Troubleshooting

### Issue: "Column does not exist" Error

**Solution:** Run the complete SQL setup again. The script uses `IF NOT EXISTS` checks, so it's safe to run multiple times.

### Issue: Students Can't Login with QR Code

**Check:**
1. Student has a `student_number` in the database
2. QR code contains the student number (any format: plain text, JSON, URL)
3. Student status is 'active'

### Issue: Teacher QR Code Upload Fails

**Check:**
1. Teachers table has `qr_code_url` column (run the SQL setup)
2. Storage bucket `student-images/qr-codes` exists and is public
3. Teacher has an `employee_number`

### Issue: Teaching Schedule Doesn't Show Day/Time

**Check:**
1. Teaching_loads table has `day_of_week`, `start_time`, `end_time` columns
2. Records have been updated with schedule data
3. Run this to set defaults:

```sql
UPDATE teaching_loads
SET day_of_week = 'Monday',
    start_time = '08:00:00',
    end_time = '09:00:00'
WHERE day_of_week IS NULL;
```

---

## 📞 Support

For issues or questions:
1. Check the verification queries in the SQL output
2. Review the Supabase dashboard for table structures
3. Check application logs in Vercel dashboard
4. Verify RLS policies are enabled: `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;`

---

## 📌 Important Notes

1. **Always backup before running SQL migrations**
2. The SQL script is idempotent (safe to run multiple times)
3. All timestamps use `TIMESTAMPTZ` for timezone support
4. Student numbers and employee numbers must be unique
5. QR codes can be in any format as long as they contain the ID number
6. Notifications are filtered by application logic, not RLS
7. Password reset tokens expire after 15 minutes
8. Storage URLs are public but file uploads require authentication

---

## ✅ Post-Setup Checklist

After running the SQL script, verify:

- [ ] All tables exist in Supabase
- [ ] RLS is enabled on all tables
- [ ] Storage bucket `student-images` exists and is public
- [ ] Admin can login to `/admin/login.html`
- [ ] Students can login with email or QR code
- [ ] Teachers can login with email or QR code
- [ ] Notifications can be sent from admin panel
- [ ] Student dashboard shows class schedule
- [ ] QR codes can be generated and saved
- [ ] Profile pictures can be uploaded

---

**Last Updated:** December 5, 2025  
**Maintained By:** Mabini HS Attendance System Team

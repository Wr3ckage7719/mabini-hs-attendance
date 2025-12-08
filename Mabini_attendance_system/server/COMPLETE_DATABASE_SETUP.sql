-- =====================================================
-- MABINI HS ATTENDANCE SYSTEM - COMPLETE DATABASE SETUP
-- =====================================================
-- This is the MASTER SQL file containing ALL database migrations
-- Run this script in Supabase SQL Editor to set up or update the database
-- =====================================================
-- Version: 2.0
-- Last Updated: December 5, 2025
-- =====================================================

-- =====================================================
-- SECTION 1: STUDENTS TABLE - Storage & QR Code URLs
-- =====================================================

-- Add profile_picture_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'profile_picture_url'
    ) THEN
        ALTER TABLE public.students 
        ADD COLUMN profile_picture_url TEXT;
        
        COMMENT ON COLUMN public.students.profile_picture_url IS 'URL to profile picture in Supabase Storage (bucket: student-images/profile-pictures)';
    END IF;
END $$;

-- Add qr_code_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'qr_code_url'
    ) THEN
        ALTER TABLE public.students 
        ADD COLUMN qr_code_url TEXT;
        
        COMMENT ON COLUMN public.students.qr_code_url IS 'URL to QR code image in Supabase Storage (bucket: student-images/qr-codes)';
    END IF;
END $$;

-- Add section_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'section_id'
    ) THEN
        ALTER TABLE public.students 
        ADD COLUMN section_id UUID REFERENCES sections(id);
        
        COMMENT ON COLUMN public.students.section_id IS 'References the section/class the student belongs to';
    END IF;
END $$;

-- Add grade_level column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'grade_level'
    ) THEN
        ALTER TABLE public.students 
        ADD COLUMN grade_level VARCHAR(10);
        
        COMMENT ON COLUMN public.students.grade_level IS 'Student grade level (7, 8, 9, 10, 11, 12)';
    END IF;
END $$;

-- Create indexes for students
CREATE INDEX IF NOT EXISTS idx_students_qr_code_url ON students(qr_code_url);
CREATE INDEX IF NOT EXISTS idx_students_profile_picture_url ON students(profile_picture_url);
CREATE INDEX IF NOT EXISTS idx_students_section_id ON students(section_id);
CREATE INDEX IF NOT EXISTS idx_students_grade_level ON students(grade_level);

-- =====================================================
-- SECTION 2: TEACHERS TABLE - QR Code Support
-- =====================================================

-- Add qr_code_url column to teachers table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teachers' 
        AND column_name = 'qr_code_url'
    ) THEN
        ALTER TABLE public.teachers 
        ADD COLUMN qr_code_url TEXT;
        
        COMMENT ON COLUMN public.teachers.qr_code_url IS 'URL to QR code image in Supabase Storage';
    END IF;
END $$;

-- =====================================================
-- SECTION 3: SECTIONS TABLE - Strand Support
-- =====================================================

-- Add strand column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sections' 
        AND column_name = 'strand'
    ) THEN
        ALTER TABLE public.sections 
        ADD COLUMN strand VARCHAR(50);
        
        COMMENT ON COLUMN public.sections.strand IS 'Academic strand for Senior High School sections (STEM, HUMSS, ABM, GAS, TVL, ARTS, SPORTS). NULL for Junior High School (Grades 7-10).';
    END IF;
END $$;

-- Create index for sections
CREATE INDEX IF NOT EXISTS idx_sections_strand ON sections(strand);

-- =====================================================
-- SECTION 4: TEACHING_LOADS TABLE - Schedule Fields
-- =====================================================

-- Add day_of_week column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teaching_loads' 
        AND column_name = 'day_of_week'
    ) THEN
        ALTER TABLE public.teaching_loads 
        ADD COLUMN day_of_week VARCHAR(20);
        
        COMMENT ON COLUMN public.teaching_loads.day_of_week IS 'Day of the week for the class (e.g., Monday, Tuesday, Wednesday)';
    END IF;
END $$;

-- Add start_time column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teaching_loads' 
        AND column_name = 'start_time'
    ) THEN
        ALTER TABLE public.teaching_loads 
        ADD COLUMN start_time TIME;
        
        COMMENT ON COLUMN public.teaching_loads.start_time IS 'Start time of the class period';
    END IF;
END $$;

-- Add end_time column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teaching_loads' 
        AND column_name = 'end_time'
    ) THEN
        ALTER TABLE public.teaching_loads 
        ADD COLUMN end_time TIME;
        
        COMMENT ON COLUMN public.teaching_loads.end_time IS 'End time of the class period';
    END IF;
END $$;

-- Update existing records with default values
UPDATE public.teaching_loads
SET 
    day_of_week = COALESCE(day_of_week, 'N/A'),
    start_time = NULL,
    end_time = NULL
WHERE day_of_week IS NULL;

-- =====================================================
-- SECTION 5: STUDENT NOTIFICATIONS TABLE
-- =====================================================

-- Create student_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.student_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'danger')),
    notification_type VARCHAR(50) DEFAULT 'general',
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('all', 'grade', 'section', 'individual')),
    target_value TEXT,
    student_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Add notification_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'student_notifications' 
        AND column_name = 'notification_type'
    ) THEN
        ALTER TABLE public.student_notifications 
        ADD COLUMN notification_type VARCHAR(50) DEFAULT 'general';
        
        COMMENT ON COLUMN public.student_notifications.notification_type IS 'Category of notification: general, absence, grade, announcement, emergency, attendance_warning';
    END IF;
END $$;

-- Add student_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'student_notifications' 
        AND column_name = 'student_id'
    ) THEN
        ALTER TABLE public.student_notifications 
        ADD COLUMN student_id UUID;
        
        COMMENT ON COLUMN public.student_notifications.student_id IS 'UUID of the student who receives this notification (for individual tracking)';
    END IF;
END $$;

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_target_type ON student_notifications(target_type);
CREATE INDEX IF NOT EXISTS idx_notifications_target_value ON student_notifications(target_value);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON student_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON student_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON student_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_student_read ON student_notifications(student_id, is_read);

-- =====================================================
-- SECTION 6: PASSWORD RESET TABLE
-- =====================================================

-- Create password_reset_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(6) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'teacher')),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for password reset
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used ON password_reset_tokens(used);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- =====================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all read students for teachers" ON students;
DROP POLICY IF EXISTS "Students can view their notifications" ON student_notifications;
DROP POLICY IF EXISTS "Admins and teachers can view all notifications" ON student_notifications;
DROP POLICY IF EXISTS "Allow public read notifications" ON student_notifications;
DROP POLICY IF EXISTS "Allow all read teaching loads" ON teaching_loads;
DROP POLICY IF EXISTS "Allow all read subjects" ON subjects;
DROP POLICY IF EXISTS "Allow all read sections" ON sections;
DROP POLICY IF EXISTS "Allow all operations on password_reset_tokens" ON password_reset_tokens;

-- STUDENTS: Public read access (for login)
CREATE POLICY "Public read students"
ON students FOR SELECT
USING (true);

-- TEACHERS: Public read access (for login)
CREATE POLICY "Public read teachers"
ON teachers FOR SELECT
USING (true);

-- SECTIONS: Public read access
CREATE POLICY "Public read sections"
ON sections FOR SELECT
USING (true);

-- SUBJECTS: Public read access
CREATE POLICY "Public read subjects"
ON subjects FOR SELECT
USING (true);

-- TEACHING_LOADS: Public read access
CREATE POLICY "Public read teaching loads"
ON teaching_loads FOR SELECT
USING (true);

-- STUDENT_NOTIFICATIONS: Public read and write access
-- (Application handles filtering and authentication)
CREATE POLICY "Public read notifications"
ON student_notifications FOR SELECT
USING (true);

CREATE POLICY "Public insert notifications"
ON student_notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update notifications"
ON student_notifications FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public delete notifications"
ON student_notifications FOR DELETE
USING (true);

-- PASSWORD_RESET_TOKENS: Allow all operations
CREATE POLICY "Allow password reset operations"
ON password_reset_tokens FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- SECTION 8: CLEANUP FUNCTIONS
-- =====================================================

-- Function to cleanup expired password reset tokens
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 9: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read for students" ON students;
DROP POLICY IF EXISTS "Allow public update for students" ON students;
DROP POLICY IF EXISTS "Allow public insert for students" ON students;

-- Allow public read access (needed for dashboard and profile cards)
CREATE POLICY "Allow public read for students" ON students
    FOR SELECT
    USING (true);

-- Allow public update access (needed for settings page - students can update their profiles)
CREATE POLICY "Allow public update for students" ON students
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow public insert access (needed for admin to create new students)
CREATE POLICY "Allow public insert for students" ON students
    FOR INSERT
    WITH CHECK (true);

-- Enable RLS on student_notifications table
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read for student_notifications" ON student_notifications;
DROP POLICY IF EXISTS "Allow public insert for student_notifications" ON student_notifications;
DROP POLICY IF EXISTS "Allow public update for student_notifications" ON student_notifications;
DROP POLICY IF EXISTS "Allow public delete for student_notifications" ON student_notifications;

-- Allow public read access (needed for students to see notifications)
CREATE POLICY "Allow public read for student_notifications" ON student_notifications
    FOR SELECT
    USING (true);

-- Allow public insert access (needed for admins to send notifications)
CREATE POLICY "Allow public insert for student_notifications" ON student_notifications
    FOR INSERT
    WITH CHECK (true);

-- Allow public update access (needed for marking notifications as read)
CREATE POLICY "Allow public update for student_notifications" ON student_notifications
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow public delete access (needed for admins to delete notifications)
CREATE POLICY "Allow public delete for student_notifications" ON student_notifications
    FOR DELETE
    USING (true);

-- =====================================================
-- SECTION 10: VERIFICATION QUERIES
-- =====================================================

-- Verify students table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'students'
  AND column_name IN ('profile_picture_url', 'qr_code_url', 'section_id', 'grade_level')
ORDER BY column_name;

-- Verify teachers table columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'teachers'
  AND column_name = 'qr_code_url';

-- Verify teaching_loads table columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'teaching_loads'
  AND column_name IN ('day_of_week', 'start_time', 'end_time')
ORDER BY column_name;

-- Verify sections table columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'sections'
  AND column_name = 'strand';

-- Verify RLS policies on students table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'students'
ORDER BY policyname;

-- Verify RLS policies on student_notifications table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'student_notifications'
ORDER BY policyname;

-- Verify student_notifications table exists
SELECT COUNT(*) as notification_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'student_notifications';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ =====================================================';
    RAISE NOTICE '✅ DATABASE SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '✅ =====================================================';
    RAISE NOTICE '✅ All tables, columns, indexes, and policies are ready.';
    RAISE NOTICE '✅ Check the verification queries above for details.';
    RAISE NOTICE '';
END $$;

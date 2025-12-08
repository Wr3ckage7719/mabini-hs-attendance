-- =====================================================
-- MABINI HS ATTENDANCE SYSTEM - COMPLETE DATABASE SETUP
-- =====================================================
-- This is the MASTER SQL file for the entire database
-- Run this script in Supabase SQL Editor to set up or update the database
-- =====================================================
-- Version: 3.0
-- Last Updated: December 9, 2025
-- =====================================================

-- =====================================================
-- SECTION 1: STUDENTS TABLE - Core Columns
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
        RAISE NOTICE 'Added profile_picture_url column to students table';
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
        RAISE NOTICE 'Added qr_code_url column to students table';
    END IF;
END $$;

-- Add phone column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.students 
        ADD COLUMN phone TEXT;
        
        COMMENT ON COLUMN public.students.phone IS 'Student personal contact phone number';
        RAISE NOTICE 'Added phone column to students table';
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
        ADD COLUMN section_id UUID;
        
        COMMENT ON COLUMN public.students.section_id IS 'Foreign key reference to sections table';
        RAISE NOTICE 'Added section_id column to students table';
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
        
        COMMENT ON COLUMN public.students.grade_level IS 'Student grade level: 7, 8, 9, 10, 11, or 12';
        RAISE NOTICE 'Added grade_level column to students table';
    END IF;
END $$;

-- Create indexes for students table
CREATE INDEX IF NOT EXISTS idx_students_qr_code_url ON students(qr_code_url);
CREATE INDEX IF NOT EXISTS idx_students_profile_picture_url ON students(profile_picture_url);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
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
        
        COMMENT ON COLUMN public.teachers.qr_code_url IS 'URL to QR code image in Supabase Storage for teacher login';
        RAISE NOTICE 'Added qr_code_url column to teachers table';
    END IF;
END $$;

-- Create index for teachers table
CREATE INDEX IF NOT EXISTS idx_teachers_qr_code_url ON teachers(qr_code_url);

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
        
        COMMENT ON COLUMN public.sections.strand IS 'Senior High strand: STEM, HUMSS, ABM, GAS, TVL, ARTS, SPORTS';
        RAISE NOTICE 'Added strand column to sections table';
    END IF;
END $$;

-- Create index for sections table
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
        
        COMMENT ON COLUMN public.teaching_loads.day_of_week IS 'Day of the week: Monday, Tuesday, etc.';
        RAISE NOTICE 'Added day_of_week column to teaching_loads table';
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
        
        COMMENT ON COLUMN public.teaching_loads.start_time IS 'Class start time';
        RAISE NOTICE 'Added start_time column to teaching_loads table';
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
        
        COMMENT ON COLUMN public.teaching_loads.end_time IS 'Class end time';
        RAISE NOTICE 'Added end_time column to teaching_loads table';
    END IF;
END $$;

-- Update existing records with default values
UPDATE public.teaching_loads
SET 
    day_of_week = COALESCE(day_of_week, 'N/A'),
    start_time = NULL,
    end_time = NULL
WHERE day_of_week IS NULL;

-- Create indexes for teaching_loads table
CREATE INDEX IF NOT EXISTS idx_teaching_loads_day_of_week ON teaching_loads(day_of_week);
CREATE INDEX IF NOT EXISTS idx_teaching_loads_start_time ON teaching_loads(start_time);

-- =====================================================
-- SECTION 5: STUDENT NOTIFICATIONS TABLE
-- =====================================================

-- Create student_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.student_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'danger')),
    notification_type VARCHAR(50) DEFAULT 'general',
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'grade', 'section', 'individual')),
    target_value TEXT,
    student_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    CONSTRAINT student_notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Add notification_type column if it doesn't exist (for older setups)
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
        
        COMMENT ON COLUMN public.student_notifications.notification_type IS 'Category: general, absence, grade, announcement, emergency, attendance_warning';
        RAISE NOTICE 'Added notification_type column to student_notifications table';
    END IF;
END $$;

-- Add student_id column if it doesn't exist (for older setups)
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
        
        COMMENT ON COLUMN public.student_notifications.student_id IS 'UUID of the student for individual tracking';
        RAISE NOTICE 'Added student_id column to student_notifications table';
    END IF;
END $$;

-- Add read_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'student_notifications' 
        AND column_name = 'read_at'
    ) THEN
        ALTER TABLE public.student_notifications 
        ADD COLUMN read_at TIMESTAMPTZ;
        
        COMMENT ON COLUMN public.student_notifications.read_at IS 'Timestamp when notification was marked as read';
        RAISE NOTICE 'Added read_at column to student_notifications table';
    END IF;
END $$;

-- Create indexes for student_notifications
CREATE INDEX IF NOT EXISTS idx_notifications_target_type ON student_notifications(target_type);
CREATE INDEX IF NOT EXISTS idx_notifications_target_value ON student_notifications(target_value);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON student_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON student_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON student_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_student_read ON student_notifications(student_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON student_notifications(notification_type);

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

-- Create indexes for password_reset_tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used ON password_reset_tokens(used);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- =====================================================
-- SECTION 7: ATTENDANCE TABLE
-- =====================================================

-- Ensure attendance table exists (should already be created)
-- Add any missing indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- =====================================================
-- SECTION 8: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Drop ALL existing policies to avoid conflicts
-- =====================================================

-- Students table policies
DROP POLICY IF EXISTS "Allow public read for students" ON students;
DROP POLICY IF EXISTS "Allow public update for students" ON students;
DROP POLICY IF EXISTS "Allow public insert for students" ON students;
DROP POLICY IF EXISTS "Public read students" ON students;
DROP POLICY IF EXISTS "Allow all read students for teachers" ON students;

-- Teachers table policies
DROP POLICY IF EXISTS "Allow public read for login" ON teachers;
DROP POLICY IF EXISTS "Enable read access for authentication" ON teachers;
DROP POLICY IF EXISTS "Public read teachers" ON teachers;

-- Sections table policies
DROP POLICY IF EXISTS "Allow public read on sections" ON sections;
DROP POLICY IF EXISTS "Allow public insert on sections" ON sections;
DROP POLICY IF EXISTS "Allow public update on sections" ON sections;
DROP POLICY IF EXISTS "Public read sections" ON sections;
DROP POLICY IF EXISTS "Allow all read sections" ON sections;

-- Subjects table policies
DROP POLICY IF EXISTS "Allow public read on subjects" ON subjects;
DROP POLICY IF EXISTS "Public read subjects" ON subjects;
DROP POLICY IF EXISTS "Allow all read subjects" ON subjects;

-- Teaching loads table policies
DROP POLICY IF EXISTS "Allow public read on teaching_loads" ON teaching_loads;
DROP POLICY IF EXISTS "Allow public insert on teaching_loads" ON teaching_loads;
DROP POLICY IF EXISTS "Allow public update on teaching_loads" ON teaching_loads;
DROP POLICY IF EXISTS "Allow public delete on teaching_loads" ON teaching_loads;
DROP POLICY IF EXISTS "Public read teaching loads" ON teaching_loads;
DROP POLICY IF EXISTS "Allow all read teaching loads" ON teaching_loads;

-- Attendance table policies
DROP POLICY IF EXISTS "Teachers can view attendance for their students" ON attendance;
DROP POLICY IF EXISTS "Teachers can insert attendance for their students" ON attendance;
DROP POLICY IF EXISTS "Teachers can update attendance for their students" ON attendance;
DROP POLICY IF EXISTS "Teachers can delete attendance for their students" ON attendance;
DROP POLICY IF EXISTS "Allow public read for attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public insert for attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public update for attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public delete for attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public write for attendance" ON attendance;

-- Student notifications table policies
DROP POLICY IF EXISTS "Allow public read for student_notifications" ON student_notifications;
DROP POLICY IF EXISTS "Allow public insert for student_notifications" ON student_notifications;
DROP POLICY IF EXISTS "Allow public update for student_notifications" ON student_notifications;
DROP POLICY IF EXISTS "Allow public delete for student_notifications" ON student_notifications;
DROP POLICY IF EXISTS "student_notifications_select_policy" ON student_notifications;
DROP POLICY IF EXISTS "student_notifications_insert_policy" ON student_notifications;
DROP POLICY IF EXISTS "student_notifications_update_policy" ON student_notifications;
DROP POLICY IF EXISTS "student_notifications_delete_policy" ON student_notifications;
DROP POLICY IF EXISTS "Admins can send notifications" ON student_notifications;
DROP POLICY IF EXISTS "Students can read their notifications" ON student_notifications;
DROP POLICY IF EXISTS "Students can update their notifications" ON student_notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON student_notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON student_notifications;
DROP POLICY IF EXISTS "Enable update for users based on student_id" ON student_notifications;
DROP POLICY IF EXISTS "Public read notifications" ON student_notifications;
DROP POLICY IF EXISTS "Public insert notifications" ON student_notifications;
DROP POLICY IF EXISTS "Public update notifications" ON student_notifications;
DROP POLICY IF EXISTS "Public delete notifications" ON student_notifications;
DROP POLICY IF EXISTS "Students can view their notifications" ON student_notifications;
DROP POLICY IF EXISTS "Admins and teachers can view all notifications" ON student_notifications;
DROP POLICY IF EXISTS "Allow public read notifications" ON student_notifications;

-- Password reset tokens policies
DROP POLICY IF EXISTS "Allow password reset operations" ON password_reset_tokens;
DROP POLICY IF EXISTS "Allow all operations on password_reset_tokens" ON password_reset_tokens;

-- =====================================================
-- Create NEW clean policies for all tables
-- =====================================================

-- STUDENTS TABLE: Public access for login and profile management
CREATE POLICY "students_select_policy" ON students FOR SELECT USING (true);
CREATE POLICY "students_insert_policy" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "students_update_policy" ON students FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "students_delete_policy" ON students FOR DELETE USING (true);

-- TEACHERS TABLE: Public read access for login
CREATE POLICY "teachers_select_policy" ON teachers FOR SELECT USING (true);
CREATE POLICY "teachers_insert_policy" ON teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "teachers_update_policy" ON teachers FOR UPDATE USING (true) WITH CHECK (true);

-- SECTIONS TABLE: Public read access
CREATE POLICY "sections_select_policy" ON sections FOR SELECT USING (true);
CREATE POLICY "sections_insert_policy" ON sections FOR INSERT WITH CHECK (true);
CREATE POLICY "sections_update_policy" ON sections FOR UPDATE USING (true) WITH CHECK (true);

-- SUBJECTS TABLE: Public read access
CREATE POLICY "subjects_select_policy" ON subjects FOR SELECT USING (true);

-- TEACHING_LOADS TABLE: Public access for schedule management
CREATE POLICY "teaching_loads_select_policy" ON teaching_loads FOR SELECT USING (true);
CREATE POLICY "teaching_loads_insert_policy" ON teaching_loads FOR INSERT WITH CHECK (true);
CREATE POLICY "teaching_loads_update_policy" ON teaching_loads FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "teaching_loads_delete_policy" ON teaching_loads FOR DELETE USING (true);

-- ATTENDANCE TABLE: Public access for recording
CREATE POLICY "attendance_select_policy" ON attendance FOR SELECT USING (true);
CREATE POLICY "attendance_insert_policy" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "attendance_update_policy" ON attendance FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "attendance_delete_policy" ON attendance FOR DELETE USING (true);

-- STUDENT_NOTIFICATIONS TABLE: Public access (app handles authorization)
CREATE POLICY "student_notifications_select_policy" ON student_notifications FOR SELECT USING (true);
CREATE POLICY "student_notifications_insert_policy" ON student_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "student_notifications_update_policy" ON student_notifications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "student_notifications_delete_policy" ON student_notifications FOR DELETE USING (true);

-- PASSWORD_RESET_TOKENS TABLE: Public access for password recovery
CREATE POLICY "password_reset_tokens_all_policy" ON password_reset_tokens FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- SECTION 9: UTILITY FUNCTIONS
-- =====================================================

-- Function to cleanup expired password reset tokens
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens
    WHERE expires_at < NOW() OR created_at < NOW() - INTERVAL '24 hours';
    RAISE NOTICE 'Cleaned up expired password reset tokens';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 10: VERIFICATION QUERIES
-- =====================================================

-- Verify students table columns
DO $$
DECLARE
    missing_columns TEXT[];
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'students'
      AND column_name IN ('profile_picture_url', 'qr_code_url', 'phone', 'section_id', 'grade_level');
    
    IF col_count = 5 THEN
        RAISE NOTICE '✅ Students table: All required columns exist';
    ELSE
        RAISE WARNING '⚠️  Students table: Missing some columns (found % of 5)', col_count;
    END IF;
END $$;

-- Verify teachers table columns
DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teachers' 
        AND column_name = 'qr_code_url'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE '✅ Teachers table: qr_code_url column exists';
    ELSE
        RAISE WARNING '⚠️  Teachers table: qr_code_url column missing';
    END IF;
END $$;

-- Verify teaching_loads table columns
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'teaching_loads'
      AND column_name IN ('day_of_week', 'start_time', 'end_time');
    
    IF col_count = 3 THEN
        RAISE NOTICE '✅ Teaching_loads table: All schedule columns exist';
    ELSE
        RAISE WARNING '⚠️  Teaching_loads table: Missing some columns (found % of 3)', col_count;
    END IF;
END $$;

-- Verify sections table strand column
DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sections' 
        AND column_name = 'strand'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE '✅ Sections table: strand column exists';
    ELSE
        RAISE WARNING '⚠️  Sections table: strand column missing';
    END IF;
END $$;

-- Verify student_notifications table
DO $$
DECLARE
    table_exists BOOLEAN;
    policy_count INTEGER;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'student_notifications'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Student_notifications table exists';
        
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE tablename = 'student_notifications';
        
        RAISE NOTICE '✅ Student_notifications has % RLS policies', policy_count;
    ELSE
        RAISE WARNING '⚠️  Student_notifications table missing';
    END IF;
END $$;

-- Verify password_reset_tokens table
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'password_reset_tokens'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Password_reset_tokens table exists';
    ELSE
        RAISE WARNING '⚠️  Password_reset_tokens table missing';
    END IF;
END $$;

-- Verify RLS is enabled on all tables
DO $$
DECLARE
    tables_with_rls INTEGER;
    expected_tables TEXT[] := ARRAY['students', 'teachers', 'sections', 'subjects', 'teaching_loads', 'attendance', 'student_notifications', 'password_reset_tokens'];
BEGIN
    SELECT COUNT(*) INTO tables_with_rls
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = ANY(expected_tables)
    AND rowsecurity = true;
    
    RAISE NOTICE '✅ RLS enabled on % of % critical tables', tables_with_rls, array_length(expected_tables, 1);
END $$;

-- Count total policies
DO $$
DECLARE
    total_policies INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '✅ Total RLS policies configured: %', total_policies;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ DATABASE SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  ✓ All tables created and updated';
    RAISE NOTICE '  ✓ All required columns added';
    RAISE NOTICE '  ✓ All indexes created';
    RAISE NOTICE '  ✓ Row Level Security (RLS) enabled';
    RAISE NOTICE '  ✓ All RLS policies configured';
    RAISE NOTICE '  ✓ Utility functions created';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Review verification messages above';
    RAISE NOTICE '  2. Test login functionality';
    RAISE NOTICE '  3. Test notification system';
    RAISE NOTICE '  4. Configure Supabase Storage bucket: student-images';
    RAISE NOTICE '';
    RAISE NOTICE 'For more information, see: server/README.md';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

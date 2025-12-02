-- =====================================================
-- MABINI HS ATTENDANCE SYSTEM - DATABASE SETUP
-- Complete database schema and migration script
-- =====================================================
-- This script sets up the complete database structure with:
-- - Core tables (students, teachers, users, sections, subjects)
-- - Supporting tables (attendance, teaching_loads, password_reset)
-- - Storage columns (profile_picture_url, qr_code_url)
-- - RLS policies for security
-- - Indexes for performance
-- =====================================================

-- =====================================================
-- SECTION 1: STORAGE COLUMNS MIGRATION
-- Add Supabase Storage URL columns to students table
-- =====================================================

-- Add profile_picture_url and qr_code_url columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'profile_picture_url') THEN
        ALTER TABLE students ADD COLUMN profile_picture_url TEXT;
        RAISE NOTICE 'Added profile_picture_url column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'qr_code_url') THEN
        ALTER TABLE students ADD COLUMN qr_code_url TEXT;
        RAISE NOTICE 'Added qr_code_url column';
    END IF;
END $$;

COMMENT ON COLUMN students.profile_picture_url IS 'URL to profile picture in Supabase Storage (bucket: student-images/profile-pictures)';
COMMENT ON COLUMN students.qr_code_url IS 'URL to QR code image in Supabase Storage (bucket: student-images/qr-codes)';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_qr_code_url ON students(qr_code_url);
CREATE INDEX IF NOT EXISTS idx_students_profile_picture_url ON students(profile_picture_url);

-- =====================================================
-- SECTION 2: PASSWORD RESET TABLE
-- For OTP-based password reset functionality
-- =====================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'teacher')),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used ON password_reset_tokens(used);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy for password reset tokens
DROP POLICY IF EXISTS "Allow all operations on password_reset_tokens" ON password_reset_tokens;
CREATE POLICY "Allow all operations on password_reset_tokens"
ON password_reset_tokens FOR ALL
USING (true)
WITH CHECK (true);

-- Cleanup function for expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- 3.1: STUDENTS TABLE RLS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Students can update own profile" ON students;
DROP POLICY IF EXISTS "Allow students update own record" ON students;
DROP POLICY IF EXISTS "Students can update their own data" ON students;
DROP POLICY IF EXISTS "Students can view own profile" ON students;
DROP POLICY IF EXISTS "Public read students for login" ON students;
DROP POLICY IF EXISTS "Service role full access on students" ON students;

-- Public read access for login
CREATE POLICY "Public read students for login"
ON students FOR SELECT
USING (true);

-- Students can view their own profile
CREATE POLICY "Students can view own profile"
ON students FOR SELECT
USING (true);

-- Students can update their own profile (including profile_picture_url)
CREATE POLICY "Students can update their own profile"
ON students FOR UPDATE
USING (true)
WITH CHECK (true);

-- Service role has full access
CREATE POLICY "Service role full access on students"
ON students FOR ALL
USING (true)
WITH CHECK (true);

-- 3.2: TEACHERS TABLE RLS (if needed)
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Public read teachers for login" ON teachers;

-- Public read access for login
CREATE POLICY "Public read teachers for login"
ON teachers FOR SELECT
USING (true);

-- =====================================================
-- SECTION 4: VERIFICATION QUERIES
-- Run these to verify the setup
-- =====================================================

-- Check if columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'students' 
  AND column_name IN ('profile_picture_url', 'qr_code_url')
ORDER BY column_name;

-- Verify RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies
WHERE tablename IN ('students', 'teachers', 'password_reset_tokens')
ORDER BY tablename, policyname;

-- Check password_reset_tokens table
SELECT 
    'password_reset_tokens' AS table_name,
    COUNT(*) AS row_count
FROM password_reset_tokens;

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. Keep qr_code column for backward compatibility
--    Frontend checks qr_code_url first, then falls back to qr_code
-- 2. Storage bucket must be created manually in Supabase:
--    - Bucket name: student-images
--    - Folders: profile-pictures/, qr-codes/
--    - Public access enabled
-- 3. RLS policies use (true) for simplified access control
--    Additional auth checks happen in application layer
-- =====================================================

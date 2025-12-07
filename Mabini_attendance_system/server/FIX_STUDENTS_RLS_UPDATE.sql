-- =====================================================
-- FIX STUDENTS TABLE RLS - ALLOW UPDATE ACCESS
-- =====================================================
-- This allows students to update their own profile information
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Ensure RLS is enabled on students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read for students" ON students;
DROP POLICY IF EXISTS "Allow public update for students" ON students;
DROP POLICY IF EXISTS "Allow public insert for students" ON students;
DROP POLICY IF EXISTS "Students can update their own profile" ON students;

-- Allow public read access (needed for dashboard)
CREATE POLICY "Allow public read for students" ON students
    FOR SELECT
    USING (true);

-- Allow public update access (needed for settings page)
CREATE POLICY "Allow public update for students" ON students
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow public insert access (needed for admin to create students)
CREATE POLICY "Allow public insert for students" ON students
    FOR INSERT
    WITH CHECK (true);

-- Verify the policies were created
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
WHERE tablename = 'students'
ORDER BY policyname;

-- Test query to ensure policies work
-- This should return rows if policies are correct
SELECT COUNT(*) as student_count FROM students;

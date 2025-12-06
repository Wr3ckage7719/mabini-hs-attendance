-- Fix Attendance Table RLS Policy for Teacher Access
-- This allows teachers to read and write attendance records for their students
-- Run this SQL in your Supabase SQL Editor

-- Enable RLS on attendance table if not already enabled
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Teachers can view attendance for their students" ON attendance;
DROP POLICY IF EXISTS "Teachers can insert attendance for their students" ON attendance;
DROP POLICY IF EXISTS "Teachers can update attendance for their students" ON attendance;
DROP POLICY IF EXISTS "Teachers can delete attendance for their students" ON attendance;
DROP POLICY IF EXISTS "Allow public read for attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public write for attendance" ON attendance;

-- For now, allow public access to attendance table (like students and teachers tables)
-- This is needed because teachers are not authenticated via Supabase Auth
CREATE POLICY "Allow public read for attendance" ON attendance
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert for attendance" ON attendance
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update for attendance" ON attendance
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete for attendance" ON attendance
    FOR DELETE
    USING (true);

-- Also ensure students table has public read access
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read for students" ON students;

CREATE POLICY "Allow public read for students" ON students
    FOR SELECT
    USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('attendance', 'students')
ORDER BY tablename, policyname;

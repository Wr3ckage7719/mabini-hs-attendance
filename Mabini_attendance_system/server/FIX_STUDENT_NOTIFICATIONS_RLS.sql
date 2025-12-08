-- =====================================================
-- FIX STUDENT_NOTIFICATIONS TABLE RLS - ALLOW CRUD ACCESS
-- =====================================================
-- This allows admins to send notifications and students to read them
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Ensure RLS is enabled on student_notifications table
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read for student_notifications" ON student_notifications;
DROP POLICY IF EXISTS "Allow public insert for student_notifications" ON student_notifications;
DROP POLICY IF EXISTS "Allow public update for student_notifications" ON student_notifications;
DROP POLICY IF EXISTS "Allow public delete for student_notifications" ON student_notifications;
DROP POLICY IF EXISTS "Admins can send notifications" ON student_notifications;
DROP POLICY IF EXISTS "Students can read their notifications" ON student_notifications;
DROP POLICY IF EXISTS "Students can update their notifications" ON student_notifications;

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
WHERE tablename = 'student_notifications'
ORDER BY policyname;

-- Test query to ensure policies work
SELECT COUNT(*) as notification_count FROM student_notifications;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run these queries to verify everything is working:

-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'student_notifications';

-- 2. Test insert (should work now)
-- INSERT INTO student_notifications (title, message, type, target_type, target_value)
-- VALUES ('Test Notification', 'This is a test', 'info', 'all', NULL);

-- 3. Test read (should work now)
-- SELECT * FROM student_notifications LIMIT 5;

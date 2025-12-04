-- =====================================================
-- Fix Student Notifications RLS Policy
-- =====================================================
-- This updates the RLS policy to allow public read access
-- since students don't authenticate via Supabase Auth
-- They use session-based authentication

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Students can view their notifications" ON student_notifications;
DROP POLICY IF EXISTS "Admins and teachers can view all notifications" ON student_notifications;

-- Create a simple policy that allows anyone to read notifications
-- The filtering happens in the application layer based on student_id
CREATE POLICY "Allow public read notifications"
ON student_notifications
FOR SELECT
USING (true);

-- Keep the admin-only policies for INSERT, UPDATE, DELETE
-- These are already in place from CREATE_NOTIFICATIONS_TABLE.sql

-- Verify RLS is enabled
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

-- View current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'student_notifications'
ORDER BY policyname;

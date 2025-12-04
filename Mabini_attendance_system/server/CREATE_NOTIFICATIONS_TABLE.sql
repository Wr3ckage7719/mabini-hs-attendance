-- =====================================================
-- Student Notifications Table
-- =====================================================
-- This table stores notifications sent from admin to students
-- Supports broadcasting to all students, specific grades, sections, or individuals

-- Create the table
CREATE TABLE IF NOT EXISTS student_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'danger')),
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'grade', 'section', 'individual')),
    target_value TEXT, -- Can be grade_level (11/12), section_id (UUID), or student_id (UUID)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_target_type ON student_notifications(target_type);
CREATE INDEX IF NOT EXISTS idx_notifications_target_value ON student_notifications(target_value);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON student_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON student_notifications(is_read);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view notifications targeted to them
-- Allows students to see:
-- 1. Notifications for 'all' students
-- 2. Notifications for their grade level
-- 3. Notifications for their section
-- 4. Notifications specifically for them (individual)
CREATE POLICY "Students can view their notifications"
ON student_notifications
FOR SELECT
USING (
    -- Get current user's student record
    EXISTS (
        SELECT 1 FROM students s
        WHERE s.email = auth.jwt() ->> 'email'
        AND (
            -- Notification is for all students
            target_type = 'all'
            OR
            -- Notification is for student's grade level
            (target_type = 'grade' AND target_value = s.grade_level)
            OR
            -- Notification is for student's section
            (target_type = 'section' AND target_value::UUID = s.section_id)
            OR
            -- Notification is for this specific student
            (target_type = 'individual' AND target_value::UUID = s.id)
        )
    )
);

-- Policy: Admins and teachers can view all notifications
CREATE POLICY "Admins and teachers can view all notifications"
ON student_notifications
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.email = auth.jwt() ->> 'email'
        AND u.role IN ('admin', 'teacher')
    )
);

-- Policy: Only admins can insert notifications
CREATE POLICY "Only admins can create notifications"
ON student_notifications
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.email = auth.jwt() ->> 'email'
        AND u.role = 'admin'
    )
);

-- Policy: Only admins can update notifications
CREATE POLICY "Only admins can update notifications"
ON student_notifications
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.email = auth.jwt() ->> 'email'
        AND u.role = 'admin'
    )
);

-- Policy: Only admins can delete notifications
CREATE POLICY "Only admins can delete notifications"
ON student_notifications
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.email = auth.jwt() ->> 'email'
        AND u.role = 'admin'
    )
);

-- =====================================================
-- Usage Examples
-- =====================================================

-- Example 1: Broadcast to all students
-- INSERT INTO student_notifications (title, message, type, target_type)
-- VALUES ('School Announcement', 'Classes will resume on Monday.', 'info', 'all');

-- Example 2: Send to specific grade level (Grade 11)
-- INSERT INTO student_notifications (title, message, type, target_type, target_value)
-- VALUES ('Grade 11 Meeting', 'All Grade 11 students please report to the gym.', 'warning', 'grade', '11');

-- Example 3: Send to specific section (using section UUID)
-- INSERT INTO student_notifications (title, message, type, target_type, target_value)
-- VALUES ('Section Announcement', 'Class photo on Friday!', 'info', 'section', 'f47ac10b-58cc-4372-a567-0e02b2c3d479');

-- Example 4: Send to individual student (using student UUID)
-- INSERT INTO student_notifications (title, message, type, target_type, target_value)
-- VALUES ('Personal Message', 'Please see the principal.', 'danger', 'individual', '550e8400-e29b-41d4-a716-446655440000');

-- =====================================================
-- Notes
-- =====================================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify RLS policies are enabled after creation
-- 3. Test with sample notifications before production use
-- 4. Students query notifications using OR filter combining all target types
-- 5. Admin dashboard should provide UI for creating notifications with target selection

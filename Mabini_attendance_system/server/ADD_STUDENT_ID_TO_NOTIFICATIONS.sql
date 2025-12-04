-- =====================================================
-- Add student_id column to student_notifications table
-- =====================================================
-- This allows each notification to be linked to a specific student
-- enabling individual read tracking and better notification management

-- Add student_id column
ALTER TABLE student_notifications 
ADD COLUMN IF NOT EXISTS student_id UUID;

-- Add foreign key constraint (optional, but recommended)
-- Uncomment if you want to enforce referential integrity
-- ALTER TABLE student_notifications 
-- ADD CONSTRAINT fk_student_notifications_student 
-- FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON student_notifications(student_id);

-- Create composite index for student queries
CREATE INDEX IF NOT EXISTS idx_notifications_student_read ON student_notifications(student_id, is_read);

-- Update the RLS policy to include student_id
-- Drop the old policy if it exists
DROP POLICY IF EXISTS "Students can view their notifications" ON student_notifications;

-- Create new policy that checks both target_type and student_id
CREATE POLICY "Students can view their notifications"
ON student_notifications
FOR SELECT
USING (
    -- Get current user's student record
    EXISTS (
        SELECT 1 FROM students s
        WHERE s.user_id = auth.uid()
        AND (
            -- Direct student_id match (individual notifications)
            student_id = s.id
            OR
            -- Notification is for all students (backward compatibility)
            (target_type = 'all' AND student_id IS NULL)
            OR
            -- Notification is for their grade level (backward compatibility)
            (target_type = 'grade' AND target_value = s.grade_level::text AND student_id IS NULL)
            OR
            -- Notification is for their section (backward compatibility)
            (target_type = 'section' AND target_value = s.section_id::text AND student_id IS NULL)
            OR
            -- Notification is specifically for them (backward compatibility)
            (target_type = 'individual' AND target_value = s.id::text AND student_id IS NULL)
        )
    )
);

-- Policy: Students can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Students can update their notifications" ON student_notifications;

CREATE POLICY "Students can update their notifications"
ON student_notifications
FOR UPDATE
USING (
    student_id IN (
        SELECT id FROM students WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    student_id IN (
        SELECT id FROM students WHERE user_id = auth.uid()
    )
);

-- Add comment
COMMENT ON COLUMN student_notifications.student_id IS 'UUID of the student who receives this notification (for individual tracking)';

-- =====================================================
-- Migration Info
-- =====================================================
-- Run this script in Supabase SQL Editor to:
-- 1. Add student_id column to existing table
-- 2. Update RLS policies for better security
-- 3. Create indexes for performance
-- 4. Maintain backward compatibility with existing notifications

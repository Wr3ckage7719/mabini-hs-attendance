-- =====================================================
-- Student Notification Recipients Table
-- =====================================================
-- This table stores individual notification records for each student
-- allowing students to view and mark notifications as read

-- Drop table if exists
DROP TABLE IF EXISTS student_notification_recipients CASCADE;

-- Create the student_notification_recipients table
CREATE TABLE student_notification_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES student_notifications(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'warning', 'success', 'danger')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_notification_recipients_student ON student_notification_recipients(student_id);
CREATE INDEX idx_notification_recipients_notification ON student_notification_recipients(notification_id);
CREATE INDEX idx_notification_recipients_is_read ON student_notification_recipients(is_read);
CREATE INDEX idx_notification_recipients_created_at ON student_notification_recipients(created_at DESC);

-- Add comments
COMMENT ON TABLE student_notification_recipients IS 'Individual notification records for each student';
COMMENT ON COLUMN student_notification_recipients.notification_id IS 'Reference to the main notification';
COMMENT ON COLUMN student_notification_recipients.student_id IS 'UUID of the student who receives this notification';
COMMENT ON COLUMN student_notification_recipients.is_read IS 'Whether the student has read this notification';
COMMENT ON COLUMN student_notification_recipients.read_at IS 'Timestamp when the notification was marked as read';

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE student_notification_recipients ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own notifications
CREATE POLICY "Students can view their own notifications"
ON student_notification_recipients
FOR SELECT
USING (
    student_id IN (
        SELECT id FROM students WHERE user_id = auth.uid()
    )
);

-- Policy: Students can update their own notifications (mark as read)
CREATE POLICY "Students can update their own notifications"
ON student_notification_recipients
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

-- Policy: Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
ON student_notification_recipients
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Policy: Admins can insert notifications
CREATE POLICY "Admins can insert notifications"
ON student_notification_recipients
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Policy: Admins can delete notifications
CREATE POLICY "Admins can delete notifications"
ON student_notification_recipients
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- =====================================================
-- Triggers
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_recipients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_recipients_updated_at
    BEFORE UPDATE ON student_notification_recipients
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_recipients_updated_at();

-- Auto-set read_at when is_read changes to true
CREATE OR REPLACE FUNCTION set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_notification_read_at
    BEFORE UPDATE ON student_notification_recipients
    FOR EACH ROW
    WHEN (NEW.is_read IS DISTINCT FROM OLD.is_read)
    EXECUTE FUNCTION set_notification_read_at();

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON student_notification_recipients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON student_notification_recipients TO anon;

-- =====================================================
-- Sample Queries
-- =====================================================

-- Get unread notifications for a student
-- SELECT * FROM student_notification_recipients 
-- WHERE student_id = 'student-uuid-here' 
-- AND is_read = FALSE 
-- ORDER BY created_at DESC;

-- Mark notification as read
-- UPDATE student_notification_recipients 
-- SET is_read = TRUE 
-- WHERE id = 'notification-id-here' 
-- AND student_id = 'student-uuid-here';

-- Get notification read statistics
-- SELECT 
--     COUNT(*) as total,
--     SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read_count,
--     SUM(CASE WHEN NOT is_read THEN 1 ELSE 0 END) as unread_count
-- FROM student_notification_recipients
-- WHERE student_id = 'student-uuid-here';

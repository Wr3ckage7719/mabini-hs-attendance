-- =====================================================
-- PHASE 1: NOTIFICATION IMPROVEMENTS
-- Add notification_type column and update indexes
-- =====================================================

-- Add notification_type column
ALTER TABLE public.student_notifications 
ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50) DEFAULT 'general';

COMMENT ON COLUMN public.student_notifications.notification_type IS 'Category: general, absence, grade, announcement, emergency, attendance_warning';

-- Create index for notification_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type ON student_notifications(notification_type);

-- Verify columns exist
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_notifications' 
AND column_name IN ('is_read', 'read_at', 'notification_type', 'student_id')
ORDER BY column_name;

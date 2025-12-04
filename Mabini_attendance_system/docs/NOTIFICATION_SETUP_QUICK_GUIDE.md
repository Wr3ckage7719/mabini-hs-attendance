# Quick Setup Guide - Student Notifications

## You Need to Run This in Supabase SQL Editor:

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Copy and Run This SQL:

```sql
-- Add student_id column to track individual notifications
ALTER TABLE student_notifications 
ADD COLUMN IF NOT EXISTS student_id UUID;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON student_notifications(student_id);

-- Create composite index for student queries
CREATE INDEX IF NOT EXISTS idx_notifications_student_read ON student_notifications(student_id, is_read);

-- Update the RLS policy to include student_id
DROP POLICY IF EXISTS "Students can view their notifications" ON student_notifications;

CREATE POLICY "Students can view their notifications"
ON student_notifications
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM students s
        WHERE s.user_id = auth.uid()
        AND (
            student_id = s.id
            OR
            (target_type = 'all' AND student_id IS NULL)
            OR
            (target_type = 'grade' AND target_value = s.grade_level::text AND student_id IS NULL)
            OR
            (target_type = 'section' AND target_value = s.section_id::text AND student_id IS NULL)
            OR
            (target_type = 'individual' AND target_value = s.id::text AND student_id IS NULL)
        )
    )
);

-- Allow students to update their own notifications (mark as read)
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
```

### Step 3: Click "Run" Button

That's it! The table is now ready to receive notifications.

## How It Works Now:

### When You Send a Notification:
1. Select notification type (Info/Warning/Success/Urgent)
2. Write title and message
3. Choose recipients (All/Grade/Section/Individual)
4. System creates ONE notification record for EACH student
5. Each student sees their own copy in their dashboard

### Benefits:
- ✅ Each student has their own notification record
- ✅ Students can mark notifications as read independently
- ✅ Better tracking of who received what
- ✅ Works with existing student_notifications table
- ✅ No additional tables needed

## Testing:

After running the SQL:
1. Go to Admin → Student Notifications
2. Create a test notification to "All Students"
3. Go to Supabase → Table Editor → student_notifications
4. You should see multiple rows (one per student)
5. Each row has:
   - `student_id`: The specific student's UUID
   - `title`: Your notification title
   - `message`: Your notification message
   - `type`: info/warning/success/danger
   - `is_read`: false (until student marks it read)

## Next Step - Display on Student Dashboard:

To show notifications on the student dashboard, you'll need to:

1. Add a notifications section to `public/student/dashboard.html`
2. Query notifications for the logged-in student:
```javascript
const { data: notifications } = await supabase
    .from('student_notifications')
    .select('*')
    .eq('student_id', currentStudent.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false });
```

3. Display them with icons and mark-as-read buttons

Would you like me to implement the student dashboard notification display?

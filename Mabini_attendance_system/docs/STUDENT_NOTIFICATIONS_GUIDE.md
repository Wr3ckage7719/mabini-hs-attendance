# Student Notifications Setup Guide

## Overview
The Student Notifications system has been completely redesigned for better usability and now properly connects to student accounts.

## What's New

### 1. User-Friendly Interface
- **Step-by-Step Process**: Clear 3-step workflow (Type → Message → Recipients)
- **Help Banner**: Instructions at the top explaining how to use the feature
- **Real-time Feedback**: See exactly how many students will receive the notification
- **Better Labels**: Clear descriptions for each option
- **Visual Improvements**: Color-coded badges, better spacing, and larger touch targets

### 2. Enhanced Filtering
- **All Students**: Send to everyone
- **Specific Grade**: Filter by Grade 11 or 12
- **Specific Section**: Choose actual sections from your database (e.g., "STEM A", "HUMSS B")
- **Individual Student**: Select one specific student with their name and ID

### 3. Student Account Integration
- Notifications are now linked to individual student accounts
- Each student gets their own notification record
- Students can mark notifications as read (when viewing feature is implemented)
- Tracks which students have seen the notification

## Database Setup Required

**IMPORTANT**: You need to run this SQL script in your Supabase database:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the script: `server/CREATE_NOTIFICATION_RECIPIENTS_TABLE.sql`

This creates the `student_notification_recipients` table that stores individual notifications for each student.

### What the Table Does:
- Links each notification to specific student IDs
- Allows students to mark notifications as read
- Tracks when notifications were read
- Provides better analytics on notification engagement

## How It Works

### Admin Side (Current Page):
1. Admin selects notification type (Info, Warning, Success, Urgent)
2. Writes title and message
3. Selects recipients (all, grade, section, or individual)
4. System shows exactly how many students will receive it
5. Admin clicks Send
6. System creates:
   - One main notification record
   - Individual notification records for each student

### Student Side (To Be Implemented):
Students will see their notifications when they log into their dashboard. Each notification will show:
- Icon based on type
- Title and message
- Timestamp
- Mark as read button

## Features

### ✅ Current Features:
- Step-by-step guided interface
- Real-time recipient count
- Smart filtering by grade/section/individual
- Shows actual section names (e.g., "Grade 11 - STEM A")
- Shows student details when selecting individual
- Success/error messages with auto-dismiss
- Recent notifications list with full details
- Delete functionality for sent notifications
- Proper validation and error handling

### 🔄 Next Steps (For Future Development):
1. **Student Dashboard Integration**: Display notifications on student dashboard
2. **Mark as Read**: Allow students to mark notifications as read
3. **Push Notifications**: Optional browser push notifications
4. **Email Integration**: Send email copies for urgent notifications
5. **Notification History**: Let students view all past notifications
6. **Analytics**: Track notification read rates and engagement

## Example Use Cases

### Scenario 1: School-Wide Announcement
- Type: Info
- Message: "Reminder: Parent-Teacher Conference on December 15"
- Recipients: All Students
- Result: All active students receive the notification

### Scenario 2: Grade-Specific Reminder
- Type: Warning
- Message: "Senior High students: Final exam schedule posted"
- Recipients: Specific Grade → Grade 12
- Result: Only Grade 12 students receive it

### Scenario 3: Section Assignment
- Type: Success
- Message: "STEM A: Science Fair projects due next week"
- Recipients: Specific Section → Grade 11 - STEM A
- Result: Only students in that section receive it

### Scenario 4: Individual Message
- Type: Info
- Message: "Please see the guidance office regarding your scholarship application"
- Recipients: Individual Student → Juan Dela Cruz
- Result: Only that specific student receives it

## Technical Details

### Student ID Resolution:
The system automatically resolves student IDs based on:
- **All Students**: Gets all active students from database
- **Grade Level**: Filters students by grade_level field
- **Section**: Filters students by section_id field
- **Individual**: Uses the specific student's ID

### Notification Storage:
- `student_notifications`: Main notification record (what admin created)
- `student_notification_recipients`: Individual copies for each student (what students see)

This dual-table approach allows:
- Efficient storage (message stored once in main table)
- Individual tracking (each student has their own record)
- Privacy (students only see their own notifications)
- Analytics (track who read what and when)

## Troubleshooting

### "No students available" in dropdown
- Check if you have active students in the database
- Verify students have `status = 'active'`
- Check browser console for errors

### Notification sent but students don't see it
- Run the `CREATE_NOTIFICATION_RECIPIENTS_TABLE.sql` script
- Verify the table exists in Supabase
- Check RLS policies are enabled

### Recipient count shows 0
- Check if students are properly linked to sections
- Verify section_id field in students table
- Refresh the page to reload student data

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify database connection in Supabase
3. Ensure all tables are created correctly
4. Check that students have valid section assignments

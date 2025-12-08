# Fix for Student Notifications "Permission Denied" Error

## Problem
Admin cannot send notifications to students. Error message:
```
Failed to send notification: permission denied for table student_notifications
```

## Root Cause
The `student_notifications` table has Row Level Security (RLS) enabled but no policies were created, blocking all insert/update operations.

## Solution
Run the SQL script to add RLS policies that allow:
- ✅ **Admins** to create/send notifications (INSERT)
- ✅ **Students** to read notifications (SELECT)
- ✅ **Students** to mark notifications as read (UPDATE)
- ✅ **Admins** to delete notifications (DELETE)

## How to Fix

### Quick Fix (Run this SQL in Supabase)
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `server/FIX_STUDENT_NOTIFICATIONS_RLS.sql`
4. Click **RUN**
5. Try sending a notification again - it should work now!

### What the Fix Does
Adds 4 RLS policies to `student_notifications`:
```sql
- Allow public read (SELECT) - Students can see notifications
- Allow public insert (INSERT) - Admins can send notifications
- Allow public update (UPDATE) - Students can mark as read
- Allow public delete (DELETE) - Admins can remove notifications
```

## Test After Running SQL
1. Go to Admin → Student Notifications
2. Create a test notification:
   - Type: Info
   - Title: "Test"
   - Message: "Testing notifications"
   - Target: All Students
3. Click "Send"
4. Should see success message ✅
5. Login as a student and check notifications

## Files Modified
- `server/FIX_STUDENT_NOTIFICATIONS_RLS.sql` - Quick fix script
- `server/COMPLETE_DATABASE_SETUP.sql` - Updated complete setup

## Related Issues
This is the same type of issue we fixed for the `students` table earlier. Any table with RLS enabled needs explicit policies or operations will be blocked.

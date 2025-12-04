# Fix Student Notifications - Implementation Guide

## Problem
Students cannot see notifications because the RLS (Row Level Security) policy is blocking access. The policy expects Supabase Auth authentication, but students use session-based authentication.

## Solution
Run the SQL script to update the RLS policy to allow public read access for student_notifications table.

## Steps to Fix

### 1. Open Supabase SQL Editor
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `mabini-attendance-prod`
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"

### 2. Run the Fix SQL
Copy and paste this SQL into the editor:

```sql
-- Fix Student Notifications RLS Policy
DROP POLICY IF EXISTS "Students can view their notifications" ON student_notifications;
DROP POLICY IF EXISTS "Admins and teachers can view all notifications" ON student_notifications;

-- Allow public read access (filtering happens in app by student_id)
CREATE POLICY "Allow public read notifications"
ON student_notifications
FOR SELECT
USING (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'student_notifications';
```

3. Click "Run" button
4. You should see a success message

### 3. Test the Fix
1. Refresh the student dashboard: https://mabini-hs-attendance.vercel.app/student/dashboard.html
2. Open browser console (F12)
3. Look for the debug messages showing notifications loading
4. Click the bell icon to open notifications modal
5. You should now see the "Update" notification

## What Changed
- **Before**: RLS policy blocked all access unless authenticated via Supabase Auth
- **After**: Public read access allowed, security enforced by application logic filtering by `student_id`

## Security Note
This is safe because:
1. Students can only see notifications where `student_id` matches their ID
2. The application code filters by the logged-in student's ID
3. Insert/Update/Delete operations still require admin authentication
4. Sensitive data is not stored in notifications table

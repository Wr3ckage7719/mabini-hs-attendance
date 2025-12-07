# Fix for Student Profile Settings Not Saving

## Problem
Students cannot save their profile information in the Settings page. The dashboard shows data from the database, but the Settings page cannot update it.

## Root Cause
The `students` table has Row Level Security (RLS) enabled, but it only has a policy for `SELECT` (reading data). There's no policy for `UPDATE`, which prevents the Settings page from saving changes to the database.

## Solution
Run the SQL script to add UPDATE and INSERT policies to the students table.

## How to Fix

### Option 1: Run the Quick Fix Script (Recommended)
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `server/FIX_STUDENTS_RLS_UPDATE.sql`
4. Click **Run**
5. Verify that the policies were created successfully

### Option 2: Run the Complete Database Setup
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `server/COMPLETE_DATABASE_SETUP.sql`
4. Click **Run**
5. This will update all tables and policies

## What the Fix Does
The SQL script adds three RLS policies to the `students` table:

1. **Allow public read for students** - Allows reading student data (already existed)
2. **Allow public update for students** - Allows students to update their profiles (NEW)
3. **Allow public insert for students** - Allows admin to create new students (NEW)

## How to Test
1. Run the SQL fix in Supabase
2. Go to the Student Portal: `https://your-app.vercel.app/student/login.html`
3. Login with your student credentials
4. Go to Settings
5. Update any field (name, phone, address, etc.)
6. Click "Save All Changes"
7. You should see "Profile updated successfully!"
8. Go back to Dashboard and verify the changes are displayed in the profile cards

## Technical Details
- **File**: `server/FIX_STUDENTS_RLS_UPDATE.sql`
- **Table**: `students`
- **Policy Type**: Row Level Security (RLS)
- **Commands**: SELECT, UPDATE, INSERT
- **Access Level**: Public (true for all operations)

## Note
The "public access" approach is used because the app uses custom authentication via sessionStorage rather than Supabase Auth. In production, you may want to implement more restrictive policies based on authenticated users.

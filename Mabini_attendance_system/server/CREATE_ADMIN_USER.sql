-- =====================================================
-- CREATE ADMIN USER IN BOTH SUPABASE AUTH AND USERS TABLE
-- =====================================================
-- This script creates an admin user that works with the login system
-- Run this in Supabase SQL Editor with service_role
-- =====================================================

-- STEP 1: Create admin in Supabase Auth (using admin API)
-- Note: This requires running from Supabase dashboard or using service_role
-- You cannot directly insert into auth.users from SQL, so you must:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User"
-- 3. Email: admin@mabinihs.local
-- 4. Password: admin123
-- 5. Check "Auto Confirm User"
-- 6. Click "Create User"

-- STEP 2: Create admin in users table
-- First, get the auth user ID (replace with actual UUID after creating in dashboard)
-- Or use this to find it:
SELECT id, email FROM auth.users WHERE email = 'admin@mabinihs.local';

-- Then insert into users table (update the auth_id with the UUID from above)
INSERT INTO users (
    auth_id,  -- IMPORTANT: Use the UUID from auth.users
    email,
    username,
    password,
    role,
    first_name,
    last_name,
    full_name,
    status
) VALUES (
    NULL,  -- Will be updated after creating in Supabase Auth Dashboard
    'admin@mabinihs.local',
    'admin',
    'admin123',  -- Note: This is for reference only, actual auth uses Supabase Auth password
    'admin',
    'System',
    'Administrator',
    'System Administrator',
    'active'
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    status = 'active',
    full_name = 'System Administrator';

-- STEP 3: Verify the admin user exists in both places
SELECT 
    u.id as users_table_id,
    u.email,
    u.role,
    u.status,
    u.auth_id,
    au.id as auth_user_id,
    au.email as auth_email,
    CASE 
        WHEN u.auth_id = au.id THEN '✅ LINKED'
        WHEN u.auth_id IS NULL AND au.id IS NOT NULL THEN '⚠️ NOT LINKED - Update auth_id'
        WHEN au.id IS NULL THEN '❌ NO AUTH USER - Create in dashboard'
        ELSE '❓ UNKNOWN'
    END as link_status
FROM users u
LEFT JOIN auth.users au ON u.email = au.email
WHERE u.email = 'admin@mabinihs.local';

-- STEP 4: Link the users table to auth.users (run after creating in dashboard)
-- First, get the auth user ID:
-- SELECT id FROM auth.users WHERE email = 'admin@mabinihs.local';
-- Then update (replace <AUTH_USER_UUID> with actual UUID):
-- UPDATE users SET auth_id = '<AUTH_USER_UUID>' WHERE email = 'admin@mabinihs.local';

-- =====================================================
-- QUICK REFERENCE - ADMIN CREDENTIALS
-- =====================================================
-- Email: admin@mabinihs.local
-- Password: admin123
-- Role: admin
-- =====================================================

-- =====================================================
-- ALTERNATIVE: Use Supabase Admin API (if available)
-- =====================================================
-- This would require the service_role key and admin API access
-- Not available in standard SQL Editor, requires backend implementation

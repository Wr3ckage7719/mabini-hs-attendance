-- =====================================================
-- LINK ADMIN USER - Run this AFTER creating admin in Supabase Dashboard
-- =====================================================

-- Step 1: Find the auth user ID that was just created
SELECT 
    id as auth_user_id,
    email,
    created_at,
    '👆 Copy this UUID' as note
FROM auth.users 
WHERE email = 'admin@mabinihs.local';

-- Step 2: Update the users table with the auth_id
-- REPLACE '<PASTE_UUID_HERE>' with the UUID from Step 1
UPDATE users 
SET auth_id = 'a270a1f8-b569-457a-b77e-ca31618e2db7'
WHERE email = 'admin@mabinihs.local';

-- Step 3: Verify the link
SELECT 
    u.email,
    u.role,
    u.full_name,
    u.auth_id as users_table_auth_id,
    au.id as auth_users_id,
    CASE 
        WHEN u.auth_id = au.id THEN '✅ LINKED - Ready to login!'
        WHEN u.auth_id IS NULL THEN '⚠️ auth_id is NULL - Run Step 2'
        WHEN au.id IS NULL THEN '❌ No auth user found - Create in dashboard'
        ELSE '❌ IDs don''t match - Check Step 2'
    END as link_status
FROM users u
LEFT JOIN auth.users au ON u.email = au.email
WHERE u.email = 'admin@mabinihs.local';

-- =====================================================
-- You should see: ✅ LINKED - Ready to login!
-- Then try logging in at: http://localhost:8080/admin/login.html
-- =====================================================

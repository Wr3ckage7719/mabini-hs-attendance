-- =====================================================
-- VERIFY ADMIN LINK - Check if UPDATE worked
-- =====================================================

-- Check if auth_id was actually updated
SELECT 
    email,
    role,
    auth_id,
    CASE 
        WHEN auth_id IS NULL THEN '❌ auth_id is still NULL - UPDATE did not work'
        WHEN auth_id = 'a270a1f8-b569-457a-b77e-ca31618e2db7' THEN '✅ auth_id matches - UPDATE worked'
        ELSE '⚠️ auth_id is different: ' || auth_id
    END as update_status
FROM users
WHERE email = 'admin@mabinihs.local';

-- Double-check both sides match
SELECT 
    'Auth User' as source,
    id,
    email,
    confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'admin@mabinihs.local'

UNION ALL

SELECT 
    'Users Table' as source,
    auth_id as id,
    email,
    created_at as confirmed_at,
    created_at
FROM users
WHERE email = 'admin@mabinihs.local';

-- =====================================================
-- If auth_id is still NULL, the UPDATE didn't run
-- Make sure you're running the UPDATE in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- FIX RLS POLICY - Allow users to read their own profile
-- =====================================================

-- Check existing policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';

-- =====================================================
-- Add policy to allow authenticated users to read their own profile
-- =====================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Create new policy
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = auth_id);

-- =====================================================
-- Verify the policy was created
-- =====================================================
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'users' AND policyname = 'Users can read own profile';

-- =====================================================
-- Now try the login query manually to test
-- =====================================================
-- This should work after creating the policy:
-- SELECT * FROM users WHERE email = 'admin@mabinihs.local';
-- =====================================================

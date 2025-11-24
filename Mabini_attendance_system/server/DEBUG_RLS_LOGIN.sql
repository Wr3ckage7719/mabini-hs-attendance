-- =====================================================
-- DEBUG RLS - Check why the policy isn't working
-- =====================================================

-- First, manually test what auth.uid() returns when you're logged in
-- You need to run this WHILE logged in to the admin account in the browser
SELECT 
    auth.uid() as current_auth_uid,
    'Run this while logged in as admin@mabinihs.local' as note;

-- Check what auth_id is stored in the users table
SELECT 
    email,
    auth_id as stored_auth_id,
    role
FROM users
WHERE email = 'admin@mabinihs.local';

-- Check the RLS policy definition
SELECT 
    policyname,
    cmd,
    qual as policy_condition
FROM pg_policies
WHERE tablename = 'users' AND policyname = 'Users can read own profile';

-- =====================================================
-- TRY ALTERNATIVE: Allow admin to read all users
-- =====================================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Create a more permissive policy for admins
CREATE POLICY "Admins can read all users"
ON users
FOR SELECT
TO authenticated
USING (
    -- Allow if user is reading their own record
    auth.uid() = auth_id
    OR
    -- Allow if user has admin role (but we need to check this without causing recursion)
    EXISTS (
        SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.role = 'admin'
    )
);

-- =====================================================
-- SIMPLEST FIX: Just allow all authenticated users to read users table
-- (Less secure but will make login work)
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can read all users" ON users;

-- Create simple policy
CREATE POLICY "Authenticated users can read users"
ON users
FOR SELECT
TO authenticated
USING (true);

-- Verify
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'users' AND policyname = 'Authenticated users can read users';

-- =====================================================
-- Try logging in after running this
-- =====================================================

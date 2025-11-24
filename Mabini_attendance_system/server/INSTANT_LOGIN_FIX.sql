-- =====================================================
-- INSTANT FIX - Run this NOW to make admin login work
-- =====================================================

-- Drop all existing restrictive policies on users table
DROP POLICY IF EXISTS "Service role full access on users" ON users;
DROP POLICY IF EXISTS "Authenticated admins read users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;

-- Create simple, working policies
CREATE POLICY "Service role full access on users"
ON users FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read users"
ON users FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE TO authenticated
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);

-- Verify the policies were created
SELECT 
    tablename,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- =====================================================
-- SUCCESS! Now try logging in at:
-- http://localhost:8080/admin/login.html
-- 
-- Email: admin@mabinihs.local
-- Password: admin123
-- =====================================================

-- =====================================================
-- FIX: Add public read access for student login
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Public read students for login" ON students;
DROP POLICY IF EXISTS "Public read teachers for login" ON teachers;

-- Allow public (anon) access to read students table for login verification
CREATE POLICY "Public read students for login"
ON students FOR SELECT TO anon
USING (status = 'active');

-- Also allow teachers table for teacher login
CREATE POLICY "Public read teachers for login"  
ON teachers FOR SELECT TO anon
USING (status = 'active');

-- Verify policies
SELECT 
    tablename,
    policyname,
    roles
FROM pg_policies 
WHERE tablename IN ('students', 'teachers')
ORDER BY tablename, policyname;

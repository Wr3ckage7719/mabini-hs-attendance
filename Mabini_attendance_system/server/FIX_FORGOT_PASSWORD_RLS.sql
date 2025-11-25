-- =====================================================
-- FIX FORGOT PASSWORD - ALLOW ANON ACCESS
-- Allow unauthenticated users to query students/teachers for password reset
-- =====================================================

-- Allow anonymous users to read students table (for email verification)
DROP POLICY IF EXISTS "Anon can read students for password reset" ON students;
CREATE POLICY "Anon can read students for password reset"
ON students FOR SELECT TO anon
USING (true);

-- Allow anonymous users to read teachers table (for email verification)
DROP POLICY IF EXISTS "Anon can read teachers for password reset" ON teachers;
CREATE POLICY "Anon can read teachers for password reset"
ON teachers FOR SELECT TO anon
USING (true);

-- Allow anonymous users to insert into account_retrievals
DROP POLICY IF EXISTS "Anon can log password resets" ON account_retrievals;
CREATE POLICY "Anon can log password resets"
ON account_retrievals FOR INSERT TO anon
WITH CHECK (true);

-- =====================================================
-- VERIFICATION
-- =====================================================
\echo '✅ Forgot password RLS policies created'
\echo 'Anonymous users can now:'
\echo '  - Query students/teachers by email (for verification)'
\echo '  - Log password reset attempts in account_retrievals'
\echo ''
\echo '⚠️ Note: Actual password reset must use Supabase Auth API'

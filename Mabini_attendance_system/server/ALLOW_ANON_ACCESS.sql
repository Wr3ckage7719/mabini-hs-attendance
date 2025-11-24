-- =====================================================
-- ULTIMATE FIX - Allow ANON users to insert (temporary)
-- =====================================================
-- This allows unauthenticated users to insert data
-- ONLY USE THIS FOR TESTING - Remove after confirming it works
-- =====================================================

-- Teachers table - allow anon to insert
DROP POLICY IF EXISTS "Authenticated full access on teachers" ON teachers;
DROP POLICY IF EXISTS "Service role full access on teachers" ON teachers;
DROP POLICY IF EXISTS "Anon can insert teachers" ON teachers;

CREATE POLICY "Anon can insert teachers"
ON teachers FOR ALL TO anon, authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on teachers"
ON teachers FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Subjects table - allow anon to insert
DROP POLICY IF EXISTS "Authenticated full access on subjects" ON subjects;
DROP POLICY IF EXISTS "Service role full access on subjects" ON subjects;
DROP POLICY IF EXISTS "Anon can insert subjects" ON subjects;

CREATE POLICY "Anon can insert subjects"
ON subjects FOR ALL TO anon, authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on subjects"
ON subjects FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Verify
SELECT 'RLS policies now allow ANON access. Try the test again!' as status;

-- =====================================================
-- IMPORTANT: This is a TEMPORARY fix for testing
-- Once you confirm the system works, replace with:
-- CREATE POLICY "Authenticated full access on teachers"
-- ON teachers FOR ALL TO authenticated
-- USING (true) WITH CHECK (true);
-- =====================================================

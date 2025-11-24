-- =====================================================
-- FINAL RLS FIX - Run this RIGHT NOW
-- =====================================================

-- Drop ALL existing policies and recreate with full access
DROP POLICY IF EXISTS "Authenticated full access on teachers" ON teachers;
DROP POLICY IF EXISTS "Service role full access on teachers" ON teachers;
DROP POLICY IF EXISTS "Public read active teachers for login" ON teachers;
DROP POLICY IF EXISTS "Authenticated read teachers" ON teachers;

CREATE POLICY "Authenticated full access on teachers"
ON teachers FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on teachers"
ON teachers FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Same for subjects
DROP POLICY IF EXISTS "Authenticated full access on subjects" ON subjects;
DROP POLICY IF EXISTS "Service role full access on subjects" ON subjects;
DROP POLICY IF EXISTS "Public read subjects" ON subjects;

CREATE POLICY "Authenticated full access on subjects"
ON subjects FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on subjects"
ON subjects FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Verify
SELECT 'RLS policies fixed! Try the test again.' as status;

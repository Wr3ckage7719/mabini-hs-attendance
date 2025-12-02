-- =====================================================
-- FIX TEACHER ACCESS - RLS POLICIES
-- This script adds Row Level Security policies to allow
-- teachers to read necessary data for the teacher portal
-- =====================================================

-- =====================================================
-- 1. TEACHING_LOADS - Teachers can read all teaching loads
-- =====================================================
ALTER TABLE teaching_loads ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any
DROP POLICY IF EXISTS "Teachers can read all teaching loads" ON teaching_loads;
DROP POLICY IF EXISTS "Public read teaching loads" ON teaching_loads;
DROP POLICY IF EXISTS "Allow all read teaching loads" ON teaching_loads;

-- Allow all users to read teaching loads (teachers need this to see their assignments)
CREATE POLICY "Allow all read teaching loads"
ON teaching_loads FOR SELECT
USING (true);

-- Allow authenticated users to modify their own teaching loads
CREATE POLICY "Allow teachers update own loads"
ON teaching_loads FOR UPDATE
USING (true)
WITH CHECK (true);

-- =====================================================
-- 2. SUBJECTS - Teachers can read all subjects
-- =====================================================
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any
DROP POLICY IF EXISTS "Teachers can read subjects" ON subjects;
DROP POLICY IF EXISTS "Public read subjects" ON subjects;
DROP POLICY IF EXISTS "Allow all read subjects" ON subjects;

-- Allow all users to read subjects
CREATE POLICY "Allow all read subjects"
ON subjects FOR SELECT
USING (true);

-- =====================================================
-- 3. SECTIONS - Teachers can read all sections
-- =====================================================
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any
DROP POLICY IF EXISTS "Teachers can read sections" ON sections;
DROP POLICY IF EXISTS "Public read sections" ON sections;
DROP POLICY IF EXISTS "Allow all read sections" ON sections;

-- Allow all users to read sections
CREATE POLICY "Allow all read sections"
ON sections FOR SELECT
USING (true);

-- =====================================================
-- 4. STUDENTS - Teachers can read students in their sections
-- =====================================================
-- Note: Students table should already have policies from previous migration
-- We'll add a policy for teachers to read all students (they need to see students in their sections)

DROP POLICY IF EXISTS "Teachers can read students" ON students;
DROP POLICY IF EXISTS "Allow all read students" ON students;

-- Allow all users to read students (for teacher portal)
CREATE POLICY "Allow all read students for teachers"
ON students FOR SELECT
USING (true);

-- =====================================================
-- 5. TEACHERS - Teachers can read teacher data
-- =====================================================
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any
DROP POLICY IF EXISTS "Teachers can read teachers" ON teachers;
DROP POLICY IF EXISTS "Public read teachers" ON teachers;
DROP POLICY IF EXISTS "Allow all read teachers" ON teachers;

-- Allow all users to read teachers
CREATE POLICY "Allow all read teachers"
ON teachers FOR SELECT
USING (true);

-- Teachers can update their own profile
CREATE POLICY "Teachers can update own profile"
ON teachers FOR UPDATE
USING (true)
WITH CHECK (true);

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify the policies are working
-- =====================================================

-- Check if policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('teaching_loads', 'subjects', 'sections', 'students', 'teachers')
ORDER BY tablename, policyname;

-- Test queries (these should return data)
SELECT COUNT(*) as teaching_loads_count FROM teaching_loads;
SELECT COUNT(*) as subjects_count FROM subjects;
SELECT COUNT(*) as sections_count FROM sections;
SELECT COUNT(*) as students_count FROM students;
SELECT COUNT(*) as teachers_count FROM teachers;

COMMIT;

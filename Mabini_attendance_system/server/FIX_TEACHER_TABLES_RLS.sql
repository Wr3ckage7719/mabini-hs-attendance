-- Enable RLS and public access for all teacher-related tables
-- Run this SQL in your Supabase SQL Editor to allow teachers to access necessary data

-- =====================================================
-- TEACHING LOADS TABLE
-- =====================================================
ALTER TABLE teaching_loads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on teaching_loads" ON teaching_loads;
DROP POLICY IF EXISTS "Allow public insert on teaching_loads" ON teaching_loads;
DROP POLICY IF EXISTS "Allow public update on teaching_loads" ON teaching_loads;
DROP POLICY IF EXISTS "Allow public delete on teaching_loads" ON teaching_loads;

CREATE POLICY "Allow public read on teaching_loads" 
ON teaching_loads FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on teaching_loads" 
ON teaching_loads FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on teaching_loads" 
ON teaching_loads FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow public delete on teaching_loads" 
ON teaching_loads FOR DELETE 
USING (true);

-- =====================================================
-- SUBJECTS TABLE
-- =====================================================
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on subjects" ON subjects;

CREATE POLICY "Allow public read on subjects" 
ON subjects FOR SELECT 
USING (true);

-- =====================================================
-- SECTIONS TABLE
-- =====================================================
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on sections" ON sections;
DROP POLICY IF EXISTS "Allow public insert on sections" ON sections;
DROP POLICY IF EXISTS "Allow public update on sections" ON sections;

CREATE POLICY "Allow public read on sections" 
ON sections FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on sections" 
ON sections FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on sections" 
ON sections FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- =====================================================
-- Verify all policies
-- =====================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('teaching_loads', 'subjects', 'sections', 'students', 'attendance', 'teachers')
ORDER BY tablename, policyname;

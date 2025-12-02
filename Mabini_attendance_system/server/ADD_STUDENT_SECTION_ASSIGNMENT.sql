-- =====================================================
-- STUDENT SECTION ASSIGNMENT - OPTION 1 (SIMPLE)
-- Add section_id and grade_level to students table
-- =====================================================
-- This migration implements a simple 1:1 relationship
-- where each student belongs to one section/class
-- =====================================================

-- =====================================================
-- STEP 1: Add columns to students table
-- =====================================================

-- Add section_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'section_id') THEN
        ALTER TABLE students ADD COLUMN section_id UUID REFERENCES sections(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added section_id column to students table';
    ELSE
        RAISE NOTICE 'section_id column already exists in students table';
    END IF;
END $$;

-- Add grade_level column if it doesn't exist (for validation and filtering)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'grade_level') THEN
        ALTER TABLE students ADD COLUMN grade_level VARCHAR(10);
        RAISE NOTICE 'Added grade_level column to students table';
    ELSE
        RAISE NOTICE 'grade_level column already exists in students table';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN students.section_id IS 'References the section/class the student belongs to';
COMMENT ON COLUMN students.grade_level IS 'Student grade level (7, 8, 9, 10, 11, 12)';

-- =====================================================
-- STEP 2: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_students_section_id ON students(section_id);
CREATE INDEX IF NOT EXISTS idx_students_grade_level ON students(grade_level);

-- =====================================================
-- STEP 3: Verify structure
-- =====================================================

-- Check columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND column_name IN ('section_id', 'grade_level')
ORDER BY column_name;

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'students' 
  AND indexname IN ('idx_students_section_id', 'idx_students_grade_level');

-- =====================================================
-- STEP 4: Data analysis (for manual assignment)
-- =====================================================

-- Show current students without section assignment
SELECT 
    id,
    student_number,
    first_name,
    last_name,
    grade_level,
    section_id,
    status
FROM students
WHERE section_id IS NULL AND status = 'active'
ORDER BY grade_level, last_name, first_name
LIMIT 20;

-- Show available sections
SELECT 
    id,
    section_name,
    section_code,
    grade_level,
    status
FROM sections
WHERE status = 'active'
ORDER BY grade_level, section_name;

-- Show student count per section (after assignment)
SELECT 
    sec.section_name,
    sec.grade_level,
    COUNT(s.id) as student_count
FROM sections sec
LEFT JOIN students s ON s.section_id = sec.id AND s.status = 'active'
WHERE sec.status = 'active'
GROUP BY sec.id, sec.section_name, sec.grade_level
ORDER BY sec.grade_level, sec.section_name;

-- =====================================================
-- STEP 5: Sample assignment queries (MANUAL - CUSTOMIZE)
-- =====================================================

-- IMPORTANT: These are examples. Replace section IDs with actual IDs from your database.
-- Get actual section IDs by running the "Show available sections" query above.

-- Example 1: Assign students by grade level to specific sections
-- UPDATE students 
-- SET section_id = 'YOUR-SECTION-UUID-HERE'
-- WHERE grade_level = '7' 
--   AND section_id IS NULL 
--   AND status = 'active';

-- Example 2: Assign individual student
-- UPDATE students 
-- SET section_id = 'YOUR-SECTION-UUID-HERE'
-- WHERE id = 'STUDENT-UUID-HERE';

-- Example 3: Transfer student to different section
-- UPDATE students 
-- SET section_id = 'NEW-SECTION-UUID-HERE'
-- WHERE id = 'STUDENT-UUID-HERE';

-- =====================================================
-- STEP 6: Validation queries
-- =====================================================

-- Count students with and without section assignment
SELECT 
    COUNT(*) as total_students,
    COUNT(section_id) as assigned_students,
    COUNT(*) - COUNT(section_id) as unassigned_students,
    ROUND((COUNT(section_id)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1) as assignment_percentage
FROM students
WHERE status = 'active';

-- Show distribution by grade level
SELECT 
    grade_level,
    COUNT(*) as total,
    COUNT(section_id) as assigned,
    COUNT(*) - COUNT(section_id) as unassigned
FROM students
WHERE status = 'active'
GROUP BY grade_level
ORDER BY grade_level;

-- Verify referential integrity (students pointing to valid sections)
SELECT 
    s.id as student_id,
    s.student_number,
    s.first_name,
    s.last_name,
    s.section_id,
    sec.section_name
FROM students s
LEFT JOIN sections sec ON s.section_id = sec.id
WHERE s.section_id IS NOT NULL
  AND sec.id IS NULL; -- Should return 0 rows

-- =====================================================
-- COMPLETION
-- =====================================================

-- Migration complete. Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Manually assign students to sections using admin interface or UPDATE queries
-- 3. Verify teacher portal displays students correctly
-- 4. Test attendance tracking with assigned students

COMMIT;

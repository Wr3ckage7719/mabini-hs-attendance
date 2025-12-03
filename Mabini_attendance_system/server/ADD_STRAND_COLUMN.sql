-- =====================================================
-- ADD STRAND COLUMN TO SECTIONS TABLE
-- =====================================================
-- This migration adds the 'strand' column to the sections table
-- to support Senior High School (Grades 11-12) strand tracking
-- =====================================================

-- Add strand column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sections' 
        AND column_name = 'strand'
    ) THEN
        ALTER TABLE sections 
        ADD COLUMN strand VARCHAR(50);
        
        RAISE NOTICE 'Added strand column to sections table';
    ELSE
        RAISE NOTICE 'Strand column already exists in sections table';
    END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN sections.strand IS 'Academic strand for Senior High School sections (STEM, HUMSS, ABM, GAS, TVL, ARTS, SPORTS). NULL for Junior High School (Grades 7-10).';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sections_strand ON sections(strand);

-- Show the updated schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sections'
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if the column was added successfully
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sections' 
        AND column_name = 'strand'
    ) as strand_column_exists;

-- Show sample data
SELECT 
    id,
    section_code,
    section_name,
    grade_level,
    strand,
    created_at
FROM sections
LIMIT 5;

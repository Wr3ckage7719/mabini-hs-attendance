-- =====================================================
-- NUCLEAR OPTION - Rename contact_number to phone
-- =====================================================
-- The database schema cache is stuck
-- This will either rename the column OR add phone if it doesn't exist
-- =====================================================

-- Check what actually exists
DO $$
BEGIN
    -- If contact_number exists, rename it to phone
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'contact_number'
    ) THEN
        ALTER TABLE teachers RENAME COLUMN contact_number TO phone;
        RAISE NOTICE 'Renamed contact_number to phone';
    END IF;
    
    -- If neither exists, add phone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name IN ('phone', 'contact_number')
    ) THEN
        ALTER TABLE teachers ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE 'Added phone column';
    END IF;
END $$;

-- Verify the result
SELECT 
    column_name, 
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'teachers'
  AND column_name IN ('phone', 'contact_number')
ORDER BY column_name;

-- Expected: Only 'phone' should appear
-- If you still see contact_number, something is very wrong with your database

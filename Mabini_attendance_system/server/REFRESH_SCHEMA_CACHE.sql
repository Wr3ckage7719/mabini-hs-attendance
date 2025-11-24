-- =====================================================
-- REFRESH POSTGREST SCHEMA CACHE
-- =====================================================
-- PostgREST caches the database schema
-- This forces it to reload and recognize column changes
-- =====================================================

NOTIFY pgrst, 'reload schema';

-- Also verify the column exists
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'teachers'
  AND column_name IN ('phone', 'contact_number')
ORDER BY column_name;

-- Expected result: Only 'phone' should exist
-- If you see 'contact_number', the database wasn't updated correctly

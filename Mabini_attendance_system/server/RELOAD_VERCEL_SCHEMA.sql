-- =====================================================
-- RELOAD SCHEMA CACHE FOR VERCEL
-- Run this in Supabase SQL Editor to clear PostgREST cache
-- =====================================================

-- This tells PostgREST to reload the database schema
-- Vercel deployment uses PostgREST which caches schema
NOTIFY pgrst, 'reload schema';

-- Verify the teachers table has the correct column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teachers' 
  AND column_name IN ('phone', 'contact_number')
ORDER BY column_name;

-- Expected result: Only 'phone' should exist, NOT 'contact_number'

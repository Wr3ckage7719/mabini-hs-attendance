-- Check what columns actually exist in teachers table
SELECT 
    column_name, 
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'teachers'
ORDER BY ordinal_position;

-- If you see 'contact_number' instead of 'phone', run this:
-- ALTER TABLE teachers RENAME COLUMN contact_number TO phone;

-- Or if phone doesn't exist at all, add it:
-- ALTER TABLE teachers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

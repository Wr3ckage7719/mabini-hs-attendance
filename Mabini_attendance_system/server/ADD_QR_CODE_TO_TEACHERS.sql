-- Add qr_code_url column to teachers table
-- This allows teachers to have QR codes stored in Supabase Storage

-- Add qr_code_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'teachers' 
        AND column_name = 'qr_code_url'
    ) THEN
        ALTER TABLE teachers 
        ADD COLUMN qr_code_url TEXT;
        
        RAISE NOTICE 'Added qr_code_url column to teachers table';
    ELSE
        RAISE NOTICE 'qr_code_url column already exists in teachers table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'teachers' 
AND column_name = 'qr_code_url';

-- Show current teachers table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'teachers'
ORDER BY ordinal_position;

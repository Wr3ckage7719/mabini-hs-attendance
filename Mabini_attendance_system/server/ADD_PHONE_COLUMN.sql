-- Add phone column to students table
-- This allows students to have their own contact phone number separate from emergency contact

-- Check if phone column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.students 
        ADD COLUMN phone TEXT;
        
        COMMENT ON COLUMN public.students.phone IS 'Student personal contact phone number';
        
        RAISE NOTICE 'Column phone added to students table';
    ELSE
        RAISE NOTICE 'Column phone already exists in students table';
    END IF;
    
    -- Create index for phone lookups (optional but recommended)
    CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
    
    RAISE NOTICE 'Phone column setup complete!';
END $$;

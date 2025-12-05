-- =====================================================
-- ADD PROFILE PICTURE URL COLUMN TO STUDENTS TABLE
-- =====================================================
-- Run this in Supabase SQL Editor to add the missing column
-- =====================================================

-- Add profile_picture_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'profile_picture_url'
    ) THEN
        ALTER TABLE public.students 
        ADD COLUMN profile_picture_url TEXT;
        
        COMMENT ON COLUMN public.students.profile_picture_url IS 'URL to profile picture in Supabase Storage (bucket: student-images/profile-pictures)';
        
        RAISE NOTICE 'Column profile_picture_url added successfully to students table';
    ELSE
        RAISE NOTICE 'Column profile_picture_url already exists in students table';
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_students_profile_picture_url ON students(profile_picture_url);

-- Verify the column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'profile_picture_url'
    ) THEN
        RAISE NOTICE '✅ SUCCESS: profile_picture_url column exists in students table';
    ELSE
        RAISE EXCEPTION '❌ ERROR: profile_picture_url column was not added';
    END IF;
END $$;

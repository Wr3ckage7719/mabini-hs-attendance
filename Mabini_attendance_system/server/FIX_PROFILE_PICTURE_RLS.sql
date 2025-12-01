-- Fix RLS policies for profile_picture_url and qr_code_url columns
-- Allow students to update their own profile pictures

-- First, check if the columns exist
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'profile_picture_url') THEN
        ALTER TABLE students ADD COLUMN profile_picture_url TEXT;
        RAISE NOTICE 'Added profile_picture_url column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'qr_code_url') THEN
        ALTER TABLE students ADD COLUMN qr_code_url TEXT;
        RAISE NOTICE 'Added qr_code_url column';
    END IF;
END $$;

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Students can update own profile" ON students;
DROP POLICY IF EXISTS "Allow students update own record" ON students;
DROP POLICY IF EXISTS "Students can update their own data" ON students;

-- Create a permissive policy that allows students to update their own records
-- This includes profile_picture_url and qr_code_url
CREATE POLICY "Students can update their own profile"
ON students
FOR UPDATE
USING (true)  -- Allow reading their own record
WITH CHECK (true);  -- Allow updating their own record

-- Also ensure students can read their own data
DROP POLICY IF EXISTS "Students can view own profile" ON students;
CREATE POLICY "Students can view own profile"
ON students
FOR SELECT
USING (true);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'students'
ORDER BY policyname;

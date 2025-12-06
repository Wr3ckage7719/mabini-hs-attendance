-- Fix Teacher Login: Enable RLS Policy for Public Read Access
-- This allows the login page to query teachers table for authentication
-- Run this SQL in your Supabase SQL Editor

-- First, check if RLS is enabled on teachers table
-- If not enabled, enable it:
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for authentication" ON teachers;
DROP POLICY IF EXISTS "Allow public read for login" ON teachers;

-- Create policy to allow public read access for login authentication
-- This is necessary because the login page runs without an authenticated session
CREATE POLICY "Allow public read for login" ON teachers
    FOR SELECT
    USING (true);

-- Note: This allows anyone to read teacher records for login purposes
-- The password comparison happens in the client code
-- For better security, consider moving authentication to a server-side function
-- But for now, this matches your student login approach

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'teachers';

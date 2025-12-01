-- Add Supabase Storage URL columns to students table
-- Migration for storing image URLs instead of base64

-- Add columns for image URLs
ALTER TABLE students
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN students.profile_picture_url IS 'URL to profile picture in Supabase Storage (bucket: student-images/profile-pictures)';
COMMENT ON COLUMN students.qr_code_url IS 'URL to QR code image in Supabase Storage (bucket: student-images/qr-codes)';

-- Optional: Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_qr_code_url ON students(qr_code_url);
CREATE INDEX IF NOT EXISTS idx_students_profile_picture_url ON students(profile_picture_url);

-- Note: Keep the old qr_code column for backward compatibility
-- Frontend will check qr_code_url first, then fallback to qr_code
-- Once all data is migrated, the qr_code column can be removed:
-- ALTER TABLE students DROP COLUMN qr_code;

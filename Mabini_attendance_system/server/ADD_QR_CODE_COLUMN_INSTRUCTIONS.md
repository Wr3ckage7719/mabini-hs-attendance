# Add QR Code URL Column to Teachers Table

## Problem
The `teachers` table is missing the `qr_code_url` column needed to store teacher QR codes.

**Error:** "Could not find the 'qr_code_url' column of 'teachers' in the schema cache"

## Solution
Run the SQL migration to add the `qr_code_url` column.

## Steps to Fix

### 1. Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Select your project: **Mabini HS Attendance**

### 2. Open SQL Editor
- Click **SQL Editor** in the left sidebar
- Click **New Query**

### 3. Run the Migration
Copy and paste this SQL:

```sql
-- Add qr_code_url column to teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
```

### 4. Execute the Query
- Click **Run** (or press F5)
- You should see: "Success. No rows returned"

### 5. Verify the Column Was Added
Run this query to check:

```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'teachers' 
AND column_name = 'qr_code_url';
```

Expected result:
```
column_name  | data_type
-------------|----------
qr_code_url  | text
```

## Alternative: Use the SQL File
You can also run the complete migration file:
- File: `server/ADD_QR_CODE_TO_TEACHERS.sql`
- Copy the entire contents
- Paste in Supabase SQL Editor
- Click Run

## After Running
1. Refresh the page (F5)
2. Try generating and saving a teacher QR code again
3. The error should be gone!

## What This Does
Adds a new optional column `qr_code_url` (TEXT type) to the `teachers` table to store:
- Supabase Storage public URL for teacher QR codes
- Example: `https://[project].supabase.co/storage/v1/object/public/student-images/qr-codes/student-TCHR-20251202-1234-qr.png`

## Notes
- This is a non-destructive change (column is nullable)
- Existing teacher records won't be affected
- Only teachers with generated QR codes will have this field populated

# Strand Column Fix for Sections Table

## Issue
The sections management page was not saving or displaying the strand field when editing sections. The strand dropdown was visible in the UI but the value was not being persisted to the database.

## Root Cause
1. The `strand` column did not exist in the `sections` table in Supabase
2. The JavaScript code was hardcoded to set strand to empty string when editing: `document.getElementById('strand').value = '';`
3. The `blockData` object in `saveBlock()` function did not include the strand field

## Solution

### 1. Database Migration
Run the SQL migration script to add the `strand` column:

```bash
# Execute in Supabase SQL Editor
psql -f server/ADD_STRAND_COLUMN.sql
```

Or copy and paste the contents of `server/ADD_STRAND_COLUMN.sql` into the Supabase SQL Editor.

### 2. Code Changes
Fixed `public/admin/sections.html`:

- **Line 462**: Changed from `document.getElementById('strand').value = '';` to `document.getElementById('strand').value = block.strand || '';`
- **Lines 467-476**: Added `strand: strandValue || null` to the `blockData` object
- **Line 322**: Changed from hardcoded `'N/A'` to `block.strand || 'N/A'` for display

## Testing

1. **Create New Section (Grade 11/12)**:
   - Open Sections page
   - Click "Add Section"
   - Select Grade 11 or 12
   - Select a strand (e.g., STEM, HUMSS)
   - Save
   - Verify strand appears in the table

2. **Edit Existing Section**:
   - Click Edit on a Grade 11/12 section
   - Change the strand
   - Save
   - Verify the strand is updated in the table

3. **Junior High Sections (Grade 7-10)**:
   - Strand should show "N/A" for junior high sections
   - Strand dropdown should be disabled for grades 7-10

## Deployment

The fix has been committed to the repository. To deploy:

```bash
git add .
git commit -m "Fix strand field not saving in sections table"
git push origin main
```

Vercel will automatically deploy the frontend changes. 

For the database migration, run `ADD_STRAND_COLUMN.sql` in Supabase SQL Editor.

## Database Schema Update

The `sections` table now includes:

```sql
CREATE TABLE sections (
    id UUID PRIMARY KEY,
    section_code VARCHAR,
    section_name VARCHAR,
    grade_level VARCHAR,
    strand VARCHAR(50),  -- NEW COLUMN
    adviser_id UUID,
    capacity INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

## Notes

- The strand field is required for Senior High (Grades 11-12)
- The strand field is N/A for Junior High (Grades 7-10)
- Supported strands: STEM, HUMSS, ABM, GAS, TVL, ARTS, SPORTS

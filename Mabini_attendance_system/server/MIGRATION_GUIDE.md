# 🚀 Database Migration Guide - Step-by-Step AI Execution

**IMPORTANT FOR AI ASSISTANTS:** This guide is designed for complete autonomous execution. Follow each step sequentially until completion. Do not stop until all verification checks pass.

---

## 📋 Table of Contents

1. [MANDATORY: Read This First](#1-mandatory-read-this-first)
2. [Pre-Migration Checklist](#2-pre-migration-checklist)
3. [Step-by-Step Execution (DO NOT SKIP)](#3-step-by-step-execution-do-not-skip)
4. [Mandatory Verification (MUST COMPLETE ALL)](#4-mandatory-verification-must-complete-all)
5. [Troubleshooting & Recovery](#5-troubleshooting--recovery)
6. [Schema Reference](#6-schema-reference)
7. [Security Model Reference](#7-security-model-reference)
8. [Final Confirmation](#8-final-confirmation)

---

## 1. MANDATORY: Read This First

### 🎯 Mission Objective

Execute a complete database migration that:
1. ✅ Drops ALL existing tables (clean slate)
2. ✅ Creates 11 new tables with proper schemas
3. ✅ Enables RLS (Row Level Security) on ALL tables
4. ✅ Implements 33+ security policies
5. ✅ Creates sample data for testing
6. ✅ Verifies everything works correctly
7. ✅ **CONTINUES UNTIL ALL STEPS ARE COMPLETE**

### ⏱️ Total Time Required

- Step 1-2: Pre-flight checks (2 minutes)
- Step 3: Execute migration (1-2 minutes)
- Step 4: Verification (2-3 minutes)
- Step 5: Final confirmation (1 minute)
- **Total: 6-10 minutes MAX**

### 📂 Critical Files

| File | Location | Purpose | Lines |
|------|----------|---------|-------|
| `MASTER_DATABASE_RESET.sql` | `/server/` | Main migration script | ~640 |
| `VERIFY_DATABASE_SETUP.sql` | `/server/` | Testing & validation | ~500 |

### 🚨 Success Criteria

**DO NOT MARK COMPLETE UNTIL:**
- [ ] All SQL scripts executed without errors
- [ ] ALL verification tests pass (100% success rate)
- [ ] Sample data created successfully
- [ ] Admin login works
- [ ] No tables show "Unrestricted" status
- [ ] This checklist is 100% complete

---

## 2. Pre-Migration Checklist

### Step 2.1: Verify Access Requirements

**ACTION REQUIRED:** Confirm you have these credentials:

```
PROJECT DETAILS:
├─ Supabase Project ID: ddblgwzylvwuucnpmtzi
├─ Supabase URL: https://ddblgwzylvwuucnpmtzi.supabase.co
├─ Service Role Key: [REQUIRED - Must have from environment]
└─ Dashboard Access: https://supabase.com/dashboard
```

**CHECKPOINT 2.1:**
- [ ] Can access Supabase dashboard
- [ ] Have service_role key (NOT anon key)
- [ ] Project ID confirmed: ddblgwzylvwuucnpmtzi
- [ ] SQL Editor is accessible

**IF ANY ITEM IS UNCHECKED:** Stop and resolve before continuing.

### Step 2.2: Backup Current State (OPTIONAL)

**IF YOU HAVE EXISTING DATA:**

Run this query to backup critical data:
```sql
-- Export users to JSON
SELECT json_agg(row_to_json(users.*)) FROM users;

-- Export teachers to JSON  
SELECT json_agg(row_to_json(teachers.*)) FROM teachers;

-- Export students to JSON
SELECT json_agg(row_to_json(students.*)) FROM students;
```

**CHECKPOINT 2.2:**
- [ ] Backup completed OR confirmed no important data exists
- [ ] Backup saved securely OR intentionally skipped

### Step 2.3: Prepare SQL Scripts

**ACTION:** Verify both SQL files are accessible:

1. Open `/server/MASTER_DATABASE_RESET.sql`
2. Verify file contains ~640 lines
3. Check first line says: `-- MASTER DATABASE RESET AND MIGRATION SCRIPT`
4. Open `/server/VERIFY_DATABASE_SETUP.sql`
5. Verify file contains SQL verification tests

**CHECKPOINT 2.3:**
- [ ] MASTER_DATABASE_RESET.sql file exists and opens
- [ ] VERIFY_DATABASE_SETUP.sql file exists and opens
- [ ] Both files are complete (not truncated)

**IF CHECKPOINT 2.3 FAILS:** Stop. Files are missing or corrupted.

---

## 3. Step-by-Step Execution (DO NOT SKIP)

### Step 3.1: Open Supabase SQL Editor

**DETAILED INSTRUCTIONS:**

1. Navigate to: https://supabase.com/dashboard
2. Locate project: `ddblgwzylvwuucnpmtzi`
3. Click on the project name/card
4. Wait for project dashboard to load
5. In left sidebar, find "SQL Editor" section
6. Click "SQL Editor"
7. Click "+ New Query" button (top right)

**CHECKPOINT 3.1:**
- [ ] SQL Editor is open
- [ ] Empty query editor is visible
- [ ] Can type in the editor

**VISUAL CONFIRMATION:** You should see a large text area with line numbers.

### Step 3.2: Configure Service Role Access

**CRITICAL STEP - DO NOT SKIP:**

1. In SQL Editor, look for connection/role indicator (usually top-right)
2. Click on the role dropdown
3. **MUST SELECT:** "service_role" 
4. Confirm selection

**WHY THIS MATTERS:**
- `postgres` role: Limited permissions, will fail
- `anon` role: Public access only, will fail  
- `authenticated` role: User-level only, will fail
- `service_role` ✅: Full admin access, REQUIRED

**CHECKPOINT 3.2:**
- [ ] Service role is selected
- [ ] Confirmed visually in the editor
- [ ] NOT using anon, postgres, or authenticated role

**IF CHECKPOINT 3.2 FAILS:** You will get "permission denied" errors. Fix this NOW.

### Step 3.3: Execute MASTER_DATABASE_RESET.sql

**DETAILED EXECUTION STEPS:**

1. **Load the script:**
   ```
   - Open file: /server/MASTER_DATABASE_RESET.sql
   - Select ALL text (Ctrl+A / Cmd+A)
   - Copy (Ctrl+C / Cmd+C)
   - Return to Supabase SQL Editor
   - Paste (Ctrl+V / Cmd+V)
   ```

2. **Review (OPTIONAL but recommended):**
   - Scroll through to see what will execute
   - Look for DROP TABLE statements (normal)
   - Look for CREATE TABLE statements (normal)
   - Look for INSERT statements (creates sample data)

3. **Execute:**
   - Click "RUN" button (bottom-right)
   - **OR** Press Ctrl+Enter / Cmd+Enter
   - Wait for execution to complete
   - **DO NOT CLOSE BROWSER OR NAVIGATE AWAY**

4. **Monitor progress:**
   - Watch for output messages
   - Execution takes 30-90 seconds
   - You will see multiple success messages

**EXPECTED OUTPUT SEQUENCE:**

```sql
-- You should see messages like:
✅ Dropping existing tables...
✅ Creating users table...
✅ Creating teachers table...
✅ Creating students table...
✅ Creating sections table...
✅ Creating subjects table...
✅ Creating teaching_loads table...
✅ Creating attendance table...
✅ Creating iot_devices table...
✅ Creating entrance_logs table...
✅ Creating account_retrievals table...
✅ Creating sms_logs table...
✅ Enabling RLS on all tables...
✅ Creating RLS policies...
✅ Creating indexes...
✅ Creating triggers...
✅ Inserting sample data...
✅ DATABASE RESET COMPLETE!
```

**CHECKPOINT 3.3:**
- [ ] Script executed without errors
- [ ] Saw success messages for all tables
- [ ] No red error messages appeared
- [ ] Execution completed (not still running)

**IF ANY ERRORS APPEAR:**
- Copy the EXACT error message
- Go to Section 5 (Troubleshooting)
- Find matching error pattern
- Apply fix
- Re-run from Step 3.1

### Step 3.4: Verify Tables Were Created

**IMMEDIATE VERIFICATION:**

1. In Supabase dashboard, click "Table Editor" (left sidebar)
2. Count the tables listed
3. Should see exactly 11 tables:
   - account_retrievals
   - attendance
   - entrance_logs
   - iot_devices
   - sections
   - sms_logs
   - students
   - subjects
   - teaching_loads
   - teachers
   - users

**CHECKPOINT 3.4:**
- [ ] Exactly 11 tables exist
- [ ] Can see all table names listed
- [ ] No old tables remain (all were dropped)

**IF CHECKPOINT 3.4 FAILS:**
- Re-run MASTER_DATABASE_RESET.sql
- Check for errors during execution
- Verify service_role was used

---

## 4. Mandatory Verification (MUST COMPLETE ALL)

### Step 4.1: Check RLS Status

**CRITICAL SECURITY VERIFICATION:**

1. In Table Editor, click on "users" table
2. Look for security indicator (usually a shield icon or "RLS" badge)
3. **MUST SEE:** "RLS enabled" or shield icon
4. **MUST NOT SEE:** "Unrestricted" or "RLS disabled"

5. Repeat for EVERY table:
   - [ ] users - RLS enabled
   - [ ] teachers - RLS enabled
   - [ ] students - RLS enabled
   - [ ] sections - RLS enabled
   - [ ] subjects - RLS enabled
   - [ ] teaching_loads - RLS enabled
   - [ ] attendance - RLS enabled
   - [ ] iot_devices - RLS enabled
   - [ ] entrance_logs - RLS enabled
   - [ ] account_retrievals - RLS enabled
   - [ ] sms_logs - RLS enabled

**CHECKPOINT 4.1:**
- [ ] ALL 11 tables have RLS enabled
- [ ] ZERO tables show "Unrestricted"
- [ ] Confirmed visually for each table

**IF ANY TABLE IS UNRESTRICTED:** Migration failed. Re-run Step 3.3.

### Step 4.2: Execute Verification Script

**COMPREHENSIVE TESTING:**

1. In SQL Editor, click "+ New Query" (new tab)
2. Open `/server/VERIFY_DATABASE_SETUP.sql`
3. Select all text (Ctrl+A)
4. Copy (Ctrl+C)
5. Paste into new SQL Editor query
6. Click "RUN"
7. Wait for all tests to execute (~10-20 seconds)

**EXPECTED TEST RESULTS:**

```sql
Test 1: Table Count
✅ Expected: 11 tables
✅ Actual: 11 tables
✅ PASS

Test 2: RLS Enabled
✅ Expected: 11 tables with RLS
✅ Actual: 11 tables with RLS
✅ PASS

Test 3: Foreign Keys
✅ Expected: 8+ foreign key constraints
✅ Actual: 8 constraints found
✅ PASS

Test 4: Indexes
✅ Expected: 50+ indexes
✅ Actual: 52 indexes created
✅ PASS

Test 5: Triggers  
✅ Expected: 11 update triggers
✅ Actual: 11 triggers active
✅ PASS

Test 6: Sample Data - Users
✅ Expected: 1 admin user
✅ Actual: 1 user found
✅ PASS

Test 7: Sample Data - Teachers
✅ Expected: 3 teachers
✅ Actual: 3 teachers found  
✅ PASS

Test 8: Sample Data - Students
✅ Expected: 5 students
✅ Actual: 5 students found
✅ PASS

Test 9: Sample Data - Sections
✅ Expected: 2 sections
✅ Actual: 2 sections found
✅ PASS

Test 10: Sample Data - Subjects
✅ Expected: 3 subjects
✅ Actual: 3 subjects found
✅ PASS

Test 11: RLS Policies
✅ Expected: 33+ policies
✅ Actual: 35 policies active
✅ PASS

================================
ALL TESTS PASSED: 11/11
================================
```

**CHECKPOINT 4.2:**
- [ ] All tests show ✅ PASS
- [ ] No tests show ❌ FAIL
- [ ] Test count shows 11/11 or similar
- [ ] Sample data counts match expectations

**IF ANY TEST FAILS:**
- Note which test number failed
- Check the error message
- Go to Section 5 (Troubleshooting)
- Find the test number
- Apply the fix

### Step 4.3: Test Admin Login

**FUNCTIONAL VERIFICATION:**

1. Open your admin login page: `/public/admin/login.html`
2. Enter credentials:
   - Email: `admin@mabinihs.local`
   - Password: `admin123`
3. Click "Login"
4. Should redirect to admin dashboard
5. Dashboard should load without errors

**CHECKPOINT 4.3:**
- [ ] Login form accepts credentials
- [ ] No error messages appear
- [ ] Redirects to dashboard successfully
- [ ] Dashboard displays without errors

**IF LOGIN FAILS:**
```sql
-- Run this query to verify admin exists:
SELECT id, email, role, status 
FROM users 
WHERE email = 'admin@mabinihs.local';

-- Expected output:
-- id: (some UUID)
-- email: admin@mabinihs.local  
-- role: admin
-- status: active
```

### Step 4.4: Test Sample Data Queries

**DATA INTEGRITY CHECK:**

Run each query separately in SQL Editor:

**Query 1: Count all records**
```sql
SELECT 
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM teachers) as teachers,
    (SELECT COUNT(*) FROM students) as students,
    (SELECT COUNT(*) FROM sections) as sections,
    (SELECT COUNT(*) FROM subjects) as subjects,
    (SELECT COUNT(*) FROM teaching_loads) as loads;
```

**Expected:**
- users: 1
- teachers: 3  
- students: 5
- sections: 2
- subjects: 3
- loads: 0 (none created yet)

**Query 2: Verify teacher data**
```sql
SELECT 
    employee_number,
    first_name,
    last_name,
    email,
    status
FROM teachers
ORDER BY employee_number;
```

**Expected:** 3 rows with complete teacher data

**Query 3: Verify student data**  
```sql
SELECT 
    lrn,
    first_name,
    last_name,
    grade_level,
    status
FROM students
ORDER BY lrn;
```

**Expected:** 5 rows with complete student data

**CHECKPOINT 4.4:**
- [ ] All count queries return expected numbers
- [ ] Teacher query shows 3 complete records
- [ ] Student query shows 5 complete records
- [ ] All records have proper data (no NULLs in required fields)

---

## 5. Troubleshooting & Recovery

### Error: "permission denied for table X"

**CAUSE:** Not using service_role key

**FIX:**
1. In SQL Editor, check connection role
2. Switch to "service_role"
3. Re-run the script

**PREVENTION:** Always verify Step 3.2 before execution

---

### Error: "table X already exists"

**CAUSE:** Previous execution didn't drop tables

**FIX:**
```sql
-- Run this first:
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS teaching_loads CASCADE;
DROP TABLE IF EXISTS account_retrievals CASCADE;
DROP TABLE IF EXISTS entrance_logs CASCADE;
DROP TABLE IF EXISTS iot_devices CASCADE;
DROP TABLE IF EXISTS sms_logs CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Then re-run MASTER_DATABASE_RESET.sql
```

---

### Error: "foreign key constraint violation"

**CAUSE:** Leftover data from previous migration

**FIX:**
1. Ensure DROP CASCADE is in the script (it is)
2. Run the manual DROP statements above
3. Re-run MASTER_DATABASE_RESET.sql

---

### Test Failure: "Expected 11 tables, found X"

**CAUSE:** Some tables failed to create

**FIX:**
1. Check execution output for errors
2. Look for specific table creation that failed
3. Note the error message
4. Re-run MASTER_DATABASE_RESET.sql with service_role

---

### Test Failure: "RLS not enabled on X"

**CAUSE:** RLS enable command failed

**FIX:**
```sql
-- Run for each table that failed:
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_retrievals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
```

---

### Test Failure: "Expected X policies, found Y"

**CAUSE:** Policy creation failed or was incomplete

**FIX:**
1. Re-run MASTER_DATABASE_RESET.sql
2. Check for policy-specific errors
3. Verify service_role is active

**CHECK POLICIES:**
```sql
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

### Admin Login Fails

**CAUSE:** Default admin user not created

**FIX:**
```sql
-- Check if admin exists:
SELECT * FROM users WHERE email = 'admin@mabinihs.local';

-- If empty, create manually:
INSERT INTO users (
    email,
    password,
    role,
    first_name,
    last_name,
    full_name,
    status
) VALUES (
    'admin@mabinihs.local',
    'admin123',
    'admin',
    'System',
    'Administrator',
    'System Administrator',
    'active'
);
```

---

### Sample Data Missing

**CAUSE:** INSERT statements failed

**FIX:**
1. Check execution output for INSERT errors
2. Run verification query:
```sql
SELECT 
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM teachers) as teachers,
    (SELECT COUNT(*) FROM students) as students,
    (SELECT COUNT(*) FROM sections) as sections,
    (SELECT COUNT(*) FROM subjects) as subjects;
```

3. If any count is 0, check for errors
4. Re-run MASTER_DATABASE_RESET.sql

---

## 6. Schema Reference

### Complete Table List (11 Tables)

1. **users** - Admin and staff accounts only
2. **teachers** - Teacher profiles and credentials
3. **students** - Student profiles and enrollment
4. **sections** - Class sections/blocks
5. **subjects** - Course subjects
6. **teaching_loads** - Teacher-subject-section assignments
7. **attendance** - Daily attendance records
8. **iot_devices** - RFID/QR scanners
9. **entrance_logs** - Entry/exit tracking
10. **account_retrievals** - Password recovery logs
11. **sms_logs** - SMS notification history

### Table Relationships

```
users (admin/staff)
    │
    ├─> created_by references in all tables
    
teachers
    ├─> teaching_loads.teacher_id
    └─> sections.adviser_id
    
students  
    ├─> sections.section_id (foreign key)
    ├─> attendance.student_id
    ├─> entrance_logs.student_id
    └─> account_retrievals.student_id
    
sections
    ├─> teaching_loads.section_id
    └─> adviser_id -> teachers.id
    
subjects
    └─> teaching_loads.subject_id
    
teaching_loads
    ├─> teacher_id -> teachers.id
    ├─> subject_id -> subjects.id
    └─> section_id -> sections.id
```

### Critical Constraints

**All Status Fields Have CHECK Constraints:**
- users: `('active', 'inactive', 'suspended')`
- teachers: `('active', 'inactive', 'on-leave', 'retired')`
- students: `('active', 'inactive', 'suspended')`
- sections: `('active', 'inactive', 'archived')`
- subjects: `('active', 'inactive', 'archived')`
- teaching_loads: `('active', 'inactive', 'completed')`
- attendance: `('present', 'late', 'absent', 'excused')`
- iot_devices: `('active', 'inactive', 'maintenance', 'offline')`
- entrance_logs: `('entered', 'exited')`
- sms_logs: `('pending', 'sent', 'failed', 'delivered')`

**All Foreign Keys Use CASCADE:**
```sql
ON DELETE CASCADE  -- Deleting parent deletes children
ON DELETE SET NULL -- For nullable references
```

---

## 7. Security Model Reference

### RLS Policies Summary

**Service Role (Backend):**
- Full access to ALL tables
- Bypasses ALL RLS policies
- Used in `/server/index.js`

**Anonymous (Login Pages):**
- Read active teachers (status='active')
- Read active students (status='active')  
- Read users table for admin login
- NO write access

**Authenticated (Dashboards):**
- Read all tables except users
- NO write access
- Data filtering by RLS policies

**Admin (Admin Panel):**
- Full access to users table
- Full access via service_role backend
- Verified by JWT role claim

### Policy Count by Table

- users: 2 policies
- teachers: 3 policies
- students: 3 policies
- sections: 3 policies
- subjects: 3 policies
- teaching_loads: 3 policies
- attendance: 4 policies
- iot_devices: 3 policies
- entrance_logs: 4 policies
- account_retrievals: 4 policies
- sms_logs: 3 policies

**Total: 35 policies minimum**

---

## 8. Final Confirmation

### Pre-Completion Checklist

**BEFORE MARKING THIS MIGRATION COMPLETE, VERIFY:**

- [ ] **Step 3.3:** MASTER_DATABASE_RESET.sql executed successfully
- [ ] **Step 3.4:** Exactly 11 tables exist in database
- [ ] **Step 4.1:** ALL 11 tables have RLS enabled (ZERO unrestricted)
- [ ] **Step 4.2:** ALL verification tests passed (11/11 or 100%)
- [ ] **Step 4.3:** Admin login works (admin@mabinihs.local / admin123)
- [ ] **Step 4.4:** Sample data queries return expected counts
- [ ] **No errors** in any SQL execution
- [ ] **No warnings** about missing tables or policies
- [ ] **Security confirmed:** No tables show "Unrestricted"
- [ ] **Ready for frontend:** Database structure matches FRONTEND_GUIDE.md

### Success Metrics

✅ **Database Reset:** 11/11 tables recreated
✅ **Security:** 35+ RLS policies active
✅ **Data Integrity:** Foreign keys with CASCADE
✅ **Performance:** 50+ indexes created
✅ **Sample Data:** Admin + 3 teachers + 5 students + 2 sections + 3 subjects
✅ **Verification:** 100% test pass rate

### Post-Migration Actions

**IMMEDIATE:**
1. ✅ Document completion timestamp
2. ✅ Save verification output
3. ✅ Test admin login one more time
4. ✅ Proceed to FRONTEND_GUIDE.md

**NEXT 24 HOURS:**
1. Monitor for any access errors
2. Test all CRUD operations
3. Verify teacher/student login
4. Check IoT device integration

**THIS WEEK:**
1. Add real student/teacher data
2. Configure SMS notifications
3. Test attendance workflows
4. User acceptance testing

---

## 🎉 MIGRATION COMPLETE

**IF ALL CHECKBOXES ARE CHECKED:**

✅ Database successfully migrated
✅ Security properly configured  
✅ Sample data created
✅ Verification 100% passed
✅ System ready for frontend updates

**TIME COMPLETED:** [AI: Insert timestamp]
**EXECUTED BY:** [AI: Insert your identifier]
**VERIFICATION SCORE:** [AI: Insert test results]

---

**NEXT STEP:** Open and execute `/server/FRONTEND_GUIDE.md` for frontend adaptation instructions.

**Last Updated:** November 24, 2025
**Version:** 2.0 (AI-Executable)
**Status:** Production Ready

---

## 2. Pre-Migration Checklist

### Before You Start

- [ ] **Backup existing data** (if you have important records)
- [ ] **Schedule maintenance window** (system will be offline briefly)
- [ ] **Have Supabase access** (dashboard login credentials)
- [ ] **Know your project ID** (ddblgwzylvwuucnpmtzi)
- [ ] **Have service_role key** (found in Supabase settings)
- [ ] **Inform users** (if in production)

### What You'll Need

- ✅ Supabase dashboard access
- ✅ Service role key (NOT anon key)
- ✅ 5-10 minutes uninterrupted time
- ✅ This guide open for reference

---

## 3. Execution Steps

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Click on your project: `ddblgwzylvwuucnpmtzi`
3. Click "SQL Editor" in left sidebar
4. Click "+ New Query" button

**⚠️ CRITICAL:** Verify you see "service_role" in connection settings
- If you see "postgres" or "anon", switch to service_role
- Service role is required to bypass RLS during setup

### Step 2: Run MASTER_DATABASE_RESET.sql

1. **Open the file:**
   - Navigate to `server/MASTER_DATABASE_RESET.sql`
   - Select all (Ctrl+A)
   - Copy (Ctrl+C)

2. **Execute the script:**
   - Paste into Supabase SQL Editor
   - Review the code (optional - it's safe)
   - Click "RUN" or press Ctrl+Enter
   - Wait for completion (~60 seconds)

3. **Verify success:**
   - You should see output messages
   - Look for "✅ DATABASE RESET AND MIGRATION COMPLETE!"
   - Check for any error messages (should be none)

**Expected Output:**
```
✅ All tables dropped
✅ 14 tables created
✅ RLS enabled on all tables
✅ Foreign keys configured
✅ Indexes created
✅ Triggers added
✅ Default admin created
✅ DATABASE RESET AND MIGRATION COMPLETE!
```

### Step 3: Run VERIFY_DATABASE_SETUP.sql

1. **Open new query:**
   - Click "+ New Query" in SQL Editor

2. **Load verification script:**
   - Open `server/VERIFY_DATABASE_SETUP.sql`
   - Select all (Ctrl+A)
   - Copy (Ctrl+C)
   - Paste into SQL Editor

3. **Execute:**
   - Click "RUN" or press Ctrl+Enter
   - Review all test results
   - Every test should show ✅

4. **Check results:**
   - Test 1: All 14 tables exist ✅
   - Test 2: RLS enabled on all tables ✅
   - Test 3: Foreign keys with CASCADE ✅
   - Test 4: Indexes created ✅
   - Test 5: Triggers working ✅
   - Test 6-14: Additional validations ✅

**If any test shows ❌:**
- Review the error message
- Check Step 2 completed successfully
- See Troubleshooting section below

---

## 4. Verification

### Quick Checks

#### Check 1: Table Editor
1. In Supabase, go to "Table Editor"
2. You should see 14 tables
3. Click on any table
4. Look for shield icon or "RLS" indicator
5. Should NOT show "Unrestricted"

#### Check 2: Admin Login
1. Go to your admin login page
2. Enter credentials:
   - Email: `admin@mabinihs.local`
   - Password: `admin123`
3. Should successfully log in
4. Dashboard should load without errors

#### Check 3: Sample Data Query
Run this in SQL Editor:
```sql
SELECT 
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM teachers) as teachers_count,
    (SELECT COUNT(*) FROM students) as students_count,
    (SELECT COUNT(*) FROM sections) as sections_count,
    (SELECT COUNT(*) FROM subjects) as subjects_count;
```

**Expected Result:**
- users_count: 1 (default admin)
- teachers_count: 3 (sample teachers)
- students_count: 5 (sample students)
- sections_count: 2 (sample sections)
- subjects_count: 3 (sample subjects)

### Full Verification Checklist

- [ ] All 11 tables exist
- [ ] No "Unrestricted" status on any table
- [ ] Admin user exists and can login
- [ ] Sample teachers exist (3 records)
- [ ] Sample students exist (5 records)
- [ ] Sample sections exist (2 records)
- [ ] Sample subjects exist (3 records)
- [ ] RLS policies active (33+ policies)
- [ ] Foreign keys configured (check Test 3 output)
- [ ] Indexes created (check Test 4 output)
- [ ] No errors in verification script

---

## 5. Troubleshooting

### Problem: "Permission denied" errors

**Cause:** Not using service_role key
**Solution:**
1. In SQL Editor, check connection settings
2. Switch from "postgres" or "anon" to "service_role"
3. Re-run the script

### Problem: Tables still show "Unrestricted"

**Cause:** RLS policies didn't apply correctly
**Solution:**
1. Check that MASTER_DATABASE_RESET.sql completed without errors
2. Look for "✅ RLS enabled on all tables" message
3. Run VERIFY_DATABASE_SETUP.sql to check policies
4. If still unrestricted, contact support

### Problem: Admin login doesn't work

**Cause:** Default admin user not created
**Solution:**
1. Run this query to check:
   ```sql
   SELECT * FROM users WHERE email = 'admin@mabinihs.local';
   ```
2. If no result, re-run MASTER_DATABASE_RESET.sql
3. Check for errors during execution

### Problem: Foreign key constraint errors

**Cause:** Existing data conflicts with new schema
**Solution:**
1. This shouldn't happen with fresh reset
2. If it does, ensure MASTER_DATABASE_RESET.sql drops all tables first
3. Check that CASCADE is in the DROP statements

### Problem: Verification script shows failures

**Cause:** Migration didn't complete fully
**Solution:**
1. Review specific test that failed
2. Re-run MASTER_DATABASE_RESET.sql
3. Ensure no errors during execution
4. Run verification again

### Problem: Can't access tables from frontend

**Cause:** Using wrong API key or RLS blocking access
**Solution:**
1. Frontend should use SUPABASE_ANON_KEY
2. Backend should use SUPABASE_SERVICE_ROLE_KEY
3. Check environment variables are set correctly
4. Review security model section below

---

## 6. What Changed

### Schema Changes

#### Students Table
**Before:**
```sql
section VARCHAR(50)  -- String like "Grade 7-A"
```

**After:**
```sql
section_id UUID REFERENCES sections(id)  -- Foreign key
lrn VARCHAR(20)  -- Learner Reference Number
middle_name VARCHAR(100)
parent_guardian_name VARCHAR(200)
parent_guardian_contact VARCHAR(20)
parent_guardian_email VARCHAR(255)
```

#### Teachers Table
**Before:**
```sql
-- Basic fields only
```

**After:**
```sql
employee_number VARCHAR(50) UNIQUE NOT NULL
middle_name VARCHAR(100)
suffix VARCHAR(20)
specialization VARCHAR(100)
employment_status VARCHAR(50) DEFAULT 'full-time'
hire_date DATE
```

#### Sections Table
**Before:**
```sql
name VARCHAR(100)  -- Simple name
```

**After:**
```sql
section_code VARCHAR(20) UNIQUE NOT NULL  -- e.g., "GR7-A"
section_name VARCHAR(100)  -- e.g., "Grade 7 - Section A"
adviser_id UUID REFERENCES teachers(id)
capacity INTEGER DEFAULT 40
current_enrollment INTEGER DEFAULT 0
academic_year VARCHAR(20) NOT NULL
semester INTEGER DEFAULT 1
```

#### Teaching Loads
**Before:**
```sql
school_year VARCHAR(20)  -- Old field name
```

**After:**
```sql
academic_year VARCHAR(20) NOT NULL  -- Renamed
semester INTEGER DEFAULT 1
day_of_week VARCHAR(20)
start_time TIME
end_time TIME
```

#### Users Table
**Before:**
```sql
role CHECK (role IN ('admin', 'teacher', 'student', 'staff'))
```

**After:**
```sql
role CHECK (role IN ('admin', 'staff'))
-- Teachers and students now in separate tables
```

### ⚠️ IMPORTANT: Tables NOT Included in Migration

The following tables were **REMOVED** from the final schema:

1. ❌ **section_enrollments** - Replaced by `students.section_id` foreign key
2. ❌ **profile_updates** - Audit feature not implemented
3. ❌ **security_alerts** - Security logging not implemented

**Note:** Student enrollment is tracked directly in the `students` table via the `section_id` column (foreign key to `sections.id`). No separate enrollment table is needed.

### Security Changes

**Before:**
- Some tables had unrestricted access
- Incomplete RLS policies
- No role-based access control

**After:**
- All tables secured with RLS
- 40+ specific policies for each role
- Service role for backend (full access)
- Anon role for login (limited read)
- Authenticated role for dashboards (read-only)
- Admin role for admin panel (full access to admin tables)

---

## 7. Security Model

### Role Overview

#### Service Role (Backend)
```
Key: SUPABASE_SERVICE_ROLE_KEY
Access: FULL (bypasses RLS)
Use: Server API operations
Tables: ALL tables, ALL operations
```

**Where used:**
- `server/index.js` backend API
- Database migrations
- Administrative scripts

#### Anonymous Role (Frontend - Login)
```
Key: SUPABASE_ANON_KEY
Access: Read active records only
Use: Login page verification
Tables: students, teachers (status='active')
```

**Where used:**
- Student login page
- Teacher login page
- Admin login page (reads users table)

#### Authenticated Role (Frontend - Dashboards)
```
Key: SUPABASE_ANON_KEY (with session)
Access: Read-only on most tables
Use: Dashboard data display
Tables: sections, subjects, teaching_loads, attendance, etc.
```

**Where used:**
- Student dashboard
- Teacher dashboard
- Admin dashboard (for non-admin tables)

#### Admin Role (Frontend - Admin Panel)
```
Key: SUPABASE_ANON_KEY (with admin session)
Access: Full access to admin tables
Use: Admin panel operations
Tables: users, security_alerts + all authenticated access
Verification: role='admin' in JWT claims
```

**Where used:**
- Admin CRUD pages
- User management
- System configuration

### Policy Examples

#### Students Table Policies
```sql
-- Service role: full access
CREATE POLICY "Service role full access"
ON students FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Anon: read active students for login
CREATE POLICY "Anon read active students"
ON students FOR SELECT TO anon
USING (status = 'active');

-- Authenticated: read all students
CREATE POLICY "Authenticated read students"
ON students FOR SELECT TO authenticated
USING (true);
```

#### Users Table Policies
```sql
-- Service role: full access
CREATE POLICY "Service role full access"
ON users FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Authenticated admins: read users
CREATE POLICY "Admins read users"
ON users FOR SELECT TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```

### Key Concepts

**RLS (Row Level Security):**
- Controls which rows a user can see/modify
- Applied BEFORE queries run
- Based on user's role and JWT claims

**Service Role:**
- Special role that bypasses ALL RLS
- Use ONLY in backend/server code
- NEVER expose this key to frontend
- Stored in environment variables

**Anon Key:**
- Public key for unauthenticated users
- RLS applies strictly
- Safe to use in frontend code
- Limited to what policies allow

**Authenticated:**
- Users with valid session/JWT
- More access than anon
- Still restricted by RLS policies
- Role stored in JWT claims

---

## 🎉 Migration Complete!

If all verification checks pass, your database is now:

✅ Fully reset and reorganized
✅ Secured with RLS on all tables
✅ Optimized with proper indexes
✅ Automated with triggers
✅ Ready for frontend updates

**Tables:** 11 core tables (users, teachers, students, sections, subjects, teaching_loads, attendance, iot_devices, entrance_logs, account_retrievals, sms_logs)

**Next Step:** Read `FRONTEND_GUIDE.md` to adapt your frontend pages to the new schema.

---

**Last Updated:** November 24, 2025
**Version:** 1.0
**Status:** Production Ready

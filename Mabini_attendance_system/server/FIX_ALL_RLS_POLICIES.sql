-- =====================================================
-- COMPREHENSIVE RLS FIX - Allow admin full CRUD access
-- =====================================================
-- This fixes all "row-level security policy" errors
-- by giving authenticated admins full access to all tables
-- =====================================================

-- =====================================================
-- 1. USERS TABLE - Full access for authenticated users
-- =====================================================
DROP POLICY IF EXISTS "Service role full access on users" ON users;
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users full access on users" ON users;

CREATE POLICY "Authenticated users full access on users"
ON users FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on users"
ON users FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =====================================================
-- 2. TEACHERS TABLE - Full access for authenticated
-- =====================================================
DROP POLICY IF EXISTS "Service role full access on teachers" ON teachers;
DROP POLICY IF EXISTS "Public read active teachers for login" ON teachers;
DROP POLICY IF EXISTS "Authenticated read teachers" ON teachers;
DROP POLICY IF EXISTS "Authenticated full access on teachers" ON teachers;

CREATE POLICY "Authenticated full access on teachers"
ON teachers FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on teachers"
ON teachers FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =====================================================
-- 3. STUDENTS TABLE - Full access for authenticated
-- =====================================================
DROP POLICY IF EXISTS "Service role full access on students" ON students;
DROP POLICY IF EXISTS "Public read active students for login" ON students;
DROP POLICY IF EXISTS "Authenticated read students" ON students;
DROP POLICY IF EXISTS "Authenticated full access on students" ON students;

CREATE POLICY "Authenticated full access on students"
ON students FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on students"
ON students FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =====================================================
-- 4. SECTIONS TABLE - Full access for authenticated
-- =====================================================
DROP POLICY IF EXISTS "Service role full access on sections" ON sections;
DROP POLICY IF EXISTS "Public read sections" ON sections;
DROP POLICY IF EXISTS "Authenticated full access on sections" ON sections;

CREATE POLICY "Authenticated full access on sections"
ON sections FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on sections"
ON sections FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =====================================================
-- 5. SUBJECTS TABLE - Full access for authenticated
-- =====================================================
DROP POLICY IF EXISTS "Service role full access on subjects" ON subjects;
DROP POLICY IF EXISTS "Public read subjects" ON subjects;
DROP POLICY IF EXISTS "Authenticated full access on subjects" ON subjects;

CREATE POLICY "Authenticated full access on subjects"
ON subjects FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on subjects"
ON subjects FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =====================================================
-- 6. TEACHING_LOADS TABLE - Full access for authenticated
-- =====================================================
DROP POLICY IF EXISTS "Service role full access on teaching_loads" ON teaching_loads;
DROP POLICY IF EXISTS "Public read teaching_loads" ON teaching_loads;
DROP POLICY IF EXISTS "Authenticated read teaching_loads" ON teaching_loads;
DROP POLICY IF EXISTS "Authenticated full access on teaching_loads" ON teaching_loads;

CREATE POLICY "Authenticated full access on teaching_loads"
ON teaching_loads FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on teaching_loads"
ON teaching_loads FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =====================================================
-- 7. ATTENDANCE TABLE - Full access for authenticated
-- =====================================================
DROP POLICY IF EXISTS "Service role full access on attendance" ON attendance;
DROP POLICY IF EXISTS "Public insert attendance" ON attendance;
DROP POLICY IF EXISTS "Authenticated read attendance" ON attendance;
DROP POLICY IF EXISTS "Authenticated full access on attendance" ON attendance;

CREATE POLICY "Authenticated full access on attendance"
ON attendance FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on attendance"
ON attendance FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =====================================================
-- 8. IOT_DEVICES TABLE - Full access for authenticated
-- =====================================================
DROP POLICY IF EXISTS "Service role full access on iot_devices" ON iot_devices;
DROP POLICY IF EXISTS "Public read iot_devices" ON iot_devices;
DROP POLICY IF EXISTS "Authenticated full access on iot_devices" ON iot_devices;

CREATE POLICY "Authenticated full access on iot_devices"
ON iot_devices FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on iot_devices"
ON iot_devices FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =====================================================
-- 9. ENTRANCE_LOGS TABLE - Full access for authenticated
-- =====================================================
DROP POLICY IF EXISTS "Service role full access on entrance_logs" ON entrance_logs;
DROP POLICY IF EXISTS "Public insert entrance_logs" ON entrance_logs;
DROP POLICY IF EXISTS "Authenticated read entrance_logs" ON entrance_logs;
DROP POLICY IF EXISTS "Authenticated full access on entrance_logs" ON entrance_logs;

CREATE POLICY "Authenticated full access on entrance_logs"
ON entrance_logs FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on entrance_logs"
ON entrance_logs FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =====================================================
-- 10. ACCOUNT_RETRIEVALS TABLE - Full access for authenticated
-- =====================================================
DROP POLICY IF EXISTS "Service role full access on account_retrievals" ON account_retrievals;
DROP POLICY IF EXISTS "Public insert account_retrievals" ON account_retrievals;
DROP POLICY IF EXISTS "Authenticated full access on account_retrievals" ON account_retrievals;

CREATE POLICY "Authenticated full access on account_retrievals"
ON account_retrievals FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on account_retrievals"
ON account_retrievals FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =====================================================
-- 11. SMS_LOGS TABLE - Full access for authenticated
-- =====================================================
DROP POLICY IF EXISTS "Service role full access on sms_logs" ON sms_logs;
DROP POLICY IF EXISTS "Authenticated read sms_logs" ON sms_logs;
DROP POLICY IF EXISTS "Authenticated full access on sms_logs" ON sms_logs;

CREATE POLICY "Authenticated full access on sms_logs"
ON sms_logs FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on sms_logs"
ON sms_logs FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =====================================================
-- VERIFY ALL POLICIES
-- =====================================================
SELECT 
    tablename,
    policyname,
    cmd,
    roles,
    CASE 
        WHEN qual = 'true' AND with_check = 'true' THEN '✅ Full Access'
        WHEN qual = 'true' THEN '✅ Read Access'
        ELSE '⚠️ Restricted'
    END as access_level
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- SUCCESS! All tables now allow authenticated users full CRUD access
-- Refresh your admin pages and try the operations again
-- =====================================================

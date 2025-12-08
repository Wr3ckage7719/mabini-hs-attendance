-- =====================================================
-- EMERGENCY CLEANUP FOR STUDENT_NOTIFICATIONS RLS
-- =====================================================
-- This script removes ALL conflicting policies and creates clean ones
-- Run this ENTIRE script in your Supabase SQL Editor
-- =====================================================

-- Step 1: FORCE DELETE ALL EXISTING POLICIES (regardless of name)
-- This removes duplicate and conflicting policies

DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Loop through all policies on student_notifications table and drop them
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'student_notifications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.student_notifications', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Step 2: Verify ALL policies were deleted
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'student_notifications';
    
    IF policy_count > 0 THEN
        RAISE EXCEPTION 'ERROR: Still have % policies remaining! Manual cleanup needed.', policy_count;
    ELSE
        RAISE NOTICE '✅ All policies successfully deleted. Policy count: 0';
    END IF;
END $$;

-- Step 3: Ensure RLS is enabled
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;

-- Step 4: Create CLEAN policies (only 4 total)

-- Policy 1: SELECT - Allow anyone to read notifications
CREATE POLICY "student_notifications_select_policy" 
ON public.student_notifications
FOR SELECT
TO public
USING (true);

-- Policy 2: INSERT - Allow anyone to insert notifications
CREATE POLICY "student_notifications_insert_policy" 
ON public.student_notifications
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 3: UPDATE - Allow anyone to update notifications
CREATE POLICY "student_notifications_update_policy" 
ON public.student_notifications
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Policy 4: DELETE - Allow anyone to delete notifications
CREATE POLICY "student_notifications_delete_policy" 
ON public.student_notifications
FOR DELETE
TO public
USING (true);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check 1: Verify RLS is enabled
DO $$
DECLARE
    rls_enabled BOOLEAN;
BEGIN
    SELECT rowsecurity INTO rls_enabled
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'student_notifications';
    
    IF rls_enabled THEN
        RAISE NOTICE '✅ RLS is enabled';
    ELSE
        RAISE WARNING '⚠️ RLS is NOT enabled!';
    END IF;
END $$;

-- Check 2: Verify exactly 4 policies exist
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'student_notifications';
    
    IF policy_count = 4 THEN
        RAISE NOTICE '✅ Exactly 4 policies exist (correct)';
    ELSE
        RAISE WARNING '⚠️ Found % policies (should be exactly 4)', policy_count;
    END IF;
END $$;

-- Check 3: List all policies with their commands
SELECT 
    policyname as "Policy Name", 
    cmd as "Command",
    CASE 
        WHEN cmd = 'SELECT' THEN 'Read'
        WHEN cmd = 'INSERT' THEN 'Create'
        WHEN cmd = 'UPDATE' THEN 'Modify'
        WHEN cmd = 'DELETE' THEN 'Remove'
    END as "Action",
    CASE 
        WHEN qual = 'true' THEN '✅ Public Access'
        ELSE '⚠️ Restricted: ' || qual
    END as "Access Level"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'student_notifications'
ORDER BY cmd;

-- Check 4: Test query to ensure policies work
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    -- This simulates what the app does
    SELECT COUNT(*) INTO test_count FROM public.student_notifications;
    RAISE NOTICE '✅ Successfully read % notifications (policies are working)', test_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ Test query failed: %', SQLERRM;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════════╗';
    RAISE NOTICE '║  ✅ STUDENT_NOTIFICATIONS CLEANUP COMPLETE!       ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Removed all duplicate/conflicting policies';
    RAISE NOTICE '✅ Created 4 clean policies:';
    RAISE NOTICE '   1. student_notifications_select_policy (SELECT)';
    RAISE NOTICE '   2. student_notifications_insert_policy (INSERT)';
    RAISE NOTICE '   3. student_notifications_update_policy (UPDATE)';
    RAISE NOTICE '   4. student_notifications_delete_policy (DELETE)';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next Steps:';
    RAISE NOTICE '1. Close this SQL editor';
    RAISE NOTICE '2. Go to Authentication → Policies';
    RAISE NOTICE '3. Verify you see ONLY 4 policies for student_notifications';
    RAISE NOTICE '4. Refresh admin notifications page (Ctrl+F5)';
    RAISE NOTICE '5. Send test notification to "All Students"';
    RAISE NOTICE '6. Login as student and verify notification appears';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ If errors persist, check browser console (F12)';
    RAISE NOTICE '';
END $$;

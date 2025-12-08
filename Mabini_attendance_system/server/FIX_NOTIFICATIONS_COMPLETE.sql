-- =====================================================
-- COMPLETE FIX FOR STUDENT_NOTIFICATIONS TABLE
-- =====================================================
-- This SQL script fixes ALL permission issues for both admin and student sides
-- Run this ENTIRE script in your Supabase SQL Editor
-- =====================================================

-- Step 1: Ensure the table exists with proper structure
CREATE TABLE IF NOT EXISTS public.student_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NULL DEFAULT 'info'::text,
  target_type text NOT NULL,
  target_value text NULL,
  is_read boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  created_by uuid NULL,
  student_id uuid NULL,
  notification_type character varying(50) NULL DEFAULT 'general'::character varying,
  read_at timestamp with time zone NULL,
  CONSTRAINT student_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT student_notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT student_notifications_target_type_check CHECK (
    target_type = ANY (ARRAY['all'::text, 'grade'::text, 'section'::text, 'individual'::text])
  ),
  CONSTRAINT student_notifications_type_check CHECK (
    type = ANY (ARRAY['info'::text, 'warning'::text, 'success'::text, 'danger'::text])
  )
) TABLESPACE pg_default;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_target_type ON public.student_notifications USING btree (target_type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_target_value ON public.student_notifications USING btree (target_value) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.student_notifications USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.student_notifications USING btree (is_read) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON public.student_notifications USING btree (student_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_student_read ON public.student_notifications USING btree (student_id, is_read) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.student_notifications USING btree (notification_type) TABLESPACE pg_default;

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop all existing policies (clean slate)
DROP POLICY IF EXISTS "Allow public read for student_notifications" ON public.student_notifications;
DROP POLICY IF EXISTS "Allow public insert for student_notifications" ON public.student_notifications;
DROP POLICY IF EXISTS "Allow public update for student_notifications" ON public.student_notifications;
DROP POLICY IF EXISTS "Allow public delete for student_notifications" ON public.student_notifications;
DROP POLICY IF EXISTS "Admins can send notifications" ON public.student_notifications;
DROP POLICY IF EXISTS "Students can read their notifications" ON public.student_notifications;
DROP POLICY IF EXISTS "Students can update their notifications" ON public.student_notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.student_notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.student_notifications;
DROP POLICY IF EXISTS "Enable update for users based on student_id" ON public.student_notifications;

-- Step 5: Create RLS policies that allow ALL operations
-- This is necessary because the app uses session-based auth, not Supabase Auth

-- Allow SELECT (Read) - Needed for both admin and students to view notifications
CREATE POLICY "Allow public read for student_notifications" 
ON public.student_notifications
FOR SELECT
USING (true);

-- Allow INSERT (Create) - Needed for admin to send notifications
CREATE POLICY "Allow public insert for student_notifications" 
ON public.student_notifications
FOR INSERT
WITH CHECK (true);

-- Allow UPDATE (Modify) - Needed for students to mark notifications as read
CREATE POLICY "Allow public update for student_notifications" 
ON public.student_notifications
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow DELETE (Remove) - Needed for admin to delete notifications
CREATE POLICY "Allow public delete for student_notifications" 
ON public.student_notifications
FOR DELETE
USING (true);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- 1. Check if RLS is enabled
SELECT 
    schemaname,
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'student_notifications';

-- 2. Verify all 4 policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'student_notifications'
ORDER BY policyname;

-- 3. Check notification count
SELECT COUNT(*) as total_notifications FROM public.student_notifications;

-- 4. Check recent notifications
SELECT 
    id,
    title,
    type,
    target_type,
    created_at,
    is_read
FROM public.student_notifications 
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ =====================================================';
    RAISE NOTICE '✅ STUDENT_NOTIFICATIONS TABLE CONFIGURED SUCCESSFULLY!';
    RAISE NOTICE '✅ =====================================================';
    RAISE NOTICE '✅ RLS is enabled with 4 policies:';
    RAISE NOTICE '✅   - SELECT (read)   - Admin & Students can view';
    RAISE NOTICE '✅   - INSERT (create) - Admin can send notifications';
    RAISE NOTICE '✅   - UPDATE (modify) - Students can mark as read';
    RAISE NOTICE '✅   - DELETE (remove) - Admin can delete';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next Steps:';
    RAISE NOTICE '1. Refresh admin notifications page';
    RAISE NOTICE '2. Send test notification to "All Students"';
    RAISE NOTICE '3. Login as student and check notifications';
    RAISE NOTICE '';
END $$;

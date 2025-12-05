-- =====================================================
-- ADD MISSING COLUMNS TO TEACHERS AND TEACHING_LOADS
-- =====================================================

-- 1. Add qr_code_url column to teachers table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teachers' 
        AND column_name = 'qr_code_url'
    ) THEN
        ALTER TABLE public.teachers 
        ADD COLUMN qr_code_url TEXT;
        
        COMMENT ON COLUMN public.teachers.qr_code_url IS 'URL to QR code image in Supabase Storage';
    END IF;
END $$;

-- 2. Add day_of_week column to teaching_loads table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teaching_loads' 
        AND column_name = 'day_of_week'
    ) THEN
        ALTER TABLE public.teaching_loads 
        ADD COLUMN day_of_week VARCHAR(20);
        
        COMMENT ON COLUMN public.teaching_loads.day_of_week IS 'Day of the week for the class (e.g., Monday, Tuesday)';
    END IF;
END $$;

-- 3. Add start_time column to teaching_loads table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teaching_loads' 
        AND column_name = 'start_time'
    ) THEN
        ALTER TABLE public.teaching_loads 
        ADD COLUMN start_time TIME;
        
        COMMENT ON COLUMN public.teaching_loads.start_time IS 'Start time of the class period';
    END IF;
END $$;

-- 4. Add end_time column to teaching_loads table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teaching_loads' 
        AND column_name = 'end_time'
    ) THEN
        ALTER TABLE public.teaching_loads 
        ADD COLUMN end_time TIME;
        
        COMMENT ON COLUMN public.teaching_loads.end_time IS 'End time of the class period';
    END IF;
END $$;

-- 5. Update existing teaching loads with sample data (optional - for testing)
-- You can customize this based on your school schedule
UPDATE public.teaching_loads
SET 
    day_of_week = 'N/A',
    start_time = NULL,
    end_time = NULL
WHERE day_of_week IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Successfully added missing columns to teachers and teaching_loads tables';
END $$;

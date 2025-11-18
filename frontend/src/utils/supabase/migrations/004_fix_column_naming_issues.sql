-- Migration: Fix column naming inconsistencies
-- This migration fixes misspelled column names and ensures consistency

DO $$ 
BEGIN
    -- Check if knowledgebas_ids column exists and rename it to trained_data_ids
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'knowledgebas_ids') THEN
        -- First, ensure trained_data_ids doesn't already exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'trained_data_ids') THEN
            -- Rename the misspelled column
            ALTER TABLE public.user_profile RENAME COLUMN knowledgebas_ids TO trained_data_ids;
            RAISE NOTICE 'Renamed knowledgebas_ids to trained_data_ids';
        ELSE
            -- If trained_data_ids already exists, drop the misspelled one
            ALTER TABLE public.user_profile DROP COLUMN knowledgebas_ids;
            RAISE NOTICE 'Dropped duplicate knowledgebas_ids column';
        END IF;
    ELSE
        RAISE NOTICE 'knowledgebas_ids column does not exist, no action needed';
    END IF;
    
    -- Ensure trained_data_ids has the correct type and default
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'trained_data_ids') THEN
        -- Update the column to have the correct default if it's NULL
        UPDATE public.user_profile 
        SET trained_data_ids = '{}'::jsonb 
        WHERE trained_data_ids IS NULL;
        
        RAISE NOTICE 'Updated trained_data_ids defaults';
    END IF;
    
    -- Ensure providers column exists and has correct type (TEXT[] instead of ARRAY)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'providers') THEN
        ALTER TABLE public.user_profile ADD COLUMN providers TEXT[];
        RAISE NOTICE 'Added providers column as TEXT[]';
    END IF;
    
    -- Ensure data column exists in user_profile (if referenced anywhere)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'data') THEN
        ALTER TABLE public.user_profile ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added data column to user_profile';
    END IF;

END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.user_profile.trained_data_ids IS 'JSONB containing IDs of knowledge bases and training data associated with user';
COMMENT ON COLUMN public.user_profile.providers IS 'Array of provider identifiers associated with user';
COMMENT ON COLUMN public.user_profile.data IS 'Additional user data stored as JSONB';

RAISE NOTICE 'Migration 004: Fixed column naming inconsistencies completed successfully'; 
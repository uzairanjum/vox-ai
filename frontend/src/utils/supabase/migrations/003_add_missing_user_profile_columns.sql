-- Migration: Add missing columns to user_profile table
-- This migration adds all the missing columns that are causing errors in production

-- Add missing columns to user_profile table
DO $$ 
BEGIN
    -- Add preferences column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'preferences') THEN
        ALTER TABLE public.user_profile ADD COLUMN preferences JSONB DEFAULT '{
            "theme": "system",
            "language": "en",
            "notifications": {
                "email": true,
                "push": true,
                "marketing": false
            },
            "privacy": {
                "profile_visibility": "public",
                "show_email": false,
                "show_phone": false
            },
            "ai_global_settings": {
                "default_agent_id": null,
                "use_global_agents": false,
                "conversation_starters_enabled": true,
                "new_conversation_behavior": "greeting"
            }
        }'::jsonb;
        
        RAISE NOTICE 'Added preferences column to user_profile table';
    ELSE
        RAISE NOTICE 'preferences column already exists in user_profile table';
    END IF;
    
    -- Add first_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'first_name') THEN
        ALTER TABLE public.user_profile ADD COLUMN first_name TEXT DEFAULT ''::text;
        RAISE NOTICE 'Added first_name column to user_profile table';
    END IF;
    
    -- Add last_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'last_name') THEN
        ALTER TABLE public.user_profile ADD COLUMN last_name TEXT DEFAULT ''::text;
        RAISE NOTICE 'Added last_name column to user_profile table';
    END IF;
    
    -- Add display_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'display_name') THEN
        ALTER TABLE public.user_profile ADD COLUMN display_name TEXT DEFAULT ''::text;
        RAISE NOTICE 'Added display_name column to user_profile table';
    END IF;
    
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'phone') THEN
        ALTER TABLE public.user_profile ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column to user_profile table';
    END IF;
    
    -- Add website column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'website') THEN
        ALTER TABLE public.user_profile ADD COLUMN website TEXT;
        RAISE NOTICE 'Added website column to user_profile table';
    END IF;
    
    -- Add bio column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'bio') THEN
        ALTER TABLE public.user_profile ADD COLUMN bio TEXT;
        RAISE NOTICE 'Added bio column to user_profile table';
    END IF;
    
    -- Add location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'location') THEN
        ALTER TABLE public.user_profile ADD COLUMN location TEXT;
        RAISE NOTICE 'Added location column to user_profile table';
    END IF;
    
    -- Add timezone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'timezone') THEN
        ALTER TABLE public.user_profile ADD COLUMN timezone TEXT DEFAULT 'UTC';
        RAISE NOTICE 'Added timezone column to user_profile table';
    END IF;
    
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.user_profile ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to user_profile table';
    END IF;
    
    -- Add cover_image_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'cover_image_url') THEN
        ALTER TABLE public.user_profile ADD COLUMN cover_image_url TEXT;
        RAISE NOTICE 'Added cover_image_url column to user_profile table';
    END IF;
    
    -- Add trained_data_ids column if it doesn't exist (renamed from knowledgebas_ids)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'trained_data_ids') THEN
        ALTER TABLE public.user_profile ADD COLUMN trained_data_ids JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added trained_data_ids column to user_profile table';
    END IF;
    
    -- Add profile_completed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'profile_completed') THEN
        ALTER TABLE public.user_profile ADD COLUMN profile_completed BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added profile_completed column to user_profile table';
    END IF;
    
    -- Add onboarding_completed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE public.user_profile ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added onboarding_completed column to user_profile table';
    END IF;
    
    -- Add last_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'last_active') THEN
        ALTER TABLE public.user_profile ADD COLUMN last_active TIMESTAMPTZ DEFAULT now();
        RAISE NOTICE 'Added last_active column to user_profile table';
    END IF;

END $$;

-- Update existing users to have default preferences with AI settings
UPDATE public.user_profile 
SET preferences = COALESCE(preferences, '{}'::jsonb) || '{
    "ai_global_settings": {
        "default_agent_id": null,
        "use_global_agents": false,
        "conversation_starters_enabled": true,
        "new_conversation_behavior": "greeting"
    }
}'::jsonb
WHERE preferences IS NULL OR NOT (preferences ? 'ai_global_settings');

-- Add comment to document the migration
COMMENT ON COLUMN public.user_profile.preferences IS 'User preferences including theme, notifications, privacy, and AI global settings';

-- Create index on preferences for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profile_preferences_ai_settings 
ON public.user_profile USING GIN ((preferences->'ai_global_settings'));

RAISE NOTICE 'Migration 003: Added missing user_profile columns completed successfully'; 
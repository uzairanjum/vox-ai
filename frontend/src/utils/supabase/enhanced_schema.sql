-- Enhanced User Profile Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enhanced User Profile Table
CREATE TABLE IF NOT EXISTS public.user_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    user_id_auth UUID REFERENCES auth.users(id),
    
    -- Basic Info
    user_name TEXT DEFAULT ''::text NOT NULL,
    first_name TEXT DEFAULT ''::text,
    last_name TEXT DEFAULT ''::text,
    display_name TEXT DEFAULT ''::text,
    
    -- Contact Info
    phone TEXT,
    website TEXT,
    bio TEXT,
    location TEXT,
    timezone TEXT DEFAULT 'UTC',
    
    -- Profile Media
    avatar_url TEXT,
    cover_image_url TEXT,
    
    -- User Preferences
    preferences JSONB DEFAULT '{
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
        }
    }'::jsonb,
    
    -- System Fields
    providers TEXT[], -- Array of provider IDs
    trained_data_ids JSONB DEFAULT '{}'::jsonb,
    
    -- Profile Completion
    profile_completed BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false,
    last_active TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT user_profile_user_id_auth_key UNIQUE (user_id_auth)
);

-- Add RLS policies for user_profile
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.user_profile
    FOR SELECT
    USING (auth.uid() = user_id_auth);

CREATE POLICY "Users can update own profile"
    ON public.user_profile
    FOR UPDATE
    USING (auth.uid() = user_id_auth);

CREATE POLICY "Users can view public profiles"
    ON public.user_profile
    FOR SELECT
    USING (
        preferences->>'privacy'->>'profile_visibility' = 'public' OR
        auth.uid() = user_id_auth
    );

-- User Sessions Table (for tracking user activity)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id),
    session_data JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMPTZ DEFAULT now()
);

-- Migration script to add new columns to existing user_profile table
DO $$ 
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'first_name') THEN
        ALTER TABLE public.user_profile ADD COLUMN first_name TEXT DEFAULT ''::text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'last_name') THEN
        ALTER TABLE public.user_profile ADD COLUMN last_name TEXT DEFAULT ''::text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'display_name') THEN
        ALTER TABLE public.user_profile ADD COLUMN display_name TEXT DEFAULT ''::text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'phone') THEN
        ALTER TABLE public.user_profile ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'website') THEN
        ALTER TABLE public.user_profile ADD COLUMN website TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'bio') THEN
        ALTER TABLE public.user_profile ADD COLUMN bio TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'location') THEN
        ALTER TABLE public.user_profile ADD COLUMN location TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'timezone') THEN
        ALTER TABLE public.user_profile ADD COLUMN timezone TEXT DEFAULT 'UTC';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.user_profile ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'cover_image_url') THEN
        ALTER TABLE public.user_profile ADD COLUMN cover_image_url TEXT;
    END IF;
    
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
            }
        }'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'trained_data_ids') THEN
        ALTER TABLE public.user_profile ADD COLUMN trained_data_ids JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'profile_completed') THEN
        ALTER TABLE public.user_profile ADD COLUMN profile_completed BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE public.user_profile ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'last_active') THEN
        ALTER TABLE public.user_profile ADD COLUMN last_active TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- Function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_profile 
    SET last_active = now()
    WHERE user_id_auth = auth.uid();
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create additional indexes for new fields
CREATE INDEX IF NOT EXISTS idx_user_profile_display_name ON public.user_profile(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profile_user_name ON public.user_profile(user_name);
CREATE INDEX IF NOT EXISTS idx_user_profile_last_active ON public.user_profile(last_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity);

-- GIN index for JSONB preferences searches
CREATE INDEX IF NOT EXISTS idx_user_profile_preferences ON public.user_profile USING GIN (preferences);

-- Comments
COMMENT ON TABLE public.user_profile IS 'Enhanced user profile information with preferences and onboarding tracking';
COMMENT ON TABLE public.user_sessions IS 'Tracks user session activity and device information';

COMMENT ON COLUMN public.user_profile.preferences IS 'JSON object storing user preferences for theme, notifications, privacy';
COMMENT ON COLUMN public.user_profile.profile_completed IS 'Whether user has completed their profile setup';
COMMENT ON COLUMN public.user_profile.onboarding_completed IS 'Whether user has completed the onboarding flow'; 
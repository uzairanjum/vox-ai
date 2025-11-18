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

-- Provider Data Table
CREATE TABLE IF NOT EXISTS public.provider_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    provider_id_ref UUID REFERENCES public.user_profile(id),
    auth_provider_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    type NUMERIC NOT NULL,
    token TEXT NOT NULL,
    refresh TEXT,
    expires TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT provider_data_name_provider_unique UNIQUE (name, provider_id_ref)
);

-- Add RLS policies for provider_data
ALTER TABLE public.provider_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own provider data"
    ON public.provider_data
    FOR SELECT
    USING (auth.uid() = auth_provider_id);

CREATE POLICY "Users can update own provider data"
    ON public.provider_data
    FOR UPDATE
    USING (auth.uid() = auth_provider_id);

CREATE POLICY "Users can insert own provider data"
    ON public.provider_data
    FOR INSERT
    WITH CHECK (auth.uid() = auth_provider_id);

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

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profile_updated_at
    BEFORE UPDATE ON public.user_profile
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id_auth ON public.user_profile(user_id_auth);
CREATE INDEX IF NOT EXISTS idx_user_profile_display_name ON public.user_profile(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profile_user_name ON public.user_profile(user_name);
CREATE INDEX IF NOT EXISTS idx_user_profile_last_active ON public.user_profile(last_active);
CREATE INDEX IF NOT EXISTS idx_provider_data_provider_id ON public.provider_data(provider_id_ref);
CREATE INDEX IF NOT EXISTS idx_provider_data_auth_id ON public.provider_data(auth_provider_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity);

-- GIN index for JSONB preferences searches
CREATE INDEX IF NOT EXISTS idx_user_profile_preferences ON public.user_profile USING GIN (preferences);

-- Comments
COMMENT ON TABLE public.user_profile IS 'Enhanced user profile information with preferences and onboarding tracking';
COMMENT ON TABLE public.provider_data IS 'Stores provider-specific data like tokens and configurations';
COMMENT ON TABLE public.user_sessions IS 'Tracks user session activity and device information';

COMMENT ON COLUMN public.user_profile.providers IS 'Array of provider IDs associated with the user';
COMMENT ON COLUMN public.user_profile.preferences IS 'JSON object storing user preferences for theme, notifications, privacy';
COMMENT ON COLUMN public.user_profile.profile_completed IS 'Whether user has completed their profile setup';
COMMENT ON COLUMN public.user_profile.onboarding_completed IS 'Whether user has completed the onboarding flow';
COMMENT ON COLUMN public.provider_data.type IS 'Numeric identifier for provider type (e.g., 1 for GHL, 2 for Email)';
COMMENT ON COLUMN public.provider_data.data IS 'JSON data specific to each provider';

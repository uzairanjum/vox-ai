-- Create conversation metadata table for AI settings
CREATE TABLE IF NOT EXISTS public.conversation_meta_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Core conversation info
    conv_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id TEXT,
    name TEXT,
    
    -- Data classification
    data_type INTEGER DEFAULT 21, -- 21 = AI_SETTINGS
    
    -- JSON data for AI settings
    data JSONB DEFAULT '{}'::jsonb,
    
    -- Optional fields for compatibility
    lastMessageId TEXT,
    
    -- Constraints
    CONSTRAINT unique_conversation_user_type UNIQUE(conv_id, user_id, data_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_meta_conv_id ON public.conversation_meta_data(conv_id);
CREATE INDEX IF NOT EXISTS idx_conversation_meta_user_id ON public.conversation_meta_data(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_meta_data_type ON public.conversation_meta_data(data_type);
CREATE INDEX IF NOT EXISTS idx_conversation_meta_location_id ON public.conversation_meta_data(location_id);
CREATE INDEX IF NOT EXISTS idx_conversation_meta_updated_at ON public.conversation_meta_data(updated_at);

-- GIN index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_conversation_meta_data_gin ON public.conversation_meta_data USING GIN (data);

-- Enable RLS
ALTER TABLE public.conversation_meta_data ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own conversation metadata"
    ON public.conversation_meta_data
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_conversation_meta_updated_at
    BEFORE UPDATE ON public.conversation_meta_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.conversation_meta_data IS 'Stores conversation metadata including AI settings, agent assignments, and feature configurations';
COMMENT ON COLUMN public.conversation_meta_data.data_type IS 'Type of data stored: 21=AI_SETTINGS, 22=SUPPORT, 23=SALES, etc.';
COMMENT ON COLUMN public.conversation_meta_data.data IS 'JSON data containing AI agent assignments, knowledge base IDs, and feature settings'; 
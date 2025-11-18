-- Change providers column type from TEXT[] to JSONB
ALTER TABLE public.user_profile 
    ALTER COLUMN providers TYPE JSONB 
    USING COALESCE(
        CASE 
            WHEN providers IS NULL THEN '[]'::jsonb
            ELSE jsonb_build_array(providers)
        END,
        '[]'::jsonb
    );

-- Add comment explaining the change
COMMENT ON COLUMN public.user_profile.providers IS 'Array of provider objects stored as JSONB';
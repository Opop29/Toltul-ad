-- Add group fields to ar_pois table
ALTER TABLE public.ar_pois
ADD COLUMN IF NOT EXISTS group_name TEXT,
ADD COLUMN IF NOT EXISTS group_index INTEGER;

-- Update existing records to have null group fields
UPDATE public.ar_pois
SET group_name = NULL, group_index = NULL
WHERE group_name IS NULL AND group_index IS NULL;
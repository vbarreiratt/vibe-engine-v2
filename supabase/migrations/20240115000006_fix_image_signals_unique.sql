-- Fix unique constraint on image_signals to allow multiple runs per image
-- Formerly it was UNIQUE(image_id), preventing an image from being signaled in multiple runs.

-- Drop the old constraint
ALTER TABLE image_signals DROP CONSTRAINT IF EXISTS image_signals_image_id_key;

-- Add new composite constraint (image_id + run_id)
-- Note: run_id can be null in legacy data, but for new runs it should be populated.
-- If you want to allow only one "null run" per image, this works.
-- If you want to require run_id, you should enforce NOT NULL, but that requires data migration.
-- We will proceed with simple Unique(image_id, run_id).

ALTER TABLE image_signals 
ADD CONSTRAINT image_signals_image_id_run_id_key 
UNIQUE (image_id, run_id);

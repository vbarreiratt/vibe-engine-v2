-- Fix unique constraint on image_signals to allow multiple runs per image
-- Formerly it was UNIQUE(image_id), preventing an image from being signaled in multiple runs.

-- Drop the old constraint
ALTER TABLE image_signals DROP CONSTRAINT IF EXISTS image_signals_image_id_key;
ALTER TABLE image_signals DROP CONSTRAINT IF EXISTS image_signals_image_id_run_id_key;

ALTER TABLE image_signals 
ADD CONSTRAINT image_signals_image_id_run_id_key 
UNIQUE (image_id, run_id);

ALTER TABLE image_signals 
ADD COLUMN IF NOT EXISTS ai_description text,
ADD COLUMN IF NOT EXISTS raw_reasoning text,
ADD COLUMN IF NOT EXISTS model_name text,
ADD COLUMN IF NOT EXISTS run_id uuid,
ADD COLUMN IF NOT EXISTS generated_at timestamptz;

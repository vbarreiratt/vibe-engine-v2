ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_config jsonb DEFAULT '{}';

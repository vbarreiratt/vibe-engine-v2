-- FIX: Run these lines ONE BY ONE in Supabase SQL Editor if the block fails.

-- 1. Create Type (Ignore error if it says 'already exists')
CREATE TYPE cluster_node_status AS ENUM ('active', 'weak', 'pillar', 'removed');

-- 2. Add curation columns
ALTER TABLE cluster_nodes 
ADD COLUMN IF NOT EXISTS curation_status cluster_node_status DEFAULT 'active';

ALTER TABLE cluster_nodes 
ADD COLUMN IF NOT EXISTS curation_reason text;

-- 3. Add signal overrides
ALTER TABLE clusters 
ADD COLUMN IF NOT EXISTS signal_overrides JSONB DEFAULT '{}'::jsonb;

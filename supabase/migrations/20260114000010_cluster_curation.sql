-- Enable semantic curation for Cluster Editor V1-V3

-- 1. Create Enums if not exist
DO $$ BEGIN
    CREATE TYPE cluster_node_status AS ENUM ('active', 'weak', 'pillar', 'removed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add curation columns to Cluster Nodes (Level 2)
ALTER TABLE cluster_nodes 
ADD COLUMN IF NOT EXISTS curation_status cluster_node_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS curation_reason text;

-- 3. Add signal overrides to Clusters (Level 1)
-- Structure: { "state:chaos": "structural", "matter:plastic": "noise" }
ALTER TABLE clusters 
ADD COLUMN IF NOT EXISTS signal_overrides JSONB DEFAULT '{}'::jsonb;

-- 4. Trusted function to update signal overrides safely via RPC if needed, 
-- or we can just use standard update in Server Action.
-- Standard Update is fine for V1.

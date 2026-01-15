-- Add semantic fields for Synthesis Layer
ALTER TABLE clusters
ADD COLUMN IF NOT EXISTS synthesis_status text CHECK (synthesis_status IN ('territory', 'pillar', 'counterpoint', 'archive'));

-- Create Cluster Relations table
CREATE TABLE IF NOT EXISTS cluster_relations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_cluster_id uuid REFERENCES clusters(id) ON DELETE CASCADE NOT NULL,
  target_cluster_id uuid REFERENCES clusters(id) ON DELETE CASCADE NOT NULL,
  relation_type text CHECK (relation_type IN ('resonance', 'opposition', 'tension', 'support')) NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(source_cluster_id, target_cluster_id)
);

-- RLS
ALTER TABLE cluster_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relations of their projects"
  ON cluster_relations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clusters c
      JOIN clusters_runs cr ON c.clusters_run_id = cr.id
      JOIN projects p ON cr.project_id = p.id
      WHERE c.id = cluster_relations.source_cluster_id
      AND (
        p.owner_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "Users can manage relations of their projects"
  ON cluster_relations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clusters c
      JOIN clusters_runs cr ON c.clusters_run_id = cr.id
      JOIN projects p ON cr.project_id = p.id
      WHERE c.id = cluster_relations.source_cluster_id
      AND (
        p.owner_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      )
    )
  );

-- Create signals_runs table
CREATE TABLE IF NOT EXISTS signals_runs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
    curator_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'private',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE signals_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for signals_runs
CREATE POLICY "Project members can view signals_runs"
    ON signals_runs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = signals_runs.project_id
            AND project_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can create signals_runs"
    ON signals_runs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = signals_runs.project_id
            AND project_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can delete signals_runs"
    ON signals_runs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = signals_runs.project_id
            AND project_members.user_id = auth.uid()
        )
    );

-- Update image_signals to reference runs
-- First ensure run_id exists (added in previous step, but let's be safe)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'image_signals' AND column_name = 'run_id') THEN
        ALTER TABLE image_signals ADD COLUMN run_id UUID;
    END IF;
END $$;

-- Now add the foreign key constraint
ALTER TABLE image_signals 
    ADD CONSTRAINT image_signals_run_id_fkey 
    FOREIGN KEY (run_id) 
    REFERENCES signals_runs(id) 
    ON DELETE CASCADE;

-- We need to allow multiple signals per image if they belong to different runs
-- Check if there is a unique constraint on image_id and drop it if necessary to allow (image_id, run_id) unique
-- For now, let's assume we want to query signals by run_id predominantly.

CREATE INDEX IF NOT EXISTS idx_image_signals_run_id ON image_signals(run_id);

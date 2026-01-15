-- Fix RLS for signals_runs to include Project Owners

-- 1. Drop Old Policies (from initial creation)
DROP POLICY IF EXISTS "Project members can view signals_runs" ON signals_runs;
DROP POLICY IF EXISTS "Project members can create signals_runs" ON signals_runs;
DROP POLICY IF EXISTS "Project members can delete signals_runs" ON signals_runs;

-- 2. Drop New Policies (if this script is re-run)
DROP POLICY IF EXISTS "Project owners and members can view signals_runs" ON signals_runs;
DROP POLICY IF EXISTS "Project owners and members can insert signals_runs" ON signals_runs;
DROP POLICY IF EXISTS "Project owners and members can delete signals_runs" ON signals_runs;

-- 3. Create Correct Policies
CREATE POLICY "Project owners and members can view signals_runs"
    ON signals_runs FOR SELECT
    USING (
        auth.uid() IN (SELECT created_by FROM projects WHERE id = signals_runs.project_id)
        OR
        EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = signals_runs.project_id
            AND project_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Project owners and members can insert signals_runs"
    ON signals_runs FOR INSERT
    WITH CHECK (
        auth.uid() IN (SELECT created_by FROM projects WHERE id = signals_runs.project_id)
        OR
        EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = signals_runs.project_id
            AND project_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Project owners and members can delete signals_runs"
    ON signals_runs FOR DELETE
    USING (
        auth.uid() IN (SELECT created_by FROM projects WHERE id = signals_runs.project_id)
        OR
        EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = signals_runs.project_id
            AND project_members.user_id = auth.uid()
        )
    );

-- Fix RLS for image_signals to include Project Owners
DROP POLICY IF EXISTS "Members all signals" ON image_signals;
DROP POLICY IF EXISTS "Admins all signals" ON image_signals;
DROP POLICY IF EXISTS "Project owners and members all signals" ON image_signals; -- Idempotency

CREATE POLICY "Admins all signals" ON image_signals FOR ALL USING (is_admin());

CREATE POLICY "Project owners and members all signals"
    ON image_signals FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM images 
            JOIN projects ON projects.id = images.project_id
            WHERE images.id = image_signals.image_id
            AND (
                projects.created_by = auth.uid() 
                OR 
                EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid())
            )
        )
    );

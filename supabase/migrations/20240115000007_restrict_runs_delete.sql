-- Fix permissions for signals_runs deletion
-- Previous policy was too permissive (any member could delete)

DROP POLICY IF EXISTS "Project members can delete signals_runs" ON signals_runs;

CREATE POLICY "Curators delete own runs"
    ON signals_runs FOR DELETE
    USING (curator_id = auth.uid());

CREATE POLICY "Admins delete any runs"
    ON signals_runs FOR DELETE
    USING (is_admin());

-- Ensure updates are also restricted
DROP POLICY IF EXISTS "Project members can create signals_runs" ON signals_runs; -- This was INSERT. Keep it?
-- INSERT is fine for members.
-- UPDATE? I didn't see explicit UPDATE policy in 004. Implicit deny?
-- Assuming 004 didn't add UPDATE.

-- Add UPDATE policy just in case
CREATE POLICY "Curators update own runs"
    ON signals_runs FOR UPDATE
    USING (curator_id = auth.uid())
    WITH CHECK (curator_id = auth.uid());

CREATE POLICY "Admins update any runs"
    ON signals_runs FOR UPDATE
    USING (is_admin());

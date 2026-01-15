-- Fix Project Deletion Cascades
-- Ensure all tables referencing projects(id) have ON DELETE CASCADE

-- 1. audit_log
ALTER TABLE audit_log
    DROP CONSTRAINT IF EXISTS audit_log_project_id_fkey,
    ADD CONSTRAINT audit_log_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 2. profiles (not needed, project_members handles it)

-- 3. Ingestions (already has it in 20240114000002_add_ingestions.sql, but let's be sure)
ALTER TABLE ingestions
    DROP CONSTRAINT IF EXISTS ingestions_project_id_fkey,
    ADD CONSTRAINT ingestions_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 4. image_scan (already has it)
ALTER TABLE image_scan
    DROP CONSTRAINT IF EXISTS image_scan_project_id_fkey,
    ADD CONSTRAINT image_scan_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 5. image_signals doesn't have project_id? Let's check.
-- Actually images has it.

-- 6. scan_images uses image_id so it cascades from images.

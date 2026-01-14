-- Create scans table (Varreduras)
-- A scan is an editorial cut: a named selection of "vibra" images by a curator

CREATE TABLE IF NOT EXISTS scans (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    curator_id uuid REFERENCES profiles(user_id) ON DELETE SET NULL,
    name text NOT NULL,
    visibility text DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
    created_at timestamptz DEFAULT now()
);

-- Junction table for scan images
CREATE TABLE IF NOT EXISTS scan_images (
    scan_id uuid REFERENCES scans(id) ON DELETE CASCADE,
    image_id uuid REFERENCES images(id) ON DELETE CASCADE,
    PRIMARY KEY (scan_id, image_id)
);

-- Enable RLS
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_images ENABLE ROW LEVEL SECURITY;

-- Scans policies
DROP POLICY IF EXISTS "Admins full access scans" ON scans;
DROP POLICY IF EXISTS "Curators manage own scans" ON scans;
DROP POLICY IF EXISTS "Members read public scans" ON scans;

CREATE POLICY "Admins full access scans" ON scans FOR ALL USING (is_admin());
CREATE POLICY "Curators manage own scans" ON scans FOR ALL USING (curator_id = auth.uid());
CREATE POLICY "Members read public scans" ON scans FOR SELECT USING (
    visibility = 'public' AND is_project_member(project_id)
);

-- Scan images policies
DROP POLICY IF EXISTS "Admins full access scan_images" ON scan_images;
DROP POLICY IF EXISTS "Curators manage own scan_images" ON scan_images;
DROP POLICY IF EXISTS "Members read public scan_images" ON scan_images;

CREATE POLICY "Admins full access scan_images" ON scan_images FOR ALL USING (is_admin());
CREATE POLICY "Curators manage own scan_images" ON scan_images FOR ALL USING (
    EXISTS (SELECT 1 FROM scans WHERE scans.id = scan_images.scan_id AND scans.curator_id = auth.uid())
);
CREATE POLICY "Members read public scan_images" ON scan_images FOR SELECT USING (
    EXISTS (SELECT 1 FROM scans WHERE scans.id = scan_images.scan_id AND scans.visibility = 'public')
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_scans_project_id ON scans(project_id);
CREATE INDEX IF NOT EXISTS idx_scans_curator_id ON scans(curator_id);
CREATE INDEX IF NOT EXISTS idx_scan_images_scan_id ON scan_images(scan_id);

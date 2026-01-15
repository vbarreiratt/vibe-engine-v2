-- MIGRATION: Add Metrics and Score to Clusters
-- Enables the "Cognitive Force" visualization and detailed Breakdown.

-- 1. Cluster Metrics
alter table clusters 
add column if not exists strength_score float default 0,
add column if not exists metrics jsonb default '{}'::jsonb;

-- 2. AI Description for Images (Node Drawer)
alter table images
add column if not exists description_ai text;

-- Reload Schema Cache
NOTIFY pgrst, 'reload config';

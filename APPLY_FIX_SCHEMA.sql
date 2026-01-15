-- MIGRATION: Add Semantic Fields to Clusters
-- Run this in Supabase SQL Editor to enable the new "Speaking" Canvas features.

-- 1. Classification (STRONG, PROTO, NOISE, WEAK)
alter table clusters 
add column if not exists classification text default 'WEAK';

-- 2. Summary (The "State · Matter · Movement" signature)
alter table clusters 
add column if not exists summary text;

-- 3. Reload Schema Cache (Critical for PGRST204 error)
NOTIFY pgrst, 'reload config';

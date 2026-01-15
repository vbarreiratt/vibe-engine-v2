-- Fix FK constraints to allow user deletion

-- 1. Drop and recreate profiles FK with CASCADE
-- Note: Must first remove dependent FKs, then recreate

-- Update projects.created_by to allow NULL and SET NULL on delete
ALTER TABLE projects 
  DROP CONSTRAINT IF EXISTS projects_created_by_fkey,
  ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE projects 
  ADD CONSTRAINT projects_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Update images.created_by to allow NULL and SET NULL on delete
ALTER TABLE images 
  DROP CONSTRAINT IF EXISTS images_created_by_fkey,
  ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE images 
  ADD CONSTRAINT images_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Update image_scan.scanned_by to allow NULL and SET NULL on delete
ALTER TABLE image_scan 
  DROP CONSTRAINT IF EXISTS image_scan_scanned_by_fkey,
  ALTER COLUMN scanned_by DROP NOT NULL;
ALTER TABLE image_scan 
  ADD CONSTRAINT image_scan_scanned_by_fkey 
  FOREIGN KEY (scanned_by) REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Update image_signals.updated_by to allow NULL and SET NULL on delete
ALTER TABLE image_signals 
  DROP CONSTRAINT IF EXISTS image_signals_updated_by_fkey,
  ALTER COLUMN updated_by DROP NOT NULL;
ALTER TABLE image_signals 
  ADD CONSTRAINT image_signals_updated_by_fkey 
  FOREIGN KEY (updated_by) REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Update audit_log.actor_user_id to allow NULL and SET NULL on delete
ALTER TABLE audit_log 
  DROP CONSTRAINT IF EXISTS audit_log_actor_user_id_fkey,
  ALTER COLUMN actor_user_id DROP NOT NULL;
ALTER TABLE audit_log 
  ADD CONSTRAINT audit_log_actor_user_id_fkey 
  FOREIGN KEY (actor_user_id) REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Update ingestions.user_id to allow NULL and SET NULL on delete
ALTER TABLE ingestions 
  DROP CONSTRAINT IF EXISTS ingestions_user_id_fkey,
  ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE ingestions 
  ADD CONSTRAINT ingestions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Now update profiles FK to cascade from auth.users
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE profiles 
  ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix FK constraints to allow Cascade Delete on Projects

-- 1. Fix image_scan
alter table image_scan drop constraint if exists image_scan_project_id_fkey;

alter table image_scan
  add constraint image_scan_project_id_fkey
  foreign key (project_id)
  references projects(id)
  on delete cascade;

-- 2. Fix audit_log
alter table audit_log drop constraint if exists audit_log_project_id_fkey;

alter table audit_log
  add constraint audit_log_project_id_fkey
  foreign key (project_id)
  references projects(id)
  on delete cascade;

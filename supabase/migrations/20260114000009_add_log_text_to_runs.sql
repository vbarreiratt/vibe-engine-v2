
comment on table clusters_runs is 'Stores cluster runs with cognitive logging';

alter table clusters_runs 
add column if not exists log_text text;

alter table clusters_runs 
add column if not exists log_path text;

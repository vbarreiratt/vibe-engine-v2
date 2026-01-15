create table if not exists resonance_snapshots (
  id uuid default gen_random_uuid() primary key,
  run_id uuid references clusters_runs(id) on delete cascade not null,
  label text not null,
  kind text check (kind in ('base', 'version')) default 'version',
  graph_json jsonb not null,
  ui_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_resonance_snapshots_run_id on resonance_snapshots(run_id);

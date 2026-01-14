-- Enable moddatetime extension
create extension if not exists "moddatetime";

-- Drop legacy tables if they exist to allow re-creation with new schema
drop table if exists cluster_images cascade;
drop table if exists clusters cascade;

-- Create clusters_runs table
create table clusters_runs (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  scan_id uuid references scans(id) on delete cascade not null, -- Assumes scans table exists based on context, if not signals_runs parent
  signals_run_id uuid not null, -- Loose reference or FK if signals_runs exists
  created_by uuid references auth.users(id) on delete set null,
  name text not null,
  visibility text default 'private' check (visibility in ('public', 'private')),
  status text default 'queued' check (status in ('queued', 'running', 'ready', 'error')),
  embedding_model text,
  thresholds jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Extensions for graphs might be needed, but we store as nodes/edges
-- Create clusters table
create table clusters (
  id uuid default gen_random_uuid() primary key,
  clusters_run_id uuid references clusters_runs(id) on delete cascade not null,
  name_suggested text not null,
  name_final text,
  motor text check (motor in ('state', 'matter', 'movement')),
  description_suggested text,
  description_final text,
  created_at timestamptz default now() not null
);

-- Create cluster_nodes table
create table cluster_nodes (
  id uuid default gen_random_uuid() primary key,
  clusters_run_id uuid references clusters_runs(id) on delete cascade not null,
  image_id uuid references images(id) on delete cascade not null,
  cluster_id uuid references clusters(id) on delete set null,
  x float not null default 0,
  y float not null default 0,
  is_outlier boolean default false,
  is_bridge boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(clusters_run_id, image_id)
);

-- Create cluster_edges table
create table cluster_edges (
  id uuid default gen_random_uuid() primary key,
  clusters_run_id uuid references clusters_runs(id) on delete cascade not null,
  source_image_id uuid references images(id) on delete cascade not null,
  target_image_id uuid references images(id) on delete cascade not null,
  weight float not null default 0,
  layers jsonb, -- ["state", "matter"]
  shared_terms jsonb, -- ["tenso", "metalico"]
  created_at timestamptz default now() not null
);

-- Add updated_at trigger for clusters_runs
create trigger handle_updated_at_clusters_runs
  before update on clusters_runs
  for each row execute procedure moddatetime (updated_at);

-- Add updated_at trigger for cluster_nodes
create trigger handle_updated_at_cluster_nodes
  before update on cluster_nodes
  for each row execute procedure moddatetime (updated_at);


-- RLS Policies

-- Enable RLS
alter table clusters_runs enable row level security;
alter table clusters enable row level security;
alter table cluster_nodes enable row level security;
alter table cluster_edges enable row level security;

-- Policies for clusters_runs

-- Admins: View all
create policy "Admins can view all clusters_runs"
  on clusters_runs for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Admins: Manage all
create policy "Admins can insert clusters_runs"
  on clusters_runs for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can update clusters_runs"
  on clusters_runs for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can delete clusters_runs"
  on clusters_runs for delete
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Curators: View if member of project OR created_by them OR public
create policy "Curators can view clusters_runs"
  on clusters_runs for select
  to authenticated
  using (
    (
      exists (
        select 1 from project_members
        where project_members.project_id = clusters_runs.project_id
        and project_members.user_id = auth.uid()
      )
    )
    or
    (created_by = auth.uid())
    or
    (visibility = 'public')
  );

-- Curators: Insert if member of project
create policy "Curators can insert clusters_runs"
  on clusters_runs for insert
  to authenticated
  with check (
    exists (
      select 1 from project_members
      where project_members.project_id = clusters_runs.project_id
      and project_members.user_id = auth.uid()
    )
  );

-- Curators: Update if created_by them OR admin (admin handled above)
create policy "Curators can update own clusters_runs"
  on clusters_runs for update
  to authenticated
  using (
    created_by = auth.uid()
  );

-- Curators: Delete if created_by them
create policy "Curators can delete own clusters_runs"
  on clusters_runs for delete
  to authenticated
  using (
     created_by = auth.uid()
  );


-- Policies for clusters (inherit from clusters_run)
create policy "Users can view clusters if they can view clusters_run"
  on clusters for select to authenticated
  using (
    exists (
      select 1 from clusters_runs
      where clusters_runs.id = clusters.clusters_run_id
      and (
        -- logic duplicated for performance or use helper function?
        -- For simplicity, checking visibility or membership
        (clusters_runs.visibility = 'public')
        or
        (clusters_runs.created_by = auth.uid())
        or
        exists (
             select 1 from modules_permissions_check(clusters_runs.project_id) -- hypothetical helper
        )
        or
        -- Manual expansion of curator logic
        exists (
             select 1 from project_members
             where project_members.project_id = clusters_runs.project_id
             and project_members.user_id = auth.uid()
        )
        or
        exists (
           select 1 from profiles where id = auth.uid() and role = 'admin'
        )
      )
    )
  );
  
-- Simplified access for children tables: if you can view the parent run, you can view the children.
-- Admin/Owner write policies for children

-- CLUSTERS WRITE
create policy "Admins and Owners can insert clusters"
  on clusters for insert to authenticated
  with check (
     exists (
       select 1 from clusters_runs
       where clusters_runs.id = clusters.clusters_run_id
       and (
         clusters_runs.created_by = auth.uid()
         or
         exists (select 1 from profiles where id = auth.uid() and role = 'admin')
       )
     )
  );

create policy "Admins and Owners can update clusters"
  on clusters for update to authenticated
  using (
     exists (
       select 1 from clusters_runs
       where clusters_runs.id = clusters.clusters_run_id
       and (
         clusters_runs.created_by = auth.uid()
         or
         exists (select 1 from profiles where id = auth.uid() and role = 'admin')
       )
     )
  );
  
create policy "Admins and Owners can delete clusters"
  on clusters for delete to authenticated
  using (
     exists (
       select 1 from clusters_runs
       where clusters_runs.id = clusters.clusters_run_id
       and (
         clusters_runs.created_by = auth.uid()
         or
         exists (select 1 from profiles where id = auth.uid() and role = 'admin')
       )
     )
  );

-- CLUSTER_NODES (Read/Write similar to Clusters)
create policy "Users can view nodes if they can view clusters_run"
  on cluster_nodes for select to authenticated
  using (
    exists (
      select 1 from clusters_runs
      where clusters_runs.id = cluster_nodes.clusters_run_id
      and (
        clusters_runs.visibility = 'public'
        or clusters_runs.created_by = auth.uid()
        or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
        or exists (select 1 from project_members where project_id = clusters_runs.project_id and user_id = auth.uid())
      )
    )
  );

create policy "Admins and Owners can insert nodes"
  on cluster_nodes for insert to authenticated
  with check (
     exists (
       select 1 from clusters_runs
       where clusters_runs.id = cluster_nodes.clusters_run_id
       and (
         clusters_runs.created_by = auth.uid()
         or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
       )
     )
  );

create policy "Admins and Owners can update nodes"
  on cluster_nodes for update to authenticated
  using (
     exists (
       select 1 from clusters_runs
       where clusters_runs.id = cluster_nodes.clusters_run_id
       and (
         clusters_runs.created_by = auth.uid()
         or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
       )
     )
  );
  
create policy "Admins and Owners can delete nodes"
  on cluster_nodes for delete to authenticated
  using (
     exists (
       select 1 from clusters_runs
       where clusters_runs.id = cluster_nodes.clusters_run_id
       and (
         clusters_runs.created_by = auth.uid()
         or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
       )
     )
  );

-- CLUSTER_EDGES (Read/Write similar)
create policy "Users can view edges if they can view clusters_run"
  on cluster_edges for select to authenticated
  using (
    exists (
      select 1 from clusters_runs
      where clusters_runs.id = cluster_edges.clusters_run_id
      and (
        clusters_runs.visibility = 'public'
        or clusters_runs.created_by = auth.uid()
        or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
        or exists (select 1 from project_members where project_id = clusters_runs.project_id and user_id = auth.uid())
      )
    )
  );

create policy "Admins and Owners can insert edges"
  on cluster_edges for insert to authenticated
  with check (
     exists (
       select 1 from clusters_runs
       where clusters_runs.id = cluster_edges.clusters_run_id
       and (
         clusters_runs.created_by = auth.uid()
         or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
       )
     )
  );
  
create policy "Admins and Owners can update edges"
  on cluster_edges for update to authenticated
  using (
     exists (
       select 1 from clusters_runs
       where clusters_runs.id = cluster_edges.clusters_run_id
       and (
         clusters_runs.created_by = auth.uid()
         or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
       )
     )
  );

create policy "Admins and Owners can delete edges"
  on cluster_edges for delete to authenticated
  using (
     exists (
       select 1 from clusters_runs
       where clusters_runs.id = cluster_edges.clusters_run_id
       and (
         clusters_runs.created_by = auth.uid()
         or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
       )
     )
  );

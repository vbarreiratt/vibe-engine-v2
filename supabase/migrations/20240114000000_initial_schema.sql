-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Enum types
create type user_role as enum ('admin', 'curator');
create type project_status as enum ('active', 'archived');
create type scan_status as enum ('pending', 'vibra', 'nao_vibra', 'skipped');
create type cluster_image_kind as enum ('core', 'peripheral', 'bridge', 'outlier');

-- Create tables
create table profiles (
  user_id uuid references auth.users not null primary key,
  email text not null,
  role user_role not null default 'curator',
  created_at timestamptz default now()
);

create table projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  status project_status default 'active',
  created_by uuid references profiles(user_id),
  created_at timestamptz default now()
);

create table project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(user_id) on delete cascade,
  role text not null default 'curator', 
  joined_at timestamptz default now(),
  primary key (project_id, user_id)
);

create table images (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  original_url text not null,
  thumb_url text, 
  storage_path text, 
  width int,
  height int,
  hash text, 
  created_by uuid references profiles(user_id),
  created_at timestamptz default now()
);

create table image_scan (
  id uuid primary key default uuid_generate_v4(),
  image_id uuid references images(id) on delete cascade unique,
  project_id uuid references projects(id), 
  status scan_status default 'pending',
  scanned_by uuid references profiles(user_id),
  scanned_at timestamptz default now()
);

create table image_signals (
  id uuid primary key default uuid_generate_v4(),
  image_id uuid references images(id) on delete cascade unique,
  state text[] default '{}',
  matter text[] default '{}',
  movement text[] default '{}',
  updated_by uuid references profiles(user_id),
  updated_at timestamptz default now()
);

create table clusters (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  run_id text,
  name text,
  description text,
  cohesion_score float,
  created_at timestamptz default now()
);

create table cluster_images (
  cluster_id uuid references clusters(id) on delete cascade,
  image_id uuid references images(id) on delete cascade,
  kind cluster_image_kind default 'core',
  primary key (cluster_id, image_id)
);

create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id),
  entity_type text not null,
  entity_id uuid not null,
  action_type text not null,
  before_data jsonb,
  after_data jsonb,
  actor_user_id uuid references profiles(user_id),
  actor_role text,
  created_at timestamptz default now()
);

-- RLS Enable
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table images enable row level security;
alter table image_scan enable row level security;
alter table image_signals enable row level security;
alter table clusters enable row level security;
alter table cluster_images enable row level security;
alter table audit_log enable row level security;

-- Helper functions
create or replace function is_admin() returns boolean as $$
begin
  return exists (
    select 1 from profiles 
    where user_id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

create or replace function is_project_member(pid uuid) returns boolean as $$
begin
  return exists (
    select 1 from project_members 
    where project_id = pid and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Policies

-- Profiles
create policy "Users can read own profile" on profiles for select using (auth.uid() = user_id);
create policy "Admins can read all profiles" on profiles for select using (is_admin());
create policy "Admins can update profiles" on profiles for update using (is_admin());

-- Projects
create policy "Admins full access projects" on projects for all using (is_admin());
create policy "Members read projects" on projects for select using (
  exists (select 1 from project_members where user_id = auth.uid() and project_id = projects.id)
);

-- Project Members
create policy "Admins full access members" on project_members for all using (is_admin());
create policy "Users read own membership" on project_members for select using (user_id = auth.uid());

-- Images
create policy "Admins all images" on images for all using (is_admin());
create policy "Members read images" on images for select using (is_project_member(project_id));
create policy "Members insert images" on images for insert with check (is_project_member(project_id));

-- Image Scan
create policy "Admins all scan" on image_scan for all using (is_admin());
create policy "Members all scan" on image_scan for all using (
  exists (select 1 from images where id = image_scan.image_id and is_project_member(images.project_id))
);

-- Image Signals
create policy "Admins all signals" on image_signals for all using (is_admin());
create policy "Members all signals" on image_signals for all using (
  exists (select 1 from images where id = image_signals.image_id and is_project_member(images.project_id))
);

-- Clusters
create policy "Admins all clusters" on clusters for all using (is_admin());
create policy "Members all clusters" on clusters for all using (is_project_member(project_id));

-- Cluster Images
create policy "Admins all cluster_images" on cluster_images for all using (is_admin());
create policy "Members all cluster_images" on cluster_images for all using (
  exists (select 1 from clusters where id = cluster_images.cluster_id and is_project_member(clusters.project_id))
);

-- Audit Log
create policy "Admins read audit" on audit_log for select using (is_admin());
create policy "App insert audit" on audit_log for insert with check (auth.uid() IS NOT NULL);

-- Auto Profile Trigger
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (user_id, email, role)
  values (new.id, new.email, 'curator');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

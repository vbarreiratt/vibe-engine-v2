-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Enum types (handle existing)
do $$ begin
    create type user_role as enum ('admin', 'curator');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type project_status as enum ('active', 'archived');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type scan_status as enum ('pending', 'vibra', 'nao_vibra', 'skipped');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type cluster_image_kind as enum ('core', 'peripheral', 'bridge', 'outlier');
exception
    when duplicate_object then null;
end $$;

-- Create tables (if not exists)
create table if not exists profiles (
  user_id uuid references auth.users not null primary key,
  email text not null,
  role user_role not null default 'curator',
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  status project_status default 'active',
  created_by uuid references profiles(user_id),
  created_at timestamptz default now()
);

create table if not exists project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(user_id) on delete cascade,
  role text not null default 'curator', 
  joined_at timestamptz default now(),
  primary key (project_id, user_id)
);

create table if not exists images (
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

create table if not exists image_scan (
  id uuid primary key default uuid_generate_v4(),
  image_id uuid references images(id) on delete cascade unique,
  project_id uuid references projects(id), 
  status scan_status default 'pending',
  scanned_by uuid references profiles(user_id),
  scanned_at timestamptz default now()
);

create table if not exists image_signals (
  id uuid primary key default uuid_generate_v4(),
  image_id uuid references images(id) on delete cascade unique,
  state text[] default '{}',
  matter text[] default '{}',
  movement text[] default '{}',
  updated_by uuid references profiles(user_id),
  updated_at timestamptz default now()
);

create table if not exists clusters (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  run_id text,
  name text,
  description text,
  cohesion_score float,
  created_at timestamptz default now()
);

create table if not exists cluster_images (
  cluster_id uuid references clusters(id) on delete cascade,
  image_id uuid references images(id) on delete cascade,
  kind cluster_image_kind default 'core',
  primary key (cluster_id, image_id)
);

create table if not exists audit_log (
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

-- Policies (Drop first to allow re-run)
drop policy if exists "Users can read own profile" on profiles;
drop policy if exists "Admins can read all profiles" on profiles;
drop policy if exists "Admins can update profiles" on profiles;

create policy "Users can read own profile" on profiles for select using (auth.uid() = user_id);
create policy "Admins can read all profiles" on profiles for select using (is_admin());
create policy "Admins can update profiles" on profiles for update using (is_admin());

drop policy if exists "Admins full access projects" on projects;
drop policy if exists "Members read projects" on projects;
create policy "Admins full access projects" on projects for all using (is_admin());
create policy "Members read projects" on projects for select using (
  exists (select 1 from project_members where user_id = auth.uid() and project_id = projects.id)
);

drop policy if exists "Admins full access members" on project_members;
drop policy if exists "Users read own membership" on project_members;
create policy "Admins full access members" on project_members for all using (is_admin());
create policy "Users read own membership" on project_members for select using (user_id = auth.uid());

drop policy if exists "Admins all images" on images;
drop policy if exists "Members read images" on images;
drop policy if exists "Members insert images" on images;
create policy "Admins all images" on images for all using (is_admin());
create policy "Members read images" on images for select using (is_project_member(project_id));
create policy "Members insert images" on images for insert with check (is_project_member(project_id));

drop policy if exists "Admins all scan" on image_scan;
drop policy if exists "Members all scan" on image_scan;
create policy "Admins all scan" on image_scan for all using (is_admin());
create policy "Members all scan" on image_scan for all using (
  exists (select 1 from images where id = image_scan.image_id and is_project_member(images.project_id))
);

drop policy if exists "Admins all signals" on image_signals;
drop policy if exists "Members all signals" on image_signals;
create policy "Admins all signals" on image_signals for all using (is_admin());
create policy "Members all signals" on image_signals for all using (
  exists (select 1 from images where id = image_signals.image_id and is_project_member(images.project_id))
);

drop policy if exists "Admins all clusters" on clusters;
drop policy if exists "Members all clusters" on clusters;
create policy "Admins all clusters" on clusters for all using (is_admin());
create policy "Members all clusters" on clusters for all using (is_project_member(project_id));

drop policy if exists "Admins all cluster_images" on cluster_images;
drop policy if exists "Members all cluster_images" on cluster_images;
create policy "Admins all cluster_images" on cluster_images for all using (is_admin());
create policy "Members all cluster_images" on cluster_images for all using (
  exists (select 1 from clusters where id = cluster_images.cluster_id and is_project_member(clusters.project_id))
);

drop policy if exists "Admins read audit" on audit_log;
drop policy if exists "App insert audit" on audit_log;
create policy "Admins read audit" on audit_log for select using (is_admin());
create policy "App insert audit" on audit_log for insert with check (auth.uid() IS NOT NULL);

-- Auto Profile Trigger
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (user_id, email, role)
  values (new.id, new.email, 'curator')
  on conflict (user_id) do nothing; -- Handle conflict safely
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists before creating
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

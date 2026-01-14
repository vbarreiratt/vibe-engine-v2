-- Create Ingestions Table
create table if not exists ingestions (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references projects(id) on delete cascade,
    user_id uuid references profiles(user_id),
    name text not null,
    visibility text default 'private', -- public, private
    status text default 'completed',
    created_at timestamptz default now()
);

-- Add ingestion_id to images
alter table images add column if not exists ingestion_id uuid references ingestions(id) on delete set null;

-- Enable RLS
alter table ingestions enable row level security;

-- Policies for Ingestions
-- 1. Admins have full access
create policy "Admins full access ingestions" on ingestions
    for all
    to authenticated
    using (is_admin());

-- 2. Creators can see/edit their own ingestions
create policy "Creators access own ingestions" on ingestions
    for all
    to authenticated
    using (user_id = auth.uid());

-- 3. Members can VIEW public ingestions
create policy "Members view public ingestions" on ingestions
    for select
    to authenticated
    using (
        visibility = 'public' 
        and is_project_member(project_id)
    );

-- Update Image Policies to respect Ingestion Privacy
drop policy if exists "Members read images" on images;

create policy "Members read images" on images
    for select
    to authenticated
    using (
        is_project_member(project_id) 
        and (
            ingestion_id is null -- Legacy images visible to all members
            or exists (
                select 1 from ingestions 
                where id = images.ingestion_id 
                and (
                    visibility = 'public' 
                    or user_id = auth.uid() 
                    or is_admin() -- Admin sees everything via admin func anyway, but redundant check is safe
                )
            )
        )
    );

-- Ensure creators can still insert images linked to their ingestions
drop policy if exists "Members insert images" on images;
create policy "Members insert images" on images
    for insert
    with check (
        is_project_member(project_id)
        -- Check if linking to ingestion, must own ingestion
        and (
             ingestion_id is null
             or exists (
                select 1 from ingestions 
                where id = ingestion_id 
                and user_id = auth.uid()
             )
        )
    );

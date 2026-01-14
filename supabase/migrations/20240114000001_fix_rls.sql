-- Add explicit policies for Admin to ensure they can select projects
-- The previous policy "Admins full access projects" using (is_admin()) SHOULD work
-- but let's be extremely explicit and fix the definition of is_admin just in case context isn't passing.

-- 1. Ensure `is_admin` is robust
create or replace function is_admin() returns boolean as $$
declare
  _role user_role;
begin
  select role into _role from profiles where user_id = auth.uid();
  return _role = 'admin';
end;
$$ language plpgsql security definer;

-- 2. Grant explicit select to authenticated users for projects BUT filter
-- Re-apply projects policy to be sure
drop policy if exists "Admins full access projects" on projects;
drop policy if exists "Members read projects" on projects;

create policy "Admins full access projects" on projects
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Members read projects" on projects
  for select
  to authenticated
  using (
    exists (
      select 1 from project_members 
      where project_members.project_id = projects.id 
      and project_members.user_id = auth.uid()
    )
  );

-- 3. Also fix profiles policy to ensure we can read our own role to determine admin-ness
drop policy if exists "Users can read own profile" on profiles;
create policy "Users can read own profile" on profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

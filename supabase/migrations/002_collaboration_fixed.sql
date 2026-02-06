-- Collaboration Migration (Fixed Order)
-- Enable trigram extension FIRST (needed for index)
create extension if not exists pg_trgm;

-- Profiles table to store public user information
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

-- Canvas Members table for collaboration
create table if not exists public.canvas_members (
  id uuid default uuid_generate_v4() primary key,
  canvas_id uuid references public.canvases(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'editor' check (role in ('viewer', 'editor', 'admin')),
  created_at timestamptz default now() not null,
  unique(canvas_id, user_id)
);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;


-- Ensure the trigger exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Update RLS for profiles
alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Update RLS for canvas_members
alter table public.canvas_members enable row level security;

drop policy if exists "Members can view canvas membership" on public.canvas_members;
create policy "Members can view canvas membership"
  on public.canvas_members for select
  using (
    exists (
      select 1 from public.canvases
      where id = canvas_id and user_id = auth.uid()
    ) or auth.uid() = user_id
  );

drop policy if exists "Admins can manage canvas members" on public.canvas_members;
create policy "Admins can manage canvas members"
  on public.canvas_members for all
  using (
    exists (
      select 1 from public.canvases
      where id = canvas_id and user_id = auth.uid()
    ) or exists (
      select 1 from public.canvas_members cm2
      where cm2.canvas_id = canvas_members.canvas_id and cm2.user_id = auth.uid() and cm2.role = 'admin'
    )
  );

-- Update RLS for canvases to allow access for members
drop policy if exists "Users can view own canvases" on public.canvases;
drop policy if exists "Users can view canvases they own or are members of" on public.canvases;
create policy "Users can view canvases they own or are members of"
  on public.canvases for select
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.canvas_members
      where canvas_id = public.canvases.id and user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own canvases" on public.canvases;
drop policy if exists "Users can update canvases they own or have editor role" on public.canvases;
create policy "Users can update canvases they own or have editor role"
  on public.canvases for update
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.canvas_members
      where canvas_id = public.canvases.id and user_id = auth.uid() and role in ('editor', 'admin')
    )
  );

-- Update RLS for notes to allow access for members
drop policy if exists "Users can view own notes" on public.notes;
drop policy if exists "Users can view notes in canvases they have access to" on public.notes;
create policy "Users can view notes in canvases they have access to"
  on public.notes for select
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.canvas_members
      where canvas_id = public.notes.canvas_id and user_id = auth.uid()
    ) or
    exists (
      select 1 from public.canvases
      where id = public.notes.canvas_id and user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own notes" on public.notes;
drop policy if exists "Users can update notes in canvases they have editor access to" on public.notes;
create policy "Users can update notes in canvases they have editor access to"
  on public.notes for update
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.canvas_members
      where canvas_id = public.notes.canvas_id and user_id = auth.uid() and role in ('editor', 'admin')
    ) or
    exists (
      select 1 from public.canvases
      where id = public.notes.canvas_id and user_id = auth.uid()
    )
  );

-- Grant access to the profile fields for searching (trigram index)
create index if not exists idx_profiles_email_trgm on public.profiles using gin (email gin_trgm_ops);

-- Backfill profiles for existing users
insert into public.profiles (id, email, full_name, avatar_url)
select 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

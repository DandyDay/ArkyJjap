-- Arky Clone Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Canvases table (메인 작업 공간)
create table public.canvases (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled',
  description text,
  content jsonb default '{}',  -- Tiptap JSON content
  view_mode text default 'canvas' check (view_mode in ('canvas', 'document')),
  is_archived boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Notes table (캔버스 내 개별 노트 블록)
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  canvas_id uuid references public.canvases(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default '',
  content jsonb default '{}',  -- Tiptap JSON content
  position_x float default 0,
  position_y float default 0,
  width float default 300,
  height float default 200,
  color text default 'default',
  z_index integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Tags table
create table public.tags (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text default '#6366f1',
  created_at timestamptz default now() not null,
  unique(user_id, name)
);

-- Canvas-Tag relation
create table public.canvas_tags (
  canvas_id uuid references public.canvases(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (canvas_id, tag_id)
);

-- Note-Tag relation
create table public.note_tags (
  note_id uuid references public.notes(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

-- Resources table (첨부파일, 링크 등)
create table public.resources (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  canvas_id uuid references public.canvases(id) on delete set null,
  type text not null check (type in ('file', 'link', 'image')),
  name text not null,
  url text,
  file_path text,
  metadata jsonb default '{}',
  created_at timestamptz default now() not null
);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to tables
create trigger canvases_updated_at
  before update on public.canvases
  for each row execute function update_updated_at();

create trigger notes_updated_at
  before update on public.notes
  for each row execute function update_updated_at();

-- Row Level Security
alter table public.canvases enable row level security;
alter table public.notes enable row level security;
alter table public.tags enable row level security;
alter table public.canvas_tags enable row level security;
alter table public.note_tags enable row level security;
alter table public.resources enable row level security;

-- Policies for canvases
create policy "Users can view own canvases"
  on public.canvases for select
  using (auth.uid() = user_id);

create policy "Users can create own canvases"
  on public.canvases for insert
  with check (auth.uid() = user_id);

create policy "Users can update own canvases"
  on public.canvases for update
  using (auth.uid() = user_id);

create policy "Users can delete own canvases"
  on public.canvases for delete
  using (auth.uid() = user_id);

-- Policies for notes
create policy "Users can view own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can create own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- Policies for tags
create policy "Users can manage own tags"
  on public.tags for all
  using (auth.uid() = user_id);

-- Policies for canvas_tags
create policy "Users can manage own canvas_tags"
  on public.canvas_tags for all
  using (
    exists (
      select 1 from public.canvases
      where id = canvas_id and user_id = auth.uid()
    )
  );

-- Policies for note_tags
create policy "Users can manage own note_tags"
  on public.note_tags for all
  using (
    exists (
      select 1 from public.notes
      where id = note_id and user_id = auth.uid()
    )
  );

-- Policies for resources
create policy "Users can manage own resources"
  on public.resources for all
  using (auth.uid() = user_id);

-- Indexes for performance
create index idx_canvases_user_id on public.canvases(user_id);
create index idx_notes_canvas_id on public.notes(canvas_id);
create index idx_notes_user_id on public.notes(user_id);
create index idx_tags_user_id on public.tags(user_id);
create index idx_resources_user_id on public.resources(user_id);
create index idx_resources_canvas_id on public.resources(canvas_id);

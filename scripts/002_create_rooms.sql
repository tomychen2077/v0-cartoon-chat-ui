-- Create chat rooms table
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  topic text,
  emoji text,
  is_public boolean default true,
  is_private boolean default false,
  language text default 'en',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  member_count int default 0
);

-- Enable RLS
alter table public.rooms enable row level security;

-- Create policies
create policy "rooms_select_public"
  on public.rooms for select
  using (is_public = true);

create policy "rooms_select_own_private"
  on public.rooms for select
  using (is_private = true and auth.uid() = created_by);

create policy "rooms_insert"
  on public.rooms for insert
  with check (auth.uid() = created_by);

create policy "rooms_update_own"
  on public.rooms for update
  using (auth.uid() = created_by);

create policy "rooms_delete_own"
  on public.rooms for delete
  using (auth.uid() = created_by);

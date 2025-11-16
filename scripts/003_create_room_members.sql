-- Create room members table for tracking who is in each room
create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  unique(room_id, user_id)
);

-- Enable RLS
alter table public.room_members enable row level security;

-- Create policies
create policy "room_members_select"
  on public.room_members for select
  using (true);

create policy "room_members_insert"
  on public.room_members for insert
  with check (auth.uid() = user_id);

create policy "room_members_delete_own"
  on public.room_members for delete
  using (auth.uid() = user_id);

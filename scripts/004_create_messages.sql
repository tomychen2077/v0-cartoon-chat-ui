-- Create messages table for chat content
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.messages enable row level security;

-- Create policies
create policy "messages_select"
  on public.messages for select
  using (true);

create policy "messages_insert"
  on public.messages for insert
  with check (auth.uid() = user_id);

create policy "messages_update_own"
  on public.messages for update
  using (auth.uid() = user_id);

create policy "messages_delete_own"
  on public.messages for delete
  using (auth.uid() = user_id);

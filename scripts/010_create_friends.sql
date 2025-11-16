-- Create friends table for user relationships
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending', -- 'pending', 'accepted', 'blocked'
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, friend_id),
  check (user_id != friend_id)
);

-- Create index for faster queries
create index if not exists friends_user_id_idx on public.friends(user_id);
create index if not exists friends_friend_id_idx on public.friends(friend_id);
create index if not exists friends_status_idx on public.friends(status);

-- Enable RLS
alter table public.friends enable row level security;

-- Create policies
create policy "friends_select_own"
  on public.friends for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "friends_insert_own"
  on public.friends for insert
  with check (auth.uid() = user_id);

create policy "friends_update_own"
  on public.friends for update
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "friends_delete_own"
  on public.friends for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);


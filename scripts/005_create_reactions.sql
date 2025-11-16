-- Create message reactions table
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamp with time zone default now(),
  unique(message_id, user_id, emoji)
);

-- Enable RLS
alter table public.reactions enable row level security;

-- Create policies
create policy "reactions_select"
  on public.reactions for select
  using (true);

create policy "reactions_insert"
  on public.reactions for insert
  with check (auth.uid() = user_id);

create policy "reactions_delete_own"
  on public.reactions for delete
  using (auth.uid() = user_id);

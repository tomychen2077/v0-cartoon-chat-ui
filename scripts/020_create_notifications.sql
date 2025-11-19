create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete set null,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  room_id uuid references public.rooms(id) on delete cascade,
  friend_request_id uuid references public.friends(id) on delete cascade,
  message text,
  created_at timestamp with time zone default now(),
  read_at timestamp with time zone
);

create index if not exists notifications_recipient_idx on public.notifications(recipient_id);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = recipient_id);

create policy "notifications_insert_sender"
  on public.notifications for insert
  with check (auth.uid() = sender_id);

create policy "notifications_update_recipient"
  on public.notifications for update
  using (auth.uid() = recipient_id);


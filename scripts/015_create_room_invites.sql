create table if not exists public.room_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  token text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamp with time zone,
  max_uses int,
  uses int default 0,
  status text default 'active'
);

alter table public.room_invites enable row level security;

drop policy if exists "room_invites_select" on public.room_invites;
create policy "room_invites_select"
  on public.room_invites
  for select
  using (true);

drop policy if exists "room_invites_insert" on public.room_invites;
create policy "room_invites_insert"
  on public.room_invites
  for insert
  with check (auth.uid() = created_by);

drop policy if exists "room_invites_update_own" on public.room_invites;
create policy "room_invites_update_own"
  on public.room_invites
  for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

drop policy if exists "room_invites_delete_own" on public.room_invites;
create policy "room_invites_delete_own"
  on public.room_invites
  for delete
  using (auth.uid() = created_by);

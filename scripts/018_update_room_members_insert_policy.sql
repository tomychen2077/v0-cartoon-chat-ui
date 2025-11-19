drop policy if exists "room_members_insert" on public.room_members;
create policy "room_members_insert"
  on public.room_members
  for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.rooms r
      where r.id = room_id and r.created_by = auth.uid()
    )
  );


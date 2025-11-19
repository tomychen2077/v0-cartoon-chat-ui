drop policy if exists "rooms_select_member_private" on public.rooms;
create policy "rooms_select_member_private"
  on public.rooms
  for select
  using (
    is_private = true and exists (
      select 1 from public.room_members rm
      where rm.room_id = rooms.id and rm.user_id = auth.uid()
    )
  );

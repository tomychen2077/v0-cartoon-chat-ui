-- Allow users to update their own room_members rows
create policy if not exists "room_members_update_own"
  on public.room_members for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


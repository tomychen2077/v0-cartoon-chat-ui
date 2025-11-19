create or replace function public.update_member_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.rooms set member_count = coalesce(member_count,0) + 1 where id = new.room_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.rooms set member_count = greatest(coalesce(member_count,0) - 1, 0) where id = old.room_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists room_members_inc_count on public.room_members;
create trigger room_members_inc_count
after insert on public.room_members
for each row execute function public.update_member_count();

drop trigger if exists room_members_dec_count on public.room_members;
create trigger room_members_dec_count
after delete on public.room_members
for each row execute function public.update_member_count();


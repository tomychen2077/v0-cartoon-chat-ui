-- Add last_seen column to room_members for presence tracking
alter table public.room_members add column if not exists last_seen timestamp with time zone;
update public.room_members set last_seen = joined_at where last_seen is null;


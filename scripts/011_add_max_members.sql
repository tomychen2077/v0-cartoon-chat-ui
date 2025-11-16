-- Add max_members column to rooms table
alter table public.rooms add column if not exists max_members integer;


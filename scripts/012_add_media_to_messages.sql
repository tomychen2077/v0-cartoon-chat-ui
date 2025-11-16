-- Add media columns to messages table
alter table public.messages add column if not exists media_url text;
alter table public.messages add column if not exists media_type text;


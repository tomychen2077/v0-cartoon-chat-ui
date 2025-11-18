-- Add additional profile fields
alter table public.profiles
  add column if not exists gender text,
  add column if not exists age int;

-- Optional: constrain gender values
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_gender_check'
  ) then
    alter table public.profiles add constraint profiles_gender_check check (gender in ('male','female','other'));
  end if;
end $$;

-- Optional: constrain age range
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_age_check'
  ) then
    alter table public.profiles add constraint profiles_age_check check (age is null or age between 13 and 120);
  end if;
end $$;

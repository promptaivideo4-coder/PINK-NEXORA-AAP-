-- Nexora Salon: run this once in Supabase Dashboard → SQL Editor.
-- This creates one salon profile per authenticated owner. RLS ensures owners
-- can only access their own salon data.

create table if not exists public.salon_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  business_name text not null default '',
  business_category text not null default '',
  contact_number text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.salon_profiles enable row level security;

drop policy if exists "Owners can view their salon profile" on public.salon_profiles;
create policy "Owners can view their salon profile"
  on public.salon_profiles for select using (auth.uid() = id);

drop policy if exists "Owners can update their salon profile" on public.salon_profiles;
create policy "Owners can update their salon profile"
  on public.salon_profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_salon_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.salon_profiles (id, email, business_name, business_category, contact_number)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'business_name', ''),
    coalesce(new.raw_user_meta_data ->> 'business_category', ''),
    coalesce(new.raw_user_meta_data ->> 'contact_number', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    business_name = excluded.business_name,
    business_category = excluded.business_category,
    contact_number = excluded.contact_number,
    updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_nexora on auth.users;
create trigger on_auth_user_created_nexora
  after insert on auth.users
  for each row execute procedure public.handle_new_salon_owner();

-- Backfill any owners created before this schema was installed.
insert into public.salon_profiles (id, email, business_name, business_category, contact_number)
select
  id,
  coalesce(email, ''),
  coalesce(raw_user_meta_data ->> 'business_name', ''),
  coalesce(raw_user_meta_data ->> 'business_category', ''),
  coalesce(raw_user_meta_data ->> 'contact_number', '')
from auth.users
on conflict (id) do nothing;

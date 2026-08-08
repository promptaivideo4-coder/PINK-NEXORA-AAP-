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

-- ============================================================
-- SHOP LOCATION CONFIRMATION fields (location save flow)
-- Owner confirm ke baad hi location_confirmed=true hota hai.
-- Supabase Dashboard → SQL Editor me ek baar chalana hai.
-- ============================================================
alter table public.salons add column if not exists location_accuracy_m numeric;
alter table public.salons add column if not exists location_source text; -- 'gps' | 'manual'
alter table public.salons add column if not exists location_confirmed boolean not null default false;
alter table public.salons add column if not exists location_confirmed_at timestamptz;

-- ============================================================
-- update_shop_location — owner apni salon ka canonical location
-- update karta hai (RLS direct UPDATE na de to ye RPC use hota hai).
--
-- SECURITY:
--  - SECURITY DEFINER (function owner = postgres/superuser) — lekin
--    function ANDAR hi auth.uid() se ownership verify karta hai via
--    organization_members (user_id + role='owner' + status='active').
--  - Isliye ye RLS bypass NAHI karta — unverified user ke liye
--    kuch update nahi hota, 0 rows → caller ko false milta hai.
--  - Sirf authenticated users hi call kar sakte hain (revoke public).
-- ============================================================
create or replace function public.update_shop_location(
  p_latitude double precision,
  p_longitude double precision,
  p_address text default null,
  p_city text default null,
  p_area text default null,
  p_zone text default null,
  p_landmark text default null,
  p_pincode text default null,
  p_accuracy_m numeric default null,
  p_source text default null,
  p_confirmed boolean default true,
  p_confirmed_at timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salon_ids uuid[];
begin
  -- Ownership verify: authenticated user must be an ACTIVE OWNER of the org
  select array_agg(s.id) into v_salon_ids
  from public.salons s
  join public.organization_members om
    on om.organization_id = s.organization_id
  where om.user_id = auth.uid()
    and om.role = 'owner'
    and om.status = 'active'
    and s.deleted_at is null;

  if v_salon_ids is null or array_length(v_salon_ids, 1) is null then
    return false; -- owner nahi hai / koi salon nahi — kuch update nahi
  end if;

  update public.salons
  set latitude            = p_latitude,
      longitude           = p_longitude,
      location_accuracy_m = p_accuracy_m,
      location_source     = case when p_source in ('gps','manual') then p_source else location_source end,
      location_address    = coalesce(p_address, location_address),
      location_city       = coalesce(p_city, location_city),
      location_area       = coalesce(p_area, location_area),
      location_zone       = coalesce(p_zone, location_zone),
      location_landmark   = coalesce(p_landmark, location_landmark),
      location_pincode    = coalesce(p_pincode, location_pincode),
      location_confirmed  = coalesce(p_confirmed, location_confirmed),
      location_confirmed_at = coalesce(p_confirmed_at, location_confirmed_at),
      updated_at          = timezone('utc', now())
  where id = any(v_salon_ids);

  return true;
end;
$$;

-- Sirf authenticated users (RLS policy ke through). Anonymous ko nahi.
revoke all on function public.update_shop_location(double precision, double precision, text, text, text, text, text, text, numeric, text, boolean, timestamptz) from public;
grant execute on function public.update_shop_location(double precision, double precision, text, text, text, text, text, text, numeric, text, boolean, timestamptz) to authenticated;

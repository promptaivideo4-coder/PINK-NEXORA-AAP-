-- ============================================================
-- onboarding_progress — White-label website builder state
-- ============================================================
-- Stores the builder's live state per owner.
-- Powers resume-from-last-screen + cloud backup of localStorage.
--
-- SECURITY:
--   - Each owner only sees their own row (RLS on id = auth.uid())
--   - JSONB `draft` holds the full SalonData snapshot
--   - `status` tracks: in_progress | completed
-- ============================================================

create table if not exists public.onboarding_progress (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid, -- links to salons.organization_id when shop exists
  current_step int not null default 1,
  last_completed_step int not null default 0,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'paused')),
  draft jsonb not null default '{}',
  selected_template text,
  website_appearance text check (website_appearance in ('light', 'dark')),
  reviewed_content jsonb,
  publish_state text check (publish_state in ('draft', 'publishing', 'published')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Indexes for fast lookup
create index if not exists idx_onboarding_progress_business
  on public.onboarding_progress(business_id);
create index if not exists idx_onboarding_progress_status
  on public.onboarding_progress(status);

-- RLS
alter table public.onboarding_progress enable row level security;

-- Owner can only view their own row
drop policy if exists "Owners can view their onboarding progress" on public.onboarding_progress;
create policy "Owners can view their onboarding progress"
  on public.onboarding_progress for select
  using (auth.uid() = id);

-- Owner can only update their own row
drop policy if exists "Owners can update their onboarding progress" on public.onboarding_progress;
create policy "Owners can update their onboarding progress"
  on public.onboarding_progress for insert
  with check (auth.uid() = id);

drop policy if exists "Owners can upsert their onboarding progress" on public.onboarding_progress;
create policy "Owners can upsert their onboarding progress"
  on public.onboarding_progress for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-update updated_at
drop trigger if exists onboarding_progress_set_updated_at on public.onboarding_progress;
create trigger onboarding_progress_set_updated_at
  before update on public.onboarding_progress
  for each row execute procedure public.set_updated_at();

-- Helper function: set_updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Backfill: if any existing owners don't have a row, create one
insert into public.onboarding_progress (id, status)
select id, 'in_progress'
from auth.users
on conflict (id) do nothing;

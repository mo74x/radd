-- Migration: 0004_cron_leasing_race_prevention.sql
-- Description: Add poll leasing columns to locations, partial unique index on drafts, and lease RPC functions

-- 1. Add poll leasing columns to locations
alter table public.locations
  add column if not exists poll_lock_until timestamptz,
  add column if not exists poll_lock_token uuid;

-- 2. Add partial unique index: ensures no review can have more than one active draft concurrently
create unique index if not exists idx_drafts_active_review
  on public.drafts (review_id)
  where status in ('pending', 'posting', 'posted');

-- 3. Stored procedure for atomic lease acquisition (now() + interval '5 minutes')
create or replace function public.acquire_location_poll_lease(loc_id uuid, lock_token uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  affected_id uuid;
begin
  update public.locations
  set poll_lock_until = now() + interval '5 minutes',
      poll_lock_token = lock_token
  where id = loc_id
    and (poll_lock_until is null or poll_lock_until < now())
  returning id into affected_id;

  return affected_id is not null;
end;
$$;

-- 4. Stored procedure to release the polling lease on completion
create or replace function public.release_location_poll_lease(loc_id uuid, lock_token uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  affected_id uuid;
begin
  update public.locations
  set poll_lock_until = null,
      poll_lock_token = null
  where id = loc_id
    and poll_lock_token = lock_token
  returning id into affected_id;

  return affected_id is not null;
end;
$$;

-- Migration: 0002_publishing_state_machine.sql
-- Description: Add retry tracking columns and expand draft status constraint

-- 1. Add state machine and retry tracking columns to drafts table
alter table public.drafts
  add column if not exists attempts int not null default 0,
  add column if not exists last_error text,
  add column if not exists posting_started_at timestamptz,
  add column if not exists next_retry_at timestamptz,
  add column if not exists google_reply_posted_at timestamptz;

-- 2. Update status check constraint to include 'posting' and 'expired'
alter table public.drafts
  drop constraint if exists drafts_status_check;

alter table public.drafts
  add constraint drafts_status_check
  check (status in ('pending', 'posting', 'approved', 'edited', 'skipped', 'posted', 'failed', 'expired'));

-- 3. Index for crash recovery and retry queries
create index if not exists idx_drafts_retry
  on public.drafts (status, next_retry_at)
  where status in ('failed', 'posting');

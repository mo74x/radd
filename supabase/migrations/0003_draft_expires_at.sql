-- Migration: 0003_draft_expires_at.sql
-- Description: Add expires_at (72 hour default), last_renewed_at, and renewal_count to drafts

-- 1. Add expires_at, last_renewed_at, and renewal_count columns
alter table public.drafts
  add column if not exists expires_at timestamptz not null default (now() + interval '72 hours'),
  add column if not exists last_renewed_at timestamptz,
  add column if not exists renewal_count int not null default 0;

-- 2. Backfill existing records from token_expires_at if available
update public.drafts
set expires_at = coalesce(token_expires_at, now() + interval '72 hours')
where expires_at is null;

-- 3. Composite index for token hash lookups and expiry evaluation
create index if not exists idx_drafts_pending_expires_at
  on public.drafts (approval_token_hash, expires_at)
  where status in ('pending', 'expired');

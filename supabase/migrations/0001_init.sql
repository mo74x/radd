create extension if not exists "pgcrypto";

-- 1. Businesses (One row per tenant)
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  plan text not null default 'trial' check (plan in ('trial', 'starter', 'pro', 'agency')),
  status text not null default 'active' check (status in ('active', 'paused', 'revoked')),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  notification_channel text not null default 'email' check (notification_channel in ('email', 'telegram', 'whatsapp')),
  notification_target text, -- email address, telegram_chat_id, or whatsapp phone
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Google OAuth Connections (Strictly server-only via service_role; no client RLS)
create table public.google_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null unique,
  google_email text,
  encrypted_refresh_token text not null,
  access_token text,
  token_expires_at timestamptz,
  status text not null default 'active' check (status in ('active', 'revoked', 'error')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Locations (Google Business Profile branches)
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  google_account_id text not null,
  google_location_id text not null,
  display_name text not null,
  contact_phone text,
  contact_email text,
  is_polling_enabled boolean not null default true,
  last_polled_at timestamptz,
  last_review_update_time timestamptz,
  created_at timestamptz not null default now(),
  unique (google_account_id, google_location_id)
);

-- 4. Brand Profiles (Voice, dialect, rules, and examples per business)
create table public.brand_profiles (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  tone text not null default 'warm, friendly, and respectful',
  languages text[] not null default '{ar,en}',
  arabic_dialect text not null default 'egyptian' check (arabic_dialect in ('egyptian', 'msa', 'gulf', 'levantine')),
  signature text,
  do_list text[] not null default '{}',
  dont_list text[] not null default '{}',
  example_replies text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- 5. Reviews (Deduplicated by location_id + google_review_id)
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  location_id uuid references public.locations(id) on delete cascade not null,
  google_review_id text not null,
  rating int not null check (rating between 1 and 5),
  reviewer_name text,
  text text,
  language text, -- 'ar' | 'en' | 'mixed' | 'none'
  flags text[] not null default '{}', -- refund, legal, medical, threat, injection_suspected
  requires_careful_review boolean not null default false,
  google_created_at timestamptz,
  google_updated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (location_id, google_review_id)
);

-- 6. Drafts (Generated replies and single-use approval tokens)
create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  review_id uuid references public.reviews(id) on delete cascade not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'edited', 'skipped', 'posted', 'failed')),
  final_body text,
  approval_token_hash text unique,
  token_expires_at timestamptz,
  decided_at timestamptz,
  posted_at timestamptz,
  last_error text,
  model text not null,
  prompt_version text not null,
  created_at timestamptz not null default now()
);

-- Performance Indexes
create index idx_locations_polling on public.locations (is_polling_enabled, last_polled_at);
create index idx_reviews_location on public.reviews (location_id, created_at desc);
create index idx_drafts_review on public.drafts (review_id);
create index idx_drafts_token_hash on public.drafts (approval_token_hash) where status = 'pending';

-- Enable Row Level Security (RLS) on every table
alter table public.businesses enable row level security;
alter table public.google_connections enable row level security;
alter table public.locations enable row level security;
alter table public.brand_profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.drafts enable row level security;

-- Security Definer Helper to verify tenant ownership
create or replace function public.is_business_owner(b_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.businesses
    where id = b_id and owner_id = auth.uid()
  );
$$;

-- RLS Policies
create policy "Owners manage own businesses"
  on public.businesses for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Owners manage own locations"
  on public.locations for all
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

create policy "Owners manage own brand_profiles"
  on public.brand_profiles for all
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

create policy "Owners read own reviews"
  on public.reviews for select
  using (public.is_business_owner(business_id));

create policy "Owners read and update own drafts"
  on public.drafts for select
  using (public.is_business_owner(business_id));
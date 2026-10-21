-- Migration: 0006_billing_subscriptions.sql
-- Creates subscriptions table supporting Paymob, Fawry, and Stripe with entitlement tracking.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null unique,
  gateway text not null check (gateway in ('paymob', 'fawry', 'stripe')),
  plan text not null check (plan in ('starter', 'pro', 'agency')),
  status text not null check (status in ('active', 'past_due', 'canceled', 'trialing', 'unpaid')),
  external_customer_id text,
  external_subscription_id text,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  currency text not null default 'EGP' check (currency in ('EGP', 'USD', 'EUR')),
  amount_cents integer not null default 0,
  created_at timestamptz not null default now(),  
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_business on public.subscriptions (business_id);
create index if not exists idx_subscriptions_status on public.subscriptions (status);

comment on table public.subscriptions is 'Business subscriptions across Paymob/Fawry (Egypt) and Stripe (International).';
comment on column public.subscriptions.status is 'active: paid & entitled; past_due: payment failed; canceled: ended; trialing: active trial; unpaid: suspended.';

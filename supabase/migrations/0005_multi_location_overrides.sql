-- Migration: 0005_multi_location_overrides.sql
-- Multi-Location Support (Item 10)
-- Adds signature_override column to locations table to support per-location brand signatures.

alter table public.locations add column if not exists signature_override text;

comment on column public.locations.signature_override is 'Optional per-location signature override (e.g. فريق Roastery & Co. - فرع المعادي). Falls back to brand_profiles.signature if null.';
comment on column public.locations.contact_phone is 'Per-location contact phone number override. Used in customer replies and safety validations.';

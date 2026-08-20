-- Migration: Create social_links table
-- Run this in your Supabase SQL editor

create table if not exists public.social_links (
  id         uuid primary key default gen_random_uuid(),
  platform   text not null,
  label      text not null,
  url        text not null,
  icon       text not null,
  is_active  boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.social_links is 'Admin-managed social media links for the public footer';

-- Enable RLS
alter table public.social_links enable row level security;

-- Public read for active links
create policy "Public can view active social links"
  on public.social_links for select
  using (is_active = true);

-- Admin full access
create policy "Admins have full access to social links"
  on public.social_links for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

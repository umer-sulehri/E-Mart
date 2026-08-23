-- Store configuration + discount coupons
-- site_settings is read by the server via the service-role key only,
-- so no client policies are created on purpose.

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent', 'flat')),
  value numeric not null check (value > 0),
  min_subtotal numeric not null default 0,
  max_redemptions integer,
  times_used integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.coupons enable row level security;

-- Coupons are safe to expose for read: validation only needs code/value.
drop policy if exists "coupons readable" on public.coupons;
create policy "coupons readable"
  on public.coupons for select
  using (is_active = true);

insert into public.coupons (code, type, value, min_subtotal)
values
  ('WELCOME10', 'percent', 10, 1000),
  ('FLAT500', 'flat', 500, 5000)
on conflict (code) do nothing;

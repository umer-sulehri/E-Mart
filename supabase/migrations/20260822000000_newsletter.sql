-- Newsletter subscribers
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'newsletter_subscribers'
      and policyname = 'service role manages newsletter_subscribers'
  ) then
    create policy "service role manages newsletter_subscribers"
      on public.newsletter_subscribers
      for all
      using (false)
      with check (false);
  end if;
end $$;

-- Reads/writes happen exclusively through the service-role client.

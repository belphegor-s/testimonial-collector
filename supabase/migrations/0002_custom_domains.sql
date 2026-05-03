-- Custom domains: hostname → user/campaign mapping
create table if not exists public.custom_domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  hostname text unique not null,
  verification_token text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists custom_domains_hostname_idx on public.custom_domains (hostname);
create index if not exists custom_domains_user_id_idx on public.custom_domains (user_id);

-- RLS: users see and modify only their own
alter table public.custom_domains enable row level security;

drop policy if exists "custom_domains_select_own" on public.custom_domains;
create policy "custom_domains_select_own" on public.custom_domains
  for select using (auth.uid() = user_id);

drop policy if exists "custom_domains_insert_own" on public.custom_domains;
create policy "custom_domains_insert_own" on public.custom_domains
  for insert with check (auth.uid() = user_id);

drop policy if exists "custom_domains_update_own" on public.custom_domains;
create policy "custom_domains_update_own" on public.custom_domains
  for update using (auth.uid() = user_id);

drop policy if exists "custom_domains_delete_own" on public.custom_domains;
create policy "custom_domains_delete_own" on public.custom_domains
  for delete using (auth.uid() = user_id);

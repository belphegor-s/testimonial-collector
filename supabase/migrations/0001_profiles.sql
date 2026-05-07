-- Profiles: per-user plan + Polar identifiers
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  polar_customer_id text,
  polar_subscription_id text,
  plan_renews_at timestamptz,
  created_at timestamptz not null default now()
);

-- Ensure columns exist even if table was pre-existing without them
alter table public.profiles add column if not exists plan text not null default 'free';
alter table public.profiles add column if not exists polar_customer_id text;
alter table public.profiles add column if not exists polar_subscription_id text;
alter table public.profiles add column if not exists plan_renews_at timestamptz;

create index if not exists profiles_polar_customer_id_idx on public.profiles (polar_customer_id);
create index if not exists profiles_polar_subscription_id_idx on public.profiles (polar_subscription_id);

-- Auto-create profile row on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- Backfill any existing users
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- RLS: user can read own profile; only service role writes plan fields
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- No client update policy — plan changes happen via webhook (service role)

-- ============================================================
-- Kudoso — full schema bootstrap
-- Paste entire file into Supabase SQL Editor → Run
-- Safe to re-run: uses IF NOT EXISTS throughout
-- ============================================================

-- ── 0001_profiles ────────────────────────────────────────────
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

insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- ── 0002_custom_domains ──────────────────────────────────────
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

-- ── 0003_organizations ───────────────────────────────────────
create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_id uuid not null references auth.users(id) on delete restrict,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  polar_customer_id text,
  polar_subscription_id text,
  plan_renews_at timestamptz,
  is_personal boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists organizations_owner_id_idx on public.organizations (owner_id);
create index if not exists organizations_polar_customer_id_idx on public.organizations (polar_customer_id);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx on public.organization_members (user_id);

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  invited_by uuid references auth.users(id) on delete set null,
  token text unique not null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create unique index if not exists organization_invitations_unique_pending
  on public.organization_invitations (organization_id, lower(email))
  where accepted_at is null;
create index if not exists organization_invitations_email_idx
  on public.organization_invitations (lower(email));

alter table public.campaigns add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
create index if not exists campaigns_organization_id_idx on public.campaigns (organization_id);

alter table public.custom_domains add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
create index if not exists custom_domains_organization_id_idx on public.custom_domains (organization_id);

create or replace function public.handle_new_user_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_slug text;
  new_org_id uuid;
  base_slug text;
  candidate_slug text;
  i int := 0;
begin
  base_slug := lower(regexp_replace(coalesce(split_part(new.email, '@', 1), 'workspace'), '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'workspace'; end if;
  candidate_slug := base_slug;

  while exists (select 1 from public.organizations where slug = candidate_slug) loop
    i := i + 1;
    candidate_slug := base_slug || '-' || substr(replace(new.id::text, '-', ''), 1, 4) || (case when i > 1 then i::text else '' end);
  end loop;

  insert into public.organizations (name, slug, owner_id, is_personal)
  values (
    coalesce(split_part(new.email, '@', 1), 'My workspace'),
    candidate_slug,
    new.id,
    true
  )
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner')
  on conflict do nothing;

  insert into public.organization_members (organization_id, user_id, role)
  select organization_id, new.id, role
  from public.organization_invitations
  where lower(email) = lower(new.email)
    and accepted_at is null
    and expires_at > now()
  on conflict do nothing;

  update public.organization_invitations
  set accepted_at = now()
  where lower(email) = lower(new.email)
    and accepted_at is null
    and expires_at > now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_org on auth.users;
create trigger on_auth_user_created_org
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user_organization();

do $$
declare
  u record;
  new_slug text;
  base_slug text;
  candidate_slug text;
  i int;
  new_org_id uuid;
  prof record;
begin
  for u in select id, email from auth.users where not exists (
    select 1 from public.organization_members where user_id = auth.users.id
  ) loop
    base_slug := lower(regexp_replace(coalesce(split_part(u.email, '@', 1), 'workspace'), '[^a-z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then base_slug := 'workspace'; end if;
    candidate_slug := base_slug;
    i := 0;
    while exists (select 1 from public.organizations where slug = candidate_slug) loop
      i := i + 1;
      candidate_slug := base_slug || '-' || substr(replace(u.id::text, '-', ''), 1, 4) || (case when i > 1 then i::text else '' end);
    end loop;

    select * into prof from public.profiles where id = u.id;

    insert into public.organizations (name, slug, owner_id, is_personal, plan, polar_customer_id, polar_subscription_id, plan_renews_at)
    values (
      coalesce(split_part(u.email, '@', 1), 'My workspace'),
      candidate_slug,
      u.id,
      true,
      coalesce(prof.plan, 'free'),
      prof.polar_customer_id,
      prof.polar_subscription_id,
      prof.plan_renews_at
    ) returning id into new_org_id;

    insert into public.organization_members (organization_id, user_id, role)
    values (new_org_id, u.id, 'owner')
    on conflict do nothing;
  end loop;

  update public.campaigns c
  set organization_id = (
    select id from public.organizations o
    where o.owner_id = c.owner_id and o.is_personal = true
    limit 1
  )
  where c.organization_id is null;

  update public.custom_domains d
  set organization_id = (
    select id from public.organizations o
    where o.owner_id = d.user_id and o.is_personal = true
    limit 1
  )
  where d.organization_id is null;
end;
$$;

alter table public.campaigns alter column organization_id set not null;
alter table public.custom_domains alter column organization_id set not null;

alter table public.profiles drop column if exists plan;
alter table public.profiles drop column if exists polar_customer_id;
alter table public.profiles drop column if exists polar_subscription_id;
alter table public.profiles drop column if exists plan_renews_at;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invitations enable row level security;

drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member" on public.organizations
  for select using (
    exists (select 1 from public.organization_members m where m.organization_id = organizations.id and m.user_id = auth.uid())
  );

drop policy if exists "organizations_update_owner" on public.organizations;
create policy "organizations_update_owner" on public.organizations
  for update using (owner_id = auth.uid());

drop policy if exists "organizations_delete_owner" on public.organizations;
create policy "organizations_delete_owner" on public.organizations
  for delete using (owner_id = auth.uid());

drop policy if exists "organizations_insert_self" on public.organizations;
create policy "organizations_insert_self" on public.organizations
  for insert with check (owner_id = auth.uid());

drop policy if exists "organization_members_select" on public.organization_members;
create policy "organization_members_select" on public.organization_members
  for select using (
    exists (select 1 from public.organization_members me where me.organization_id = organization_members.organization_id and me.user_id = auth.uid())
  );

drop policy if exists "organization_members_admin_write" on public.organization_members;
create policy "organization_members_admin_write" on public.organization_members
  for all using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = organization_members.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
    )
  );

drop policy if exists "invitations_select_member" on public.organization_invitations;
create policy "invitations_select_member" on public.organization_invitations
  for select using (
    exists (select 1 from public.organization_members m where m.organization_id = organization_invitations.organization_id and m.user_id = auth.uid())
  );

drop policy if exists "invitations_admin_write" on public.organization_invitations;
create policy "invitations_admin_write" on public.organization_invitations
  for all using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = organization_invitations.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
    )
  );

drop policy if exists "campaigns_select_member" on public.campaigns;
create policy "campaigns_select_member" on public.campaigns
  for select using (
    exists (select 1 from public.organization_members m where m.organization_id = campaigns.organization_id and m.user_id = auth.uid())
  );

drop policy if exists "campaigns_admin_write" on public.campaigns;
create policy "campaigns_admin_write" on public.campaigns
  for all using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = campaigns.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'member')
    )
  );

drop policy if exists "custom_domains_select_own" on public.custom_domains;
drop policy if exists "custom_domains_insert_own" on public.custom_domains;
drop policy if exists "custom_domains_update_own" on public.custom_domains;
drop policy if exists "custom_domains_delete_own" on public.custom_domains;

create policy "custom_domains_select_member" on public.custom_domains
  for select using (
    exists (select 1 from public.organization_members m where m.organization_id = custom_domains.organization_id and m.user_id = auth.uid())
  );

create policy "custom_domains_admin_write" on public.custom_domains
  for all using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = custom_domains.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
    )
  );

-- ── 0004_ai_credits ──────────────────────────────────────────
alter table public.organizations
  add column if not exists ai_credits int not null default 0;

create table if not exists public.ai_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  delta int not null,
  reason text not null,
  reference_id text,
  created_at timestamptz not null default now()
);

create index if not exists ai_credit_ledger_org_idx on public.ai_credit_ledger (organization_id);
create index if not exists ai_credit_ledger_created_idx on public.ai_credit_ledger (created_at desc);

alter table public.ai_credit_ledger enable row level security;

create policy "ledger_select_member" on public.ai_credit_ledger
  for select using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = ai_credit_ledger.organization_id
        and m.user_id = auth.uid()
    )
  );

create or replace function public.increment_ai_credits(org_id uuid, amount int)
returns void
language sql
security definer
set search_path = public
as $$
  update public.organizations set ai_credits = ai_credits + amount where id = org_id;
$$;

create or replace function public.deduct_ai_credit(org_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance int;
begin
  update public.organizations
  set ai_credits = ai_credits - 1
  where id = org_id and ai_credits > 0
  returning ai_credits into new_balance;

  if not found then
    return -1;
  end if;
  return new_balance;
end;
$$;

-- ── 0005_rate_limits ─────────────────────────────────────────
create table if not exists public.rate_limits (
  key text primary key,
  count int not null default 1,
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;

create or replace function public.upsert_rate_limit(
  p_key text,
  p_window_start timestamptz,
  p_limit int
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  insert into public.rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
          when rate_limits.window_start < p_window_start then 1
          else rate_limits.count + 1
        end,
        window_start = case
          when rate_limits.window_start < p_window_start then now()
          else rate_limits.window_start
        end
  returning count into v_count;

  return jsonb_build_object(
    'ok', v_count <= p_limit,
    'remaining', greatest(0, p_limit - v_count)
  );
end;
$$;

-- ── 0006_domains_org ─────────────────────────────────────────
alter table public.custom_domains
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

create index if not exists custom_domains_org_idx on public.custom_domains (organization_id);

update public.custom_domains cd
set organization_id = om.organization_id
from public.organization_members om
where om.user_id = cd.user_id
  and om.role = 'owner'
  and cd.organization_id is null;

drop policy if exists "custom_domains_select_own" on public.custom_domains;
create policy "custom_domains_select_own" on public.custom_domains
  for select using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = custom_domains.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "custom_domains_insert_own" on public.custom_domains;
create policy "custom_domains_insert_own" on public.custom_domains
  for insert with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = custom_domains.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

drop policy if exists "custom_domains_update_own" on public.custom_domains;
create policy "custom_domains_update_own" on public.custom_domains
  for update using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = custom_domains.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

drop policy if exists "custom_domains_delete_own" on public.custom_domains;
create policy "custom_domains_delete_own" on public.custom_domains
  for delete using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = custom_domains.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- ── 0007_fix_rls_recursion ────────────────────────────────────
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

drop policy if exists "organization_members_select" on public.organization_members;
create policy "organization_members_select" on public.organization_members
  for select using (public.is_org_member(organization_id));

drop policy if exists "organization_members_admin_write" on public.organization_members;
create policy "organization_members_admin_write" on public.organization_members
  for all using (public.is_org_admin(organization_id));

drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member" on public.organizations
  for select using (public.is_org_member(id));

drop policy if exists "invitations_select_member" on public.organization_invitations;
create policy "invitations_select_member" on public.organization_invitations
  for select using (public.is_org_member(organization_id));

drop policy if exists "invitations_admin_write" on public.organization_invitations;
create policy "invitations_admin_write" on public.organization_invitations
  for all using (public.is_org_admin(organization_id));

drop policy if exists "campaigns_select_member" on public.campaigns;
create policy "campaigns_select_member" on public.campaigns
  for select using (public.is_org_member(organization_id));

drop policy if exists "campaigns_admin_write" on public.campaigns;
create policy "campaigns_admin_write" on public.campaigns
  for all using (public.is_org_member(organization_id));

drop policy if exists "ledger_select_member" on public.ai_credit_ledger;
create policy "ledger_select_member" on public.ai_credit_ledger
  for select using (public.is_org_member(organization_id));

drop policy if exists "custom_domains_select_member" on public.custom_domains;
create policy "custom_domains_select_member" on public.custom_domains
  for select using (public.is_org_member(organization_id));

drop policy if exists "custom_domains_admin_write" on public.custom_domains;
create policy "custom_domains_admin_write" on public.custom_domains
  for all using (public.is_org_admin(organization_id));

-- ── 0008_schema_cleanup ───────────────────────────────────────
-- (email already dropped below in 0009; kept here as no-op for completeness)
alter table public.custom_domains alter column user_id drop not null;

-- ── 0009_remove_stale_columns ─────────────────────────────────
alter table public.profiles drop column if exists email;
alter table public.profiles drop column if exists plan;
alter table public.profiles drop column if exists polar_customer_id;
alter table public.profiles drop column if exists polar_subscription_id;
alter table public.profiles drop column if exists plan_renews_at;

drop index if exists public.profiles_polar_customer_id_idx;
drop index if exists public.profiles_polar_subscription_id_idx;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

alter table public.campaigns drop column if exists owner_id;

drop index if exists public.custom_domains_user_id_idx;
alter table public.custom_domains drop column if exists user_id;

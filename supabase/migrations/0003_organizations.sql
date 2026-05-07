-- Organizations: multi-tenant workspaces. Every user has at least one
-- (their auto-created personal org). Plan + Polar identifiers move from
-- profiles to organizations — billing is per-org from now on.

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

-- Add organization_id to existing tables
alter table public.campaigns add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
create index if not exists campaigns_organization_id_idx on public.campaigns (organization_id);

alter table public.custom_domains add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
create index if not exists custom_domains_organization_id_idx on public.custom_domains (organization_id);

-- Auto-create personal org on user signup
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

  -- Auto-accept any pending invitations for this user's email
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

-- Backfill: create personal org for any existing user without one + migrate plan from profiles
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

  -- Backfill campaigns.organization_id from owner's personal org
  update public.campaigns c
  set organization_id = (
    select id from public.organizations o
    where o.owner_id = c.owner_id and o.is_personal = true
    limit 1
  )
  where c.organization_id is null;

  -- Backfill custom_domains.organization_id from user's personal org
  update public.custom_domains d
  set organization_id = (
    select id from public.organizations o
    where o.owner_id = d.user_id and o.is_personal = true
    limit 1
  )
  where d.organization_id is null;
end;
$$;

-- Now make org_id required (after backfill)
alter table public.campaigns alter column organization_id set not null;
alter table public.custom_domains alter column organization_id set not null;

-- Drop now-redundant plan columns from profiles (org is source of truth)
alter table public.profiles drop column if exists plan;
alter table public.profiles drop column if exists polar_customer_id;
alter table public.profiles drop column if exists polar_subscription_id;
alter table public.profiles drop column if exists plan_renews_at;

-- ── RLS ─────────────────────────────────────────────────────────────
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invitations enable row level security;

-- Members can read orgs they belong to
drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member" on public.organizations
  for select using (
    exists (select 1 from public.organization_members m where m.organization_id = organizations.id and m.user_id = auth.uid())
  );

-- Owners can update + delete
drop policy if exists "organizations_update_owner" on public.organizations;
create policy "organizations_update_owner" on public.organizations
  for update using (owner_id = auth.uid());

drop policy if exists "organizations_delete_owner" on public.organizations;
create policy "organizations_delete_owner" on public.organizations
  for delete using (owner_id = auth.uid());

-- Authenticated users can create new orgs (they become owner via app code)
drop policy if exists "organizations_insert_self" on public.organizations;
create policy "organizations_insert_self" on public.organizations
  for insert with check (owner_id = auth.uid());

-- Members can see fellow members (via co-membership)
drop policy if exists "organization_members_select" on public.organization_members;
create policy "organization_members_select" on public.organization_members
  for select using (
    exists (select 1 from public.organization_members me where me.organization_id = organization_members.organization_id and me.user_id = auth.uid())
  );

-- Owners + admins can manage members
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

-- Members can see invitations on their org
drop policy if exists "invitations_select_member" on public.organization_invitations;
create policy "invitations_select_member" on public.organization_invitations
  for select using (
    exists (select 1 from public.organization_members m where m.organization_id = organization_invitations.organization_id and m.user_id = auth.uid())
  );

-- Owners + admins can create / revoke invitations
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

-- Update campaigns RLS to be org-scoped (members can read; admins+ write)
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

-- Update custom_domains RLS to be org-scoped
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

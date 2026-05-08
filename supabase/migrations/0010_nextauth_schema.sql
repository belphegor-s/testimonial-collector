-- Migration: Replace Supabase Auth with NextAuth.js + public.users
--
-- Run order:
--   1. psql $DATABASE_URL < kudoso_data.sql        (Supabase schema+data dump)
--   2. psql $DATABASE_URL < 0010_nextauth_schema.sql  (this file)
--   3. \COPY public.users(id,name,email,created_at) FROM 'auth_users.csv' CSV HEADER
--   4. SELECT validate_constraint('profiles', 'profiles_id_fkey'); etc. (optional)
--
-- ── New tables ────────────────────────────────────────────────────────────────

create table if not exists public.users (
  id           text        primary key,
  name         text,
  email        text        unique not null,
  email_verified timestamptz,
  image        text,
  password     text,
  created_at   timestamptz not null default now()
);

create table if not exists public.accounts (
  id                   text    primary key,
  user_id              text    not null references public.users(id) on delete cascade,
  type                 text    not null,
  provider             text    not null,
  provider_account_id  text    not null,
  refresh_token        text,
  access_token         text,
  expires_at           integer,
  token_type           text,
  scope                text,
  id_token             text,
  session_state        text,
  unique (provider, provider_account_id)
);

create table if not exists public.password_reset_tokens (
  id         text        primary key,
  email      text        not null,
  token      text        unique not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sentiment_cache (
  id             uuid    primary key default gen_random_uuid(),
  campaign_id    uuid    not null references public.campaigns(id) on delete cascade,
  testimonial_id uuid    not null unique references public.testimonials(id) on delete cascade,
  sentiment      text    not null,
  score          real    not null,
  keywords       jsonb,
  emotion        text,
  created_at     timestamptz not null default now()
);

create table if not exists public.sentiment_aggregate (
  id               uuid    primary key default gen_random_uuid(),
  campaign_id      uuid    not null unique references public.campaigns(id) on delete cascade,
  overall_sentiment text   not null,
  avg_score        real    not null,
  top_themes       jsonb,
  top_praise       jsonb,
  top_concerns     jsonb,
  summary          text,
  analyzed_count   integer not null default 0,
  updated_at       timestamptz not null default now()
);

-- ── Rate limits table (if not yet created by 0005) ───────────────────────────
create table if not exists public.rate_limits (
  key          text        primary key,
  count        integer     not null default 1,
  window_start timestamptz not null default now()
);

-- ── Convert FK columns: uuid → text (to match public.users.id text) ──────────
-- Drop existing FK constraints that reference auth.users
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.organizations
  drop constraint if exists organizations_owner_id_fkey;

alter table public.organization_members
  drop constraint if exists organization_members_user_id_fkey;

alter table public.organization_invitations
  drop constraint if exists organization_invitations_invited_by_fkey;

-- Convert column types from uuid to text
alter table public.profiles
  alter column id type text using id::text;

alter table public.organizations
  alter column owner_id type text using owner_id::text;

alter table public.organization_members
  alter column user_id type text using user_id::text;

alter table public.organization_invitations
  alter column invited_by type text using invited_by::text;

-- Re-add FK constraints pointing to public.users
-- Using NOT VALID so this works before auth users are imported.
-- Run VALIDATE CONSTRAINT after step 3 above if you want full integrity checks.
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references public.users(id) on delete cascade
  not valid;

alter table public.organizations
  add constraint organizations_owner_id_fkey
  foreign key (owner_id) references public.users(id) on delete restrict
  not valid;

alter table public.organization_members
  add constraint organization_members_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade
  not valid;

alter table public.organization_invitations
  add constraint organization_invitations_invited_by_fkey
  foreign key (invited_by) references public.users(id) on delete set null
  not valid;

-- ── Drop Supabase auth trigger (only exists on Supabase) ─────────────────────
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ── Disable all RLS ───────────────────────────────────────────────────────────
alter table public.profiles                disable row level security;
alter table public.organizations           disable row level security;
alter table public.organization_members    disable row level security;
alter table public.organization_invitations disable row level security;
alter table public.campaigns               disable row level security;
alter table public.testimonials            disable row level security;
alter table public.custom_domains          disable row level security;
alter table public.ai_credit_ledger        disable row level security;

-- ── Drop all RLS policies ─────────────────────────────────────────────────────
drop policy if exists "profiles_select_own"           on public.profiles;
drop policy if exists "organizations_select_member"   on public.organizations;
drop policy if exists "organizations_update_owner"    on public.organizations;
drop policy if exists "organizations_delete_owner"    on public.organizations;
drop policy if exists "organizations_insert_self"     on public.organizations;
drop policy if exists "organization_members_select"   on public.organization_members;
drop policy if exists "organization_members_admin_write" on public.organization_members;
drop policy if exists "invitations_select_member"     on public.organization_invitations;
drop policy if exists "invitations_admin_write"       on public.organization_invitations;
drop policy if exists "campaigns_select_member"       on public.campaigns;
drop policy if exists "campaigns_admin_write"         on public.campaigns;
drop policy if exists "custom_domains_select_member"  on public.custom_domains;
drop policy if exists "custom_domains_admin_write"    on public.custom_domains;
drop policy if exists "ledger_select_member"          on public.ai_credit_ledger;
drop policy if exists "testimonials_select_own"       on public.testimonials;
drop policy if exists "testimonials_admin_write"      on public.testimonials;

-- ============================================================
-- Kudoso — fresh PostgreSQL bootstrap (Coolify, no Supabase)
-- Safe to re-run: uses IF NOT EXISTS throughout
-- ============================================================

-- users (NextAuth primary table; id is text/CUID)
create table if not exists public.users (
  id            text        primary key,
  name          text,
  email         text        not null unique,
  email_verified timestamptz,
  image         text,
  password      text,
  created_at    timestamptz not null default now()
);

-- accounts (OAuth provider links)
create table if not exists public.accounts (
  id                  text    primary key,
  user_id             text    not null references public.users(id) on delete cascade,
  type                text    not null,
  provider            text    not null,
  provider_account_id text    not null,
  refresh_token       text,
  access_token        text,
  expires_at          integer,
  token_type          text,
  scope               text,
  id_token            text,
  session_state       text,
  unique (provider, provider_account_id)
);

create index if not exists accounts_user_id_idx on public.accounts (user_id);

-- password reset tokens
create table if not exists public.password_reset_tokens (
  id         text        primary key,
  email      text        not null,
  token      text        not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- profiles (thin extension of users)
create table if not exists public.profiles (
  id         text        primary key references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- organizations
create table if not exists public.organizations (
  id                     uuid        primary key default gen_random_uuid(),
  name                   text        not null,
  slug                   text        not null unique,
  owner_id               text        not null references public.users(id) on delete restrict,
  plan                   text        not null default 'free',
  polar_customer_id      text,
  polar_subscription_id  text,
  plan_renews_at         timestamptz,
  is_personal            boolean     not null default false,
  ai_credits             integer     not null default 0,
  created_at             timestamptz not null default now()
);

create index if not exists organizations_owner_id_idx           on public.organizations (owner_id);
create index if not exists organizations_polar_customer_id_idx  on public.organizations (polar_customer_id);

-- organization members
create table if not exists public.organization_members (
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  user_id         text        not null references public.users(id) on delete cascade,
  role            text        not null default 'member',
  created_at      timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx on public.organization_members (user_id);

-- organization invitations
create table if not exists public.organization_invitations (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  email           text        not null,
  role            text        not null default 'member',
  invited_by      text        references public.users(id) on delete set null,
  token           text        not null unique,
  accepted_at     timestamptz,
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now()
);

create index if not exists organization_invitations_email_idx on public.organization_invitations (lower(email));
create unique index if not exists organization_invitations_unique_pending
  on public.organization_invitations (organization_id, lower(email))
  where accepted_at is null;

-- campaigns
create table if not exists public.campaigns (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null,
  brand_color      text,
  thank_you_message text,
  organization_id  uuid        not null references public.organizations(id) on delete cascade,
  logo_url         text,
  form_schema      jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists campaigns_organization_id_idx on public.campaigns (organization_id);

-- testimonials
create table if not exists public.testimonials (
  id             uuid        primary key default gen_random_uuid(),
  campaign_id    uuid        not null references public.campaigns(id) on delete cascade,
  customer_name  text        not null default '',
  customer_title text,
  content_type   text        not null default 'text',
  text_content   text,
  video_url      text,
  rating         integer     not null default 5,
  approved       boolean     not null default false,
  ai_summary     text,
  form_data      jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists testimonials_campaign_id_idx on public.testimonials (campaign_id);

-- custom domains
create table if not exists public.custom_domains (
  id                 uuid        primary key default gen_random_uuid(),
  organization_id    uuid        not null references public.organizations(id) on delete cascade,
  campaign_id        uuid        references public.campaigns(id) on delete set null,
  hostname           text        not null unique,
  verification_token text,
  verified_at        timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists custom_domains_hostname_idx on public.custom_domains (hostname);
create index if not exists custom_domains_org_id_idx   on public.custom_domains (organization_id);

-- AI credit ledger
create table if not exists public.ai_credit_ledger (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  delta           integer     not null,
  reason          text        not null,
  reference_id    text,
  created_at      timestamptz not null default now()
);

create index if not exists ai_credit_ledger_org_idx     on public.ai_credit_ledger (organization_id);
create index if not exists ai_credit_ledger_created_idx on public.ai_credit_ledger (created_at desc);

-- rate limits
create table if not exists public.rate_limits (
  key          text        primary key,
  count        integer     not null default 1,
  window_start timestamptz not null default now()
);

-- sentiment cache (per testimonial)
create table if not exists public.sentiment_cache (
  id             uuid        primary key default gen_random_uuid(),
  campaign_id    uuid        not null references public.campaigns(id) on delete cascade,
  testimonial_id uuid        not null unique references public.testimonials(id) on delete cascade,
  sentiment      text        not null,
  score          real        not null,
  keywords       jsonb,
  emotion        text,
  created_at     timestamptz not null default now()
);

create index if not exists sentiment_cache_campaign_id_idx on public.sentiment_cache (campaign_id);

-- sentiment aggregate (per campaign)
create table if not exists public.sentiment_aggregate (
  id                uuid        primary key default gen_random_uuid(),
  campaign_id       uuid        not null unique references public.campaigns(id) on delete cascade,
  overall_sentiment text        not null,
  avg_score         real        not null,
  top_themes        jsonb,
  top_praise        jsonb,
  top_concerns      jsonb,
  summary           text,
  analyzed_count    integer     not null default 0,
  updated_at        timestamptz not null default now()
);

-- ── Helper functions ──────────────────────────────────────────

create or replace function public.increment_ai_credits(org_id uuid, amount int)
returns void
language sql
as $$
  update public.organizations set ai_credits = ai_credits + amount where id = org_id;
$$;

create or replace function public.deduct_ai_credit(org_id uuid)
returns int
language plpgsql
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

create or replace function public.upsert_rate_limit(
  p_key text,
  p_window_start timestamptz,
  p_limit int
) returns jsonb
language plpgsql
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

-- Schema cleanup: drop all stale columns that are no longer read or written
-- by the application. All ownership is now via organization_id.

-- ── profiles ─────────────────────────────────────────────────────────────────
-- These were created in 0001 and should have been dropped in 0003 / 0008.
-- Re-drop defensively in case those migrations only partially ran.
alter table public.profiles drop column if exists email;
alter table public.profiles drop column if exists plan;
alter table public.profiles drop column if exists polar_customer_id;
alter table public.profiles drop column if exists polar_subscription_id;
alter table public.profiles drop column if exists plan_renews_at;

-- Drop the now-dead index (column is gone)
drop index if exists public.profiles_polar_customer_id_idx;
drop index if exists public.profiles_polar_subscription_id_idx;

-- Fix the handle_new_user trigger: it still referenced profiles.email which
-- no longer exists, causing every new signup to fail.
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

-- ── campaigns ────────────────────────────────────────────────────────────────
-- campaigns.owner_id: pre-orgs legacy column. All ownership now via
-- organization_id (set not null in 0003). The column is no longer selected,
-- filtered on, or joined — only inserted. Safe to remove.
alter table public.campaigns drop column if exists owner_id;

-- ── custom_domains ───────────────────────────────────────────────────────────
-- custom_domains.user_id: made nullable in 0008 because organization_id
-- became authoritative. No RLS policy references it. Drop it entirely.
drop index if exists public.custom_domains_user_id_idx;
alter table public.custom_domains drop column if exists user_id;

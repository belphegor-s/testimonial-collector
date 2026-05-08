-- Fix infinite recursion in organization_members RLS policies.
-- Policies that query organization_members from within organization_members
-- trigger themselves → stack overflow. Use security definer functions
-- (which bypass RLS) to check membership instead.

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

-- Replace recursive organization_members policies
drop policy if exists "organization_members_select" on public.organization_members;
create policy "organization_members_select" on public.organization_members
  for select using (public.is_org_member(organization_id));

drop policy if exists "organization_members_admin_write" on public.organization_members;
create policy "organization_members_admin_write" on public.organization_members
  for all using (public.is_org_admin(organization_id));

-- Also update other tables to use the same functions for consistency + performance
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

-- Add organization_id to custom_domains for multi-tenant support
alter table public.custom_domains
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

create index if not exists custom_domains_org_idx on public.custom_domains (organization_id);

-- Backfill: link existing domains to the owner's personal org
update public.custom_domains cd
set organization_id = om.organization_id
from public.organization_members om
where om.user_id = cd.user_id
  and om.role = 'owner'
  and cd.organization_id is null;

-- Update RLS: org members can see their org's domains
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

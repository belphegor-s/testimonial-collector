-- AI credits: per-org balance column + audit ledger
-- Free plan: 0 credits (no AI features)
-- Pro plan: 100 credits granted on subscription activation, monthly on renewal
-- Add-ons: purchasable packs of 50, 200, 500 credits

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

-- Atomic increment (service-role only, called server-side)
create or replace function public.increment_ai_credits(org_id uuid, amount int)
returns void
language sql
security definer
set search_path = public
as $$
  update public.organizations set ai_credits = ai_credits + amount where id = org_id;
$$;

-- Atomic deduct: returns new balance, or -1 if insufficient
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

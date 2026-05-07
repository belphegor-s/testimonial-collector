import 'server-only';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export const ACTIVE_ORG_COOKIE = 'kudoso-active-org';

export type OrgRole = 'owner' | 'admin' | 'member';
export type OrgPlan = 'free' | 'pro';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: OrgPlan;
  polar_customer_id: string | null;
  polar_subscription_id: string | null;
  plan_renews_at: string | null;
  is_personal: boolean;
  created_at: string;
};

export type ActiveOrg = Organization & { role: OrgRole };

export async function listMyOrgs(userId: string): Promise<ActiveOrg[]> {
  const sb = createAdminClient();
  const { data } = await sb
    .from('organization_members')
    .select('role, organizations:organization_id(*)')
    .eq('user_id', userId);
  if (!data) return [];

  return (data as unknown as Array<{ role: OrgRole; organizations: Organization }>).
    filter((row) => row.organizations).
    map((row) => ({ ...row.organizations, role: row.role })).
    sort((a, b) => {
      // Personal first, then alpha
      if (a.is_personal && !b.is_personal) return -1;
      if (!a.is_personal && b.is_personal) return 1;
      return a.name.localeCompare(b.name);
    });
}

export async function getActiveOrg(userId: string): Promise<ActiveOrg | null> {
  const orgs = await listMyOrgs(userId);
  if (orgs.length === 0) return null;

  const cookieStore = await cookies();
  const slug = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  if (slug) {
    const match = orgs.find((o) => o.slug === slug);
    if (match) return match;
  }
  // Default: first org (personal, sorted earlier)
  return orgs[0];
}

export async function getOrgBySlug(slug: string, userId: string): Promise<ActiveOrg | null> {
  const orgs = await listMyOrgs(userId);
  return orgs.find((o) => o.slug === slug) ?? null;
}

export async function getOrgById(id: string): Promise<Organization | null> {
  const sb = createAdminClient();
  const { data } = await sb.from('organizations').select('*').eq('id', id).maybeSingle();
  return (data ?? null) as Organization | null;
}

export async function isMember(orgId: string, userId: string): Promise<boolean> {
  const sb = createAdminClient();
  const { data } = await sb
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function getMemberRole(orgId: string, userId: string): Promise<OrgRole | null> {
  const sb = createAdminClient();
  const { data } = await sb
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();
  return ((data?.role as OrgRole | undefined) ?? null);
}

export async function requireRole(orgId: string, userId: string, allowed: OrgRole[]): Promise<OrgRole> {
  const role = await getMemberRole(orgId, userId);
  if (!role) throw new Error('Not a member of this organization');
  if (!allowed.includes(role)) throw new Error('Insufficient permissions');
  return role;
}

export async function canAccessCampaign(userId: string, campaignId: string): Promise<{ ok: boolean; orgId?: string; role?: OrgRole }> {
  const sb = createAdminClient();
  const { data: campaign } = await sb.from('campaigns').select('organization_id').eq('id', campaignId).maybeSingle();
  if (!campaign) return { ok: false };
  const role = await getMemberRole(campaign.organization_id, userId);
  if (!role) return { ok: false };
  return { ok: true, orgId: campaign.organization_id, role };
}

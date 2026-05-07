import { createAdminClient } from '@/lib/supabase/admin';
import { getActiveOrg } from '@/lib/org';
import type { OrgPlan } from '@/lib/org';

export type Plan = OrgPlan;

export const FREE_CAMPAIGN_LIMIT = 1;
export const FREE_TESTIMONIAL_LIMIT = 10;
export const FREE_MEMBER_LIMIT = 1; // solo only

export async function getOrgPlan(orgId: string): Promise<Plan> {
  const sb = createAdminClient();
  const { data } = await sb.from('organizations').select('plan').eq('id', orgId).maybeSingle();
  return (data?.plan as Plan | undefined) ?? 'free';
}

export async function getOrgCampaignCount(orgId: string): Promise<number> {
  const sb = createAdminClient();
  const { count } = await sb
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);
  return count ?? 0;
}

export async function getCampaignTestimonialCount(campaignId: string): Promise<number> {
  const sb = createAdminClient();
  const { count } = await sb
    .from('testimonials')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);
  return count ?? 0;
}

export async function assertCanCreateCampaign(orgId: string): Promise<{ ok: boolean; reason?: string }> {
  const plan = await getOrgPlan(orgId);
  if (plan === 'pro') return { ok: true };
  const count = await getOrgCampaignCount(orgId);
  if (count >= FREE_CAMPAIGN_LIMIT) {
    return {
      ok: false,
      reason: `The Free plan is limited to ${FREE_CAMPAIGN_LIMIT} campaign per organization. Upgrade to Pro for unlimited campaigns.`,
    };
  }
  return { ok: true };
}

export async function assertCanAcceptTestimonial(campaignId: string): Promise<{ ok: boolean; reason?: string }> {
  const sb = createAdminClient();
  const { data: campaign } = await sb
    .from('campaigns')
    .select('organization_id')
    .eq('id', campaignId)
    .maybeSingle();
  if (!campaign) return { ok: false, reason: 'Campaign not found' };

  const plan = await getOrgPlan(campaign.organization_id);
  if (plan === 'pro') return { ok: true };

  const count = await getCampaignTestimonialCount(campaignId);
  if (count >= FREE_TESTIMONIAL_LIMIT) {
    return {
      ok: false,
      reason: 'This campaign is currently not accepting new testimonials. Please reach out to the owner.',
    };
  }
  return { ok: true };
}

export async function assertCanInviteMember(orgId: string): Promise<{ ok: boolean; reason?: string }> {
  const plan = await getOrgPlan(orgId);
  if (plan === 'pro') return { ok: true };
  return {
    ok: false,
    reason: 'Inviting team members is a Pro feature. Upgrade to add collaborators.',
  };
}

export async function requirePro(userId: string): Promise<boolean> {
  const org = await getActiveOrg(userId);
  return (org?.plan ?? 'free') === 'pro';
}

// Compat wrappers for pages that read active org context via user ID
export async function getProfile(userId: string): Promise<{ plan: Plan; polar_customer_id: string | null }> {
  const org = await getActiveOrg(userId);
  return {
    plan: (org?.plan ?? 'free') as Plan,
    polar_customer_id: org?.polar_customer_id ?? null,
  };
}

export async function getCampaignCount(userId: string): Promise<number> {
  const org = await getActiveOrg(userId);
  if (!org) return 0;
  return getOrgCampaignCount(org.id);
}

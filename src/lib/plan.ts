import { eq, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { getActiveOrg } from '@/lib/org';
import type { OrgPlan } from '@/lib/org';

export type Plan = OrgPlan;

export const FREE_CAMPAIGN_LIMIT = 1;
export const FREE_TESTIMONIAL_LIMIT = 10;
export const FREE_MEMBER_LIMIT = 1;

export async function getOrgPlan(orgId: string): Promise<Plan> {
  const [row] = await db.select({ plan: schema.organizations.plan }).from(schema.organizations).where(eq(schema.organizations.id, orgId));
  return ((row?.plan as Plan | undefined) ?? 'free');
}

export async function getOrgCampaignCount(orgId: string): Promise<number> {
  const [row] = await db.select({ value: count() }).from(schema.campaigns).where(eq(schema.campaigns.organizationId, orgId));
  return row?.value ?? 0;
}

export async function getCampaignTestimonialCount(campaignId: string): Promise<number> {
  const [row] = await db.select({ value: count() }).from(schema.testimonials).where(eq(schema.testimonials.campaignId, campaignId));
  return row?.value ?? 0;
}

export async function assertCanCreateCampaign(orgId: string): Promise<{ ok: boolean; reason?: string }> {
  const plan = await getOrgPlan(orgId);
  if (plan === 'pro') return { ok: true };
  const c = await getOrgCampaignCount(orgId);
  if (c >= FREE_CAMPAIGN_LIMIT) {
    return {
      ok: false,
      reason: `The Free plan is limited to ${FREE_CAMPAIGN_LIMIT} campaign per organization. Upgrade to Pro for unlimited campaigns.`,
    };
  }
  return { ok: true };
}

export async function assertCanAcceptTestimonial(campaignId: string): Promise<{ ok: boolean; reason?: string }> {
  const [campaign] = await db
    .select({ organizationId: schema.campaigns.organizationId })
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, campaignId));
  if (!campaign) return { ok: false, reason: 'Campaign not found' };

  const plan = await getOrgPlan(campaign.organizationId);
  if (plan === 'pro') return { ok: true };

  const c = await getCampaignTestimonialCount(campaignId);
  if (c >= FREE_TESTIMONIAL_LIMIT) {
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

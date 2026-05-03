import { createAdminClient } from '@/lib/supabase/admin';

export type Plan = 'free' | 'pro';

export const FREE_CAMPAIGN_LIMIT = 1;
export const FREE_TESTIMONIAL_LIMIT = 10;

export type Profile = {
  id: string;
  email: string | null;
  plan: Plan;
  polar_customer_id: string | null;
  polar_subscription_id: string | null;
  plan_renews_at: string | null;
};

export async function getProfile(userId: string): Promise<Profile> {
  const sb = createAdminClient();
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  if (data) return data as Profile;

  // Fallback: profile trigger may not have run yet (seed/dev). Insert and return.
  const { data: inserted } = await sb
    .from('profiles')
    .insert({ id: userId, plan: 'free' })
    .select('*')
    .single();
  return (inserted ?? {
    id: userId,
    email: null,
    plan: 'free',
    polar_customer_id: null,
    polar_subscription_id: null,
    plan_renews_at: null,
  }) as Profile;
}

export async function getPlan(userId: string): Promise<Plan> {
  return (await getProfile(userId)).plan;
}

export async function getCampaignCount(userId: string): Promise<number> {
  const sb = createAdminClient();
  const { count } = await sb
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', userId);
  return count ?? 0;
}

export async function getTestimonialCount(campaignId: string): Promise<number> {
  const sb = createAdminClient();
  const { count } = await sb
    .from('testimonials')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);
  return count ?? 0;
}

export async function assertCanCreateCampaign(userId: string): Promise<{ ok: boolean; reason?: string }> {
  const plan = await getPlan(userId);
  if (plan === 'pro') return { ok: true };
  const count = await getCampaignCount(userId);
  if (count >= FREE_CAMPAIGN_LIMIT) {
    return {
      ok: false,
      reason: `The Free plan is limited to ${FREE_CAMPAIGN_LIMIT} campaign. Upgrade to Pro for unlimited campaigns.`,
    };
  }
  return { ok: true };
}

export async function assertCanAcceptTestimonial(campaignId: string): Promise<{ ok: boolean; reason?: string }> {
  const sb = createAdminClient();
  const { data: campaign } = await sb.from('campaigns').select('owner_id').eq('id', campaignId).single();
  if (!campaign) return { ok: false, reason: 'Campaign not found' };

  const plan = await getPlan(campaign.owner_id);
  if (plan === 'pro') return { ok: true };

  const count = await getTestimonialCount(campaignId);
  if (count >= FREE_TESTIMONIAL_LIMIT) {
    return {
      ok: false,
      reason: 'This campaign is currently not accepting new testimonials. Please reach out to the owner.',
    };
  }
  return { ok: true };
}

export async function requirePro(userId: string): Promise<boolean> {
  return (await getPlan(userId)) === 'pro';
}

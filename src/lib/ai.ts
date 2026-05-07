import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessCampaign } from '@/lib/org';
import { getOrgPlan } from '@/lib/plan';

export async function getAiCredits(orgId: string): Promise<number> {
  const sb = createAdminClient();
  const { data } = await sb.from('organizations').select('ai_credits').eq('id', orgId).maybeSingle();
  return data?.ai_credits ?? 0;
}

export async function grantAiCredits(orgId: string, delta: number, reason: string, referenceId?: string): Promise<void> {
  const sb = createAdminClient();
  await sb.rpc('increment_ai_credits', { org_id: orgId, amount: delta });
  await sb.from('ai_credit_ledger').insert({ organization_id: orgId, delta, reason, reference_id: referenceId ?? null });
}

export async function deductAiCredit(orgId: string, reason: string, referenceId?: string): Promise<{ ok: boolean; remaining: number }> {
  const sb = createAdminClient();
  const { data } = await sb.rpc('deduct_ai_credit', { org_id: orgId });
  if (data === null || data < 0) return { ok: false, remaining: 0 };
  await sb.from('ai_credit_ledger').insert({ organization_id: orgId, delta: -1, reason, reference_id: referenceId ?? null });
  return { ok: true, remaining: data };
}

export async function checkAiAccess(userId: string, campaignId: string): Promise<{ ok: boolean; reason?: string; orgId?: string }> {
  const access = await canAccessCampaign(userId, campaignId);
  if (!access.ok || !access.orgId) return { ok: false, reason: 'Campaign not found' };

  const plan = await getOrgPlan(access.orgId);
  if (plan === 'free') return { ok: false, reason: 'AI features require a Pro plan. Upgrade to unlock summaries and analytics.' };

  const credits = await getAiCredits(access.orgId);
  if (credits <= 0) return { ok: false, reason: 'No AI credits remaining. Purchase a credit pack from the billing page.' };

  return { ok: true, orgId: access.orgId };
}

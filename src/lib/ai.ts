import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { canAccessCampaign } from '@/lib/org';
import { getOrgPlan } from '@/lib/plan';

export async function getAiCredits(orgId: string): Promise<number> {
  const [row] = await db
    .select({ aiCredits: schema.organizations.aiCredits })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId));
  return row?.aiCredits ?? 0;
}

export async function grantAiCredits(orgId: string, delta: number, reason: string, referenceId?: string): Promise<void> {
  await db.update(schema.organizations)
    .set({ aiCredits: sql`ai_credits + ${delta}` })
    .where(eq(schema.organizations.id, orgId));
  await db.insert(schema.aiCreditLedger).values({
    organizationId: orgId,
    delta,
    reason,
    referenceId: referenceId ?? null,
  });
}

export async function deductAiCredit(orgId: string, reason: string, referenceId?: string): Promise<{ ok: boolean; remaining: number }> {
  const result = await db.execute<{ ai_credits: number }>(
    sql`UPDATE organizations SET ai_credits = ai_credits - 1 WHERE id = ${orgId} AND ai_credits > 0 RETURNING ai_credits`
  );
  const rows = result.rows ?? [];
  if (rows.length === 0) return { ok: false, remaining: 0 };
  const remaining = (rows[0] as any).ai_credits ?? 0;
  await db.insert(schema.aiCreditLedger).values({
    organizationId: orgId,
    delta: -1,
    reason,
    referenceId: referenceId ?? null,
  });
  return { ok: true, remaining };
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

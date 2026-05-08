import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { grantAiCredits } from '@/lib/ai';

export async function POST(req: Request) {
  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[polar/webhook] POLAR_WEBHOOK_SECRET missing');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  let event;
  try {
    event = validateEvent(body, headers, secret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return new Response('Invalid signature', { status: 401 });
    }
    throw err;
  }

  async function pickOrgId(data: any): Promise<string | null> {
    const orgId = data?.metadata?.organization_id as string | undefined;
    if (orgId) return orgId;
    const externalCustomerId = data?.customer?.externalId ?? data?.customer?.external_id ?? data?.externalCustomerId as string | undefined;
    return externalCustomerId ?? null;
  }

  switch (event.type) {
    case 'subscription.created':
    case 'subscription.updated':
    case 'subscription.active':
    case 'subscription.uncanceled': {
      const sub: any = (event as any).data;
      const orgId = await pickOrgId(sub);
      if (!orgId) break;
      const status = sub.status as string | undefined;
      const isActive = status === 'active' || status === 'trialing';

      const [org] = await db
        .select({ plan: schema.organizations.plan })
        .from(schema.organizations)
        .where(eq(schema.organizations.id, orgId));
      const wasAlreadyPro = org?.plan === 'pro';

      const periodEnd = sub.currentPeriodEnd ?? sub.current_period_end;
      await db.update(schema.organizations).set({
        plan: isActive ? 'pro' : 'free',
        polarCustomerId: sub.customerId ?? sub.customer?.id ?? null,
        polarSubscriptionId: sub.id ?? null,
        planRenewsAt: periodEnd ? new Date(periodEnd) : null,
      }).where(eq(schema.organizations.id, orgId));

      if (isActive && !wasAlreadyPro) {
        await grantAiCredits(orgId, 100, 'pro_monthly_grant', sub.id ?? undefined);
      }
      break;
    }

    case 'subscription.canceled': {
      const sub: any = (event as any).data;
      const orgId = await pickOrgId(sub);
      if (!orgId) break;
      const periodEnd = sub.currentPeriodEnd ?? sub.current_period_end;
      await db.update(schema.organizations).set({
        planRenewsAt: periodEnd ? new Date(periodEnd) : null,
      }).where(eq(schema.organizations.id, orgId));
      break;
    }

    case 'subscription.revoked': {
      const sub: any = (event as any).data;
      const orgId = await pickOrgId(sub);
      if (!orgId) break;
      await db.update(schema.organizations).set({
        plan: 'free',
        polarSubscriptionId: null,
        planRenewsAt: null,
        aiCredits: 0,
      }).where(eq(schema.organizations.id, orgId));
      break;
    }

    case 'order.paid': {
      const order: any = (event as any).data;
      const orgId = await pickOrgId(order);
      if (!orgId) break;
      const creditsStr = order?.product?.metadata?.credits as string | undefined;
      const credits = creditsStr ? parseInt(creditsStr, 10) : 0;
      const addonKey = order?.product?.metadata?.kudoso_addon as string | undefined;
      if (credits > 0 && addonKey) {
        await grantAiCredits(orgId, credits, `addon_${addonKey}`, order.id ?? undefined);
      }
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}

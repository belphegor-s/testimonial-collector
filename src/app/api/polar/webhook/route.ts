import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { createAdminClient } from '@/lib/supabase/admin';
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

  const sb = createAdminClient();

  async function pickOrgId(data: any): Promise<string | null> {
    const orgId = data?.metadata?.organization_id as string | undefined;
    if (orgId) return orgId;

    const externalCustomerId = data?.customer?.externalId ?? data?.customer?.external_id ?? data?.externalCustomerId as string | undefined;
    if (!externalCustomerId) return null;

    // externalCustomerId is the org ID (set in checkout)
    return externalCustomerId;
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

      const { data: org } = await sb.from('organizations').select('plan, ai_credits').eq('id', orgId).maybeSingle();
      const wasAlreadyPro = org?.plan === 'pro';

      await sb.from('organizations').update({
        plan: isActive ? 'pro' : 'free',
        polar_customer_id: sub.customerId ?? sub.customer?.id ?? null,
        polar_subscription_id: sub.id ?? null,
        plan_renews_at: sub.currentPeriodEnd ?? sub.current_period_end ?? null,
      }).eq('id', orgId);

      // Grant 100 AI credits on first Pro activation
      if (isActive && !wasAlreadyPro) {
        await grantAiCredits(orgId, 100, 'pro_monthly_grant', sub.id ?? undefined);
      }
      break;
    }

    case 'subscription.canceled': {
      const sub: any = (event as any).data;
      const orgId = await pickOrgId(sub);
      if (!orgId) break;
      // Keep Pro access until period end; just update renewal date
      await sb.from('organizations').update({
        plan_renews_at: sub.currentPeriodEnd ?? sub.current_period_end ?? null,
      }).eq('id', orgId);
      break;
    }

    case 'subscription.revoked': {
      const sub: any = (event as any).data;
      const orgId = await pickOrgId(sub);
      if (!orgId) break;
      await sb.from('organizations').update({
        plan: 'free',
        polar_subscription_id: null,
        plan_renews_at: null,
        ai_credits: 0,
      }).eq('id', orgId);
      break;
    }

    case 'order.paid': {
      // Handle one-time AI credit add-on purchases
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

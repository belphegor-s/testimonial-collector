import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { createAdminClient } from '@/lib/supabase/admin';

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

  // Helpers
  function pickUserId(data: any): string | null {
    return (
      data?.metadata?.user_id ||
      data?.customer?.externalId ||
      data?.customer?.external_id ||
      null
    );
  }

  switch (event.type) {
    case 'subscription.created':
    case 'subscription.updated':
    case 'subscription.active':
    case 'subscription.uncanceled': {
      const sub: any = (event as any).data;
      const userId = pickUserId(sub);
      if (!userId) break;
      const status = sub.status as string | undefined;
      const isActive = status === 'active' || status === 'trialing';
      await sb
        .from('profiles')
        .update({
          plan: isActive ? 'pro' : 'free',
          polar_customer_id: sub.customerId ?? sub.customer?.id ?? null,
          polar_subscription_id: sub.id ?? null,
          plan_renews_at: sub.currentPeriodEnd ?? sub.current_period_end ?? null,
        })
        .eq('id', userId);
      break;
    }

    case 'subscription.canceled':
    case 'subscription.revoked': {
      const sub: any = (event as any).data;
      const userId = pickUserId(sub);
      if (!userId) break;
      // For canceled: keep Pro until plan_renews_at (period end). For revoked: immediate downgrade.
      if (event.type === 'subscription.revoked') {
        await sb
          .from('profiles')
          .update({ plan: 'free', polar_subscription_id: null, plan_renews_at: null })
          .eq('id', userId);
      } else {
        await sb
          .from('profiles')
          .update({ plan_renews_at: sub.currentPeriodEnd ?? sub.current_period_end ?? null })
          .eq('id', userId);
      }
      break;
    }

    case 'checkout.created':
    case 'checkout.updated':
      // No-op; we rely on subscription events for plan flips.
      break;

    default:
      break;
  }

  return Response.json({ received: true });
}

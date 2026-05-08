import { auth } from '@/auth';
import { ensureProducts, ensureAddonProducts, polar, appUrl } from '@/lib/polar';
import { getActiveOrg } from '@/lib/org';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const activeOrg = await getActiveOrg(session.user.id!);
  if (!activeOrg) return Response.json({ error: 'No active organization' }, { status: 400 });

  let interval: 'month' | 'year' = 'month';
  let addonProduct: string | null = null;
  try {
    const body = await req.json();
    if (body?.interval === 'year') interval = 'year';
    if (body?.product && typeof body.product === 'string') addonProduct = body.product;
  } catch {}

  if (addonProduct) {
    let addonIds;
    try {
      addonIds = await ensureAddonProducts();
    } catch (err) {
      console.error('[polar/checkout] ensureAddonProducts failed', err);
      return Response.json({ error: 'Billing temporarily unavailable. Try again in a moment.' }, { status: 503 });
    }

    const productId = addonIds[addonProduct as keyof typeof addonIds];
    if (!productId) return Response.json({ error: 'Unknown product' }, { status: 400 });

    try {
      const session2 = await polar().checkouts.create({
        products: [productId],
        successUrl: `${appUrl()}/dashboard/billing?status=credits_added`,
        customerEmail: session.user.email ?? undefined,
        externalCustomerId: activeOrg.id,
        metadata: { organization_id: activeOrg.id, addon: addonProduct },
      });
      return Response.json({ url: session2.url });
    } catch (err) {
      console.error('[polar/checkout] addon create failed', err);
      return Response.json({ error: 'Could not start checkout' }, { status: 500 });
    }
  }

  let products;
  try {
    products = await ensureProducts();
  } catch (err) {
    console.error('[polar/checkout] ensureProducts failed', err);
    return Response.json({ error: 'Billing temporarily unavailable. Try again in a moment.' }, { status: 503 });
  }

  const productId = interval === 'year' ? products.pro_yearly : products.pro_monthly;

  try {
    const session2 = await polar().checkouts.create({
      products: [productId],
      successUrl: `${appUrl()}/dashboard/billing?status=success&checkout_id={CHECKOUT_ID}`,
      customerEmail: session.user.email ?? undefined,
      externalCustomerId: activeOrg.id,
      metadata: { organization_id: activeOrg.id, interval },
    });

    return Response.json({ url: session2.url });
  } catch (err) {
    console.error('[polar/checkout] create failed', err);
    return Response.json({ error: 'Could not start checkout' }, { status: 500 });
  }
}

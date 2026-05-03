import { createClient } from '@/lib/supabase/server';
import { ensureProducts, polar, appUrl } from '@/lib/polar';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let interval: 'month' | 'year' = 'month';
  try {
    const body = await req.json();
    if (body?.interval === 'year') interval = 'year';
  } catch {}

  let products;
  try {
    products = await ensureProducts();
  } catch (err) {
    console.error('[polar/checkout] ensureProducts failed', err);
    return Response.json({ error: 'Billing temporarily unavailable. Try again in a moment.' }, { status: 503 });
  }

  const productId = interval === 'year' ? products.pro_yearly : products.pro_monthly;

  try {
    const session = await polar().checkouts.create({
      products: [productId],
      successUrl: `${appUrl()}/dashboard/billing?status=success&checkout_id={CHECKOUT_ID}`,
      customerEmail: user.email ?? undefined,
      externalCustomerId: user.id,
      metadata: { user_id: user.id, interval },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error('[polar/checkout] create failed', err);
    return Response.json({ error: 'Could not start checkout' }, { status: 500 });
  }
}

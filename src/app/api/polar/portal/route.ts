import { createClient } from '@/lib/supabase/server';
import { polar } from '@/lib/polar';
import { getProfile } from '@/lib/plan';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await getProfile(user.id);
  if (!profile.polar_customer_id) {
    return Response.json({ error: 'No active subscription found.' }, { status: 400 });
  }

  try {
    const session = await polar().customerSessions.create({
      customerId: profile.polar_customer_id,
    });
    return Response.json({ url: session.customerPortalUrl });
  } catch (err) {
    console.error('[polar/portal] create failed', err);
    return Response.json({ error: 'Could not open billing portal' }, { status: 500 });
  }
}

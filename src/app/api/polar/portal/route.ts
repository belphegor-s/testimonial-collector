import { auth } from '@/auth';
import { polar } from '@/lib/polar';
import { getActiveOrg } from '@/lib/org';

export async function POST() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const activeOrg = await getActiveOrg(session.user.id!);
  if (!activeOrg?.polar_customer_id) {
    return Response.json({ error: 'No active subscription found.' }, { status: 400 });
  }

  try {
    const portalSession = await polar().customerSessions.create({
      customerId: activeOrg.polar_customer_id,
    });
    return Response.json({ url: portalSession.customerPortalUrl });
  } catch (err) {
    console.error('[polar/portal] create failed', err);
    return Response.json({ error: 'Could not open billing portal' }, { status: 500 });
  }
}

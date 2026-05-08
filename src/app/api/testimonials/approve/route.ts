import { auth } from '@/auth';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { canAccessCampaign } from '@/lib/org';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, approved } = await req.json();

  const [testimonial] = await db
    .select({ campaignId: schema.testimonials.campaignId })
    .from(schema.testimonials)
    .where(eq(schema.testimonials.id, id));

  if (!testimonial) return Response.json({ error: 'Not found' }, { status: 404 });

  const access = await canAccessCampaign(session.user.id!, testimonial.campaignId);
  if (!access.ok) return Response.json({ error: 'Forbidden' }, { status: 403 });

  await db.update(schema.testimonials).set({ approved }).where(eq(schema.testimonials.id, id));
  return Response.json({ success: true });
}

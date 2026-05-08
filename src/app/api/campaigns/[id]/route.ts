import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { canAccessCampaign } from '@/lib/org';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await canAccessCampaign(session.user.id!, id);
  if (!access.ok) return Response.json({ error: 'Not found' }, { status: 404 });

  const [campaign] = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, id));
  if (!campaign) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json(campaign);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await canAccessCampaign(session.user.id!, id);
  if (!access.ok) return Response.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const updates: Partial<typeof schema.campaigns.$inferInsert> = {};

  if ('name' in body) updates.name = body.name;
  if ('brand_color' in body) updates.brandColor = body.brand_color;
  if ('thank_you_message' in body) updates.thankYouMessage = body.thank_you_message;
  if ('logo_url' in body) updates.logoUrl = body.logo_url;
  if ('form_schema' in body) updates.formSchema = body.form_schema;

  if (Object.keys(updates).length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });

  await db.update(schema.campaigns).set(updates).where(eq(schema.campaigns.id, id));
  return Response.json({ ok: true });
}

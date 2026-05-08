import { auth } from '@/auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { getActiveOrg } from '@/lib/org';
import { assertCanCreateCampaign } from '@/lib/plan';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, brand_color, thank_you_message, organization_id } = body;

  if (!name || !organization_id) return Response.json({ error: 'name and organization_id required' }, { status: 400 });

  const gate = await assertCanCreateCampaign(organization_id);
  if (!gate.ok) return Response.json({ error: gate.reason }, { status: 403 });

  const [campaign] = await db.insert(schema.campaigns).values({
    name,
    brandColor: brand_color,
    thankYouMessage: thank_you_message,
    organizationId: organization_id,
  }).returning();

  return Response.json(campaign, { status: 201 });
}

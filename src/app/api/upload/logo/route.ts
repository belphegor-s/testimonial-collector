import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { canAccessCampaign } from '@/lib/org';
import { uploadToR2 } from '@/lib/cloudflare-r2';

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
const MAX_LOGO_SIZE = 2 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const campaignId = (form.get('campaignId') as string | null)?.trim();

  if (!file || !campaignId) {
    return Response.json({ error: 'file and campaignId required' }, { status: 400 });
  }

  if (file.size > MAX_LOGO_SIZE) {
    return Response.json({ error: 'Logo too large. Maximum 2MB.' }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
    return Response.json({ error: 'Invalid file type. Allowed: jpeg, png, webp, svg, gif.' }, { status: 400 });
  }

  const access = await canAccessCampaign(session.user.id!, campaignId);
  if (!access.ok) return Response.json({ error: 'Campaign not found' }, { status: 404 });

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const key = `logos/${campaignId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await uploadToR2(key, buffer, file.type);

  await db.update(schema.campaigns).set({ logoUrl: url }).where(eq(schema.campaigns.id, campaignId));

  return Response.json({ url });
}

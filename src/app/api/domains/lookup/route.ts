import { eq, isNotNull, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const host = (url.searchParams.get('host') || '').toLowerCase();
  if (!host) return Response.json({ campaignId: null }, { status: 400 });

  const [row] = await db
    .select({ campaignId: schema.customDomains.campaignId })
    .from(schema.customDomains)
    .where(and(
      eq(schema.customDomains.hostname, host),
      isNotNull(schema.customDomains.verifiedAt),
    ));

  return Response.json(
    { campaignId: row?.campaignId ?? null },
    { headers: { 'Cache-Control': 'public, s-maxage=30' } },
  );
}

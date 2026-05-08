import { eq, isNotNull, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROOT_HOSTS = new Set(['kudoso.io', 'www.kudoso.io']);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const domain = (url.searchParams.get('domain') || '').toLowerCase();
  if (!domain) return new Response('Bad request', { status: 400 });
  if (ROOT_HOSTS.has(domain) || domain.endsWith('.kudoso.io')) return new Response('OK', { status: 200 });

  const [row] = await db
    .select({ id: schema.customDomains.id })
    .from(schema.customDomains)
    .where(and(
      eq(schema.customDomains.hostname, domain),
      isNotNull(schema.customDomains.verifiedAt),
    ));

  return new Response(row ? 'OK' : 'Not allowed', { status: row ? 200 : 404 });
}

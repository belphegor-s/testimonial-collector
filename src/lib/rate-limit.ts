import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ ok: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - windowSec * 1000);

  try {
    const result = await db.execute<{ ok: boolean; remaining: number }>(
      sql`SELECT * FROM public.upsert_rate_limit(${key}, ${windowStart.toISOString()}::timestamptz, ${limit})`
    );
    const row = (result.rows ?? [])[0] as any;
    if (!row) return { ok: true, remaining: limit };
    return { ok: Boolean(row.ok), remaining: Number(row.remaining) };
  } catch (err) {
    console.error('rate limit error', err);
    return { ok: true, remaining: limit };
  }
}

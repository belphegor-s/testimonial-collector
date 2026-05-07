import { createAdminClient } from '@/lib/supabase/admin';

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<{ ok: boolean; remaining: number }> {
  const sb = createAdminClient();
  const windowStart = new Date(Date.now() - windowSec * 1000).toISOString();

  const { data, error } = await sb.rpc('upsert_rate_limit', {
    p_key: key,
    p_window_start: windowStart,
    p_limit: limit,
  });

  if (error) {
    console.error('rate limit error', error);
    return { ok: true, remaining: limit };
  }

  return { ok: data.ok, remaining: data.remaining };
}

import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const host = (url.searchParams.get('host') || '').toLowerCase();
  if (!host) return Response.json({ campaignId: null }, { status: 400 });

  const sb = createAdminClient();
  const { data } = await sb
    .from('custom_domains')
    .select('campaign_id, verified_at')
    .eq('hostname', host)
    .not('verified_at', 'is', null)
    .maybeSingle();

  return Response.json(
    { campaignId: data?.campaign_id ?? null },
    { headers: { 'Cache-Control': 'public, s-maxage=30' } },
  );
}

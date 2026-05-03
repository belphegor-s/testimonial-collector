import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROOT_HOSTS = new Set(['kudoso.io', 'www.kudoso.io']);

// Caddy on_demand_tls "ask" endpoint.
// Caddy will hit this with ?domain=<host> before issuing a Let's Encrypt cert.
// Return 200 if we recognize the domain, anything else otherwise.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const domain = (url.searchParams.get('domain') || '').toLowerCase();
  if (!domain) return new Response('Bad request', { status: 400 });
  if (ROOT_HOSTS.has(domain) || domain.endsWith('.kudoso.io')) return new Response('OK', { status: 200 });

  const sb = createAdminClient();
  const { data } = await sb
    .from('custom_domains')
    .select('id')
    .eq('hostname', domain)
    .not('verified_at', 'is', null)
    .maybeSingle();

  return new Response(data ? 'OK' : 'Not allowed', { status: data ? 200 : 404 });
}

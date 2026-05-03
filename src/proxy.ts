import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const ROOT_HOSTS = new Set([
  'kudoso.io',
  'www.kudoso.io',
  'localhost',
  'localhost:3000',
  'localhost:3001',
]);

function isAppHost(host: string) {
  if (ROOT_HOSTS.has(host)) return true;
  if (host.endsWith('.kudoso.io')) return true;
  if (host.endsWith('.vercel.app')) return true;
  if (host.endsWith('.ngrok-free.app')) return true;
  if (host.endsWith('.ngrok.app')) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase();

  // ── Custom-domain routing ────────────────────────────────────────
  if (host && !isAppHost(host)) {
    let campaignId: string | null = null;
    try {
      const lookup = new URL('/api/domains/lookup', request.nextUrl);
      lookup.searchParams.set('host', host);
      const res = await fetch(lookup, {
        headers: { 'x-internal-lookup': '1' },
        cache: 'no-store',
      });
      if (res.ok) {
        const json = (await res.json()) as { campaignId?: string | null };
        campaignId = json.campaignId ?? null;
      }
    } catch {
      /* ignore — fall through to 404 */
    }

    if (!campaignId) {
      return new NextResponse('Domain not configured for Kudoso', { status: 404 });
    }

    const url = request.nextUrl.clone();
    url.pathname = `/collect/${campaignId}`;
    return NextResponse.rewrite(url);
  }

  // ── App-host auth handling ───────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/domains/lookup|api/domains/caddy-ask|embed.js).*)'],
};

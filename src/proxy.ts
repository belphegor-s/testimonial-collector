import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

const { auth } = NextAuth(authConfig);

const ROOT_HOSTS = new Set(['kudoso.io', 'www.kudoso.io', 'localhost', '127.0.0.1']);

function isAppHost(host: string) {
  const bare = host.split(':')[0].toLowerCase();
  if (ROOT_HOSTS.has(bare)) return true;
  if (bare.endsWith('.kudoso.io')) return true;
  if (bare.endsWith('.vercel.app')) return true;
  if (bare.endsWith('.coolify.io')) return true;
  return false;
}

export default auth(async (req) => {
  const host = req.headers.get('host') || '';

  // Custom domain routing: rewrite to /collect/[campaignId]
  if (!isAppHost(host)) {
    try {
      const apiUrl = new URL('/api/domains/lookup', req.nextUrl.origin);
      apiUrl.searchParams.set('host', host.toLowerCase());
      const res = await fetch(apiUrl, { cache: 'no-store' });
      if (res.ok) {
        const { campaignId } = (await res.json()) as { campaignId?: string | null };
        if (campaignId) {
          const url = req.nextUrl.clone();
          url.pathname = `/collect/${campaignId}`;
          return NextResponse.rewrite(url);
        }
      }
    } catch {}
    return new NextResponse('Domain not configured for Kudoso', { status: 404 });
  }

  // Auth guard: dashboard requires login
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/dashboard') && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isLoggedIn && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|api/collect|api/embed|api/domains|_next/static|_next/image|favicon|icon|opengraph|collect|invitations|privacy|terms|pricing|login|signup|forgot-password|reset-password).*)'],
};

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import KudosoLogo from '@/components/KudosoLogo';

export default function MarketingNav({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-zinc-200/60">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <KudosoLogo size={26} />
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">kudoso</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 text-sm">
          <Link href="/pricing" className="text-zinc-600 hover:text-zinc-900 transition-colors px-2 py-1">
            Pricing
          </Link>
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 bg-zinc-900 text-white font-medium px-3.5 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Open dashboard <ArrowRight size={13} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-block text-zinc-600 hover:text-zinc-900 transition-colors px-2 py-1">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 bg-zinc-900 text-white font-medium px-3.5 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Start free <ArrowRight size={13} />
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

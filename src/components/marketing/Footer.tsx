import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 mt-24 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span className="font-semibold text-zinc-900 tracking-tight">kudoso</span>
          <span className="text-xs text-zinc-400 ml-2">© {new Date().getFullYear()}</span>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-zinc-500">
          <Link href="/pricing" className="hover:text-zinc-900 transition-colors">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-zinc-900 transition-colors">
            Sign in
          </Link>
          <a href="mailto:hello@kudoso.io" className="hover:text-zinc-900 transition-colors">
            Contact
          </a>
          <Link href="/privacy" className="hover:text-zinc-900 transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-zinc-900 transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

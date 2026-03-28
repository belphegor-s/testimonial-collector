import Link from 'next/link';

export default async function BuilderLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="fixed inset-0 z-50 bg-zinc-50 flex flex-col">
      {/* Mobile overlay — visible below md breakpoint */}
      <div className="flex md:hidden flex-col items-center justify-center flex-1 px-8 text-center">
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-zinc-300 mb-6"
          aria-hidden="true"
        >
          {/* Screen body */}
          <rect x="6" y="8" width="52" height="34" rx="3" />
          {/* Screen inner display */}
          <rect x="12" y="14" width="40" height="22" rx="1" className="text-zinc-200" />
          {/* Hinge line */}
          <line x1="2" y1="46" x2="62" y2="46" />
          {/* Keyboard base */}
          <path d="M10 46 L8 56 h48 L54 46" />
        </svg>

        <h2 className="text-base font-semibold text-zinc-800 mb-2">Best viewed on desktop</h2>
        <p className="text-sm text-zinc-400 mb-6 max-w-xs leading-relaxed">
          The form builder uses drag and drop, which works best on a larger screen.
        </p>
        <Link
          href={`/dashboard/campaigns/${id}`}
          className="text-sm text-zinc-500 border border-zinc-200 px-4 py-2.5 rounded-lg hover:border-zinc-300 hover:text-zinc-700 transition-colors"
        >
          Back to campaign
        </Link>
      </div>

      {/* Desktop builder — visible at md and above */}
      <div className="hidden md:flex flex-1 flex-col min-h-0">{children}</div>
    </div>
  );
}

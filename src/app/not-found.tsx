import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4">
      {/* Brand mark */}
      <div className="flex items-center gap-2 mb-12">
        <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
        <span className="text-sm font-semibold text-zinc-900">Testimonial Collector</span>
      </div>

      {/* Radar pulse SVG animation */}
      <svg
        width="160"
        height="160"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Ring 1 — starts immediately */}
        <circle cx="100" cy="100" r="0" stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0">
          <animate attributeName="r" from="0" to="80" dur="2.4s" begin="0s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.55" to="0" dur="2.4s" begin="0s" repeatCount="indefinite" />
        </circle>

        {/* Ring 2 — staggered 0.8s */}
        <circle cx="100" cy="100" r="0" stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0">
          <animate attributeName="r" from="0" to="80" dur="2.4s" begin="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.55" to="0" dur="2.4s" begin="0.8s" repeatCount="indefinite" />
        </circle>

        {/* Ring 3 — staggered 1.6s */}
        <circle cx="100" cy="100" r="0" stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0">
          <animate attributeName="r" from="0" to="80" dur="2.4s" begin="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.55" to="0" dur="2.4s" begin="1.6s" repeatCount="indefinite" />
        </circle>

        {/* X crosshair */}
        <line x1="93" y1="93" x2="107" y2="107" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="107" y1="93" x2="93" y2="107" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round" />

        {/* Center dot */}
        <circle cx="100" cy="100" r="4" fill="#10b981" />
      </svg>

      <h1 className="text-2xl font-semibold text-zinc-900 mt-8 mb-2">Page not found</h1>
      <p className="text-sm text-zinc-400 text-center max-w-xs mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Link
        href="/dashboard"
        className="bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

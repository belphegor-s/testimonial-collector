'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <div className="w-4 h-4 rounded-full bg-red-400" />
        </div>
        <h2 className="text-base font-semibold text-zinc-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-zinc-500 mb-6">An unexpected error occurred. Please try again.</p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Try again
          </button>
          <Link href="/" className="flex-1 border border-zinc-200 text-zinc-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-zinc-50 transition-colors">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

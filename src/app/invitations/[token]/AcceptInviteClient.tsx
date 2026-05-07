'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';
import { acceptInvitation } from '@/app/(dashboard)/dashboard/team/actions';

export default function AcceptInviteClient({ token }: { token: string }) {
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  function handleAccept() {
    setLoading(true);
    setError('');
    startTransition(async () => {
      try {
        await acceptInvitation(token);
        router.push('/dashboard');
        router.refresh();
      } catch (err: any) {
        setError(err.message ?? 'Failed to accept invitation');
        setLoading(false);
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleAccept}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        Accept and join
      </button>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}

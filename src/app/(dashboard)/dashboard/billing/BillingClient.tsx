'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, Zap } from 'lucide-react';

type Props =
  | { mode: 'upgrade' | 'manage' }
  | { mode: 'addon'; addonKey: string };

export default function BillingClient(props: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [interval, setInterval] = useState<'month' | 'year'>('month');

  async function startCheckout(body: Record<string, string>) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || 'Checkout failed');
      window.location.href = json.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  async function openPortal() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/polar/portal', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || 'Could not open portal');
      window.location.href = json.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  if (props.mode === 'addon') {
    return (
      <div>
        <button
          onClick={() => startCheckout({ product: props.addonKey })}
          disabled={loading}
          className="inline-flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors w-full justify-center"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
          Buy credits
        </button>
        {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
      </div>
    );
  }

  if (props.mode === 'manage') {
    return (
      <div>
        <p className="text-sm font-semibold text-zinc-900">Manage subscription</p>
        <p className="text-sm text-zinc-500 mt-1 mb-4">Update card, download invoices, or cancel via the customer portal.</p>
        <button
          onClick={openPortal}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Open billing portal
          <ArrowRight size={14} />
        </button>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  const yearly = interval === 'year';
  const price = yearly ? '$190' : '$19';
  const cadence = yearly ? 'per year' : 'per month';
  const sub = yearly ? '~17% off, 2 months free' : 'Cancel anytime';

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Upgrade to Pro</p>
          <p className="text-sm text-zinc-500 mt-1">Unlimited campaigns, testimonials, custom domains, AI credits.</p>
        </div>
        <div className="inline-flex bg-zinc-100 rounded-lg p-0.5 text-xs font-medium shrink-0">
          <button
            onClick={() => setInterval('month')}
            className={'px-3 py-1.5 rounded-md transition-colors ' + (!yearly ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700')}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('year')}
            className={'px-3 py-1.5 rounded-md transition-colors ' + (yearly ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700')}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-zinc-900">{price}</span>
        <span className="text-sm text-zinc-400">{cadence}</span>
      </div>
      <p className="text-xs text-zinc-400 mt-1 mb-5">{sub}</p>

      <button
        onClick={() => startCheckout({ interval })}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
        Continue to checkout
        <ArrowRight size={14} />
      </button>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}

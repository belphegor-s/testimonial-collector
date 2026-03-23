'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const PRESET_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#14b8a6'];

export default function NewCampaignPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [brandColor, setBrandColor] = useState('#10b981');
  const [thankYouMessage, setThankYouMessage] = useState('Thank you! Your testimonial means the world to us.');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase.from('campaigns').insert({ name, brand_color: brandColor, thank_you_message: thankYouMessage, owner_id: user.id }).select().single();

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(`/dashboard/campaigns/${data.id}`);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
          ← Back
        </Link>
        <h1 className="text-lg font-semibold text-zinc-900 mt-3">New campaign</h1>
        <p className="text-sm text-zinc-400 mt-0.5">A campaign generates a unique collection link for your customers</p>
      </div>

      <form onSubmit={handleCreate} className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Campaign name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Post-purchase feedback"
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Brand color</label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setBrandColor(color)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: color,
                  outline: brandColor === color ? `2px solid ${color}` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
            <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent" title="Custom color" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Thank you message</label>
          <textarea
            value={thankYouMessage}
            onChange={(e) => setThankYouMessage(e.target.value)}
            rows={2}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all resize-none"
          />
          <p className="text-xs text-zinc-400 mt-1">Shown to your customer after they submit</p>
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 transition-colors">
          {loading ? 'Creating...' : 'Create campaign'}
        </button>
      </form>
    </div>
  );
}

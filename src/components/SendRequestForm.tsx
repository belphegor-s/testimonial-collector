'use client';

import { useState } from 'react';

export function SendRequestForm({ campaignId }: { campaignId: string }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/emails/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, customerEmail: email, customerName: name }),
    });

    if (res.ok) {
      setSent(true);
      setEmail('');
      setName('');
    } else {
      const data = await res.json();
      setError(data.error ?? 'Failed to send');
    }
    setLoading(false);
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">Request a testimonial</p>
      <p className="text-xs text-zinc-400 mb-4">Send a branded email to your customer with the collection link</p>

      <form onSubmit={handleSend} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Customer name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Customer email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        {sent && <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">✓ Email sent successfully</p>}

        <button type="submit" disabled={loading} className="self-start bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-colors">
          {loading ? 'Sending...' : 'Send request'}
        </button>
      </form>
    </div>
  );
}

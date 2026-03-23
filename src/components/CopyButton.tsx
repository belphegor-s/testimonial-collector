'use client';

import { useState } from 'react';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={handleCopy} className="text-xs px-3 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 transition-colors whitespace-nowrap">
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

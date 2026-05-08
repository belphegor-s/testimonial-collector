'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Globe, Plus, Trash2, RefreshCw, Check, Copy, AlertCircle, Loader2 } from 'lucide-react';
import { addDomainAction, verifyDomainAction, deleteDomainAction } from './actions';
import Modal from '@/components/Modal';

type Campaign = { id: string; name: string };
type Domain = {
  id: string;
  hostname: string;
  campaign_id: string | null;
  verification_token: string | null;
  verified_at: string | null;
  created_at: string;
};

export default function DomainsClient({ campaigns, domains }: { campaigns: Campaign[]; domains: Domain[] }) {
  const [hostname, setHostname] = useState('');
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? '');
  const [adding, startAdd] = useTransition();
  const [error, setError] = useState('');
  const reduced = useReducedMotion();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const fd = new FormData();
    fd.set('hostname', hostname);
    fd.set('campaignId', campaignId);
    startAdd(async () => {
      const res = await addDomainAction(fd);
      if (!res.ok) setError(res.error || 'Failed to add domain');
      else setHostname('');
    });
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 border-dashed rounded-xl p-8 text-center">
        <p className="text-sm font-medium text-zinc-900">Create a campaign first</p>
        <p className="text-sm text-zinc-400 mt-1">You need at least one campaign before you can attach a custom domain.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-white border border-zinc-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-zinc-900 mb-1">Add a domain</p>
        <p className="text-xs text-zinc-400 mb-4">Point your custom domain to your campaign&apos;s collection page.</p>
        <div className="grid sm:grid-cols-[1fr_220px_auto] gap-2">
          <input
            type="text"
            required
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="reviews.yourbrand.com"
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
          />
          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all bg-white"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={adding}
            className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add domain
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
            <AlertCircle size={12} /> {error}
          </p>
        )}
      </form>

      {/* List */}
      {domains.length === 0 ? (
        <div className="bg-white border border-zinc-200 border-dashed rounded-xl p-8 text-center">
          <Globe size={20} className="text-zinc-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-zinc-900">No custom domains yet</p>
          <p className="text-sm text-zinc-400 mt-1">Add one above to get started.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {domains.map((d, i) => (
            <DomainRow
              key={d.id}
              domain={d}
              campaign={campaigns.find((c) => c.id === d.campaign_id)}
              index={i}
              reduced={!!reduced}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function DomainRow({ domain, campaign, index, reduced }: { domain: Domain; campaign?: Campaign; index: number; reduced: boolean }) {
  const [busy, startTrans] = useTransition();
  const [error, setError] = useState('');
  const [showInstructions, setShowInstructions] = useState(!domain.verified_at);
  const [pendingDelete, setPendingDelete] = useState(false);

  function verify() {
    setError('');
    startTrans(async () => {
      const res = await verifyDomainAction(domain.id);
      if (!res.ok) setError(res.error || 'Could not verify');
    });
  }

  function remove() {
    setError('');
    startTrans(async () => {
      const res = await deleteDomainAction(domain.id);
      if (!res.ok) {
        setError(res.error || 'Could not delete');
        setPendingDelete(false);
      }
    });
  }

  return (
    <>
      <motion.li
        initial={reduced ? undefined : { opacity: 0, y: 8 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={reduced ? undefined : { delay: index * 0.05, duration: 0.25 }}
        className="bg-white border border-zinc-200 rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 p-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-zinc-900 break-all">{domain.hostname}</p>
              {domain.verified_at ? (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                  <Check size={10} /> Verified
                </span>
              ) : (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wide">Pending DNS</span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">→ {campaign?.name ?? 'Unknown campaign'}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!domain.verified_at && (
              <button
                onClick={() => setShowInstructions((v) => !v)}
                className="text-xs text-zinc-500 border border-zinc-200 px-3 py-1.5 rounded-lg hover:border-zinc-300 hover:text-zinc-700 transition-colors"
              >
                {showInstructions ? 'Hide DNS' : 'Show DNS'}
              </button>
            )}
            {!domain.verified_at && (
              <button
                onClick={verify}
                disabled={busy}
                className="text-xs bg-zinc-900 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1"
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Verify
              </button>
            )}
            <button
              onClick={() => setPendingDelete(true)}
              disabled={busy}
              className="text-xs text-red-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
              aria-label="Remove domain"
              title="Remove domain"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showInstructions && !domain.verified_at && (
            <motion.div
              key="dns"
              initial={reduced ? undefined : { height: 0, opacity: 0 }}
              animate={reduced ? undefined : { height: 'auto', opacity: 1 }}
              exit={reduced ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 text-sm">
                <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-2">DNS setup</p>
                <p className="text-xs text-zinc-500 mb-3">Add <strong>either</strong> of these records, then click Verify. DNS changes can take a few minutes to propagate.</p>

                <div className="space-y-3">
                  <DnsRow label="Option A · CNAME (recommended)" type="CNAME" name={domain.hostname} value="proxy.kudoso.io" />
                  <DnsRow label="Option B · TXT (fallback)" type="TXT" name={`_kudoso-verify.${domain.hostname}`} value={domain.verification_token ?? ''} />
                </div>
                <p className="text-xs text-zinc-400 mt-3">SSL is provisioned automatically the first time someone visits your domain over HTTPS.</p>
                {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {error && !showInstructions && <p className="text-xs text-red-500 px-4 pb-3">{error}</p>}
      </motion.li>

      <Modal
        open={pendingDelete}
        onClose={() => setPendingDelete(false)}
        title={`Remove ${domain.hostname}?`}
        description="This removes the custom domain mapping. Your DNS records are not affected and can be cleaned up separately."
        confirmLabel="Remove domain"
        onConfirm={remove}
        busy={busy}
      />
    </>
  );
}

function DnsRow({ label, type, name, value }: { label: string; type: string; name: string; value: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3">
      <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr_auto] gap-2 items-center">
        <code className="text-xs font-mono bg-zinc-100 text-zinc-700 px-2 py-1 rounded">{type}</code>
        <code className="text-xs font-mono bg-zinc-100 text-zinc-700 px-2 py-1 rounded truncate">{name}</code>
        <div className="flex items-center gap-2 min-w-0">
          <code className="text-xs font-mono bg-zinc-100 text-zinc-700 px-2 py-1 rounded truncate flex-1">{value}</code>
          <CopyInline value={value} />
        </div>
      </div>
    </div>
  );
}

function CopyInline({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-zinc-400 hover:text-zinc-700 transition-colors p-1"
      aria-label="Copy"
    >
      {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
    </button>
  );
}

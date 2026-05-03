import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FREE_CAMPAIGN_LIMIT, FREE_TESTIMONIAL_LIMIT, getCampaignCount, getProfile } from '@/lib/plan';
import { createAdminClient } from '@/lib/supabase/admin';
import BillingClient from './BillingClient';
import { Check, Sparkles } from 'lucide-react';

export const metadata = { title: 'Billing' };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const profile = await getProfile(user.id);
  const campaignCount = await getCampaignCount(user.id);

  // Per-campaign testimonial usage (only for free plan)
  let usage: Array<{ id: string; name: string; count: number }> = [];
  if (profile.plan === 'free') {
    const sb = createAdminClient();
    const { data: campaigns } = await sb.from('campaigns').select('id, name').eq('owner_id', user.id);
    if (campaigns?.length) {
      const counts = await Promise.all(
        campaigns.map(async (c) => {
          const { count } = await sb.from('testimonials').select('*', { count: 'exact', head: true }).eq('campaign_id', c.id);
          return { id: c.id, name: c.name, count: count ?? 0 };
        }),
      );
      usage = counts;
    }
  }

  const sp = await searchParams;
  const justUpgraded = sp.status === 'success';

  const renews = profile.plan_renews_at ? new Date(profile.plan_renews_at) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Billing</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Manage your plan and subscription</p>
      </div>

      {justUpgraded && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-600 shrink-0" />
          Welcome to Pro. Your subscription is active — enjoy unlimited campaigns + custom domains.
        </div>
      )}

      {/* Current plan card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">Current plan</p>
            <p className="text-2xl font-semibold text-zinc-900 capitalize">
              {profile.plan === 'pro' ? 'Pro' : 'Free'}
            </p>
            {profile.plan === 'pro' && renews && (
              <p className="text-xs text-zinc-400 mt-1">Renews {renews.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            )}
            {profile.plan === 'free' && (
              <p className="text-xs text-zinc-400 mt-1">$0 / month</p>
            )}
          </div>
          <span
            className={
              profile.plan === 'pro'
                ? 'text-[11px] font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide'
                : 'text-[11px] font-medium px-2 py-1 rounded-full bg-zinc-100 text-zinc-600 uppercase tracking-wide'
            }
          >
            {profile.plan === 'pro' ? 'Active' : 'Free tier'}
          </span>
        </div>

        {profile.plan === 'free' ? (
          <div className="mt-5 grid gap-3">
            <UsageBar label="Campaigns" current={campaignCount} max={FREE_CAMPAIGN_LIMIT} />
            {usage.map((u) => (
              <UsageBar key={u.id} label={`Testimonials · ${u.name}`} current={u.count} max={FREE_TESTIMONIAL_LIMIT} />
            ))}
          </div>
        ) : null}
      </div>

      {/* Action card */}
      {profile.plan === 'free' ? (
        <UpgradeCard />
      ) : (
        <ManageCard />
      )}

      {/* Comparison */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">What you get</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
          <PlanColumn
            name="Free"
            price="$0"
            cadence="forever"
            features={[
              `${FREE_CAMPAIGN_LIMIT} campaign`,
              `${FREE_TESTIMONIAL_LIMIT} testimonials per campaign`,
              'Text + video collection',
              'AI summaries',
              'Embeddable widget',
            ]}
            current={profile.plan === 'free'}
          />
          <PlanColumn
            name="Pro"
            price="$19"
            cadence="per month"
            features={[
              'Unlimited campaigns',
              'Unlimited testimonials',
              'Custom domains',
              'AI sentiment analytics',
              'Priority support',
            ]}
            current={profile.plan === 'pro'}
            highlighted
          />
        </div>
      </div>
    </div>
  );
}

function UsageBar({ label, current, max }: { label: string; current: number; max: number }) {
  const pct = Math.min(100, Math.round((current / max) * 100));
  const danger = current >= max;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-zinc-500 truncate">{label}</span>
        <span className={danger ? 'text-red-600 font-medium' : 'text-zinc-700 font-medium'}>
          {current} / {max}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div className={(danger ? 'bg-red-500' : 'bg-emerald-500') + ' h-full'} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function UpgradeCard() {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <BillingClient mode="upgrade" />
    </div>
  );
}

function ManageCard() {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <BillingClient mode="manage" />
    </div>
  );
}

function PlanColumn({
  name,
  price,
  cadence,
  features,
  current,
  highlighted,
}: {
  name: string;
  price: string;
  cadence: string;
  features: string[];
  current: boolean;
  highlighted?: boolean;
}) {
  return (
    <div className={'p-5 ' + (highlighted ? 'bg-zinc-50/50' : '')}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-zinc-900">{name}</p>
        {current && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase tracking-wide">Current</span>}
      </div>
      <p className="text-2xl font-semibold text-zinc-900">
        {price}
        <span className="text-sm font-normal text-zinc-400 ml-1">/ {cadence}</span>
      </p>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-zinc-600">
            <Check size={14} className="text-emerald-600 mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

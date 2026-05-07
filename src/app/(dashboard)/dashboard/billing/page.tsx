import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FREE_CAMPAIGN_LIMIT, FREE_TESTIMONIAL_LIMIT, getOrgCampaignCount } from '@/lib/plan';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRecentOrders } from '@/lib/polar';
import { getActiveOrg } from '@/lib/org';
import { getAiCredits } from '@/lib/ai';
import BillingClient from './BillingClient';
import { Check, Sparkles, Receipt, ExternalLink, Zap } from 'lucide-react';

export const metadata = { title: 'Billing' };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const activeOrg = await getActiveOrg(user.id);
  if (!activeOrg) redirect('/login');

  const campaignCount = await getOrgCampaignCount(activeOrg.id);
  const aiCredits = await getAiCredits(activeOrg.id);

  let usage: Array<{ id: string; name: string; count: number }> = [];
  if (activeOrg.plan === 'free') {
    const sb = createAdminClient();
    const { data: campaigns } = await sb.from('campaigns').select('id, name').eq('organization_id', activeOrg.id);
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

  const orders = activeOrg.plan === 'pro' ? await getRecentOrders(activeOrg.id, 5) : [];

  const sp = await searchParams;
  const justUpgraded = sp.status === 'success';
  const creditsAdded = sp.status === 'credits_added';

  const renews = activeOrg.plan_renews_at ? new Date(activeOrg.plan_renews_at) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Billing</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Manage your plan and subscription</p>
      </div>

      {justUpgraded && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
          <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Welcome to Pro.</p>
            <p className="text-emerald-700/90 text-xs mt-0.5">
              It can take a few seconds for your plan to activate. Refresh if you don&apos;t see &ldquo;Pro&rdquo; below yet.
            </p>
          </div>
        </div>
      )}

      {creditsAdded && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
          <Zap size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">AI credits added.</p>
            <p className="text-emerald-700/90 text-xs mt-0.5">Your new credits will appear below shortly.</p>
          </div>
        </div>
      )}

      {/* Current plan */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">Current plan</p>
            <p className="text-2xl font-semibold text-zinc-900 capitalize">
              {activeOrg.plan === 'pro' ? 'Pro' : 'Free'}
            </p>
            {activeOrg.plan === 'pro' && renews && (
              <p className="text-xs text-zinc-400 mt-1">
                Renews {renews.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}
            {activeOrg.plan === 'free' && <p className="text-xs text-zinc-400 mt-1">$0 / month</p>}
          </div>
          <span
            className={
              activeOrg.plan === 'pro'
                ? 'text-[11px] font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide'
                : 'text-[11px] font-medium px-2 py-1 rounded-full bg-zinc-100 text-zinc-600 uppercase tracking-wide'
            }
          >
            {activeOrg.plan === 'pro' ? 'Active' : 'Free tier'}
          </span>
        </div>

        {activeOrg.plan === 'free' ? (
          <div className="mt-5 grid gap-3">
            <UsageBar label="Campaigns" current={campaignCount} max={FREE_CAMPAIGN_LIMIT} />
            {usage.length === 0 ? (
              <p className="text-xs text-zinc-400">Create a campaign to see testimonial usage here.</p>
            ) : (
              usage.map((u) => (
                <UsageBar key={u.id} label={`Testimonials - ${u.name}`} current={u.count} max={FREE_TESTIMONIAL_LIMIT} />
              ))
            )}
          </div>
        ) : null}
      </div>

      {/* AI Credits (Pro only) */}
      {activeOrg.plan === 'pro' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-emerald-600" />
                <p className="text-sm font-semibold text-zinc-900">AI Credits</p>
              </div>
              <p className="text-sm text-zinc-500">
                Used for AI summaries and sentiment analysis. You get 100 credits per billing cycle.
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-zinc-900">{aiCredits}</p>
              <p className="text-xs text-zinc-400">remaining</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <CreditPackCard amount={50} price="$5" addonKey="credits_50" />
            <CreditPackCard amount={200} price="$15" addonKey="credits_200" popular />
            <CreditPackCard amount={500} price="$29" addonKey="credits_500" />
          </div>
        </div>
      )}

      {/* Action card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <BillingClient mode={activeOrg.plan === 'pro' ? 'manage' : 'upgrade'} />
      </div>

      {/* Invoices (Pro) */}
      {activeOrg.plan === 'pro' && (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Receipt size={14} className="text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-900">Recent invoices</h2>
            </div>
            <span className="text-xs text-zinc-400">Last {orders.length || '0'}</span>
          </div>
          {orders.length === 0 ? (
            <div className="px-5 py-6 text-sm text-zinc-500">
              No invoices yet. Your first one appears here after your first charge.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {orders.map((o) => (
                <div key={o.id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-zinc-900 font-medium truncate">{o.productName}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {o.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {o.invoiceNumber ? ` - ${o.invoiceNumber}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-zinc-700 font-medium">{formatMoney(o.totalAmount, o.currency)}</span>
                    <span
                      className={
                        'text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide ' +
                        (o.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500')
                      }
                    >
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50">
            <p className="text-xs text-zinc-500 inline-flex items-center gap-1">
              Download PDFs from the billing portal <ExternalLink size={11} />
            </p>
          </div>
        </div>
      )}

      {/* Plan comparison */}
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
              'Embeddable widget',
            ]}
            current={activeOrg.plan === 'free'}
          />
          <PlanColumn
            name="Pro"
            price="$19"
            cadence="per month"
            features={[
              'Unlimited campaigns + testimonials',
              'Custom domains',
              '100 AI credits per month',
              'Sentiment analytics',
              'Team members',
            ]}
            current={activeOrg.plan === 'pro'}
            highlighted
          />
        </div>
        <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/30 text-xs text-zinc-500">
          Need to compare more? See <Link href="/pricing" className="text-zinc-700 hover:text-zinc-900 transition-colors underline underline-offset-2">full pricing</Link>.
        </div>
      </div>
    </div>
  );
}

function CreditPackCard({ amount, price, addonKey, popular }: { amount: number; price: string; addonKey: string; popular?: boolean }) {
  return (
    <div className={`relative rounded-xl border p-4 ${popular ? 'border-emerald-200 bg-emerald-50/50' : 'border-zinc-200 bg-white'}`}>
      {popular && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-wide">
          Best value
        </span>
      )}
      <div className="flex items-center gap-1 mb-1">
        <Zap size={12} className="text-emerald-600" />
        <p className="text-sm font-semibold text-zinc-900">{amount} credits</p>
      </div>
      <p className="text-xl font-semibold text-zinc-900 mb-3">{price}</p>
      <BillingClient mode="addon" addonKey={addonKey} />
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

function formatMoney(amountCents: number, currency: string) {
  const major = amountCents / 100;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(major);
  } catch {
    return `${currency.toUpperCase()} ${major.toFixed(2)}`;
  }
}

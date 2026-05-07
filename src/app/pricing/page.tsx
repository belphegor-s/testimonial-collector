import Link from 'next/link';
import { ArrowRight, Check, Minus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrg } from '@/lib/org';
import MarketingNav from '@/components/marketing/MarketingNav';
import Footer from '@/components/marketing/Footer';
import PricingToggle from './PricingToggle';

export const metadata = { title: 'Pricing' };

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loggedIn = !!user;
  const activeOrg = user ? await getActiveOrg(user.id) : null;
  const isPro = activeOrg?.plan === 'pro';

  const rows: Array<{ label: string; free: string | boolean; pro: string | boolean }> = [
    { label: 'Campaigns', free: '1', pro: 'Unlimited' },
    { label: 'Testimonials per campaign', free: '10', pro: 'Unlimited' },
    { label: 'Text testimonials', free: true, pro: true },
    { label: 'Video testimonials', free: true, pro: true },
    { label: 'AI summaries', free: false, pro: '100 credits/mo included' },
    { label: 'Embeddable widget', free: true, pro: true },
    { label: 'Mobile-friendly forms', free: true, pro: true },
    { label: 'Sentiment analytics', free: false, pro: 'Included in credits' },
    { label: 'AI credit top-ups', free: false, pro: 'Available as add-ons' },
    { label: 'Custom domains', free: false, pro: 'Up to 5' },
    { label: 'Team members', free: false, pro: true },
    { label: 'Priority support', free: false, pro: true },
  ];

  return (
    <div className="bg-white text-zinc-900">
      <MarketingNav loggedIn={loggedIn} />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-900 leading-tight">Free until you grow.</h1>
          <p className="text-zinc-500 mt-4 text-lg">Start free. Upgrade when you outgrow it. Cancel any time.</p>
        </div>

        <PricingToggle loggedIn={loggedIn} isPro={isPro} />
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1.4fr_1fr_1fr] text-sm font-semibold text-zinc-900 px-6 py-4 border-b border-zinc-100 bg-zinc-50/60">
            <div>Compare features</div>
            <div className="text-center">Free</div>
            <div className="text-center">Pro</div>
          </div>
          <div className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <div key={r.label} className="grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_1fr] gap-2 px-6 py-3 text-sm">
                <div className="text-zinc-700 col-span-2 sm:col-span-1">{r.label}</div>
                <div className="text-zinc-600 sm:text-center">
                  <span className="sm:hidden text-xs text-zinc-400 mr-2">Free:</span>
                  <Cell value={r.free} />
                </div>
                <div className="text-zinc-900 sm:text-center font-medium">
                  <span className="sm:hidden text-xs text-zinc-400 mr-2">Pro:</span>
                  <Cell value={r.pro} highlight />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href={loggedIn ? (isPro ? '/dashboard/billing' : '/dashboard/billing') : '/signup'}
            className="inline-flex items-center gap-2 bg-zinc-900 text-white font-medium px-5 py-3 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            {loggedIn ? (isPro ? 'Manage subscription' : 'Upgrade in dashboard') : 'Start free'} <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-8 text-center">Pricing FAQ</h2>
          <div className="space-y-2">
            <Faq q="What payment methods do you take?" a="All major cards via Polar (Stripe-equivalent processor for software). Apple Pay and Google Pay are supported in checkout." />
            <Faq q="Can I switch between monthly and yearly?" a="Yes. Switch any time from the billing portal. Proration happens automatically." />
            <Faq q="Is there a refund policy?" a="14-day, no-questions refund. Just email hello@kudoso.io." />
            <Faq q="Do you charge per testimonial?" a="No. Pro is unlimited. Free is capped at 10 per campaign so you can try the product end to end." />
            <Faq q="Do my testimonials disappear if I downgrade?" a="No. Your data stays. You'll just hit the Free limits again. Submissions past 10 will be paused until you re-upgrade." />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Cell({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (value === true) return <Check size={15} className={'inline-block ' + (highlight ? 'text-emerald-600' : 'text-emerald-600')} />;
  if (value === false) return <Minus size={14} className="inline-block text-zinc-300" />;
  return <span>{value}</span>;
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group bg-white border border-zinc-200 rounded-xl px-5 py-4 [&[open]]:shadow-sm transition-shadow">
      <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-medium text-zinc-900">
        {q}
        <span className="text-zinc-400 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
      </summary>
      <p className="text-sm text-zinc-600 leading-relaxed mt-3">{a}</p>
    </details>
  );
}

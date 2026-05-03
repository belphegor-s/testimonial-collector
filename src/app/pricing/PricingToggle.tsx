'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

export default function PricingToggle({ loggedIn, isPro }: { loggedIn: boolean; isPro: boolean }) {
  const [yearly, setYearly] = useState(false);
  const proPrice = yearly ? '$190' : '$19';
  const proCadence = yearly ? 'per year' : 'per month';
  const proSub = yearly ? '~17% off · 2 months free' : 'Cancel anytime';

  return (
    <div className="mt-10">
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-zinc-100 rounded-lg p-0.5 text-sm font-medium">
          <button
            onClick={() => setYearly(false)}
            className={'px-4 py-1.5 rounded-md transition-colors ' + (!yearly ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700')}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={'px-4 py-1.5 rounded-md transition-colors inline-flex items-center gap-1.5 ' + (yearly ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700')}
          >
            Yearly
            <span className={'text-[10px] font-medium px-1 py-0.5 rounded ' + (yearly ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-100 text-emerald-700')}>−17%</span>
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
        <PriceCard
          title="Free"
          price="$0"
          cadence="forever"
          sub="No credit card required"
          features={['1 campaign', '10 testimonials per campaign', 'Text + video collection', 'AI summaries', 'Embeddable widget']}
          cta={loggedIn ? 'In your dashboard' : 'Start free'}
          ctaDisabled={loggedIn}
          href={loggedIn ? '#' : '/signup'}
        />
        <PriceCard
          title="Pro"
          price={proPrice}
          cadence={proCadence}
          sub={proSub}
          features={['Unlimited campaigns', 'Unlimited testimonials', 'Custom domains', 'Sentiment analytics', 'Priority support']}
          cta={isPro ? 'Current plan' : loggedIn ? 'Upgrade in dashboard' : 'Start free'}
          ctaDisabled={isPro}
          href={loggedIn ? '/dashboard/billing' : '/signup'}
          highlighted
        />
      </div>
    </div>
  );
}

function PriceCard({
  title,
  price,
  cadence,
  sub,
  features,
  cta,
  ctaDisabled,
  href,
  highlighted,
}: {
  title: string;
  price: string;
  cadence: string;
  sub: string;
  features: string[];
  cta: string;
  ctaDisabled?: boolean;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <div className={'rounded-2xl p-6 ' + (highlighted ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200')}>
      <p className={'text-sm font-semibold ' + (highlighted ? 'text-white' : 'text-zinc-900')}>{title}</p>
      <p className="mt-3">
        <span className={'text-4xl font-semibold ' + (highlighted ? 'text-white' : 'text-zinc-900')}>{price}</span>
        <span className={'text-sm ml-1 ' + (highlighted ? 'text-zinc-400' : 'text-zinc-500')}>/ {cadence}</span>
      </p>
      <p className={'text-xs mt-1 ' + (highlighted ? 'text-zinc-400' : 'text-zinc-400')}>{sub}</p>
      <ul className="mt-5 space-y-2">
        {features.map((f) => (
          <li key={f} className={'flex items-start gap-2 text-sm ' + (highlighted ? 'text-zinc-200' : 'text-zinc-600')}>
            <Check size={14} className={'mt-0.5 shrink-0 ' + (highlighted ? 'text-emerald-400' : 'text-emerald-600')} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {ctaDisabled ? (
        <div
          className={
            'mt-6 inline-flex w-full items-center justify-center gap-2 font-medium px-4 py-2.5 rounded-lg ' +
            (highlighted ? 'bg-white/10 text-white/80' : 'bg-zinc-100 text-zinc-500')
          }
        >
          {cta}
        </div>
      ) : (
        <Link
          href={href}
          className={
            'mt-6 inline-flex w-full items-center justify-center gap-2 font-medium px-4 py-2.5 rounded-lg transition-colors ' +
            (highlighted ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-700')
          }
        >
          {cta} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

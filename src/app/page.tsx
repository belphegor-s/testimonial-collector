import Link from 'next/link';
import { ArrowRight, Check, Code2, Globe, MessageSquareQuote, Smartphone, Sparkles, Star, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import MarketingNav from '@/components/marketing/MarketingNav';
import Footer from '@/components/marketing/Footer';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loggedIn = !!user;

  return (
    <div className="bg-white text-zinc-900">
      <MarketingNav loggedIn={loggedIn} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-emerald-50/40 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 relative">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full mb-6">
              <Sparkles size={12} /> Now with AI summaries + sentiment
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-zinc-900">
              Collect testimonials <br />
              your customers will <span className="text-emerald-600">brag about.</span>
            </h1>
            <p className="text-lg sm:text-xl text-zinc-500 mt-6 max-w-xl leading-relaxed">
              Beautiful, embeddable proof in minutes. Text, video, AI summaries — built for indie hackers, agencies, and creators who want to stop chasing screenshots.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8">
              {loggedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white font-medium px-5 py-3 rounded-lg hover:bg-zinc-700 transition-colors w-full sm:w-auto"
                >
                  Open dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white font-medium px-5 py-3 rounded-lg hover:bg-zinc-700 transition-colors w-full sm:w-auto"
                >
                  Start free <ArrowRight size={16} />
                </Link>
              )}
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 text-zinc-700 font-medium px-5 py-3 rounded-lg hover:bg-zinc-50 border border-zinc-200 transition-colors w-full sm:w-auto"
              >
                See pricing
              </Link>
            </div>
            <p className="text-xs text-zinc-400 mt-4">Free plan, no credit card. Pro $19/mo when you outgrow it.</p>
          </div>

          {/* Hero visual: testimonial card stack */}
          <HeroVisual />
        </div>
      </section>

      {/* Problem / Fix */}
      <section className="border-y border-zinc-200 bg-zinc-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-2 gap-10">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">The problem</p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 mb-4">Praise is everywhere. Proof is nowhere.</h2>
            <p className="text-zinc-600 leading-relaxed">
              Customers DM you. Email you. Tweet at you. Then you screenshot, paste, lose it, forget it, and your landing page still has lorem ipsum where the social proof should be.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-3">The fix</p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 mb-4">A link. A wall. Done.</h2>
            <p className="text-zinc-600 leading-relaxed">
              Send a link. Customers leave a written or video testimonial in seconds. Approve the good ones, drop a one-line embed on your site, ship.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center mb-3">How it works</p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center text-zinc-900 mb-12">Three steps. Five minutes.</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Step n="01" title="Build a form" body="Drag-and-drop blocks for name, rating, written or video testimonial, and any custom field." />
          <Step n="02" title="Share the link" body="Send your collection page over email, Slack, after-checkout — anywhere customers already are." />
          <Step n="03" title="Embed the wall" body="One line of HTML drops a beautiful, mobile-friendly testimonial wall onto your site." />
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-zinc-200 bg-zinc-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center mb-3">Everything you need</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center text-zinc-900 mb-12">Made for shipping, not configuring.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Feature icon={MessageSquareQuote} title="Text + video" body="Customers can leave a quick written quote or record a 30-second video right from their phone — no app required." />
            <Feature icon={Sparkles} title="AI summaries" body="Long testimonials get auto-condensed into one punchy line ready to paste on your landing page." />
            <Feature icon={Code2} title="Embed anywhere" body="One line of HTML. Masonry, carousel, or marquee. Light or dark. No iframes, fast everywhere." />
            <Feature icon={Globe} title="Custom domains" body="Serve forms on reviews.yourbrand.com with auto-provisioned SSL. (Pro plan.)" />
            <Feature icon={Smartphone} title="Mobile-first forms" body="Customers fill them out on whatever device they have. Forms are responsive and load fast." />
            <Feature icon={Star} title="Sentiment analytics" body="See what your customers actually love — recurring themes, top praise, top concerns. Built in." />
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center mb-3">Pricing</p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center text-zinc-900 mb-2">Free until you grow.</h2>
        <p className="text-center text-zinc-500 mb-12">No surprises, no per-testimonial pricing.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <PricingCard
            title="Free"
            price="$0"
            cadence="forever"
            features={['1 campaign', '10 testimonials per campaign', 'Text + video collection', 'AI summaries', 'Embed widget']}
            cta={loggedIn ? 'Open dashboard' : 'Start free'}
            href={loggedIn ? '/dashboard' : '/signup'}
          />
          <PricingCard
            title="Pro"
            price="$19"
            cadence="per month"
            features={['Unlimited campaigns', 'Unlimited testimonials', 'Custom domains', 'Sentiment analytics', 'Priority support']}
            cta={loggedIn ? 'Go to billing' : 'Start free trial'}
            href={loggedIn ? '/dashboard/billing' : '/signup'}
            highlighted
          />
        </div>

        <div className="text-center mt-6">
          <Link href="/pricing" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors inline-flex items-center gap-1">
            Compare plans <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-200 bg-zinc-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center text-zinc-900 mb-10">Common questions</h2>

          <div className="space-y-2">
            <Faq q="Do I need a credit card to start?" a="No. The Free plan lets you build one campaign and collect up to 10 testimonials with no card on file. Upgrade only if you outgrow the limits." />
            <Faq q="Can I cancel any time?" a="Yes. You can cancel from the customer billing portal in one click. You'll keep Pro access until the end of your current billing period." />
            <Faq q="Do you watermark embeds?" a="A small 'Powered by kudoso' link sits below your wall. It's discreet and helps us stay free for the long tail. Pro plan removes it on request." />
            <Faq q="How do custom domains work?" a="Add a CNAME pointing to proxy.kudoso.io (or a TXT record), and we'll provision SSL automatically. You can attach up to five domains on Pro." />
            <Faq q="What about refunds?" a="Email hello@kudoso.io within 14 days of upgrading and we'll refund you — no friction, no questions." />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-900 mb-4 leading-tight">
          Stop chasing screenshots. <br /> Start collecting proof.
        </h2>
        <p className="text-zinc-500 max-w-xl mx-auto mb-8">Build your first campaign in under five minutes. Free forever for one campaign.</p>
        <Link
          href={loggedIn ? '/dashboard' : '/signup'}
          className="inline-flex items-center gap-2 bg-zinc-900 text-white font-medium px-6 py-3.5 rounded-lg hover:bg-zinc-700 transition-colors"
        >
          {loggedIn ? 'Open dashboard' : 'Get started — free'} <ArrowRight size={16} />
        </Link>
      </section>

      <Footer />
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6">
      <p className="text-xs font-mono text-zinc-400 mb-3">{n}</p>
      <h3 className="text-base font-semibold text-zinc-900 mb-2">{title}</h3>
      <p className="text-sm text-zinc-600 leading-relaxed">{body}</p>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; body: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-300 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
        <Icon size={16} className="text-emerald-600" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{body}</p>
    </div>
  );
}

function PricingCard({
  title,
  price,
  cadence,
  features,
  cta,
  href,
  highlighted,
}: {
  title: string;
  price: string;
  cadence: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <div className={'rounded-2xl p-6 ' + (highlighted ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200')}>
      <div className="flex items-center justify-between mb-1">
        <p className={'text-sm font-semibold ' + (highlighted ? 'text-white' : 'text-zinc-900')}>{title}</p>
        {highlighted && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase tracking-wide">Recommended</span>}
      </div>
      <p className="mt-3">
        <span className={'text-3xl font-semibold ' + (highlighted ? 'text-white' : 'text-zinc-900')}>{price}</span>
        <span className={'text-sm ml-1 ' + (highlighted ? 'text-zinc-400' : 'text-zinc-500')}>/ {cadence}</span>
      </p>
      <ul className="mt-5 space-y-2">
        {features.map((f) => (
          <li key={f} className={'flex items-start gap-2 text-sm ' + (highlighted ? 'text-zinc-200' : 'text-zinc-600')}>
            <Check size={14} className={'mt-0.5 shrink-0 ' + (highlighted ? 'text-emerald-400' : 'text-emerald-600')} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={
          'mt-6 inline-flex w-full items-center justify-center gap-2 font-medium px-4 py-2.5 rounded-lg transition-colors ' +
          (highlighted ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-700')
        }
      >
        {cta} <ArrowRight size={14} />
      </Link>
    </div>
  );
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

function HeroVisual() {
  return (
    <div className="mt-16 relative" aria-hidden>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
        <Card name="Sarah J." title="PM at Loop" rating={5} body="It's the only tool I introduced this year that the whole team kept using past month one." />
        <Card name="Alex C." title="Founder, Streamline" rating={5} body="40% lift on landing-page conversion in six weeks. Plain-text testimonials punching way above their weight." featured />
        <Card name="Maria G." title="Head of Marketing" rating={4} body="The embed dropped right into our Webflow site. Looks like we built it ourselves." />
      </div>
    </div>
  );
}

function Card({ name, title, body, rating, featured }: { name: string; title: string; body: string; rating: number; featured?: boolean }) {
  return (
    <div className={'rounded-2xl p-5 border ' + (featured ? 'bg-zinc-900 border-zinc-900 text-white sm:scale-[1.03]' : 'bg-white border-zinc-200')}>
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={12} className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'} />
        ))}
      </div>
      <p className={'text-sm leading-relaxed mb-4 ' + (featured ? 'text-zinc-100' : 'text-zinc-700')}>&ldquo;{body}&rdquo;</p>
      <div className="flex items-center gap-2">
        <div className={'w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center ' + (featured ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-700')}>
          {name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className={'text-xs font-semibold ' + (featured ? 'text-white' : 'text-zinc-900')}>{name}</p>
          <p className={'text-[10px] ' + (featured ? 'text-zinc-400' : 'text-zinc-400')}>{title}</p>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import MarketingNav from '@/components/marketing/MarketingNav';
import Footer from '@/components/marketing/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Kudoso collects, uses, and protects your data.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-base font-semibold text-zinc-900 mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-zinc-600 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="bg-white text-zinc-900">
      <MarketingNav loggedIn={false} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="mb-12">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 mb-3">Privacy Policy</h1>
          <p className="text-sm text-zinc-400">Last updated: May 2026</p>
        </div>

        <div className="prose-zinc">
          <Section title="Overview">
            <p>
              Kudoso (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates kudoso.io and provides testimonial
              collection software for businesses. This policy explains what data we collect, why we collect it, and
              how we handle it. We believe privacy should be straightforward, so we&apos;ve written this to be readable
              rather than dense.
            </p>
            <p>
              Questions? Email us at <a href="mailto:hello@kudoso.io" className="text-zinc-900 underline underline-offset-2">hello@kudoso.io</a>.
            </p>
          </Section>

          <Section title="Data we collect">
            <p><strong className="text-zinc-800">Account data</strong> &mdash; When you create an account we store your email address and a hashed password (or, if you sign in with Google, your Google account identifier). We do not store your Google password.</p>
            <p><strong className="text-zinc-800">Testimonial content</strong> &mdash; When your customers submit testimonials through your Kudoso campaign pages, we store their name, email address (if requested), written responses, and video uploads. You own this content. We process it on your behalf.</p>
            <p><strong className="text-zinc-800">Usage data</strong> &mdash; We log page views, API request counts, and feature usage (e.g. number of campaigns created) to operate the service and detect abuse. We do not sell or share this data.</p>
            <p><strong className="text-zinc-800">Billing data</strong> &mdash; Payment processing is handled entirely by Polar / Stripe. We store only a customer identifier and subscription status returned by Polar. We never see or store full card numbers.</p>
            <p><strong className="text-zinc-800">Cookies</strong> &mdash; We set a session cookie for authentication (required to log in), an active-organization cookie to remember which workspace you&apos;re using, and no third-party advertising or tracking cookies.</p>
          </Section>

          <Section title="How we use your data">
            <p>We use the data we collect solely to operate and improve Kudoso:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Authenticating you and your team members</li>
              <li>Storing and displaying testimonials you&apos;ve collected</li>
              <li>Running AI analysis (summaries, sentiment) on testimonial content you explicitly trigger</li>
              <li>Sending transactional emails (new testimonial notifications, invitation emails, billing receipts)</li>
              <li>Detecting abuse and enforcing rate limits</li>
              <li>Improving product features based on aggregate, anonymized usage patterns</li>
            </ul>
            <p>We do not send marketing emails unless you have explicitly opted in. We do not sell your data or your customers&apos; data to any third party, ever.</p>
          </Section>

          <Section title="AI processing">
            <p>
              When you use AI features (testimonial summaries or sentiment analysis), the relevant testimonial text is sent to Anthropic&apos;s API for processing. Anthropic&apos;s privacy policy governs how they handle that content. We do not use your testimonials to train any AI model. AI features are opt-in and only available on the Pro plan.
            </p>
          </Section>

          <Section title="Third-party services">
            <p>We use the following sub-processors to operate Kudoso:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-zinc-200 rounded-lg overflow-hidden">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-zinc-700">Service</th>
                    <th className="text-left px-3 py-2 font-medium text-zinc-700">Purpose</th>
                    <th className="text-left px-3 py-2 font-medium text-zinc-700">Data shared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {[
                    ['Supabase', 'Database, auth, file storage', 'All app data (hosted on AWS eu-west-1)'],
                    ['Resend', 'Transactional email', 'Recipient email, email body'],
                    ['Anthropic', 'AI summaries + sentiment', 'Testimonial text (when you trigger AI)'],
                    ['Polar / Stripe', 'Payment processing', 'Name, email, payment data'],
                  ].map(([service, purpose, data]) => (
                    <tr key={service}>
                      <td className="px-3 py-2 font-medium text-zinc-800">{service}</td>
                      <td className="px-3 py-2 text-zinc-600">{purpose}</td>
                      <td className="px-3 py-2 text-zinc-600">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Data retention">
            <p>We retain your account data and testimonials for as long as your account is active. If you delete your account, we delete all associated data within 30 days, except where we are required to retain it for legal or accounting purposes (e.g. billing records for up to 7 years).</p>
            <p>Testimonial content submitted by your customers is retained until you delete the campaign or your account, whichever comes first.</p>
          </Section>

          <Section title="Your rights">
            <p>Depending on where you live, you may have rights including:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li><strong className="text-zinc-800">Access</strong> &mdash; request a copy of data we hold about you</li>
              <li><strong className="text-zinc-800">Correction</strong> &mdash; ask us to correct inaccurate data</li>
              <li><strong className="text-zinc-800">Deletion</strong> &mdash; request deletion of your account and associated data</li>
              <li><strong className="text-zinc-800">Portability</strong> &mdash; export your testimonial data in JSON or CSV</li>
              <li><strong className="text-zinc-800">Opt-out</strong> &mdash; opt out of any non-essential communications</li>
            </ul>
            <p>To exercise any of these rights, email <a href="mailto:hello@kudoso.io" className="text-zinc-900 underline underline-offset-2">hello@kudoso.io</a>. We will respond within 30 days.</p>
          </Section>

          <Section title="Security">
            <p>
              All data is encrypted in transit (TLS 1.2+) and at rest. We use row-level security in our database so your data is logically isolated from other customers. Passwords are hashed using bcrypt. We do not store plaintext credentials of any kind.
            </p>
            <p>
              If you discover a security vulnerability, please report it to <a href="mailto:hello@kudoso.io" className="text-zinc-900 underline underline-offset-2">hello@kudoso.io</a> rather than opening a public issue. We take security reports seriously and will respond promptly.
            </p>
          </Section>

          <Section title="Children">
            <p>Kudoso is not directed at children under 13. We do not knowingly collect personal data from children. If you believe a child has submitted data through a campaign page, contact us and we will delete it promptly.</p>
          </Section>

          <Section title="Changes to this policy">
            <p>We may update this policy from time to time. When we make material changes, we will notify you by email or by displaying a notice in the dashboard. The &ldquo;last updated&rdquo; date at the top of this page always reflects the current version.</p>
          </Section>

          <Section title="Contact">
            <p>
              Kudoso is operated by Ayush Sharma. For privacy-related questions or requests:<br />
              <a href="mailto:hello@kudoso.io" className="text-zinc-900 underline underline-offset-2">hello@kudoso.io</a>
            </p>
          </Section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

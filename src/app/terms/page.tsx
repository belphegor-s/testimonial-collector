import type { Metadata } from 'next';
import MarketingNav from '@/components/marketing/MarketingNav';
import Footer from '@/components/marketing/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms governing your use of Kudoso.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-base font-semibold text-zinc-900 mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-zinc-600 leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="bg-white text-zinc-900">
      <MarketingNav loggedIn={false} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="mb-12">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 mb-3">Terms of Service</h1>
          <p className="text-sm text-zinc-400">Last updated: May 2026</p>
        </div>

        <div className="prose-zinc">
          <Section title="Agreement">
            <p>
              By creating an account or using Kudoso at kudoso.io (&ldquo;the Service&rdquo;), you (&ldquo;User&rdquo;) agree to these Terms of Service (&ldquo;Terms&rdquo;). If you are using Kudoso on behalf of a company or organization, you represent that you have authority to bind that entity to these Terms.
            </p>
            <p>
              The Service is operated by Ayush Sharma (&ldquo;we&rdquo;, &ldquo;us&rdquo;). Questions: <a href="mailto:hello@kudoso.io" className="text-zinc-900 underline underline-offset-2">hello@kudoso.io</a>.
            </p>
          </Section>

          <Section title="What Kudoso is">
            <p>
              Kudoso is a software-as-a-service platform that lets you create testimonial collection campaigns, share links with your customers, collect written and video testimonials, and display them on your website via an embed widget. Optional Pro features include AI-powered summaries and sentiment analysis, custom domains, and team collaboration.
            </p>
          </Section>

          <Section title="Accounts and access">
            <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. Notify us immediately at hello@kudoso.io if you suspect unauthorized access.</p>
            <p>You may not share your account with others. Each individual who uses the Service must have their own account, unless you add them as a team member through the dashboard (Pro plan).</p>
            <p>You must be at least 13 years old to use Kudoso. If you are under 18, you represent that your parent or legal guardian has reviewed and agrees to these Terms on your behalf.</p>
          </Section>

          <Section title="Acceptable use">
            <p>You agree not to use Kudoso to:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Collect testimonials fraudulently or from people who have not consented</li>
              <li>Collect, store, or transmit sensitive personal data such as payment card numbers, government IDs, or health information through campaign forms</li>
              <li>Send spam or unsolicited messages to people who have not engaged with your business</li>
              <li>Violate any applicable law, including data protection laws in your jurisdiction</li>
              <li>Attempt to reverse-engineer, scrape, or otherwise extract data from the Service at scale</li>
              <li>Upload malware, malicious scripts, or content that infringes third-party intellectual property rights</li>
              <li>Resell or sublicense access to the Service without written permission</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these rules, with or without notice, depending on severity.</p>
          </Section>

          <Section title="Your content">
            <p>
              You retain ownership of all testimonial content, campaign data, and other content you create or collect through Kudoso (&ldquo;Your Content&rdquo;). By using the Service, you grant us a limited, non-exclusive, worldwide license to host, store, transmit, and display Your Content solely as necessary to provide the Service to you.
            </p>
            <p>
              You are responsible for ensuring you have the legal right to collect and use testimonials from your customers, including obtaining any required consents under applicable laws (e.g. GDPR, CCPA). Kudoso provides the technical tools; compliance with privacy laws is your responsibility.
            </p>
            <p>
              When you delete a campaign or close your account, we will delete Your Content within 30 days. Billing records may be retained longer as required by law.
            </p>
          </Section>

          <Section title="Plans and billing">
            <p><strong className="text-zinc-800">Free plan</strong> &mdash; Limited to 1 campaign and 10 testimonials per campaign. No AI features. No credit card required.</p>
            <p><strong className="text-zinc-800">Pro plan</strong> &mdash; $19/month or $190/year, billed through Polar. Includes unlimited campaigns and testimonials, custom domains, AI credits (100/month), and team collaboration. You may cancel at any time; access continues until the end of the current billing period. No prorated refunds for partial months except within our 14-day refund window.</p>
            <p><strong className="text-zinc-800">AI credit add-ons</strong> &mdash; One-time purchases of additional AI credits (50, 200, or 500 credits). Credits do not expire while your Pro subscription is active. Credits are non-refundable once consumed.</p>
            <p><strong className="text-zinc-800">Refund policy</strong> &mdash; If you upgrade and are not satisfied within 14 days, email hello@kudoso.io and we will issue a full refund, no questions asked. After 14 days, refunds are at our discretion.</p>
            <p>We may change pricing with 30 days notice. Changes will not affect your current billing period.</p>
          </Section>

          <Section title="AI features">
            <p>
              AI summaries and sentiment analysis are powered by Anthropic&apos;s Claude API. When you trigger an AI operation, the relevant testimonial text is sent to Anthropic for processing. You consent to this by using AI features. We do not use your testimonials to train AI models, and Anthropic&apos;s usage policies apply to the content you submit.
            </p>
            <p>AI outputs (summaries, sentiment scores) are provided as-is. They may contain errors. Do not rely on AI outputs as the sole basis for business decisions. You are responsible for reviewing AI-generated content before publishing it.</p>
          </Section>

          <Section title="Custom domains">
            <p>
              Pro users may connect custom domains to their campaign pages. You are responsible for ensuring you own or have the right to use any domain you connect. We provision SSL automatically but cannot guarantee uptime of third-party DNS providers or your domain registrar.
            </p>
          </Section>

          <Section title="Intellectual property">
            <p>
              Kudoso, its logo, and the software are owned by Ayush Sharma. These Terms do not grant you any rights to our trademarks, patents, copyrights, or other intellectual property except the limited right to use the Service as described herein.
            </p>
            <p>
              The embed widget code we provide is licensed to you under the MIT License for the purposes of displaying your testimonials on your website.
            </p>
          </Section>

          <Section title="Uptime and availability">
            <p>
              We target high availability but do not provide a formal SLA on the Free plan. We will make reasonable efforts to maintain uptime and notify users of planned downtime via status updates. The Service may be temporarily unavailable for maintenance, which we will endeavor to schedule during low-traffic hours.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              To the maximum extent permitted by applicable law, Kudoso and Ayush Sharma shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising from your use of the Service.
            </p>
            <p>
              Our total cumulative liability to you for any claims under these Terms shall not exceed the greater of (a) the amount you paid us in the 12 months before the claim arose, or (b) $100 USD.
            </p>
          </Section>

          <Section title="Disclaimer of warranties">
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Service will be error-free, uninterrupted, or that defects will be corrected.
            </p>
          </Section>

          <Section title="Termination">
            <p>You may close your account at any time from the dashboard settings or by emailing hello@kudoso.io.</p>
            <p>We may suspend or terminate your account immediately if you breach these Terms, engage in fraudulent activity, or if we are required to do so by law. We may also discontinue the Service with 90 days notice to registered users.</p>
          </Section>

          <Section title="Governing law">
            <p>
              These Terms are governed by the laws of India, without regard to its conflict-of-law provisions. Any disputes will be resolved in the courts of India. If you are located in the EU, you retain the right to bring a claim in your local courts under applicable consumer protection laws.
            </p>
          </Section>

          <Section title="Changes to these Terms">
            <p>
              We may update these Terms. When we make material changes, we will notify you by email at least 14 days before they take effect. Continued use of the Service after that date constitutes acceptance of the updated Terms. If you disagree with changes, you may close your account before they take effect.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              For questions about these Terms:<br />
              <a href="mailto:hello@kudoso.io" className="text-zinc-900 underline underline-offset-2">hello@kudoso.io</a>
            </p>
          </Section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

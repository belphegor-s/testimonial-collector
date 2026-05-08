import { auth } from '@/auth';
import { eq, count, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CopyButton } from '@/components/CopyButton';
import { SendRequestForm } from '@/components/SendRequestForm';
import { ArrowLeft } from 'lucide-react';
import CampaignDashboardClient from './CampaignDashboardClient';
import { canAccessCampaign } from '@/lib/org';

export default async function CampaignPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const access = await canAccessCampaign(session.user.id!, id);
  if (!access.ok) notFound();

  const [campaign] = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, id));
  if (!campaign) notFound();

  const initialData = await db
    .select()
    .from(schema.testimonials)
    .where(eq(schema.testimonials.campaignId, campaign.id))
    .orderBy(schema.testimonials.createdAt)
    .limit(20);

  const [[totalRow], [approvedRow], [videoRow]] = await Promise.all([
    db.select({ value: count() }).from(schema.testimonials).where(eq(schema.testimonials.campaignId, campaign.id)),
    db.select({ value: count() }).from(schema.testimonials).where(and(eq(schema.testimonials.campaignId, campaign.id), eq(schema.testimonials.approved, true))),
    db.select({ value: count() }).from(schema.testimonials).where(and(eq(schema.testimonials.campaignId, campaign.id), eq(schema.testimonials.contentType, 'video'))),
  ]);

  const total = totalRow?.value ?? 0;
  const approved = approvedRow?.value ?? 0;
  const pending = total - approved;
  const video = videoRow?.value ?? 0;

  const allRatings = initialData.filter((t) => t.rating > 0);
  const avgRating = allRatings.length > 0
    ? (allRatings.reduce((s, t) => s + t.rating, 0) / allRatings.length).toFixed(1)
    : '0';

  const collectionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/collect/${campaign.id}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  // Normalize to match existing component expectations
  const campaignData = {
    id: campaign.id,
    name: campaign.name,
    brand_color: campaign.brandColor,
    thank_you_message: campaign.thankYouMessage,
    logo_url: campaign.logoUrl,
    organization_id: campaign.organizationId,
    form_schema: campaign.formSchema,
    created_at: campaign.createdAt.toISOString(),
  };

  const normalizedTestimonials = initialData.map((t) => ({
    id: t.id,
    campaign_id: t.campaignId,
    customer_name: t.customerName,
    customer_title: t.customerTitle,
    content_type: t.contentType,
    text_content: t.textContent,
    video_url: t.videoUrl,
    rating: t.rating,
    approved: t.approved,
    ai_summary: t.aiSummary,
    form_data: t.formData,
    created_at: t.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors flex items-center gap-2">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3 mt-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (campaign.brandColor ?? '#18181b') + '22' }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: campaign.brandColor ?? '#18181b' }} />
            </div>
            <h1 className="text-lg font-semibold text-zinc-900">{campaign.name}</h1>
            <Link
              href={`/dashboard/campaigns/${campaign.id}/builder`}
              className="text-sm text-zinc-500 border border-zinc-200 px-3 py-2.5 sm:py-1.5 rounded-lg hover:border-zinc-300 hover:text-zinc-700 transition-colors"
            >
              Edit form
            </Link>
            <Link
              href={`/dashboard/campaigns/${campaign.id}/settings`}
              className="text-sm text-zinc-500 border border-zinc-200 px-3 py-2.5 sm:py-1.5 rounded-lg hover:border-zinc-300 hover:text-zinc-700 transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Collection link</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 truncate">{collectionUrl}</code>
          <CopyButton text={collectionUrl} />
        </div>
        <p className="text-xs text-zinc-400 mt-2">Share this link with your customers to collect testimonials</p>
      </div>

      <SendRequestForm campaignId={campaign.id} />

      <CampaignDashboardClient
        campaign={campaignData}
        initialData={normalizedTestimonials}
        initialTotal={total}
        stats={{ total, approved, pending, video, avgRating }}
        appUrl={appUrl}
      />
    </div>
  );
}

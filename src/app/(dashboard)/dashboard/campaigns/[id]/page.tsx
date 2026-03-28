import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CopyButton } from '@/components/CopyButton';
import { SendRequestForm } from '@/components/SendRequestForm';
import { ArrowLeft } from 'lucide-react';
import CampaignDashboardClient from './CampaignDashboardClient';

export default async function CampaignPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', id).single();
  if (!campaign) notFound();

  // Fetch initial page of testimonials (page 1, 20 items)
  const { data: initialData, count: totalCount } = await supabase
    .from('testimonials')
    .select('*', { count: 'exact' })
    .eq('campaign_id', campaign.id)
    .order('created_at', { ascending: false })
    .range(0, 19);

  // Fetch stats
  const { count: approvedCount } = await supabase
    .from('testimonials')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id)
    .eq('approved', true);

  const { count: videoCount } = await supabase
    .from('testimonials')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id)
    .eq('content_type', 'video');

  const total = totalCount ?? 0;
  const approved = approvedCount ?? 0;
  const pending = total - approved;
  const video = videoCount ?? 0;

  // Calculate avg rating from initial batch (good enough for display)
  const allRatings = (initialData ?? []).filter((t) => t.rating > 0);
  const avgRating = allRatings.length > 0
    ? (allRatings.reduce((s, t) => s + t.rating, 0) / allRatings.length).toFixed(1)
    : '0';

  const collectionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/collect/${campaign.id}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors flex items-center gap-2">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: campaign.brand_color + '22' }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: campaign.brand_color }} />
            </div>
            <h1 className="text-lg font-semibold text-zinc-900">{campaign.name}</h1>
            <Link
              href={`/dashboard/campaigns/${campaign.id}/builder`}
              className="text-sm text-zinc-500 border border-zinc-200 px-3 py-1.5 rounded-lg hover:border-zinc-300 hover:text-zinc-700 transition-colors"
            >
              Edit form
            </Link>
            <Link
              href={`/dashboard/campaigns/${campaign.id}/settings`}
              className="text-sm text-zinc-500 border border-zinc-200 px-3 py-1.5 rounded-lg hover:border-zinc-300 hover:text-zinc-700 transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Collection link */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Collection link</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 truncate">{collectionUrl}</code>
          <CopyButton text={collectionUrl} />
        </div>
        <p className="text-xs text-zinc-400 mt-2">Share this link with your customers to collect testimonials</p>
      </div>

      <SendRequestForm campaignId={campaign.id} />

      {/* Client dashboard */}
      <CampaignDashboardClient
        campaign={campaign}
        initialData={initialData ?? []}
        initialTotal={total}
        stats={{ total, approved, pending, video, avgRating }}
        appUrl={appUrl}
      />
    </div>
  );
}

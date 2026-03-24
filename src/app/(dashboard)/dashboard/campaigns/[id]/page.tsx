import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CopyButton } from '@/components/CopyButton';
import { SendRequestForm } from '@/components/SendRequestForm';
import { ArrowLeft } from 'lucide-react';

export default async function CampaignPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', id).single();

  if (!campaign) notFound();

  const { data: testimonials } = await supabase.from('testimonials').select('*').eq('campaign_id', campaign.id).order('created_at', { ascending: false });

  const collectionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/collect/${campaign.id}`;
  const approved = testimonials?.filter((t) => t.approved) ?? [];
  const pending = testimonials?.filter((t) => !t.approved) ?? [];

  return (
    <div>
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

      {/* Embed code */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Wall of Love embed</p>
        <p className="text-xs text-zinc-400 mb-3">Paste this snippet anywhere on your website to show approved testimonials</p>
        <div className="relative">
          <pre className="text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 overflow-x-auto whitespace-pre-wrap">
            {`<div data-testimonial-campaign="${campaign.id}" data-origin="${process.env.NEXT_PUBLIC_APP_URL}"></div>
<script src="${process.env.NEXT_PUBLIC_APP_URL}/embed.js"></script>`}
          </pre>
        </div>
        <div className="mt-2 flex justify-end">
          <CopyButton
            text={`<div data-testimonial-campaign="${campaign.id}" data-origin="${process.env.NEXT_PUBLIC_APP_URL}"></div>\n<script src="${process.env.NEXT_PUBLIC_APP_URL}/embed.js"></script>`}
          />
        </div>
      </div>

      <SendRequestForm campaignId={campaign.id} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total', value: testimonials?.length ?? 0 },
          { label: 'Pending', value: pending.length },
          { label: 'Approved', value: approved.length },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold text-zinc-900">{stat.value}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      {testimonials && testimonials.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-zinc-700">Testimonials</p>
          {testimonials.map((t) => (
            <div key={t.id} className="bg-white border border-zinc-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-zinc-900">{t.customer_name}</p>
                    {t.customer_title && <span className="text-xs text-zinc-400">{t.customer_title}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.approved ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>{t.approved ? 'Approved' : 'Pending'}</span>
                  </div>
                  {t.ai_summary && <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-1.5 mb-2 italic">✦ {t.ai_summary}</p>}
                  {t.text_content && <p className="text-sm text-zinc-600 leading-relaxed">{t.text_content}</p>}
                  {t.video_url && <video src={t.video_url} controls className="mt-2 rounded-lg max-h-48 w-full object-cover" />}
                </div>
                <ApproveButton id={t.id} approved={t.approved} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 border-dashed rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-zinc-900">No testimonials yet</p>
          <p className="text-sm text-zinc-400 mt-1">Share the collection link above to get started</p>
        </div>
      )}
    </div>
  );
}

function ApproveButton({ id, approved }: { id: string; approved: boolean }) {
  return (
    <form
      action={async () => {
        'use server';
        const supabase = await (await import('@/lib/supabase/server')).createClient();
        await supabase.from('testimonials').update({ approved: !approved }).eq('id', id);
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/dashboard/campaigns/[id]', 'page');
      }}
    >
      <button
        type="submit"
        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
          approved ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
        }`}
      >
        {approved ? 'Unapprove' : 'Approve'}
      </button>
    </form>
  );
}

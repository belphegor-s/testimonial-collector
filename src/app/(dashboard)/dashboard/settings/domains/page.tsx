import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getActiveOrg } from '@/lib/org';
import { Globe, Lock, Sparkles } from 'lucide-react';
import DomainsClient from './DomainsClient';

export const metadata = { title: 'Domains' };

export default async function DomainsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const activeOrg = await getActiveOrg(user.id);
  if (!activeOrg) redirect('/login');
  const plan = activeOrg.plan;

  const sb = createAdminClient();
  const { data: campaigns } = await sb.from('campaigns').select('id, name').eq('organization_id', activeOrg.id).order('created_at', { ascending: false });
  const { data: domains } = await sb.from('custom_domains').select('*').eq('organization_id', activeOrg.id).order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <Globe size={18} className="text-zinc-500" />
            Custom domains
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">Serve a campaign on your own domain (e.g. reviews.acme.com)</p>
        </div>
        <span
          className={
            plan === 'pro'
              ? 'text-[11px] font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide'
              : 'text-[11px] font-medium px-2 py-1 rounded-full bg-zinc-100 text-zinc-600 uppercase tracking-wide'
          }
        >
          Pro feature
        </span>
      </div>

      {plan !== 'pro' ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <Lock size={18} className="text-emerald-600" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900">Custom domains are a Pro feature</h2>
          <p className="text-sm text-zinc-500 mt-1 mb-5 max-w-sm mx-auto">
            Bring your own domain (e.g. <code className="text-zinc-700 bg-zinc-100 px-1 py-0.5 rounded text-xs">reviews.yourbrand.com</code>) and serve testimonial collection forms with full SSL.
          </p>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <Sparkles size={14} />
            Upgrade to Pro
          </Link>
        </div>
      ) : (
        <DomainsClient campaigns={campaigns ?? []} domains={domains ?? []} />
      )}
    </div>
  );
}

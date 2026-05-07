import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getActiveOrg } from '@/lib/org';
import CampaignList from './CampaignList';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const activeOrg = await getActiveOrg(user.id);
  if (!activeOrg) redirect('/login');

  const sb = createAdminClient();
  const { data: campaigns } = await sb
    .from('campaigns')
    .select('*')
    .eq('organization_id', activeOrg.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Campaigns</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Each campaign has its own collection link</p>
        </div>
        <Link href="/dashboard/campaigns/new" className="bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors">
          New campaign
        </Link>
      </div>

      <CampaignList campaigns={campaigns ?? []} />
    </div>
  );
}

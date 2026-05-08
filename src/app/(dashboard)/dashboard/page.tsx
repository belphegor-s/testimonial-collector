import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { getActiveOrg } from '@/lib/org';
import CampaignList from './CampaignList';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const activeOrg = await getActiveOrg(session.user.id!);
  if (!activeOrg) redirect('/login');

  const campaigns = (await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.organizationId, activeOrg.id))
    .orderBy(desc(schema.campaigns.createdAt))
  ).map((c) => ({
    id: c.id,
    name: c.name,
    brand_color: c.brandColor ?? '#18181b',
    created_at: c.createdAt.toISOString(),
  }));

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

      <CampaignList campaigns={campaigns} />
    </div>
  );
}

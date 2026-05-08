import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { assertCanCreateCampaign, FREE_CAMPAIGN_LIMIT, getOrgCampaignCount, getOrgPlan } from '@/lib/plan';
import { getActiveOrg } from '@/lib/org';
import NewCampaignForm from './NewCampaignForm';

export default async function NewCampaignPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const activeOrg = await getActiveOrg(session.user.id!);
  if (!activeOrg) redirect('/login');

  const plan = await getOrgPlan(activeOrg.id);
  const count = plan === 'free' ? await getOrgCampaignCount(activeOrg.id) : 0;
  const gate = await assertCanCreateCampaign(activeOrg.id);

  return (
    <div>
      <Link href={`/dashboard`} className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors shrink-0 flex items-center gap-2 mb-4">
        <ArrowLeft size={14} /> Back
      </Link>

      {!gate.ok ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <Sparkles size={18} className="text-emerald-600" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900">Free plan limit reached</h2>
          <p className="text-sm text-zinc-500 mt-1 mb-5 max-w-sm mx-auto">{gate.reason}</p>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Upgrade to Pro: $19/mo
          </Link>
        </div>
      ) : (
        <>
          {plan === 'free' && (
            <p className="text-xs text-zinc-400 mb-3">
              Free plan: {count}/{FREE_CAMPAIGN_LIMIT} campaign used in {activeOrg.name}
            </p>
          )}
          <NewCampaignForm organizationId={activeOrg.id} />
        </>
      )}
    </div>
  );
}

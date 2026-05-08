import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getActiveOrg } from '@/lib/org';
import SettingsClient from './SettingsClient';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const activeOrg = await getActiveOrg(session.user.id!);
  const plan = activeOrg?.plan ?? 'free';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Account preferences</p>
      </div>

      <SettingsClient email={session.user.email ?? ''} plan={plan} />
    </div>
  );
}

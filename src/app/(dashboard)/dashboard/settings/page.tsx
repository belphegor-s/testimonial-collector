import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrg } from '@/lib/org';
import SettingsClient from './SettingsClient';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const activeOrg = await getActiveOrg(user.id);
  const plan = activeOrg?.plan ?? 'free';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Account preferences</p>
      </div>

      <SettingsClient email={user.email ?? ''} plan={plan} />
    </div>
  );
}

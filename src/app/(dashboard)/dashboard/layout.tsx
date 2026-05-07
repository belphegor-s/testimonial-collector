import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar/Sidebar';
import { getActiveOrg, listMyOrgs } from '@/lib/org';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const orgs = await listMyOrgs(user.id);
  const activeOrg = await getActiveOrg(user.id);

  return (
    <Sidebar userEmail={user.email ?? ''} orgs={orgs} activeOrg={activeOrg}>
      {children}
    </Sidebar>
  );
}

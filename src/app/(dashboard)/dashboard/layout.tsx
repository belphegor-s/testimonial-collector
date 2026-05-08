import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Sidebar from '@/components/Sidebar/Sidebar';
import { getActiveOrg, listMyOrgs } from '@/lib/org';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = session.user.id!;
  const orgs = await listMyOrgs(userId);
  const activeOrg = await getActiveOrg(userId);

  return (
    <Sidebar userEmail={session.user.email ?? ''} orgs={orgs} activeOrg={activeOrg}>
      {children}
    </Sidebar>
  );
}

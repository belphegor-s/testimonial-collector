import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar/Sidebar';
import { getPlan } from '@/lib/plan';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const plan = await getPlan(user.id);

  return (
    <Sidebar userEmail={user.email ?? ''} plan={plan}>
      {children}
    </Sidebar>
  );
}

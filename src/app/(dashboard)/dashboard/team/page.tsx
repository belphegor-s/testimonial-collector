import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getActiveOrg } from '@/lib/org';
import { assertCanInviteMember } from '@/lib/plan';
import { Lock, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import TeamClient from './TeamClient';

export const metadata = { title: 'Team' };

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const activeOrg = await getActiveOrg(user.id);
  if (!activeOrg) redirect('/login');

  const gate = await assertCanInviteMember(activeOrg.id);

  if (!gate.ok) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <Users size={18} className="text-zinc-500" />
            Team
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">Invite collaborators to your workspace</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <Lock size={18} className="text-emerald-600" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900">Team members are a Pro feature</h2>
          <p className="text-sm text-zinc-500 mt-1 mb-5 max-w-sm mx-auto">
            Upgrade to Pro to invite teammates and collaborate on campaigns together.
          </p>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <Sparkles size={14} />
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  const sb = createAdminClient();

  // Fetch members with user data
  const { data: memberRows } = await sb
    .from('organization_members')
    .select('user_id, role, created_at')
    .eq('organization_id', activeOrg.id)
    .order('created_at', { ascending: true });

  const members = await Promise.all(
    (memberRows ?? []).map(async (m) => {
      const { data } = await sb.auth.admin.getUserById(m.user_id);
      return {
        userId: m.user_id,
        email: data.user?.email ?? 'Unknown',
        role: m.role as 'owner' | 'admin' | 'member',
        joinedAt: m.created_at,
        isCurrentUser: m.user_id === user.id,
      };
    }),
  );

  // Fetch pending invitations
  const { data: invitations } = await sb
    .from('organization_invitations')
    .select('*')
    .eq('organization_id', activeOrg.id)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
          <Users size={18} className="text-zinc-500" />
          Team
        </h1>
        <p className="text-sm text-zinc-400 mt-0.5">{activeOrg.name}</p>
      </div>

      <TeamClient
        orgId={activeOrg.id}
        currentUserRole={activeOrg.role}
        members={members}
        invitations={(invitations ?? []).map((inv) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          expiresAt: inv.expires_at,
        }))}
      />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { eq, and, gt, isNull, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { getActiveOrg } from '@/lib/org';
import { assertCanInviteMember } from '@/lib/plan';
import { Lock, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import TeamClient from './TeamClient';

export const metadata = { title: 'Team' };

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const activeOrg = await getActiveOrg(session.user.id!);
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
          <p className="text-sm text-zinc-500 mt-1 mb-5 max-w-sm mx-auto">Upgrade to Pro to invite teammates and collaborate on campaigns together.</p>
          <Link href="/dashboard/billing" className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors">
            <Sparkles size={14} />
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  // Fetch members joined with user emails
  const memberRows = await db
    .select({
      userId: schema.organizationMembers.userId,
      role: schema.organizationMembers.role,
      joinedAt: schema.organizationMembers.createdAt,
      email: schema.users.email,
    })
    .from(schema.organizationMembers)
    .innerJoin(schema.users, eq(schema.organizationMembers.userId, schema.users.id))
    .where(eq(schema.organizationMembers.organizationId, activeOrg.id))
    .orderBy(asc(schema.organizationMembers.createdAt));

  const members = memberRows.map((m) => ({
    userId: m.userId,
    email: m.email,
    role: m.role as 'owner' | 'admin' | 'member',
    joinedAt: m.joinedAt.toISOString(),
    isCurrentUser: m.userId === session.user!.id,
  }));

  const invitations = await db
    .select()
    .from(schema.organizationInvitations)
    .where(and(
      eq(schema.organizationInvitations.organizationId, activeOrg.id),
      isNull(schema.organizationInvitations.acceptedAt),
      gt(schema.organizationInvitations.expiresAt, new Date()),
    ))
    .orderBy(asc(schema.organizationInvitations.createdAt));

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
        invitations={invitations.map((inv) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          expiresAt: inv.expiresAt.toISOString(),
        }))}
      />
    </div>
  );
}

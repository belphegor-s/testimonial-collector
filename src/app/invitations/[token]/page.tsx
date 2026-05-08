import { eq, isNull, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { auth } from '@/auth';
import Link from 'next/link';
import AcceptInviteClient from './AcceptInviteClient';

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [invite] = await db
    .select({
      id: schema.organizationInvitations.id,
      organizationId: schema.organizationInvitations.organizationId,
      role: schema.organizationInvitations.role,
      token: schema.organizationInvitations.token,
      expiresAt: schema.organizationInvitations.expiresAt,
      acceptedAt: schema.organizationInvitations.acceptedAt,
      orgName: schema.organizations.name,
    })
    .from(schema.organizationInvitations)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.organizationInvitations.organizationId))
    .where(and(
      eq(schema.organizationInvitations.token, token),
      isNull(schema.organizationInvitations.acceptedAt),
    ));

  if (!invite) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-lg">x</span>
          </div>
          <h1 className="text-base font-semibold text-zinc-900 mb-2">Invitation not found</h1>
          <p className="text-sm text-zinc-500 mb-5">This invitation may have already been used or has expired.</p>
          <Link href="/" className="text-sm text-zinc-700 hover:text-zinc-900 underline underline-offset-2">Go home</Link>
        </div>
      </div>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-sm w-full text-center">
          <h1 className="text-base font-semibold text-zinc-900 mb-2">Invitation expired</h1>
          <p className="text-sm text-zinc-500 mb-5">Ask the team owner to send a new invite.</p>
          <Link href="/" className="text-sm text-zinc-700 hover:text-zinc-900 underline underline-offset-2">Go home</Link>
        </div>
      </div>
    );
  }

  const session = await auth();
  const orgName = invite.orgName ?? 'a workspace';

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <div className="w-4 h-4 rounded-full bg-emerald-500" />
          </div>
          <h1 className="text-base font-semibold text-zinc-900 mb-1">You&apos;ve been invited</h1>
          <p className="text-sm text-zinc-500 mb-6">
            Join <strong className="text-zinc-900">{orgName}</strong> on Kudoso as a{' '}
            <span className="capitalize">{invite.role}</span>.
          </p>
          <Link
            href={`/signup?invite=${token}`}
            className="inline-flex w-full items-center justify-center bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors mb-3"
          >
            Create account and join
          </Link>
          <Link
            href={`/login?invite=${token}`}
            className="inline-flex w-full items-center justify-center border border-zinc-200 text-zinc-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Sign in and join
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <div className="w-4 h-4 rounded-full bg-emerald-500" />
        </div>
        <h1 className="text-base font-semibold text-zinc-900 mb-1">Join {orgName}</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Accept the invitation to join as a <span className="capitalize font-medium text-zinc-700">{invite.role}</span>.
        </p>
        <AcceptInviteClient token={token} />
      </div>
    </div>
  );
}

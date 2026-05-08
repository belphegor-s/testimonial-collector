'use server';

import { auth } from '@/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { getActiveOrg, requireRole } from '@/lib/org';
import { assertCanInviteMember } from '@/lib/plan';
import { sendEmail } from '@/lib/cloudflare-email';
import { FROM_EMAIL } from '@/lib/email';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { escapeHtml } from '@/lib/utils';

export async function inviteMember(orgId: string, email: string, role: 'admin' | 'member') {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  await requireRole(orgId, session.user.id!, ['owner', 'admin']);

  const gate = await assertCanInviteMember(orgId);
  if (!gate.ok) throw new Error(gate.reason);

  // Check if already a member
  const [existingUser] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()));

  if (existingUser) {
    const [alreadyMember] = await db
      .select({ userId: schema.organizationMembers.userId })
      .from(schema.organizationMembers)
      .where(and(eq(schema.organizationMembers.organizationId, orgId), eq(schema.organizationMembers.userId, existingUser.id)));
    if (alreadyMember) throw new Error('This user is already a member of this organization.');
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    await db.insert(schema.organizationInvitations).values({
      organizationId: orgId,
      email: email.toLowerCase(),
      role,
      invitedBy: session.user.id,
      token,
      expiresAt,
    });
  } catch (e: any) {
    if (e.code === '23505') throw new Error('An invitation has already been sent to this email.');
    throw new Error(e.message);
  }

  const [org] = await db.select({ name: schema.organizations.name }).from(schema.organizations).where(eq(schema.organizations.id, orgId));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  await sendEmail({
    from: FROM_EMAIL,
    to: email,
    subject: `You've been invited to join ${escapeHtml(org?.name ?? 'a Kudoso workspace')}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h1 style="font-size:18px;font-weight:600;color:#18181b;margin:0 0 8px;">You're invited to ${escapeHtml(org?.name ?? 'a workspace')} on Kudoso</h1>
        <p style="font-size:14px;color:#52525b;line-height:1.6;margin:0 0 24px;">
          You've been invited as a <strong>${role}</strong>. Click below to accept and get started.
        </p>
        <a href="${appUrl}/invitations/${token}" style="display:inline-block;background:#18181b;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Accept invitation
        </a>
        <p style="font-size:12px;color:#a1a1aa;margin-top:32px;">This invitation expires in 7 days.</p>
      </div>
    `,
  });

  revalidatePath('/dashboard/team');
}

export async function revokeInvitation(inviteId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const [invite] = await db
    .select({ organizationId: schema.organizationInvitations.organizationId })
    .from(schema.organizationInvitations)
    .where(eq(schema.organizationInvitations.id, inviteId));
  if (!invite) throw new Error('Invitation not found');

  await requireRole(invite.organizationId, session.user.id!, ['owner', 'admin']);
  await db.delete(schema.organizationInvitations).where(eq(schema.organizationInvitations.id, inviteId));
  revalidatePath('/dashboard/team');
}

export async function removeMember(orgId: string, targetUserId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  await requireRole(orgId, session.user.id!, ['owner', 'admin']);

  const [org] = await db.select({ ownerId: schema.organizations.ownerId }).from(schema.organizations).where(eq(schema.organizations.id, orgId));
  if (org?.ownerId === targetUserId) throw new Error('Cannot remove the owner. Transfer ownership first.');

  await db.delete(schema.organizationMembers)
    .where(and(eq(schema.organizationMembers.organizationId, orgId), eq(schema.organizationMembers.userId, targetUserId)));
  revalidatePath('/dashboard/team');
}

export async function updateMemberRole(orgId: string, targetUserId: string, newRole: 'admin' | 'member') {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  await requireRole(orgId, session.user.id!, ['owner']);

  const [org] = await db.select({ ownerId: schema.organizations.ownerId }).from(schema.organizations).where(eq(schema.organizations.id, orgId));
  if (org?.ownerId === targetUserId) throw new Error('Cannot change the owner role.');

  await db.update(schema.organizationMembers)
    .set({ role: newRole })
    .where(and(eq(schema.organizationMembers.organizationId, orgId), eq(schema.organizationMembers.userId, targetUserId)));
  revalidatePath('/dashboard/team');
}

export async function acceptInvitation(token: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const [invite] = await db
    .select()
    .from(schema.organizationInvitations)
    .where(and(eq(schema.organizationInvitations.token, token), isNull(schema.organizationInvitations.acceptedAt)));

  if (!invite) throw new Error('Invitation not found or already used.');
  if (invite.expiresAt < new Date()) throw new Error('This invitation has expired.');

  await db.insert(schema.organizationMembers).values({
    organizationId: invite.organizationId,
    userId: session.user.id!,
    role: invite.role,
  }).onConflictDoNothing();

  await db.update(schema.organizationInvitations)
    .set({ acceptedAt: new Date() })
    .where(eq(schema.organizationInvitations.id, invite.id));
}

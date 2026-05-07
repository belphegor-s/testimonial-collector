'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getActiveOrg, requireRole } from '@/lib/org';
import { assertCanInviteMember } from '@/lib/plan';
import { resend } from '@/lib/resend';
import { FROM_EMAIL } from '@/lib/email';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { escapeHtml } from '@/lib/utils';

export async function inviteMember(orgId: string, email: string, role: 'admin' | 'member') {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  await requireRole(orgId, user.id, ['owner', 'admin']);

  const gate = await assertCanInviteMember(orgId);
  if (!gate.ok) throw new Error(gate.reason);

  const sb = createAdminClient();

  // Check if already a member
  const { data: existing } = await sb.from('organization_members').select('user_id').eq('organization_id', orgId).limit(1);
  const { data: users } = await sb.rpc('get_users_by_email', { emails: [email] }).limit(1) as any;
  if (users?.[0]) {
    const alreadyMember = existing?.some((m: any) => m.user_id === users[0].id);
    if (alreadyMember) throw new Error('This user is already a member of this organization.');
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await sb.from('organization_invitations').insert({
    organization_id: orgId,
    email: email.toLowerCase(),
    role,
    invited_by: user.id,
    token,
    expires_at: expiresAt,
  });

  if (error) {
    if (error.code === '23505') throw new Error('An invitation has already been sent to this email.');
    throw new Error(error.message);
  }

  const { data: org } = await sb.from('organizations').select('name').eq('id', orgId).single();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `You've been invited to join ${escapeHtml(org?.name ?? 'a Kudoso workspace')}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <div style="width:40px;height:40px;border-radius:10px;background:#ecfdf5;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
          <div style="width:16px;height:16px;border-radius:50%;background:#10b981;"></div>
        </div>
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
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const sb = createAdminClient();
  const { data: invite } = await sb.from('organization_invitations').select('organization_id').eq('id', inviteId).single();
  if (!invite) throw new Error('Invitation not found');

  await requireRole(invite.organization_id, user.id, ['owner', 'admin']);
  await sb.from('organization_invitations').delete().eq('id', inviteId);
  revalidatePath('/dashboard/team');
}

export async function removeMember(orgId: string, targetUserId: string) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  await requireRole(orgId, user.id, ['owner', 'admin']);

  const sb = createAdminClient();
  const { data: org } = await sb.from('organizations').select('owner_id').eq('id', orgId).single();
  if (org?.owner_id === targetUserId) throw new Error('Cannot remove the owner. Transfer ownership first.');

  await sb.from('organization_members').delete().eq('organization_id', orgId).eq('user_id', targetUserId);
  revalidatePath('/dashboard/team');
}

export async function updateMemberRole(orgId: string, targetUserId: string, newRole: 'admin' | 'member') {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  await requireRole(orgId, user.id, ['owner']);

  const sb = createAdminClient();
  const { data: org } = await sb.from('organizations').select('owner_id').eq('id', orgId).single();
  if (org?.owner_id === targetUserId) throw new Error('Cannot change the owner role.');

  await sb.from('organization_members').update({ role: newRole }).eq('organization_id', orgId).eq('user_id', targetUserId);
  revalidatePath('/dashboard/team');
}

export async function acceptInvitation(token: string) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const sb = createAdminClient();
  const { data: invite } = await sb
    .from('organization_invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .single();

  if (!invite) throw new Error('Invitation not found or already used.');
  if (new Date(invite.expires_at) < new Date()) throw new Error('This invitation has expired.');

  const { data: existingMember } = await sb
    .from('organization_members')
    .select('id')
    .eq('organization_id', invite.organization_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existingMember) {
    await sb.from('organization_members').insert({
      organization_id: invite.organization_id,
      user_id: user.id,
      role: invite.role,
    });
  }

  await sb.from('organization_invitations').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id);
}

'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth, signOut } from '@/auth';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { sendEmail } from '@/lib/cloudflare-email';
import { FROM_EMAIL } from '@/lib/email';

export async function sendPasswordResetAction() {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: 'Not authenticated' };

  const res = await fetch(`${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: session.user.email }),
  });

  return { ok: res.ok };
}

export async function deleteAccountAction(confirm: string) {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };

  if (confirm !== session.user.email) {
    return { ok: false, error: 'Type your email to confirm.' };
  }

  await db.delete(schema.users).where(eq(schema.users.id, session.user.id!));

  await signOut({ redirect: false });
  revalidatePath('/');
  redirect('/login?deleted=1');
}

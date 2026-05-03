'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function sendPasswordResetAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: 'Not authenticated' };

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteAccountAction(confirm: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  if (confirm !== user.email) {
    return { ok: false, error: 'Type your email to confirm.' };
  }

  const admin = createAdminClient();
  // ON DELETE CASCADE on profiles + campaigns + custom_domains will clean up data.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: error.message };

  await supabase.auth.signOut();
  revalidatePath('/');
  redirect('/login?deleted=1');
}

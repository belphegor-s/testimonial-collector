import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';

export async function POST(req: Request) {
  const { token, password } = await req.json();

  if (!token || !password || password.length < 6) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const [resetToken] = await db
    .select()
    .from(schema.passwordResetTokens)
    .where(and(eq(schema.passwordResetTokens.token, token), gt(schema.passwordResetTokens.expiresAt, new Date())));

  if (!resetToken) {
    return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password as string, 12);
  await db.update(schema.users).set({ password: hashed }).where(eq(schema.users.email, resetToken.email));
  await db.delete(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.token, token));

  return NextResponse.json({ ok: true, email: resetToken.email });
}

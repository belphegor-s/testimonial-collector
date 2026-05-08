import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { createPersonalOrg } from '@/lib/org';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: 'Invalid email or password (min 6 chars)' }, { status: 400 });
  }

  const normalizedEmail = (email as string).toLowerCase().trim();

  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, normalizedEmail));
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password as string, 12);
  const userId = randomUUID();

  await db.insert(schema.users).values({ id: userId, email: normalizedEmail, password: hashed });
  await createPersonalOrg(userId, normalizedEmail);

  return NextResponse.json({ ok: true });
}

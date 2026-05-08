import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { sendEmail } from '@/lib/cloudflare-email';
import { FROM_EMAIL } from '@/lib/email';

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ ok: true }); // silent to avoid email enumeration

  const normalizedEmail = (email as string).toLowerCase().trim();
  const [user] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, normalizedEmail));
  if (!user) return NextResponse.json({ ok: true }); // silent

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(schema.passwordResetTokens).values({
    id: randomBytes(16).toString('hex'),
    email: normalizedEmail,
    token,
    expiresAt,
  });

  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  await sendEmail({
    from: FROM_EMAIL,
    to: normalizedEmail,
    subject: 'Reset your Kudoso password',
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h1 style="font-size:18px;font-weight:600;color:#18181b;margin:0 0 8px;">Reset your password</h1>
        <p style="font-size:14px;color:#52525b;line-height:1.6;margin:0 0 24px;">
          Click below to set a new password. This link expires in 1 hour.
        </p>
        <a href="${appUrl}/reset-password?token=${token}" style="display:inline-block;background:#18181b;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Reset password
        </a>
        <p style="font-size:12px;color:#a1a1aa;margin-top:32px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}

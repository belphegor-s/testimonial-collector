import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { createPersonalOrg } from '@/lib/org';
import { authConfig } from '@/auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const [user] = await db.select().from(schema.users).where(eq(schema.users.email, creds.email as string));
        if (!user?.password) return null;
        const ok = await bcrypt.compare(creds.password as string, user.password);
        return ok ? user : null;
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (!user.id || !user.email) return;
      await createPersonalOrg(user.id, user.email);
    },
  },
});

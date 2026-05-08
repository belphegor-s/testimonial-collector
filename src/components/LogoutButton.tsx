'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  async function handleLogout() {
    await signOut({ callbackUrl: '/login' });
  }

  return (
    <button onClick={handleLogout} className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
      Sign out
    </button>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-zinc-200 p-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <span className="text-sm font-semibold text-zinc-900 tracking-tight">kudoso</span>
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">Create account</h1>
          <p className="text-sm text-zinc-400 mt-1">Free for one campaign, upgrade anytime</p>
        </div>

        <GoogleAuthButton label="Sign up with Google" />

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-zinc-200" />
          <span className="text-[11px] text-zinc-400 uppercase tracking-wide">or</span>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 transition-colors mt-1">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-zinc-400 mt-5 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-zinc-700 font-medium hover:text-zinc-900 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

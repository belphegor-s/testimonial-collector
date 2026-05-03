'use client';

import { useState, useTransition } from 'react';
import { Mail, Shield, KeyRound, Loader2, Check, AlertTriangle } from 'lucide-react';
import { sendPasswordResetAction, deleteAccountAction } from './actions';

export default function SettingsClient({ email, plan }: { email: string; plan: 'free' | 'pro' }) {
  const [resetSent, setResetSent] = useState(false);
  const [resetting, startReset] = useTransition();
  const [resetError, setResetError] = useState('');

  const [confirmInput, setConfirmInput] = useState('');
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  function handleReset() {
    setResetError('');
    startReset(async () => {
      const res = await sendPasswordResetAction();
      if (!res.ok) setResetError(res.error || 'Could not send reset email');
      else setResetSent(true);
    });
  }

  function handleDelete() {
    setDeleteError('');
    startDelete(async () => {
      const res = await deleteAccountAction(confirmInput);
      if (res && !res.ok) setDeleteError(res.error || 'Could not delete account');
    });
  }

  return (
    <div className="space-y-4">
      {/* Account */}
      <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={14} className="text-zinc-400" />
            <p className="text-sm font-semibold text-zinc-900">Account</p>
          </div>
          <div className="grid sm:grid-cols-[140px_1fr] gap-2 text-sm">
            <span className="text-zinc-500">Email</span>
            <span className="text-zinc-900 font-medium break-all">{email}</span>
            <span className="text-zinc-500">Plan</span>
            <span className="text-zinc-900 font-medium capitalize">{plan}</span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound size={14} className="text-zinc-400" />
            <p className="text-sm font-semibold text-zinc-900">Password</p>
          </div>
          <p className="text-sm text-zinc-500 mb-3">Send a reset link to your email.</p>
          {resetSent ? (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 inline-flex items-center gap-2">
              <Check size={14} /> Reset email sent. Check your inbox.
            </p>
          ) : (
            <button
              onClick={handleReset}
              disabled={resetting}
              className="inline-flex items-center gap-2 text-sm border border-zinc-200 px-4 py-2 rounded-lg hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              {resetting ? <Loader2 size={14} className="animate-spin" /> : null}
              Send password reset email
            </button>
          )}
          {resetError && <p className="text-xs text-red-500 mt-2">{resetError}</p>}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-red-200 rounded-xl">
        <div className="p-5 flex items-center gap-2 border-b border-red-100">
          <Shield size={14} className="text-red-500" />
          <p className="text-sm font-semibold text-red-700">Danger zone</p>
        </div>
        <div className="p-5">
          {!showDelete ? (
            <>
              <p className="text-sm text-zinc-700 font-medium">Delete account</p>
              <p className="text-sm text-zinc-500 mt-1 mb-3">
                Permanently delete your account, all campaigns, testimonials, and custom domains. This cannot be undone.
              </p>
              <button
                onClick={() => setShowDelete(true)}
                className="text-sm border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                Delete my account
              </button>
            </>
          ) : (
            <div>
              <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                <AlertTriangle size={14} /> This is permanent.
              </p>
              <p className="text-sm text-zinc-600 mt-2 mb-3">
                Type <strong className="font-mono">{email}</strong> to confirm.
              </p>
              <input
                type="email"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={email}
                className="w-full sm:w-auto sm:min-w-[280px] border border-zinc-200 rounded-lg px-3 py-2 text-sm mb-3"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting || confirmInput !== email}
                  className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                  Delete forever
                </button>
                <button
                  onClick={() => {
                    setShowDelete(false);
                    setConfirmInput('');
                    setDeleteError('');
                  }}
                  className="text-sm text-zinc-500 px-3 py-2 hover:text-zinc-900"
                >
                  Cancel
                </button>
              </div>
              {deleteError && <p className="text-xs text-red-500 mt-2">{deleteError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

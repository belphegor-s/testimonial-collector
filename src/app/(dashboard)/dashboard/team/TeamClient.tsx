'use client';

import { useState, useTransition } from 'react';
import { Loader2, Trash2, UserPlus, Shield, User, Crown } from 'lucide-react';
import { inviteMember, revokeInvitation, removeMember, updateMemberRole } from './actions';

type Member = {
  userId: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  isCurrentUser: boolean;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
};

export default function TeamClient({
  orgId,
  currentUserRole,
  members,
  invitations,
}: {
  orgId: string;
  currentUserRole: 'owner' | 'admin' | 'member';
  members: Member[];
  invitations: Invitation[];
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [, startTransition] = useTransition();

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    startTransition(async () => {
      try {
        await inviteMember(orgId, email, role);
        setEmail('');
        setSuccess('Invitation sent.');
      } catch (err: any) {
        setError(err.message ?? 'Failed to send invitation');
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Members list */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">{members.length} member{members.length !== 1 ? 's' : ''}</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {members.map((m) => (
            <div key={m.userId} className="px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-zinc-600">{m.email[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-900 truncate">{m.email}{m.isCurrentUser && <span className="text-xs text-zinc-400 ml-2">(you)</span>}</p>
                <p className="text-xs text-zinc-400 capitalize">{m.role}</p>
              </div>
              <RoleBadge role={m.role} />
              {canManage && !m.isCurrentUser && m.role !== 'owner' && (
                <div className="flex items-center gap-2">
                  {currentUserRole === 'owner' && (
                    <select
                      defaultValue={m.role}
                      onChange={(e) => {
                        startTransition(() => {
                          updateMemberRole(orgId, m.userId, e.target.value as 'admin' | 'member');
                        });
                      }}
                      className="text-xs border border-zinc-200 rounded-md px-2 py-1 text-zinc-600 bg-white"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${m.email} from this organization?`)) {
                        startTransition(() => removeMember(orgId, m.userId));
                      }
                    }}
                    className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50"
                    title="Remove member"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Pending invitations</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {invitations.map((inv) => (
              <div key={inv.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-900 truncate">{inv.email}</p>
                  <p className="text-xs text-zinc-400 capitalize">
                    {inv.role} - expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wide">Pending</span>
                {canManage && (
                  <button
                    onClick={() => {
                      startTransition(() => revokeInvitation(inv.id));
                    }}
                    className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50"
                    title="Revoke invitation"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite form */}
      {canManage && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={16} className="text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900">Invite a team member</h2>
          </div>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              required
              className="flex-1 text-sm border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
              className="text-sm border border-zinc-200 rounded-lg px-3 py-2 text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors shrink-0"
            >
              <UserPlus size={14} />
              Send invite
            </button>
          </form>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          {success && <p className="text-xs text-emerald-600 mt-2">{success}</p>}
          <p className="text-xs text-zinc-400 mt-3">
            Members can view and manage campaigns. Admins can also invite others. Owners have full control.
          </p>
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: 'owner' | 'admin' | 'member' }) {
  if (role === 'owner') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-900 text-white uppercase tracking-wide">
      <Crown size={9} /> Owner
    </span>
  );
  if (role === 'admin') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 uppercase tracking-wide">
      <Shield size={9} /> Admin
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-50 text-zinc-500 uppercase tracking-wide">
      <User size={9} /> Member
    </span>
  );
}

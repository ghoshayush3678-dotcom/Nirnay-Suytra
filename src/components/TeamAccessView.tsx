import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Link2,
  Copy,
  Check,
  Clock,
  ShieldAlert,
  Activity,
  Plus,
} from 'lucide-react';
import {
  UserRole,
  WorkspaceInviteRecord,
  WorkspaceMemberRecord,
  WorkspaceRecord,
  SignInActivityRecord,
} from '../types';
import { EditorialEmptyCard } from './EditorialEmptyStates';

interface TeamAccessViewProps {
  activeWorkspace: WorkspaceRecord;
  members: WorkspaceMemberRecord[];
  invites: WorkspaceInviteRecord[];
  signInActivity: SignInActivityRecord[];
  currentUserUid: string;
  onApproveRoleRequest: (memberUid: string) => void;
  onRejectRoleRequest: (memberUid: string) => void;
  onChangeMemberRole: (memberUid: string, nextRole: UserRole) => void;
  onToggleMemberStatus: (memberUid: string) => void;
  onGenerateInvite: (
    role: 'Creator' | 'Manager' | 'Reviewer',
    expiresAt: string
  ) => WorkspaceInviteRecord;
  onRevokeInvite: (inviteId: string) => void;
}

export const TeamAccessView: React.FC<TeamAccessViewProps> = ({
  activeWorkspace,
  members,
  invites,
  signInActivity,
  currentUserUid,
  onApproveRoleRequest,
  onRejectRoleRequest,
  onChangeMemberRole,
  onToggleMemberStatus,
  onGenerateInvite,
  onRevokeInvite,
}) => {
  const [inviteRole, setInviteRole] = useState<
    'Creator' | 'Manager' | 'Reviewer'
  >('Reviewer');
  const [inviteExpiry, setInviteExpiry] = useState('2026-12-31');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const workspaceMembers = members.filter(
    (m) => m.workspaceId === activeWorkspace.id
  );
  const pendingRequests = workspaceMembers.filter(
    (m) => m.approvalStatus === 'pending'
  );
  const workspaceInvites = invites.filter(
    (i) => i.workspaceId === activeWorkspace.id
  );

  const handleCopyInvite = (inv: WorkspaceInviteRecord) => {
    const shareText = `${window.location.origin}/?workspace=${activeWorkspace.workspaceCode}&invite=${inv.id}`;
    navigator.clipboard?.writeText(inv.id).catch(() => {});
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2000);
    return shareText;
  };

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const created = onGenerateInvite(inviteRole, inviteExpiry);
    setCopiedId(created.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#E4DFD3]">
        <div>
          <div className="text-xs text-[#526360] mb-1 font-mono-tabular">
            <span>{activeWorkspace.name}</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>Workspace Join Code: <strong className="text-[#0B3D3A]">{activeWorkspace.workspaceCode}</strong></span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>Brand Admin Access Control</span>
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
            Team &amp; Access Governance
          </h1>
          <p className="text-xs text-[#526360] mt-1">
            Approve or reject role elevation requests, manage workspace roles, deactivate accounts, generate expiring invite links, and audit sign-in activity.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono-tabular bg-[#F3EFE6] border border-[#E4DFD3] px-4 py-2.5 rounded">
          <div>
            <span className="text-[#526360] block text-[10px] uppercase">
              Active Members
            </span>
            <span className="font-semibold text-[#0B3D3A]">
              {workspaceMembers.filter((m) => m.status === 'active').length}
            </span>
          </div>
          <span className="text-[#E4DFD3]">|</span>
          <div>
            <span className="text-[#526360] block text-[10px] uppercase">
              Pending Approvals
            </span>
            <span className="font-semibold text-[#B45309]">
              {pendingRequests.length}
            </span>
          </div>
          <span className="text-[#E4DFD3]">|</span>
          <div>
            <span className="text-[#526360] block text-[10px] uppercase">
              Active Invites
            </span>
            <span className="font-semibold text-[#17806D]">
              {workspaceInvites.filter((i) => !i.revoked).length}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Pending Role Requests Queue */}
      <section className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#B45309]" />
              <span>Pending Role Requests ({pendingRequests.length})</span>
            </h2>
            <p className="text-xs text-[#526360] mt-0.5">
              Users who joined via workspace code requesting <strong>Manager</strong> or <strong>Reviewer</strong> access operate with Creator permissions until approved here.
            </p>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-4 rounded bg-[#F3EFE6]/60 border border-[#E4DFD3] text-xs text-[#526360]">
            No pending role requests right now. All workspace members have resolved role assignments.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div
                key={req.uid}
                className="border border-[#F5A524]/60 bg-[#F3EFE6]/70 rounded p-4 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono-tabular text-[#526360] mb-1">
                    <span>Joined: {req.joinedAt}</span>
                    <span className="text-[#B45309] font-semibold">
                      Requesting: {req.requestedRole}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#0B3D3A]">
                    {req.displayName}
                  </p>
                  <p className="text-xs text-[#526360] font-mono-tabular">
                    {req.email} · Current temporary access: {req.role}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4DFD3]">
                  <button
                    type="button"
                    onClick={() => onRejectRoleRequest(req.uid)}
                    className="px-3 py-1.5 text-xs font-medium text-[#991B1B] bg-[#FEE2E2]/70 hover:bg-[#991B1B] hover:text-[#FAF8F4] rounded border border-[#991B1B]/30 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Reject (Keep as Creator)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onApproveRoleRequest(req.uid)}
                    className="px-3.5 py-1.5 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Approve {req.requestedRole}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: Workspace Members Directory & Role Controls */}
      <section className="border border-[#E4DFD3] bg-[#FAF8F4] rounded overflow-hidden">
        <div className="p-6 border-b border-[#E4DFD3] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#17806D]" />
              <span>Workspace Members ({workspaceMembers.length})</span>
            </h2>
            <p className="text-xs text-[#526360] mt-0.5">
              Only a Brand Admin can change member roles or deactivate accounts. Every role change is recorded in the Audit Log.
            </p>
          </div>
        </div>

        {workspaceMembers.length <= 1 && (
          <div className="p-6 border-b border-[#E4DFD3] bg-[#F3EFE6]/40">
            <EditorialEmptyCard
              illustration="team"
              heading="You're the only member. Invite your team."
              explanation="Generate a role-scoped invite link or share your workspace code so Creators, Managers, and Reviewers can collaborate."
              primaryAction={{
                label: 'Invite your team',
                onClick: () => {
                  const created = onGenerateInvite(inviteRole, inviteExpiry);
                  setCopiedId(created.id);
                  setTimeout(() => setCopiedId(null), 2500);
                  const el = document.getElementById('invite-generator-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                },
              }}
              compact
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4DFD3] bg-[#F3EFE6]/80 text-xs text-[#526360]">
                <th className="py-3 px-4 font-medium">Member</th>
                <th className="py-3 px-4 font-medium">Auth Method</th>
                <th className="py-3 px-4 font-medium">Effective Role</th>
                <th className="py-3 px-4 font-medium">Approval State</th>
                <th className="py-3 px-4 font-medium">Last Sign-In</th>
                <th className="py-3 px-4 font-medium text-right">
                  Admin Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4DFD3] text-xs">
              {workspaceMembers.map((m) => {
                const isSelf = m.uid === currentUserUid;
                return (
                  <tr
                    key={m.uid}
                    className={`hover:bg-[#F3EFE6]/40 ${
                      m.status === 'deactivated' ? 'opacity-60 bg-[#FEE2E2]/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-[#0B3D3A] text-[#FAF8F4] font-mono-tabular text-xs font-semibold flex items-center justify-center shrink-0">
                          {m.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[#0B3D3A]">
                            {m.displayName}{' '}
                            {isSelf && (
                              <span className="text-[10px] font-mono-tabular text-[#17806D]">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#526360] font-mono-tabular">
                            {m.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-[#364946]">
                      {m.authProvider === 'google'
                        ? 'Google OAuth'
                        : m.authProvider === 'demo-sandbox'
                        ? 'Demo Sandbox'
                        : 'Email + Password'}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Change role for ${m.displayName}`}
                        value={m.role}
                        disabled={m.status === 'deactivated'}
                        onChange={(e) =>
                          onChangeMemberRole(m.uid, e.target.value as UserRole)
                        }
                        className="px-2.5 py-1 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded font-medium text-[#0B3D3A]"
                      >
                        <option value="Creator">Creator</option>
                        <option value="Manager">Manager</option>
                        <option value="Reviewer">Reviewer</option>
                        <option value="Brand Admin">Brand Admin</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular">
                      {m.status === 'deactivated' ? (
                        <span className="text-[#991B1B] font-semibold">
                          Deactivated
                        </span>
                      ) : m.approvalStatus === 'pending' ? (
                        <span className="text-[#B45309] font-semibold">
                          Pending ({m.requestedRole})
                        </span>
                      ) : (
                        <span className="text-[#17806D] font-semibold">
                          Approved
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-[#526360]">
                      {m.lastSignInAt}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() => onToggleMemberStatus(m.uid)}
                        className={`px-2.5 py-1 text-xs rounded border cursor-pointer disabled:opacity-40 ${
                          m.status === 'active'
                            ? 'border-[#991B1B]/40 text-[#991B1B] hover:bg-[#FEE2E2]'
                            : 'border-[#17806D] text-[#17806D] hover:bg-[#7FD1BF]/20'
                        }`}
                      >
                        {m.status === 'active' ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 3: Generate Invite Links & Recent Sign-In Activity (2-column grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Invite Link Generator (6 cols) */}
        <section
          id="invite-generator-section"
          className="lg:col-span-6 border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 space-y-5"
        >
          <div>
            <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A] flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#17806D]" />
              <span>Generate Expiring Invite Links</span>
            </h2>
            <p className="text-xs text-[#526360] mt-0.5">
              Create a shareable invite token pre-assigned to a specific role and expiration date. Note: Brand Admin can never be assigned via join links.
            </p>
          </div>

          <form
            onSubmit={handleCreateInvite}
            className="p-4 rounded bg-[#F3EFE6]/70 border border-[#E4DFD3] space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#142321] mb-1">
                  Assigned Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(
                      e.target.value as 'Creator' | 'Manager' | 'Reviewer'
                    )
                  }
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
                >
                  <option value="Creator">Creator</option>
                  <option value="Manager">Manager</option>
                  <option value="Reviewer">Reviewer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#142321] mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  required
                  value={inviteExpiry}
                  onChange={(e) => setInviteExpiry(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded font-mono-tabular"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium bg-[#0B3D3A] hover:bg-[#17806D] text-[#FAF8F4] rounded inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate Invite Link</span>
              </button>
            </div>
          </form>

          <div className="space-y-2.5">
            {workspaceInvites.map((inv) => (
              <div
                key={inv.id}
                className={`p-3.5 rounded border text-xs flex items-center justify-between gap-3 ${
                  inv.revoked
                    ? 'bg-[#F3EFE6]/40 border-[#E4DFD3] opacity-60'
                    : 'bg-[#FAF8F4] border-[#E4DFD3]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-mono-tabular">
                    <span className="font-semibold text-[#0B3D3A]">
                      {inv.id}
                    </span>
                    <span className="text-[#17806D]">Role: {inv.assignedRole}</span>
                  </div>
                  <p className="text-[11px] text-[#526360] font-mono-tabular mt-0.5">
                    Expires: {inv.expiresAt} · Used {inv.usedCount}x ·{' '}
                    {inv.revoked ? 'Revoked' : 'Active'}
                  </p>
                </div>

                {!inv.revoked && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyInvite(inv)}
                      className="px-2.5 py-1 text-xs border border-[#0B3D3A] text-[#0B3D3A] hover:bg-[#F3EFE6] rounded inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === inv.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#17806D]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRevokeInvite(inv.id)}
                      className="text-xs text-[#991B1B] hover:underline cursor-pointer"
                    >
                      Revoke
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Recent Sign-In Activity Log (6 cols) */}
        <section className="lg:col-span-6 border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 space-y-4">
          <div>
            <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#17806D]" />
              <span>Recent Sign-In &amp; Session Activity</span>
            </h2>
            <p className="text-xs text-[#526360] mt-0.5">
              Real-time log of Google OAuth sign-ins, Email + Password sessions, global device revocations, and role approvals.
            </p>
          </div>

          <div className="divide-y divide-[#E4DFD3] max-h-[380px] overflow-y-auto pr-1">
            {signInActivity.map((act) => (
              <div key={act.id} className="py-3 text-xs space-y-1">
                <div className="flex items-center justify-between font-mono-tabular">
                  <span className="font-semibold text-[#0B3D3A]">
                    {act.userName} ({act.role})
                  </span>
                  <span className="text-[11px] text-[#526360]">
                    {act.timestamp}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#364946]">
                  <span>
                    Event: <strong className="font-mono-tabular">{act.event}</strong> ·{' '}
                    {act.deviceSummary}
                  </span>
                  <span className="font-mono-tabular text-[#17806D]">
                    {act.authProvider}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

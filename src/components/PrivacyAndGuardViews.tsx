import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Trash2,
  Download,
  LogOut,
  CheckCircle2,
  Server,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { AuthenticatedUserProfile, UserRole } from '../types';

import { EditorialLineIllustration } from './EditorialEmptyStates';

interface AccessDeniedViewProps {
  activeRole: UserRole;
  attemptedViewLabel: string;
  requiredRoles: UserRole[];
  onReturnToRoleHome: () => void;
  onSwitchRoleForDemo?: (role: UserRole) => void;
  isDemoSandbox?: boolean;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  activeRole,
  attemptedViewLabel,
  requiredRoles,
  onReturnToRoleHome,
  onSwitchRoleForDemo,
  isDemoSandbox,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="max-w-2xl mx-auto my-8 border border-[#E4DFD3] bg-[#FAF8F4] rounded p-8 sm:p-10 text-center space-y-5"
    >
      <div className="flex justify-center">
        <EditorialLineIllustration variant="access-denied" />
      </div>

      <div className="space-y-2 max-w-lg mx-auto">
        <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
          You don&apos;t have access to this page
        </h1>
        <p className="text-xs sm:text-sm text-[#364946] leading-relaxed">
          Opening <strong>{attemptedViewLabel}</strong> requires the{' '}
          <strong className="text-[#0B3D3A]">
            {requiredRoles.join(' or ')}
          </strong>{' '}
          role, while your current active role is{' '}
          <strong className="text-[#0B3D3A]">{activeRole}</strong>.
        </p>
      </div>

      <div className="max-w-md mx-auto p-3.5 rounded bg-[#F3EFE6]/80 border border-[#E4DFD3] text-xs space-y-1 font-mono-tabular text-left">
        <div className="flex items-center justify-between">
          <span className="text-[#526360]">Requested page:</span>
          <span className="text-[#0B3D3A] font-semibold">
            {attemptedViewLabel}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#526360]">Your current role:</span>
          <span className="text-[#991B1B] font-semibold">{activeRole}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#526360]">Required role:</span>
          <span className="text-[#17806D] font-semibold">
            {requiredRoles.join(', ')}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onReturnToRoleHome}
          className="px-5 py-2.5 text-xs font-medium bg-[#0B3D3A] hover:bg-[#17806D] text-[#FAF8F4] rounded inline-flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D3A] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go to my home</span>
        </button>

        {isDemoSandbox && onSwitchRoleForDemo && requiredRoles[0] && (
          <button
            type="button"
            onClick={() => onSwitchRoleForDemo(requiredRoles[0])}
            className="px-4 py-2.5 text-xs font-medium border border-[#0B3D3A] text-[#0B3D3A] hover:bg-[#F3EFE6] rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D3A] cursor-pointer"
          >
            Demo mode: Switch to {requiredRoles[0]}
          </button>
        )}
      </div>
    </div>
  );
};

interface PrivacyGovernanceViewProps {
  userProfile: AuthenticatedUserProfile;
  onSignOutAllDevices: () => void;
  onDeleteAccountAndData: () => void;
}

export const PrivacyGovernanceView: React.FC<PrivacyGovernanceViewProps> = ({
  userProfile,
  onSignOutAllDevices,
  onDeleteAccountAndData,
}) => {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [exportedDone, setExportedDone] = useState(false);

  const handleExportMyData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      platform: 'Nirnay Sutra Brand Governance',
      storedProfileData: {
        uid: userProfile.uid,
        name: userProfile.displayName,
        email: userProfile.email,
        avatar: userProfile.photoURL || 'None (Initials only)',
        role: userProfile.role,
        requestedRole: userProfile.requestedRole,
        approvalStatus: userProfile.approvalStatus,
        activeWorkspaceId: userProfile.activeWorkspaceId,
        consentedToTermsAt: userProfile.consentedToTermsAt,
        lastSignInAt: userProfile.lastSignInAt,
      },
      externalServicesUsed: [
        'Google Sign-In (basic profile & email scopes only)',
        'Firebase Authentication & Cloud Firestore',
        'Google Gemini API (@google/genai) — Confidential library items redacted in code prior to API dispatch',
      ],
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nirnay-sutra-personal-data-${userProfile.uid}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportedDone(true);
    setTimeout(() => setExportedDone(false), 3000);
  };

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-[#E4DFD3] flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono-tabular uppercase tracking-wider text-[#17806D]">
            Privacy, Consent &amp; Self-Service Data Rights
          </p>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A] mt-1">
            Privacy &amp; Data Governance Notice
          </h1>
          <p className="text-xs text-[#526360] mt-1">
            Plain-language breakdown of what personal and workspace data Nirnay Sutra stores, which external services are used, and how to delete your account and data at any time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportMyData}
            className="px-3.5 py-2 text-xs font-medium border border-[#0B3D3A] text-[#0B3D3A] hover:bg-[#F3EFE6] rounded inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {exportedDone ? 'JSON Export Downloaded' : 'Export My Stored Data (JSON)'}
            </span>
          </button>

          <button
            type="button"
            onClick={onSignOutAllDevices}
            className="px-3.5 py-2 text-xs font-medium border border-[#E4DFD3] bg-[#F3EFE6] text-[#142321] hover:border-[#0B3D3A] rounded inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out of all devices</span>
          </button>
        </div>
      </div>

      {/* 1. What Data We Store */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 space-y-4">
          <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#17806D]" />
            <span>1. What Personal &amp; Account Data Is Stored</span>
          </h2>
          <p className="text-xs text-[#364946] leading-relaxed">
            Nirnay Sutra follows strict data minimisation. Your user document in <code className="font-mono-tabular">/users/{userProfile.uid}</code> stores only the following five fields:
          </p>
          <ul className="text-xs space-y-2.5 font-mono-tabular bg-[#F3EFE6]/70 p-4 rounded border border-[#E4DFD3]">
            <li className="flex items-center justify-between">
              <span className="text-[#526360]">1. Name:</span>
              <strong className="text-[#0B3D3A]">{userProfile.displayName}</strong>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-[#526360]">2. Email:</span>
              <strong className="text-[#0B3D3A]">{userProfile.email}</strong>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-[#526360]">3. Avatar:</span>
              <strong className="text-[#0B3D3A]">
                {userProfile.photoURL ? 'Google Profile Photo URL' : 'Initials Only (No Photo)'}
              </strong>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-[#526360]">4. Workspace Role:</span>
              <strong className="text-[#17806D]">{userProfile.role}</strong>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-[#526360]">5. Activity &amp; Consent Log:</span>
              <strong className="text-[#0B3D3A]">{userProfile.lastSignInAt}</strong>
            </li>
          </ul>
        </div>

        {/* 2. External Services Used */}
        <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 space-y-4">
          <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A] flex items-center gap-2">
            <Server className="w-4 h-4 text-[#17806D]" />
            <span>2. External Services &amp; Scope Boundaries</span>
          </h2>
          <div className="space-y-3 text-xs text-[#364946]">
            <div className="p-3 rounded bg-[#F3EFE6]/70 border border-[#E4DFD3]">
              <p className="font-semibold text-[#0B3D3A]">
                Google Sign-In (OAuth 2.0 Basic Scopes Only)
              </p>
              <p className="mt-1 leading-relaxed">
                Requests only <code className="font-mono-tabular">profile</code> and <code className="font-mono-tabular">email</code> scopes to verify your identity. Nirnay Sutra <strong>never</strong> requests access to Gmail, Google Drive, Calendar, or Contacts.
              </p>
            </div>

            <div className="p-3 rounded bg-[#F3EFE6]/70 border border-[#E4DFD3]">
              <p className="font-semibold text-[#0B3D3A]">
                Firebase Authentication &amp; Cloud Firestore
              </p>
              <p className="mt-1 leading-relaxed">
                Stores workspace membership, role assignments, and audit trails protected by server-side <code className="font-mono-tabular">firestore.rules</code>.
              </p>
            </div>

            <div className="p-3 rounded bg-[#F3EFE6]/70 border border-[#E4DFD3]">
              <p className="font-semibold text-[#0B3D3A] flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Google Gemini API (`@google/genai`)</span>
              </p>
              <p className="mt-1 leading-relaxed">
                Used only to evaluate submitted draft text and images against non-confidential Brand Library passages. Any item marked <strong>Confidential</strong> is visible only to Reviewers and Brand Admins and is redacted in code before calling Gemini.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Delete My Account and Data */}
      <div className="border border-[#991B1B]/40 bg-[#FEE2E2]/25 rounded p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif-display text-base font-semibold text-[#991B1B]">
            Delete my account and data
          </h3>
          <p className="text-xs text-[#364946] mt-1 max-w-2xl leading-relaxed">
            Permanently deletes your user profile (<code className="font-mono-tabular">/users/{userProfile.uid}</code>), removes your workspace membership record, revokes your Firebase Authentication credentials, and clears local session storage.
          </p>
        </div>

        {!confirmDeleteOpen ? (
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            className="px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#991B1B] hover:bg-[#7F1D1D] rounded inline-flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete my account and data</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(false)}
              className="px-3 py-1.5 text-xs text-[#526360] border border-[#E4DFD3] bg-[#FAF8F4] rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDeleteAccountAndData}
              className="px-4 py-1.5 text-xs font-semibold text-[#FAF8F4] bg-[#991B1B] rounded cursor-pointer"
            >
              Confirm Permanent Deletion
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

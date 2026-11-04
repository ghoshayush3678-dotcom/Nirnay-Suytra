import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';

export type IllustrationVariant =
  | 'workspace'
  | 'deactivated'
  | 'checklist'
  | 'document'
  | 'studio'
  | 'approvals'
  | 'autopilot'
  | 'history'
  | 'insights'
  | 'audit'
  | 'team'
  | 'search'
  | 'access-denied'
  | 'database-offline'
  | 'daily-limit';

export type SimulatedAppStateMode =
  | 'normal'
  | 'no-workspace'
  | 'deactivated-member'
  | 'empty-workspace-checklist'
  | 'empty-all-lists'
  | 'not-signed-in-redirect'
  | 'role-not-permitted'
  | 'role-request-pending'
  | 'session-expired'
  | 'loading-skeleton'
  | 'db-unreachable'
  | 'daily-quota-reached';

/**
 * Calm, editorial 1.5px stroke SVG line illustrations matching the warm paper & deep forest palette.
 */
export const EditorialLineIllustration: React.FC<{
  variant: IllustrationVariant;
  className?: string;
}> = ({ variant, className = 'w-14 h-14' }) => {
  const strokeColor =
    variant === 'database-offline' ||
    variant === 'deactivated' ||
    variant === 'access-denied'
      ? '#991B1B'
      : variant === 'daily-limit'
      ? '#B45309'
      : '#0B3D3A';
  const accentColor = '#17806D';

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {variant === 'workspace' && (
        <>
          <rect
            x="10"
            y="14"
            width="44"
            height="36"
            rx="3"
            stroke={strokeColor}
            strokeWidth="1.75"
          />
          <line
            x1="10"
            y1="24"
            x2="54"
            y2="24"
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <line
            x1="24"
            y1="24"
            x2="24"
            y2="50"
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <circle cx="16" cy="19" r="1.5" fill={accentColor} />
          <circle cx="21" cy="19" r="1.5" fill={accentColor} />
          <path
            d="M32 34H46M32 40H42"
            stroke={accentColor}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </>
      )}

      {variant === 'deactivated' && (
        <>
          <circle
            cx="32"
            cy="32"
            r="20"
            stroke={strokeColor}
            strokeWidth="1.75"
          />
          <path
            d="M24 24L40 40M40 24L24 40"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </>
      )}

      {variant === 'checklist' && (
        <>
          <rect
            x="14"
            y="10"
            width="36"
            height="44"
            rx="3"
            stroke={strokeColor}
            strokeWidth="1.75"
          />
          <path
            d="M21 23L24 26L30 20"
            stroke={accentColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="34"
            y1="23"
            x2="44"
            y2="23"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <rect
            x="21"
            y="32"
            width="6"
            height="6"
            rx="1"
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <line
            x1="34"
            y1="35"
            x2="44"
            y2="35"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <rect
            x="21"
            y="42"
            width="6"
            height="6"
            rx="1"
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <line
            x1="34"
            y1="45"
            x2="42"
            y2="45"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}

      {(variant === 'document' || variant === 'studio') && (
        <>
          <path
            d="M18 10H38L48 20V52C48 53.1046 47.1046 54 46 54H18C16.8954 54 16 53.1046 16 52V12C16 10.8954 16.8954 10 18 10Z"
            stroke={strokeColor}
            strokeWidth="1.75"
          />
          <path
            d="M38 10V20H48"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M23 29H41M23 36H41M23 43H33"
            stroke={accentColor}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </>
      )}

      {(variant === 'approvals' || variant === 'autopilot') && (
        <>
          <path
            d="M32 10L50 17V31C50 43.2 42.3 51.8 32 55C21.7 51.8 14 43.2 14 31V17L32 10Z"
            stroke={strokeColor}
            strokeWidth="1.75"
          />
          <path
            d="M25 32L30 37L40 26"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}

      {variant === 'history' && (
        <>
          <circle cx="20" cy="20" r="4" stroke={strokeColor} strokeWidth="1.75" />
          <circle cx="44" cy="44" r="4" stroke={accentColor} strokeWidth="1.75" />
          <circle cx="20" cy="44" r="4" stroke={strokeColor} strokeWidth="1.75" />
          <path
            d="M20 24V40M24 20H36C40.4183 20 44 23.5817 44 28V40"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </>
      )}

      {variant === 'insights' && (
        <>
          <line
            x1="12"
            y1="50"
            x2="52"
            y2="50"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <rect
            x="17"
            y="32"
            width="7"
            height="18"
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <rect
            x="29"
            y="22"
            width="7"
            height="28"
            stroke={accentColor}
            strokeWidth="1.5"
          />
          <rect
            x="41"
            y="14"
            width="7"
            height="36"
            stroke={strokeColor}
            strokeWidth="1.5"
          />
        </>
      )}

      {variant === 'audit' && (
        <>
          <rect
            x="12"
            y="14"
            width="40"
            height="36"
            rx="3"
            stroke={strokeColor}
            strokeWidth="1.75"
          />
          <path
            d="M20 24H44M20 32H44M20 40H34"
            stroke={accentColor}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </>
      )}

      {variant === 'team' && (
        <>
          <circle
            cx="26"
            cy="24"
            r="6"
            stroke={strokeColor}
            strokeWidth="1.75"
          />
          <path
            d="M15 46C15 39.9249 19.9249 35 26 35C32.0751 35 37 39.9249 37 46"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M44 25V35M39 30H49"
            stroke={accentColor}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </>
      )}

      {variant === 'search' && (
        <>
          <circle
            cx="28"
            cy="28"
            r="13"
            stroke={strokeColor}
            strokeWidth="1.75"
          />
          <path
            d="M38 38L50 50"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M24 28H32"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}

      {variant === 'access-denied' && (
        <>
          <rect
            x="16"
            y="28"
            width="32"
            height="24"
            rx="3"
            stroke={strokeColor}
            strokeWidth="1.75"
          />
          <path
            d="M22 28V20C22 14.4772 26.4772 10 32 10C37.5228 10 42 14.4772 42 20V28"
            stroke={strokeColor}
            strokeWidth="1.75"
          />
          <circle cx="32" cy="40" r="2.5" fill={strokeColor} />
        </>
      )}

      {variant === 'database-offline' && (
        <>
          <ellipse
            cx="32"
            cy="18"
            rx="16"
            ry="6"
            stroke={strokeColor}
            strokeWidth="1.75"
          />
          <path
            d="M16 18V32C16 35.3137 23.1634 38 32 38C40.8366 38 48 35.3137 48 32V18"
            stroke={strokeColor}
            strokeWidth="1.75"
          />
          <path
            d="M16 32V46C16 49.3137 23.1634 52 32 52C36.5 52 40.5 51.2 43.5 50"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M42 42L52 52M52 42L42 52"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}

      {variant === 'daily-limit' && (
        <>
          <path
            d="M20 12H44M20 52H44M22 12V22L32 32L22 42V52M42 12V22L32 32L42 42V52"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
};

/**
 * Reusable Editorial Empty State Card
 * - Small line illustration
 * - Heading in Fraunces
 * - One sentence of explanation
 * - One primary action in deep green (#0B3D3A)
 */
interface EditorialEmptyCardProps {
  illustration: IllustrationVariant;
  heading: string;
  explanation: string;
  actionLabel?: string;
  onAction?: () => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  compact?: boolean;
  roleType?: 'status' | 'alert';
  ariaLabel?: string;
}

export const EditorialEmptyCard: React.FC<EditorialEmptyCardProps> = ({
  illustration,
  heading,
  explanation,
  actionLabel,
  onAction,
  primaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActions,
  compact,
  roleType = 'status',
  ariaLabel,
}) => {
  const effectiveLabel = primaryAction?.label || actionLabel;
  const effectiveOnClick = primaryAction?.onClick || onAction;

  return (
    <div
      role={roleType}
      aria-label={ariaLabel || heading}
      className={`border border-[#E4DFD3] bg-[#FAF8F4] rounded text-center max-w-2xl mx-auto flex flex-col items-center space-y-4 ${
        compact ? 'p-6 my-2' : 'p-8 sm:p-10 my-4'
      }`}
    >
      <div className="p-3 rounded bg-[#F3EFE6] border border-[#E4DFD3]">
        <EditorialLineIllustration
          variant={illustration}
          className="w-12 h-12"
        />
      </div>

      <h3
        className="font-serif-display text-xl sm:text-2xl font-semibold text-[#0B3D3A]"
        style={{ textWrap: 'balance' }}
      >
        {heading}
      </h3>

      <p className="text-xs sm:text-sm text-[#364946] max-w-lg leading-relaxed">
        {explanation}
      </p>

      {(effectiveLabel ||
        secondaryActionLabel ||
        (secondaryActions && secondaryActions.length > 0)) && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {effectiveLabel && effectiveOnClick && (
            <button
              type="button"
              onClick={effectiveOnClick}
              className="px-5 py-2.5 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D3A] rounded transition-colors cursor-pointer"
            >
              {effectiveLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="px-4 py-2.5 text-xs font-medium text-[#0B3D3A] border border-[#0B3D3A] hover:bg-[#F3EFE6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D3A] rounded transition-colors cursor-pointer"
            >
              {secondaryActionLabel}
            </button>
          )}
          {secondaryActions?.map((sec, idx) => (
            <button
              key={idx}
              type="button"
              onClick={sec.onClick}
              className="px-4 py-2.5 text-xs font-medium text-[#0B3D3A] border border-[#0B3D3A] hover:bg-[#F3EFE6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D3A] rounded transition-colors cursor-pointer"
            >
              {sec.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * 1. SIGNED IN BUT NO WORKSPACE / DEACTIVATED USER STATE
 */
interface NoWorkspaceOrRemovedViewProps {
  mode: 'no-workspace' | 'deactivated';
  userName?: string;
  userDisplayName?: string;
  userEmail: string;
  onCreateWorkspace: (orgName: string) => void;
  onJoinWorkspace: (
    codeOrInvite: string,
    requestedRole: 'Creator' | 'Manager' | 'Reviewer'
  ) => void;
  onExploreDemoWorkspace: () => void;
  onSignOut: () => void;
}

export const NoWorkspaceOrRemovedView: React.FC<
  NoWorkspaceOrRemovedViewProps
> = ({
  mode,
  userName,
  userDisplayName,
  userEmail,
  onCreateWorkspace,
  onJoinWorkspace,
  onExploreDemoWorkspace,
  onSignOut,
}) => {
  const displayName = userDisplayName || userName || 'Workspace Member';
  const [activeActionDrawer, setActiveActionDrawer] = useState<
    'none' | 'create' | 'join'
  >('none');
  const [orgName, setOrgName] = useState('');
  const [joinCode, setJoinCode] = useState('KAVERI-2026');
  const [joinRole, setJoinRole] = useState<'Creator' | 'Manager' | 'Reviewer'>(
    'Creator'
  );

  if (mode === 'deactivated') {
    return (
      <div
        role="alert"
        aria-label="Workspace access ended"
        className="max-w-xl mx-auto my-12 border border-[#991B1B]/40 bg-[#FAF8F4] rounded p-8 sm:p-10 text-center space-y-5"
      >
        <div className="w-14 h-14 mx-auto rounded bg-[#FEE2E2]/60 border border-[#991B1B]/30 flex items-center justify-center">
          <EditorialLineIllustration
            variant="deactivated"
            className="w-10 h-10"
          />
        </div>

        <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
          Your access to this workspace has ended. Contact your Brand Admin.
        </h1>

        <p className="text-xs sm:text-sm text-[#364946] leading-relaxed">
          Signed in as <strong>{displayName}</strong> ({userEmail}). Your membership in this workspace was removed or deactivated by a Brand Admin.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onSignOut}
            className="px-5 py-2.5 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D3A] rounded transition-colors cursor-pointer"
          >
            Sign out
          </button>

          <button
            type="button"
            onClick={onExploreDemoWorkspace}
            className="px-4 py-2.5 text-xs font-medium text-[#526360] hover:text-[#0B3D3A] underline cursor-pointer"
          >
            Explore the demo workspace (sample data)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="You're not part of a workspace yet"
      className="max-w-2xl mx-auto my-10 border border-[#E4DFD3] bg-[#FAF8F4] rounded p-8 sm:p-10 text-center space-y-6"
    >
      <div className="w-14 h-14 mx-auto rounded bg-[#F3EFE6] border border-[#E4DFD3] flex items-center justify-center">
        <EditorialLineIllustration variant="workspace" className="w-11 h-11" />
      </div>

      <div className="space-y-2">
        <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
          You're not part of a workspace yet.
        </h1>
        <p className="text-xs sm:text-sm text-[#364946] max-w-lg mx-auto leading-relaxed">
          A workspace is where your team's brand guidelines, content and reviews live.
        </p>
      </div>

      {/* Two Primary Clear Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <button
          type="button"
          onClick={() =>
            setActiveActionDrawer(
              activeActionDrawer === 'create' ? 'none' : 'create'
            )
          }
          className="px-5 py-2.5 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D3A] rounded transition-colors cursor-pointer"
        >
          Create a workspace
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveActionDrawer(
              activeActionDrawer === 'join' ? 'none' : 'join'
            )
          }
          className="px-5 py-2.5 text-xs font-medium text-[#0B3D3A] bg-[#F3EFE6] border border-[#0B3D3A] hover:bg-[#0B3D3A] hover:text-[#FAF8F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D3A] rounded transition-colors cursor-pointer"
        >
          Join with a code or invite link
        </button>
      </div>

      {/* Inline Drawer 1: Create a workspace */}
      {activeActionDrawer === 'create' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!orgName.trim()) return;
            onCreateWorkspace(orgName.trim());
          }}
          className="text-left p-5 rounded bg-[#F3EFE6] border border-[#E4DFD3] space-y-3 max-w-md mx-auto"
        >
          <p className="text-xs font-semibold text-[#0B3D3A]">
            Create a workspace (you become the Brand Admin)
          </p>
          <div>
            <label className="block text-xs text-[#364946] mb-1">
              Organisation or Brand Name *
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Nilgiri Botanicals"
              className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded focus:outline-none focus:border-[#0B3D3A]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveActionDrawer('none')}
              className="px-3 py-1.5 text-xs text-[#526360] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium bg-[#0B3D3A] text-[#FAF8F4] rounded cursor-pointer"
            >
              Create &amp; Enter as Brand Admin
            </button>
          </div>
        </form>
      )}

      {/* Inline Drawer 2: Join with a code or invite link */}
      {activeActionDrawer === 'join' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!joinCode.trim()) return;
            onJoinWorkspace(joinCode.trim(), joinRole);
          }}
          className="text-left p-5 rounded bg-[#F3EFE6] border border-[#E4DFD3] space-y-3 max-w-md mx-auto"
        >
          <p className="text-xs font-semibold text-[#0B3D3A]">
            Join with a code or invite link
          </p>
          <div>
            <label className="block text-xs text-[#364946] mb-1">
              Workspace Code or Invite Link *
            </label>
            <input
              type="text"
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="e.g. KAVERI-2026 or INV-KAVERI-REV-2026"
              className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded font-mono-tabular"
            />
          </div>
          <div>
            <label className="block text-xs text-[#364946] mb-1">
              Role you are requesting
            </label>
            <select
              value={joinRole}
              onChange={(e) =>
                setJoinRole(
                  e.target.value as 'Creator' | 'Manager' | 'Reviewer'
                )
              }
              className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
            >
              <option value="Creator">Creator (Immediate access)</option>
              <option value="Manager">Manager (Requires admin approval)</option>
              <option value="Reviewer">
                Reviewer (Requires admin approval)
              </option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveActionDrawer('none')}
              className="px-3 py-1.5 text-xs text-[#526360] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium bg-[#0B3D3A] text-[#FAF8F4] rounded cursor-pointer"
            >
              Join Workspace
            </button>
          </div>
        </form>
      )}

      {/* Third, quieter option */}
      <div className="pt-3 border-t border-[#E4DFD3]">
        <button
          type="button"
          onClick={onExploreDemoWorkspace}
          className="text-xs text-[#526360] hover:text-[#0B3D3A] underline underline-offset-4 cursor-pointer"
        >
          Explore the demo workspace (sample data)
        </button>
      </div>
    </div>
  );
};

/**
 * 2. WORKSPACE EXISTS BUT IT IS EMPTY — 4-Step Setup Checklist & Guideline Gate
 */
interface WorkspaceSetupChecklistProps {
  workspaceName?: string;
  hasGuidelines: boolean;
  hasFacts: boolean;
  hasTermsAndAssets?: boolean;
  hasTerminologyAndAssets?: boolean;
  hasInvitedTeam?: boolean;
  hasTeamInvited?: boolean;
  activeRole: UserRole;
  onGoToGuidelines: () => void;
  onGoToFacts: () => void;
  onGoToTermsAndAssets?: () => void;
  onGoToTerminologyAndAssets?: () => void;
  onGoToInviteTeam: () => void;
  onLoadSampleLibrary?: () => void;
  onRestoreSampleWorkspace?: () => void;
}

export const WorkspaceSetupChecklist: React.FC<
  WorkspaceSetupChecklistProps
> = ({
  hasGuidelines,
  hasFacts,
  hasTermsAndAssets,
  hasTerminologyAndAssets,
  hasInvitedTeam,
  hasTeamInvited,
  activeRole,
  onGoToGuidelines,
  onGoToFacts,
  onGoToTermsAndAssets,
  onGoToTerminologyAndAssets,
  onGoToInviteTeam,
  onLoadSampleLibrary,
  onRestoreSampleWorkspace,
}) => {
  const termsAndAssetsDone = Boolean(
    hasTerminologyAndAssets ?? hasTermsAndAssets
  );
  const teamInvitedDone = Boolean(hasTeamInvited ?? hasInvitedTeam);
  const handleGoToTerms =
    onGoToTerminologyAndAssets || onGoToTermsAndAssets || onGoToGuidelines;
  const handleRestoreSample =
    onRestoreSampleWorkspace || onLoadSampleLibrary;

  const steps = [
    {
      id: 'guidelines',
      label: 'Add your brand guidelines',
      done: hasGuidelines,
      buttonLabel: hasGuidelines ? 'Review guidelines' : 'Add guidelines',
      onClick: onGoToGuidelines,
    },
    {
      id: 'facts',
      label: 'Add approved facts',
      done: hasFacts,
      buttonLabel: hasFacts ? 'Review facts' : 'Add facts',
      onClick: onGoToFacts,
    },
    {
      id: 'terms-assets',
      label: 'Add terminology and brand assets',
      done: termsAndAssetsDone,
      buttonLabel: termsAndAssetsDone
        ? 'Review terminology'
        : 'Add terminology & assets',
      onClick: handleGoToTerms,
    },
    {
      id: 'invite-team',
      label: 'Invite your team',
      done: teamInvitedDone,
      buttonLabel: teamInvitedDone ? 'Manage team' : 'Invite team',
      onClick: onGoToInviteTeam,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <section
      role="status"
      aria-label={`Workspace setup checklist: ${completedCount} of 4 done`}
      className="border border-[#0B3D3A] bg-[#F3EFE6]/80 rounded p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4DFD3]">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded bg-[#FAF8F4] border border-[#E4DFD3] shrink-0">
            <EditorialLineIllustration
              variant="checklist"
              className="w-9 h-9"
            />
          </div>
          <div>
            <p className="text-xs font-mono-tabular font-semibold text-[#17806D]">
              Workspace Setup Checklist · {completedCount} of 4 done
            </p>
            <h2 className="font-serif-display text-xl font-semibold text-[#0B3D3A] mt-0.5">
              Set up your Brand Library to enable pre-publication checks
            </h2>
            <p className="text-xs text-[#364946] mt-0.5">
              Nirnay Sutra verifies every draft against your approved sources. Complete these four steps to finish setting up your workspace.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="w-32 h-2 bg-[#E4DFD3] rounded overflow-hidden">
            <div
              className="h-full bg-[#0B3D3A] transition-all"
              style={{ width: `${(completedCount / 4) * 100}%` }}
            />
          </div>
          <span className="font-mono-tabular text-xs font-semibold text-[#0B3D3A]">
            {completedCount} of 4 done
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`p-4 rounded border flex flex-col justify-between gap-4 ${
              step.done
                ? 'bg-[#FAF8F4]/90 border-[#17806D]/40'
                : 'bg-[#FAF8F4] border-[#E4DFD3]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono-tabular mb-1.5">
                <span className="text-[#526360]">Step 0{index + 1}</span>
                <span
                  className={
                    step.done
                      ? 'text-[#17806D] font-semibold'
                      : 'text-[#B45309] font-medium'
                  }
                >
                  {step.done ? 'Done' : 'Pending'}
                </span>
              </div>
              <p className="font-serif-display text-sm font-semibold text-[#0B3D3A]">
                {step.label}
              </p>
            </div>

            <button
              type="button"
              onClick={step.onClick}
              className={`w-full py-2 px-3 text-xs font-medium rounded transition-colors cursor-pointer ${
                step.done
                  ? 'border border-[#E4DFD3] text-[#364946] hover:border-[#0B3D3A]'
                  : 'bg-[#0B3D3A] text-[#FAF8F4] hover:bg-[#17806D]'
              }`}
            >
              {step.buttonLabel}
            </button>
          </div>
        ))}
      </div>

      {handleRestoreSample && activeRole === 'Brand Admin' && (
        <div className="pt-2 border-t border-[#E4DFD3] flex items-center justify-between text-xs text-[#526360]">
          <span>
            Want to test with Kaveri Organics guidelines and verified facts right away?
          </span>
          <button
            type="button"
            onClick={handleRestoreSample}
            className="text-[#0B3D3A] font-medium underline cursor-pointer"
          >
            Restore Kaveri Organics sample library
          </button>
        </div>
      )}
    </section>
  );
};

/**
 * 2b. No Guidelines Gate (Shown when someone tries to review content while library.guidelines.length === 0)
 */
interface NoGuidelinesReviewGateProps {
  activeRole: UserRole;
  onAddGuideline?: () => void;
  onGoToGuidelines?: () => void;
  onNotifyAdmin: () => void;
}

export const NoGuidelinesReviewGate: React.FC<NoGuidelinesReviewGateProps> = ({
  activeRole,
  onAddGuideline,
  onGoToGuidelines,
  onNotifyAdmin,
}) => {
  const [notified, setNotified] = useState(false);
  const isCreatorOrReviewer =
    activeRole === 'Creator' || activeRole === 'Reviewer';

  if (isCreatorOrReviewer) {
    return (
      <div
        role="status"
        aria-label="Brand guidelines not added yet"
        className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-8 sm:p-10 text-center max-w-2xl mx-auto my-6 space-y-4"
      >
        <div className="w-12 h-12 mx-auto rounded bg-[#F3EFE6] border border-[#E4DFD3] flex items-center justify-center">
          <EditorialLineIllustration
            variant="checklist"
            className="w-9 h-9"
          />
        </div>

        <h2 className="font-serif-display text-xl sm:text-2xl font-semibold text-[#0B3D3A]">
          Your Brand Admin hasn't added brand guidelines yet. Check back soon.
        </h2>

        <p className="text-xs sm:text-sm text-[#364946] max-w-lg mx-auto leading-relaxed">
          Nirnay Sutra requires at least one approved brand guideline in the Brand Library before content reviews can run.
        </p>

        <div className="pt-2">
          <button
            type="button"
            disabled={notified}
            onClick={() => {
              setNotified(true);
              onNotifyAdmin();
            }}
            className="px-5 py-2.5 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] disabled:opacity-60 rounded transition-colors cursor-pointer"
          >
            {notified
              ? 'Notification sent to your Brand Admin'
              : 'Notify my admin'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <EditorialEmptyCard
      illustration="checklist"
      heading="Add at least one guideline so Nirnay Sutra has an approved source to check against."
      explanation="Content review is disabled until your Brand Library contains at least one canonical guideline."
      actionLabel="Add your brand guidelines"
      onAction={onGoToGuidelines || onAddGuideline}
    />
  );
};

/**
 * 5a. LOADING STATE (Skeleton Placeholders, Max 8 Seconds)
 */
interface LoadingSkeletonStateProps {
  label?: string;
  onTimeoutReached?: () => void;
}

export const LoadingSkeletonState: React.FC<LoadingSkeletonStateProps> = ({
  label = 'Loading workspace records and verifying citation index...',
  onTimeoutReached,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev + 1 >= 8) {
          clearInterval(interval);
          if (onTimeoutReached) onTimeoutReached();
          return 8;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onTimeoutReached]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className="space-y-6 py-4"
    >
      <div className="flex items-center justify-between text-xs text-[#526360] font-mono-tabular">
        <span>{label}</span>
        <span>Loading ({elapsedSeconds}s / max 8s)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="border border-[#E4DFD3] bg-[#F3EFE6]/60 rounded p-5 space-y-3 animate-pulse"
          >
            <div className="h-3 w-24 bg-[#E4DFD3] rounded" />
            <div className="h-6 w-16 bg-[#E4DFD3] rounded" />
            <div className="h-2.5 w-36 bg-[#E4DFD3] rounded" />
          </div>
        ))}
      </div>

      <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 space-y-4 animate-pulse">
        <div className="h-4 w-48 bg-[#E4DFD3] rounded" />
        <div className="h-3 w-full bg-[#F3EFE6] rounded" />
        <div className="h-3 w-5/6 bg-[#F3EFE6] rounded" />
        <div className="h-3 w-3/4 bg-[#F3EFE6] rounded" />
      </div>
    </div>
  );
};

/**
 * 5b. DATABASE OFFLINE / UNREACHABLE / WRONG DATABASE ID STATE
 * Clearly distinct from empty data, with spaced-out Retry button (cooldown) to protect free-tier limits.
 */
interface DatabaseConnectionErrorStateProps {
  onRetry?: () => void;
  onRetryConnection?: () => void;
  onExploreDemo?: () => void;
  onExploreDemoWorkspace?: () => void;
}

export const DatabaseConnectionErrorState: React.FC<
  DatabaseConnectionErrorStateProps
> = ({
  onRetry,
  onRetryConnection,
  onExploreDemo,
  onExploreDemoWorkspace,
}) => {
  const [cooldown, setCooldown] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleSpacedRetry = () => {
    if (cooldown > 0) return;
    setRetryCount((prev) => prev + 1);
    setCooldown(10); // Spaced out 10-second cooldown to protect free-tier read limits
    const fn = onRetryConnection || onRetry;
    if (fn) fn();
  };

  const handleDemo = onExploreDemoWorkspace || onExploreDemo;

  return (
    <div className="space-y-6">
      {/* Visible Top Alert Banner */}
      <div
        role="alert"
        className="bg-[#FEE2E2] border border-[#991B1B]/40 text-[#991B1B] px-5 py-3 rounded flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        <div>
          <strong className="font-semibold">Connection Error:</strong> We can't reach the database. Your workspace data has not been lost—this is a connection or configuration issue, not an empty workspace.
        </div>
        <button
          type="button"
          disabled={cooldown > 0}
          onClick={handleSpacedRetry}
          className="px-3 py-1 rounded bg-[#991B1B] text-[#FAF8F4] font-medium cursor-pointer disabled:opacity-50"
        >
          {cooldown > 0 ? `Retry available in ${cooldown}s` : 'Retry'}
        </button>
      </div>

      {/* Full-Page Diagnostic Card */}
      <div
        role="alert"
        aria-label="We can't reach the database"
        className="max-w-2xl mx-auto border-2 border-[#991B1B]/40 bg-[#FAF8F4] rounded p-8 sm:p-10 space-y-6"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded bg-[#FEE2E2]/60 border border-[#991B1B]/30 shrink-0">
            <EditorialLineIllustration
              variant="database-offline"
              className="w-12 h-12"
            />
          </div>
          <div>
            <p className="text-xs font-mono-tabular uppercase text-[#991B1B] font-semibold">
              Database Unreachable · Connection Error
            </p>
            <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A] mt-1">
              We can't reach the database.
            </h1>
          </div>
        </div>

        <div className="p-5 rounded bg-[#F3EFE6] border border-[#E4DFD3] space-y-2 text-xs text-[#142321] leading-relaxed">
          <p className="font-semibold text-[#0B3D3A]">Setup &amp; Connection Checklist:</p>
          <p>
            Check your internet connection. If you are the app owner, check the Firebase setup: Firestore database created, <code className="font-mono-tabular">VITE_FIRESTORE_DATABASE_ID</code> set to <code className="font-mono-tabular">(default)</code>, and the other environment variables copied from your Firebase project.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={cooldown > 0}
              onClick={handleSpacedRetry}
              className="px-5 py-2.5 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] disabled:opacity-50 rounded transition-colors cursor-pointer"
            >
              {cooldown > 0 ? `Retry in ${cooldown}s` : 'Retry'}
            </button>
            {retryCount > 0 && (
              <span className="text-[11px] font-mono-tabular text-[#526360]">
                Retries spaced by 10s to protect free-tier quota
              </span>
            )}
          </div>

          {handleDemo && (
            <button
              type="button"
              onClick={handleDemo}
              className="px-4 py-2 text-xs font-medium text-[#0B3D3A] border border-[#0B3D3A] hover:bg-[#F3EFE6] rounded cursor-pointer"
            >
              Explore the demo workspace
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 5c. FREE DAILY LIMIT REACHED STATE
 * Never shows an upgrade or payment prompt.
 */
interface DailyQuotaReachedStateProps {
  onExploreDemo?: () => void;
  onExploreDemoWorkspace?: () => void;
}

export const DailyQuotaReachedState: React.FC<DailyQuotaReachedStateProps> = ({
  onExploreDemo,
  onExploreDemoWorkspace,
}) => {
  const handleDemo = onExploreDemoWorkspace || onExploreDemo;
  return (
    <div
      role="alert"
      aria-label="Free daily limit reached"
      className="max-w-2xl mx-auto my-8 border border-[#B45309]/50 bg-[#FAF8F4] rounded p-8 sm:p-10 text-center space-y-5"
    >
      <div className="w-14 h-14 mx-auto rounded bg-[#F5A524]/20 border border-[#B45309]/30 flex items-center justify-center">
        <EditorialLineIllustration variant="daily-limit" className="w-11 h-11" />
      </div>

      <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
        The free daily limit has been reached. Try again tomorrow, or explore the demo workspace.
      </h1>

      <p className="text-xs sm:text-sm text-[#364946] max-w-lg mx-auto leading-relaxed">
        Nirnay Sutra operates strictly within free-tier quotas. Daily read and verification allowances reset automatically tomorrow.
      </p>

      {handleDemo && (
        <div className="pt-2">
          <button
            type="button"
            onClick={handleDemo}
            className="px-5 py-2.5 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors cursor-pointer"
          >
            Explore the demo workspace
          </button>
        </div>
      )}
    </div>
  );
};

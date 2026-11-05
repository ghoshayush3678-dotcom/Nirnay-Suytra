import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileSearch,
  CheckSquare,
  GitCompare,
  BarChart3,
  ShieldCheck,
  Home,
  UserCheck,
  Plus,
  Zap,
  PauseCircle,
  PlayCircle,
  Users,
  Lock,
  LogOut,
  ChevronDown,
  Trash2,
  Building2,
  Sparkles,
  Clock,
  HelpCircle,
  MoreHorizontal,
  Compass,
} from 'lucide-react';
import {
  BrandLibraryState,
  ContentItem,
  AuditLogEntry,
  AuditEventType,
  UserRole,
  AuthenticatedUserProfile,
  WorkspaceRecord,
  WorkspaceMemberRecord,
  WorkspaceInviteRecord,
  SignInActivityRecord,
} from './types';
import {
  loadInitialState,
  persistState,
  resetToSeedData,
} from './utils/storage';
import {
  retrieveTopPassages,
  redactConfidentialContent,
  runDeterministicRuleChecks,
  verifyAiFindingsInCode,
  buildPassageGroundedCandidateFindings,
  runAutopilotDecisionEngine,
} from './utils/governanceEngine';
import {
  testFirestoreConnection,
  loadStoredUserProfile,
  saveStoredUserProfile,
  loadWorkspaces,
  saveWorkspaces,
  loadWorkspaceMembers,
  saveWorkspaceMembers,
  loadWorkspaceInvites,
  saveWorkspaceInvites,
  loadSignInActivity,
  recordSignInActivity,
  getRoleHomeTab,
  performSignOut,
  deleteAccountAndPersonalData,
  createDemoSandboxSession,
} from './utils/firebaseClient';
import { GENERATED_PHOTOS } from './data/kaveriSeed';
import { LandingPage } from './components/LandingPage';
import { AuthViews } from './components/AuthViews';
import { DashboardView } from './components/DashboardView';
import { AutopilotDashboardView } from './components/AutopilotDashboardView';
import { BrandLibraryView } from './components/BrandLibraryView';
import { ReviewStudioView } from './components/ReviewStudioView';
import { ApprovalsView } from './components/ApprovalsView';
import { RevisionHistoryView } from './components/RevisionHistoryView';
import { InsightsView } from './components/InsightsView';
import { AuditDisclosureView } from './components/AuditDisclosureView';
import { TeamAccessView } from './components/TeamAccessView';
import {
  AccessDeniedView,
  PrivacyGovernanceView,
} from './components/PrivacyAndGuardViews';
import {
  NoWorkspaceOrRemovedView,
  WorkspaceSetupChecklist,
  LoadingSkeletonState,
  DatabaseConnectionErrorState,
  DailyQuotaReachedState,
} from './components/EditorialEmptyStates';
import { ThemeToggle } from './components/ThemeToggle';
import { HelpAndTourModal } from './components/HelpAndTourModal';

export type DevPreviewScenario =
  | 'normal'
  | 'no-workspace'
  | 'deactivated'
  | 'empty-workspace'
  | 'empty-lists'
  | 'not-signed-in'
  | 'role-not-permitted'
  | 'role-request-pending'
  | 'session-expired'
  | 'loading-skeleton'
  | 'db-unreachable'
  | 'daily-limit-reached';

export type ActiveTab =
  | 'landing'
  | 'auth'
  | 'autopilot'
  | 'dashboard'
  | 'brand-library'
  | 'review-studio'
  | 'approvals'
  | 'revision-history'
  | 'insights'
  | 'audit-disclosure'
  | 'team-access'
  | 'privacy';

const ROLES: UserRole[] = ['Creator', 'Manager', 'Reviewer', 'Brand Admin'];

export const ROUTE_PERMISSIONS: Record<
  ActiveTab,
  { label: string; plainDescription: string; allowedRoles: UserRole[] }
> = {
  landing: {
    label: 'Overview',
    plainDescription: 'Learn how brand rules, AI checks, and human sign-off work together.',
    allowedRoles: ROLES,
  },
  auth: {
    label: 'Sign In',
    plainDescription: 'Sign in to your team workspace or explore the demo mode.',
    allowedRoles: ROLES,
  },
  dashboard: {
    label: 'Home',
    plainDescription: 'See all drafts and follow your role checklist to see what to do next.',
    allowedRoles: ROLES,
  },
  'review-studio': {
    label: 'Check content',
    plainDescription: 'Paste your draft or banner image to check it against approved brand rules.',
    allowedRoles: ROLES,
  },
  approvals: {
    label: 'Needs approval',
    plainDescription: 'Review drafts waiting for human sign-off and resolve items that need a person.',
    allowedRoles: ROLES,
  },
  'brand-library': {
    label: 'Brand rules',
    plainDescription: 'Keep all your verified guidelines, facts, and approved terms in one place.',
    allowedRoles: ROLES,
  },
  'team-access': {
    label: 'Team',
    plainDescription: 'Manage who has access to this workspace and what role they have.',
    allowedRoles: ['Brand Admin'],
  },
  autopilot: {
    label: 'Autopilot settings',
    plainDescription: 'Control how safely the automatic approval checker runs for your brand.',
    allowedRoles: ['Creator', 'Manager', 'Reviewer', 'Brand Admin'],
  },
  'revision-history': {
    label: 'Past versions',
    plainDescription: 'Compare earlier versions of a draft with side-by-side text diffs.',
    allowedRoles: ['Creator', 'Manager', 'Reviewer', 'Brand Admin'],
  },
  insights: {
    label: 'Patterns and tips',
    plainDescription: 'See which brand rules get broken most often so your team can improve.',
    allowedRoles: ['Manager', 'Reviewer', 'Brand Admin'],
  },
  'audit-disclosure': {
    label: 'Activity history',
    plainDescription: 'A permanent, unchangeable record of every check, edit, and human decision.',
    allowedRoles: ['Manager', 'Reviewer', 'Brand Admin'],
  },
  privacy: {
    label: 'Privacy & data',
    plainDescription: 'Understand how your content stays private and manage your local data.',
    allowedRoles: ['Creator', 'Manager', 'Reviewer', 'Brand Admin'],
  },
};

interface RoleNavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_NAVIGATION: Record<UserRole, { primary: RoleNavItem[]; more: RoleNavItem[] }> = {
  Creator: {
    primary: [
      { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
      { id: 'review-studio', label: 'Check content', icon: FileSearch },
      { id: 'approvals', label: 'Needs approval', icon: CheckSquare },
      { id: 'brand-library', label: 'Brand rules', icon: BookOpen },
    ],
    more: [
      { id: 'revision-history', label: 'Past versions', icon: GitCompare },
      { id: 'autopilot', label: 'Autopilot settings', icon: Zap },
      { id: 'privacy', label: 'Privacy & data', icon: Lock },
    ],
  },
  Reviewer: {
    primary: [
      { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
      { id: 'approvals', label: 'Needs approval', icon: CheckSquare },
      { id: 'review-studio', label: 'Check content', icon: FileSearch },
      { id: 'brand-library', label: 'Brand rules', icon: BookOpen },
    ],
    more: [
      { id: 'insights', label: 'Patterns and tips', icon: BarChart3 },
      { id: 'audit-disclosure', label: 'Activity history', icon: ShieldCheck },
      { id: 'revision-history', label: 'Past versions', icon: GitCompare },
      { id: 'autopilot', label: 'Autopilot settings', icon: Zap },
      { id: 'privacy', label: 'Privacy & data', icon: Lock },
    ],
  },
  Manager: {
    primary: [
      { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
      { id: 'review-studio', label: 'Check content', icon: FileSearch },
      { id: 'approvals', label: 'Needs approval', icon: CheckSquare },
      { id: 'brand-library', label: 'Brand rules', icon: BookOpen },
    ],
    more: [
      { id: 'insights', label: 'Patterns and tips', icon: BarChart3 },
      { id: 'audit-disclosure', label: 'Activity history', icon: ShieldCheck },
      { id: 'revision-history', label: 'Past versions', icon: GitCompare },
      { id: 'autopilot', label: 'Autopilot settings', icon: Zap },
      { id: 'privacy', label: 'Privacy & data', icon: Lock },
    ],
  },
  'Brand Admin': {
    primary: [
      { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
      { id: 'review-studio', label: 'Check content', icon: FileSearch },
      { id: 'approvals', label: 'Needs approval', icon: CheckSquare },
      { id: 'brand-library', label: 'Brand rules', icon: BookOpen },
      { id: 'team-access', label: 'Team', icon: Users },
    ],
    more: [
      { id: 'autopilot', label: 'Autopilot settings', icon: Zap },
      { id: 'audit-disclosure', label: 'Activity history', icon: ShieldCheck },
      { id: 'insights', label: 'Patterns and tips', icon: BarChart3 },
      { id: 'revision-history', label: 'Past versions', icon: GitCompare },
      { id: 'privacy', label: 'Privacy & data', icon: Lock },
    ],
  },
};

export default function App() {
  const initialState = loadInitialState();

  const [library, setLibrary] = useState<BrandLibraryState>(
    initialState.library
  );
  const [items, setItems] = useState<ContentItem[]>(initialState.items);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(
    initialState.auditLogs
  );

  // Auth, Workspaces, Members, Invites, Sign-In Activity
  const [userProfile, setUserProfile] =
    useState<AuthenticatedUserProfile | null>(() => loadStoredUserProfile());
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>(() =>
    loadWorkspaces()
  );
  const [members, setMembers] = useState<WorkspaceMemberRecord[]>(() =>
    loadWorkspaceMembers()
  );
  const [invites, setInvites] = useState<WorkspaceInviteRecord[]>(() =>
    loadWorkspaceInvites()
  );
  const [signInActivity, setSignInActivity] = useState<SignInActivityRecord[]>(
    () => loadSignInActivity()
  );

  // Navigation & Route state (Hash-based routing for GitHub Pages & deep link support)
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window === 'undefined') return 'landing';
    const hash = window.location.hash.replace(/^#\/?/, '').trim() as ActiveTab;
    return hash && ROUTE_PERMISSIONS[hash] ? hash : 'landing';
  });
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialState.items[0]?.id || 'CI-04'
  );

  // Account Menu Dropdown & Delete Confirmation
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [confirmDeleteInMenu, setConfirmDeleteInMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  // Session idle timeout tracking (30 minutes = 1800 seconds)
  const [sessionRemainingMinutes, setSessionRemainingMinutes] =
    useState<number>(30);

  // New Draft Modal State
  const [newDraftModalOpen, setNewDraftModalOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftChannel, setDraftChannel] = useState(
    'D2C Product Page & Campaign'
  );
  const [draftTeam, setDraftTeam] = useState('External Social Agency');
  const [draftText, setDraftText] = useState(
    'Cold-pressed in small batches in Wayanad, this virgin coconut oil honestly slaps and is lowkey our favourite evening hair ritual.'
  );

  // Auth redirect / session notice ("Please sign in to continue." or "Your session ended. Please sign in again.")
  const [authRedirectNotice, setAuthRedirectNotice] = useState<string | null>(
    null
  );

  // Database connection & quota status
  const [dbOfflineError, setDbOfflineError] = useState(false);
  const [dailyQuotaReached, setDailyQuotaReached] = useState(false);
  const [isLoadingView, setIsLoadingView] = useState(false);

  // Hidden developer toggle (visible only in demo mode) to preview every state
  const [devPreview, setDevPreview] = useState<DevPreviewScenario>('normal');
  const [devToggleExpanded, setDevToggleExpanded] = useState(false);

  // Help Modal, 4-Step Tour, and Plain Glossary State
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [helpModalView, setHelpModalView] = useState<'help' | 'tour' | 'glossary'>('help');
  const [showWelcomeTourBanner, setShowWelcomeTourBanner] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('nirnay_tour_completed') !== 'true';
    } catch {
      return false;
    }
  });
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Active effective role (derived from authenticated profile, or Brand Admin fallback)
  const activeRole: UserRole =
    devPreview === 'role-request-pending'
      ? 'Creator'
      : userProfile
      ? userProfile.role
      : 'Brand Admin';

  const activeWorkspace: WorkspaceRecord | undefined = workspaces.find(
    (w) => w.id === userProfile?.activeWorkspaceId
  );
  const fallbackWorkspace: WorkspaceRecord = activeWorkspace || workspaces[0];

  // Test Firestore connection on boot
  useEffect(() => {
    const checkConnection = async () => {
      if (!navigator.onLine) {
        setDbOfflineError(true);
        return;
      }
      await testFirestoreConnection();
    };
    checkConnection();

    const handleOffline = () => setDbOfflineError(true);
    const handleOnline = () => setDbOfflineError(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Persist workspace content state
  useEffect(() => {
    persistState(library, items, auditLogs);
  }, [library, items, auditLogs]);

  // Support URL hash route synchronization & guards (GitHub Pages refresh & deep linking)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim() as ActiveTab;
      if (hash && ROUTE_PERMISSIONS[hash]) {
        if (!userProfile && hash !== 'landing' && hash !== 'auth') {
          setAuthRedirectNotice('Please sign in to continue.');
          if (window.location.hash !== '#/auth') {
            window.location.hash = '#/auth';
          }
          setActiveTab('auth');
        } else {
          setActiveTab(hash);
        }
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [userProfile]);

  const navigateToTab = (tab: ActiveTab) => {
    if (!userProfile && tab !== 'landing' && tab !== 'auth') {
      setAuthRedirectNotice('Please sign in to continue.');
      if (window.location.hash !== '#/auth') {
        window.location.hash = '#/auth';
      }
      setActiveTab('auth');
      return;
    }
    if (window.location.hash !== `#/${tab}`) {
      window.location.hash = `#/${tab}`;
    }
    setActiveTab(tab);
  };

  // Close Account Menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target as Node)
      ) {
        setAccountMenuOpen(false);
        setConfirmDeleteInMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Idle session timeout tracker
  useEffect(() => {
    if (!userProfile) return;
    let idleSeconds = 0;
    const resetIdle = () => {
      idleSeconds = 0;
      setSessionRemainingMinutes(30);
    };
    const interval = setInterval(() => {
      idleSeconds += 60;
      const rem = Math.max(0, 30 - Math.floor(idleSeconds / 60));
      setSessionRemainingMinutes(rem);
      if (rem === 0) {
        setAuthRedirectNotice('Your session ended. Please sign in again.');
        handleSignOut(false, 'Session timed out after 30 minutes of inactivity.');
      }
    }, 60000);

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
    };
  }, [userProfile]);

  const handleRecordAudit = (
    eventType: AuditEventType,
    targetId: string,
    targetTitle: string,
    summary: string,
    details: Record<string, any> = {},
    actorOverride?: { name: string; role: UserRole | 'Autopilot AI' }
  ) => {
    const newEntry: AuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
      actorName: actorOverride
        ? actorOverride.name
        : userProfile?.displayName || `${activeRole} User`,
      actorRole: actorOverride ? actorOverride.role : activeRole,
      eventType,
      targetId,
      targetTitle,
      summary,
      details,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // ---------------------------------------------------------------------------
  // Authentication & Account Handlers
  // ---------------------------------------------------------------------------
  const handleUserAuthenticated = (
    profile: AuthenticatedUserProfile,
    createdWorkspace?: WorkspaceRecord
  ) => {
    if (createdWorkspace) {
      setWorkspaces(loadWorkspaces());
      setLibrary((prev) => ({
        ...prev,
        brandName: createdWorkspace.name,
      }));
    }
    setMembers(loadWorkspaceMembers());
    setInvites(loadWorkspaceInvites());
    setSignInActivity(loadSignInActivity());
    setUserProfile(profile);

    // Log sign-in to Audit Log
    handleRecordAudit(
      'AUTH_SIGN_IN',
      profile.uid,
      profile.displayName,
      `${profile.displayName} signed in via ${
        profile.isDemoSandbox
          ? 'Judge Demo Mode Sandbox'
          : profile.authProvider === 'google'
          ? 'Google OAuth'
          : 'Email + Password'
      } with effective role ${profile.role}${
        profile.approvalStatus === 'pending'
          ? ` (${profile.requestedRole} pending Brand Admin approval)`
          : ''
      }.`,
      {
        authProvider: profile.authProvider,
        workspaceId: profile.activeWorkspaceId,
        newRole: profile.role,
      },
      { name: profile.displayName, role: profile.role }
    );

    // Redirect each role to its role-appropriate home screen after sign-in
    const homeTab = getRoleHomeTab(profile.role) as ActiveTab;
    navigateToTab(homeTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async (allDevices = false, customReason?: string) => {
    if (userProfile) {
      handleRecordAudit(
        'AUTH_SIGN_OUT',
        userProfile.uid,
        userProfile.displayName,
        customReason ||
          (allDevices
            ? `${userProfile.displayName} executed "Sign out of all devices" (session epoch incremented).`
            : `${userProfile.displayName} signed out of workspace session.`),
        {
          authProvider: userProfile.authProvider,
          workspaceId: userProfile.activeWorkspaceId,
        },
        { name: userProfile.displayName, role: userProfile.role }
      );
    }
    await performSignOut(userProfile, allDevices);
    setSignInActivity(loadSignInActivity());
    setUserProfile(null);
    setAccountMenuOpen(false);
    setDevPreview('normal');
    if (customReason?.includes('Session')) {
      setAuthRedirectNotice('Your session ended. Please sign in again.');
    }
    setActiveTab('auth');
  };

  const handleDeleteMyAccount = async () => {
    if (!userProfile) return;
    handleRecordAudit(
      'ACCOUNT_DELETION',
      userProfile.uid,
      userProfile.displayName,
      `${userProfile.displayName} (${userProfile.email}) permanently deleted their account and personal profile data.`,
      { workspaceId: userProfile.activeWorkspaceId },
      { name: userProfile.displayName, role: userProfile.role }
    );
    await deleteAccountAndPersonalData(userProfile);
    setMembers(loadWorkspaceMembers());
    setSignInActivity(loadSignInActivity());
    setUserProfile(null);
    setAccountMenuOpen(false);
    setConfirmDeleteInMenu(false);
    navigateToTab('auth');
  };

  const handleSwitchRoleOrDemoPersona = (nextRole: UserRole) => {
    if (!userProfile) {
      const demo = createDemoSandboxSession(nextRole);
      setUserProfile(demo);
      return;
    }

    const prevRole = userProfile.role;
    if (prevRole === nextRole) return;

    const updated: AuthenticatedUserProfile = {
      ...userProfile,
      role: nextRole,
      requestedRole: nextRole,
      approvalStatus: 'approved',
    };
    saveStoredUserProfile(updated);
    setUserProfile(updated);

    handleRecordAudit(
      'ROLE_CHANGE',
      updated.uid,
      updated.displayName,
      `Switched active workspace role from ${prevRole} to ${nextRole}.`,
      { previousRole: prevRole, newRole: nextRole },
      { name: updated.displayName, role: nextRole }
    );
  };

  const handleSwitchWorkspace = (workspaceId: string) => {
    if (!userProfile) return;
    const targetWs = workspaces.find((w) => w.id === workspaceId);
    if (!targetWs) return;

    const updated: AuthenticatedUserProfile = {
      ...userProfile,
      activeWorkspaceId: targetWs.id,
    };
    saveStoredUserProfile(updated);
    setUserProfile(updated);
    setLibrary((prev) => ({
      ...prev,
      brandName: targetWs.name,
      autopilotConfig: {
        ...prev.autopilotConfig,
        mode: targetWs.autopilotMode,
      },
    }));
    setAccountMenuOpen(false);
  };

  // ---------------------------------------------------------------------------
  // Team & Access (Brand Admin) Handlers
  // ---------------------------------------------------------------------------
  const handleApproveRoleRequest = (memberUid: string) => {
    const target = members.find((m) => m.uid === memberUid);
    if (!target) return;

    const approvedRole = target.requestedRole;
    const nextMembers = members.map((m) =>
      m.uid === memberUid
        ? { ...m, role: approvedRole, approvalStatus: 'approved' as const }
        : m
    );
    setMembers(nextMembers);
    saveWorkspaceMembers(nextMembers);

    if (userProfile && userProfile.uid === memberUid) {
      const updatedSelf = {
        ...userProfile,
        role: approvedRole,
        approvalStatus: 'approved' as const,
      };
      setUserProfile(updatedSelf);
      saveStoredUserProfile(updatedSelf);
    }

    const nextAct = recordSignInActivity({
      uid: target.uid,
      userName: target.displayName,
      userEmail: target.email,
      role: approvedRole,
      authProvider: target.authProvider,
      event: 'ROLE_APPROVED',
      deviceSummary: `Approved ${approvedRole} access by ${
        userProfile?.displayName || 'Brand Admin'
      }`,
    });
    setSignInActivity(nextAct);

    handleRecordAudit(
      'ROLE_APPROVAL',
      target.uid,
      target.displayName,
      `Approved ${target.displayName}'s request for ${approvedRole} role (elevated from Creator).`,
      { previousRole: 'Creator', newRole: approvedRole }
    );
  };

  const handleRejectRoleRequest = (memberUid: string) => {
    const target = members.find((m) => m.uid === memberUid);
    if (!target) return;

    const nextMembers = members.map((m) =>
      m.uid === memberUid
        ? {
            ...m,
            role: 'Creator' as UserRole,
            requestedRole: 'Creator' as UserRole,
            approvalStatus: 'rejected' as const,
          }
        : m
    );
    setMembers(nextMembers);
    saveWorkspaceMembers(nextMembers);

    handleRecordAudit(
      'ROLE_APPROVAL',
      target.uid,
      target.displayName,
      `Rejected ${target.displayName}'s request for ${target.requestedRole}; retained Creator access.`,
      { previousRole: target.requestedRole, newRole: 'Creator' }
    );
  };

  const handleChangeMemberRole = (memberUid: string, nextRole: UserRole) => {
    const target = members.find((m) => m.uid === memberUid);
    if (!target || target.role === nextRole) return;

    const prevRole = target.role;
    const nextMembers = members.map((m) =>
      m.uid === memberUid
        ? {
            ...m,
            role: nextRole,
            requestedRole: nextRole,
            approvalStatus: 'approved' as const,
          }
        : m
    );
    setMembers(nextMembers);
    saveWorkspaceMembers(nextMembers);

    if (userProfile && userProfile.uid === memberUid) {
      const updatedSelf = {
        ...userProfile,
        role: nextRole,
        requestedRole: nextRole,
        approvalStatus: 'approved' as const,
      };
      setUserProfile(updatedSelf);
      saveStoredUserProfile(updatedSelf);
    }

    const nextAct = recordSignInActivity({
      uid: target.uid,
      userName: target.displayName,
      userEmail: target.email,
      role: nextRole,
      authProvider: target.authProvider,
      event: 'ROLE_CHANGED',
      deviceSummary: `Role changed from ${prevRole} to ${nextRole} by Brand Admin`,
    });
    setSignInActivity(nextAct);

    handleRecordAudit(
      'ROLE_CHANGE',
      target.uid,
      target.displayName,
      `Changed ${target.displayName}'s role from ${prevRole} to ${nextRole}.`,
      { previousRole: prevRole, newRole: nextRole }
    );
  };

  const handleToggleMemberStatus = (memberUid: string) => {
    const target = members.find((m) => m.uid === memberUid);
    if (!target) return;

    const nextStatus = target.status === 'active' ? 'deactivated' : 'active';
    const nextMembers = members.map((m) =>
      m.uid === memberUid ? { ...m, status: nextStatus as any } : m
    );
    setMembers(nextMembers);
    saveWorkspaceMembers(nextMembers);

    handleRecordAudit(
      'ROLE_CHANGE',
      target.uid,
      target.displayName,
      `${
        nextStatus === 'deactivated' ? 'Deactivated' : 'Reactivated'
      } workspace member ${target.displayName} (${target.email}).`,
      { decision: nextStatus }
    );
  };

  const handleGenerateInvite = (
    role: 'Creator' | 'Manager' | 'Reviewer',
    expiresAt: string
  ): WorkspaceInviteRecord => {
    const roleTag = role.slice(0, 3).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const newInvite: WorkspaceInviteRecord = {
      id: `INV-${fallbackWorkspace.workspaceCode.split('-')[0]}-${roleTag}-${rand}`,
      workspaceId: fallbackWorkspace.id,
      workspaceName: fallbackWorkspace.name,
      assignedRole: role,
      createdByUid: userProfile?.uid || 'usr-admin-ananya',
      createdByName: userProfile?.displayName || 'Brand Admin',
      expiresAt,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      usedCount: 0,
      revoked: false,
    };

    const nextInvites = [newInvite, ...invites];
    setInvites(nextInvites);
    saveWorkspaceInvites(nextInvites);

    handleRecordAudit(
      'INVITE_GENERATED',
      newInvite.id,
      fallbackWorkspace.name,
      `Generated workspace invite link ${newInvite.id} for role ${role} (expires ${expiresAt}).`,
      { newRole: role, workspaceId: fallbackWorkspace.id }
    );

    return newInvite;
  };

  const handleRevokeInvite = (inviteId: string) => {
    const nextInvites = invites.map((i) =>
      i.id === inviteId ? { ...i, revoked: true } : i
    );
    setInvites(nextInvites);
    saveWorkspaceInvites(nextInvites);
  };

  // ---------------------------------------------------------------------------
  // Content & Autopilot Handlers
  // ---------------------------------------------------------------------------
  const handleUpdateItem = (updatedItem: ContentItem) => {
    setItems((prev) =>
      prev.map((it) => (it.id === updatedItem.id ? updatedItem : it))
    );
  };

  const handleUpdateLibrary = (
    updatedLib: BrandLibraryState,
    auditSummary: string,
    sourceId: string
  ) => {
    setLibrary(updatedLib);
    handleRecordAudit(
      'LIBRARY_UPDATE',
      sourceId,
      updatedLib.brandName,
      auditSummary,
      { sourceId }
    );
  };

  const handleUpdateAutopilotConfig = (
    nextConfig: BrandLibraryState['autopilotConfig'],
    summary: string
  ) => {
    setLibrary((prev) => ({
      ...prev,
      autopilotConfig: nextConfig,
    }));
    handleRecordAudit(
      'LIBRARY_UPDATE',
      'AUTOPILOT-CONFIG',
      library.brandName,
      summary,
      { decision: nextConfig.mode }
    );
  };

  const handleIncrementGuidelineDispute = (sourceId: string) => {
    setLibrary((prev) => ({
      ...prev,
      guidelines: prev.guidelines.map((g) =>
        g.id === sourceId ? { ...g, disputedCount: g.disputedCount + 1 } : g
      ),
    }));
  };

  const executeZeroClickAutopilot = (incomingItem: ContentItem) => {
    const config = library.autopilotConfig;
    if (config.mode !== 'Autopilot' || config.killSwitchPaused) {
      setItems((prev) => {
        const exists = prev.some((i) => i.id === incomingItem.id);
        return exists
          ? prev.map((i) => (i.id === incomingItem.id ? incomingItem : i))
          : [incomingItem, ...prev];
      });
      return;
    }

    const topPassages = retrieveTopPassages(
      incomingItem.currentText,
      incomingItem.bannerConfig,
      library,
      6
    );

    const { sanitizedText } = redactConfidentialContent(
      incomingItem.currentText,
      topPassages,
      library,
      true
    );

    const deterministicFindings = runDeterministicRuleChecks(
      incomingItem.currentText,
      incomingItem.imageUrl,
      incomingItem.imageAltText,
      incomingItem.bannerConfig,
      library
    );

    const rawCandidates = buildPassageGroundedCandidateFindings(
      sanitizedText,
      library
    );

    const { verifiedFindings, discardedTraces } = verifyAiFindingsInCode(
      rawCandidates,
      library,
      deterministicFindings,
      incomingItem.currentText
    );

    const combinedFindings = [...deterministicFindings, ...verifiedFindings];

    const itemWithFindings: ContentItem = {
      ...incomingItem,
      retrievedPassages: topPassages,
      verifierStats: {
        lastRunAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        modelUsed: 'gemini-3.8-flash (Autopilot Zero-Click)',
        passagesRetrieved: topPassages.length,
        rawAiFindingsCount: rawCandidates.length,
        verifiedAiFindingsCount: verifiedFindings.length,
        discardedUngroundedCount: discardedTraces.length,
        deterministicRuleCount: deterministicFindings.length,
        confidentialRedacted: true,
        discardedTraces,
      },
    };

    const { updatedItem, actionRecord } = runAutopilotDecisionEngine(
      itemWithFindings,
      combinedFindings,
      library
    );

    setItems((prev) => {
      const exists = prev.some((i) => i.id === updatedItem.id);
      return exists
        ? prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
        : [updatedItem, ...prev];
    });

    setLibrary((prev) => ({
      ...prev,
      autopilotConfig: {
        ...prev.autopilotConfig,
        stats: {
          ...prev.autopilotConfig.stats,
          itemsProcessed: prev.autopilotConfig.stats.itemsProcessed + 1,
          autoApproved:
            actionRecord.outcome === 'AUTO_APPROVED'
              ? prev.autopilotConfig.stats.autoApproved + 1
              : prev.autopilotConfig.stats.autoApproved,
          escalatedToHumans:
            actionRecord.outcome === 'ESCALATED_TO_HUMAN'
              ? prev.autopilotConfig.stats.escalatedToHumans + 1
              : prev.autopilotConfig.stats.escalatedToHumans,
        },
      },
    }));

    const sourcesUsed = Array.from(
      new Set(
        (actionRecord.changesApplied.length > 0
          ? actionRecord.changesApplied.map((c) => c.sourceId)
          : combinedFindings.map((f) => f.sourceId)
        ).filter(Boolean)
      )
    ).join(', ');

    const beforeDiffSummary =
      actionRecord.changesApplied.length > 0
        ? actionRecord.changesApplied.map((c) => c.beforeSnippet).join(' | ')
        : undefined;
    const afterDiffSummary =
      actionRecord.changesApplied.length > 0
        ? actionRecord.changesApplied.map((c) => c.afterSnippet).join(' | ')
        : undefined;

    handleRecordAudit(
      actionRecord.outcome === 'AUTO_APPROVED'
        ? 'AUTOPILOT_AUTO_APPROVE'
        : 'AUTOPILOT_ESCALATE',
      updatedItem.id,
      updatedItem.title,
      actionRecord.summaryReason,
      {
        modelUsed: 'gemini-3.8-flash (Autopilot)',
        passagesSent: topPassages.length,
        confidentialRedacted: true,
        riskScore: actionRecord.maxRiskScore,
        sourceId: sourcesUsed || 'Verified Brand Library',
        beforeDiff: beforeDiffSummary,
        afterDiff: afterDiffSummary,
      },
      { name: 'Nirnay Sutra Autopilot', role: 'Autopilot AI' }
    );
  };

  const handleTriggerSimulatedSubmission = (
    presetType: 'low' | 'medium' | 'high'
  ) => {
    const newId = `CI-0${items.length + 1}`;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    let title = '';
    let text = '';
    let altText = '';
    let fgHex = '#0B3D3A';
    let bgHex = '#FAF8F4';

    if (presetType === 'low') {
      title = `Agency Feed: Mysore Sandal & Vetiver Mist Caption (${newId})`;
      text = `Steam-distilled in copper vessels using wild-harvested vetiver roots, this cooling facial mist slaps after a long commute and is lowkey our favourite summer staple.`;
      altText = '';
    } else if (presetType === 'medium') {
      title = `Agency Feed: Nilgiri Rosemary Scalp Tonic Banner (${newId})`;
      text = `Slow-infused with fresh Nilgiri rosemary sprigs in a 100% chemical-free botanical base for daily scalp massage.`;
      altText =
        'Amber glass bottle of Kaveri Organics Nilgiri Rosemary Scalp Tonic beside fresh rosemary sprigs.';
      fgHex = '#7FD1BF';
      bgHex = '#FAF8F4';
    } else {
      title = `Agency Feed: Wayanad Coconut Oil Influencer Promo (${newId})`;
      text = `Our 100% pesticide-free Wayanad Virgin Coconut Oil is a guaranteed miracle cure for hair fall at just ₹480, backed by our 28.5% retail partner margin.`;
      altText = '';
      fgHex = '#7FD1BF';
      bgHex = '#FAF8F4';
    }

    const baseItem: ContentItem = {
      id: newId,
      title,
      channel: 'Simulated Agency Feed',
      team: 'External Social Agency',
      authorName: 'Agency Submission Bot',
      assignedReviewer: 'Vikramaditya Menon',
      status: 'Draft',
      updatedAt: nowStr,
      currentText: text,
      imageUrl: GENERATED_PHOTOS.teamCopyDiscussion,
      imageMimeType: 'image/jpeg',
      imageAltText: altText,
      bannerConfig: {
        hasBanner: true,
        headline: title.slice(0, 36),
        subline: 'Kaveri Organics Botanical Harvest',
        fgHex,
        bgHex,
        accentHex: '#17806D',
        logoVariant: 'official-seal',
      },
      findings: [],
      retrievedPassages: [],
      versions: [
        {
          versionNumber: 1,
          timestamp: nowStr,
          authorName: 'Agency Submission Feed',
          authorRole: 'Creator',
          summary: `Arrived via Agency Submission Feed (${presetType.toUpperCase()} risk preset).`,
          contentText: text,
          imageAltText: altText,
          bannerConfig: {
            hasBanner: true,
            headline: title.slice(0, 36),
            subline: 'Kaveri Organics Botanical Harvest',
            fgHex,
            bgHex,
            accentHex: '#17806D',
            logoVariant: 'official-seal',
          },
        },
      ],
      comments: [],
    };

    setSelectedItemId(newId);
    executeZeroClickAutopilot(baseItem);
  };

  const handleRollbackAutopilotItem = (itemId: string) => {
    const target = items.find((i) => i.id === itemId);
    if (!target || !target.autopilotAction || target.rolledBack) return;

    const snap = target.autopilotAction.snapshotBefore;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const nextVer = target.versions.length + 1;
    const actorLabel = userProfile?.displayName || `${activeRole} User`;

    const restoredItem: ContentItem = {
      ...target,
      currentText: snap.contentText,
      imageAltText: snap.imageAltText,
      bannerConfig: { ...snap.bannerConfig },
      status: 'In review',
      updatedAt: nowStr,
      autoApprovedByAi: false,
      escalatedToHuman: true,
      rolledBack: true,
      escalationReasons: [
        `Rolled back by ${actorLabel} (${activeRole}) via One-Click Undo. Pre-Autopilot draft restored for manual human review.`,
      ],
      autopilotAction: {
        ...target.autopilotAction,
        outcome: 'ROLLED_BACK',
        rolledBack: true,
        rolledBackAt: nowStr,
        rolledBackBy: actorLabel,
      },
      versions: [
        ...target.versions,
        {
          versionNumber: nextVer,
          timestamp: nowStr,
          authorName: actorLabel,
          authorRole: activeRole,
          summary: `One-Click Rollback: Restored pre-Autopilot version and revoked AI auto-approval.`,
          contentText: snap.contentText,
          imageAltText: snap.imageAltText,
          bannerConfig: { ...snap.bannerConfig },
        },
      ],
      comments: [
        ...target.comments,
        {
          id: `CM-RB-${Date.now()}`,
          authorName: actorLabel,
          authorRole: activeRole,
          timestamp: nowStr,
          text: `Executed One-Click Undo/Rollback on Autopilot changes. Restored original draft and routed to human review.`,
          actionType: 'status-change',
        },
      ],
    };

    handleUpdateItem(restoredItem);

    setLibrary((prev) => ({
      ...prev,
      autopilotConfig: {
        ...prev.autopilotConfig,
        stats: {
          ...prev.autopilotConfig.stats,
          autoApproved: Math.max(
            0,
            prev.autopilotConfig.stats.autoApproved - 1
          ),
          escalatedToHumans: prev.autopilotConfig.stats.escalatedToHumans + 1,
          rolledBack: prev.autopilotConfig.stats.rolledBack + 1,
        },
      },
    }));

    handleRecordAudit(
      'AUTOPILOT_ROLLBACK',
      target.id,
      target.title,
      `Executed One-Click Undo/Rollback on "${target.title}". Restored pre-Autopilot text and revoked AI auto-approval.`,
      {
        sourceId: target.autopilotAction.changesApplied
          .map((c) => c.sourceId)
          .join(', '),
        riskScore: target.maxRiskScore,
        beforeDiff: target.autopilotAction.snapshotAfter.contentText.slice(
          0,
          90
        ),
        afterDiff: snap.contentText.slice(0, 90),
      }
    );
  };

  const handleCreateNewDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim() || !draftText.trim()) return;

    const newId = `CI-0${items.length + 1}`;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const actorLabel = userProfile?.displayName || `${activeRole} User`;

    const newItem: ContentItem = {
      id: newId,
      title: draftTitle.trim(),
      channel: draftChannel.trim(),
      team: draftTeam.trim(),
      authorName: actorLabel,
      assignedReviewer: 'Vikramaditya Menon',
      status: 'Draft',
      updatedAt: nowStr,
      currentText: draftText.trim(),
      imageUrl: GENERATED_PHOTOS.quietWorkspaceSwatch,
      imageMimeType: 'image/jpeg',
      imageAltText: '',
      bannerConfig: {
        hasBanner: true,
        headline: draftTitle.trim().slice(0, 38),
        subline: 'Kaveri Organics Harvest Formulation',
        fgHex: '#0B3D3A',
        bgHex: '#FAF8F4',
        accentHex: '#17806D',
        logoVariant: 'official-seal',
      },
      findings: [],
      retrievedPassages: [],
      versions: [
        {
          versionNumber: 1,
          timestamp: nowStr,
          authorName: actorLabel,
          authorRole: activeRole,
          summary: 'Created initial content draft.',
          contentText: draftText.trim(),
          imageAltText: '',
          bannerConfig: {
            hasBanner: true,
            headline: draftTitle.trim().slice(0, 38),
            subline: 'Kaveri Organics Harvest Formulation',
            fgHex: '#0B3D3A',
            bgHex: '#FAF8F4',
            accentHex: '#17806D',
            logoVariant: 'official-seal',
          },
        },
      ],
      comments: [],
    };

    setSelectedItemId(newId);
    setNewDraftModalOpen(false);
    setDraftTitle('');

    if (
      library.autopilotConfig.mode === 'Autopilot' &&
      !library.autopilotConfig.killSwitchPaused
    ) {
      executeZeroClickAutopilot(newItem);
      navigateToTab('autopilot');
    } else {
      setItems((prev) => [newItem, ...prev]);
      navigateToTab('review-studio');
      handleRecordAudit(
        'HUMAN_DECISION',
        newId,
        newItem.title,
        `Created new content draft "${newItem.title}" (${newId}).`
      );
    }
  };

  const handleResetAll = () => {
    const fresh = resetToSeedData();
    setLibrary(fresh.library);
    setItems(fresh.items);
    setAuditLogs(fresh.auditLogs);
    setSelectedItemId(fresh.items[0].id);
    setDevPreview('normal');
    setDbOfflineError(false);
    setDailyQuotaReached(false);
    setIsLoadingView(false);
  };

  // Developer Toggle Handler (lets user preview every required state with 1 click)
  const handleApplyDevPreview = (scenario: DevPreviewScenario) => {
    setDevPreview(scenario);
    setDbOfflineError(scenario === 'db-unreachable');
    setDailyQuotaReached(scenario === 'daily-limit-reached');
    setIsLoadingView(scenario === 'loading-skeleton');

    if (scenario === 'not-signed-in') {
      setAuthRedirectNotice('Please sign in to continue.');
      setActiveTab('auth');
      return;
    }

    if (scenario === 'session-expired') {
      setAuthRedirectNotice('Your session ended. Please sign in again.');
      setActiveTab('auth');
      return;
    }

    // Ensure a demo profile is active for workspace-level previews
    if (!userProfile) {
      const demo = createDemoSandboxSession('Brand Admin');
      setUserProfile(demo);
    }

    if (scenario === 'role-not-permitted') {
      if (userProfile && userProfile.role === 'Brand Admin') {
        handleSwitchRoleOrDemoPersona('Creator');
      }
      setActiveTab('team-access');
      return;
    }

    if (scenario === 'empty-workspace') {
      setActiveTab('review-studio');
      return;
    }

    if (scenario === 'normal') {
      setAuthRedirectNotice(null);
      if (activeTab === 'auth' || activeTab === 'landing') {
        setActiveTab('dashboard');
      }
    }
  };

  // Effective data based on current workspace or developer preview scenario
  const effectiveLibrary: BrandLibraryState =
    devPreview === 'empty-workspace'
      ? {
          ...library,
          guidelines: [],
          facts: [],
          terminology: [],
          assets: [],
        }
      : library;

  const effectiveItems: ContentItem[] =
    devPreview === 'empty-workspace' || devPreview === 'empty-lists'
      ? []
      : items;

  const effectiveAuditLogs: AuditLogEntry[] =
    devPreview === 'empty-workspace' || devPreview === 'empty-lists'
      ? []
      : auditLogs;

  const effectiveMembers: WorkspaceMemberRecord[] =
    devPreview === 'empty-workspace' || devPreview === 'empty-lists'
      ? members.slice(0, 1)
      : members;

  // Check if workspace setup checklist should be shown
  const workspaceSetupIncomplete =
    devPreview === 'empty-workspace' ||
    effectiveLibrary.guidelines.length === 0 ||
    effectiveLibrary.facts.length === 0 ||
    effectiveLibrary.terminology.length === 0 ||
    effectiveMembers.filter((m) => m.workspaceId === fallbackWorkspace.id)
      .length <= 1;

  // ---------------------------------------------------------------------------
  // 1. Landing Page
  // ---------------------------------------------------------------------------
  if (activeTab === 'landing') {
    return (
      <LandingPage
        onEnterWorkspace={(target) => {
          if (!userProfile) {
            setAuthRedirectNotice('Please sign in to continue.');
            setActiveTab('auth');
          } else {
            navigateToTab(
              (target as ActiveTab) ||
                (getRoleHomeTab(userProfile.role) as ActiveTab)
            );
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Authentication & Onboarding Screens (Login, 2-Step Sign-Up, Verify, Pending, Demo Mode)
  // ---------------------------------------------------------------------------
  if (
    activeTab === 'auth' ||
    !userProfile ||
    devPreview === 'not-signed-in' ||
    devPreview === 'session-expired'
  ) {
    return (
      <div>
        {userProfile?.isDemoSandbox &&
          (devPreview === 'not-signed-in' ||
            devPreview === 'session-expired') && (
            <div className="bg-[#0B3D3A] text-[#FAF8F4] px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-[#17806D]">
              <span className="font-mono-tabular">
                Developer State Preview Active:{' '}
                <strong className="text-[#7FD1BF]">
                  {devPreview === 'not-signed-in'
                    ? 'Not signed in redirect'
                    : 'Session expired'}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => handleApplyDevPreview('normal')}
                className="px-3 py-1 rounded bg-[#7FD1BF] text-[#0B3D3A] font-semibold cursor-pointer"
              >
                Return to Demo Workspace
              </button>
            </div>
          )}
        <AuthViews
          pendingUser={userProfile}
          redirectNotice={authRedirectNotice}
          onDismissRedirectNotice={() => setAuthRedirectNotice(null)}
          onAuthenticated={(profile, createdWs) => {
            setAuthRedirectNotice(null);
            setDevPreview('normal');
            handleUserAuthenticated(profile, createdWs);
          }}
          onBackToLanding={() => {
            setAuthRedirectNotice(null);
            setDevPreview('normal');
            setActiveTab('landing');
          }}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2B. SIGNED IN BUT NO WORKSPACE OR REMOVED / DEACTIVATED
  // ---------------------------------------------------------------------------
  const isRemovedOrDeactivated =
    userProfile.status === 'deactivated' || devPreview === 'deactivated';
  const hasNoWorkspace =
    !userProfile.activeWorkspaceId ||
    !activeWorkspace ||
    devPreview === 'no-workspace';

  if (isRemovedOrDeactivated || hasNoWorkspace) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] text-[#142321] flex flex-col">
        {userProfile.isDemoSandbox && (
          <div className="bg-[#0B3D3A] text-[#FAF8F4] px-4 py-2 border-b border-[#17806D] flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-mono-tabular">
              Demo State Preview:{' '}
              <strong className="text-[#7FD1BF]">
                {isRemovedOrDeactivated
                  ? 'Deactivated / Removed Member'
                  : 'Signed In With No Workspace'}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => handleApplyDevPreview('normal')}
              className="px-3 py-1 rounded bg-[#7FD1BF] text-[#0B3D3A] font-semibold cursor-pointer"
            >
              Restore Demo Workspace
            </button>
          </div>
        )}
        <NoWorkspaceOrRemovedView
          mode={isRemovedOrDeactivated ? 'deactivated' : 'no-workspace'}
          userDisplayName={userProfile.displayName}
          userEmail={userProfile.email}
          onCreateWorkspace={(orgName) => {
            const code = `${orgName
              .replace(/[^A-Za-z0-9]/g, '')
              .slice(0, 6)
              .toUpperCase()}-2026`;
            const newWs: WorkspaceRecord = {
              id: `ws-${Date.now()}`,
              name: orgName,
              workspaceCode: code,
              ownerUid: userProfile.uid,
              createdAt: new Date().toISOString().slice(0, 10),
              autopilotMode: 'Autopilot',
            };
            const updatedWorkspaces = [newWs, ...workspaces];
            saveWorkspaces(updatedWorkspaces);
            setWorkspaces(updatedWorkspaces);

            const updatedProfile: AuthenticatedUserProfile = {
              ...userProfile,
              role: 'Brand Admin',
              requestedRole: 'Brand Admin',
              approvalStatus: 'approved',
              activeWorkspaceId: newWs.id,
              status: 'active',
            };
            saveStoredUserProfile(updatedProfile);
            setUserProfile(updatedProfile);

            // Start new workspace empty so the 4-step checklist appears
            setLibrary((prev) => ({
              ...prev,
              brandName: orgName,
              guidelines: [],
              facts: [],
              terminology: [],
            }));
            setItems([]);
            setDevPreview('empty-workspace');
            navigateToTab('dashboard');
          }}
          onJoinWorkspace={(codeOrInvite, requestedRole) => {
            const matchedWs =
              workspaces.find(
                (w) =>
                  w.workspaceCode.toLowerCase() === codeOrInvite.toLowerCase()
              ) || workspaces[0];
            const isElevated =
              requestedRole === 'Manager' || requestedRole === 'Reviewer';
            const updatedProfile: AuthenticatedUserProfile = {
              ...userProfile,
              role: 'Creator',
              requestedRole,
              approvalStatus: isElevated ? 'pending' : 'approved',
              activeWorkspaceId: matchedWs.id,
              status: 'active',
            };
            saveStoredUserProfile(updatedProfile);
            setUserProfile(updatedProfile);
            setDevPreview(isElevated ? 'role-request-pending' : 'normal');
            navigateToTab('dashboard');
          }}
          onExploreDemoWorkspace={() => {
            handleResetAll();
            const demo = createDemoSandboxSession('Brand Admin');
            setUserProfile(demo);
            setDevPreview('normal');
            navigateToTab('dashboard');
          }}
          onSignOut={() => handleSignOut(false)}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Authenticated / Demo Sandbox Workspace Shell
  // ---------------------------------------------------------------------------
  const roleNav = ROLE_NAVIGATION[activeRole] || ROLE_NAVIGATION.Creator;

  const openFindingsCount = effectiveItems.reduce(
    (acc, it) => acc + it.findings.filter((f) => f.status === 'open').length,
    0
  );

  const pendingApprovalsCount = effectiveMembers.filter(
    (m) =>
      m.workspaceId === fallbackWorkspace.id && m.approvalStatus === 'pending'
  ).length;

  const isAutopilotRunning =
    effectiveLibrary.autopilotConfig.mode === 'Autopilot' &&
    !effectiveLibrary.autopilotConfig.killSwitchPaused;

  // Route Guard check for current activeTab
  const currentRouteMeta = ROUTE_PERMISSIONS[activeTab];
  const hasRouteAccess =
    devPreview === 'role-not-permitted'
      ? false
      : currentRouteMeta
      ? currentRouteMeta.allowedRoles.includes(activeRole)
      : true;

  const showPendingBanner =
    userProfile.approvalStatus === 'pending' ||
    devPreview === 'role-request-pending';
  const pendingBannerRole =
    devPreview === 'role-request-pending'
      ? 'Reviewer'
      : userProfile.requestedRole;

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#142321] flex flex-col">
      {/* Visible Demo Mode Sandbox Banner + Hidden Developer State Preview Toggle (visible only in demo mode) */}
      {userProfile.isDemoSandbox && (
        <div
          role="region"
          aria-label="Demo Mode Sandbox Banner"
          className="bg-[#0B3D3A] text-[#FAF8F4] border-b border-[#17806D] text-xs"
        >
          <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#F5A524] text-[#142321] font-mono-tabular font-semibold uppercase text-[10px]">
                Demo Mode
              </span>
              <span>
                Exploring <strong>{fallbackWorkspace.name}</strong> Sandbox as{' '}
                <strong className="text-[#7FD1BF]">{activeRole}</strong> — Sandbox changes stay isolated and never overwrite live Firestore data.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-[#7FD1BF] font-mono-tabular">
                Role Switch:
              </span>
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleSwitchRoleOrDemoPersona(r)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                    activeRole === r
                      ? 'bg-[#7FD1BF] text-[#0B3D3A] font-semibold'
                      : 'bg-[#17806D]/50 text-[#FAF8F4] hover:bg-[#17806D]'
                  }`}
                >
                  {r}
                </button>
              ))}
              <span className="text-[#7FD1BF]/40">|</span>
              <button
                type="button"
                onClick={() => setDevToggleExpanded((prev) => !prev)}
                aria-expanded={devToggleExpanded}
                className="px-2.5 py-0.5 rounded bg-[#17806D] hover:bg-[#7FD1BF] hover:text-[#0B3D3A] text-[#FAF8F4] font-mono-tabular text-[11px] cursor-pointer transition-colors"
              >
                {devToggleExpanded
                  ? 'Hide State Preview Toggle'
                  : `Developer State Preview (${devPreview})`}
              </button>
              <span className="text-[#7FD1BF]/40">|</span>
              <button
                type="button"
                onClick={() => handleSignOut(false)}
                className="underline text-[#FAF8F4] hover:text-[#7FD1BF] text-[11px] cursor-pointer"
              >
                Exit Demo / Sign In
              </button>
            </div>
          </div>

          {/* Collapsible Developer State Preview Bar (visible only in demo mode) */}
          {devToggleExpanded && (
            <div className="px-4 py-3 bg-[#142321] border-t border-[#17806D]/50 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono-tabular text-[#7FD1BF]">
                  Developer Toggle (Demo Mode Only) — Click any state below to preview its exact UI, copy, and actions:
                </span>
                <button
                  type="button"
                  onClick={() => handleApplyDevPreview('normal')}
                  className="text-[11px] underline text-[#FAF8F4] hover:text-[#7FD1BF] cursor-pointer"
                >
                  Reset to Default Seeded State
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'normal', label: '0. Default (Seeded)' },
                    { id: 'no-workspace', label: '1a. No Workspace' },
                    { id: 'deactivated', label: '1b. Removed / Deactivated' },
                    {
                      id: 'empty-workspace',
                      label: '2. Empty Workspace (0/4 Checklist + Review Gate)',
                    },
                    { id: 'empty-lists', label: '3. Empty Lists & Pages' },
                    { id: 'not-signed-in', label: '4a. Not Signed In' },
                    {
                      id: 'role-not-permitted',
                      label: '4b. Role Not Permitted',
                    },
                    {
                      id: 'role-request-pending',
                      label: '4c. Role Request Pending',
                    },
                    { id: 'session-expired', label: '4d. Session Expired' },
                    {
                      id: 'loading-skeleton',
                      label: '5a. Loading Skeleton (8s Cap)',
                    },
                    {
                      id: 'db-unreachable',
                      label: '5b. Database Offline / Unreachable',
                    },
                    {
                      id: 'daily-limit-reached',
                      label: '5c. Free Daily Limit Reached',
                    },
                  ] as Array<{ id: DevPreviewScenario; label: string }>
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleApplyDevPreview(s.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono-tabular transition-colors cursor-pointer ${
                      devPreview === s.id
                        ? 'bg-[#7FD1BF] text-[#0B3D3A] font-semibold'
                        : 'bg-[#0B3D3A] text-[#E4DFD3] border border-[#17806D]/50 hover:border-[#7FD1BF]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending Role Approval Banner (exact copy required) */}
      {showPendingBanner && (
        <div
          role="status"
          aria-live="polite"
          className="bg-[#F5A524]/20 border-b border-[#F5A524]/50 px-6 py-2.5 text-xs text-[#142321] flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
            <span>
              Your request for <strong>{pendingBannerRole}</strong> access is waiting for admin approval. You can use Creator access in the meantime.
            </span>
          </div>
          <span className="font-mono-tabular text-[11px] text-[#B45309]">
            Workspace: {fallbackWorkspace.name}
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Workspace Sidebar (260px) */}
        <aside
          aria-label="Workspace Navigation"
          className="w-full lg:w-[260px] shrink-0 bg-[#F3EFE6] border-b lg:border-b-0 lg:border-r border-[#E4DFD3] flex flex-col justify-between"
        >
          <div>
            {/* Brand Wordmark Header */}
            <div className="p-5 border-b border-[#E4DFD3] flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigateToTab('landing')}
                className="text-left cursor-pointer group"
              >
                <span className="font-devanagari text-sm font-semibold text-[#17806D] block">
                  निर्णय सूत्र
                </span>
                <span className="font-serif-display text-lg font-semibold text-[#0B3D3A] group-hover:underline">
                  Nirnay Sutra
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigateToTab('landing')}
                title="Return to Editorial Landing Page"
                className="text-xs text-[#526360] hover:text-[#0B3D3A] inline-flex items-center gap-1 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Landing</span>
              </button>
            </div>

            {/* Active Workspace & Autopilot Context */}
            <div className="px-5 py-3.5 border-b border-[#E4DFD3] bg-[#FAF8F4]/60">
              <div className="flex items-center justify-between text-[11px] text-[#526360]">
                <span>Workspace ({fallbackWorkspace.workspaceCode})</span>
                <span
                  className={`font-mono-tabular font-semibold ${
                    isAutopilotRunning ? 'text-[#17806D]' : 'text-[#B45309]'
                  }`}
                >
                  {effectiveLibrary.autopilotConfig.killSwitchPaused
                    ? 'Paused'
                    : effectiveLibrary.autopilotConfig.mode}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#0B3D3A] truncate mt-0.5">
                {fallbackWorkspace.name}
              </p>
              <p className="text-[11px] text-[#526360] font-mono-tabular mt-0.5">
                {effectiveItems.length} items · {openFindingsCount} open flags
              </p>
            </div>

            {/* Role-Specific Navigation (At most 5 plain items per role) */}
            <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
              {roleNav.primary.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateToTab(item.id)}
                    className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#0B3D3A] text-[#FAF8F4] dark:bg-[#17806D] font-semibold'
                        : 'text-[#364946] dark:text-[#A3B8B4] hover:bg-[#FAF8F4] dark:hover:bg-[#18302D] hover:text-[#0B3D3A] dark:hover:text-[#7FD1BF]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {item.id === 'approvals' && openFindingsCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono-tabular rounded bg-[#F5A524] text-[#142321] font-semibold">
                        {openFindingsCount}
                      </span>
                    )}
                    {item.id === 'team-access' &&
                      activeRole === 'Brand Admin' &&
                      pendingApprovalsCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono-tabular rounded bg-[#F5A524] text-[#142321] font-semibold">
                          {pendingApprovalsCount}
                        </span>
                      )}
                  </button>
                );
              })}

              {/* Advanced Pages Under "More" */}
              {roleNav.more.length > 0 && (
                <div className="pt-2 mt-2 border-t border-[#E4DFD3] dark:border-[#1F3834]">
                  <button
                    type="button"
                    onClick={() => setMoreMenuOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                      roleNav.more.some((m) => m.id === activeTab)
                        ? 'bg-[#F3EFE6] dark:bg-[#18302D] text-[#0B3D3A] dark:text-[#7FD1BF] font-semibold'
                        : 'text-[#526360] dark:text-[#9BB0AC] hover:bg-[#FAF8F4] dark:hover:bg-[#18302D]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MoreHorizontal className="w-4 h-4 shrink-0" />
                      <span>More pages</span>
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {(moreMenuOpen || roleNav.more.some((m) => m.id === activeTab)) && (
                    <div className="pl-3 pr-1 pt-1 space-y-1">
                      {roleNav.more.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => navigateToTab(item.id)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-[#0B3D3A] text-[#FAF8F4] dark:bg-[#17806D] font-semibold'
                                : 'text-[#526360] dark:text-[#9BB0AC] hover:bg-[#FAF8F4] dark:hover:bg-[#18302D] hover:text-[#0B3D3A] dark:hover:text-[#7FD1BF]'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </span>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          setHelpModalView('glossary');
                          setHelpModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium text-[#17806D] dark:text-[#2DD4BF] hover:bg-[#FAF8F4] dark:hover:bg-[#18302D] cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                        <span>Plain glossary</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>

          {/* Role Context & Permissions Card in Sidebar Footer */}
          <div className="p-4 border-t border-[#E4DFD3] space-y-2.5 bg-[#FAF8F4]/50">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#0B3D3A] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#17806D]" />
                <span>Active Role: {activeRole}</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleSwitchRoleOrDemoPersona(r)}
                  className={`px-2.5 py-1.5 text-[11px] font-medium rounded border transition-colors whitespace-nowrap cursor-pointer ${
                    activeRole === r
                      ? 'bg-[#0B3D3A] text-[#FAF8F4] border-[#0B3D3A]'
                      : 'bg-[#FAF8F4] text-[#364946] border-[#E4DFD3] hover:border-[#0B3D3A]/40'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#526360] leading-snug">
              {activeRole === 'Creator' &&
                'Creators submit content, see own findings, and accept/dismiss suggestions.'}
              {activeRole === 'Manager' &&
                'Managers assign reviewers, comment, request changes, and view team insights.'}
              {activeRole === 'Reviewer' &&
                'Reviewers inspect queues, view Confidential items, and resolve Autopilot exceptions.'}
              {activeRole === 'Brand Admin' &&
                'Brand Admins manage Brand Library, Autopilot settings, Team & Access, and Audit logs.'}
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Contextual Top Bar with Global Pause Autopilot Kill Switch & Account Menu */}
          <header className="bg-[#FAF8F4] border-b border-[#E4DFD3] px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 text-xs text-[#526360] truncate">
                <span className="font-semibold text-[#0B3D3A]">
                  {fallbackWorkspace.name}
                </span>
                <span aria-hidden="true">/</span>
                <span className="text-[#142321] font-semibold">
                  {currentRouteMeta?.label}
                </span>
                <span aria-hidden="true" className="hidden sm:inline">
                  ·
                </span>
                <span className="hidden sm:inline font-mono-tabular text-[#17806D]">
                  Autopilot:{' '}
                  {library.autopilotConfig.killSwitchPaused
                    ? 'PAUSED'
                    : library.autopilotConfig.mode}
                </span>
              </div>
              {currentRouteMeta?.plainDescription && (
                <p className="text-xs text-[#526360] mt-0.5 hidden md:block truncate">
                  {currentRouteMeta.plainDescription}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Help & Plain Glossary Button */}
              <button
                type="button"
                onClick={() => {
                  setHelpModalView('help');
                  setHelpModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[#E4DFD3] bg-white text-[#0B3D3A] hover:bg-[#F3EFE6] transition-colors cursor-pointer"
                title="How this page works, tour, and plain glossary"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#17806D]" />
                <span>Help</span>
              </button>

              {/* Global Pause Autopilot Kill Switch */}
              <button
                type="button"
                onClick={() =>
                  handleUpdateAutopilotConfig(
                    {
                      ...library.autopilotConfig,
                      killSwitchPaused:
                        !library.autopilotConfig.killSwitchPaused,
                    },
                    library.autopilotConfig.killSwitchPaused
                      ? 'Resumed Autopilot pipeline from global top bar.'
                      : 'Engaged Global Pause Autopilot Kill Switch from top bar.'
                  )
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  library.autopilotConfig.killSwitchPaused
                    ? 'bg-[#17806D] text-[#FAF8F4] border-[#17806D]'
                    : 'bg-[#FEE2E2]/80 text-[#991B1B] border-[#991B1B]/30 hover:bg-[#991B1B] hover:text-[#FAF8F4]'
                }`}
              >
                {library.autopilotConfig.killSwitchPaused ? (
                  <>
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Resume Autopilot</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>Pause Autopilot</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setNewDraftModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Paste / New Draft</span>
              </button>

              {/* Theme Toggle (Light / Dark Mode) */}
              <ThemeToggle variant="compact" />

              {/* ACCOUNT MENU IN HEADER */}
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  aria-expanded={accountMenuOpen}
                  aria-label="Open Account and Workspace Menu"
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded border border-[#E4DFD3] bg-[#F3EFE6] hover:border-[#0B3D3A] text-xs cursor-pointer transition-colors"
                >
                  {userProfile.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.displayName}
                      className="w-6 h-6 rounded-full object-cover border border-[#0B3D3A]/30"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-[#0B3D3A] text-[#FAF8F4] font-mono-tabular text-[11px] font-semibold flex items-center justify-center">
                      {userProfile.displayName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="hidden md:inline font-medium text-[#0B3D3A] max-w-[130px] truncate">
                    {userProfile.displayName}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono-tabular rounded bg-[#0B3D3A] text-[#FAF8F4]">
                    {activeRole}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#526360]" />
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-[#FAF8F4] border border-[#0B3D3A] rounded shadow-xl z-50 p-4 space-y-3 text-xs">
                    {/* User Identity & Role Badge */}
                    <div className="pb-3 border-b border-[#E4DFD3] flex items-start gap-3">
                      {userProfile.photoURL ? (
                        <img
                          src={userProfile.photoURL}
                          alt={userProfile.displayName}
                          className="w-9 h-9 rounded-full object-cover border border-[#0B3D3A]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#0B3D3A] text-[#FAF8F4] font-mono-tabular text-xs font-semibold flex items-center justify-center shrink-0">
                          {userProfile.displayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#0B3D3A] truncate">
                          {userProfile.displayName}
                        </p>
                        <p className="text-[11px] text-[#526360] font-mono-tabular truncate">
                          {userProfile.email}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 text-[10px] font-mono-tabular rounded bg-[#7FD1BF]/30 text-[#0B3D3A] font-semibold">
                            Role: {activeRole}
                          </span>
                          <span className="text-[10px] font-mono-tabular text-[#526360]">
                            · Timeout: {sessionRemainingMinutes}m
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Workspace Switcher */}
                    <div className="space-y-1.5 pb-3 border-b border-[#E4DFD3]">
                      <label className="block text-[11px] font-mono-tabular uppercase text-[#526360]">
                        Workspace Switcher
                      </label>
                      <div className="space-y-1">
                        {workspaces.map((ws) => (
                          <button
                            key={ws.id}
                            type="button"
                            onClick={() => handleSwitchWorkspace(ws.id)}
                            className={`w-full px-2.5 py-1.5 rounded text-left flex items-center justify-between cursor-pointer ${
                              ws.id === fallbackWorkspace.id
                                ? 'bg-[#0B3D3A] text-[#FAF8F4] font-medium'
                                : 'hover:bg-[#F3EFE6] text-[#142321]'
                            }`}
                          >
                            <span className="truncate flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{ws.name}</span>
                            </span>
                            <span className="text-[10px] font-mono-tabular opacity-80 shrink-0 ml-2">
                              {ws.workspaceCode}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Theme Mode Preference (Light / Dark / System) */}
                    <div className="space-y-1.5 pb-3 border-b border-[#E4DFD3] dark:border-[#1C3330]">
                      <div className="flex items-center justify-between text-[11px] font-mono-tabular uppercase text-[#526360] dark:text-[#9BB0AC]">
                        <span>Theme Mode</span>
                      </div>
                      <ThemeToggle variant="segmented" className="w-full justify-between" />
                    </div>

                    {/* Quick Links: Team & Access (Brand Admin) and Privacy Notice */}
                    <div className="space-y-1 pb-3 border-b border-[#E4DFD3]">
                      {activeRole === 'Brand Admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            navigateToTab('team-access');
                          }}
                          className="w-full px-2.5 py-1.5 rounded text-left hover:bg-[#F3EFE6] text-[#0B3D3A] font-medium flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-[#17806D]" />
                            <span>Team &amp; Access Management</span>
                          </span>
                          {pendingApprovalsCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-mono-tabular rounded bg-[#F5A524] text-[#142321] font-semibold">
                              {pendingApprovalsCount} pending
                            </span>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          navigateToTab('privacy');
                        }}
                        className="w-full px-2.5 py-1.5 rounded text-left hover:bg-[#F3EFE6] text-[#142321] flex items-center gap-2 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-[#17806D]" />
                        <span>Privacy &amp; Data</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          setHelpModalView('tour');
                          setHelpModalOpen(true);
                        }}
                        className="w-full px-2.5 py-1.5 rounded text-left hover:bg-[#F3EFE6] text-[#142321] flex items-center gap-2 cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#17806D]" />
                        <span>Show beginner tour again</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          setHelpModalView('glossary');
                          setHelpModalOpen(true);
                        }}
                        className="w-full px-2.5 py-1.5 rounded text-left hover:bg-[#F3EFE6] text-[#142321] flex items-center gap-2 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#17806D]" />
                        <span>Plain glossary</span>
                      </button>
                    </div>

                    {/* Sign Out & Sign Out of All Devices */}
                    <div className="space-y-1.5 pb-3 border-b border-[#E4DFD3]">
                      <button
                        type="button"
                        onClick={() => handleSignOut(false)}
                        className="w-full px-2.5 py-1.5 rounded text-left hover:bg-[#F3EFE6] text-[#142321] flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-[#526360]" />
                        <span>Sign out</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSignOut(true)}
                        className="w-full px-2.5 py-1.5 rounded text-left hover:bg-[#F3EFE6] text-[#B45309] flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign out of all devices</span>
                      </button>
                    </div>

                    {/* Delete My Account and Data */}
                    <div>
                      {!confirmDeleteInMenu ? (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteInMenu(true)}
                          className="w-full px-2.5 py-1.5 rounded text-left hover:bg-[#FEE2E2]/60 text-[#991B1B] font-medium flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete my account and data</span>
                        </button>
                      ) : (
                        <div className="p-2.5 rounded bg-[#FEE2E2]/60 border border-[#991B1B]/40 space-y-2">
                          <p className="text-[11px] text-[#991B1B] font-medium">
                            Permanently delete your account, profile, and workspace membership?
                          </p>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteInMenu(false)}
                              className="px-2 py-1 text-[11px] bg-[#FAF8F4] border border-[#E4DFD3] rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleDeleteMyAccount}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-[#991B1B] text-[#FAF8F4] rounded cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Welcome Guided Tour Banner (dismissible) */}
          {showWelcomeTourBanner && (
            <div className="bg-[#17806D]/15 dark:bg-[#2DD4BF]/15 border-b border-[#17806D]/30 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#0B3D3A] dark:text-[#7FD1BF]">
                <Sparkles className="w-4 h-4 text-[#17806D] dark:text-[#2DD4BF] shrink-0" />
                <span>
                  <strong>New to Nirnay Sutra?</strong> Take the 1-minute tour to see how brand rules, AI checks, and human approvals work.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setHelpModalView('tour');
                    setHelpModalOpen(true);
                  }}
                  className="font-medium text-[#17806D] dark:text-[#2DD4BF] hover:underline cursor-pointer"
                >
                  Take 1-minute tour &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem('nirnay_tour_completed', 'true');
                    } catch {}
                    setShowWelcomeTourBanner(false);
                  }}
                  className="text-[#526360] dark:text-[#9BB0AC] hover:text-[#0B3D3A] dark:hover:text-[#F4F7F6] text-xs cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Active View Viewport (with Connection, Quota, Loading, Checklist & Route Guard checks) */}
          <main className="flex-1 p-6 lg:p-10 max-w-[1280px] w-full mx-auto space-y-8">
            {dbOfflineError ? (
              <DatabaseConnectionErrorState
                onRetryConnection={async () => {
                  try {
                    await testFirestoreConnection();
                    setDbOfflineError(false);
                    if (devPreview === 'db-unreachable') {
                      setDevPreview('normal');
                    }
                  } catch {
                    if (navigator.onLine) {
                      setDbOfflineError(false);
                      if (devPreview === 'db-unreachable') {
                        setDevPreview('normal');
                      }
                    }
                  }
                }}
                onExploreDemoWorkspace={() => handleApplyDevPreview('normal')}
              />
            ) : dailyQuotaReached ? (
              <DailyQuotaReachedState
                onExploreDemoWorkspace={() => handleApplyDevPreview('normal')}
              />
            ) : isLoadingView ? (
              <LoadingSkeletonState
                label="Loading workspace governance state"
                onTimeoutReached={() => {
                  setIsLoadingView(false);
                  if (devPreview === 'loading-skeleton') {
                    setDevPreview('normal');
                  }
                }}
              />
            ) : !hasRouteAccess ? (
              <AccessDeniedView
                activeRole={activeRole}
                attemptedViewLabel={
                  devPreview === 'role-not-permitted'
                    ? 'Team & Access Governance'
                    : currentRouteMeta.label
                }
                requiredRoles={
                  devPreview === 'role-not-permitted'
                    ? ['Brand Admin']
                    : currentRouteMeta.allowedRoles
                }
                onReturnToRoleHome={() => {
                  if (devPreview === 'role-not-permitted') {
                    setDevPreview('normal');
                  }
                  navigateToTab(getRoleHomeTab(activeRole) as ActiveTab);
                }}
                onSwitchRoleForDemo={(r) => {
                  if (devPreview === 'role-not-permitted') {
                    setDevPreview('normal');
                  }
                  handleSwitchRoleOrDemoPersona(r);
                }}
                isDemoSandbox={userProfile.isDemoSandbox}
              />
            ) : (
              <>
                {/* Requirement 2: WORKSPACE EXISTS BUT IT IS EMPTY — 4-Step Setup Checklist */}
                {workspaceSetupIncomplete && (
                  <WorkspaceSetupChecklist
                    workspaceName={fallbackWorkspace.name}
                    hasGuidelines={effectiveLibrary.guidelines.length > 0}
                    hasFacts={effectiveLibrary.facts.length > 0}
                    hasTerminologyAndAssets={
                      effectiveLibrary.terminology.length > 0 &&
                      effectiveLibrary.assets.length > 0
                    }
                    hasTeamInvited={
                      effectiveMembers.filter(
                        (m) => m.workspaceId === fallbackWorkspace.id
                      ).length > 1
                    }
                    activeRole={activeRole}
                    onGoToGuidelines={() => navigateToTab('brand-library')}
                    onGoToFacts={() => navigateToTab('brand-library')}
                    onGoToTerminologyAndAssets={() =>
                      navigateToTab('brand-library')
                    }
                    onGoToInviteTeam={() => navigateToTab('team-access')}
                    onRestoreSampleWorkspace={() =>
                      handleApplyDevPreview('normal')
                    }
                  />
                )}

                {activeTab === 'autopilot' && (
                  <AutopilotDashboardView
                    library={effectiveLibrary}
                    items={effectiveItems}
                    activeRole={activeRole}
                    onSwitchRole={(r) => handleSwitchRoleOrDemoPersona(r)}
                    onUpdateAutopilotConfig={handleUpdateAutopilotConfig}
                    onTriggerSimulatedSubmission={(preset) => {
                      if (devPreview === 'empty-lists') {
                        setDevPreview('normal');
                      }
                      handleTriggerSimulatedSubmission(preset);
                    }}
                    onRollbackAutopilotItem={handleRollbackAutopilotItem}
                    onOpenInStudio={(id) => {
                      setSelectedItemId(id);
                      navigateToTab('review-studio');
                    }}
                    onOpenInApprovals={(id) => {
                      setSelectedItemId(id);
                      navigateToTab('approvals');
                    }}
                  />
                )}

                {activeTab === 'dashboard' && (
                  <DashboardView
                    items={effectiveItems}
                    library={effectiveLibrary}
                    auditLogs={effectiveAuditLogs}
                    activeRole={activeRole}
                    onOpenInStudio={(id) => {
                      setSelectedItemId(id);
                      navigateToTab('review-studio');
                    }}
                    onOpenInApprovals={(id) => {
                      setSelectedItemId(id);
                      navigateToTab('approvals');
                    }}
                    onCreateNewDraft={() => setNewDraftModalOpen(true)}
                    onNavigate={(tab) => navigateToTab(tab as ActiveTab)}
                  />
                )}

                {activeTab === 'brand-library' && (
                  <BrandLibraryView
                    library={effectiveLibrary}
                    activeRole={activeRole}
                    onSwitchRole={(r) => handleSwitchRoleOrDemoPersona(r)}
                    onUpdateLibrary={(updated, summary, srcId) => {
                      if (devPreview === 'empty-workspace') {
                        setDevPreview('normal');
                      }
                      handleUpdateLibrary(updated, summary, srcId);
                    }}
                  />
                )}

                {activeTab === 'review-studio' && (
                  <ReviewStudioView
                    items={effectiveItems}
                    selectedItemId={selectedItemId}
                    onSelectItem={(id) => setSelectedItemId(id)}
                    library={effectiveLibrary}
                    activeRole={activeRole}
                    onUpdateItem={handleUpdateItem}
                    onCreateNewDraft={() => setNewDraftModalOpen(true)}
                    onRecordAudit={handleRecordAudit}
                    onIncrementGuidelineDispute={
                      handleIncrementGuidelineDispute
                    }
                    onOpenApprovals={(id) => {
                      setSelectedItemId(id);
                      navigateToTab('approvals');
                    }}
                    onNavigateToLibrary={() => navigateToTab('brand-library')}
                    onNotifyAdminMissingGuidelines={() => {
                      handleRecordAudit(
                        'HUMAN_DECISION',
                        'BRAND-LIBRARY',
                        'Missing Brand Guidelines Notification',
                        `${userProfile.displayName} (${activeRole}) sent a notification requesting the Brand Admin to add brand guidelines.`
                      );
                    }}
                    onRunAutopilotOnItem={executeZeroClickAutopilot}
                    onRollbackAutopilotItem={handleRollbackAutopilotItem}
                  />
                )}

                {activeTab === 'approvals' && (
                  <ApprovalsView
                    items={effectiveItems}
                    selectedItemId={selectedItemId}
                    onSelectItem={(id) => setSelectedItemId(id)}
                    activeRole={activeRole}
                    onSwitchRole={(r) => handleSwitchRoleOrDemoPersona(r)}
                    onUpdateItem={handleUpdateItem}
                    onRecordAudit={handleRecordAudit}
                    onOpenInStudio={(id) => {
                      if (id) setSelectedItemId(id);
                      navigateToTab('review-studio');
                    }}
                    onCreateNewDraft={() => setNewDraftModalOpen(true)}
                  />
                )}

                {activeTab === 'revision-history' && (
                  <RevisionHistoryView
                    items={effectiveItems}
                    selectedItemId={selectedItemId}
                    onSelectItem={(id) => setSelectedItemId(id)}
                    onOpenStudio={() => navigateToTab('review-studio')}
                  />
                )}

                {activeTab === 'insights' && (
                  <InsightsView
                    library={effectiveLibrary}
                    items={effectiveItems}
                    onNavigateToLibrary={() => navigateToTab('brand-library')}
                    onOpenStudio={() => navigateToTab('review-studio')}
                  />
                )}

                {activeTab === 'audit-disclosure' && (
                  <AuditDisclosureView
                    auditLogs={effectiveAuditLogs}
                    onResetDemoData={handleResetAll}
                    onOpenStudio={() => navigateToTab('review-studio')}
                  />
                )}

                {activeTab === 'team-access' && (
                  <TeamAccessView
                    activeWorkspace={fallbackWorkspace}
                    members={effectiveMembers}
                    invites={invites}
                    signInActivity={signInActivity}
                    currentUserUid={userProfile.uid}
                    onApproveRoleRequest={handleApproveRoleRequest}
                    onRejectRoleRequest={handleRejectRoleRequest}
                    onChangeMemberRole={handleChangeMemberRole}
                    onToggleMemberStatus={handleToggleMemberStatus}
                    onGenerateInvite={handleGenerateInvite}
                    onRevokeInvite={handleRevokeInvite}
                  />
                )}

                {activeTab === 'privacy' && (
                  <PrivacyGovernanceView
                    userProfile={userProfile}
                    onSignOutAllDevices={() => handleSignOut(true)}
                    onDeleteAccountAndData={handleDeleteMyAccount}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Paste / Create New Content Draft Modal */}
      {newDraftModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-draft-title"
          className="fixed inset-0 z-50 bg-[#142321]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleCreateNewDraft}
            className="bg-[#FAF8F4] border border-[#0B3D3A] rounded max-w-xl w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DFD3]">
              <div>
                <span className="text-[11px] font-mono-tabular text-[#17806D] block">
                  {isAutopilotRunning
                    ? 'Autopilot Active: Will Check, Risk-Score & Remediate Automatically'
                    : 'Manual / Assisted Draft Ingestion'}
                </span>
                <h3
                  id="new-draft-title"
                  className="font-serif-display text-lg font-semibold text-[#0B3D3A]"
                >
                  Paste or Submit New Content Draft
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNewDraftModalOpen(false)}
                className="text-xs text-[#526360] cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#142321] mb-1">
                Campaign or Asset Title *
              </label>
              <input
                type="text"
                required
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="e.g. Coorg Cardamom Body Oil Social Note"
                className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#142321] mb-1">
                  Publishing Channel
                </label>
                <input
                  type="text"
                  value={draftChannel}
                  onChange={(e) => setDraftChannel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#142321] mb-1">
                  Originating Team / Agency
                </label>
                <select
                  value={draftTeam}
                  onChange={(e) => setDraftTeam(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
                >
                  <option value="External Social Agency">
                    External Social Agency
                  </option>
                  <option value="Performance Marketing">
                    Performance Marketing
                  </option>
                  <option value="D2C Packaging Desk">D2C Packaging Desk</option>
                  <option value="Marketplace Copy Desk">
                    Marketplace Copy Desk
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#142321] mb-1">
                Draft Copy *
              </label>
              <textarea
                rows={4}
                required
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded leading-relaxed"
              />
              <p className="text-[11px] text-[#526360] mt-1">
                In Autopilot mode, Low-Risk (
                <code className="font-mono-tabular">
                  &lt;{library.autopilotConfig.lowRiskThreshold}
                </code>
                ) issues like “slaps” or “lowkey” are fixed and auto-approved
                immediately; High-Risk (
                <code className="font-mono-tabular">
                  &gt;{library.autopilotConfig.highRiskThreshold}
                </code>
                ) issues like “100% pesticide-free”, “₹480”, or “28.5%” escalate
                to the Human Exception Queue.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E4DFD3]">
              <button
                type="button"
                onClick={() => setNewDraftModalOpen(false)}
                className="px-4 py-2 text-xs text-[#526360] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded cursor-pointer"
              >
                {isAutopilotRunning
                  ? 'Check with Autopilot'
                  : 'Create draft & check content'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Global Plain-Language Help, 4-Step Tour, & Glossary Modal */}
      <HelpAndTourModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        activeTab={activeTab}
        activeRole={activeRole}
        initialView={helpModalView}
        onNavigateToTab={navigateToTab}
      />
    </div>
  );
}

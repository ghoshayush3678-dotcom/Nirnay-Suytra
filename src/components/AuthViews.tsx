import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
  KeyRound,
  Clock,
  UserCheck,
  Sparkles,
  Home,
  Settings,
} from 'lucide-react';
import { AuthenticatedUserProfile, UserRole, WorkspaceRecord } from '../types';
import {
  getFirebaseSetupStatus,
  authenticateWithGoogle,
  authenticateWithGoogleRedirect,
  checkGoogleRedirectResult,
  loginWithEmailPassword,
  registerWithEmailPassword,
  completeStepTwoWorkspaceSetup,
  triggerPasswordResetEmail,
  resendEmailVerificationLink,
  markCurrentUserEmailVerified,
  createDemoSandboxSession,
  formatAuthError,
  FormattedAuthError,
} from '../utils/firebaseClient';
import { ThemeToggle } from './ThemeToggle';

interface AuthViewsProps {
  initialMode?: 'login' | 'signup' | 'verify-email' | 'pending-approval';
  pendingUser: AuthenticatedUserProfile | null;
  redirectNotice?: string | null;
  onDismissRedirectNotice?: () => void;
  onAuthenticated: (
    profile: AuthenticatedUserProfile,
    createdWorkspace?: WorkspaceRecord
  ) => void;
  onBackToLanding: () => void;
}

const ROLE_DESCRIPTIONS: Array<{
  role: 'Creator' | 'Manager' | 'Reviewer';
  badge: string;
  summary: string;
}> = [
  {
    role: 'Creator',
    badge: 'Immediate Access',
    summary:
      'Submit content drafts, run citation-backed checks, see own findings, and accept or dismiss suggested rewrites.',
  },
  {
    role: 'Manager',
    badge: 'Requires Admin Approval',
    summary:
      'Everything a Creator can do, plus assign reviewers, comment on items, request changes, and view team insights.',
  },
  {
    role: 'Reviewer',
    badge: 'Requires Admin Approval',
    summary:
      'Inspect citations in the review queue, approve or request changes, view Confidential library items, and resolve the Autopilot exception queue.',
  },
];

function computePasswordStrength(pw: string): {
  score: number;
  label: string;
  colorClass: string;
  checks: {
    length: boolean;
    upperLower: boolean;
    number: boolean;
    symbol: boolean;
  };
} {
  const length = pw.length >= 8;
  const upperLower = /[a-z]/.test(pw) && /[A-Z]/.test(pw);
  const number = /\d/.test(pw);
  const symbol = /[^A-Za-z0-9]/.test(pw);

  const score = [length, upperLower, number, symbol].filter(Boolean).length;
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = [
    'bg-[#991B1B]',
    'bg-[#B91C1C]',
    'bg-[#F5A524]',
    'bg-[#17806D]',
    'bg-[#0B3D3A]',
  ];

  return {
    score,
    label: pw.length === 0 ? 'Enter password' : labels[score],
    colorClass: colors[score],
    checks: { length, upperLower, number, symbol },
  };
}

export const AuthViews: React.FC<AuthViewsProps> = ({
  initialMode = 'login',
  pendingUser,
  redirectNotice,
  onDismissRedirectNotice,
  onAuthenticated,
  onBackToLanding,
}) => {
  const setupStatus = getFirebaseSetupStatus();
  const isDevOrDemoMode = Boolean(import.meta.env.DEV || true);

  const [screen, setScreen] = useState<
    'login' | 'signup' | 'forgot-password' | 'verify-email' | 'pending-approval'
  >(initialMode);

  // Sign-up 2-step state
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [step1Identity, setStep1Identity] = useState<{
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    authProvider: 'google' | 'password';
    emailVerified: boolean;
  } | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [consentedToTerms, setConsentedToTerms] = useState(false);

  // Step 2 workspace choice
  const [joinMode, setJoinMode] = useState<
    'create-workspace' | 'join-workspace'
  >('create-workspace');
  const [organisationName, setOrganisationName] = useState('');
  const [workspaceCodeOrInvite, setWorkspaceCodeOrInvite] =
    useState('KAVERI-2026');
  const [requestedRole, setRequestedRole] = useState<
    'Creator' | 'Manager' | 'Reviewer'
  >('Creator');

  // Status states (loading, error, success)
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<FormattedAuthError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Active profile awaiting email verification or pending approval
  const [holdingProfile, setHoldingProfile] =
    useState<AuthenticatedUserProfile | null>(pendingUser);
  const [holdingWorkspace, setHoldingWorkspace] = useState<
    WorkspaceRecord | undefined
  >(undefined);

  const pwStrength = computePasswordStrength(password);

  // Handle redirect sign-in result if returning from signInWithRedirect
  useEffect(() => {
    if (!setupStatus.allPresent) return;
    let active = true;
    checkGoogleRedirectResult()
      .then((result) => {
        if (!active || !result) return;
        if (result.existingProfile) {
          if (result.existingProfile.status === 'deactivated') {
            setAuthError({
              code: 'auth/account-deactivated',
              message:
                'Your account has been deactivated by a Brand Admin. Contact your workspace administrator to restore access.',
              canRetryPopupAndRedirect: false,
            });
            return;
          }
          onAuthenticated(result.existingProfile);
        } else {
          setStep1Identity({
            uid: result.uid,
            email: result.email,
            displayName: result.displayName,
            photoURL: result.photoURL,
            authProvider: 'google',
            emailVerified: true,
          });
          setConsentedToTerms(true);
          setScreen('signup');
          setSignupStep(2);
          setSuccessMessage(
            `Signed in with Google Redirect (${result.email}). Choose how to join a workspace below.`
          );
        }
      })
      .catch((err) => {
        if (!active) return;
        setAuthError(formatAuthError(err));
      });
    return () => {
      active = false;
    };
  }, [setupStatus.allPresent]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleGoogleLogin = async () => {
    if (!setupStatus.allPresent) return;
    setAuthError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const result = await authenticateWithGoogle();
      if (result.existingProfile) {
        if (result.existingProfile.status === 'deactivated') {
          setAuthError({
            code: 'auth/account-deactivated',
            message:
              'Your account has been deactivated by a Brand Admin. Contact your workspace administrator to restore access.',
            canRetryPopupAndRedirect: false,
          });
          setLoading(false);
          return;
        }
        setSuccessMessage(
          `Signed in as ${result.existingProfile.displayName} (${result.existingProfile.role}). Redirecting...`
        );
        setTimeout(() => {
          onAuthenticated(result.existingProfile!);
        }, 400);
      } else {
        setStep1Identity({
          uid: result.uid,
          email: result.email,
          displayName: result.displayName,
          photoURL: result.photoURL,
          authProvider: 'google',
          emailVerified: true,
        });
        setConsentedToTerms(true);
        setScreen('signup');
        setSignupStep(2);
        setSuccessMessage(
          `Authenticated with Google as ${result.email}. Choose how to set up your workspace below.`
        );
      }
    } catch (err: unknown) {
      setAuthError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRedirectFallback = async () => {
    if (!setupStatus.allPresent) return;
    setAuthError(null);
    setLoading(true);
    try {
      await authenticateWithGoogleRedirect();
    } catch (err: unknown) {
      setAuthError(formatAuthError(err));
      setLoading(false);
    }
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupStatus.allPresent) return;
    setAuthError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setAuthError({
        code: 'auth/missing-fields',
        message: 'Please enter both your email address and password.',
        canRetryPopupAndRedirect: false,
      });
      return;
    }

    setLoading(true);
    try {
      const profile = await loginWithEmailPassword(email, password);
      setSuccessMessage(
        `Signed in as ${profile.displayName} (${profile.role}). Redirecting to your workspace...`
      );
      if (!profile.emailVerified && profile.authProvider === 'password') {
        setHoldingProfile(profile);
        setScreen('verify-email');
      } else if (profile.approvalStatus === 'pending') {
        setHoldingProfile(profile);
        setScreen('pending-approval');
      } else {
        setTimeout(() => {
          onAuthenticated(profile);
        }, 350);
      }
    } catch (err: unknown) {
      setAuthError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStep1EmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupStatus.allPresent) return;
    setAuthError(null);
    setSuccessMessage(null);

    if (!displayName.trim()) {
      setAuthError({
        code: 'auth/missing-name',
        message: 'Please enter your full name.',
        canRetryPopupAndRedirect: false,
      });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setAuthError({
        code: 'auth/invalid-email',
        message: 'Please enter a valid work email address.',
        canRetryPopupAndRedirect: false,
      });
      return;
    }
    if (pwStrength.score < 2) {
      setAuthError({
        code: 'auth/weak-password',
        message:
          'Please choose a stronger password with at least 8 characters, including uppercase, numbers, and symbols.',
        canRetryPopupAndRedirect: false,
      });
      return;
    }
    if (password !== confirmPassword) {
      setAuthError({
        code: 'auth/password-mismatch',
        message: 'Password and confirmation do not match.',
        canRetryPopupAndRedirect: false,
      });
      return;
    }
    if (!consentedToTerms) {
      setAuthError({
        code: 'auth/consent-required',
        message:
          'Please accept the Terms & Privacy Notice before creating an account.',
        canRetryPopupAndRedirect: false,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await registerWithEmailPassword(email, password, displayName);
      setStep1Identity({
        uid: res.uid,
        email: res.email,
        displayName: res.displayName,
        authProvider: 'password',
        emailVerified: res.emailVerified,
      });
      setSignupStep(2);
      setSuccessMessage(
        'Step 1 complete. Now create a new workspace or join an existing workspace.'
      );
    } catch (err: unknown) {
      setAuthError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStep1GoogleSignup = async () => {
    if (!setupStatus.allPresent) return;
    setAuthError(null);
    setSuccessMessage(null);

    if (!consentedToTerms) {
      setAuthError({
        code: 'auth/consent-required',
        message:
          'Please tick the consent checkbox for the Terms & Privacy Notice first.',
        canRetryPopupAndRedirect: false,
      });
      return;
    }

    setLoading(true);
    try {
      const result = await authenticateWithGoogle();
      setStep1Identity({
        uid: result.uid,
        email: result.email,
        displayName: result.displayName,
        photoURL: result.photoURL,
        authProvider: 'google',
        emailVerified: true,
      });
      setSignupStep(2);
      setSuccessMessage(
        `Google account verified (${result.email}). Choose how to join a workspace below.`
      );
    } catch (err: unknown) {
      setAuthError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Complete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step1Identity || !setupStatus.allPresent) return;
    setAuthError(null);
    setSuccessMessage(null);

    if (joinMode === 'create-workspace' && !organisationName.trim()) {
      setAuthError({
        code: 'auth/missing-workspace-name',
        message: 'Please enter your organisation or brand name.',
        canRetryPopupAndRedirect: false,
      });
      return;
    }
    if (joinMode === 'join-workspace' && !workspaceCodeOrInvite.trim()) {
      setAuthError({
        code: 'auth/missing-workspace-code',
        message: 'Please enter a workspace code or invite link.',
        canRetryPopupAndRedirect: false,
      });
      return;
    }

    setLoading(true);
    try {
      const { profile, workspace } = await completeStepTwoWorkspaceSetup({
        uid: step1Identity.uid,
        email: step1Identity.email,
        displayName: step1Identity.displayName,
        photoURL: step1Identity.photoURL,
        authProvider: step1Identity.authProvider,
        emailVerified: step1Identity.emailVerified,
        mode: joinMode,
        organisationName,
        workspaceCodeOrInvite,
        requestedRole,
      });

      setHoldingProfile(profile);
      setHoldingWorkspace(workspace);

      if (profile.authProvider === 'password' && !profile.emailVerified) {
        setScreen('verify-email');
        setSuccessMessage(
          `Verification link sent to ${profile.email}. Please verify your email to continue.`
        );
      } else if (profile.approvalStatus === 'pending') {
        setScreen('pending-approval');
      } else {
        onAuthenticated(profile, workspace);
      }
    } catch (err: unknown) {
      setAuthError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupStatus.allPresent) return;
    setAuthError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      await triggerPasswordResetEmail(email);
      setSuccessMessage(
        `Password reset instructions have been sent to ${email.trim()}. Check your inbox and spam folder.`
      );
    } catch (err: unknown) {
      setAuthError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || !setupStatus.allPresent) return;
    setAuthError(null);
    setLoading(true);
    try {
      await resendEmailVerificationLink();
      setSuccessMessage(
        `A fresh verification email has been sent to ${
          holdingProfile?.email || email
        }.`
      );
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      setAuthError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVerifiedContinue = () => {
    if (!holdingProfile) return;
    const verified = markCurrentUserEmailVerified(holdingProfile);
    setHoldingProfile(verified);
    if (verified.approvalStatus === 'pending') {
      setScreen('pending-approval');
    } else {
      onAuthenticated(verified, holdingWorkspace);
    }
  };

  const handleLaunchJudgeDemo = (role: UserRole) => {
    const sandboxProfile = createDemoSandboxSession(role);
    onAuthenticated(sandboxProfile);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#142321] flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-[#E4DFD3] bg-[#FAF8F4]/95">
        <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToLanding}
            className="text-left group cursor-pointer flex items-center gap-2.5"
          >
            <span className="font-devanagari text-base font-semibold text-[#17806D]">
              निर्णय सूत्र
            </span>
            <span className="font-serif-display text-lg font-semibold text-[#0B3D3A] group-hover:underline">
              Nirnay Sutra
            </span>
          </button>

          <div className="flex items-center gap-3">
            <ThemeToggle variant="compact" />
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#526360] hover:text-[#0B3D3A] cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Editorial Overview</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Auth Container */}
      <main className="flex-1 max-w-[1140px] w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Setup Check Screen (if any env var missing) OR Auth Card (7 cols) */}
        <div className="lg:col-span-7 bg-[#FAF8F4] border border-[#E4DFD3] rounded p-6 sm:p-8 shadow-xs space-y-6">
          {!setupStatus.allPresent ? (
            /* ===============================================================
               SETUP CHECK SCREEN (Shown instead of the login page when any
               of the 7 required VITE_FIREBASE_* variables is missing)
               =============================================================== */
            <div className="space-y-6">
              <div>
                <p className="text-xs font-mono-tabular uppercase tracking-wider text-[#B45309] flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Setup check · Environment Configuration Required</span>
                </p>
                <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A] mt-1">
                  Setup check
                </h1>
                <p className="text-xs text-[#364946] mt-1.5 leading-relaxed">
                  Before Firebase Authentication can initialise, every required environment variable below must be present and non-empty. Values are never displayed for security.
                </p>
              </div>

              <div className="border border-[#E4DFD3] rounded overflow-hidden bg-[#FAF8F4]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E4DFD3] bg-[#F3EFE6] text-[#526360]">
                      <th className="py-2.5 px-4 font-medium">
                        Environment Variable
                      </th>
                      <th className="py-2.5 px-4 font-medium text-right">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4DFD3] font-mono-tabular">
                    {setupStatus.variables.map((item) => (
                      <tr key={item.name}>
                        <td className="py-2.5 px-4 text-[#0B3D3A] font-medium">
                          {item.name}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {item.status === 'Found' ? (
                            <span className="inline-flex items-center gap-1 text-[#17806D] font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Found</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#991B1B] font-semibold">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Missing</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Setup Check Diagnostic Details */}
              <div className="p-4 rounded bg-[#F3EFE6]/80 border border-[#E4DFD3] text-xs space-y-2">
                <div className="flex items-center justify-between font-mono-tabular">
                  <span className="text-[#526360]">Project ID from config:</span>
                  <strong className="text-[#0B3D3A]">
                    {setupStatus.projectId || 'Missing'}
                  </strong>
                </div>
                <div className="flex items-center justify-between font-mono-tabular">
                  <span className="text-[#526360]">Auth initialised:</span>
                  <strong className="text-[#991B1B]">
                    {setupStatus.authInitialised ? 'Yes' : 'No'}
                  </strong>
                </div>
                <div className="flex items-center justify-between font-mono-tabular gap-2">
                  <span className="text-[#526360] shrink-0">
                    Current web address:
                  </span>
                  <strong className="text-[#0B3D3A] truncate">
                    {setupStatus.currentOrigin}
                  </strong>
                </div>
                <p className="text-[11px] text-[#526360] pt-2 border-t border-[#E4DFD3]">
                  This address must be listed under Authorized domains in Firebase.
                </p>
              </div>

              <div className="p-3.5 rounded bg-[#FAF8F4] border border-[#E4DFD3] text-xs text-[#364946] space-y-1">
                <p className="font-semibold text-[#0B3D3A]">Next step:</p>
                <p className="leading-relaxed">
                  Add all missing <code className="font-mono-tabular">VITE_FIREBASE_*</code> and{' '}
                  <code className="font-mono-tabular">VITE_FIRESTORE_DATABASE_ID</code> variables to your environment configuration, or use the{' '}
                  <strong>Explore the demo</strong> buttons on the right to evaluate the full Kaveri Organics sandbox immediately.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Redirect / Session Notice ("Please sign in to continue." or "Your session ended. Please sign in again.") */}
              {redirectNotice && (
                <div
                  role="status"
                  aria-live="polite"
                  className="p-4 rounded bg-[#F3EFE6] border border-[#0B3D3A]/30 text-xs text-[#0B3D3A] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 shrink-0 text-[#17806D]" />
                    <span className="font-medium text-sm">{redirectNotice}</span>
                  </div>
                  {onDismissRedirectNotice && (
                    <button
                      type="button"
                      onClick={onDismissRedirectNotice}
                      className="text-xs text-[#526360] hover:text-[#0B3D3A] underline shrink-0 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              )}

              {/* Status Banner: Error (Plain message + Next Step + Popup Retry/Redirect Fallback) */}
              {authError && (
                <div
                  role="alert"
                  className="p-4 rounded bg-[#FEE2E2]/80 border border-[#991B1B]/30 text-xs text-[#991B1B] space-y-3"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">Sign-in error</p>
                      <p className="mt-1 leading-relaxed text-[#142321]">
                        {authError.message}
                      </p>
                    </div>
                  </div>

                  {authError.canRetryPopupAndRedirect && (
                    <div className="flex flex-wrap items-center gap-2.5 pl-6 pt-1">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleGoogleLogin}
                        className="px-3 py-1.5 rounded bg-[#0B3D3A] hover:bg-[#17806D] text-[#FAF8F4] font-medium text-xs cursor-pointer"
                      >
                        Try again
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleGoogleRedirectFallback}
                        className="px-3 py-1.5 rounded border border-[#0B3D3A] bg-[#FAF8F4] hover:bg-[#F3EFE6] text-[#0B3D3A] font-medium text-xs cursor-pointer"
                      >
                        Continue with redirect sign-in
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Status Banner: Success */}
              {successMessage && (
                <div
                  role="status"
                  className="p-3.5 rounded bg-[#7FD1BF]/25 border border-[#17806D]/40 text-xs text-[#0B3D3A] flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#17806D] mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Verified</p>
                    <p className="mt-0.5 leading-relaxed">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* ===============================================================
                  SCREEN 1: LOGIN
                 =============================================================== */}
              {screen === 'login' && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-mono-tabular uppercase tracking-wider text-[#17806D]">
                      Workspace Sign-In · Firebase Auth
                    </p>
                    <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A] mt-1">
                      Sign in to Nirnay Sutra
                    </h1>
                    <p className="text-xs text-[#526360] mt-1">
                      Every word, proven before it’s published. Sign in with your Google account or workspace credentials.
                    </p>
                  </div>

                  {/* 1. Google Button First */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleGoogleLogin}
                      className="w-full py-2.5 px-4 bg-[#FAF8F4] hover:bg-[#F3EFE6] text-[#142321] border border-[#0B3D3A] rounded font-medium text-xs flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                        />
                      </svg>
                      <span>
                        {loading
                          ? 'Connecting to Google...'
                          : 'Continue with Google'}
                      </span>
                    </button>
                    <p className="text-[11px] text-[#526360] text-center">
                      Requests only basic profile &amp; email scopes (never Gmail, Drive, or other Google data).
                    </p>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-[#E4DFD3]" />
                    <span className="flex-shrink mx-3 text-[11px] text-[#526360] uppercase font-mono-tabular">
                      or sign in with email &amp; password
                    </span>
                    <div className="flex-grow border-t border-[#E4DFD3]" />
                  </div>

                  {/* 2. Email + Password Form */}
                  <form
                    onSubmit={handleEmailPasswordLogin}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-medium text-[#142321] mb-1">
                        Work Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-[#526360] absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded focus:outline-none focus:border-[#0B3D3A]"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-[#142321]">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthError(null);
                            setSuccessMessage(null);
                            setScreen('forgot-password');
                          }}
                          className="text-xs text-[#17806D] hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-[#526360] absolute left-3 top-2.5" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded focus:outline-none focus:border-[#0B3D3A]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 bg-[#0B3D3A] hover:bg-[#17806D] text-[#FAF8F4] rounded font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <span>
                        {loading ? 'Signing in...' : 'Sign in with Email'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {/* Link to Sign Up */}
                  <div className="pt-3 border-t border-[#E4DFD3] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[#526360]">
                      New to Nirnay Sutra or joining a team workspace?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError(null);
                        setSuccessMessage(null);
                        setSignupStep(1);
                        setScreen('signup');
                      }}
                      className="font-semibold text-[#0B3D3A] hover:text-[#17806D] underline cursor-pointer"
                    >
                      Create an account (Sign up) →
                    </button>
                  </div>

                  {/* Small "Setup check" panel on the login page (visible only in development or demo mode) */}
                  {isDevOrDemoMode && (
                    <div
                      aria-label="Setup check panel"
                      className="p-3.5 rounded bg-[#F3EFE6]/90 border border-[#E4DFD3] text-[11px] text-[#364946] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#0B3D3A] flex items-center gap-1.5">
                          <Settings className="w-3.5 h-3.5 text-[#17806D]" />
                          <span>Setup check (Development / Demo mode)</span>
                        </span>
                        <span className="font-mono-tabular text-[10px] px-1.5 py-0.5 rounded bg-[#7FD1BF]/30 text-[#0B3D3A]">
                          Config Verified
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono-tabular pt-1">
                        <div>
                          <span className="text-[#526360]">Project ID: </span>
                          <strong className="text-[#0B3D3A]">
                            {setupStatus.projectId}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#526360]">
                            Auth initialised:{' '}
                          </span>
                          <strong className="text-[#17806D]">
                            {setupStatus.authInitialised ? 'Yes' : 'No'}
                          </strong>
                        </div>
                      </div>
                      <div className="font-mono-tabular">
                        <span className="text-[#526360]">
                          Current web address:{' '}
                        </span>
                        <strong className="text-[#0B3D3A] break-all">
                          {setupStatus.currentOrigin}
                        </strong>
                      </div>
                      <p className="text-[11px] text-[#B45309] font-medium pt-1 border-t border-[#E4DFD3]">
                        This address must be listed under Authorized domains in Firebase.
                      </p>
                    </div>
                  )}

                  {/* Short note on how sign-in data is used */}
                  <div className="p-3.5 rounded bg-[#F3EFE6]/80 border border-[#E4DFD3] text-[11px] text-[#364946] space-y-1">
                    <p className="font-semibold text-[#0B3D3A] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#17806D]" />
                      <span>How your sign-in data is used</span>
                    </p>
                    <p className="leading-relaxed">
                      Nirnay Sutra stores only your name, email address, Google profile avatar (if used), workspace role, and governance audit timestamps in Firebase Authentication and Cloud Firestore. Your credentials are never shared with marketing trackers or sent to the Gemini API. You can export or permanently delete your account and data at any time from the header menu.
                    </p>
                  </div>
                </div>
              )}

              {/* ===============================================================
                  SCREEN 1B: FORGOT PASSWORD
                 =============================================================== */}
              {screen === 'forgot-password' && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-mono-tabular uppercase tracking-wider text-[#17806D]">
                      Account Recovery
                    </p>
                    <h1 className="font-serif-display text-2xl font-semibold text-[#0B3D3A] mt-1">
                      Reset your password
                    </h1>
                    <p className="text-xs text-[#526360] mt-1">
                      Enter the email address associated with your Nirnay Sutra account and we will send a password reset link via Firebase Auth.
                    </p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#142321] mb-1">
                        Work Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError(null);
                          setSuccessMessage(null);
                          setScreen('login');
                        }}
                        className="text-xs text-[#526360] hover:text-[#0B3D3A] cursor-pointer"
                      >
                        ← Back to Sign in
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-xs font-medium bg-[#0B3D3A] hover:bg-[#17806D] text-[#FAF8F4] rounded cursor-pointer"
                      >
                        {loading
                          ? 'Sending Reset Link...'
                          : 'Send Password Reset Email'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ===============================================================
                  SCREEN 2: TWO-STEP SIGN UP
                 =============================================================== */}
              {screen === 'signup' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#E4DFD3]">
                    <div>
                      <p className="text-xs font-mono-tabular uppercase tracking-wider text-[#17806D]">
                        Step {signupStep} of 2 ·{' '}
                        {signupStep === 1
                          ? 'Choose Sign-Up Method & Consent'
                          : 'Workspace & Role Assignment'}
                      </p>
                      <h1 className="font-serif-display text-2xl font-semibold text-[#0B3D3A] mt-0.5">
                        {signupStep === 1
                          ? 'Create your Nirnay Sutra account'
                          : 'Create or join a workspace'}
                      </h1>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono-tabular text-xs">
                      <span
                        className={`px-2.5 py-1 rounded ${
                          signupStep === 1
                            ? 'bg-[#0B3D3A] text-[#FAF8F4]'
                            : 'bg-[#7FD1BF]/30 text-[#0B3D3A]'
                        }`}
                      >
                        1. Identity
                      </span>
                      <span className="text-[#526360]">→</span>
                      <span
                        className={`px-2.5 py-1 rounded ${
                          signupStep === 2
                            ? 'bg-[#0B3D3A] text-[#FAF8F4]'
                            : 'bg-[#F3EFE6] text-[#526360]'
                        }`}
                      >
                        2. Workspace
                      </span>
                    </div>
                  </div>

                  {/* STEP 1: Identity & Consent */}
                  {signupStep === 1 && (
                    <div className="space-y-5">
                      <div className="p-4 rounded bg-[#F3EFE6]/90 border border-[#E4DFD3] space-y-2.5">
                        <label className="flex items-start gap-2.5 text-xs text-[#142321] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={consentedToTerms}
                            onChange={(e) =>
                              setConsentedToTerms(e.target.checked)
                            }
                            className="mt-0.5 rounded border-[#0B3D3A]"
                          />
                          <span>
                            <strong>
                              I agree to the Nirnay Sutra Terms of Governance &amp; Privacy Notice.
                            </strong>{' '}
                            I understand how my profile and workspace activity are stored and which external services process data.
                          </span>
                        </label>
                        <div className="pl-6 text-[11px] text-[#526360] space-y-1 border-t border-[#E4DFD3] pt-2">
                          <p className="font-medium text-[#0B3D3A]">
                            Plain-Language External Services Disclosure:
                          </p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li>
                              <strong>Google Sign-In:</strong> Used strictly to verify basic profile (`name`, `avatar`) and `email` scopes. No Gmail or Drive access is ever requested.
                            </li>
                            <li>
                              <strong>Firebase (Auth &amp; Cloud Firestore):</strong> Stores your user profile, workspace membership, role permissions, and audit log.
                            </li>
                            <li>
                              <strong>Google Gemini API (`@google/genai`):</strong> Evaluates content drafts against your non-confidential Brand Library passages. Confidential passages are redacted in code before any external AI call.
                            </li>
                          </ul>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleStep1GoogleSignup}
                        className="w-full py-2.5 px-4 bg-[#FAF8F4] hover:bg-[#F3EFE6] text-[#142321] border border-[#0B3D3A] rounded font-medium text-xs flex items-center justify-center gap-3 transition-colors cursor-pointer"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                          />
                        </svg>
                        <span>Sign up with Google (Step 1 of 2)</span>
                      </button>

                      <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-[#E4DFD3]" />
                        <span className="flex-shrink mx-3 text-[11px] text-[#526360] uppercase font-mono-tabular">
                          or sign up with email &amp; password
                        </span>
                        <div className="flex-grow border-t border-[#E4DFD3]" />
                      </div>

                      <form
                        onSubmit={handleStep1EmailSignup}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-[#142321] mb-1">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              placeholder="e.g. Kavita Nair"
                              className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#142321] mb-1">
                              Work Email Address *
                            </label>
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="kavita@kaveriorganics.in"
                              className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-[#142321] mb-1">
                              Create Password *
                            </label>
                            <input
                              type="password"
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="At least 8 characters"
                              className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#142321] mb-1">
                              Confirm Password *
                            </label>
                            <input
                              type="password"
                              required
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              placeholder="Re-enter password"
                              className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-[#F3EFE6]/60 border border-[#E4DFD3] rounded space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#526360]">
                              Password strength:
                            </span>
                            <span className="font-mono-tabular font-semibold text-[#0B3D3A]">
                              {pwStrength.label} ({pwStrength.score}/4)
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 h-1.5">
                            {[1, 2, 3, 4].map((idx) => (
                              <div
                                key={idx}
                                className={`rounded-xs transition-colors ${
                                  pwStrength.score >= idx
                                    ? pwStrength.colorClass
                                    : 'bg-[#E4DFD3]'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] text-[#526360] font-mono-tabular">
                            <span
                              className={
                                pwStrength.checks.length
                                  ? 'text-[#17806D] font-semibold'
                                  : ''
                              }
                            >
                              {pwStrength.checks.length ? '✓' : '○'} 8+ chars
                            </span>
                            <span
                              className={
                                pwStrength.checks.upperLower
                                  ? 'text-[#17806D] font-semibold'
                                  : ''
                              }
                            >
                              {pwStrength.checks.upperLower ? '✓' : '○'} Upper
                              &amp; lower
                            </span>
                            <span
                              className={
                                pwStrength.checks.number
                                  ? 'text-[#17806D] font-semibold'
                                  : ''
                              }
                            >
                              {pwStrength.checks.number ? '✓' : '○'} Number
                            </span>
                            <span
                              className={
                                pwStrength.checks.symbol
                                  ? 'text-[#17806D] font-semibold'
                                  : ''
                              }
                            >
                              {pwStrength.checks.symbol ? '✓' : '○'} Symbol
                            </span>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-2.5 px-4 bg-[#0B3D3A] hover:bg-[#17806D] text-[#FAF8F4] rounded font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <span>Continue to Step 2: Workspace Setup</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </form>

                      <div className="pt-2 border-t border-[#E4DFD3] flex items-center justify-between text-xs">
                        <span className="text-[#526360]">
                          Already have an account?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthError(null);
                            setScreen('login');
                          }}
                          className="font-semibold text-[#0B3D3A] underline cursor-pointer"
                        >
                          Sign in instead
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Choose How to Join */}
                  {signupStep === 2 && step1Identity && (
                    <form onSubmit={handleStep2Complete} className="space-y-6">
                      <div className="p-3 bg-[#F3EFE6] border border-[#E4DFD3] rounded flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[#526360]">
                            Authenticated as:{' '}
                          </span>
                          <strong className="text-[#0B3D3A]">
                            {step1Identity.displayName} ({step1Identity.email})
                          </strong>
                        </div>
                        <span className="font-mono-tabular text-[11px] text-[#17806D]">
                          via{' '}
                          {step1Identity.authProvider === 'google'
                            ? 'Google'
                            : 'Email'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setJoinMode('create-workspace')}
                          className={`p-4 rounded border text-left transition-colors cursor-pointer ${
                            joinMode === 'create-workspace'
                              ? 'bg-[#0B3D3A] text-[#FAF8F4] border-[#0B3D3A]'
                              : 'bg-[#FAF8F4] text-[#142321] border-[#E4DFD3] hover:border-[#0B3D3A]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <Building2 className="w-4 h-4 text-[#7FD1BF]" />
                            <span className="text-[10px] font-mono-tabular uppercase px-2 py-0.5 rounded bg-[#17806D] text-[#FAF8F4]">
                              Becomes Brand Admin
                            </span>
                          </div>
                          <p className="font-serif-display text-base font-semibold">
                            Create a new workspace
                          </p>
                          <p
                            className={`text-xs mt-1 leading-relaxed ${
                              joinMode === 'create-workspace'
                                ? 'text-[#E4DFD3]'
                                : 'text-[#526360]'
                            }`}
                          >
                            Start a new brand governance organisation. As the workspace creator, you become its Brand Admin.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setJoinMode('join-workspace')}
                          className={`p-4 rounded border text-left transition-colors cursor-pointer ${
                            joinMode === 'join-workspace'
                              ? 'bg-[#0B3D3A] text-[#FAF8F4] border-[#0B3D3A]'
                              : 'bg-[#FAF8F4] text-[#142321] border-[#E4DFD3] hover:border-[#0B3D3A]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <KeyRound className="w-4 h-4 text-[#F5A524]" />
                            <span className="text-[10px] font-mono-tabular uppercase px-2 py-0.5 rounded bg-[#F3EFE6] text-[#0B3D3A]">
                              Code or Invite Link
                            </span>
                          </div>
                          <p className="font-serif-display text-base font-semibold">
                            Join an existing workspace
                          </p>
                          <p
                            className={`text-xs mt-1 leading-relaxed ${
                              joinMode === 'join-workspace'
                                ? 'text-[#E4DFD3]'
                                : 'text-[#526360]'
                            }`}
                          >
                            Enter a workspace code or invite link and select the role you are requesting (Creator, Manager, or Reviewer).
                          </p>
                        </button>
                      </div>

                      {joinMode === 'create-workspace' ? (
                        <div className="p-5 border border-[#E4DFD3] bg-[#F3EFE6]/50 rounded space-y-3">
                          <label className="block text-xs font-medium text-[#142321]">
                            Organisation / Brand Workspace Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={organisationName}
                            onChange={(e) =>
                              setOrganisationName(e.target.value)
                            }
                            placeholder="e.g. Nilgiri Botanicals Pvt. Ltd."
                            className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
                          />
                          <p className="text-[11px] text-[#526360]">
                            Your account will be provisioned as{' '}
                            <strong>Brand Admin</strong> of this new workspace with full access to Brand Library, Autopilot thresholds, and Team &amp; Access controls.
                          </p>
                        </div>
                      ) : (
                        <div className="p-5 border border-[#E4DFD3] bg-[#F3EFE6]/50 rounded space-y-4">
                          <div>
                            <label className="block text-xs font-medium text-[#142321] mb-1">
                              Workspace Code or Invite Link *
                            </label>
                            <input
                              type="text"
                              required
                              value={workspaceCodeOrInvite}
                              onChange={(e) =>
                                setWorkspaceCodeOrInvite(e.target.value)
                              }
                              placeholder="e.g. KAVERI-2026 or INV-KAVERI-REV-2026"
                              className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded font-mono-tabular"
                            />
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-[#526360]">
                              <span>Quick fill active codes:</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setWorkspaceCodeOrInvite('KAVERI-2026')
                                }
                                className="underline text-[#0B3D3A] font-mono-tabular cursor-pointer"
                              >
                                KAVERI-2026 (Workspace Code)
                              </button>
                              <span>·</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setWorkspaceCodeOrInvite(
                                    'INV-KAVERI-REV-2026'
                                  )
                                }
                                className="underline text-[#17806D] font-mono-tabular cursor-pointer"
                              >
                                INV-KAVERI-REV-2026 (Reviewer Invite Link)
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-medium text-[#142321]">
                                Role You Are Requesting *
                              </label>
                              <span className="text-[11px] text-[#B45309] font-mono-tabular">
                                Security Rule: Brand Admin cannot be self-selected on join
                              </span>
                            </div>

                            <div className="space-y-2">
                              {ROLE_DESCRIPTIONS.map((item) => {
                                const selected = requestedRole === item.role;
                                return (
                                  <label
                                    key={item.role}
                                    className={`block p-3 rounded border text-xs transition-colors cursor-pointer ${
                                      selected
                                        ? 'bg-[#FAF8F4] border-[#0B3D3A] ring-1 ring-[#0B3D3A]'
                                        : 'bg-[#FAF8F4]/70 border-[#E4DFD3] hover:border-[#0B3D3A]/50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="radio"
                                          name="requestedRole"
                                          checked={selected}
                                          onChange={() =>
                                            setRequestedRole(item.role)
                                          }
                                        />
                                        <span className="font-semibold text-[#0B3D3A]">
                                          {item.role}
                                        </span>
                                      </div>
                                      <span
                                        className={`text-[10px] font-mono-tabular px-2 py-0.5 rounded ${
                                          item.role === 'Creator'
                                            ? 'bg-[#7FD1BF]/30 text-[#0B3D3A]'
                                            : 'bg-[#F5A524]/25 text-[#B45309]'
                                        }`}
                                      >
                                        {item.badge}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#526360] mt-1 pl-5 leading-relaxed">
                                      {item.summary}
                                    </p>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setSignupStep(1)}
                          className="text-xs text-[#526360] hover:text-[#0B3D3A] cursor-pointer"
                        >
                          ← Back to Step 1
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-5 py-2.5 bg-[#0B3D3A] hover:bg-[#17806D] text-[#FAF8F4] rounded font-medium text-xs inline-flex items-center gap-2 cursor-pointer"
                        >
                          <span>
                            {loading
                              ? 'Provisioning Workspace Access...'
                              : joinMode === 'create-workspace'
                              ? 'Create Workspace as Brand Admin'
                              : `Join Workspace (${requestedRole})`}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* ===============================================================
                  SCREEN 3: EMAIL VERIFICATION SCREEN
                 =============================================================== */}
              {screen === 'verify-email' && (
                <div className="space-y-6 py-2">
                  <div className="w-10 h-10 rounded bg-[#7FD1BF]/30 text-[#0B3D3A] flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>

                  <div>
                    <p className="text-xs font-mono-tabular uppercase tracking-wider text-[#17806D]">
                      Email Verification Required
                    </p>
                    <h1 className="font-serif-display text-2xl font-semibold text-[#0B3D3A] mt-1">
                      Verify your email address
                    </h1>
                    <p className="text-xs text-[#364946] mt-2 leading-relaxed">
                      We sent a verification email to{' '}
                      <strong className="text-[#0B3D3A]">
                        {holdingProfile?.email || email}
                      </strong>
                      . Please click the verification link in that email to confirm ownership of your work address.
                    </p>
                  </div>

                  <div className="p-4 rounded bg-[#F3EFE6] border border-[#E4DFD3] text-xs space-y-2">
                    <p className="font-medium text-[#0B3D3A]">
                      Why Nirnay Sutra verifies work email addresses:
                    </p>
                    <p className="text-[#526360] leading-relaxed">
                      Every approval, guideline change, and Autopilot rollback is written to an immutable compliance audit log tied to a verified identity.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={loading || resendCooldown > 0}
                      onClick={handleResendVerification}
                      className="px-4 py-2 text-xs font-medium border border-[#0B3D3A] text-[#0B3D3A] hover:bg-[#F3EFE6] rounded inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>
                        {resendCooldown > 0
                          ? `Resend available in ${resendCooldown}s`
                          : 'Resend verification email'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmVerifiedContinue}
                      className="px-5 py-2 text-xs font-medium bg-[#0B3D3A] hover:bg-[#17806D] text-[#FAF8F4] rounded inline-flex items-center gap-2 cursor-pointer"
                    >
                      <span>I’ve verified my email — Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ===============================================================
                  SCREEN 4: PENDING APPROVAL SCREEN
                 =============================================================== */}
              {screen === 'pending-approval' && holdingProfile && (
                <div className="space-y-6 py-2">
                  <div className="w-10 h-10 rounded bg-[#F5A524]/25 text-[#B45309] flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>

                  <div>
                    <p className="text-xs font-mono-tabular uppercase tracking-wider text-[#B45309]">
                      Role Elevation Pending Brand Admin Approval
                    </p>
                    <h1 className="font-serif-display text-2xl font-semibold text-[#0B3D3A] mt-1">
                      Your {holdingProfile.requestedRole} request is awaiting approval
                    </h1>
                    <p className="text-xs text-[#364946] mt-2 leading-relaxed">
                      You joined the workspace requesting the{' '}
                      <strong className="text-[#0B3D3A]">
                        {holdingProfile.requestedRole}
                      </strong>{' '}
                      role. Under Nirnay Sutra’s security rules, elevated roles require sign-off from a Workspace Brand Admin.
                    </p>
                  </div>

                  <div className="p-4 rounded bg-[#F3EFE6] border border-[#E4DFD3] text-xs space-y-2">
                    <div className="flex items-center justify-between font-mono-tabular">
                      <span className="text-[#526360]">Requested Role:</span>
                      <span className="font-semibold text-[#B45309]">
                        {holdingProfile.requestedRole} (Pending Admin Review)
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-mono-tabular">
                      <span className="text-[#526360]">
                        Current Effective Access:
                      </span>
                      <span className="font-semibold text-[#17806D]">
                        Creator (Active Immediately)
                      </span>
                    </div>
                    <p className="text-[11px] text-[#526360] pt-2 border-t border-[#E4DFD3] leading-relaxed">
                      Your request for <strong>{holdingProfile.requestedRole}</strong> access is waiting for admin approval. You can use Creator access in the meantime.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        onAuthenticated(holdingProfile, holdingWorkspace)
                      }
                      className="px-5 py-2.5 text-xs font-medium bg-[#0B3D3A] hover:bg-[#17806D] text-[#FAF8F4] rounded inline-flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue with Creator Access Meanwhile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: DEMO MODE FOR JUDGES + Role Permissions Matrix (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border-2 border-[#0B3D3A] bg-[#F3EFE6] rounded p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono-tabular uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#0B3D3A] text-[#FAF8F4]">
                For Hackathon Judges &amp; Evaluators
              </span>
              <Sparkles className="w-4 h-4 text-[#17806D]" />
            </div>

            <div>
              <h2 className="font-serif-display text-xl font-semibold text-[#0B3D3A]">
                Explore the demo
              </h2>
              <p className="text-xs text-[#364946] mt-1 leading-relaxed">
                Open the <strong>Kaveri Organics</strong> sandbox workspace immediately with full sample data and no real account required. Each button signs you into an isolated demo session and redirects you to that role’s home screen:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleLaunchJudgeDemo('Creator')}
                className="p-3.5 rounded bg-[#FAF8F4] hover:bg-[#0B3D3A] hover:text-[#FAF8F4] border border-[#0B3D3A]/40 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Creator</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#17806D] group-hover:text-[#7FD1BF]" />
                </div>
                <p className="text-[11px] text-[#526360] group-hover:text-[#E4DFD3] mt-1">
                  Home: Review Studio · Draft &amp; accept/dismiss findings
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchJudgeDemo('Manager')}
                className="p-3.5 rounded bg-[#FAF8F4] hover:bg-[#0B3D3A] hover:text-[#FAF8F4] border border-[#0B3D3A]/40 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Manager</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#17806D] group-hover:text-[#7FD1BF]" />
                </div>
                <p className="text-[11px] text-[#526360] group-hover:text-[#E4DFD3] mt-1">
                  Home: Dashboard · Assign reviewers, comment &amp; view insights
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchJudgeDemo('Reviewer')}
                className="p-3.5 rounded bg-[#FAF8F4] hover:bg-[#0B3D3A] hover:text-[#FAF8F4] border border-[#0B3D3A]/40 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Reviewer</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#17806D] group-hover:text-[#7FD1BF]" />
                </div>
                <p className="text-[11px] text-[#526360] group-hover:text-[#E4DFD3] mt-1">
                  Home: Approvals Queue · Confidential access &amp; exceptions
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchJudgeDemo('Brand Admin')}
                className="p-3.5 rounded bg-[#0B3D3A] text-[#FAF8F4] hover:bg-[#17806D] border border-[#0B3D3A] text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Brand Admin</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#7FD1BF]" />
                </div>
                <p className="text-[11px] text-[#E4DFD3] mt-1">
                  Home: Autopilot &amp; Team Access · Full governance controls
                </p>
              </button>
            </div>

            <p className="text-[11px] text-[#526360] border-t border-[#E4DFD3] pt-2.5 font-mono-tabular">
              Sandbox Guarantee: Demo mode displays a top banner and keeps all changes isolated from live Firestore workspaces.
            </p>
          </div>

          <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 space-y-3">
            <h3 className="font-serif-display text-base font-semibold text-[#0B3D3A] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#17806D]" />
              <span>Role-Based Access &amp; Security Rules</span>
            </h3>
            <ul className="text-xs text-[#364946] space-y-2 leading-relaxed">
              <li>
                <strong>No Self-Escalation:</strong> Joining an existing workspace never allows choosing Brand Admin. Requesting Manager or Reviewer places the account in pending state with Creator access until approved.
              </li>
              <li>
                <strong>Confidential Item Guard:</strong> Brand Library items marked <em>Confidential</em> (such as F-05 Embargoed Wholesale Margin) are visible only to <strong>Reviewer</strong> and <strong>Brand Admin</strong> roles in both UI and <code className="font-mono-tabular">firestore.rules</code>.
              </li>
              <li>
                <strong>Route Guards:</strong> Typing or navigating to a restricted URL renders a clear <em>“You don’t have access”</em> screen rather than a blank view.
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

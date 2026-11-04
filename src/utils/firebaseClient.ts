import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  deleteUser,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocFromServer,
} from 'firebase/firestore';
import {
  AuthenticatedUserProfile,
  UserRole,
  WorkspaceInviteRecord,
  WorkspaceMemberRecord,
  WorkspaceRecord,
  SignInActivityRecord,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export type RequiredFirebaseEnvKey =
  | 'VITE_FIREBASE_API_KEY'
  | 'VITE_FIREBASE_AUTH_DOMAIN'
  | 'VITE_FIREBASE_PROJECT_ID'
  | 'VITE_FIREBASE_STORAGE_BUCKET'
  | 'VITE_FIREBASE_MESSAGING_SENDER_ID'
  | 'VITE_FIREBASE_APP_ID'
  | 'VITE_FIRESTORE_DATABASE_ID';

export interface EnvVarCheckItem {
  name: RequiredFirebaseEnvKey;
  status: 'Found' | 'Missing';
}

export interface FirebaseSetupStatus {
  allPresent: boolean;
  authInitialised: boolean;
  projectId: string | null;
  currentOrigin: string;
  variables: EnvVarCheckItem[];
}

export interface FormattedAuthError {
  code: string;
  message: string;
  canRetryPopupAndRedirect: boolean;
}

// ============================================================================
// 1. Read Firebase Config ONLY from the 7 VITE_* Environment Variables
//    (No hard-coded or placeholder config values)
// ============================================================================
const rawEnvConfig: Record<RequiredFirebaseEnvKey, string | undefined> = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env
    .VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  VITE_FIRESTORE_DATABASE_ID: import.meta.env.VITE_FIRESTORE_DATABASE_ID,
};

const REQUIRED_ENV_KEYS: RequiredFirebaseEnvKey[] = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIRESTORE_DATABASE_ID',
];

function isNonEmptyEnvValue(val: string | undefined): val is string {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  return trimmed.length > 0;
}

const envVariablesStatus: EnvVarCheckItem[] = REQUIRED_ENV_KEYS.map((key) => ({
  name: key,
  status: isNonEmptyEnvValue(rawEnvConfig[key]) ? 'Found' : 'Missing',
}));

const allEnvVarsPresent = envVariablesStatus.every(
  (item) => item.status === 'Found'
);

// ============================================================================
// 2. Initialise Firebase Once in This Single Module (Only if All Vars Present)
// ============================================================================
let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

function createResilientFirestore(app: FirebaseApp, dbId: string): Firestore {
  try {
    return initializeFirestore(
      app,
      { experimentalAutoDetectLongPolling: true },
      dbId
    );
  } catch {
    return getFirestore(app, dbId);
  }
}

if (allEnvVarsPresent) {
  try {
    const firebaseConfig = {
      apiKey: rawEnvConfig.VITE_FIREBASE_API_KEY!.trim(),
      authDomain: rawEnvConfig.VITE_FIREBASE_AUTH_DOMAIN!.trim(),
      projectId: rawEnvConfig.VITE_FIREBASE_PROJECT_ID!.trim(),
      storageBucket: rawEnvConfig.VITE_FIREBASE_STORAGE_BUCKET!.trim(),
      messagingSenderId: rawEnvConfig.VITE_FIREBASE_MESSAGING_SENDER_ID!.trim(),
      appId: rawEnvConfig.VITE_FIREBASE_APP_ID!.trim(),
    };
    const databaseId = rawEnvConfig.VITE_FIRESTORE_DATABASE_ID!.trim();

    appInstance =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(appInstance);
    dbInstance = createResilientFirestore(appInstance, databaseId);
  } catch (err: any) {
    const code = typeof err?.code === 'string' ? err.code : 'auth/init-failed';
    console.warn('[Firebase Auth Error Code]:', code);
    appInstance = null;
    authInstance = null;
    dbInstance = null;
  }
}

export const auth = authInstance;
export let db = dbInstance;

// Configure Google Provider with ONLY basic profile and email scopes (never Gmail/Drive)
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Returns the current setup verification status without ever exposing secret values.
 */
export function getFirebaseSetupStatus(): FirebaseSetupStatus {
  const origin =
    typeof window !== 'undefined' && window.location
      ? window.location.origin
      : '';
  return {
    allPresent: allEnvVarsPresent,
    authInitialised: Boolean(allEnvVarsPresent && authInstance !== null),
    projectId: isNonEmptyEnvValue(rawEnvConfig.VITE_FIREBASE_PROJECT_ID)
      ? rawEnvConfig.VITE_FIREBASE_PROJECT_ID.trim()
      : null,
    currentOrigin: origin,
    variables: envVariablesStatus,
  };
}

/**
 * Guard called before any Firebase Auth function.
 * Checks that every required environment variable is present and non-empty
 * and that Firebase Auth initialized cleanly.
 */
function ensureAuthReady(): { auth: Auth; db: Firestore | null } {
  const status = getFirebaseSetupStatus();
  if (!status.allPresent || !authInstance) {
    const err: any = new Error('Missing Firebase setup variables');
    err.code = 'auth/setup-incomplete';
    throw err;
  }
  return { auth: authInstance, db: dbInstance };
}

/**
 * Logs ONLY the Firebase error code to the browser console — never the API key or user data.
 */
export function logSafeAuthErrorCode(error: unknown): string {
  const rawCode =
    typeof (error as any)?.code === 'string'
      ? (error as any).code
      : typeof (error as any)?.message === 'string' &&
        (error as any).message.includes('auth/')
      ? ((error as any).message.match(/auth\/[a-z0-9-]+/i)?.[0] ??
        'auth/unknown-error')
      : 'auth/unknown-error';

  console.warn('[Firebase Auth Error Code]:', rawCode);
  return rawCode;
}

/**
 * Maps every Firebase Auth error to a plain-language message with a clear next step.
 * Never returns raw Firebase error text or exposes API keys/user data.
 */
export function formatAuthError(error: unknown): FormattedAuthError {
  const code = logSafeAuthErrorCode(error);

  if (code === 'auth/configuration-not-found') {
    return {
      code,
      message:
        "Authentication isn't switched on for this Firebase project. In the Firebase console, open Authentication, click Get started, then enable Google and Email/Password under Sign-in method.",
      canRetryPopupAndRedirect: false,
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      code,
      message:
        "This sign-in method isn't enabled. Enable it under Authentication > Sign-in method.",
      canRetryPopupAndRedirect: false,
    };
  }

  if (
    code === 'auth/unauthorized-domain' ||
    code === 'auth/invalid-continue-uri' ||
    code === 'auth/unauthorized-continue-uri'
  ) {
    return {
      code: 'auth/unauthorized-domain',
      message:
        "Add this site's address under Authentication > Settings > Authorized domains.",
      canRetryPopupAndRedirect: false,
    };
  }

  if (
    code === 'auth/invalid-api-key' ||
    code === 'auth/api-key-not-valid' ||
    code.startsWith('auth/api-key-not-valid')
  ) {
    return {
      code: 'auth/invalid-api-key',
      message:
        "The API key doesn't match this project. Re-copy the config values from Project settings.",
      canRetryPopupAndRedirect: false,
    };
  }

  if (
    code === 'auth/popup-blocked' ||
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request'
  ) {
    return {
      code,
      message:
        code === 'auth/popup-blocked'
          ? 'The sign-in popup was blocked by your browser. Click "Try again" or use redirect sign-in below.'
          : 'The sign-in popup was closed before completing sign-in. Click "Try again" or use redirect sign-in below.',
      canRetryPopupAndRedirect: true,
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      code,
      message: 'Check your internet connection and try again.',
      canRetryPopupAndRedirect: false,
    };
  }

  if (
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-login-credentials'
  ) {
    return {
      code,
      message:
        'Incorrect email or password. Check your details or click "Forgot password?" to reset it.',
      canRetryPopupAndRedirect: false,
    };
  }

  if (code === 'auth/user-not-found') {
    return {
      code,
      message:
        'No account was found for that email address. Click "Create an account (Sign up)" below to get started.',
      canRetryPopupAndRedirect: false,
    };
  }

  if (code === 'auth/email-already-in-use') {
    return {
      code,
      message:
        'An account with this email address already exists. Sign in with your password or reset it.',
      canRetryPopupAndRedirect: false,
    };
  }

  if (code === 'auth/weak-password') {
    return {
      code,
      message:
        'Please choose a stronger password with at least 8 characters, including uppercase, numbers, and symbols.',
      canRetryPopupAndRedirect: false,
    };
  }

  if (code === 'auth/invalid-email') {
    return {
      code,
      message: 'Please enter a valid email address.',
      canRetryPopupAndRedirect: false,
    };
  }

  if (code === 'auth/too-many-requests') {
    return {
      code,
      message:
        'Too many sign-in attempts from this browser. Wait a moment or reset your password before trying again.',
      canRetryPopupAndRedirect: false,
    };
  }

  if (code === 'auth/setup-incomplete') {
    return {
      code,
      message:
        'One or more required VITE_FIREBASE_* environment variables are missing. Review the Setup check screen.',
      canRetryPopupAndRedirect: false,
    };
  }

  if (code === 'auth/account-deactivated') {
    return {
      code,
      message:
        'Your account has been deactivated by a Brand Admin. Contact your workspace administrator to restore access.',
      canRetryPopupAndRedirect: false,
    };
  }

  if (code === 'auth/workspace-not-found') {
    return {
      code,
      message:
        'No workspace or active invite matched that code. Try workspace code "KAVERI-2026" or invite code "INV-KAVERI-REV-2026".',
      canRetryPopupAndRedirect: false,
    };
  }

  return {
    code,
    message:
      'Sign-in could not be completed. Verify your Firebase Authentication settings and try again.',
    canRetryPopupAndRedirect: false,
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const safeCode =
    typeof (error as any)?.code === 'string'
      ? (error as any).code
      : 'firestore/operation-error';
  const errInfo: FirestoreErrorInfo = {
    error: safeCode,
    authInfo: {
      userId: authInstance?.currentUser?.uid,
      email: undefined,
      emailVerified: authInstance?.currentUser?.emailVerified,
      isAnonymous: authInstance?.currentUser?.isAnonymous,
      tenantId: authInstance?.currentUser?.tenantId,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.warn('[Firestore Error Code]:', safeCode);
  return errInfo;
}

// Connection check that avoids unauthenticated WebChannel 404 requests on startup
let connectionTested = false;
export async function testFirestoreConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  if (!appInstance || !dbInstance) return false;
  // Do not open unauthenticated Firestore WebChannel streams on the landing page or demo mode
  if (!authInstance?.currentUser) {
    return true;
  }
  if (connectionTested) return true;
  connectionTested = true;

  try {
    await getDocFromServer(doc(dbInstance, 'users', authInstance.currentUser.uid));
    return true;
  } catch (error: any) {
    const code = typeof error?.code === 'string' ? error.code : '';
    const msg = error instanceof Error ? error.message : String(error);
    if (
      code === 'permission-denied' ||
      msg.toLowerCase().includes('missing or insufficient permissions')
    ) {
      return true;
    }
    return false;
  }
}

// Local storage keys for session continuity & isolated Demo Sandbox state
const STORAGE_AUTH_SESSION_KEY = 'nirnay_sutra_auth_profile_v3';
const STORAGE_WORKSPACES_KEY = 'nirnay_sutra_workspaces_v3';
const STORAGE_MEMBERS_KEY = 'nirnay_sutra_members_v3';
const STORAGE_INVITES_KEY = 'nirnay_sutra_invites_v3';
const STORAGE_SIGNIN_LOGS_KEY = 'nirnay_sutra_signin_logs_v3';

export const DEFAULT_WORKSPACES: WorkspaceRecord[] = [
  {
    id: 'ws-kaveri-organics',
    name: 'Kaveri Organics (Wayanad & Nilgiris)',
    workspaceCode: 'KAVERI-2026',
    ownerUid: 'usr-admin-ananya',
    autopilotMode: 'Autopilot',
    createdAt: '2026-09-12 09:00',
    isSandbox: false,
  },
  {
    id: 'ws-dakshin-handloom',
    name: 'Dakshin Handloom Collective',
    workspaceCode: 'DAKSHIN-108',
    ownerUid: 'usr-admin-ananya',
    autopilotMode: 'Assisted',
    createdAt: '2026-10-04 11:30',
    isSandbox: false,
  },
];

export const DEFAULT_WORKSPACE_MEMBERS: WorkspaceMemberRecord[] = [
  {
    uid: 'usr-admin-ananya',
    workspaceId: 'ws-kaveri-organics',
    email: 'ananya.krishnan@kaveriorganics.in',
    displayName: 'Ananya Krishnan',
    photoURL: '',
    authProvider: 'google',
    role: 'Brand Admin',
    requestedRole: 'Brand Admin',
    approvalStatus: 'approved',
    status: 'active',
    joinedAt: '2026-09-12 09:00',
    lastSignInAt: '2026-11-04 09:42',
  },
  {
    uid: 'usr-reviewer-vikram',
    workspaceId: 'ws-kaveri-organics',
    email: 'vikram.menon@kaveriorganics.in',
    displayName: 'Vikramaditya Menon',
    photoURL: '',
    authProvider: 'google',
    role: 'Reviewer',
    requestedRole: 'Reviewer',
    approvalStatus: 'approved',
    status: 'active',
    joinedAt: '2026-09-14 10:15',
    lastSignInAt: '2026-11-04 09:18',
  },
  {
    uid: 'usr-manager-meenakshi',
    workspaceId: 'ws-kaveri-organics',
    email: 'meenakshi.rao@kaveriorganics.in',
    displayName: 'Dr. Meenakshi Rao',
    photoURL: '',
    authProvider: 'password',
    role: 'Manager',
    requestedRole: 'Manager',
    approvalStatus: 'approved',
    status: 'active',
    joinedAt: '2026-09-18 14:20',
    lastSignInAt: '2026-11-03 18:05',
  },
  {
    uid: 'usr-creator-rohan',
    workspaceId: 'ws-kaveri-organics',
    email: 'rohan.deshmukh@agency-partner.in',
    displayName: 'Rohan Deshmukh',
    photoURL: '',
    authProvider: 'password',
    role: 'Creator',
    requestedRole: 'Creator',
    approvalStatus: 'approved',
    status: 'active',
    joinedAt: '2026-10-02 11:10',
    lastSignInAt: '2026-11-04 08:50',
  },
  {
    uid: 'usr-pending-kavita',
    workspaceId: 'ws-kaveri-organics',
    email: 'kavita.nair@kaveriorganics.in',
    displayName: 'Kavita Nair (Legal Counsel)',
    photoURL: '',
    authProvider: 'google',
    role: 'Creator',
    requestedRole: 'Reviewer',
    approvalStatus: 'pending',
    status: 'active',
    joinedAt: '2026-11-04 07:30',
    lastSignInAt: '2026-11-04 08:12',
  },
  {
    uid: 'usr-pending-siddharth',
    workspaceId: 'ws-kaveri-organics',
    email: 'siddharth.iyer@kaveriorganics.in',
    displayName: 'Siddharth Iyer (Campaign Lead)',
    photoURL: '',
    authProvider: 'password',
    role: 'Creator',
    requestedRole: 'Manager',
    approvalStatus: 'pending',
    status: 'active',
    joinedAt: '2026-11-03 19:45',
    lastSignInAt: '2026-11-04 07:55',
  },
];

export const DEFAULT_INVITES: WorkspaceInviteRecord[] = [
  {
    id: 'INV-KAVERI-REV-2026',
    workspaceId: 'ws-kaveri-organics',
    workspaceName: 'Kaveri Organics (Wayanad & Nilgiris)',
    assignedRole: 'Reviewer',
    createdByUid: 'usr-admin-ananya',
    createdByName: 'Ananya Krishnan',
    expiresAt: '2026-12-31',
    createdAt: '2026-11-01 10:00',
    usedCount: 1,
    revoked: false,
  },
  {
    id: 'INV-KAVERI-CRE-2026',
    workspaceId: 'ws-kaveri-organics',
    workspaceName: 'Kaveri Organics (Wayanad & Nilgiris)',
    assignedRole: 'Creator',
    createdByUid: 'usr-admin-ananya',
    createdByName: 'Ananya Krishnan',
    expiresAt: '2026-11-30',
    createdAt: '2026-11-02 15:20',
    usedCount: 3,
    revoked: false,
  },
];

export const DEFAULT_SIGNIN_ACTIVITY: SignInActivityRecord[] = [
  {
    id: 'ACT-101',
    uid: 'usr-admin-ananya',
    userName: 'Ananya Krishnan',
    userEmail: 'ananya.krishnan@kaveriorganics.in',
    role: 'Brand Admin',
    authProvider: 'google',
    event: 'SIGN_IN',
    timestamp: '2026-11-04 09:42:10',
    deviceSummary: 'macOS · Chrome 130 (Bengaluru, IN)',
  },
  {
    id: 'ACT-102',
    uid: 'usr-reviewer-vikram',
    userName: 'Vikramaditya Menon',
    userEmail: 'vikram.menon@kaveriorganics.in',
    role: 'Reviewer',
    authProvider: 'google',
    event: 'SIGN_IN',
    timestamp: '2026-11-04 09:18:04',
    deviceSummary: 'macOS · Safari 18 (Kochi, IN)',
  },
  {
    id: 'ACT-103',
    uid: 'usr-creator-rohan',
    userName: 'Rohan Deshmukh',
    userEmail: 'rohan.deshmukh@agency-partner.in',
    role: 'Creator',
    authProvider: 'password',
    event: 'SIGN_IN',
    timestamp: '2026-11-04 08:50:31',
    deviceSummary: 'Windows 11 · Edge (Mumbai, IN)',
  },
  {
    id: 'ACT-104',
    uid: 'usr-pending-kavita',
    userName: 'Kavita Nair (Legal Counsel)',
    userEmail: 'kavita.nair@kaveriorganics.in',
    role: 'Creator',
    authProvider: 'google',
    event: 'SIGN_IN',
    timestamp: '2026-11-04 08:12:19',
    deviceSummary: 'macOS · Chrome 130 (Bengaluru, IN)',
  },
];

export function loadWorkspaces(): WorkspaceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_WORKSPACES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_WORKSPACES;
  } catch {
    return DEFAULT_WORKSPACES;
  }
}

export function saveWorkspaces(list: WorkspaceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_WORKSPACES_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

export function loadWorkspaceMembers(): WorkspaceMemberRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_MEMBERS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_WORKSPACE_MEMBERS;
  } catch {
    return DEFAULT_WORKSPACE_MEMBERS;
  }
}

export function saveWorkspaceMembers(list: WorkspaceMemberRecord[]): void {
  try {
    localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function loadWorkspaceInvites(): WorkspaceInviteRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_INVITES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_INVITES;
  } catch {
    return DEFAULT_INVITES;
  }
}

export function saveWorkspaceInvites(list: WorkspaceInviteRecord[]): void {
  try {
    localStorage.setItem(STORAGE_INVITES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function loadSignInActivity(): SignInActivityRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_SIGNIN_LOGS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SIGNIN_ACTIVITY;
  } catch {
    return DEFAULT_SIGNIN_ACTIVITY;
  }
}

export function recordSignInActivity(
  entry: Omit<SignInActivityRecord, 'id' | 'timestamp'>
): SignInActivityRecord[] {
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const newRecord: SignInActivityRecord = {
    ...entry,
    id: `ACT-${Date.now()}-${Math.floor(Math.random() * 100)}`,
    timestamp: nowStr,
  };
  const next = [newRecord, ...loadSignInActivity()].slice(0, 80);
  try {
    localStorage.setItem(STORAGE_SIGNIN_LOGS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function loadStoredUserProfile(): AuthenticatedUserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredUserProfile(
  profile: AuthenticatedUserProfile | null
): void {
  try {
    if (!profile) {
      localStorage.removeItem(STORAGE_AUTH_SESSION_KEY);
    } else {
      localStorage.setItem(STORAGE_AUTH_SESSION_KEY, JSON.stringify(profile));
    }
  } catch {
    // ignore
  }
}

/**
 * Syncs a user profile and workspace membership to Firestore when authenticated with Firebase,
 * while never throwing unhandled rejections if a sandbox user is active.
 */
export async function syncProfileAndMemberToFirestore(
  profile: AuthenticatedUserProfile,
  workspace?: WorkspaceRecord
): Promise<void> {
  if (profile.isDemoSandbox || !authInstance?.currentUser || !dbInstance) return;

  const uid = authInstance.currentUser.uid;
  const nowStr = new Date().toISOString();

  if (workspace && workspace.ownerUid === uid) {
    const wsPath = `workspaces/${workspace.id}`;
    try {
      await setDoc(doc(dbInstance, 'workspaces', workspace.id), {
        id: workspace.id,
        name: workspace.name,
        workspaceCode: workspace.workspaceCode,
        ownerUid: uid,
        autopilotMode: workspace.autopilotMode || 'Autopilot',
        createdAt: workspace.createdAt || nowStr,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, wsPath);
    }
  }

  const memberPath = `workspaces/${profile.activeWorkspaceId}/members/${uid}`;
  try {
    await setDoc(
      doc(dbInstance, 'workspaces', profile.activeWorkspaceId, 'members', uid),
      {
        uid,
        workspaceId: profile.activeWorkspaceId,
        email: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL || '',
        role: profile.role,
        requestedRole: profile.requestedRole,
        approvalStatus: profile.approvalStatus,
        status: profile.status,
        joinedAt: profile.createdAt || nowStr,
        lastSignInAt: nowStr,
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, memberPath);
  }

  const userPath = `users/${uid}`;
  try {
    await setDoc(
      doc(dbInstance, 'users', uid),
      {
        uid,
        email: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL || '',
        authProvider: profile.authProvider === 'google' ? 'google' : 'password',
        emailVerified: profile.emailVerified,
        activeWorkspaceId: profile.activeWorkspaceId,
        role: profile.role,
        requestedRole: profile.requestedRole,
        approvalStatus: profile.approvalStatus,
        status: profile.status,
        consentedToTermsAt: profile.consentedToTermsAt || nowStr,
        sessionEpoch: profile.sessionEpoch || 1,
        lastSignInAt: nowStr,
        createdAt: profile.createdAt || nowStr,
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }
}

/**
 * Helper to resolve a Firebase Auth User into an existing or new step-1 identity
 */
async function resolveFirebaseGoogleUser(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
  existingProfile: AuthenticatedUserProfile | null;
}> {
  let existingProfile: AuthenticatedUserProfile | null = null;
  if (dbInstance) {
    try {
      const snap = await getDoc(doc(dbInstance, 'users', user.uid));
      if (snap.exists()) {
        existingProfile = snap.data() as AuthenticatedUserProfile;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }
  }

  if (!existingProfile) {
    const cached = loadStoredUserProfile();
    if (cached && cached.email === user.email && !cached.isDemoSandbox) {
      existingProfile = cached;
    }
  }

  return {
    uid: user.uid,
    email: user.email || 'user@google.com',
    displayName:
      user.displayName || (user.email ? user.email.split('@')[0] : 'Google User'),
    photoURL: user.photoURL || '',
    emailVerified: true,
    existingProfile,
  };
}

/**
 * 1a. Google Sign-In via Firebase Popup (requests ONLY basic profile and email scopes)
 */
export async function authenticateWithGoogle(): Promise<{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
  existingProfile: AuthenticatedUserProfile | null;
}> {
  const { auth: readyAuth } = ensureAuthReady();
  const credential = await signInWithPopup(readyAuth, googleProvider);
  return resolveFirebaseGoogleUser(credential.user);
}

/**
 * 1b. Fallback to Google Sign-In via Redirect (signInWithRedirect)
 * Used when popup is blocked or closed by the user.
 */
export async function authenticateWithGoogleRedirect(): Promise<void> {
  const { auth: readyAuth } = ensureAuthReady();
  await signInWithRedirect(readyAuth, googleProvider);
}

/**
 * 1c. Check for pending Redirect Sign-In Result on page load
 */
export async function checkGoogleRedirectResult(): Promise<{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
  existingProfile: AuthenticatedUserProfile | null;
} | null> {
  if (!allEnvVarsPresent || !authInstance) return null;
  const credential = await getRedirectResult(authInstance);
  if (!credential || !credential.user) return null;
  return resolveFirebaseGoogleUser(credential.user);
}

/**
 * 2. Email + Password Sign-Up (Step 1)
 */
export async function registerWithEmailPassword(
  email: string,
  password: string,
  displayName: string
): Promise<{
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}> {
  const { auth: readyAuth } = ensureAuthReady();
  const cleanEmail = email.trim().toLowerCase();
  const cred = await createUserWithEmailAndPassword(
    readyAuth,
    cleanEmail,
    password
  );
  if (displayName.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  try {
    await sendEmailVerification(cred.user);
  } catch {
    // ignore if verification email throttled
  }
  return {
    uid: cred.user.uid,
    email: cleanEmail,
    displayName: displayName.trim() || cleanEmail.split('@')[0],
    emailVerified: cred.user.emailVerified,
  };
}

/**
 * 3. Email + Password Sign-In
 */
export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<AuthenticatedUserProfile> {
  const { auth: readyAuth, db: readyDb } = ensureAuthReady();
  const cleanEmail = email.trim().toLowerCase();

  const cred = await signInWithEmailAndPassword(
    readyAuth,
    cleanEmail,
    password
  );
  const user = cred.user;
  let profile: AuthenticatedUserProfile | null = null;
  if (readyDb) {
    try {
      const snap = await getDoc(doc(readyDb, 'users', user.uid));
      if (snap.exists()) {
        profile = snap.data() as AuthenticatedUserProfile;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }
  }

  if (!profile) {
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    profile = {
      uid: user.uid,
      email: cleanEmail,
      displayName: user.displayName || cleanEmail.split('@')[0],
      photoURL: user.photoURL || '',
      authProvider: 'password',
      emailVerified: user.emailVerified,
      activeWorkspaceId: 'ws-kaveri-organics',
      role: 'Creator',
      requestedRole: 'Creator',
      approvalStatus: 'approved',
      status: 'active',
      consentedToTermsAt: nowStr,
      sessionEpoch: 1,
      lastSignInAt: nowStr,
      createdAt: nowStr,
    };
  }

  if (profile.status === 'deactivated') {
    const deactErr: any = new Error('Account deactivated');
    deactErr.code = 'auth/account-deactivated';
    throw deactErr;
  }

  const updated: AuthenticatedUserProfile = {
    ...profile,
    lastSignInAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  saveStoredUserProfile(updated);
  await syncProfileAndMemberToFirestore(updated);
  recordSignInActivity({
    uid: updated.uid,
    userName: updated.displayName,
    userEmail: updated.email,
    role: updated.role,
    authProvider: 'password',
    event: 'SIGN_IN',
    deviceSummary: 'Browser Session · Email + Password',
  });
  return updated;
}

/**
 * 4. Complete Step 2 of Sign-Up: Create New Workspace OR Join Existing Workspace
 */
export async function completeStepTwoWorkspaceSetup(params: {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  authProvider: 'google' | 'password';
  emailVerified: boolean;
  mode: 'create-workspace' | 'join-workspace';
  organisationName?: string;
  workspaceCodeOrInvite?: string;
  requestedRole?: 'Creator' | 'Manager' | 'Reviewer';
}): Promise<{
  profile: AuthenticatedUserProfile;
  workspace: WorkspaceRecord;
}> {
  ensureAuthReady();
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const workspaces = loadWorkspaces();
  const members = loadWorkspaceMembers();
  const invites = loadWorkspaceInvites();

  let targetWorkspace: WorkspaceRecord;
  let effectiveRole: UserRole = 'Creator';
  let requestedRole: UserRole = 'Creator';
  let approvalStatus: 'approved' | 'pending' = 'approved';

  if (params.mode === 'create-workspace') {
    const orgName = (params.organisationName || 'New Brand Workspace').trim();
    const cleanPrefix =
      orgName
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 6) || 'BRAND';
    const wsId = `ws-${cleanPrefix.toLowerCase()}-${Date.now()
      .toString()
      .slice(-4)}`;
    const wsCode = `${cleanPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    targetWorkspace = {
      id: wsId,
      name: orgName,
      workspaceCode: wsCode,
      ownerUid: params.uid,
      autopilotMode: 'Autopilot',
      createdAt: nowStr,
      isSandbox: false,
    };

    effectiveRole = 'Brand Admin';
    requestedRole = 'Brand Admin';
    approvalStatus = 'approved';

    const nextWorkspaces = [targetWorkspace, ...workspaces];
    saveWorkspaces(nextWorkspaces);
  } else {
    const rawCode = (params.workspaceCodeOrInvite || '').trim();
    const extractedToken = rawCode.includes('invite=')
      ? rawCode.split('invite=')[1].split('&')[0]
      : rawCode.toUpperCase();

    const matchedInvite = invites.find(
      (inv) =>
        inv.id.toUpperCase() === extractedToken &&
        !inv.revoked &&
        new Date(inv.expiresAt).getTime() >= Date.now() - 86400000
    );

    if (matchedInvite) {
      targetWorkspace =
        workspaces.find((w) => w.id === matchedInvite.workspaceId) ||
        workspaces[0];
      effectiveRole = matchedInvite.assignedRole;
      requestedRole = matchedInvite.assignedRole;
      approvalStatus = 'approved';

      const updatedInvites = invites.map((i) =>
        i.id === matchedInvite.id ? { ...i, usedCount: i.usedCount + 1 } : i
      );
      saveWorkspaceInvites(updatedInvites);
    } else {
      const matchedWs = workspaces.find(
        (w) =>
          w.workspaceCode.toUpperCase() === extractedToken ||
          w.id.toUpperCase() === extractedToken
      );
      if (!matchedWs) {
        const wsErr: any = new Error('Workspace not found');
        wsErr.code = 'auth/workspace-not-found';
        throw wsErr;
      }
      targetWorkspace = matchedWs;

      const chosenRole = params.requestedRole || 'Creator';
      requestedRole = chosenRole;
      if (chosenRole === 'Creator') {
        effectiveRole = 'Creator';
        approvalStatus = 'approved';
      } else {
        effectiveRole = 'Creator';
        approvalStatus = 'pending';
      }
    }
  }

  const newMember: WorkspaceMemberRecord = {
    uid: params.uid,
    workspaceId: targetWorkspace.id,
    email: params.email,
    displayName: params.displayName,
    photoURL: params.photoURL || '',
    authProvider: params.authProvider,
    role: effectiveRole,
    requestedRole,
    approvalStatus,
    status: 'active',
    joinedAt: nowStr,
    lastSignInAt: nowStr,
  };

  const filteredMembers = members.filter(
    (m) => !(m.uid === params.uid && m.workspaceId === targetWorkspace.id)
  );
  saveWorkspaceMembers([newMember, ...filteredMembers]);

  const profile: AuthenticatedUserProfile = {
    uid: params.uid,
    email: params.email,
    displayName: params.displayName,
    photoURL: params.photoURL || '',
    authProvider: params.authProvider,
    emailVerified: params.emailVerified,
    activeWorkspaceId: targetWorkspace.id,
    role: effectiveRole,
    requestedRole,
    approvalStatus,
    status: 'active',
    consentedToTermsAt: nowStr,
    sessionEpoch: 1,
    lastSignInAt: nowStr,
    createdAt: nowStr,
    isDemoSandbox: false,
  };

  saveStoredUserProfile(profile);
  await syncProfileAndMemberToFirestore(profile, targetWorkspace);

  recordSignInActivity({
    uid: profile.uid,
    userName: profile.displayName,
    userEmail: profile.email,
    role: profile.role,
    authProvider: profile.authProvider,
    event: 'SIGN_IN',
    deviceSummary: `Joined ${targetWorkspace.name} (${
      approvalStatus === 'pending'
        ? `Pending ${requestedRole} Approval`
        : effectiveRole
    })`,
  });

  return { profile, workspace: targetWorkspace };
}

/**
 * 5. Send Password Reset Email
 */
export async function triggerPasswordResetEmail(email: string): Promise<void> {
  const { auth: readyAuth } = ensureAuthReady();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    const emailErr: any = new Error('Invalid email');
    emailErr.code = 'auth/invalid-email';
    throw emailErr;
  }
  await sendPasswordResetEmail(readyAuth, cleanEmail);
}

/**
 * 6. Resend Email Verification & Mark Verified
 */
export async function resendEmailVerificationLink(): Promise<void> {
  const { auth: readyAuth } = ensureAuthReady();
  if (readyAuth.currentUser) {
    await sendEmailVerification(readyAuth.currentUser);
  }
}

export function markCurrentUserEmailVerified(
  profile: AuthenticatedUserProfile
): AuthenticatedUserProfile {
  const updated: AuthenticatedUserProfile = {
    ...profile,
    emailVerified: true,
  };
  saveStoredUserProfile(updated);
  return updated;
}

/**
 * 7. Judge Demo Mode ("Explore the demo") — Isolated Sandbox Sessions
 */
export function createDemoSandboxSession(
  role: UserRole
): AuthenticatedUserProfile {
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const personaMap: Record<
    UserRole,
    { uid: string; name: string; email: string }
  > = {
    Creator: {
      uid: 'demo-creator-rohan',
      name: 'Rohan Deshmukh (Demo Creator)',
      email: 'rohan.demo@kaveriorganics.sandbox',
    },
    Manager: {
      uid: 'demo-manager-meenakshi',
      name: 'Dr. Meenakshi Rao (Demo Manager)',
      email: 'meenakshi.demo@kaveriorganics.sandbox',
    },
    Reviewer: {
      uid: 'demo-reviewer-vikram',
      name: 'Vikramaditya Menon (Demo Reviewer)',
      email: 'vikram.demo@kaveriorganics.sandbox',
    },
    'Brand Admin': {
      uid: 'demo-admin-ananya',
      name: 'Ananya Krishnan (Demo Brand Admin)',
      email: 'ananya.demo@kaveriorganics.sandbox',
    },
  };

  const persona = personaMap[role];
  const profile: AuthenticatedUserProfile = {
    uid: persona.uid,
    email: persona.email,
    displayName: persona.name,
    photoURL: '',
    authProvider: 'demo-sandbox',
    emailVerified: true,
    activeWorkspaceId: 'ws-kaveri-organics',
    role,
    requestedRole: role,
    approvalStatus: 'approved',
    status: 'active',
    consentedToTermsAt: nowStr,
    sessionEpoch: 1,
    lastSignInAt: nowStr,
    createdAt: nowStr,
    isDemoSandbox: true,
  };

  saveStoredUserProfile(profile);
  recordSignInActivity({
    uid: profile.uid,
    userName: profile.displayName,
    userEmail: profile.email,
    role: profile.role,
    authProvider: 'demo-sandbox',
    event: 'SIGN_IN',
    deviceSummary: `Judge Demo Mode Sandbox (${role})`,
  });

  return profile;
}

/**
 * 8. Role-Appropriate Home Route Resolver
 */
export function getRoleHomeTab(role: UserRole): string {
  switch (role) {
    case 'Brand Admin':
      return 'autopilot';
    case 'Reviewer':
      return 'approvals';
    case 'Manager':
      return 'dashboard';
    case 'Creator':
    default:
      return 'review-studio';
  }
}

/**
 * 9. Sign Out & Sign Out of All Devices
 */
export async function performSignOut(
  currentProfile: AuthenticatedUserProfile | null,
  allDevices = false
): Promise<void> {
  if (currentProfile) {
    recordSignInActivity({
      uid: currentProfile.uid,
      userName: currentProfile.displayName,
      userEmail: currentProfile.email,
      role: currentProfile.role,
      authProvider: currentProfile.authProvider,
      event: allDevices ? 'SIGN_OUT_ALL_DEVICES' : 'SIGN_OUT',
      deviceSummary: allDevices
        ? 'Revoked all active device sessions (sessionEpoch incremented)'
        : 'User signed out',
    });

    if (
      allDevices &&
      !currentProfile.isDemoSandbox &&
      authInstance?.currentUser &&
      dbInstance
    ) {
      const nextEpoch = (currentProfile.sessionEpoch || 1) + 1;
      try {
        await updateDoc(doc(dbInstance, 'users', authInstance.currentUser.uid), {
          sessionEpoch: nextEpoch,
          lastSignInAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `users/${authInstance.currentUser.uid}`
        );
      }
    }
  }

  saveStoredUserProfile(null);
  if (authInstance) {
    try {
      await signOut(authInstance);
    } catch {
      // ignore
    }
  }
}

/**
 * 10. Delete My Account and Data
 */
export async function deleteAccountAndPersonalData(
  currentProfile: AuthenticatedUserProfile
): Promise<void> {
  recordSignInActivity({
    uid: currentProfile.uid,
    userName: currentProfile.displayName,
    userEmail: currentProfile.email,
    role: currentProfile.role,
    authProvider: currentProfile.authProvider,
    event: 'ACCOUNT_DELETED',
    deviceSummary: 'Self-service account & profile deletion executed',
  });

  const members = loadWorkspaceMembers().filter(
    (m) => m.uid !== currentProfile.uid && m.email !== currentProfile.email
  );
  saveWorkspaceMembers(members);

  if (!currentProfile.isDemoSandbox && authInstance?.currentUser && dbInstance) {
    const uid = authInstance.currentUser.uid;
    try {
      await deleteDoc(
        doc(
          dbInstance,
          'workspaces',
          currentProfile.activeWorkspaceId,
          'members',
          uid
        )
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `workspaces/${currentProfile.activeWorkspaceId}/members/${uid}`
      );
    }

    try {
      await deleteDoc(doc(dbInstance, 'users', uid));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }

    try {
      await deleteUser(authInstance.currentUser);
    } catch {
      await signOut(authInstance);
    }
  }

  saveStoredUserProfile(null);
}

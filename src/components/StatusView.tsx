import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Lock,
  Sparkles,
  Server,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { getFirebaseSetupStatus, FirebaseSetupStatus, testFirestoreConnection } from '../utils/firebaseClient';
import { getDailyAiChecksRemaining } from '../utils/governanceEngine';

export const StatusView: React.FC = () => {
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseSetupStatus>(() =>
    getFirebaseSetupStatus()
  );
  const [firestorePing, setFirestorePing] = useState<{
    ok: boolean;
    latencyMs?: number;
    error?: string;
    checkedAt?: string;
  } | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const env = ((import.meta as any).env || {}) as Record<string, string | undefined>;
  const buildSha = env.VITE_BUILD_SHA || 'v2.4-ghpages';
  const geminiKey = (env.VITE_GEMINI_API_KEY || '').trim();
  const hasGeminiKey = Boolean(geminiKey && geminiKey !== 'MY_GEMINI_API_KEY');
  const aiChecksRemaining = getDailyAiChecksRemaining();

  const handleTestConnections = async () => {
    setIsPinging(true);
    setFirebaseStatus(getFirebaseSetupStatus());
    try {
      const start = performance.now();
      const connected = await testFirestoreConnection();
      const latencyMs = Math.round(performance.now() - start);
      setFirestorePing({
        ok: connected,
        latencyMs,
        checkedAt: new Date().toLocaleTimeString(),
      });
    } catch (e: any) {
      setFirestorePing({
        ok: false,
        error: e?.message || 'Connection failed',
        checkedAt: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    handleTestConnections();
  }, []);

  const requiredVariables = [
    { name: 'VITE_BASE', value: env.VITE_BASE || '/Nirnay-Suytra/', required: true, desc: 'Base URL for GitHub Pages assets' },
    { name: 'VITE_FIREBASE_API_KEY', value: env.VITE_FIREBASE_API_KEY, required: true, desc: 'Firebase Web client API key' },
    { name: 'VITE_FIREBASE_AUTH_DOMAIN', value: env.VITE_FIREBASE_AUTH_DOMAIN, required: true, desc: 'Firebase Auth redirect domain' },
    { name: 'VITE_FIREBASE_PROJECT_ID', value: env.VITE_FIREBASE_PROJECT_ID, required: true, desc: 'Cloud project identifier' },
    { name: 'VITE_FIREBASE_STORAGE_BUCKET', value: env.VITE_FIREBASE_STORAGE_BUCKET, required: true, desc: 'Firebase Storage bucket reference' },
    { name: 'VITE_FIREBASE_MESSAGING_SENDER_ID', value: env.VITE_FIREBASE_MESSAGING_SENDER_ID, required: true, desc: 'Cloud messaging sender numerical ID' },
    { name: 'VITE_FIREBASE_APP_ID', value: env.VITE_FIREBASE_APP_ID, required: true, desc: 'Firebase Web application ID' },
    { name: 'VITE_FIRESTORE_DATABASE_ID', value: env.VITE_FIRESTORE_DATABASE_ID, required: true, desc: 'Firestore database instance ID' },
    { name: 'VITE_GEMINI_API_KEY', value: env.VITE_GEMINI_API_KEY, required: false, desc: 'Google AI Studio key for semantic checks' },
    { name: 'VITE_BUILD_SHA', value: env.VITE_BUILD_SHA, required: false, desc: 'Git commit hash of live deployment' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4DFD3]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#17806D] mb-1">
            <Activity className="w-4 h-4 text-[#17806D]" />
            <span>Deployment Diagnostics · Nirnay Sutra Status</span>
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
            System Status &amp; Integrity
          </h1>
          <p className="text-xs text-[#526360] mt-0.5">
            Real-time verification of client-side configuration, service reachability, and free-tier quota.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTestConnections}
          disabled={isPinging}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
          <span>{isPinging ? 'Pinging Services...' : 'Re-test Connections'}</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono-tabular">
        {/* Card 1: Firebase Auth */}
        <div className="bg-white border border-[#E4DFD3] rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-[#526360]">
            <span>Firebase Auth</span>
            <Lock className="w-4 h-4 text-[#17806D]" />
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {firebaseStatus.allPresent ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#17806D]" />
                <span className="font-semibold text-sm text-[#0B3D3A]">Configured</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-[#B45309]" />
                <span className="font-semibold text-sm text-[#B45309]">Demo Mode</span>
              </>
            )}
          </div>
          <span className="text-[11px] text-[#526360] block">Google &amp; Email/Password</span>
        </div>

        {/* Card 2: Firestore Database */}
        <div className="bg-white border border-[#E4DFD3] rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-[#526360]">
            <span>Cloud Firestore</span>
            <Database className="w-4 h-4 text-[#17806D]" />
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {firestorePing?.ok ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#17806D]" />
                <span className="font-semibold text-sm text-[#0B3D3A]">
                  Connected ({firestorePing.latencyMs}ms)
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-[#B45309]" />
                <span className="font-semibold text-sm text-[#B45309]">Local Storage</span>
              </>
            )}
          </div>
          <span className="text-[11px] text-[#526360] block">
            {firestorePing?.checkedAt ? `Checked at ${firestorePing.checkedAt}` : 'Initializing...'}
          </span>
        </div>

        {/* Card 3: AI Checks Left Today */}
        <div className="bg-white border border-[#E4DFD3] rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-[#526360]">
            <span>AI Free Quota</span>
            <Sparkles className="w-4 h-4 text-[#17806D]" />
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <span className="font-semibold text-sm text-[#0B3D3A]">
              {aiChecksRemaining} / 50 left
            </span>
          </div>
          <span className="text-[11px] text-[#526360] block">
            Resets at midnight UTC · Caches by content hash
          </span>
        </div>

        {/* Card 4: Build Version */}
        <div className="bg-white border border-[#E4DFD3] rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-[#526360]">
            <span>Live Build SHA</span>
            <Server className="w-4 h-4 text-[#17806D]" />
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <code className="font-semibold text-sm text-[#0B3D3A] font-mono-tabular">
              {buildSha.slice(0, 10)}
            </code>
          </div>
          <span className="text-[11px] text-[#526360] block">Static GitHub Pages bundle</span>
        </div>
      </div>

      {/* Environment Variables Table (Never prints secret values!) */}
      <div className="bg-white border border-[#E4DFD3] rounded-lg overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#E4DFD3] flex items-center justify-between">
          <div>
            <h3 className="font-serif-display text-base font-semibold text-[#0B3D3A] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#17806D]" />
              Environment Variables Status (Security Audit)
            </h3>
            <p className="text-xs text-[#526360]">
              Shows whether each variable is present. Secret values are never exposed or printed.
            </p>
          </div>
          <span className="text-xs text-[#17806D] font-mono-tabular font-medium">
            100% Client-Side Static Build
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-[#F3EFE6] border-b border-[#E4DFD3] text-[11px] text-[#526360] font-mono-tabular uppercase">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Variable Name</th>
              <th className="py-2.5 px-3 font-semibold">Requirement</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-4 font-semibold">Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4DFD3]">
            {requiredVariables.map((v) => {
              const isPresent = Boolean(v.value && String(v.value).trim().length > 0);
              return (
                <tr key={v.name} className="hover:bg-[#FAF8F4]">
                  <td className="py-3 px-4 font-mono-tabular font-medium text-[#142321]">
                    {v.name}
                  </td>
                  <td className="py-3 px-3 font-mono-tabular text-[#526360]">
                    {v.required ? (
                      <span className="text-[#0B3D3A] font-medium">Required</span>
                    ) : (
                      <span className="text-[#526360] italic">Optional</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {isPresent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#7FD1BF]/25 text-[#0B3D3A] border border-[#17806D]/30">
                        <CheckCircle2 className="w-3 h-3 text-[#17806D]" />
                        Found
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                        <AlertTriangle className="w-3 h-3 text-[#B45309]" />
                        Missing
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#526360]">
                    {v.desc}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Security Notice */}
      <div className="p-4 bg-[#F3EFE6]/70 border border-[#E4DFD3] rounded-lg text-xs space-y-2">
        <span className="font-semibold text-[#0B3D3A] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#17806D]" />
          Production Deployment Guarantee
        </span>
        <p className="text-[#526360] leading-relaxed">
          Nirnay Sutra deploys as a pure static bundle on GitHub Pages. No backend server is required in production. If any Firebase variable is missing, the application automatically preserves all drafts and brand rules in browser storage so your work is never lost.
        </p>
      </div>
    </div>
  );
};

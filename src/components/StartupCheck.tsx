import React, { useState } from 'react';
import { Settings, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';
import { getFirebaseSetupStatus, FirebaseSetupStatus } from '../utils/firebaseClient';

interface StartupCheckProps {
  status: FirebaseSetupStatus;
  onExploreDemo: () => void;
}

export const StartupCheck: React.FC<StartupCheckProps> = ({ status, onExploreDemo }) => {
  const [checking, setChecking] = useState(false);

  const handleRefresh = () => {
    setChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  const missingCount = status.variables.filter((v) => v.status === 'Missing').length;

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#142321] flex flex-col justify-between p-4 sm:p-8" role="alert">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-[#E4DFD3]">
        <div className="flex items-center gap-3">
          <span className="font-devanagari text-lg font-semibold text-[#17806D]">
            निर्णय सूत्र
          </span>
          <span className="text-[#C8C2B4]">|</span>
          <span className="font-serif-display text-xl font-semibold text-[#0B3D3A]">
            Nirnay Sutra
          </span>
        </div>
        <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#B45309] bg-[#FEF3C7] px-2.5 py-1 rounded border border-[#FDE68A]">
          Setup Required
        </span>
      </header>

      {/* Main Alert Card */}
      <main className="max-w-4xl w-full mx-auto my-8 space-y-6">
        <div className="bg-white border border-[#E4DFD3] rounded-xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0 border border-[#FDE68A]">
              <Settings className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <p className="text-xs font-mono-tabular uppercase tracking-wider text-[#B45309]">
                Environment Startup Check · {missingCount} Missing Configuration {missingCount === 1 ? 'Key' : 'Keys'}
              </p>
              <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A] mt-1">
                Setup incomplete: missing Firebase configuration
              </h1>
              <p className="text-sm text-[#526360] mt-2 leading-relaxed">
                Nirnay Sutra is designed to run statically on GitHub Pages or any static host. Live Firebase Authentication and Cloud Firestore require environment configuration secrets.
              </p>
            </div>
          </div>

          {/* Environment Variables Status Table */}
          <div className="border border-[#E4DFD3] rounded-lg overflow-hidden">
            <div className="bg-[#F3EFE6] px-4 py-3 border-b border-[#E4DFD3] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0B3D3A] uppercase tracking-wide">
                Required Environment Keys
              </span>
              <span className="text-xs text-[#526360]">
                Values are kept strictly secret and never shown
              </span>
            </div>
            <div className="divide-y divide-[#E4DFD3] bg-white">
              {status.variables.map((item) => {
                const isFound = item.status === 'Found';
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-4 py-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular text-[#142321] font-medium">
                        {item.name}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isFound
                          ? 'bg-[#E6F4F1] text-[#0B3D3A] border border-[#7FD1BF]'
                          : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                      }`}
                    >
                      {isFound ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#17806D]" />
                          <span>Found</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
                          <span>Missing</span>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How to Fix in GitHub Pages */}
          <div className="bg-[#FAF8F4] border border-[#E4DFD3] rounded-lg p-5 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0B3D3A] flex items-center gap-1.5">
              <span>How to configure for GitHub Pages</span>
            </h2>
            <ol className="text-xs text-[#364946] space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                In your GitHub repository, open <strong>Settings &rarr; Secrets and variables &rarr; Actions</strong>.
              </li>
              <li>
                Under <strong>Repository secrets</strong>, click <strong>New repository secret</strong> and add the missing variables shown above (values from your Firebase Console <em>Project Settings &rarr; General &rarr; Your apps</em>).
              </li>
              <li>
                In Firebase Console, go to <strong>Authentication &rarr; Settings &rarr; Authorized domains</strong> and add:
                <code className="ml-1.5 px-1.5 py-0.5 bg-white border border-[#E4DFD3] rounded font-mono-tabular text-[#0B3D3A]">
                  {status.currentOrigin || 'ghoshayush3678-dotcom.github.io'}
                </code>
              </li>
              <li>
                Re-run the GitHub Actions deployment workflow (or push a commit to <code className="px-1 py-0.5 bg-white border border-[#E4DFD3] rounded font-mono-tabular">main</code>).
              </li>
            </ol>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={onExploreDemo}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#0B3D3A] text-[#FAF8F4] text-sm font-medium hover:bg-[#17806D] transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-[#7FD1BF]" />
              <span>Explore Demo Workspace (Sample Data)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[#C8C2B4] text-[#142321] text-sm font-medium bg-white hover:bg-[#F3EFE6] transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking...' : 'Re-check Environment'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto pt-6 border-t border-[#E4DFD3] text-center text-xs text-[#526360]">
        Nirnay Sutra (निर्णय सूत्र) · Brand Governance &amp; Citation Engine · Free-tier Static Build
      </footer>
    </div>
  );
};

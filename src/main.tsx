import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { getFirebaseSetupStatus, FirebaseSetupStatus } from './utils/firebaseClient';
import { StartupCheck } from './components/StartupCheck';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Sanitize any potential secret or raw URL
    const msg = error?.message ? String(error.message).slice(0, 150) : 'Unexpected application error';
    return { hasError: true, errorMessage: msg };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Nirnay Sutra Runtime Error]:', error?.message || 'Unknown', info.componentStack?.slice(0, 200));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="min-h-screen bg-[#FAF8F4] text-[#142321] flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full bg-white border border-[#E4DFD3] rounded-xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FEF3C7] text-[#B45309] flex items-center justify-center border border-[#FDE68A]">
              <span className="font-serif-display text-xl font-bold">!</span>
            </div>
            <h1 className="font-serif-display text-2xl font-semibold text-[#0B3D3A]">
              Nirnay Sutra (निर्णय सूत्र)
            </h1>
            <p className="text-sm font-medium text-[#142321]">
              Application Error
            </p>
            <p className="text-xs text-[#526360] leading-relaxed">
              An unexpected error occurred while rendering the page. Your stored guidelines, content, and audit history remain safe.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="w-full px-5 py-2.5 rounded-lg bg-[#0B3D3A] text-[#FAF8F4] text-sm font-medium hover:bg-[#17806D] transition-colors cursor-pointer"
              >
                Reload Nirnay Sutra
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('nirnay_sutra_user_profile');
                    localStorage.removeItem('nirnay_sutra_workspaces');
                    localStorage.removeItem('nirnay_sutra_members');
                  } catch {
                    // ignore storage errors
                  }
                  window.location.reload();
                }}
                className="w-full px-4 py-2 rounded-lg border border-[#E4DFD3] text-xs font-medium text-[#526360] hover:text-[#0B3D3A] hover:bg-[#FAF8F4] transition-colors cursor-pointer"
              >
                Reset Session &amp; Restart
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RootApp() {
  const [setupStatus, setSetupStatus] = useState<FirebaseSetupStatus>(() =>
    getFirebaseSetupStatus()
  );
  const [demoBypass, setDemoBypass] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('nirnay_demo_bypass') === 'true';
  });

  // If any required Firebase environment variable is missing AND the user hasn't explicitly chosen the demo workspace bypass, show the startup check screen
  if (!setupStatus.allPresent && !demoBypass) {
    return (
      <StartupCheck
        status={setupStatus}
        onExploreDemo={() => {
          sessionStorage.setItem('nirnay_demo_bypass', 'true');
          setDemoBypass(true);
        }}
      />
    );
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <RootApp />
  </RootErrorBoundary>
);

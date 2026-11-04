import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
}

class RootErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {hasError: true};
  }

  componentDidCatch() {
    try {
      localStorage.removeItem('nirnay_sutra_library_v2');
      localStorage.removeItem('nirnay_sutra_items_v2');
      localStorage.removeItem('nirnay_sutra_logs_v2');
    } catch {
      // ignore storage errors
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F4] text-[#142321] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E4DFD3] rounded-xl p-8 text-center space-y-4 shadow-sm">
            <h1 className="font-serif-display text-2xl font-semibold text-[#0B3D3A]">
              Nirnay Sutra (निर्णय सूत्र)
            </h1>
            <p className="text-sm text-[#526360]">
              Workspace state was refreshed to the latest version. Click below to continue.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({hasError: false});
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-lg bg-[#0B3D3A] text-[#FAF8F4] text-sm font-medium hover:bg-[#17806D] transition-colors cursor-pointer"
            >
              Reload Nirnay Sutra
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);

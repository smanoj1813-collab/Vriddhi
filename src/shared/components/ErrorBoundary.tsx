// src/shared/components/ErrorBoundary.tsx
//
// App-wide React error boundary. Per-route boundaries (faculty/admin) already
// exist, but student, superadmin, the layouts and the auth shell had none — a
// render throw there produced a blank white screen with no way back. This wraps
// the whole app in main.tsx so any uncaught render error shows a recoverable
// screen (reload / go home) instead of a white page.
//
// It intentionally does NOT log to any external service — wire that up in
// componentDidCatch when an error-reporting provider is adopted.

import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback; defaults to the built-in recoverable screen. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Console only. Swap for Sentry/etc. when available.
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ opacity: 0.7, marginBottom: 16 }}>
            An unexpected error occurred while displaying this page. You can reload, or head back
            to your dashboard.
          </p>
          {this.state.error?.message && (
            <pre
              style={{
                textAlign: 'left',
                fontSize: 12,
                opacity: 0.6,
                background: 'rgba(127,127,127,0.12)',
                padding: 12,
                borderRadius: 8,
                overflowX: 'auto',
                marginBottom: 16,
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                border: '1px solid rgba(127,127,127,0.4)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
            <button
              onClick={this.handleHome}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                border: 'none',
                background: '#0d9488',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}

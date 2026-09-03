// ============================================================
// OneFlesh — React Error Boundary
// ============================================================

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      return (
        <div
          className="min-h-screen flex items-center justify-center px-6"
          style={{ background: '#fdf9f7' }}
        >
          <div className="text-center max-w-[400px]">
            {/* Logo */}
            <div
              className="font-display text-[28px] mb-8"
              style={{ color: '#2C0F12' }}
            >
              One<em className="font-light italic">Flesh</em>
            </div>

            {/* Icon */}
            <div
              className="text-[42px] mb-4"
              style={{ color: 'rgba(107,30,35,0.25)' }}
            >
              ✦
            </div>

            <h2
              className="font-display text-[22px] font-light mb-2"
              style={{ color: '#2C0F12' }}
            >
              Something went wrong
            </h2>

            <p
              className="text-[13px] font-light mb-8 leading-relaxed"
              style={{ color: '#9a6060' }}
            >
              An unexpected error occurred. Please reload the page or go back to
              continue.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-6 py-2.5 rounded-full text-[11px] font-light tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: '#2C0F12',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 18px rgba(44,15,18,0.45)',
                }}
              >
                Reload Page
              </button>

              <button
                onClick={() => { window.location.href = '/'; }}
                className="px-6 py-2.5 rounded-full text-[11px] font-light tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'transparent',
                  color: '#6B1E23',
                  border: '1px solid rgba(107,30,35,0.25)',
                }}
              >
                Go Home
              </button>
            </div>

            {/* Dev-only error detail */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left">
                <summary
                  className="text-[11px] cursor-pointer"
                  style={{ color: '#9a6060' }}
                >
                  Error details (dev only)
                </summary>
                <pre
                  className="mt-2 text-[10px] p-3 rounded-lg overflow-auto"
                  style={{
                    background: 'rgba(107,30,35,0.06)',
                    color: '#4a1a1e',
                    border: '1px solid rgba(107,30,35,0.12)',
                    maxHeight: '200px',
                  }}
                >
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

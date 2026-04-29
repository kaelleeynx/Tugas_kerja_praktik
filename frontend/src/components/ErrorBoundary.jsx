import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-center min-h-screen p-4"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          <div
            className="w-full max-w-md p-8 rounded-[var(--radius-card)] text-center"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            {/* Icon */}
            <div
              className="w-14 h-14 rounded-[var(--radius-card)] flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h1 className="text-lg font-bold mb-2" style={{ color: 'var(--text-main)' }}>
              Terjadi Kesalahan
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Terjadi kesalahan yang tidak terduga. Coba muat ulang halaman.
            </p>

            {/* Dev error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                className="text-left p-3 rounded-[var(--radius-default)] mb-5 text-xs"
                style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-subtle)' }}
              >
                <summary
                  className="cursor-pointer font-semibold mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Detail Error (dev only)
                </summary>
                <pre
                  className="overflow-auto font-mono"
                  style={{ color: 'var(--status-danger)' }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className="h-10 px-6 text-sm font-bold rounded-[var(--radius-default)]
                transition-colors text-white"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

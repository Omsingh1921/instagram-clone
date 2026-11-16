import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '2rem',
            color: 'var(--text-primary, #ffffff)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', fontWeight: 600 }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text-secondary, #8e8e8e)', marginBottom: '1.5rem', maxWidth: '420px', fontSize: '0.95rem' }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: '0.6rem 1.4rem',
              backgroundColor: '#0095f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

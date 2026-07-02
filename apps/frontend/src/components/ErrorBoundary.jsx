import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="glass-panel rounded-xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-error-container/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            </div>
            <h2 className="font-headline text-xl text-white mb-2">Something went wrong</h2>
            <p className="font-mono text-xs text-on-surface-variant mb-6">An unexpected error occurred. Please try refreshing the page.</p>
            <button onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-background font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-all neon-glow">
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

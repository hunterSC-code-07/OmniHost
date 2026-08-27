import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our centralized logging system
    if (window.api?.log?.error) {
      window.api.log.error('React ErrorBoundary caught an error:', error, errorInfo.componentStack);
    } else {
      console.error('Uncaught error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#050505] text-white">
          <div className="max-w-xl w-full bg-surface/50 border border-outline-variant/30 rounded-2xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-6">
              <span className="material-symbols-outlined text-red-400 text-3xl">error</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-on-surface-variant mb-6">
              A critical error occurred while rendering this component. The issue has been automatically logged.
            </p>
            
            <div className="w-full bg-surface-container-lowest/50 rounded-lg p-4 border border-outline-variant/30 text-left overflow-auto max-h-40 mb-8 custom-scrollbar">
              <code className="text-xs font-mono text-red-300 whitespace-pre-wrap break-words">
                {this.state.error?.message || 'Unknown error'}
              </code>
            </div>

            <div className="flex gap-4">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 rounded-lg font-bold bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 rounded-lg font-bold bg-surface-bright/50 hover:bg-surface-bright text-white transition-colors"
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

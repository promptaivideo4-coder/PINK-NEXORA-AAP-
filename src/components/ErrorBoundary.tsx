import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '';
    window.location.reload();
  };

  private handleClearData = () => {
    if (window.confirm('This will reset cached app preferences to fix layout issues. Continue?')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
      window.location.href = window.location.origin;
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#121212] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
            An unexpectedly unhandled error occurred. You can attempt to refresh the view or reset local cache.
          </p>

          {this.state.error && (
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-8 text-left overflow-auto max-h-40">
              <p className="text-xs font-mono text-rose-400 font-semibold mb-1">
                {this.state.error.name}: {this.state.error.message}
              </p>
              {this.state.error.stack && (
                <p className="text-[10px] font-mono text-slate-500 whitespace-pre-wrap leading-tight">
                  {this.state.error.stack.slice(0, 300)}...
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              onClick={this.handleReset}
              className="flex-1 bg-[#e6007e] text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload App</span>
            </button>

            <button
              onClick={this.handleClearData}
              className="flex-1 bg-slate-800 text-slate-300 hover:text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Reset Cache</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

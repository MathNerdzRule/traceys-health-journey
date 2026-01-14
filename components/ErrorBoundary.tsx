import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
        if (this.props.fallback) return this.props.fallback;
        
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-6 text-center">
                <div className="max-w-md">
                    <h1 className="text-3xl font-bold text-brand-danger mb-4">Something went wrong.</h1>
                    <p className="mb-4 text-brand-text-secondary dark:text-gray-400">
                        We're sorry, but an unexpected error has occurred.
                    </p>
                    <details className="text-left bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto mb-6 text-xs font-mono">
                        {this.state.error && this.state.error.toString()}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition"
                    >
                        Reload App
                    </button>
                </div>
            </div>
        );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

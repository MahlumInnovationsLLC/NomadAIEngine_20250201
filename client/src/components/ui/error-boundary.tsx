import React, { Component, ErrorInfo, ReactNode, ReactElement, JSXElementConstructor } from 'react';

interface FallbackProps {
  error: Error;
}

type FallbackFunction = (props: FallbackProps) => ReactElement<any, string | JSXElementConstructor<any>>;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | FallbackFunction;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by ErrorBoundary:", error);
    console.error("Component stack:", errorInfo.componentStack);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function' && this.state.error) {
          return this.props.fallback({ error: this.state.error });
        }
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-700">
          <h3 className="font-bold">Something went wrong</h3>
          <p className="mt-2 text-sm">{this.state.error?.message || 'An unknown error occurred'}</p>
          <button
            className="mt-3 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded-md"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    // When there's no error, render children
    return this.props.children;
  }
}

export { ErrorBoundary };
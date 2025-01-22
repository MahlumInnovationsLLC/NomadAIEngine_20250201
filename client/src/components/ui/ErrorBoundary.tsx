import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card className="w-full max-w-md mx-auto mt-4">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-destructive">
                <FontAwesomeIcon icon="circle-exclamation" className="h-5 w-5" />
                <h3 className="font-semibold">Something went wrong</h3>
              </div>
              {this.state.error && (
                <div className="text-sm text-muted-foreground">
                  <p>{this.state.error.message}</p>
                </div>
              )}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <pre className="mt-2 text-xs bg-muted p-4 rounded-md overflow-auto">
                  <code>{this.state.errorInfo.componentStack}</code>
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
/**
 * AuthErrorBoundary Component
 * React Error Boundary for catching and handling authentication errors gracefully
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * Error Boundary for Authentication Components
 *
 * Catches React rendering errors in auth flows and provides graceful fallback UI
 *
 * Usage:
 * ```tsx
 * <AuthErrorBoundary
 *   onError={(error, errorInfo) => {
 *     // Log to monitoring service
 *   }}
 * >
 *   <Login />
 * </AuthErrorBoundary>
 * ```
 */
export class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for support tracking
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with emoji prefix for visibility
    console.error('❌ [AuthErrorBoundary] React error caught:', error);
    console.error('📊 [AuthErrorBoundary] Error info:', errorInfo);

    // Log to monitoring service (e.g., Sentry, LogRocket)
    this.logErrorToService(error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    this.setState({ errorInfo });
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // Send to error tracking service
    console.log('📊 [AuthErrorBoundary] Logging error:', {
      errorId: this.state.errorId,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // TODO: Integrate with monitoring service (Sentry, etc.)
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  private handleReset = () => {
    // Clear error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    // Navigate to login for fresh state
    window.location.href = '/login';
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-b from-primary to-secondary flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Something Went Wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                We encountered an unexpected error. Please try again or contact support if the problem persists.
              </p>

              {/* Error ID for support */}
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-xs text-gray-500 text-center">
                  Error ID:{' '}
                  <code className="font-mono text-gray-700">
                    {this.state.errorId}
                  </code>
                </p>
              </div>

              {/* Development mode: show error details */}
              {import.meta.env.DEV && this.state.error && (
                <details className="bg-red-50 p-3 rounded-md">
                  <summary className="text-xs font-medium text-red-700 cursor-pointer">
                    Technical Details (Dev Mode)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <pre className="text-xs text-red-600 overflow-auto whitespace-pre-wrap">
                      {this.state.error.message}
                    </pre>
                    {this.state.error.stack && (
                      <pre className="text-xs text-gray-600 overflow-auto whitespace-pre-wrap max-h-40">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col space-y-2">
                <Button onClick={this.handleReset} className="w-full">
                  Return to Login
                </Button>
                <Button
                  variant="outline"
                  onClick={this.handleRefresh}
                  className="w-full"
                >
                  Refresh Page
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Need help?{' '}
                <a
                  href="mailto:support@bda-global.org"
                  className="text-blue-600 hover:underline"
                >
                  Contact Support
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with error boundary
 */
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <AuthErrorBoundary onError={onError}>
        <Component {...props} />
      </AuthErrorBoundary>
    );
  };
}

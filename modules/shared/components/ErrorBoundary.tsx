'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  moduleName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error details for monitoring
    this.logErrorToMonitoring(error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  logErrorToMonitoring(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for monitoring/analytics
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      moduleName: this.props.moduleName || 'unknown',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    };

    // In production, this would send to a monitoring service (e.g., Sentry, LogRocket)
    console.error('[ErrorBoundary] Error details:', errorDetails);

    // TODO: Integrate with monitoring service
    // Example: Sentry.captureException(error, { contexts: { errorDetails } });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-light">
                <AlertCircle
                  className="h-6 w-6 text-danger-main"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Algo deu errado
                </h2>
                <p className="text-sm text-gray-600">
                  Ocorreu um erro inesperado
                </p>
              </div>
            </div>

            {this.state.error && process.env.NODE_ENV === 'development' && (
              <div className="mb-4 rounded-md bg-gray-50 p-3">
                <p className="text-xs font-mono text-gray-700 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleReset}
                className="w-full rounded-lg bg-primary-500 px-4 py-2 text-base font-medium text-white transition-colors duration-200 hover:bg-primary-600"
              >
                Tentar novamente
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50"
              >
                Voltar para o início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

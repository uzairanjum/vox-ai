'use client';

import React from 'react';
import { ErrorBoundary as ErrorUI } from './ErrorBoundary';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundaryWrapper extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <ErrorUI
          error={this.state.error || new Error('An unexpected error occurred')}
          reset={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}

// Usage example:
/*
export default function App() {
  return (
    <ErrorBoundaryWrapper>
      <YourComponent />
    </ErrorBoundaryWrapper>
  );
}
*/
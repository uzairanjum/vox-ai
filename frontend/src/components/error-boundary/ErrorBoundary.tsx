'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  children?: React.ReactNode;
}

export function ErrorBoundary({ error, reset, children }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Error:', error);
  }, [error]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 p-6 max-w-md mx-auto">
          <div className="text-destructive mb-4 text-5xl">
            <span role="img" aria-label="error">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Something went wrong!</h2>
          <p className="text-muted-foreground text-sm">
            {process.env.NODE_ENV === 'development' 
              ? error.message 
              : 'An unexpected error occurred. Our team has been notified.'}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-2">
              Error ID: {error.digest}
            </p>
          )}
          <div className="pt-4">
            <Button 
              onClick={reset}
              variant="default"
              className="min-w-[120px]"
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
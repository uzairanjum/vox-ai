'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  text?: string;
}

const sizeMap = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4', 
  lg: 'h-6 w-6',
  xl: 'h-8 w-8'
};

export function LoadingSpinner({ 
  className,
  size = 'md',
  fullScreen = false,
  text
}: LoadingSpinnerProps) {
  const containerClasses = cn(
    'flex items-center justify-center',
    {
      'min-h-[40vh]': !fullScreen,
      'fixed inset-0 bg-background/80 backdrop-blur-sm z-50': fullScreen
    }
  );

  const spinnerClasses = cn(
    'animate-spin text-primary',
    sizeMap[size],
    className
  );

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={spinnerClasses} />
        {text && (
          <p className="text-sm text-muted-foreground">{text}</p>
        )}
      </div>
    </div>
  );
}

// Inline loader for buttons and small spaces
export function InlineLoader({ size = 'sm', className }: { size?: 'sm' | 'md'; className?: string }) {
  return <Loader2 className={cn('animate-spin', sizeMap[size], className)} />;
}

// Route loading - simple and clean
export function RouteLoading() {
  return <LoadingSpinner size="lg" fullScreen />;
}

// Example usage in a layout or page:
/*
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  );
}
*/
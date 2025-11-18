'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthProps {
  isProtected?: boolean;
}

export function withAuthentication<T extends AuthProps>(
  WrappedComponent: React.ComponentType<T>
) {
  return function WithAuthenticationComponent(props: Omit<T, keyof AuthProps>) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      async function checkAuth() {
        try {
          // Add your authentication check logic here
          // Example: Check session, tokens, etc.
          const session = await fetch('/api/auth/session');
          const isValid = await session.json();

          if (!isValid) {
            router.push('/auth/login');
            return;
          }

          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          router.push('/auth/login');
        } finally {
          setIsLoading(false);
        }
      }

      checkAuth();
    }, [router]);

    if (isLoading) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Router will handle the redirect
    }

    return <WrappedComponent {...(props as T)} />;
  };
}

// Usage example:
// const ProtectedComponent = withAuthentication(YourComponent);
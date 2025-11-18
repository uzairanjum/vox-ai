'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import NextTopLoader from 'nextjs-toploader';

import { ThemeWrapper } from '../providers/theme-wrapper';
import { ErrorBoundaryWrapper } from '@/components/error-boundary/ErrorBoundaryWrapper';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';
import { ThemeProvider } from './ThemeProvider';
import { ToasterProvider } from './ToasterProvider';
import Navbar from '../nav/Navbar';
import Footer from '../nav/Footer';
import { UI_CONSTANTS, APP_CONSTANTS } from '@/constants/app';

interface LayoutProps {
  children: React.ReactNode;
}

function LoadingFallback() {
  return <LoadingSpinner fullScreen />;
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryWrapper>
      <ThemeWrapper>
        {children}
      </ThemeWrapper>
    </ErrorBoundaryWrapper>
  );
}

function ConditionalNavbar() {
  const pathname = usePathname();
  const [showNavbar, setShowNavbar] = useState(true);

  useEffect(() => {
    // Hide main navbar on dashboard pages (they have their own header)
    if (pathname && pathname.startsWith('/dashboard')) {
      setShowNavbar(false);
    } else {
      setShowNavbar(true);
    }
  }, [pathname]);

  if (!showNavbar) return null;

  return (
    <SuspenseWrapper>
      <Navbar />
    </SuspenseWrapper>
  );
}

export default function ClientLayout({ children }: LayoutProps) {
  return (
    <ThemeProvider>
      <body className="min-h-screen antialiased scroll-smooth bg-background text-foreground">
        <Providers>
          <NextTopLoader
            color={UI_CONSTANTS.loader.color}
            height={UI_CONSTANTS.loader.height}
            showSpinner={UI_CONSTANTS.loader.showSpinner}
          />
          
          <ConditionalNavbar />
          
          <main className="min-h-screen min-w-full mx-auto">
            <SuspenseWrapper>
              {children}
            </SuspenseWrapper>
          </main>

          <SuspenseWrapper>
            <Footer />
          </SuspenseWrapper>

          <ToasterProvider />
        </Providers>
      </body>
    </ThemeProvider>
  );
}

// Force dynamic rendering for the entire app
export const dynamic = 'force-dynamic';

// Metadata
export const metadata = {
  title: APP_CONSTANTS.name,
  description: APP_CONSTANTS.description,
  // icons: {
  //   icon: [{ url: '/brand_c2.ico' }],
  // },
};

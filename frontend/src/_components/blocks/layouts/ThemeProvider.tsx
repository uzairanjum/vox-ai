'use client';

import { useTheme } from '@/hooks';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useTheme();

  return (
    <html lang="en" suppressHydrationWarning className={theme}>
      {children}
    </html>
  );
}
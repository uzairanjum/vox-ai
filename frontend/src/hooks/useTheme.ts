'use client';

import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export interface UseThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export function useTheme(defaultTheme: Theme = 'system'): UseThemeReturn {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Set initial value
    updateSystemTheme(mediaQuery);

    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateSystemTheme);
      return () => mediaQuery.removeEventListener('change', updateSystemTheme);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(updateSystemTheme);
      return () => mediaQuery.removeListener(updateSystemTheme);
    }
  }, []);

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Compute whether dark mode should be active
  const isDark = theme === 'system' ? systemTheme === 'dark' : theme === 'dark';

  // Update document class and save theme when it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', isDark);
  }, [theme, isDark]);

  const toggleTheme = () => {
    setTheme(current => {
      if (current === 'dark') return 'light';
      if (current === 'light') return 'system';
      return 'dark';
    });
  };

  return {
    theme,
    setTheme,
    isDark,
    toggleTheme,
  };
}
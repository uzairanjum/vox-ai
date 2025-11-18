'use client';

import { Toaster } from '@/components/ui/sonner';
import { useTheme } from '@/hooks';
import { UI_CONSTANTS } from '@/constants/app';

export function ToasterProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      position={UI_CONSTANTS.toaster.position}
      richColors={UI_CONSTANTS.toaster.richColors}
      closeButton={UI_CONSTANTS.toaster.closeButton}
      duration={UI_CONSTANTS.toaster.duration}
      theme={theme === 'system' ? 'system' : theme}
    />
  );
}
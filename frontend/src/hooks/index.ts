import { useAsync, type UseAsyncOptions } from './useAsync';
import { useLoading } from './useLoading';
import { useTheme, type Theme, type UseThemeReturn } from './useTheme';

// Export hooks
export { useAsync } from './useAsync';
export { useLoading } from './useLoading';
export { useTheme } from './useTheme';

// Export types
export type { UseAsyncOptions } from './useAsync';
export type { Theme, UseThemeReturn } from './useTheme';

// Helper types
export interface AsyncActionProps<T = void> {
  isLoading: boolean;
  error: Error | null;
  execute: () => Promise<T>;
}

// Combined hooks
export function useAsyncWithLoading<T>(options?: UseAsyncOptions) {
  const { isLoading: asyncLoading, ...asyncProps } = useAsync<T>(options);
  const { isLoading: manualLoading, ...loadingProps } = useLoading();

  return {
    ...asyncProps,
    ...loadingProps,
    isLoading: asyncLoading || manualLoading,
  };
}

/*
Usage examples:

1. Basic theme usage:
```typescript
function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme} (isDark: {isDark ? 'yes' : 'no'})
    </button>
  );
}
```

2. Async operation with loading state:
```typescript
function UserProfile() {
  const { execute, isLoading, error, data } = useAsyncWithLoading<User>({
    showErrorToast: true,
  });

  useEffect(() => {
    execute(() => api.get('/api/user'));
  }, [execute]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;

  return <div>{data.name}</div>;
}
```

3. Manual loading state:
```typescript
function LoadingButton() {
  const { isLoading, withLoading } = useLoading();
  
  const handleClick = () => {
    withLoading(async () => {
      await someAsyncOperation();
    });
  };

  return (
    <button disabled={isLoading} onClick={handleClick}>
      {isLoading ? 'Loading...' : 'Click me'}
    </button>
  );
}
```
*/
'use client';

import { useState, useCallback } from 'react';
import { AppError } from '@/lib/error-handling';
import { toast } from 'sonner';

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: AppError | null;
}

export interface UseAsyncOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: AppError) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useAsync<T = unknown>(options: UseAsyncOptions = {}) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      error: null,
    }));
  }, []);

  const setError = useCallback((error: AppError) => {
    setState(prev => ({
      ...prev,
      error,
      data: null,
    }));
  }, []);

  const execute = useCallback(
    async (asyncFunction: () => Promise<T>): Promise<T | null> => {
      try {
        setState(prev => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        const data = await asyncFunction();
        
        setData(data);
        
        if (options.showSuccessToast) {
          toast.success('Operation completed successfully');
        }
        
        options.onSuccess?.(data);
        
        return data;
      } catch (error) {
        const appError = error instanceof AppError
          ? error
          : new AppError(
              'An unexpected error occurred',
              'UNKNOWN_ERROR',
              500,
              { originalError: error }
            );

        setError(appError);
        
        if (options.showErrorToast) {
          toast.error(appError.message);
        }
        
        options.onError?.(appError);
        
        return null;
      } finally {
        setState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    },
    [options, setData, setError]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  };
}
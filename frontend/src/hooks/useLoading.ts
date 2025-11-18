'use client';

import { useState, useCallback } from 'react';

interface UseLoadingReturn {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  toggleLoading: () => void;
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
}

export function useLoading(initialState = false): UseLoadingReturn {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const toggleLoading = useCallback(() => {
    setIsLoading(prev => !prev);
  }, []);

  const withLoading = useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    try {
      startLoading();
      const result = await promise;
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    withLoading,
  };
}

// Example usage:
/*
function Component() {
  const { isLoading, withLoading } = useLoading();

  const handleSubmit = async () => {
    try {
      await withLoading(submitData());
      toast.success('Successfully submitted!');
    } catch (error) {
      toast.error('Failed to submit');
    }
  };

  return (
    <button disabled={isLoading} onClick={handleSubmit}>
      {isLoading ? 'Loading...' : 'Submit'}
    </button>
  );
}
*/
import { z } from 'zod';
import { validateData, apiResponseSchema, AppError } from './error-handling';

interface FetchOptions extends RequestInit {
  validateResponse?: boolean;
}

const DEFAULT_OPTIONS: FetchOptions = {
  validateResponse: true,
};

async function fetchWithTimeout(
  resource: RequestInfo | URL,
  options: FetchOptions = {}
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: FetchOptions = DEFAULT_OPTIONS
): Promise<T> {
  try {
    const response = await fetchWithTimeout(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new AppError(
        data.message || 'API request failed',
        data.code || 'API_ERROR',
        response.status,
        data
      );
    }

    if (options.validateResponse) {
      // Validate the API response structure
      const validatedResponse = validateData(apiResponseSchema, data);
      // If you have a specific schema for T, you can validate the data property here
      return validatedResponse.data as T;
    }

    return data as T;
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new AppError(
        'Network request failed',
        'NETWORK_ERROR',
        503
      );
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AppError(
        'Request timeout',
        'TIMEOUT_ERROR',
        504
      );
    }

    throw new AppError(
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      500
    );
  }
}

// Type-safe API endpoints
export const api = {
  async get<T>(endpoint: string, options?: FetchOptions) {
    return apiRequest<T>(endpoint, { ...options, method: 'GET' });
  },

  async post<T>(endpoint: string, data: unknown, options?: FetchOptions) {
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async put<T>(endpoint: string, data: unknown, options?: FetchOptions) {
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete<T>(endpoint: string, options?: FetchOptions) {
    return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

// Example usage with Next.js App Router:
/*
// In a Server Component:
async function getData() {
  try {
    const data = await api.get<UserData>('/api/users');
    return data;
  } catch (error) {
    // Error will be automatically handled by Next.js error boundary
    throw error;
  }
}

// In a Client Component:
'use client';

async function submitData(formData: FormData) {
  try {
    const response = await api.post<SubmissionResponse>(
      '/api/submit',
      formData
    );
    return response;
  } catch (error) {
    if (error instanceof AppError) {
      toast.error(error.message);
    }
    throw error;
  }
}
*/
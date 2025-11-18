import { GhlError } from "./types";

export function createGhlError(error: unknown): GhlError {
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      details: {
        stack: error.stack
      }
    };
  }

  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN_ERROR',
      message: error
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    details: { error }
  };
}

export function isGhlError(error: unknown): error is GhlError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

// Parse GHL API error responses
export function parseGhlApiError(response: Response): Promise<GhlError> {
  return response.json().then(
    (data) => ({
      code: data.code || `HTTP_${response.status}`,
      message: data.message || response.statusText,
      details: data.details || undefined
    }),
    () => ({
      code: `HTTP_${response.status}`,
      message: response.statusText,
    })
  );
}

// Common error messages
export const GHL_ERROR_MESSAGES = {
  INVALID_TOKEN: 'Invalid or expired access token',
  LOCATION_NOT_FOUND: 'Location not found',
  UNAUTHORIZED: 'Unauthorized access',
  RATE_LIMIT: 'Rate limit exceeded',
  NETWORK_ERROR: 'Network error occurred',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Server error occurred',
} as const;

// Helper to check if a response was successful
export function isSuccessResponse<T>(response: { data?: T; error?: string }): response is { data: T } {
  return !response.error && response.data !== undefined;
}
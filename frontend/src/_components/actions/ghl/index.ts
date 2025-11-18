// Import utility functions first to use in createGhlAction
import { createGhlError } from './utils';
import { getGhlTokens, isValidTokens } from './tokens';

// Export all types
export * from './types';

// Export token-related functionality
export {
  type GhlTokens,
  getGhlTokens,
  refreshGhlTokens,
  isValidTokens
} from './tokens';

// Export profile-related functionality
export {
  type GhlProfile,
  type GhlProfileResponse,
  getGhlProfile,
  updateGhlProfile,
  isValidProfileResponse
} from './profile';

// Export contact-related functionality
export {
  getGhlContacts,
  getGhlContact,
  updateGhlContact,
  createGhlContact
} from './contacts';

// Export utility functions
export {
  createGhlError,
  isGhlError,
  parseGhlApiError,
  GHL_ERROR_MESSAGES,
  isSuccessResponse
} from './utils';

// Common action creator for GHL API calls
export async function createGhlAction<T>(
  locationId: string,
  action: (token: string) => Promise<T>
): Promise<{ data?: T; error?: string }> {
  try {
    const tokens = await getGhlTokens(locationId);
    if (!isValidTokens(tokens)) {
      throw new Error('Invalid tokens');
    }

    const data = await action(tokens.accessToken!);
    return { data };
  } catch (error) {
    const ghlError = createGhlError(error);
    return { error: ghlError.message };
  }
}

// Re-export commonly used types with GHL prefix
export type {
  GhlActionResponse,
  GhlLocation,
  GhlContact,
  GhlMessage,
  GhlError,
  MessageType,
  PaginationParams,
  PaginatedResponse,
  GhlWebhook
} from './types';

// Constants and configuration
export const GHL_API_VERSION = '2021-04-15';
export const GHL_DEFAULT_PAGINATION = {
  limit: 20,
  page: 1
} as const;
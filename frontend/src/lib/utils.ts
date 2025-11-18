import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates if a string is a valid UUID (version 4)
 * @param uuid - The string to validate
 * @returns boolean - True if valid UUID, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates and returns a UUID, throwing an error if invalid
 * @param uuid - The UUID string to validate
 * @param fieldName - Name of the field for error messages
 * @returns string - The validated UUID
 * @throws Error if UUID is invalid
 */
export function validateUUID(uuid: string, fieldName: string = 'ID'): string {
  if (!uuid || typeof uuid !== 'string') {
    throw new Error(`${fieldName} is required and must be a string`);
  }
  
  if (!isValidUUID(uuid)) {
    throw new Error(`${fieldName} must be a valid UUID format. Received: "${uuid}"`);
  }
  
  return uuid;
}

/**
 * Safely validates a UUID and returns null if invalid
 * @param uuid - The UUID string to validate
 * @returns string | null - The UUID if valid, null if invalid
 */
export function safeValidateUUID(uuid: string): string | null {
  try {
    return validateUUID(uuid);
  } catch {
    return null;
  }
}

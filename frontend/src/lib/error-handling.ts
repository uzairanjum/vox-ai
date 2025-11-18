import { z } from 'zod';

// Custom error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details: z.ZodError) {
    super(message, 'VALIDATION_ERROR', 400, {
      validation: details.flatten()
    });
    this.name = 'ValidationError';
  }
}

// Error handlers
export const handleApiError = (error: unknown) => {
  if (error instanceof ValidationError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        details: error.details.flatten(),
      },
      status: 400,
    };
  }

  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        metadata: error.metadata,
      },
      status: error.statusCode,
    };
  }

  // Unexpected errors
  console.error('Unexpected error:', error);
  return {
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
    },
    status: 500,
  };
};

// Validation schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['user', 'admin']),
});

export const apiResponseSchema = z.object({
  data: z.unknown(),
  status: z.number(),
  message: z.string().optional(),
});

// Type-safe validation function
export const validateData = <T>(schema: z.Schema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error);
    }
    throw error;
  }
};

// Usage example:
/*
try {
  const data = await fetchUserData();
  const validatedUser = validateData(userSchema, data);
  // TypeScript now knows validatedUser is of type User
} catch (error) {
  const { error: errorResponse, status } = handleApiError(error);
  // Handle error appropriately
}
*/
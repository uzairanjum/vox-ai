import { z } from 'zod';

// App-wide constants
export const APP_CONSTANTS = {
  name: 'VOX Live Chat Portal',
  version: '1.0.0',
  description: 'Manage your chat transcripts - VOX and Zendesk',
  copyright: `© ${new Date().getFullYear()} VOX. All rights reserved.`,
} as const;

// UI Constants
export const UI_CONSTANTS = {
  loader: {
    color: '#F03E6A',
    height: 3, // NextTopLoader expects a number
    showSpinner: true,
  },
  toaster: {
    position: 'top-right' as const,
    duration: 5000,
    richColors: true,
    closeButton: true,
  },
  navigation: {
    mobileBreakpoint: 768,
  },
} as const;

// API Constants
export const API_CONSTANTS = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  timeout: 8000,
  retryAttempts: 3,
  endpoints: {
    auth: '/auth',
    users: '/users',
    chat: '/chat',
    transcripts: '/transcripts',
  },
} as const;

// Validation Schemas
export const ValidationSchemas = {
  chat: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    message: z.string().min(1),
    timestamp: z.string().datetime(),
  }),
  transcript: z.object({
    id: z.string().uuid(),
    chatId: z.string().uuid(),
    content: z.string(),
    createdAt: z.string().datetime(),
  }),
} as const;

// Route Constants
export const ROUTES = {
  public: {
    home: '/',
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
  },
  protected: {
    dashboard: '/dashboard',
    profile: '/profile',
    chat: '/chat',
    transcripts: '/transcripts',
    settings: '/settings',
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  auth: {
    invalidCredentials: 'Invalid email or password',
    sessionExpired: 'Your session has expired. Please login again.',
    unauthorized: 'You are not authorized to access this resource',
  },
  validation: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    passwordMin: 'Password must be at least 8 characters',
    passwordMatch: 'Passwords do not match',
  },
  api: {
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    timeout: 'Request timeout. Please try again.',
  },
} as const;

// Type definitions for autocompletion and type safety
export type AppConstants = typeof APP_CONSTANTS;
export type UIConstants = typeof UI_CONSTANTS;
export type ApiConstants = typeof API_CONSTANTS;
export type Routes = typeof ROUTES;
export type ErrorMessages = typeof ERROR_MESSAGES;

// Prevent runtime modifications
Object.freeze(APP_CONSTANTS);
Object.freeze(UI_CONSTANTS);
Object.freeze(API_CONSTANTS);
Object.freeze(ROUTES);
Object.freeze(ERROR_MESSAGES);
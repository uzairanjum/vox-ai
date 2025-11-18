import { z } from 'zod';

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']),
  
  // App configuration
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  
  // Authentication
  AUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Database
  DATABASE_URL: z.string().min(1),
  
  // External Services
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

// Runtime environment variables validation
const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Validate and extract environment variables
const env = envSchema.parse(processEnv);

// Application configuration
export const config = {
  environment: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  app: {
    name: 'VOX Live Chat Portal',
    version: '1.0.0',
    url: env.NEXT_PUBLIC_APP_URL,
    apiUrl: env.NEXT_PUBLIC_API_URL,
  },
  
  auth: {
    secret: env.AUTH_SECRET,
    url: env.NEXTAUTH_URL || env.NEXT_PUBLIC_APP_URL,
  },
  
  database: {
    url: env.DATABASE_URL,
  },
  
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // Feature flags
  features: {
    enableNewDashboard: true,
    enableBetaFeatures: env.NODE_ENV === 'development',
  },
  
  // API configuration
  api: {
    timeout: 8000, // 8 seconds
    retryAttempts: 3,
    baseHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
} as const;

// Type definitions
export type Config = typeof config;
export type Environment = Config['environment'];
export type FeatureFlags = Config['features'];

// Helper functions
export function getApiUrl(path: string): string {
  return `${config.app.apiUrl}${path}`;
}

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return config.features[feature];
}

// Prevent runtime configuration changes
Object.freeze(config);

export default config;

/*
Usage example:

import config from '@/config';

if (config.isDevelopment) {
  // Development-only code
}

const apiEndpoint = getApiUrl('/users');
const isNewDashboardEnabled = isFeatureEnabled('enableNewDashboard');
*/
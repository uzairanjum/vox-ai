# Database Schema Documentation

## Overview
The database schema consists of two main tables that handle user profiles and provider integrations:
1. `user_profile`: Stores core user information
2. `provider_data`: Stores provider-specific data (tokens, configurations, etc.)

## Tables

### user_profile
Main user profile table that links to Supabase auth.users.

**Fields:**
- `id` (UUID, PK): Primary identifier
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp
- `user_id_auth` (UUID): Foreign key to auth.users
- `user_name` (text): User's display name
- `providers` (text[]): Array of associated provider IDs

**Relationships:**
- Links to `auth.users` via `user_id_auth`
- Referenced by `provider_data` via `provider_id_ref`

### provider_data
Stores provider-specific information and authentication data.

**Fields:**
- `id` (UUID, PK): Primary identifier
- `created_at` (timestamptz): Creation timestamp
- `provider_id_ref` (UUID): Foreign key to user_profile
- `auth_provider_id` (UUID): Foreign key to auth.users
- `name` (text): Provider name/identifier
- `type` (numeric): Provider type identifier
  - 1: GHL (Go High Level)
  - 2: Email Provider
  - 3: Phone System
- `token` (text): Access token
- `refresh` (text): Refresh token
- `expires` (text): Token expiration
- `data` (jsonb): Provider-specific JSON data

**Relationships:**
- Links to `user_profile` via `provider_id_ref`
- Links to `auth.users` via `auth_provider_id`

## Row Level Security (RLS)

### user_profile Policies
- Users can only view their own profile
- Users can only update their own profile

### provider_data Policies
- Users can only view their own provider data
- Users can only update their own provider data
- Users can only insert provider data for themselves

## Indexes
- `idx_user_profile_user_id_auth`: Optimizes auth user lookups
- `idx_provider_data_provider_id`: Optimizes provider data lookups
- `idx_provider_data_auth_id`: Optimizes auth user lookups for provider data

## Usage Example

```typescript
// Get user's GHL provider data
const { data, error } = await supabase
  .from('provider_data')
  .select('*')
  .eq('auth_provider_id', user.id)
  .eq('type', 1)  // GHL type
  .single();

// Update provider token
const { error } = await supabase
  .from('provider_data')
  .update({
    token: newToken,
    expires: newExpiry
  })
  .eq('id', providerId);
```

## Migrations
The schema is managed through SQL migrations in `schema.sql`. Run this file to set up or update the database structure.

## Security Considerations
- All tables have RLS enabled
- Tokens and sensitive data are only accessible to the owning user
- Updates are restricted to the owning user
- No direct public access is allowed
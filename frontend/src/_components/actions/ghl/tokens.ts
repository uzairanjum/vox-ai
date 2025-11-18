// import { fetchGhlApi } from "@/lib/leadconnector/fetchApi";
// import { PROVIDER_INFO, PROVIDER_TYPE } from "@/utils/config/provider_settings";
// import { getSupabase } from "@/utils/supabase/getSupabase";

// export interface GhlTokens {
//   accessToken: string | undefined;
//   refreshToken?: string;
//   expiresIn?: number;
//   expiresAt?: Date;
//   error?: string;
// }

// export interface TokenRefreshResponse {
//   access_token: string;
//   token_type: string;
//   expires_in: number;
//   refresh_token: string;
//   scope: string;
//   userType: string;
//   locationId: string;
//   companyId: string;
//   approvedLocations: string[];
//   userId: string;
//   planId: string;
// }

// const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID || process.env.NEXT_PUBLIC_GHL_CLIENT_ID;
// const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;

// // Simplified version - just get tokens without complex expiry checking
// export async function getGhlTokens(userId: string): Promise<GhlTokens> {
//   try {
//     const supabase = await getSupabase();

//     // Get provider data from the provider_data table
//     const { data: providerData, error } = await supabase
//       .from('provider_data')
//       .select('*')
//       .eq('auth_provider_id', userId)
//       .eq('type', PROVIDER_TYPE.GHL_LOCATION)
//       .single();

//     if (error || !providerData) {
//       console.error('No provider data found:', error);
//       return {
//         accessToken: undefined,
//         error: 'No access token found'
//       };
//     }

//     return {
//       accessToken: providerData.token,
//       refreshToken: providerData.refresh,
//       expiresAt: providerData.expires ? new Date(providerData.expires) : undefined
//     };
//   } catch (error) {
//     console.error('Error getting GHL tokens:', error);
//     return {
//       accessToken: undefined,
//       error: 'Failed to get GHL tokens'
//     };
//   }
// }

// export async function refreshGhlTokens(
//   userId: string,
//   refreshToken: string,
//   providerData?: any
// ): Promise<GhlTokens> {
//   try {
//     if (!GHL_CLIENT_ID || !GHL_CLIENT_SECRET) {
//       throw new Error('GHL OAuth credentials not configured');
//     }

//     console.log('Refreshing GHL token for user:', userId);

//     const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
//       method: 'POST',
//       headers: {
//         'Accept': 'application/json',
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//       body: new URLSearchParams({
//         client_id: GHL_CLIENT_ID,
//         client_secret: GHL_CLIENT_SECRET,
//         grant_type: 'refresh_token',
//         refresh_token: refreshToken,
//         ...(providerData?.user_type && { user_type: providerData.user_type }),
//         ...(providerData?.location_id && { redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/leadconnector/oauth/callback` })
//       }).toString()
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('Token refresh failed:', response.status, errorText);
//       throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
//     }

//     const data: TokenRefreshResponse = await response.json();
//     console.log('Token refresh successful, expires in:', data.expires_in, 'seconds');

//     // Calculate expiry time
//     const expiresAt = new Date(Date.now() + data.expires_in * 1000);

//     // Update the stored token in the database
//     await updateStoredTokens(userId, {
//       accessToken: data.access_token,
//       refreshToken: data.refresh_token,
//       expiresAt,
//       tokenData: data
//     });

//     return {
//       accessToken: data.access_token,
//       refreshToken: data.refresh_token,
//       expiresIn: data.expires_in,
//       expiresAt
//     };
//   } catch (error) {
//     console.error('Error refreshing GHL tokens:', error);
//     return {
//       accessToken: undefined,
//       error: error instanceof Error ? error.message : 'Failed to refresh GHL tokens'
//     };
//   }
// }

// export async function updateStoredTokens(
//   userId: string,
//   tokens: {
//     accessToken: string;
//     refreshToken: string;
//     expiresAt: Date;
//     tokenData: TokenRefreshResponse;
//   }
// ): Promise<void> {
//   try {
//     const supabase = await getSupabase();

//     const updatedProviderData = {
//       token: tokens.accessToken,
//       refresh: tokens.refreshToken,
//       expires: tokens.expiresAt.toISOString(),
//       data: {
//         location_id: tokens.tokenData.locationId,
//         user_type: tokens.tokenData.userType,
//         company_id: tokens.tokenData.companyId,
//         user_id: tokens.tokenData.userId,
//         approved_locations: tokens.tokenData.approvedLocations,
//         plan_id: tokens.tokenData.planId,
//         scope: tokens.tokenData.scope,
//         updated_at: new Date().toISOString()
//       }
//     };

//     const { error } = await supabase
//       .from('provider_data')
//       .update(updatedProviderData)
//       .eq('auth_provider_id', userId)
//       .eq('type', PROVIDER_TYPE.GHL_LOCATION);

//     if (error) {
//       console.error('Error updating stored tokens:', error);
//       throw error;
//     }

//     console.log('Successfully updated stored tokens');
//   } catch (error) {
//     console.error('Error in updateStoredTokens:', error);
//     throw error;
//   }
// }

// // Simple utility function to get valid tokens
// export async function getValidGhlTokens(userId: string): Promise<GhlTokens> {
//   const tokens = await getGhlTokens(userId);

//   if (!tokens.accessToken || tokens.error) {
//     throw new Error(tokens.error || 'No valid access token available');
//   }

//   return tokens;
// }

// // Utility function to check if tokens are valid
// export function isValidTokens(tokens: GhlTokens): boolean {
//   return Boolean(tokens.accessToken && !tokens.error);
// }

import { fetchGhlApi } from "@/lib/leadconnector/fetchApi";
import { PROVIDER_TYPE } from "@/utils/config/provider_settings";
import { getSupabase } from "@/utils/supabase/getSupabase";

// -----------------------------
// Types
// -----------------------------

export interface GhlTokens {
  accessToken: string | undefined;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: Date;
  error?: string;
}

export interface TokenRefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  userType: string;
  locationId: string;
  companyId: string;
  approvedLocations: string[];
  userId: string;
  planId: string;
}

// Type representing a row from your `provider_data` table
export interface ProviderDataRow {
  id: string;
  auth_provider_id: string;
  type: string;
  token: string;
  refresh?: string;
  expires?: string;
  data?: Record<string, any>;
}

const GHL_CLIENT_ID =
  process.env.GHL_CLIENT_ID || process.env.NEXT_PUBLIC_GHL_CLIENT_ID;
const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;

// -----------------------------
// Get stored tokens
// -----------------------------
export async function getGhlTokens(userId: string): Promise<GhlTokens> {
  try {
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("provider_data")
      .select("*")
      .eq("auth_provider_id", userId)
      .eq("type", PROVIDER_TYPE.GHL_LOCATION)
      .single();

    // Explicit cast so TypeScript knows the shape
    const providerData = data as ProviderDataRow | null;

    if (error || !providerData) {
      console.error("No provider data found:", error);
      return {
        accessToken: undefined,
        error: "No access token found",
      };
    }

    return {
      accessToken: providerData.token,
      refreshToken: providerData.refresh,
      expiresAt: providerData.expires
        ? new Date(providerData.expires)
        : undefined,
    };
  } catch (error) {
    console.error("Error getting GHL tokens:", error);
    return {
      accessToken: undefined,
      error: "Failed to get GHL tokens",
    };
  }
}

// -----------------------------
// Refresh tokens
// -----------------------------
export async function refreshGhlTokens(
  userId: string,
  refreshToken: string,
  providerData?: any
): Promise<GhlTokens> {
  try {
    if (!GHL_CLIENT_ID || !GHL_CLIENT_SECRET) {
      throw new Error("GHL OAuth credentials not configured");
    }

    console.log("Refreshing GHL token for user:", userId);

    const response = await fetch(
      "https://services.leadconnectorhq.com/oauth/token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: GHL_CLIENT_ID,
          client_secret: GHL_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          ...(providerData?.user_type && { user_type: providerData.user_type }),
          ...(providerData?.location_id && {
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/leadconnector/oauth/callback`,
          }),
        }).toString(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token refresh failed:", response.status, errorText);
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const data: TokenRefreshResponse = await response.json();
    console.log("Token refresh successful, expires in:", data.expires_in);

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    // Update in DB
    await updateStoredTokens(userId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
      tokenData: data,
    });

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      expiresAt,
    };
  } catch (error) {
    console.error("Error refreshing GHL tokens:", error);
    return {
      accessToken: undefined,
      error:
        error instanceof Error ? error.message : "Failed to refresh GHL tokens",
    };
  }
}

// -----------------------------
// Update stored tokens
// -----------------------------
export async function updateStoredTokens(
  userId: string,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    tokenData: TokenRefreshResponse;
  }
): Promise<void> {
  try {
    const supabase = await getSupabase();

    const updatedProviderData: Partial<ProviderDataRow> = {
      token: tokens.accessToken,
      refresh: tokens.refreshToken,
      expires: tokens.expiresAt.toISOString(),
      data: {
        location_id: tokens.tokenData.locationId,
        user_type: tokens.tokenData.userType,
        company_id: tokens.tokenData.companyId,
        user_id: tokens.tokenData.userId,
        approved_locations: tokens.tokenData.approvedLocations,
        plan_id: tokens.tokenData.planId,
        scope: tokens.tokenData.scope,
        updated_at: new Date().toISOString(),
      },
    };

    const { error }: any = await supabase
      .from("provider_data")
      .update(updatedProviderData as never)
      .eq("auth_provider_id", userId)
      .eq("type", PROVIDER_TYPE.GHL_LOCATION);

    if (error) {
      console.error("Error updating stored tokens:", error);
      throw error;
    }

    console.log("Successfully updated stored tokens");
  } catch (error) {
    console.error("Error in updateStoredTokens:", error);
    throw error;
  }
}

// -----------------------------
// Utility functions
// -----------------------------
export async function getValidGhlTokens(userId: string): Promise<GhlTokens> {
  const tokens = await getGhlTokens(userId);

  if (!tokens.accessToken || tokens.error) {
    throw new Error(tokens.error || "No valid access token available");
  }

  return tokens;
}

export function isValidTokens(tokens: GhlTokens): boolean {
  return Boolean(tokens.accessToken && !tokens.error);
}

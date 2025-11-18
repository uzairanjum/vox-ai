import { fetchGhlApi } from "@/lib/leadconnector/fetchApi";
import { getGhlTokens, isValidTokens } from "./tokens";

export interface GhlProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  timezone?: string;
  companyName?: string;
  avatar?: string;
  role?: string;
}

export interface GhlProfileResponse {
  profile?: GhlProfile;
  error?: string;
}

export async function getGhlProfile(locationId: string): Promise<GhlProfileResponse> {
  try {
    const tokens = await getGhlTokens(locationId);
    if (!isValidTokens(tokens)) {
      throw new Error('Invalid tokens');
    }

    if (!tokens.accessToken) {
      throw new Error('Access token not available');
    }

    const response = await fetchGhlApi('/users/me', tokens.accessToken, {
      method: 'GET',
      headers: {
        Version: '2021-04-15'
      }
    });

    const data = await response.json();
    
    return {
      profile: {
        id: data.id,
        name: data.name || `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        phone: data.phone,
        timezone: data.timezone,
        companyName: data.companyName,
        avatar: data.avatar,
        role: data.role
      }
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to get GHL profile'
    };
  }
}

export async function updateGhlProfile(
  locationId: string, 
  updates: Partial<GhlProfile>
): Promise<GhlProfileResponse> {
  try {
    const tokens = await getGhlTokens(locationId);
    if (!isValidTokens(tokens)) {
      throw new Error('Invalid tokens');
    }

    if (!tokens.accessToken) {
      throw new Error('Access token not available');
    }

    const response = await fetchGhlApi('/users/me', tokens.accessToken, {
      method: 'PUT',
      headers: {
        Version: '2021-04-15'
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    
    return {
      profile: {
        id: data.id,
        name: data.name || `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        phone: data.phone,
        timezone: data.timezone,
        companyName: data.companyName,
        avatar: data.avatar,
        role: data.role
      }
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update GHL profile'
    };
  }
}

// Helper function to check if profile response is valid
export function isValidProfileResponse(response: GhlProfileResponse): boolean {
  return Boolean(response.profile && !response.error);
}
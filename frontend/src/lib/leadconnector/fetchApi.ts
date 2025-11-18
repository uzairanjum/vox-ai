import { getValidGhlTokens, refreshGhlTokens } from "@/_components/actions/ghl/tokens";

const GHL_API_BASE = "https://services.leadconnectorhq.com";

export async function fetchGhlApiLegacy<T = any>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${GHL_API_BASE}${endpoint}`;
  console.log('Making LeadConnector API request to:', url);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('LeadConnector API response status:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      console.error('LeadConnector API error response:', error);
      throw new Error(
        error?.message || `API request failed with status ${response.status}`
      );
    }

    // Get raw response text first for debugging
    const rawText = await response.text();
    console.log('LeadConnectorAPI raw response (first 500 chars):', rawText.substring(0, 500));

    // Parse JSON
    let data;
    try {
      data = JSON.parse(rawText);
      console.log('LeadConnector API response data shape:', {
        hasData: !!data,
        keys: data ? Object.keys(data) : null,
        dataType: typeof data,
        hasMessages: !!data?.messages,
        messagesType: typeof data?.messages,
        messagesKeys: data?.messages ? Object.keys(data.messages) : null,
        messageCount: data?.messages?.messages?.length || 0
      });
    } catch (parseError) {
      console.error('Failed to parse LeadConnector API response as JSON:', parseError);
      throw new Error(`Invalid JSON response: ${rawText.substring(0, 100)}...`);
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchLeadConnectorApi:', {
      endpoint,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      } : error
    });
    throw error;
  }
}
/**
 * Fetch full email content by messageId
 * Example usage:
 *   const email = await fetchEmailContent("yvupnErNZd8u2rGblLFu", userId);
 *   console.log(email.data); // contains HTML email body
 */

/**
 * Enhanced GHL API client with automatic token refresh and retry logic
 * This should be used by default instead of fetchGhlApi
 */
export async function fetchGhlApiWithRefresh<T = any>(
  endpoint: string,
  userId: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${GHL_API_BASE}${endpoint}`;
  let retryCount = 0;
  const maxRetries = 2;

  const makeRequest = async (accessToken: string): Promise<Response> => {
    // console.log("accessToken.............acess",accessToken)
    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-07-28', // Default version, can be overridden
        'Content-Type': 'application/json',
        ...options.headers, // Allow route-specific version override
      },
    });
  };

  const parseResponse = async (response: Response): Promise<T> => {
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.message || `GHL API request failed with status ${response.status}`);
    }

    const rawText = await response.text();
    try {
      return JSON.parse(rawText);
    } catch (parseError) {
      console.error('Failed to parse LeadConnector API response as JSON:', parseError);
      throw new Error(`Invalid JSON response from LeadConnector API: ${rawText.substring(0, 100)}...`);
    }
  };

  while (retryCount <= maxRetries) {
    try {
      // Get current tokens
      const tokens = await getValidGhlTokens(userId);
      
      if (!tokens.accessToken) {
        throw new Error('No valid LeadConnector access token available. Please re-authenticate.');
      }

      console.log(`Making LeadConnector API request (attempt ${retryCount + 1}) to:`, url);

      const response = await makeRequest(tokens.accessToken);

      // If we get 401 and haven't exhausted retries, try to refresh token
      if (response.status === 401 && retryCount < maxRetries) {
        console.log('🔄 Got 401 error, refreshing LeadConnector token and retrying...');
      
        if (!tokens.refreshToken) {
          throw new Error('No refresh token available. Please re-authenticate.');
        }

        const refreshResult = await refreshGhlTokens(userId, tokens.refreshToken);
        
        if (refreshResult.accessToken) {
          console.log('✅ LeadConnector token refreshed successfully, retrying request...');
          retryCount++;
          continue; // Retry with new token
        } else {
          throw new Error('Failed to refresh LeadConnector token. Please re-authenticate.');
    }
      }

      // Parse and return response
      return await parseResponse(response);
    
  } catch (error) {
      // If it's a token/auth error and we can retry, continue the loop
      if (error instanceof Error && 
          (error.message.includes('401') || error.message.includes('token')) && 
          retryCount < maxRetries) {
        console.log(`🔄 Retrying LeadConnector request due to auth error: ${error.message}`);
        retryCount++;
        continue;
      }

      // Otherwise, throw the error
      console.error('❌ Error in LeadConnector API request:', {
        endpoint: url,
        attempt: retryCount + 1,
        error: error instanceof Error ? error.message : error
      });
    throw error;
  }
}

  throw new Error(`LeadConnector API request failed after ${maxRetries + 1} attempts`);
}

/**
 * Default export - enhanced version with auto-refresh
 * Use this instead of fetchGhlApi in all new code
 */
export const fetchGhlApi = fetchGhlApiWithRefresh;

export function buildQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        query.set(key, value.join(','));
      } else if (typeof value === 'object') {
        query.set(key, JSON.stringify(value));
      } else {
        query.set(key, String(value));
      }
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}
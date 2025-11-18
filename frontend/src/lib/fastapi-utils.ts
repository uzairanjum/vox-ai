interface FastAPIOptions extends RequestInit {
  useAuth?: boolean;
  userId?: string;
}

const FASTAPI_URL =
  process.env.FASTAPI_URL ||
  process.env.NEXT_PUBLIC_FASTAPI_URL ||
  "http://localhost:8000";
const FASTAPI_API_KEY =
  process.env.FASTAPI_API_KEY || "vox_frontend_your-key-here";

/**
 * Standardized fetch wrapper for FastAPI calls with required security headers
 */
export async function fetchFastAPI(
  endpoint: string,
  options: FastAPIOptions = {}
): Promise<Response> {
  const { useAuth = true, userId, ...fetchOptions } = options;

  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  const url = `${FASTAPI_URL}${normalizedEndpoint}`;

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": FASTAPI_API_KEY,
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  // Add authorization if required
  if (useAuth && userId) {
    headers["Authorization"] = `Bearer ${userId}`;
  }

  return fetch(url, {
    ...fetchOptions,
    headers,
  });
}

/**
 * Convenience method for FastAPI POST requests
 */
export async function postFastAPI<T = any>(
  endpoint: string,
  data: any,
  options: FastAPIOptions = {}
): Promise<T> {
  console.log("POST to FastAPI000000000000:", { endpoint, data, options });
  const response = await fetchFastAPI(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`FastAPI error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Convenience method for FastAPI GET requests
 */
export async function getFastAPI<T = any>(
  endpoint: string,
  options: FastAPIOptions = {}
): Promise<T> {
  const response = await fetchFastAPI(endpoint, {
    method: "GET",
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("FastAPI Error:", {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`FastAPI error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

import { fetchGhlApi } from "@/lib/leadconnector/fetchApi";
import { getGhlTokens, isValidTokens } from "./tokens";
import { GhlActionResponse, GhlContact, PaginationParams, PaginatedResponse } from "./types";

export async function getGhlContacts(
  locationId: string,
  params?: PaginationParams & {
    query?: string;
    tags?: string[];
    updatedAfter?: string;
  }
): Promise<GhlActionResponse<PaginatedResponse<GhlContact>>> {
  try {
    const tokens = await getGhlTokens(locationId);
    if (!isValidTokens(tokens)) {
      throw new Error('Invalid tokens');
    }

    const queryParams = new URLSearchParams();
    queryParams.append('locationId', locationId);

    if (params) {
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.startAfter) queryParams.append('startAfter', params.startAfter);
      if (params.query) queryParams.append('query', params.query);
      if (params.tags?.length) queryParams.append('tags', params.tags.join(','));
      if (params.updatedAfter) queryParams.append('updatedAfter', params.updatedAfter);
    }

    if (!tokens.accessToken) {
      throw new Error('Access token not available');
    }

    const response = await fetchGhlApi(`/contacts/search?${queryParams.toString()}`, tokens.accessToken);

    const data = await response.json();
    
    return {
      data: {
        items: data.contacts,
        total: data.total,
        hasMore: data.hasMore,
        nextStartAfter: data.nextStartAfter
      }
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to get GHL contacts'
    };
  }
}

export async function getGhlContact(
  locationId: string,
  contactId: string
): Promise<GhlActionResponse<GhlContact>> {
  try {
    const tokens = await getGhlTokens(locationId);
    if (!isValidTokens(tokens)) {
      throw new Error('Invalid tokens');
    }

    if (!tokens.accessToken) {
      throw new Error('Access token not available');
    }

    const response = await fetchGhlApi(`/contacts/${contactId}`, tokens.accessToken, {
      method: 'GET'
    });

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to get GHL contact'
    };
  }
}

export async function updateGhlContact(
  locationId: string,
  contactId: string,
  updates: Partial<GhlContact>
): Promise<GhlActionResponse<GhlContact>> {
  try {
    const tokens = await getGhlTokens(locationId);
    if (!isValidTokens(tokens)) {
      throw new Error('Invalid tokens');
    }

    if (!tokens.accessToken) {
      throw new Error('Access token not available');
    }

    const response = await fetchGhlApi(`/contacts/${contactId}`, tokens.accessToken, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update GHL contact'
    };
  }
}

export async function createGhlContact(
  locationId: string,
  contact: Omit<GhlContact, 'id' | 'locationId' | 'createdAt' | 'updatedAt'>
): Promise<GhlActionResponse<GhlContact>> {
  try {
    const tokens = await getGhlTokens(locationId);
    if (!isValidTokens(tokens)) {
      throw new Error('Invalid tokens');
    }

    if (!tokens.accessToken) {
      throw new Error('Access token not available');
    }

    const response = await fetchGhlApi('/contacts', tokens.accessToken, {
      method: 'POST',
      body: JSON.stringify({ ...contact, locationId })
    });

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to create GHL contact'
    };
  }
}
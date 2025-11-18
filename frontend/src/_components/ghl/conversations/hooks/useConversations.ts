"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Conversation } from "@/lib/leadconnector/types/conversationTypes";
import { autoEnableVoxAiAutopilot } from "@/utils/autopilot/voxAiAutoEnable";

// Re-export the Conversation type for convenience
export type { Conversation };

interface UseConversationsOptions {
  initialFilters?: {
    limit?: number;
    query?: string;
  };
  locationId?: string;
}

interface UseConversationsReturn {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  fetchConversations: (
    filters?: { limit?: number; query?: string; cursor?: string },
    append?: boolean
  ) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface ApiResponse {
  success: boolean;
  data?: {
    conversations: Conversation[];
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  };
  error?: string;
}

// In-memory cache for request deduplication
const requestCache = new Map<string, Promise<ApiResponse>>();
const CACHE_DURATION = 10000; // 10 seconds

const clearOldRequests = () => {
  // Clear old requests from cache periodically
  setTimeout(() => {
    requestCache.clear();
  }, CACHE_DURATION);
};

const getErrorMessage = (error: any, status?: number): string => {
  if (typeof error === "string") return error;

  // Handle specific error cases
  if (status === 401) return "Authentication expired. Please refresh the page.";
  if (status === 400) return "Invalid request. Please check your settings.";
  if (status === 403) return "Access denied. Please check your permissions.";
  if (status === 429) return "Too many requests. Please wait a moment.";
  if (status === 500) return "Server error. Please try again later.";

  // Try to extract message from error object
  let message = "";
  if (error?.message) message = error.message;
  else if (error?.error) message = error.error;
  else if (error?.detail) message = error.detail;

  return message || "Failed to load conversations";
};

export function useConversations(
  options: UseConversationsOptions = {}
): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [lastFilters, setLastFilters] = useState<{
    limit?: number;
    query?: string;
  }>({});

  // Extract locationId from options for vox-ai auto-enable
  const { locationId } = options;

  const conversationsRef = useRef<Conversation[]>([]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const currentRequestKeyRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const fetchConversations = useCallback(
    async (
      filters: { limit?: number; query?: string; cursor?: string } = {},
      append: boolean = false
    ) => {
      try {
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (filters.limit) queryParams.set("limit", filters.limit.toString());
        if (filters.query) queryParams.set("query", filters.query);
        if (filters.cursor) queryParams.set("startAfterDate", filters.cursor);

        const requestKey = queryParams.toString();
        const isLoadMore = append && filters.cursor;

        // If we're starting a different request than the one that is currently active,
        // abort the previous active controller (but DO NOT abort if we're reusing the same key)
        if (
          abortControllerRef.current &&
          currentRequestKeyRef.current !== requestKey
        ) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
          currentRequestKeyRef.current = null;
        }

        // Update UI state
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
          setError(null);
          setLastFilters(filters);
        }

        // Deduplication: see if a promise for this requestKey already exists
        let requestPromise = requestCache.get(requestKey) as
          | Promise<ApiResponse>
          | undefined;

        if (!requestPromise) {
          // Create a new AbortController for this new fetch
          const controller = new AbortController();
          abortControllerRef.current = controller;
          currentRequestKeyRef.current = requestKey;

          // Create the fetch promise (note: we store the promise in cache)
          requestPromise = fetch(
            `/api/leadconnector/conversations/search?${queryParams.toString()}`,
            {
              signal: controller.signal,
              headers: {
                "Cache-Control": "no-cache",
              },
            }
          ).then(async (response) => {
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(
                getErrorMessage(
                  errorData.error || errorData.message,
                  response.status
                )
              );
            }
            return response.json();
          });

          // Cache the in-flight promise
          requestCache.set(requestKey, requestPromise);

          // Schedule clearing stale cache entries (keep existing behaviour)
          clearOldRequests();
        } else {
        }

        // Await the promise (whether newly created or cached)
        const data: ApiResponse = await requestPromise;

        // If the request used a controller and it was aborted, handle it:
        if (
          abortControllerRef.current &&
          abortControllerRef.current.signal.aborted
        ) {
          return;
        }

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch conversations");
        }

        const newConversations = data.data?.conversations || [];

        if (isLoadMore) {
          setConversations((prev) => [...prev, ...newConversations]);
        } else {
          setConversations(newConversations);
        }

        setHasMore(data.data?.hasMore || false);
        setTotal(data.data?.total || 0);
        setNextCursor(data.data?.nextCursor);
        setError(null);

        // Auto-enable vox-ai if needed (non-critical)
        if (locationId && newConversations.length > 0) {
          try {
            await autoEnableVoxAiAutopilot(newConversations, locationId);
          } catch (err) {}
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          return;
        }

        setError(error.message || "Failed to load conversations");

        if (!append) {
          setConversations([]);
          setHasMore(false);
          setTotal(0);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [locationId]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore || isLoading) {
      return;
    }

    await fetchConversations(
      {
        ...lastFilters,
        cursor: nextCursor,
      },
      true
    );
  }, [
    hasMore,
    nextCursor,
    isLoadingMore,
    isLoading,
    lastFilters,
    fetchConversations,
  ]);

  const refresh = useCallback(async () => {
    setNextCursor(undefined);
    await fetchConversations(lastFilters, false);
  }, [fetchConversations]);

  return {
    conversations,
    setConversations,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    total,
    fetchConversations,
    loadMore,
    refresh,
  };
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Message, MessagesResponse } from '@/lib/leadconnector/types/messageTypes';

interface GetMessagesParams {
  conversationId: string;
  limit?: number;
}

interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  lastMessageId?: string;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
}

// Enhanced error message mapping
const getErrorMessage = (error: any, status?: number): string => {
  // Handle specific HTTP status codes
  if (status === 401) {
    return 'Authentication failed. Your session may have expired. Trying to refresh...';
  }
  if (status === 403) {
    return 'Access denied. Please check your LeadConnector permissions.';
  }
  if (status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (status && status >= 500) {
    return 'Server error. Please try again in a moment.';
  }

  // Handle specific error messages
  const message = error?.message || error || '';
  if (message.includes('JWT') || message.includes('token')) {
    return 'Authentication token expired. Automatically refreshing...';
  }
  if (message.includes('Network')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  return message || 'Failed to load messages';
};

export function useMessages({
  conversationId,
  limit = 100
}: GetMessagesParams): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string>();
  const [retryCount, setRetryCount] = useState(0);

  // Load messages with enhanced error handling and auto-retry
  const loadMessages = useCallback(async (messageId?: string, isRetry = false) => {
    try {
      setIsLoading(true);
      if (!isRetry) {
        setError(null);
        setRetryCount(0);
      }

      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        ...(messageId && { lastMessageId: messageId })
      });

      console.log(`🔄 Loading messages for conversation ${conversationId}${isRetry ? ' (retry)' : ''}`);

      const response = await fetch(
        `/api/leadconnector/conversations/${conversationId}/messages?${queryParams}`,
        {
          // Add timeout and cache settings
          signal: AbortSignal.timeout(30000), // 30 second timeout
          cache: 'no-store' // Always get fresh data
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle 401 errors with automatic retry (token refresh happens in API)
        if (response.status === 401 && retryCount < 2) {
          console.log('🔄 Got 401, retrying in 1 second...');
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            loadMessages(messageId, true);
          }, 1000);
          return;
        }
        
        throw new Error(getErrorMessage(errorData.error || errorData.message, response.status));
      }

      const data = await response.json() as MessagesResponse;
      
      // Validate response structure
      if (!data.messages?.messages || !Array.isArray(data.messages.messages)) {
        throw new Error('Invalid response format from server');
      }

      const { messages: messagesList, lastMessageId: lastId, nextPage } = data.messages;

      // Update messages - either replace or append
      setMessages(prev => 
        messageId ? [...prev, ...messagesList] : messagesList
      );
      
      // Update pagination info
      setHasMore(Boolean(nextPage));
      if (lastId) {
        setLastMessageId(lastId);
      }

      // Clear error on success
      setError(null);
      setRetryCount(0);
      
      console.log(`✅ Successfully loaded ${messagesList.length} messages`);

    } catch (error) {
      console.error('❌ Error loading messages:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      
      // Show user-friendly error message
      if (errorMessage.includes('token') || errorMessage.includes('Authentication')) {
        console.log('🔄 Token-related error detected, API should handle refresh automatically');
      }
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, limit, retryCount]);

  // Manual retry function
  const retry = useCallback(async () => {
    console.log('🔄 Manual retry requested');
    await loadMessages();
  }, [loadMessages]);

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (!hasMore || !lastMessageId || isLoading) return;
    await loadMessages(lastMessageId);
  }, [hasMore, lastMessageId, isLoading, loadMessages]);

  return {
    messages,
    isLoading,
    error,
    hasMore,
    lastMessageId,
    loadMore,
    retry
  };
}

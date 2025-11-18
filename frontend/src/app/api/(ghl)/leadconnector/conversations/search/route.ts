// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/utils/supabase/getSupabase';
import { fetchGhlApiWithRefresh } from '@/lib/leadconnector/fetchApi';
import { PROVIDER_TYPE } from '@/utils/config/providerTypes';

// Simple in-memory cache to prevent duplicate API calls
interface CacheEntry {
  data: any;
  timestamp: number;
  locationId: string;
}

const CACHE_DURATION = 30 * 1000; // 30 seconds cache
const conversationCache = new Map<string, CacheEntry>();

// Clean up old cache entries
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, entry] of conversationCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      conversationCache.delete(key);
    }
  }
};

interface SearchConversationsRequest {
  locationId?: string; // Make optional since we'll get it from database
  query?: string;
  limit?: number;
  assignedTo?: string;
  contactId?: string;
  followers?: string;
  id?: string;
  lastMessageAction?: 'automated' | 'manual';
  lastMessageDirection?: 'inbound' | 'outbound';
  lastMessageType?: string;
  mentions?: string;
  scoreProfile?: string;
  scoreProfileMin?: number;
  scoreProfileMax?: number;
  sort?: 'asc' | 'desc';
  sortBy?: 'last_manual_message_date' | 'last_message_date' | 'score_profile';
  sortScoreProfile?: string;
  startAfterDate?: any;
  status?: 'all' | 'read' | 'unread' | 'starred' | 'recents';
}

interface ConversationResult {
  id: string;
  contactId: string;
  locationId: string;
  lastMessageBody: string;
  lastMessageType: string;
  type: string;
  unreadCount: number;
  fullName: string;
  contactName: string;
  email: string;
  phone: string;
}

interface SearchConversationsResponse {
  success: boolean;
  data?: {
    conversations: ConversationResult[];
    total: number;
    hasMore?: boolean;
    nextCursor?: string;
  };
  error?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<SearchConversationsResponse | ErrorResponse>> {
  try {
    console.log('🔍 Conversation search request:', {
      timestamp: new Date().toISOString()
    });

    // Authenticate user
    const supabase = await getSupabase();
    const userData = await supabase.auth.getUser();
    
    if (!userData.data.user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const user = userData.data.user;
    const { searchParams } = new URL(request.url);

    // Get location ID from database instead of query parameters
    const { data: providerData, error: providerError } = await supabase
      .from('provider_data')
      .select('data')
      .eq('auth_provider_id', user.id)
      .eq('type', PROVIDER_TYPE.GHL_LOCATION)
      .single();

    if (providerError || !providerData?.data?.location_id) {
      return NextResponse.json({
        success: false,
        error: 'No LeadConnector location found. Please connect your LeadConnector account.'
      } satisfies ErrorResponse, { status: 400 });
    }

    const locationId = providerData.data.location_id;

    // Build query parameters for GHL API
    const ghlParams = new URLSearchParams();
    ghlParams.set('locationId', locationId);

    // Add optional parameters from the request
    const optionalParams = [
      'query', 'limit', 'assignedTo', 'contactId', 'followers', 'id',
      'lastMessageAction', 'lastMessageDirection', 'lastMessageType',
      'mentions', 'scoreProfile', 'scoreProfileMin', 'scoreProfileMax',
      'sort', 'sortBy', 'sortScoreProfile', 'startAfterDate', 'status'
    ];

    optionalParams.forEach(param => {
      const value = searchParams.get(param);
      if (value !== null) {
        ghlParams.set(param, value);
      }
    });

    // Set default limit if not provided
    if (!ghlParams.has('limit')) {
      ghlParams.set('limit', '20');
    }

    // Ensure we sort by lastMessageDate for consistent pagination
    if (!ghlParams.has('sortBy')) {
      ghlParams.set('sortBy', 'last_message_date');
      ghlParams.set('sort', 'desc');
    }

    // Create cache key from parameters (include sorted params for consistency)
    const sortedParams = Array.from(ghlParams.entries()).sort();
    const cacheKey = `${user.id}-${JSON.stringify(sortedParams)}`;
    
    // Clean up old cache entries
    cleanupCache();
    
    // Check cache first (but not for pagination requests to ensure fresh data)
    const isPaginationRequest = ghlParams.has('startAfterDate');
    if (!isPaginationRequest) {
    const cachedEntry = conversationCache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_DURATION) {
      console.log('📋 Returning cached conversation data');
      return NextResponse.json({
        success: true,
        data: cachedEntry.data
      } satisfies SearchConversationsResponse);
      }
    }

    console.log('🚀 Searching conversations with GHL API:', {
      locationId,
      params: Object.fromEntries(ghlParams.entries()),
      userId: user.id
    });

    // Search conversations using GHL API
    const response = await fetchGhlApiWithRefresh(
      `/conversations/search?${ghlParams.toString()}`,
      user.id,
      {
        method: 'GET',
        headers: {
          'Version': '2021-04-15'
        }
      }
    );

    console.log('✅ LeadConnector Conversation search SUCCESS:', {
      hasResponse: !!response,
      conversationCount: response?.conversations?.length || 0,
      total: response?.total
    });

    // Determine if there are more results
    const limit = parseInt(ghlParams.get('limit') || '20');
    const hasMore = response?.conversations?.length === limit && response?.total > limit;
    
    // Create next cursor for pagination using lastMessageDate instead of ID
    let nextCursor = undefined;
    if (hasMore && response?.conversations?.length > 0) {
      const lastConversation = response.conversations[response.conversations.length - 1];
      nextCursor = lastConversation.lastMessageDate; // Use date instead of ID for GHL API compatibility
    }

    // Cache the successful response (but not pagination requests)
    const responseData = {
        conversations: response?.conversations || [],
        total: response?.total || 0,
        hasMore,
        nextCursor
    };
    
    if (!isPaginationRequest) {
    conversationCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
      locationId
    });
    }

    return NextResponse.json({
      success: true,
      data: responseData
    } satisfies SearchConversationsResponse);

  } catch (error) {
    console.error('❌ Error in conversation search:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SearchConversationsResponse | ErrorResponse>> {
  try {
    console.log('🔍 Conversation search POST request:', {
      timestamp: new Date().toISOString()
    });

    // Authenticate user
    const supabase = await getSupabase();
    const userData = await supabase.auth.getUser();
    
    if (!userData.data.user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const user = userData.data.user;

    // Parse request body
    const body: SearchConversationsRequest = await request.json();

    // Get location ID from database instead of request body
    const { data: providerData, error: providerError } = await supabase
      .from('provider_data')
      .select('data')
      .eq('auth_provider_id', user.id)
      .eq('type', PROVIDER_TYPE.GHL_LOCATION)
      .single();

    if (providerError || !providerData?.data?.location_id) {
      return NextResponse.json({
        success: false,
        error: 'No LeadConnector location found. Please connect your LeadConnector account.'
      } satisfies ErrorResponse, { status: 400 });
    }

    const locationId = providerData.data.location_id;

    // Build query parameters for GHL API
    const ghlParams = new URLSearchParams();
    ghlParams.set('locationId', locationId);

    // Add search parameters from body
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        ghlParams.set(key, String(value));
      }
    });

    // Set default limit if not provided
    if (!ghlParams.has('limit')) {
      ghlParams.set('limit', '20');
    }

    console.log('🚀 Searching conversations with LeadConnector API (POST):', {
      locationId,
      params: Object.fromEntries(ghlParams.entries()),
      userId: user.id
    });

    // Search conversations using GHL API
    const response = await fetchGhlApiWithRefresh(
      `/conversations/search?${ghlParams.toString()}`,
      user.id,
      {
        method: 'GET',
        headers: {
          'Version': '2021-04-15'
        }
      }
    );

    console.log('✅ LeadConnector Conversation search SUCCESS (POST):', {
      hasResponse: !!response,
      conversationCount: response?.conversations?.length || 0,
      total: response?.total
    });

    // Determine if there are more results
    const limit = parseInt(ghlParams.get('limit') || '20');
    const hasMore = response?.conversations?.length === limit && response?.total > limit;
    
    // Create next cursor for pagination using lastMessageDate instead of ID
    let nextCursor = undefined;
    if (hasMore && response?.conversations?.length > 0) {
      const lastConversation = response.conversations[response.conversations.length - 1];
      nextCursor = lastConversation.lastMessageDate; // Use date instead of ID for GHL API compatibility
    }

    return NextResponse.json({
      success: true,
      data: {
        conversations: response?.conversations || [],
        total: response?.total || 0,
        hasMore,
        nextCursor
      }
    } satisfies SearchConversationsResponse);

  } catch (error) {
    console.error('❌ Error searching conversations (POST):', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search conversations'
    } satisfies ErrorResponse, { status: 500 });
  }
}

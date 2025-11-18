import { fetchGhlApiWithRefresh } from '@/lib/leadconnector/fetchApi';
import { PROVIDER_TYPE } from '@/utils/config/providerTypes';
import { getCurrentUser } from '@/utils/auth/user';
import { getCurrentUserProviderData } from '@/utils/providers/providerUtils';
import { NextRequest } from 'next/server';

interface GetMessagesParams {
  lastMessageId?: string;
  type?: string[];
  limit?: number;
}

interface ErrorResponse {
  success: false;
  error: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    // Get conversation ID and validate
    const resolvedParams = await params;
    const { conversationId } = resolvedParams;
    if (!conversationId) {
      return Response.json({
        success: false,
        error: 'Conversation ID is required'
      } satisfies ErrorResponse, { status: 400 });
    }

    console.log('Fetching messages for conversation:', conversationId);
    
    // Get provider data for location validation
    const providerData = await getCurrentUserProviderData(PROVIDER_TYPE.GHL_LOCATION);
    if (!providerData?.data?.location_id) {
      console.error('Provider authentication failed:', {
        locationId: !!providerData?.data?.location_id
      });
      return Response.json({
        success: false,
        error: 'Provider authentication failed'
      } satisfies ErrorResponse, { status: 401 });
    }

    // Get search parameters
    const { searchParams } = new URL(req.url);
    const requestParams: GetMessagesParams = {
      lastMessageId: searchParams.get('lastMessageId') || undefined,
      type: searchParams.get('type')?.split(','),
      limit: Number(searchParams.get('limit')) || 1000 // Increased default limit to get more messages
    };
    console.log('Request parameters:', requestParams);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (requestParams.lastMessageId) queryParams.set('lastMessageId', requestParams.lastMessageId);
    if (requestParams.type?.length) queryParams.set('type', requestParams.type.join(','));
    if (requestParams.limit) queryParams.set('limit', requestParams.limit.toString());

    // Make API request with automatic token refresh
    const endpoint = `/conversations/${conversationId}/messages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Making LeadConnector API request with auto-refresh:', endpoint);

    const data = await fetchGhlApiWithRefresh(endpoint, user.id);
    console.log('LeadConnector API response - detailed structure:', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : 'no data',
      hasMessages: !!data?.messages,
      messagesKeys: data?.messages ? Object.keys(data.messages) : 'no messages',
      hasMessagesArray: !!data?.messages?.messages,
      messageCount: data?.messages?.messages?.length || 0,
      sampleMessage: data?.messages?.messages?.[0] || 'no messages',
      fullResponse: JSON.stringify(data, null, 2)
    });

    // Return successful response
    return Response.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

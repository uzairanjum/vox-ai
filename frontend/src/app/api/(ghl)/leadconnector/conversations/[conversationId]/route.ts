import { fetchGhlApiWithRefresh } from '@/lib/leadconnector/fetchApi';
import { PROVIDER_TYPE } from '@/utils/config/providerTypes';
import { getCurrentUser } from '@/utils/auth/user';
import { getCurrentUserProviderData } from '@/utils/providers/providerUtils';
import { NextRequest } from 'next/server';

interface ErrorResponse {
  success: false;
  error: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    console.log('GET /api/(ghl)/leadconnector/conversations/[conversationId] - Starting');
    
    // Get current user
    const user = await getCurrentUser();
    if (!user?.id) {
      console.log('User authentication failed');
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    // Get conversation ID and validate
    const { conversationId } = await params;
    if (!conversationId) {
      return Response.json({
        success: false,
        error: 'Missing conversation ID'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Get provider data
    const providerData = await getCurrentUserProviderData(PROVIDER_TYPE.GHL_LOCATION);
    if (!providerData?.token || !providerData.data?.location_id) {
      return Response.json({
        success: false,
        error: 'Provider authentication failed'
      } satisfies ErrorResponse, { status: 401 });
    }

    // Make API request with auto token refresh
    const data = await fetchGhlApiWithRefresh(
      `/conversations/${conversationId}`,
      user.id
    );

    // Return successful response
    return Response.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

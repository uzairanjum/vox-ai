import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/utils/supabase/getSupabase';
import { fetchGhlApiWithRefresh } from '@/lib/leadconnector/fetchApi';

interface SendMessageRequest {
  message: string;
  messageType: string;
  contactId?: string;
}

interface SendMessageResponse {
  success: boolean;
  data?: {
    messageId?: string;
    conversationId: string;
    timestamp: string;
  };
  error?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
): Promise<NextResponse<SendMessageResponse | ErrorResponse>> {
  try {
    // Fix Next.js 15 parameter handling
    const params = await context.params;
    const { conversationId } = params;
    
    console.log('📨 Message sending request:', {
      conversationId,
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
    const body: SendMessageRequest = await request.json();
    const { message, messageType } = body;

    console.log('🚀 Attempting Python library format:', {
      conversationId,
      messageLength: message.length,
      messageType,
      userId: user.id
    });

    // Try the Python library format: simple { body, type } payload
    const messageTypeMap: Record<string, string> = {
      'TYPE_SMS': 'text',
      'TYPE_EMAIL': 'email', 
      'TYPE_WEBCHAT': 'text',
      'TYPE_FACEBOOK': 'text',
      'TYPE_INSTAGRAM': 'text',
      'TYPE_WHATSAPP': 'text',
      'TYPE_GOOGLE_BUSINESS': 'text',
      'TYPE_LIVE_CHAT': 'text'
    };

    const simpleType = messageTypeMap[messageType] || 'text';

    const pythonLibraryPayload = {
      body: message,
      type: simpleType
    };

    console.log('🔄 Trying Python library format:', {
      endpoint: `/conversations/${conversationId}/messages`,
      payload: pythonLibraryPayload
    });

    // Send message using Python library format
    const response = await fetchGhlApiWithRefresh(
      `/conversations/${conversationId}/messages`,
      user.id,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify(pythonLibraryPayload)
      }
    );

    console.log('✅ Python library format SUCCESS:', {
      hasResponse: !!response,
      responseKeys: response ? Object.keys(response) : [],
      conversationId
    });

    return NextResponse.json({
      success: true,
      data: {
        messageId: response?.id || response?.messageId,
        conversationId: conversationId,
        timestamp: new Date().toISOString()
      }
    } satisfies SendMessageResponse);

  } catch (error) {
    console.error('❌ Error sending message:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message'
    } satisfies ErrorResponse, { status: 500 });
  }
}
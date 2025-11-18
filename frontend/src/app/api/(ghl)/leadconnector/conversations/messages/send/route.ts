import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/utils/supabase/getSupabase";
import { fetchGhlApiWithRefresh } from "@/lib/leadconnector/fetchApi";

interface SendMessageRequest {
  type: string; // GHL API uses 'type' not 'messageType'
  message: string; // GHL API uses 'message' not 'body'
  contactId: string; // Required by GHL API
  attachments?: string[];
  emailFrom?: string;
  emailCc?: string[];
  emailBcc?: string[];
  html?: string;
  subject?: string;
  replyMessageId?: string;
  templateId?: string;
  threadId?: string;
  scheduledTimestamp?: number;
  conversationProviderId?: string;
  emailTo?: string;
  emailReplyMode?: string;
  fromNumber?: string;
  toNumber?: string;
  appointmentId?: string;
}

interface SendMessageResponse {
  success: boolean;
  data?: {
    conversationId?: string;
    emailMessageId?: string;
    messageId?: string;
    messageIds?: string[];
    msg?: string;
  };
  error?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SendMessageResponse | ErrorResponse>> {
  try {
    // console.log('📨 GHL Messages API request:', {
    //   timestamp: new Date().toISOString()
    // });

    // Authenticate user
    const supabase = await getSupabase();
    const userData = await supabase.auth.getUser();

    if (!userData.data.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        } satisfies ErrorResponse,
        { status: 401 }
      );
    }

    const user = userData.data.user;

    // Parse request body
    const body: SendMessageRequest = await request.json();
    const { type, message, contactId, ...otherFields } = body;

    if (!contactId) {
      return NextResponse.json(
        {
          success: false,
          error: "Contact ID is required",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // console.log('🚀 Sending message via GHL Messages API:', {
    //   type,
    //   messageLength: message.length,
    //   contactId,
    //   userId: user.id,
    //   hasOtherFields: Object.keys(otherFields).length > 0
    // });

    // Prepare payload for GHL Messages API
    const ghlPayload = {
      type,
      message,
      contactId,
      ...otherFields,
    };

    // console.log('🔄 GHL Messages API payload:', {
    //   endpoint: '/conversations/messages',
    //   payload: ghlPayload
    // });

    // Send message using GHL Messages API
    const response = await fetchGhlApiWithRefresh(
      "/conversations/messages",
      user.id,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Version: "2021-04-15", // Use the version from GHL docs
        },
        body: JSON.stringify(ghlPayload),
      }
    );

    // console.log('✅ GHL Messages API SUCCESS:', {
    //   hasResponse: !!response,
    //   responseKeys: response ? Object.keys(response) : [],
    //   conversationId: response?.conversationId,
    //   messageId: response?.messageId
    // });

    return NextResponse.json({
      success: true,
      data: response,
    } satisfies SendMessageResponse);
  } catch (error) {
    console.error("❌ Error sending message via LeadConnector Messages API:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to send message",
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

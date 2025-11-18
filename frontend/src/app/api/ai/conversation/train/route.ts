// @ts-nocheck

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getSupabase } from '@/utils/supabase/getSupabase';
import { KB_SETTINGS } from '@/utils/ai/knowledgebaseSettings';
import { PROVIDER_TYPE } from '@/utils/config/providerTypes';
import { postFastAPI } from '@/lib/fastapi-utils';

interface Message {
  id: string;
  body: string;
  direction: string;
  dateAdded: string;
  messageType: string;
  contentType: string;
  status: string;
  type: number;
  role: string;
  conversationId: string;
  knowledgebaseId?: string;
  locationId: string;
  contactId: string;
  userId?: string;
  source: string;
  contactName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

interface TrainRequestBody {
  userId?: string;
  conversationId: string;
  messages?: Message[];
  messageCount?: number;
  locationId: string;
  lastMessageId?: string;
  knowledgebaseId?: string;
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    contactId?: string;
  };
  conversationMetadata?: {
    conversationType: string;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
}

interface FastAPIValidationError {
  loc: string[];
  msg: string;
  type: string;
}

interface FastAPIErrorResponse {
  detail: FastAPIValidationError[];
}

const FASTAPI_URL = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
const FALLBACK_USER_ID = 'ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21';

console.log('FastAPI URL configuration:', {
  env: process.env.NEXT_PUBLIC_FASTAPI_URL,
  fallback: 'http://localhost:8000',
  final: FASTAPI_URL
});

// Helper function to extract contact information from messages
function extractContactInfoFromMessages(messages: Message[]): {
  name?: string;
  email?: string;
  phone?: string;
  contactId?: string;
  messageTypes: string[];
  dateRange: { start: string; end: string };
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
} {
  if (!messages.length) {
    return {
      messageTypes: [],
      dateRange: { start: '', end: '' },
      totalMessages: 0,
      inboundMessages: 0,
      outboundMessages: 0
    };
  }

  // Find contact info from inbound messages first, then fallback to any message
  const inboundMessage = messages.find(msg => msg.direction === 'inbound');
  const referenceMessage = inboundMessage || messages[0];
  
  // Extract contact name from various sources
  let contactName = referenceMessage.contactName || 
                   referenceMessage.fullName || 
                   referenceMessage.email?.split('@')[0];

  // Try to parse contact info from webchat messages
  const webchatMessage = messages.find(msg => 
    msg.messageType === 'TYPE_WEBCHAT' && 
    msg.body.includes('Contact Information:')
  );
  
  if (webchatMessage && !contactName) {
    try {
      const lines = webchatMessage.body.split('\\n');
      const nameLine = lines.find(line => line.includes('Name:'));
      if (nameLine) {
        contactName = nameLine.split(':')[1]?.trim();
      }
    } catch (e) {
      console.warn('Failed to parse webchat contact info:', e);
    }
  }

  // Calculate message statistics
  const inboundCount = messages.filter(msg => msg.direction === 'inbound').length;
  const outboundCount = messages.filter(msg => msg.direction === 'outbound').length;
  const messageTypes = [...new Set(messages.map(msg => msg.messageType))];
  
  // Get date range
  const sortedMessages = messages.sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());
  
  return {
    name: contactName,
    email: referenceMessage.email,
    phone: referenceMessage.phone,
    contactId: referenceMessage.contactId,
    messageTypes,
    dateRange: {
      start: sortedMessages[0]?.dateAdded || '',
      end: sortedMessages[sortedMessages.length - 1]?.dateAdded || ''
    },
    totalMessages: messages.length,
    inboundMessages: inboundCount,
    outboundMessages: outboundCount
  };
}

// Helper function to generate descriptive knowledge base name
function generateKnowledgeBaseName(
  conversationId: string, 
  contactInfo: any,
  messageStats: any
): { name: string; description: string } {
  const contactName = contactInfo?.name || contactInfo?.email?.split('@')[0] || 'Unknown Contact';
  const shortConvId = conversationId.substring(0, 8);
  
  // Create primary name
  let name = `${contactName} - Conversation`;
  
  // Add date if available
  if (messageStats.dateRange.start) {
    const startDate = new Date(messageStats.dateRange.start);
    const month = startDate.toLocaleDateString('en-US', { month: 'short' });
    const day = startDate.getDate();
    name += ` (${month} ${day})`;
  }
  
  // Truncate if too long and add ID for uniqueness
  if (name.length > 50) {
    name = `${contactName.substring(0, 20)}... - Conv (${shortConvId})`;
  }
  
  // Generate description
  const messageTypeNames = messageStats.messageTypes.map((type: string) => {
    switch (type) {
      case 'TYPE_SMS': return 'SMS';
      case 'TYPE_WEBCHAT': return 'Web Chat';
      case 'TYPE_EMAIL': return 'Email';
      case 'TYPE_PHONE': return 'Phone';
      default: return type.replace('TYPE_', '').toLowerCase();
    }
  }).join(', ');
  
  const description = `Conversation with ${contactName} containing ${messageStats.totalMessages} messages (${messageStats.inboundMessages} inbound, ${messageStats.outboundMessages} outbound) via ${messageTypeNames}. ${messageStats.dateRange.start ? `From ${new Date(messageStats.dateRange.start).toLocaleDateString()} to ${new Date(messageStats.dateRange.end).toLocaleDateString()}.` : ''}`;
  
  return { name, description };
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Get current user or use fallback for development
    const user = await getCurrentUser();
    const userId = user?.id || FALLBACK_USER_ID;

    // Parse and validate request body
    const body = await req.json() as TrainRequestBody;
    
    if (!body.conversationId || !body.locationId) {
      return Response.json({
        success: false,
        error: 'Missing required fields: conversationId, locationId'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Handle case where no messages are provided
    const messages = body.messages || [];
    const hasMessages = messages.length > 0;

    if (!hasMessages) {
      console.log('Training conversation with no messages - using metadata only:', {
        conversationId: body.conversationId,
        locationId: body.locationId,
        contactInfo: body.contactInfo
      });
    }

    // Extract enhanced contact information from messages (if any)
    const extractedContactInfo = hasMessages ? extractContactInfoFromMessages(messages) : {
      name: undefined,
      email: undefined,
      phone: undefined,
      contactId: undefined,
      messageTypes: [],
      dateRange: { start: new Date().toISOString(), end: new Date().toISOString() },
      totalMessages: 0,
      inboundMessages: 0,
      outboundMessages: 0
    };
    
    // Merge provided contact info with extracted info (provided takes precedence)
    const finalContactInfo = {
      ...extractedContactInfo,
      ...body.contactInfo
    };

    console.log('Training conversation request:', {
      userId: userId,
      conversationId: body.conversationId,
      messageCount: messages.length,
      locationId: body.locationId,
      hasMessages,
      contactInfo: {
        name: finalContactInfo.name,
        email: finalContactInfo.email,
        phone: finalContactInfo.phone,
        messageTypes: extractedContactInfo.messageTypes,
        dateRange: extractedContactInfo.dateRange
      }
    });

    // Prepare the request payload for FastAPI
    const requestPayload = {
      userId: userId,
      conversationId: body.conversationId,
      messages: hasMessages ? messages.map(msg => ({
        ...msg,
        userId: userId,
        knowledgebaseId: body.knowledgebaseId || body.conversationId
      })) : [],
      messageCount: messages.length,
      locationId: body.locationId,
      lastMessageId: body.lastMessageId,
      knowledgebaseId: body.knowledgebaseId || body.conversationId,
      generateSummary: true, // Request summary generation
      // Add metadata for training without messages
      metadata: {
        conversationId: body.conversationId,
        locationId: body.locationId,
        contactInfo: finalContactInfo,
        conversationType: body.conversationMetadata?.conversationType || 'TYPE_SMS',
        hasMessages: hasMessages
      }
    };

    console.log('FastAPI training request payload:', {
      userId: requestPayload.userId,
      conversationId: requestPayload.conversationId,
      messageCount: requestPayload.messageCount,
      locationId: requestPayload.locationId,
      knowledgebaseId: requestPayload.knowledgebaseId,
      hasMessages,
      fastApiUrl: `${FASTAPI_URL}/ai/conversation/train`
    });

    // Forward to FastAPI backend
    let data;
    try {
      data = await postFastAPI('/ai/conversation/train', requestPayload, { userId });
      console.log('FastAPI training response received:', {
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : []
      });
    } catch (fetchError) {
      console.error('Error calling FastAPI:', fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      if (errorMessage?.includes('Cannot connect') || errorMessage?.includes('fetch failed')) {
        throw new Error(`Cannot connect to FastAPI server at ${FASTAPI_URL}. Please ensure the FastAPI server is running with: uvicorn main:app --reload --port 8000`);
      }
      throw new Error(`FastAPI training failed: ${errorMessage}`);
    }

    // Check if we have valid response data
    if (!data) {
      throw new Error('No response data received from FastAPI');
    }

    console.log('FastAPI training response data:', {
      success: data.success,
      hasMessage: !!data.message,
      hasKnowledgebaseId: !!data.knowledgebaseId
    });

    // Handle errors from FastAPI
    if (!data.success) {
      console.error('FastAPI training error:', data);
      
      // Handle validation errors
      if (data.detail && Array.isArray(data.detail)) {
        const validationErrors = (data as FastAPIErrorResponse).detail
          .map(err => `${err.loc.join('.')}: ${err.msg}`)
          .join(', ');
        throw new Error(`Validation error: ${validationErrors}`);
      }
      
      const errorMsg = data.message || 'Failed to train conversation';
      throw new Error(errorMsg);
    }

    console.log('Training completed successfully, now generating summary and saving to knowledge base:', {
      conversationId: body.conversationId,
      success: data.success,
      message: data.message,
      trainingData: data.data
    });

    // Generate summary from FastAPI after successful training
    let generatedSummary = data.data?.summary || data.summary;
    
    if (!generatedSummary) {
      try {
        console.log('Generating summary from FastAPI after training...');
        const summaryData = await postFastAPI('/ai/conversation/summary', {
          userId: userId,
          conversationId: body.conversationId,
          messages: messages,
          knowledgebaseId: body.knowledgebaseId || body.conversationId
        }, { userId });

        if (summaryData && summaryData.summary) {
          generatedSummary = summaryData.summary;
          console.log('Summary generated successfully:', {
            summaryLength: generatedSummary.length,
            summaryPreview: generatedSummary.substring(0, 100) + '...'
          });
        } else {
          console.warn('No summary returned from FastAPI summary endpoint');
        }
      } catch (summaryError) {
        console.error('Error generating summary from FastAPI:', summaryError);
      }
    }

    // Save training results to Supabase knowledge base
    try {
      const supabase = await getSupabase();
      
      // Generate descriptive name and description
      const { name: kbName, description: kbDescription } = generateKnowledgeBaseName(
        body.conversationId,
        finalContactInfo,
        extractedContactInfo
      );
      
      // Prepare enhanced training data for storage
      const trainingData = {
        message_count: messages.length,
        last_message_id: body.lastMessageId,
        date_range: data.data?.dateRange || extractedContactInfo.dateRange,
        trained_at: new Date().toISOString(),
        vector_count: data.data?.vectorCount || messages.length,
        query_history: [],
        // Enhanced contact and conversation metadata
        contact_info: {
          name: finalContactInfo.name,
          email: finalContactInfo.email,
          phone: finalContactInfo.phone,
          contactId: finalContactInfo.contactId
        },
        conversation_stats: {
          total_messages: extractedContactInfo.totalMessages,
          inbound_messages: extractedContactInfo.inboundMessages,
          outbound_messages: extractedContactInfo.outboundMessages,
          message_types: extractedContactInfo.messageTypes,
          primary_channel: extractedContactInfo.messageTypes[0] || 'TYPE_SMS'
        },
        auto_generated_description: kbDescription
      };

      // Use enhanced summary or generate one with contact info
      const summaryText = generatedSummary || 
        `Conversation with ${finalContactInfo.name || 'customer'} containing ${messages.length} messages. ${kbDescription}`;

      // Check if knowledge base already exists for this conversation
      const { data: existingKb, error: checkError } = await supabase
        .from('knowledge_bases')
        .select('*')
        .eq('user_id', userId)
        .eq('type', KB_SETTINGS.KB_CONVERSATION.type)
        .eq('provider_type_sub_id', body.conversationId)
        .single();

      if (existingKb) {
        // Update existing knowledge base
        const { error: updateError } = await supabase
          .from('knowledge_bases')
          .update({
            data: trainingData,
            summary: summaryText,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingKb.id);

        if (updateError) {
          console.error('Error updating knowledge base:', updateError);
        } else {
          console.log('Knowledge base updated successfully with enhanced info:', {
            conversationId: body.conversationId,
            name: kbName,
            contactName: finalContactInfo.name,
            description: kbDescription
          });
        }
      } else {
        // Create new knowledge base entry with enhanced naming
        const { error: insertError } = await supabase
          .from('knowledge_bases')
          .insert({
            name: kbName, // Use descriptive name instead of generic one
            type: KB_SETTINGS.KB_CONVERSATION.type,
            user_id: userId,
            provider_type: PROVIDER_TYPE.GHL_LOCATION,
            provider_type_sub_id: body.conversationId,
            data: trainingData,
            summary: summaryText,
            faq: []
          });

        if (insertError) {
          console.error('Error creating knowledge base:', insertError);
          // Don't fail training if KB creation fails
        } else {
          console.log('Knowledge base created successfully with enhanced info:', {
            conversationId: body.conversationId,
            name: kbName,
            contactName: finalContactInfo.name,
            description: kbDescription
          });
        }
      }
    } catch (kbError) {
      console.error('Error saving to knowledge base:', kbError);
      // Don't fail the training if KB save fails - training was successful in FastAPI
    }

    console.log('Training completed successfully with enhanced metadata:', {
      conversationId: body.conversationId,
      success: data.success,
      message: data.message,
      contactName: finalContactInfo.name
    });

    // Return response in expected format with enhanced info
    return Response.json({
      success: true,
      data: {
        message: data.message || 'Training completed successfully',
        conversationId: body.conversationId,
        messageCount: messages.length,
        knowledgeBaseSaved: true,
        contactInfo: finalContactInfo,
        knowledgeBaseName: generateKnowledgeBaseName(body.conversationId, finalContactInfo, extractedContactInfo).name,
        ...data.data
      }
    });

  } catch (error) {
    console.error('Error training conversation:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

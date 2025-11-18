// @ts-nocheck

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getSupabase } from '@/utils/supabase/getSupabase';
import { KB_SETTINGS } from '@/utils/ai/knowledgebaseSettings';
import { validateAIConfig } from '@/utils/ai/config/aiSettings';
import { postFastAPI } from '@/lib/fastapi-utils';

interface SummaryRequestBody {
  userId?: string;
  conversationId: string;
  locationId?: string;
  regenerate?: boolean;
  messages?: any[]; // Add missing messages property
  knowledgebaseId?: string; // Add missing knowledgebaseId property
  filters?: {
    [key: string]: any;
  };
  // New AI configuration parameters
  temperature?: number;
  model?: string;
  humanlikeBehavior?: boolean;
}

interface SummaryResponse {
  success: boolean;
  summary: string;
  metadata: {
    conversationId: string;
    userId: string;
    messageCount: number;
    dateRange: {
      start: string;
      end: string;
    };
    lastMessageId?: string;
    queryHistory?: any[];
  };
  is_trained: boolean;
  error_code?: string;
  recommendations?: string[];
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

const FASTAPI_URL = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
const FALLBACK_USER_ID = 'ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Get current user or use fallback for development
    const user = await getCurrentUser();
    const userId = user?.id || FALLBACK_USER_ID;

    // Parse and validate request body
    const body = await req.json() as SummaryRequestBody;
    
    if (!body.conversationId) {
      return Response.json({
        success: false,
        error: 'Missing required fields'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Validate and merge AI configuration
    const aiConfig = validateAIConfig({
      model: body.model,
      temperature: body.temperature,
      humanlikeBehavior: body.humanlikeBehavior
    });

    console.log('Summary request:', {
      userId: userId,
      conversationId: body.conversationId,
      regenerate: body.regenerate,
      aiConfig: {
        model: aiConfig.model,
        temperature: aiConfig.temperature,
        humanlikeBehavior: aiConfig.humanlikeBehavior
      }
    });

    const supabase = await getSupabase();

    // Get conversation summary from knowledge base
    const { data: kbData, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('user_id', userId)
      .eq('type', KB_SETTINGS.KB_CONVERSATION.type)
      .eq('provider_type_sub_id', body.conversationId)
      .single();

    if (kbError || !kbData) {
      console.error('Conversation not found in knowledge base:', kbError);
      return Response.json({
        success: false,
        summary: '',
        metadata: {
          conversationId: body.conversationId,
          userId: userId,
          messageCount: 0,
          dateRange: { start: '', end: '' }
        },
        is_trained: false,
        error_code: 'CONVERSATION_NOT_TRAINED',
        recommendations: [
          'Train the conversation first to generate a summary',
          'Use AI features like queries or responses to trigger automatic training',
          'Make sure the FastAPI server is running on port 8000'
        ],
        timestamp: new Date().toISOString()
      } satisfies SummaryResponse);
    }

    // Extract data from knowledge base
    const conversationData = kbData.data || {};
    let summary = kbData.summary;

    // If regenerate flag is true or no summary exists or it's just a default message, try to generate one from FastAPI
    if (body.regenerate || !summary || summary.includes('trained successfully')) {
      console.log(body.regenerate ? 'Force regenerating summary from FastAPI...' : 'No proper summary found, generating from FastAPI...');
      
      try {
        const data = await postFastAPI('/ai/conversation/summary', {
          userId: userId,
          conversationId: body.conversationId,
          messages: body.messages || [],
          knowledgebaseId: body.knowledgebaseId || body.conversationId,
          locationId: body.locationId,
          // Include AI configuration parameters
          temperature: aiConfig.temperature,
          model: aiConfig.model,
          humanlikeBehavior: aiConfig.humanlikeBehavior
        }, { userId });

        if (data.summary) {
          summary = data.summary;
          
          // Save the generated summary back to the knowledge base with AI config metadata
          const { error: updateError } = await supabase
            .from('knowledge_bases')
            .update({
              summary: summary,
              updated_at: new Date().toISOString(),
              data: {
                ...conversationData,
                last_ai_config: {
                  model: aiConfig.model,
                  temperature: aiConfig.temperature,
                  humanlikeBehavior: aiConfig.humanlikeBehavior
                }
              }
            })
            .eq('id', kbData.id);
          
          if (updateError) {
            console.error('Error saving regenerated summary:', updateError);
          } else {
            console.log('Summary generated and saved with AI config:', {
              summary: summary.substring(0, 100) + '...',
              aiConfig
            });
          }
        }
      } catch (summaryError) {
        console.error('Error generating summary from FastAPI:', summaryError);
        // Continue with existing summary or default
      }
    }

    // Use fallback summary if still none available
    if (!summary) {
      summary = `Conversation ${body.conversationId} contains ${conversationData.message_count || 0} messages. Summary generation is in progress.`;
    }
    
    const response: SummaryResponse = {
      success: true,
      summary,
      metadata: {
        conversationId: body.conversationId,
        userId: userId,
        messageCount: conversationData.message_count || 0,
        dateRange: conversationData.date_range || {
          start: kbData.created_at,
          end: kbData.updated_at
        },
        lastMessageId: conversationData.last_message_id,
        queryHistory: conversationData.query_history || []
      },
      is_trained: true,
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Add recommendations based on data quality
    const messageCount = response.metadata.messageCount || 0;
    if (messageCount === 0) {
      response.recommendations?.push('No messages found in training data');
    } else if (messageCount < 5) {
      response.recommendations?.push(`Only ${messageCount} messages trained - summaries work best with 5+ messages`);
    }

    if (summary.includes('trained successfully') || summary.includes('Summary generation is in progress')) {
      response.recommendations?.push('Summary is auto-generated - consider re-training for more detailed summary');
    }

    console.log('Summary retrieved/generated:', {
      conversationId: body.conversationId,
      summaryLength: summary.length,
      messageCount: response.metadata.messageCount,
      queryHistoryCount: response.metadata.queryHistory?.length || 0,
      wasGenerated: !kbData.summary || kbData.summary.includes('trained successfully')
    });

    return Response.json(response);

  } catch (error) {
    console.error('Error in conversation summary:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
} 
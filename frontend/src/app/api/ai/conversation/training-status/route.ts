// @ts-nocheck

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getSupabase } from '@/utils/supabase/getSupabase';
import { KB_SETTINGS } from '@/utils/ai/knowledgebaseSettings';
import { validateAIConfig } from '@/utils/ai/config/aiSettings';

interface TrainingStatusRequestBody {
  conversationId: string;
  locationId?: string;
  temperature?: number;
  model?: string;
  humanlikeBehavior?: boolean;
  filters?: {
    [key: string]: any;
  };
}

interface TrainingStatusResponse {
  is_trained: boolean;
  last_updated?: string;
  message_count?: number;
  vector_count?: number;
  last_message_id?: string;
  summary?: string;
  query_count?: number;
  training_required?: boolean;
  recommendations?: string[];
}

interface ErrorResponse {
  success: false;
  error: string;
}

const FALLBACK_USER_ID = 'ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Get current user or use fallback for development
    const user = await getCurrentUser();
    const userId = user?.id || FALLBACK_USER_ID;

    // Parse and validate request body
    const body = await req.json() as TrainingStatusRequestBody;
    
    if (!body.conversationId) {
      return Response.json({
        success: false,
        error: 'Missing required fields'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Validate AI configuration if provided
    const aiConfig = validateAIConfig({
      model: body.model,
      temperature: body.temperature,
      humanlikeBehavior: body.humanlikeBehavior
    });

    console.log('Training status request:', {
      userId: userId,
      conversationId: body.conversationId,
      aiConfig: {
        model: aiConfig.model,
        temperature: aiConfig.temperature,
        humanlikeBehavior: aiConfig.humanlikeBehavior
      }
    });

    const supabase = await getSupabase();

    // Check if conversation exists in knowledge base
    const { data: kbData, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('user_id', userId)
      .eq('type', KB_SETTINGS.KB_CONVERSATION.type)
      .eq('provider_type_sub_id', body.conversationId)
      .single();

    if (kbError || !kbData) {
      // Conversation not trained yet - provide helpful response
      console.log('Conversation not found in knowledge base:', kbError?.message);
      return Response.json({
        is_trained: false,
        message_count: 0,
        vector_count: 0,
        training_required: true,
        recommendations: [
          'Training will start automatically when you interact with AI features',
          'Training enables AI features like suggestions and auto-pilot',
          'Make sure the FastAPI server is running on port 8000'
        ]
      } satisfies TrainingStatusResponse);
    }

    // Extract training data
    const conversationData = kbData.data || {};
    const response: TrainingStatusResponse = {
      is_trained: true,
      last_updated: kbData.updated_at,
      message_count: conversationData.message_count || 0,
      vector_count: conversationData.vector_count || 0,
      last_message_id: conversationData.last_message_id,
      summary: kbData.summary,
      query_count: conversationData.query_history?.length || 0,
      training_required: false,
      recommendations: []
    };

    // Add recommendations based on training status
    const messageCount = response.message_count || 0;
    if (messageCount === 0) {
      response.recommendations?.push('No messages found in training data');
    } else if (messageCount < 5) {
      response.recommendations?.push(`Only ${messageCount} messages trained - AI works best with 5+ messages`);
    }

    if (!response.summary) {
      response.recommendations?.push('No summary available - consider re-training to generate summary');
    }

    console.log('Training status retrieved from database:', {
      conversationId: body.conversationId,
      isTrained: response.is_trained,
      messageCount: response.message_count,
      vectorCount: response.vector_count,
      queryCount: response.query_count,
      hasRecommendations: response.recommendations?.length || 0
    });

    return Response.json(response);

  } catch (error) {
    console.error('Error checking training status:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
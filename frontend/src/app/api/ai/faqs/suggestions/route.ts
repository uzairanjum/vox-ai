import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getSupabase } from '@/utils/supabase/getSupabase';
import { postFastAPI } from '@/lib/fastapi-utils';

interface GenerateFaqSuggestionsRequestBody {
  conversationId?: string;
  content?: string;
  count?: number;
  metadata?: {
    context?: string;
    language?: string;
    style?: 'concise' | 'detailed';
  };
}

interface FaqSuggestion {
  question: string;
  answer: string;
  confidence: number;
  metadata?: {
    source?: string;
    context?: string;
    category?: string;
  };
}

interface GenerateFaqSuggestionsResponse {
  suggestions: FaqSuggestion[];
  metadata?: {
    totalGenerated: number;
    processingTime: number;
    sourceContext?: string;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
}

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    // Parse request body
    const body = await req.json() as GenerateFaqSuggestionsRequestBody;
    
    // Must provide either conversation_id or content
    // Validate request
    if (!body.conversationId && !body.content) {
      return Response.json({
        success: false,
        error: 'Must provide either conversationId or content'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Log request for debugging
    console.log('Generate FAQ suggestions request:', JSON.stringify({
      userId: user.id,
      conversationId: body.conversationId,
      contentLength: body.content?.length,
      count: body.count,
      metadata: body.metadata
    }, null, 2));

    const data = await postFastAPI('/ai/conversation/suggestions/enhanced', {
      userId: user.id,
      conversationId: body.conversationId,
      query: body.content,
      context: body.metadata?.context || '',
      knowledgebaseId: body.conversationId,
      limit: body.count || 5,
      temperature: 0.7,
      model: 'gpt-4o-mini'
    }, { userId: user.id });

    // Validate response has required fields
    if (!data.suggestions || !Array.isArray(data.suggestions)) {
      throw new Error('Invalid response format from server');
    }

    return Response.json(data);

  } catch (error) {
    console.error('Error generating FAQ suggestions:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}
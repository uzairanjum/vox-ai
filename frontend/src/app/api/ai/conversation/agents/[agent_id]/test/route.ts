import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getAgentById } from '@/utils/database/aiAgentUtils';

interface TestAgentRequest {
  query?: string;
  conversationId?: string;
  [key: string]: any;
}

interface ErrorResponse {
  success: false;
  error: string;
}

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
const FALLBACK_USER_ID = 'ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21';

// POST - Test agent with actual AI call using agent configuration + conversation KB + additional KBs
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agent_id: string }> }
): Promise<Response> {
  try {
    // Get current user or use fallback
    const user = await getCurrentUser();
    const userId = user?.id || FALLBACK_USER_ID;

    const { agent_id } = await params;
    if (!agent_id) {
      return Response.json({
        success: false,
        error: 'Agent ID is required'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const requestUserId = searchParams.get('userId') || userId;

    // Parse request body
    const body = await req.json() as TestAgentRequest;
    const testQuery = body.query || 'Hello, how can you help me?';
    const conversationId = body.conversationId || 'test-conversation-' + Date.now();
    
    console.log('Test agent request:', {
      agentId: agent_id,
      userId: requestUserId,
      query: testQuery,
      conversationId: conversationId
    });

    // Get agent from database
    const agentResult = await getAgentById(agent_id, requestUserId);
    
    if (!agentResult.success || !agentResult.data) {
      return Response.json({
        success: false,
        error: 'Agent not found'
      } satisfies ErrorResponse, { status: 404 });
    }

    const agent = agentResult.data;
    
    // Prepare knowledge base IDs
    const knowledgebaseIds = [];
    
    // 1. Add conversation knowledge base (mandatory/primary)
    knowledgebaseIds.push(conversationId);
    
    // 2. Add agent's additional knowledge bases (if any)
    if (agent.knowledge_base_ids && agent.knowledge_base_ids.length > 0) {
      knowledgebaseIds.push(...agent.knowledge_base_ids);
    }
    
    // Prepare the API request payload for FastAPI
    const apiPayload = {
      userId: requestUserId,
      conversationId: conversationId,
      query: testQuery,
      systemPrompt: agent.system_prompt,
      knowledgebaseId: conversationId, // Primary conversation KB
      knowledgebaseIds: knowledgebaseIds, // All KBs (conversation + additional)
      additionalKnowledgebaseIds: agent.knowledge_base_ids || [], // Additional KBs only
      agentInfo: {
        id: agent.id,
        name: agent.name,
        prompt: agent.system_prompt,
        type: agent.type
      },
      temperature: agent.data?.responseConfig?.temperature || 0.7,
      model: 'gpt-4o-mini',
      humanlikeBehavior: false
    };

    console.log('Calling FastAPI with agent configuration:', {
      agentName: agent.name,
      agentType: agent.type,
      hasSystemPrompt: !!agent.system_prompt,
      conversationKB: conversationId,
      additionalKBCount: agent.knowledge_base_ids?.length || 0,
      totalKBCount: knowledgebaseIds.length,
      temperature: apiPayload.temperature
    });

    // Call the FastAPI query endpoint with agent configuration
    const { postFastAPI } = await import('@/lib/fastapi-utils');
    
    const data = await postFastAPI('/ai/conversation/query', apiPayload, {
      userId: userId
    });

    console.log('Agent test successful:', {
      agentId: agent_id,
      testMode: body.test_mode || 'query',
      hasAnswer: !!data.answer,
      responseLength: data.answer?.length || 0
    });

    return Response.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error testing agent:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
} 
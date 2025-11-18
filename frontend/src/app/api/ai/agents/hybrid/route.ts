import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { 
  getUserAgents, 
  createAgent, 
} from '@/utils/database/aiAgentUtils';
import { AGENT_TYPES, AIAgentInsert, AgentType } from '@/types/aiAgent';

interface ErrorResponse {
  success: false;
  error: string;
}

const FALLBACK_USER_ID = 'ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21';

// GET - List hybrid agents (both database + default agents)
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || FALLBACK_USER_ID;

    const { searchParams } = new URL(req.url);
    const agentType = searchParams.get('agentType');

    console.log('Hybrid agents list request:', {
      userId,
      agentType: agentType || null
    });

    const agentTypeFilter = agentType ? parseInt(agentType) : undefined;
    const result = await getUserAgents(userId, {
      type: agentTypeFilter,
      is_active: true
    });
      
    if (!result.success) {
      console.error('Error fetching agents from database:', result.error);
      return Response.json({ 
        success: false,
        error: result.error
      } satisfies ErrorResponse, { status: 500 });
    }

    const { agents, total } = result.data;

    const agentTypes = agents.map(agent => ({
      id: agent.id,
      type: getAgentTypeString(agent.type),
      name: agent.name
    }));

    console.log('Hybrid agents response (database only):', {
      databaseCount: agents.length,
      totalCount: total,
      agentTypes
    });

    return Response.json({
      success: true,
      agents,
      total,
      agentTypes
    });

  } catch (error) {
    console.error('Error in hybrid agents GET:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

// POST - Create new agent directly in database (bypass FastAPI)
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || FALLBACK_USER_ID;

    const body = await req.json();
    
    if (!body.name || !body.agentType || !body.personality || !body.intent) {
      return Response.json({
        success: false,
        error: 'Missing required fields: name, agentType, personality, intent'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Ensure required top-level fields for insert
    const tag: string = typeof body.tag === 'string' && body.tag.trim() ? body.tag.trim() : 'general';
    const model: string = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : 'default';

    console.log('Creating agent directly in database:', {
      userId,
      name: body.name,
      agentType: body.agentType,
      tag,
      model
    });

    const agentTypeMapping: Record<string, number> = {
      'query': AGENT_TYPES.QUERY,
      'suggestions': AGENT_TYPES.SUGGESTIONS,
      'response': AGENT_TYPES.AUTOPILOT,
      'autopilot': AGENT_TYPES.AUTOPILOT,
      'generic': AGENT_TYPES.GENERIC
    };

    const generateSystemPrompt = (type: number, data: any): string => {
      const basePrompt = `You are a ${getAgentTypeString(type)} AI agent named "${body.name}".`;
      const personalityPrompt = `Personality: ${data.personality}`;
      const intentPrompt = `Intent: ${data.intent}`;
      
      return [basePrompt, personalityPrompt, intentPrompt]
        .filter(Boolean)
        .join('\n\n');
    };

    const agentType = agentTypeMapping[body.agentType] || AGENT_TYPES.QUERY;

    const agentData: AIAgentInsert = {
      name: body.name,
      type: agentType as AgentType,
      user_id: userId,
      description: body.description || '',
      knowledge_base_ids: body.knowledgeBaseIds || [],
      system_prompt: generateSystemPrompt(agentType, {
        personality: body.personality,
        intent: body.intent,
      }),
      // ✅ required fields on AIAgentInsert
      tag,
      model,
      data: {
        personality: body.personality,
        intent: body.intent,
        variables: body.variables || {},
        responseConfig: body.modelConfig || {
          maxTokens: 2048,
          temperature: 0.7,
          topP: 1.0,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        knowledgeBase: {
          preferredSources: body.knowledgeBaseIds || [],
          searchStrategy: 'hybrid',
          confidenceThreshold: 0.7,
          maxSources: 5,
          citeSources: true
        },
        metadata: {
          version: '1.0.0',
          createdBy: 'user',
          lastModifiedBy: userId,
          tags: [body.agentType],
          category: body.agentType,
          isActive: true,
          isDefault: false,
          isPublic: false
        }
      }
    };

    const result = await createAgent(agentData);

    if (!result.success) {
      console.error('Error creating agent in database:', result.error);
      return Response.json({
        success: false,
        error: result.error
      } satisfies ErrorResponse, { status: 500 });
    }

    console.log('✅ Agent created successfully in database:', result.data.id);

    return Response.json({
      success: true,
      agent: result.data,
      message: 'Agent created successfully'
    });

  } catch (error) {
    console.error('Error creating agent:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

function getAgentTypeString(type: number): string {
  switch (type) {
    case AGENT_TYPES.GENERIC: return 'generic';
    case AGENT_TYPES.QUERY: return 'query';
    case AGENT_TYPES.SUGGESTIONS: return 'suggestions';
    case AGENT_TYPES.AUTOPILOT: return 'autopilot';
    case AGENT_TYPES.CUSTOM: return 'custom';
    default: return 'unknown';
  }
}

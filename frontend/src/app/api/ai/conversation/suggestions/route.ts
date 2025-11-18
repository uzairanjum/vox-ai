import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { validateAIConfig } from '@/utils/ai/config/aiSettings';
import { postFastAPI, getFastAPI } from '@/lib/fastapi-utils';
import { cache } from 'react';

interface SuggestionsRequestBody {
  userId?: string;
  conversationId: string;
  query?: string;
  context?: string;
  knowledgebaseId?: string;
  limit?: number;
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    contactId?: string;
  };
  recentMessages?: Array<{
    id: string;
    body: string;
    dateAdded: string;
    locationId?: string;
    contactId?: string;
    conversationId?: string;
    direction: string;
    messageType?: string;
    contentType?: string;
    status?: string;
    type?: number;
    role?: string;
    source?: string;
  }>;
  // New AI configuration parameters
  temperature?: number;
  model?: string;
  humanlikeBehavior?: boolean;
  additionalKnowledgebaseIds?: string[];
  aiAgentId?: string;
}

interface SuggestionsResponse {
  suggestions: string[];
  total: number;
  conversationId: string;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

const FASTAPI_URL = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

console.log('FastAPI URL configuration:', {
  serverEnv: process.env.FASTAPI_URL,
  clientEnv: process.env.NEXT_PUBLIC_FASTAPI_URL,
  fallback: 'http://localhost:8000',
  final: FASTAPI_URL
});

// Implement caching for global AI settings to reduce database queries
const getCachedGlobalSettings = cache(async () => {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || `http://localhost:${process.env.PORT || 3000}`;
  console.log('Fetching global AI settings from API');
  const globalSettingsResponse = await fetch(`${baseUrl}/api/ai/settings/global`);
  if (globalSettingsResponse.ok) {
    const globalData = await globalSettingsResponse.json();
    if (globalData.success && globalData.data) {
      return globalData.data;
    }
  }
  return null;
});

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Enforce proper authentication for production readiness
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({
        success: false,
        error: 'Authentication required'
      } satisfies ErrorResponse, { status: 401 });
    }
    const userId = user.id;

    // Parse and validate request body
    const body = await req.json() as SuggestionsRequestBody;
    
    if (!body.conversationId) {
      return Response.json({
        success: false,
        error: 'Missing required field: conversationId'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Validate and merge AI configuration
    const aiConfig = validateAIConfig({
      model: body.model,
      temperature: body.temperature,
      humanlikeBehavior: body.humanlikeBehavior
    });

    // Get conversation settings to find selected agent ID (suggestions feature)
    let selectedAgentId = null;
    let additionalKnowledgebaseIds = [];
    let agentPrompt = 'You are a helpful AI assistant.'; // Default system prompt
    let agentName = 'Default Assistant';
    
    try {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || `http://localhost:${process.env.PORT || 3000}`;
      const settingsResponse = await fetch(`${baseUrl}/api/conversation-meta?conversationId=${body.conversationId}`);
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData.success && settingsData.data?.data?.agents?.suggestions) {
          selectedAgentId = settingsData.data.data.agents.suggestions;
          console.log('🎯 Found selected agent for suggestions:', selectedAgentId);
          
          // Fetch agent details to get prompt and name
          try {
            const agentResponse = await fetch(`${baseUrl}/api/ai/agents/${selectedAgentId}`);
            if (agentResponse.ok) {
              const agentData = await agentResponse.json();
              if (agentData.success && agentData.data) {
                agentPrompt = agentData.data.prompt || agentData.data.system_prompt || 'You are a helpful AI assistant.';
                agentName = agentData.data.name || 'Custom Agent';
                console.log('🤖 Retrieved agent details:', { agentId: selectedAgentId, agentName, promptLength: agentPrompt.length });
              }
            }
          } catch (agentError) {
            console.log('⚠️  Could not fetch agent details, using defaults:', agentError instanceof Error ? agentError.message : 'Unknown error');
          }
        }
        
        // Get additional knowledge base IDs from conversation settings
        if (settingsData.data?.data?.knowledgeBaseIds) {
          const settingsKBIds = settingsData.data.data.knowledgeBaseIds.filter((id: string) => id !== body.conversationId);
          additionalKnowledgebaseIds = settingsKBIds;
        }
      }
    } catch (error) {
      console.log('⚠️  Could not load conversation settings for suggestions agent:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Log request for debugging
    console.log('🤖 Conversation Suggestions AI Configuration:', {
      conversationId: body.conversationId,
      queryLength: body.query?.length || 0,
      contextLength: body.context?.length || 0,
      recentMessagesCount: body.recentMessages?.length || 0,
      limit: body.limit || 3,
      selectedAgentId: selectedAgentId || 'default',
      agentName: agentName,
      agentPromptLength: agentPrompt.length,
      additionalKBCount: additionalKnowledgebaseIds.length,
      aiConfig: {
        model: aiConfig.model,
        temperature: aiConfig.temperature,
        humanlikeBehavior: aiConfig.humanlikeBehavior
      }
    });

    // Detect new/empty conversation and enhance prompting
    const isNewConversation = !body.recentMessages || body.recentMessages.length === 0;
    // Removed any checks for minimum message count to allow AI suggestions without prior messages
    const validMessages = body.recentMessages?.filter(msg => msg.body && msg.body.trim().length > 0) || [];
    
    // Extract customer information for personalization
    const customerInfo = body.customerInfo || {};
    const customerName = customerInfo.name || (customerInfo as any).contactName || (customerInfo as any).fullName;
    const customerEmail = customerInfo.email;
    
    let enhancedQuery = body.query || 'Generate suggestions for this conversation';
    let enhancedContext = body.context || '';
    
    // Enhanced prompting for new/empty conversations using customer context
    if (isNewConversation) {
      console.log('🆕 New conversation detected - generating contextual greeting using customer info and knowledge base');
      
      if (customerName) {
        enhancedQuery = `Generate personalized conversation starters for customer: ${customerName}`;
        enhancedContext = `Create personalized conversation starters for ${customerName}${customerEmail ? ` (${customerEmail})` : ''}. 

Use the following approach:
1. Address ${customerName} by name naturally
2. Use conversation knowledge base (ID: ${body.conversationId}) to find relevant business information
3. Create value-driven opening messages that show understanding of potential customer needs
4. Ask engaging questions that encourage detailed responses
5. Reference any relevant services or information from the knowledge base

Generate professional, personalized conversation starters that feel helpful and targeted, not generic.

CUSTOMER CONTEXT:
- Name: ${customerName}
- Email: ${customerEmail || 'Not provided'}
- Business Context: Use knowledge base for relevant information`;
      } else {
        enhancedQuery = 'Generate contextual conversation starters using business knowledge';
        enhancedContext = `Generate professional conversation starters using business knowledge base information.

Since customer name is not available, create engaging opening messages that:
1. Introduce your services professionally using knowledge base information
2. Ask relevant questions to understand customer needs
3. Provide immediate value based on business expertise
4. Encourage customers to share their specific requirements
5. Reference relevant business capabilities from the knowledge base

Use conversation knowledge base (ID: ${body.conversationId}) for relevant business context.

Focus on being helpful and informative while encouraging engagement.`;
      }
      
    } else {
      console.log('💬 Standard conversation - enhancing with customer personalization and knowledge base context');
      
      if (customerName && !enhancedContext.includes(customerName)) {
        enhancedContext = `CUSTOMER: ${customerName}
${customerEmail ? `EMAIL: ${customerEmail}` : ''}

${enhancedContext}

Generate suggestions that:
1. Address ${customerName} personally in responses
2. Use knowledge base information for relevant assistance
3. Provide helpful, contextual suggestions based on conversation history
4. Include appropriate next steps or solutions
5. Maintain a professional, helpful tone

Use the conversation knowledge base for relevant business information.`;
      }
    }

    // Use cached global settings for conversation behavior
    let conversationBehavior = 'greeting'; // default
    try {
      const globalSettings = await getCachedGlobalSettings();
      if (globalSettings && globalSettings.conversation_starters_enabled) {
        conversationBehavior = globalSettings.new_conversation_behavior || 'greeting';
        console.log('🌐 Using cached global conversation behavior:', conversationBehavior);
      }
    } catch (error) {
      console.log('⚠️ Could not load cached global AI settings, using defaults');
    }

    // Apply conversation behavior for new conversations
    if (isNewConversation && conversationBehavior) {
      switch (conversationBehavior) {
        case 'question':
          enhancedContext += `

CONVERSATION STYLE: Focus on engaging questions that help understand the customer's specific needs and situation. Start with discovery questions.`;
          break;
        case 'professional':
          enhancedContext += `

CONVERSATION STYLE: Use a formal, professional business tone. Introduce your services clearly and establish credibility.`;
          break;
        case 'greeting':
        default:
          enhancedContext += `

CONVERSATION STYLE: Use a warm, friendly greeting that makes the customer feel welcome while maintaining professionalism.`;
          break;
      }
    }

    // Streamline payload to FastAPI by reducing unnecessary fields
    const data: SuggestionsResponse = await postFastAPI('/ai/conversation/suggestions/enhanced', {
      userId: userId,
      conversationId: body.conversationId,
      query: enhancedQuery,
      context: enhancedContext,
      knowledgebaseId: body.knowledgebaseId || body.conversationId,
      limit: body.limit || 3,
      temperature: aiConfig.temperature,
      model: aiConfig.model,
      humanlikeBehavior: aiConfig.humanlikeBehavior,
      aiAgentId: selectedAgentId || null,
      systemPrompt: agentPrompt,
      agentName: agentName,
      conversationMetadata: {
        isNew: isNewConversation,
        hasMinimalContext: false,
        validMessageCount: validMessages.length,
        conversationBehavior: conversationBehavior,
        enhancedPrompting: true
      }
    }, {
      userId: userId
    });

    console.log('Enhanced suggestions response for conversation type:', {
      isNew: isNewConversation,
      hasMinimalContext: false, // Always false as per new logic
      behavior: conversationBehavior,
      suggestionsCount: data.suggestions?.length || 0
    });

    // Validate response has expected fields
    if (!data.suggestions || !Array.isArray(data.suggestions)) {
      throw new Error('Invalid response format from server');
    }

    // Return response in expected format with success wrapper
    return Response.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error generating conversation suggestions:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
} 
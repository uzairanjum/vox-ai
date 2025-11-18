import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { validateAIConfig } from '@/utils/ai/config/aiSettings';
import { getAIAgentConfig } from '@/utils/ai/globalSettings';
import { postFastAPI } from '@/lib/fastapi-utils';
import { cache } from 'react';

interface ResponseSuggestionsRequestBody {
  userId?: string;
  conversationId: string;
  knowledgebaseId?: string;
  context?: string;
  lastCustomerMessage: string;
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    contactId?: string;
  };
  recentMessages?: Array<any>;
  autopilot?: boolean;
  temperature?: number;
  model?: string;
  humanlikeBehavior?: boolean;
  additionalKnowledgebaseIds?: string[];
  aiAgentId?: string;
  limit?: number; // Number of suggestions to generate (1-6, default: 3)
}

interface ResponseSuggestionsResponse {
  response_suggestion: string;
  autopilot_response: string;
  confidence_score: number;
  conversationId: string;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

const FASTAPI_URL = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
const FALLBACK_USER_ID = 'ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21';

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
    const body = await req.json() as ResponseSuggestionsRequestBody;
    
    if (!body.conversationId || !body.lastCustomerMessage) {
      return Response.json({
        success: false,
        error: 'Missing required fields: conversationId and lastCustomerMessage'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Validate limit parameter
    const limit = body.limit !== undefined 
      ? Math.max(1, Math.min(6, body.limit)) // Clamp between 1 and 6
      : 3; // Default to 3

    // Get active AI agent configuration
    const { agentId: activeAgentId, config: agentConfig } = await getAIAgentConfig();
    
    // Validate and merge AI configuration (use active agent config as defaults)
    const aiConfig = validateAIConfig({
      model: body.model || agentConfig.model,
      temperature: body.temperature !== undefined ? body.temperature : agentConfig.temperature,
      humanlikeBehavior: body.humanlikeBehavior !== undefined ? body.humanlikeBehavior : agentConfig.humanlikeBehavior
    });

    // Use the provided agent ID or fall back to the active agent
    let selectedAgentId = body.aiAgentId || activeAgentId;
    let additionalKnowledgebaseIds = [];
    let agentPrompt = 'You are a helpful AI assistant.'; // Default system prompt
    let agentName = 'Default Assistant'; // Default agent name
    
    console.log('🎯 Active AI Agent ID:', activeAgentId);
    console.log('🔧 Agent Config:', agentConfig);
    
    // If we have a selected agent, get its details
    if (selectedAgentId) {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || `http://localhost:${process.env.PORT || 3001}`;
        const agentResponse = await fetch(`${baseUrl}/api/ai/agents/${selectedAgentId}`);
        if (agentResponse.ok) {
          const agentData = await agentResponse.json();
          if (agentData.success && agentData.data) {
            agentPrompt = agentData.data.prompt || agentData.data.system_prompt || 'You are a helpful AI assistant.';
            agentName = agentData.data.name || 'Custom Agent';
            console.log('🤖 Retrieved agent details:', { agentId: selectedAgentId, agentName, promptLength: agentPrompt.length });
            
            // Get agent's knowledge base IDs if available
            if (agentData.data.knowledge_base_ids) {
              additionalKnowledgebaseIds = agentData.data.knowledge_base_ids.filter((id: string) => id !== body.conversationId);
            }
          }
        }
      } catch (agentError) {
        console.log('⚠️  Could not fetch agent details, using defaults:', agentError instanceof Error ? agentError.message : 'Unknown error');
      }
    }
    
    // Also check conversation-specific settings for additional knowledge bases
    try {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || `http://localhost:${process.env.PORT || 3001}`;
      const settingsResponse = await fetch(`${baseUrl}/api/conversation-meta?conversationId=${body.conversationId}`);
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData.data?.data?.knowledgeBaseIds) {
          const settingsKBIds = settingsData.data.data.knowledgeBaseIds.filter((id: string) => id !== body.conversationId);
          additionalKnowledgebaseIds = [...new Set([...additionalKnowledgebaseIds, ...settingsKBIds])];
        }
      }
    } catch (error) {
      console.log('ℹ️  Could not fetch conversation settings:', error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('🤖 Response Suggestions AI Configuration:', {
      conversationId: body.conversationId,
      lastMessageLength: body.lastCustomerMessage?.length || 0,
      autopilot: body.autopilot,
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

    // NEW: Extract conversation metadata and customer context for intelligent responses
    const isAutopilotMode = body.autopilot === true;
    // Removed any checks for minimum message count to allow AI response suggestions without prior messages
    const isNewConversation = !body.recentMessages || body.recentMessages.length === 0;
    const hasMinimalContext = false; // Always false to ensure functionality without prior messages
    const validMessages = body.recentMessages?.filter(msg => msg.body && msg.body.trim().length > 0) || [];
    
    // Extract customer information for personalization
    const customerInfo = body.customerInfo || {};
    const customerName = customerInfo.name || (customerInfo as any).contactName || (customerInfo as any).fullName;
    const customerEmail = customerInfo.email;
    const customerPhone = customerInfo.phone;
    const contactId = customerInfo.contactId;
    
    // Get conversation metadata for more context
    let conversationName = '';
    let conversationContext = '';
    
    try {
      // Fetch conversation details from the conversations API
      const conversationResponse = await fetch(`${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || `http://localhost:${process.env.PORT || 3000}`}/api/leadconnector/conversations/${body.conversationId}`);
      if (conversationResponse.ok) {
        const conversationData = await conversationResponse.json();
        if (conversationData.success && conversationData.data) {
          conversationName = conversationData.data.name || '';
          // Extract additional context from conversation metadata
          if (conversationData.data.contact) {
            const contact = conversationData.data.contact;
            conversationContext = `Customer: ${contact.firstName || ''} ${contact.lastName || ''} (${contact.email || ''})`;
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Could not fetch conversation details:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    let enhancedQuery = body.lastCustomerMessage || 'Generate a response for this conversation';
    let enhancedContext = body.context || '';
    
    // Apply intelligent contextual prompting based on available information
    if (isAutopilotMode && (isNewConversation || hasMinimalContext)) {
      console.log('🧠 Generating intelligent contextual response using:', {
        customerName,
        customerEmail,
        conversationName,
        isNew: isNewConversation,
        hasMinimal: hasMinimalContext,
        agentId: selectedAgentId
      });
      
      // Build comprehensive context for AI agent
      let personalizedContext = '';
      
      if (isNewConversation) {
        personalizedContext = `You are responding to a new conversation. Use the following information to create a personalized, helpful greeting:

CUSTOMER INFORMATION:
- Name: ${customerName || 'Customer (name not provided)'}
- Email: ${customerEmail || 'Not provided'}

CONVERSATION CONTEXT:
- Conversation Name: ${conversationName || 'Not specified'}
- Additional Context: ${conversationContext || 'No additional context'}
- Knowledge Base: Use conversation-specific knowledge base (ID: ${body.conversationId}) for relevant information

INSTRUCTIONS:
Generate a warm, professional greeting that:
1. Addresses the customer by name if available
2. References any relevant context from the conversation name or customer information
3. Uses knowledge base information to provide relevant value or assistance
4. Asks a specific, engaging question based on available context
5. Shows understanding of their potential needs or interests

Make this feel personal and helpful, not generic. Do NOT mention technical details like contact IDs or system information.`;
        
        enhancedQuery = `Generate a personalized greeting and conversation starter for ${customerName || 'the customer'}`;
        
      } else if (hasMinimalContext) {
        personalizedContext = `You are continuing a conversation with minimal context. Use available information to provide a helpful response:

CUSTOMER INFORMATION:
- Name: ${customerName || 'Customer (name not provided)'}
- Email: ${customerEmail || 'Not provided'}
- Conversation Name: ${conversationName || 'Not specified'}

CONVERSATION HISTORY:
${validMessages.map((msg, i) => `${i + 1}. ${msg.direction === 'inbound' ? 'Customer' : 'Agent'}: ${msg.body}`).join('\n')}

INSTRUCTIONS:
Generate a response that:
1. Acknowledges previous messages appropriately
2. Uses the customer's name naturally in the response
3. References conversation context or name if relevant
4. Queries knowledge base for helpful information related to their inquiry
5. Asks follow-up questions to better understand their needs
6. Provides value based on available context

Make this feel like a natural continuation that shows you understand their situation.`;
      }
      
      enhancedContext = personalizedContext || enhancedContext;
      
    } else if (isAutopilotMode) {
      // Standard autopilot with full context - still use customer name for personalization
      if (customerName && !enhancedContext.includes(customerName)) {
        enhancedContext = `Customer Name: ${customerName}\n${enhancedContext}

Generate a response that addresses ${customerName} by name and uses the conversation context and knowledge base to provide helpful, relevant assistance.`;
      }
    }

    // Use cached global settings for conversation behavior
    let conversationBehavior = 'greeting'; // default
    if (isAutopilotMode && isNewConversation) {
      try {
        const globalSettings = await getCachedGlobalSettings();
        if (globalSettings && globalSettings.conversation_starters_enabled) {
          conversationBehavior = globalSettings.new_conversation_behavior || 'greeting';
          console.log('🌐 Using cached global conversation behavior for autopilot:', conversationBehavior);
        }
      } catch (error) {
        console.log('⚠️ Could not load cached global AI settings for autopilot, using defaults');
      }

      // Apply conversation behavior for autopilot new conversations
      switch (conversationBehavior) {
        case 'question':
          enhancedContext += `

AUTOPILOT CONVERSATION STYLE: Focus on engaging discovery questions that help understand the customer's specific needs and situation. Start with needs assessment.`;
          break;
        case 'professional':
          enhancedContext += `

AUTOPILOT CONVERSATION STYLE: Use a formal, professional business tone. Introduce your services clearly and establish credibility from the first message.`;
          break;
        case 'greeting':
        default:
          enhancedContext += `

AUTOPILOT CONVERSATION STYLE: Use a warm, friendly greeting that makes the customer feel welcome while maintaining business professionalism.`;
          break;
      }
    }

    // Streamline payload to FastAPI by reducing unnecessary fields
    const data: ResponseSuggestionsResponse = await postFastAPI('/ai/conversation/response-suggestions/enhanced', {
      userId: userId,
      conversationId: body.conversationId,
      knowledgebaseId: body.knowledgebaseId || body.conversationId,
      context: enhancedContext,
      lastCustomerMessage: enhancedQuery,
      autopilot: body.autopilot || false,
      temperature: aiConfig.temperature,
      model: aiConfig.model,
      humanlikeBehavior: aiConfig.humanlikeBehavior,
      aiAgentId: selectedAgentId || null,
      systemPrompt: agentPrompt,
      agentName: agentName,
      limit: limit,
      conversationMetadata: {
        isNew: isNewConversation,
        hasMinimalContext: hasMinimalContext,
        validMessageCount: validMessages.length,
        conversationBehavior: conversationBehavior,
        enhancedPrompting: isAutopilotMode && (isNewConversation || hasMinimalContext),
        autopilotMode: isAutopilotMode
      }
    }, {
      userId: userId
    });

    console.log('Enhanced autopilot response for conversation type:', {
      isNew: isNewConversation,
      hasMinimalContext: hasMinimalContext,
      isAutopilot: isAutopilotMode,
      behavior: conversationBehavior,
      hasResponse: !!(data.autopilot_response || data.response_suggestion)
    });

    // Validate response has expected fields
    if (!data.response_suggestion && !data.autopilot_response) {
      throw new Error('Invalid response format from server');
    }

    // Return response in expected format with success wrapper
    return Response.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error generating response suggestions:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
} 
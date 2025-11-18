interface ConversationContext {
  conversationId: string;
  customerInfo: {
    name?: string;
    email?: string;
    phone?: string;
    contactId?: string;
    fullName?: string;
  };
  conversationName?: string;
  conversationMetadata?: any;
  validMessageCount: number;
  isNewConversation: boolean;
  hasMinimalContext: boolean;
}

interface ContextualPrompt {
  query: string;
  context: string;
  useKnowledgeBase: boolean;
  personalizedGreeting: boolean;
}

/**
 * Extract comprehensive conversation context for AI responses
 */
export async function extractConversationContext(
  conversationId: string,
  recentMessages: any[] = [],
  customerInfo: any = {}
): Promise<ConversationContext> {
  
  const validMessages = recentMessages.filter(msg => msg.body && msg.body.trim().length > 0);
  const isNewConversation = validMessages.length === 0;
  const hasMinimalContext = validMessages.length > 0 && validMessages.length < 3;
  
  // Extract customer information from multiple sources
  const extractedCustomerInfo = {
    name: customerInfo.name || (customerInfo as any).contactName || (customerInfo as any).fullName,
    email: customerInfo.email,
    phone: customerInfo.phone,
    contactId: customerInfo.contactId,
    fullName: (customerInfo as any).fullName
  };
  
  // Try to get conversation metadata
  let conversationName = '';
  let conversationMetadata = {};
  
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || `http://localhost:${process.env.PORT || 3000}`;
    
    // Fetch conversation details
    const conversationResponse = await fetch(`${baseUrl}/api/leadconnector/conversations/${conversationId}`);
    if (conversationResponse.ok) {
      const conversationData = await conversationResponse.json();
      if (conversationData.success && conversationData.data) {
        conversationName = conversationData.data.name || '';
        conversationMetadata = conversationData.data;
        
        // Extract additional customer info from conversation if not provided
        if (conversationData.data.contact && !extractedCustomerInfo.name) {
          const contact = conversationData.data.contact;
          extractedCustomerInfo.name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
          extractedCustomerInfo.email = extractedCustomerInfo.email || contact.email;
          extractedCustomerInfo.phone = extractedCustomerInfo.phone || contact.phone;
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Could not fetch conversation metadata:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  return {
    conversationId,
    customerInfo: extractedCustomerInfo,
    conversationName,
    conversationMetadata,
    validMessageCount: validMessages.length,
    isNewConversation,
    hasMinimalContext
  };
}

/**
 * Generate contextual prompts based on conversation context
 */
export function generateContextualPrompt(
  context: ConversationContext,
  isAutopilot: boolean = false,
  originalQuery?: string,
  originalContext?: string
): ContextualPrompt {
  
  const { customerInfo, conversationName, isNewConversation, hasMinimalContext, validMessageCount } = context;
  const customerName = customerInfo.name;
  const customerEmail = customerInfo.email;
  
  // For new conversations - create personalized greeting
  if (isNewConversation) {
    const query = `Generate a personalized ${isAutopilot ? 'autopilot ' : ''}greeting and conversation starter for ${customerName || 'the customer'}`;
    
    const contextPrompt = `You are ${isAutopilot ? 'an autopilot AI assistant' : 'an AI assistant'} responding to a new conversation. Create a personalized, helpful greeting using:

CUSTOMER INFORMATION:
- Name: ${customerName || 'Customer (name not provided)'}
- Email: ${customerEmail || 'Not provided'}
- Contact ID: ${customerInfo.contactId || 'Not provided'}

CONVERSATION CONTEXT:
- Conversation Name: ${conversationName || 'Not specified'}
- Business Context: Use knowledge base for relevant business information
- First Contact: This is the initial message in the conversation

INSTRUCTIONS:
Generate a warm, professional greeting that:
1. ${customerName ? `Addresses ${customerName} by name naturally` : 'Uses a friendly greeting without assuming their name'}
2. ${conversationName ? `References relevant context from the conversation name: "${conversationName}"` : 'Introduces your services professionally'}
3. Uses knowledge base information to provide immediate value
4. Asks a specific, engaging question based on available context
5. Shows understanding of their potential needs or interests
6. Sets a positive, helpful tone for the conversation

Make this feel personal and valuable, not generic. Use business context from your knowledge base.`;

    return {
      query,
      context: contextPrompt,
      useKnowledgeBase: true,
      personalizedGreeting: true
    };
  }
  
  // For minimal context conversations - build on existing messages
  if (hasMinimalContext) {
    const query = originalQuery || `Generate a helpful continuation for ${customerName || 'the customer'}`;
    
    const contextPrompt = `You are ${isAutopilot ? 'an autopilot AI assistant' : 'an AI assistant'} continuing a conversation with minimal context. Provide a helpful, personalized response:

CUSTOMER INFORMATION:
- Name: ${customerName || 'Customer (name not provided)'}
- Email: ${customerEmail || 'Not provided'}
- Conversation Name: ${conversationName || 'Not specified'}

CONVERSATION CONTEXT:
- Valid Messages: ${validMessageCount}
- Previous Context: ${originalContext || 'Limited conversation history'}

INSTRUCTIONS:
Generate a response that:
1. ${customerName ? `Uses ${customerName}'s name naturally in the response` : 'Maintains a personal tone'}
2. Acknowledges previous messages appropriately
3. ${conversationName ? `References context from "${conversationName}" if relevant` : 'Stays focused on helping the customer'}
4. Uses knowledge base to provide relevant information
5. Asks thoughtful follow-up questions to understand their needs
6. Shows active listening and engagement

Make this feel like a natural continuation that demonstrates understanding.`;

    return {
      query,
      context: contextPrompt,
      useKnowledgeBase: true,
      personalizedGreeting: false
    };
  }
  
  // For standard conversations - enhance with personalization
  const query = originalQuery || 'Generate a helpful response';
  let contextPrompt = originalContext || '';
  
  if (customerName && !contextPrompt.includes(customerName)) {
    contextPrompt = `CUSTOMER: ${customerName}
${conversationName ? `CONVERSATION: ${conversationName}` : ''}

${contextPrompt}

Generate a response that addresses ${customerName} personally and uses knowledge base information for relevant assistance.`;
  }
  
  return {
    query,
    context: contextPrompt,
    useKnowledgeBase: true,
    personalizedGreeting: false
  };
}

/**
 * Build enhanced payload for AI APIs with conversation context
 */
export function buildEnhancedAIPayload(
  basePayload: any,
  context: ConversationContext,
  contextualPrompt: ContextualPrompt
) {
  return {
    ...basePayload,
    query: contextualPrompt.query,
    context: contextualPrompt.context,
    // Enhanced metadata for AI
    conversationMetadata: {
      ...basePayload.conversationMetadata,
      customerName: context.customerInfo.name,
      conversationName: context.conversationName,
      isPersonalized: !!context.customerInfo.name,
      useKnowledgeBase: contextualPrompt.useKnowledgeBase,
      contextType: context.isNewConversation ? 'new' : context.hasMinimalContext ? 'minimal' : 'standard'
    },
    // Ensure customer info is properly formatted
    customerInfo: {
      name: context.customerInfo.name || basePayload.customerInfo?.name,
      email: context.customerInfo.email || basePayload.customerInfo?.email,
      phone: context.customerInfo.phone || basePayload.customerInfo?.phone,
      contactId: context.customerInfo.contactId || basePayload.customerInfo?.contactId
    }
  };
} 
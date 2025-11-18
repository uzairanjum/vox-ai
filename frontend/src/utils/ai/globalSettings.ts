export interface GlobalAISettings {
  query_agent_id?: string;
  suggestions_agent_id?: string;
  autopilot_agent_id?: string;
  use_global_agents: boolean;
  conversation_starters_enabled: boolean;
  new_conversation_behavior: 'greeting' | 'question' | 'professional';
}

export const DEFAULT_GLOBAL_AI_SETTINGS: GlobalAISettings = {
  use_global_agents: false,
  conversation_starters_enabled: true,
  new_conversation_behavior: 'greeting'
};

/**
 * Fetch global AI settings for the current user
 */
export async function getGlobalAISettings(): Promise<GlobalAISettings> {
  try {
    const response = await fetch('/api/ai/settings/global');
    const data = await response.json();
    
    if (data.success && data.data) {
      return { ...DEFAULT_GLOBAL_AI_SETTINGS, ...data.data };
    }
  } catch (error) {
    console.error('Error fetching global AI settings:', error);
  }
  
  return DEFAULT_GLOBAL_AI_SETTINGS;
}

/**
 * Get the Conversation AI agent ID for any feature
 */
export function getAgentForFeature(
  feature: 'query' | 'suggestions' | 'autopilot',
  globalSettings: GlobalAISettings,
  conversationAgentId?: string
): string | null {
  // If conversation has specific agent, use that
  if (conversationAgentId) {
    return conversationAgentId;
  }
  
  // Use the first available agent ID from global settings
  if (globalSettings.use_global_agents) {
    return globalSettings.query_agent_id || 
           globalSettings.suggestions_agent_id || 
           globalSettings.autopilot_agent_id || 
           null;
  }
  
  return null;
}

/**
 * Generate enhanced prompts for new conversations based on global settings
 */
export function getConversationStarterPrompt(
  globalSettings: GlobalAISettings,
  isNewConversation: boolean = false,
  hasMinimalContext: boolean = false
): { query: string; context: string } {
  
  if (!isNewConversation && !hasMinimalContext) {
    return {
      query: 'Generate contextual response suggestions',
      context: 'Generate helpful and relevant suggestions based on the conversation context.'
    };
  }
  
  if (!globalSettings.conversation_starters_enabled) {
    return {
      query: 'Generate suggestions for this conversation',
      context: 'Provide helpful response suggestions for the conversation.'
    };
  }
  
  const behavior = globalSettings.new_conversation_behavior;
  
  let query = 'Generate professional conversation starters and opening messages';
  let context = '';
  
  if (isNewConversation) {
    switch (behavior) {
      case 'question':
        query = 'Generate engaging discovery questions to start the conversation';
        context = `This is a new conversation. Generate engaging opening questions that:
1. Help understand the customer's specific needs and situation
2. Show genuine interest in helping them
3. Encourage detailed responses that provide valuable context
4. Are relevant to business/sales conversations
5. Build rapport while gathering important information

Focus on discovery and needs assessment through thoughtful questions.`;
        break;
        
      case 'professional':
        query = 'Generate professional business introduction messages';
        context = `This is a new conversation. Generate formal, professional opening messages that:
1. Introduce your services clearly and professionally
2. Establish credibility and expertise
3. Present value propositions effectively
4. Maintain a business-formal tone
5. Include clear next steps or calls to action

Focus on professionalism, credibility, and clear value communication.`;
        break;
        
      case 'greeting':
      default:
        query = 'Generate warm, welcoming conversation starters';
        context = `This is a new conversation. Generate warm, friendly opening messages that:
1. Provide a genuine, welcoming greeting
2. Make the customer feel valued and heard
3. Show enthusiasm for helping them
4. Strike a balance between friendly and professional
5. Encourage open communication

Focus on building rapport and creating a positive first impression.`;
        break;
    }
  } else if (hasMinimalContext) {
    context = `This conversation has minimal context. Generate suggestions that:
1. Build on any available conversation history
2. Ask thoughtful follow-up questions
3. Show active listening and engagement
4. Move the conversation forward constructively
5. Maintain the tone established in previous messages

Focus on relationship building and conversation development.`;
  }
  
  return { query, context };
}

/**
 * Check if conversation starters should be used
 */
export function shouldUseConversationStarters(
  globalSettings: GlobalAISettings,
  messageCount: number = 0
): boolean {
  return globalSettings.conversation_starters_enabled && messageCount < 3;
} 

/**
 * Global AI Settings Utility
 * Handles getting the active AI agent for conversations
 */

interface ActiveAgent {
  id: string;
  name: string;
  type: number;
  configuration?: Record<string, any>;
  data?: Record<string, any>; // Add the data field from database
}

/**
 * Gets the currently active AI agent for conversations
 * Returns the single active agent or null if none found
 */
export async function getActiveAIAgent(): Promise<ActiveAgent | null> {
  try {
    const response = await fetch('/api/ai/agents?active_only=true');
    const data = await response.json();
    
    if (data.success && data.data?.agents) {
      const activeAgents = data.data.agents.filter((agent: any) => agent.is_active !== false);
      
      // Should only be one active agent
      if (activeAgents.length === 1) {
        return {
          id: activeAgents[0].id,
          name: activeAgents[0].name,
          type: activeAgents[0].type,
          configuration: activeAgents[0].configuration || {},
          data: activeAgents[0].data || {} // Include data field
        };
      } else if (activeAgents.length > 1) {
        console.warn(`Multiple active AI agents found (${activeAgents.length}). Using the first one.`);
        return {
          id: activeAgents[0].id,
          name: activeAgents[0].name,
          type: activeAgents[0].type,
          configuration: activeAgents[0].configuration || {},
          data: activeAgents[0].data || {} // Include data field
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting active AI agent:', error);
    return null;
  }
}

/**
 * Gets the active AI agent configuration for API calls
 * Includes agent ID and any relevant configuration
 */
export async function getAIAgentConfig(): Promise<{
  agentId: string | null;
  config: Record<string, any>;
}> {
  const activeAgent = await getActiveAIAgent();
  
  if (!activeAgent) {
    return {
      agentId: null,
      config: {}
    };
  }
  
  return {
    agentId: activeAgent.id,
    config: {
      model: activeAgent.configuration?.model || 'gpt-4o-mini',
      temperature: activeAgent.configuration?.temperature || 0.7,
      humanlikeBehavior: activeAgent.configuration?.humanlikeBehavior || false,
      ...activeAgent.configuration
    }
  };
} 
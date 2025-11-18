/**
 * Simplified Agent Selection Utility
 * Uses one "Conversation AI" agent for all features
 */

interface GlobalSettings {
  default_agent_id?: string;
}

interface ConversationSettings {
  defaultAgent?: string;
}

export type AIFeature = 'query' | 'suggestions' | 'autopilot';

/**
 * Get the single Conversation AI agent for all features
 * @param feature - The AI feature (query, suggestions, autopilot)
 * @param globalSettings - Global AI settings
 * @param conversationSettings - Conversation-specific settings
 * @param availableAgents - List of available agent IDs
 * @returns Selected agent ID or null
 */
export function selectAgentForFeature(
  feature: AIFeature,
  globalSettings?: GlobalSettings | null,
  conversationSettings?: ConversationSettings | null,
  availableAgents?: string[]
): string | null {
  
  console.log(`🤖 Selecting Conversation AI agent for ${feature}`);

  // PRIORITY 1: Conversation-specific agent
  if (conversationSettings?.defaultAgent) {
    console.log(`✅ Using conversation agent: ${conversationSettings.defaultAgent}`);
    return conversationSettings.defaultAgent;
  }

  // PRIORITY 2: Global default agent
  if (globalSettings?.default_agent_id) {
    console.log(`✅ Using global default agent: ${globalSettings.default_agent_id}`);
    return globalSettings.default_agent_id;
  }

  // PRIORITY 3: First available active agent
  if (availableAgents && availableAgents.length > 0) {
    console.log(`✅ Using first available agent: ${availableAgents[0]}`);
    return availableAgents[0];
  }

  console.log(`❌ No Conversation AI agent found`);
  return null;
}

/**
 * Get agent selection summary for debugging
 */
export function getAgentSelectionSummary(
  feature: AIFeature,
  selectedAgent: string | null,
  globalSettings?: GlobalSettings | null,
  conversationSettings?: ConversationSettings | null
): string {
  if (!selectedAgent) {
    return `No Conversation AI agent selected for ${feature}`;
  }

  if (conversationSettings?.defaultAgent === selectedAgent) {
    return `Using conversation agent for ${feature}`;
  }

  if (globalSettings?.default_agent_id === selectedAgent) {
    return `Using global default agent for ${feature}`;
  }

  return `Using available agent for ${feature}`;
} 
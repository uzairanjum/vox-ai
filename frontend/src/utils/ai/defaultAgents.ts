import { getSupabase } from '@/utils/supabase/getSupabase';

export interface DefaultAgentConfig {
  name: string;
  type: number; // 1=query, 2=suggestions, 3=response  
  system_prompt: string;
  description: string;
  data: Record<string, any>;
}

export const DEFAULT_AGENTS_CONFIG: DefaultAgentConfig[] = [
  {
    name: 'Default Query Agent',
    type: 1, // query
    system_prompt: `You are a helpful AI assistant responding directly to customers. 

CONVERSATION CONTEXT:
{context}

CUSTOMER'S QUESTION:
"{query}"

Provide a helpful, accurate response based on the conversation context. Be conversational, empathetic, and specific to their situation.`,
    description: 'Default agent for answering customer queries and questions directly',
    data: { is_default: true, agent_type: 'query' }
  },
  {
    name: 'Default Suggestions Agent', 
    type: 2, // suggestions
    system_prompt: `You are the Default Suggestions Agent, a customer service expert helping generate follow-up messages.

INSTRUCTIONS:
1. If asked directly about yourself (e.g., "who are you", "what do you do"), respond with a brief explanation of your role.
2. Otherwise, generate exactly 3 follow-up messages that a customer service representative could send.

CONVERSATION CONTEXT:
{context}

CUSTOMER'S MESSAGE OR QUERY:
"{query}"

If this is a direct question about yourself, respond directly. Otherwise, generate exactly 3 follow-up messages that a customer service representative could send to continue this conversation helpfully. Each should:
- Be specific to this conversation
- Show you've been listening
- Offer genuine help
- Sound natural and caring

Return exactly 3 numbered suggestions:
1. [First suggestion]
2. [Second suggestion] 
3. [Third suggestion]`,
    description: 'Default agent for generating follow-up suggestions for representatives',
    data: { is_default: true, agent_type: 'suggestions' }
  },
  {
    name: 'Default Response Agent',
    type: 3, // response
    system_prompt: `You're a customer service representative responding to a customer.

CONVERSATION CONTEXT:
{context}

CUSTOMER'S MESSAGE:
"{last_customer_message}"

Write a helpful, professional response that:
- Shows empathy and understanding
- Addresses their specific concern
- Offers practical help
- Sounds natural and caring

Write one direct response to send to this customer:`,
    description: 'Default agent for generating responses to customer messages',
    data: { is_default: true, agent_type: 'response' }
  }
];

/**
 * Creates default AI agents for a user if they don't exist
 */
export async function createDefaultAgentsForUser(userId: string): Promise<void> {
  // DISABLED: Users should create their own agents manually
  // This prevents automatic creation of multiple active agents which violates
  // our "only one active agent" rule
  console.log('Default agent creation disabled for user:', userId);
  console.log('Users should create agents manually via the AI Agent Wizard');
  return;

  // OLD CODE BELOW - DISABLED
  /*
  try {
    const supabase = await getSupabase();
    
    // Check if user already has default agents
    const { data: existingAgents } = await supabase
      .from('ai_agents')
      .select('id, name, type')
      .eq('user_id', userId)
      .contains('data', { is_default: true });

    // Get types that are missing
    const existingTypes = existingAgents?.map(agent => agent.type) || [];
    const missingTypes = DEFAULT_AGENTS_CONFIG.filter(config => 
      !existingTypes.includes(config.type)
    );

    if (missingTypes.length === 0) {
      console.log('All default agents already exist for user:', userId);
      return;
    }

    // Create missing default agents
    const agentsToCreate = missingTypes.map(config => ({
      name: config.name,
      type: config.type,
      system_prompt: config.system_prompt,
      description: config.description,
      user_id: userId,
      data: config.data,
      knowledge_base_ids: [], // Empty array for default agents
      is_active: true,
      configuration: {},
      metadata: { is_default: true, created_by: 'system' }
    }));

    const { data: createdAgents, error } = await supabase
      .from('ai_agents')
      .insert(agentsToCreate)
      .select();

    if (error) {
      console.error('Error creating default agents:', error);
      throw error;
    }

    console.log(`Created ${createdAgents?.length || 0} default agents for user:`, userId);
    
  } catch (error) {
    console.error('Error in createDefaultAgentsForUser:', error);
    throw error;
  }
  */
}

/**
 * Gets default agent for specific type for a user
 */
export async function getDefaultAgentForUser(userId: string, agentType: number): Promise<any> {
  try {
    const supabase = await getSupabase();
    
    const { data: agent, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('user_id', userId)
      .eq('type', agentType)
      .contains('data', { is_default: true })
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return agent;
  } catch (error) {
    console.error('Error getting default agent:', error);
    throw error;
  }
}

/**
 * Ensures user has all default agents, creates missing ones
 */
export async function ensureDefaultAgentsForUser(userId: string): Promise<void> {
  try {
    await createDefaultAgentsForUser(userId);
  } catch (error) {
    console.error('Error ensuring default agents:', error);
    // Don't throw to prevent blocking user flow
  }
} 
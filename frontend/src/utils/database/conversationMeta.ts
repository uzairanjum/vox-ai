export interface ConversationMetaData {
  id: string;
  created_at: string;
  conv_id: string;
  lastmessageid?: string; // Updated to match database schema
  name?: string;
  location_id?: string;
  data_type: number;
  user_id: string;
  data: Record<string, any>;
}

export interface ConversationMetaInsert {
  id?: string;
  conv_id: string;
  lastmessageid?: string; // Updated to match database schema
  name?: string;
  location_id?: string;
  data_type?: number;
  user_id: string;
  data?: Record<string, any>;
}

export interface ConversationMetaUpdate {
  conv_id?: string;
  lastmessageid?: string; // Updated to match database schema
  name?: string;
  location_id?: string;
  data_type?: number;
  data?: Record<string, any>;
}

// Conversation data types
export const CONVERSATION_DATA_TYPES = {
  GENERAL: 21,
  SUPPORT: 22,
  SALES: 23,
  LEAD_NURTURING: 24,
  FOLLOW_UP: 25,
  AI_SETTINGS: 26  // For AI agent and knowledge base settings
} as const;

export interface ConversationSettings {
  // Support multiple agents for different features
  agents: {
    query?: string;      // Agent ID for query feature
    suggestions?: string; // Agent ID for suggestions feature
    autopilot?: string;   // Agent ID for autopilot feature
  };
  autoRespond?: boolean;
  knowledgeBaseIds?: string[];
  customSettings?: Record<string, any>;
  // Feature-specific settings
  features: {
    query: {
      enabled: boolean;
      contextDepth: number;
    };
    suggestions: {
      enabled: boolean;
      limit: number;
      contextDepth: number;
    };
    autopilot: {
      enabled: boolean;
      contextDepth: number;
      confidenceThreshold: number;
    };
  };
  // Backward compatibility
  selectedAgentId?: string;
  agentType?: 'query' | 'suggestions' | 'response';
}

export interface ConversationMetaResponse {
  success: boolean;
  data?: ConversationMetaData | null;
  error?: string;
}

export interface ConversationMetaListResponse {
  success: boolean;
  data?: ConversationMetaData[];
  total?: number;
  error?: string;
} 
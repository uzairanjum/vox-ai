import type { Message as GHLMessage, MessageType } from '@/lib/leadconnector/types/messageTypes';

export interface Conversation {
  id: string;
  contactId: string;
  locationId: string;
  lastMessageBody: string;
  lastMessageType: string;
  type: string;
  unreadCount: number;
  fullName: string;
  contactName: string;
  email?: string;
  phone?: string;
  messages?: GHLMessage[];
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
}

export type SearchFilters = {
  query?: string;
  limit?: number;
  lastMessageType?: string;
};

// Re-export message types
export type { GHLMessage as Message, MessageType };

export interface TrainingStatus {
  isTrained: boolean;
  isTraining?: boolean;
  lastUpdated: string;
  messageCount: number;
  vectorCount: number;
  msg?: string;
}

export interface ConversationSummary {
  summary: string;
  metadata: {
    messageCount: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

export interface TrainingState {
  isLoading: boolean;
  isTraining: boolean;
  error: string | null;
  success: boolean;
  progress: {
    loadedCount: number;
    totalCount: number;
    percent: number;
  };
}

export interface TrainingData {
  messages: GHLMessage[];
  locationId: string;
  lastMessageId?: string;
  hasMore: boolean;
  loadMore?: () => Promise<void>;
  isTrained: boolean;
  status: 'pending' | 'training' | 'completed' | 'failed';
  messageCount: number;
  vectorCount: number;
  summary?: string;
}

// Shared interface for conversation settings across all components
export interface ConversationSettings {
  // Support multiple agents for different features
  agents?: {
    query?: string;      // Agent ID for query feature
    suggestions?: string; // Agent ID for suggestions feature
    autopilot?: string;   // Agent ID for autopilot feature
  };
  // Agent details loaded from the API
  agentDetails?: {
    query?: {
      id: string;
      name: string;
      type: number;
      system_prompt?: string;
      description?: string;
    };
    suggestions?: {
      id: string;
      name: string;
      type: number;
      system_prompt?: string;
      description?: string;
    };
    autopilot?: {
      id: string;
      name: string;
      type: number;
      system_prompt?: string;
      description?: string;
    };
  };
  autoRespond?: boolean;
  knowledgeBaseIds?: string[];
  customSettings?: Record<string, any>;
  // Feature-specific settings
  features?: {
    query?: {
      enabled: boolean;
      contextDepth: number;
    };
    suggestions?: {
      enabled: boolean;
      limit: number;
      contextDepth: number;
    };
    autopilot?: {
      enabled: boolean;
      contextDepth: number;
      confidenceThreshold: number;
    };
  };
  // Backward compatibility
  selectedAgentId?: string;
  agentType?: 'query' | 'suggestions' | 'response';
}
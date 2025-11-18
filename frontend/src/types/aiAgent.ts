// AI Agent Type Schema - Comprehensive JSONB Data Structure

/**
 * Core Agent Configuration stored in the `data` JSONB field
 */
export interface AgentDataSchema {
  // Core Agent Properties (always present)
  personality: string;
  intent: string;
  tag: string;
  model: string;
  additionalInformation: string;

  // Agent Behavior Configuration
  behavior: {
    responseStyle:
      | "formal"
      | "casual"
      | "friendly"
      | "professional"
      | "empathetic";
    tone:
      | "helpful"
      | "direct"
      | "consultative"
      | "supportive"
      | "authoritative";
    verbosity: "concise" | "detailed" | "balanced";
    creativity: number; // 0-100, affects temperature
  };

  // Agent Capabilities & Features
  capabilities: {
    canHandleComplexQueries: boolean;
    canAccessKnowledgeBase: boolean;
    canGenerateSuggestions: boolean;
    canEscalateToHuman: boolean;
    canRememberContext: boolean;
    maxContextLength: number;
  };

  // Response Configuration
  responseConfig: {
    maxTokens: number;
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    stopSequences?: string[];
  };

  // Agent Variables & Context
  variables: Record<string, string | number | boolean>;
  contextVariables: {
    businessName?: string;
    businessType?: string;
    location?: string;
    workingHours?: string;
    contactInfo?: string;
    specialOffers?: string;
    commonPolicies?: string;
  };

  // Prompt Engineering
  prompts: {
    systemPrompt: string;
    customInstructions?: string;
    exampleInteractions?: Array<{
      input: string;
      output: string;
      context?: string;
    }>;
    fallbackResponses?: string[];
  };

  // Knowledge Base Integration
  knowledgeBase: {
    preferredSources: string[]; // KB IDs
    searchStrategy: "semantic" | "keyword" | "hybrid";
    confidenceThreshold: number;
    maxSources: number;
    citeSources: boolean;
  };

  // Conversation Flow Control
  conversationFlow: {
    canInitiateConversation: boolean;
    shouldAskFollowUp: boolean;
    maxConsecutiveResponses: number;
    escalationTriggers: string[];
    endConversationPhrases: string[];
  };

  // Performance & Analytics
  performance: {
    successRate?: number;
    averageResponseTime?: number;
    userSatisfactionScore?: number;
    totalInteractions?: number;
    lastOptimized?: string;
  };

  // Compliance & Safety
  safety: {
    contentFiltering: boolean;
    blockedTopics: string[];
    allowedLanguages: string[];
    requireHumanApproval: boolean;
    sensitivityLevel: "low" | "medium" | "high";
  };

  // Integration Settings
  integrations: {
    ghlSettings?: {
      autoRespond: boolean;
      delayMinutes: number;
      maxRepliesPerDay: number;
      operatingHours: {
        enabled: boolean;
        timezone: string;
        schedule: Record<string, { start: string; end: string }>;
      };
    };
    webhooks?: Array<{
      url: string;
      events: string[];
      enabled: boolean;
      headers?: Record<string, string>;
    }>;
    apiKeys?: Record<string, string>;
  };

  // Metadata & Management
  metadata: {
    version: string;
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    category: string;
    isActive: boolean;
    isDefault: boolean;
    isPublic: boolean;
    clonedFrom?: string;
    parentAgentId?: string;
  };

  // Custom Extensions
  extensions: Record<string, any>;
}

/**
 * Agent Type Definitions - NEW: Generic AI Agent System
 */
export const AGENT_TYPES = {
  GENERIC: 1, // 🆕 NEW: Generic agent that can handle all features
  QUERY: 2, // Legacy/Feature-specific: Query-only agent
  SUGGESTIONS: 3, // Legacy/Feature-specific: Suggestions-only agent
  AUTOPILOT: 4, // Legacy/Feature-specific: Autopilot-only agent
  CUSTOM: 99, // Custom/Legacy agent types
} as const;

export type AgentType = (typeof AGENT_TYPES)[keyof typeof AGENT_TYPES];

/**
 * 🆕 NEW: Agent Usage Context - How a generic agent is being used
 */
export interface AgentUsageContext {
  feature: "query" | "suggestions" | "autopilot" | "response" | "all";
  conversationId?: string;
  isDefault?: boolean; // Is this the default agent for all features?
  isFeatureSpecific?: boolean; // Is this agent dedicated to one feature?
}

/**
 * 🆕 NEW: Generic Agent Configuration
 * All agents now use the same core parameters regardless of usage
 */
export interface GenericAgentConfig {
  // Core Identity - Same for ALL agents
  personality: string; // "You are a helpful AI assistant for {business_name}..."
  intent: string; // "Your goal is to help customers with their questions..."
  additionalInformation: string; // Optional guidelines and context

  // Usage Configuration - How this agent behaves in different contexts
  usageConfig: {
    defaultForAllFeatures: boolean; // Use for query, suggestions, autopilot
    allowedFeatures: Array<"query" | "suggestions" | "autopilot" | "response">;
    priority: number; // Higher priority = preferred for feature conflicts
  };

  // Variables & Context (same as before)
  variables: Record<string, string | number | boolean>;
  contextVariables: {
    businessName?: string;
    businessType?: string;
    location?: string;
    workingHours?: string;
    contactInfo?: string;
    specialOffers?: string;
    commonPolicies?: string;
  };
}

/**
 * Agent Type Configurations
 */
export interface AgentTypeConfig {
  name: string;
  description: string;
  defaultBehavior: Partial<AgentDataSchema["behavior"]>;
  defaultCapabilities: Partial<AgentDataSchema["capabilities"]>;
  defaultResponseConfig: Partial<AgentDataSchema["responseConfig"]>;
  requiredFields: (keyof AgentDataSchema)[];
  optionalFields: (keyof AgentDataSchema)[];
}

export const AGENT_TYPE_CONFIGS: Record<AgentType, AgentTypeConfig> = {
  [AGENT_TYPES.GENERIC]: {
    name: "Generic AI Agent",
    description:
      "Versatile agent that can handle all AI features (queries, suggestions, autopilot)",
    defaultBehavior: {
      responseStyle: "friendly",
      tone: "helpful",
      verbosity: "balanced",
      creativity: 75,
    },
    defaultCapabilities: {
      canHandleComplexQueries: true,
      canAccessKnowledgeBase: true,
      canGenerateSuggestions: true,
      canEscalateToHuman: true,
      canRememberContext: true,
      maxContextLength: 4000,
    },
    defaultResponseConfig: {
      maxTokens: 500,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
    },
    // requiredFields: ["personality", "intent"],
    requiredFields: ["personality", "intent", "additionalInformation"],
    optionalFields: ["variables", "contextVariables", "knowledgeBase"],
  },

  [AGENT_TYPES.QUERY]: {
    name: "Query Agent",
    description:
      "Specialized agent for answering customer questions and queries directly",
    defaultBehavior: {
      responseStyle: "friendly",
      tone: "supportive",
      verbosity: "balanced",
      creativity: 70,
    },
    defaultCapabilities: {
      canHandleComplexQueries: true,
      canAccessKnowledgeBase: true,
      canGenerateSuggestions: false,
      canEscalateToHuman: true,
      canRememberContext: true,
      maxContextLength: 4000,
    },
    defaultResponseConfig: {
      maxTokens: 500,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
    },
    // requiredFields: ["personality", "intent"],
    requiredFields: ["personality", "intent", "additionalInformation"],
    optionalFields: ["variables", "contextVariables", "knowledgeBase"],
  },

  [AGENT_TYPES.SUGGESTIONS]: {
    name: "Suggestions Agent",
    description:
      "Specialized agent for generating follow-up suggestions for conversations",
    defaultBehavior: {
      responseStyle: "professional",
      tone: "consultative",
      verbosity: "concise",
      creativity: 80,
    },
    defaultCapabilities: {
      canHandleComplexQueries: false,
      canAccessKnowledgeBase: true,
      canGenerateSuggestions: true,
      canEscalateToHuman: false,
      canRememberContext: true,
      maxContextLength: 2000,
    },
    defaultResponseConfig: {
      maxTokens: 300,
      temperature: 0.8,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
    },
    // requiredFields: ["personality", "intent"],
    requiredFields: ["personality", "intent", "additionalInformation"],
    optionalFields: ["conversationFlow", "variables"],
  },

  [AGENT_TYPES.AUTOPILOT]: {
    name: "Autopilot Agent",
    description:
      "Specialized agent for automated responses and autopilot functionality",
    defaultBehavior: {
      responseStyle: "empathetic",
      tone: "supportive",
      verbosity: "balanced",
      creativity: 75,
    },
    defaultCapabilities: {
      canHandleComplexQueries: true,
      canAccessKnowledgeBase: true,
      canGenerateSuggestions: false,
      canEscalateToHuman: true,
      canRememberContext: true,
      maxContextLength: 3000,
    },
    defaultResponseConfig: {
      maxTokens: 400,
      temperature: 0.7,
      topP: 0.95,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
    },
    // requiredFields: ["personality", "intent"],
    requiredFields: ["personality", "intent", "additionalInformation"],
    optionalFields: ["conversationFlow", "variables", "contextVariables"],
  },

  [AGENT_TYPES.CUSTOM]: {
    name: "Custom Agent",
    description: "Custom agent with user-defined configuration",
    defaultBehavior: {
      responseStyle: "professional",
      tone: "helpful",
      verbosity: "balanced",
      creativity: 70,
    },
    defaultCapabilities: {
      canHandleComplexQueries: true,
      canAccessKnowledgeBase: true,
      canGenerateSuggestions: true,
      canEscalateToHuman: true,
      canRememberContext: true,
      maxContextLength: 4000,
    },
    defaultResponseConfig: {
      maxTokens: 500,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
    },
    requiredFields: ["personality", "intent"],
    optionalFields: [
      "additionalInformation",
      "variables",
      "contextVariables",
      "knowledgeBase",
      "conversationFlow",
    ],
  },
};

/**
 * Database Schema Interfaces
 */
export interface AIAgent {
  id: string;
  user_id: string;
  name: string;
  type: AgentType;
  description?: string;
  system_prompt: string;
  configuration?: Record<string, any>;
  knowledge_base_ids?: string[];
  is_active?: boolean;
  metadata?: Record<string, any>;
  data?: Record<string, any>;
  channels?: Record<string, { enabled: boolean; settings?: any }>;
  created_at?: string;
  updated_at?: string;
  tag: string;
  model: string;
}

export interface AIAgentInsert {
  id?: string;
  name: string;
  type: AgentType;
  user_id: string;
  system_prompt?: string;
  knowledge_base_ids?: string[];
  data: Partial<AgentDataSchema>;
  description?: string;
  configuration?: Record<string, any>;
  is_active?: boolean;
  metadata?: Record<string, any>;
  channels?: Record<string, { enabled: boolean; settings?: any }>;
  tag: string;
  model: string;
}

export interface AIAgentUpdate {
  name?: string;
  type?: AgentType;
  system_prompt?: string;
  knowledge_base_ids?: string[];
  data?: Partial<AgentDataSchema>;
  description?: string;
  configuration?: Record<string, any>;
  is_active?: boolean;
  metadata?: Record<string, any>;
  updated_at?: string;
  channels?: Record<string, { enabled: boolean; settings?: any }>;
}

/**
 * Utility Types for Frontend
 */
export interface AgentFormData {
  // Basic Info
  name: string;
  description: string;
  type: AgentType;

  // Core Configuration
  personality: string;
  intent: string;
  additionalInformation: string;

  // Advanced Settings
  behavior?: Partial<AgentDataSchema["behavior"]>;
  capabilities?: Partial<AgentDataSchema["capabilities"]>;
  responseConfig?: Partial<AgentDataSchema["responseConfig"]>;
  variables?: Record<string, string | number | boolean>;
  contextVariables?: Partial<AgentDataSchema["contextVariables"]>;
  knowledgeBase?: Partial<AgentDataSchema["knowledgeBase"]>;
  conversationFlow?: Partial<AgentDataSchema["conversationFlow"]>;
  safety?: Partial<AgentDataSchema["safety"]>;
  integrations?: Partial<AgentDataSchema["integrations"]>;
}

/**
 * API Response Types
 */
export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AgentListResponse
  extends AgentResponse<{
    agents: AIAgent[];
    total: number;
    page?: number;
    limit?: number;
  }> {}

export interface AgentTestResponse
  extends AgentResponse<{
    response: string;
    responseTime: number;
    tokensUsed: number;
    knowledgeSourcesUsed: string[];
    confidence: number;
  }> {}

/**
 * Validation Schemas
 */
export interface AgentValidationRules {
  name: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
  personality: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
  intent: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
  additionalInformation: {
    maxLength: number;
    required: boolean;
  };
  systemPrompt: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
}

export const AGENT_VALIDATION_RULES: AgentValidationRules = {
  name: { minLength: 3, maxLength: 100, required: true },
  personality: { minLength: 10, maxLength: 10000, required: true },
  intent: { minLength: 10, maxLength: 10000, required: true },
  additionalInformation: { maxLength: 10000, required: false },
  systemPrompt: { minLength: 20, maxLength: 10000, required: true },
};

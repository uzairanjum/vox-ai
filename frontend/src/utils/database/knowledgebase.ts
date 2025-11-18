// Agent Types
import type { AgentType } from "@/types/aiAgent";

// Knowledge Base Types
export interface KnowledgeBaseSourceGroup {
  count: number;
  data: Record<string, any>[]; // array of kb_source rows
}

export interface KnowledgeBaseSources {
  files: KnowledgeBaseSourceGroup;
  webUrls: KnowledgeBaseSourceGroup;
  faqs: KnowledgeBaseSourceGroup;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  user_id: string;
  status: string;
  created_at: string;
  description: string;
  sources: KnowledgeBaseSources;
}

export interface KnowledgeBaseInsert {
  id?: string;
  name: string;
  type: number;
  user_id: string;
  provider_type: number;
  provider_type_sub_id?: string;
  data?: Record<string, any>;
  agents_id?: string;
  summary?: string;
  faq?: Record<string, any>;
  file_uploads?: string;
  related_kb_ids?: string;
}

export interface KnowledgeBaseUpdate {
  name?: string;
  type?: number;
  provider_type?: number;
  provider_type_sub_id?: string;
  data?: Record<string, any>;
  agents_id?: string;
  summary?: string;
  faq?: Record<string, any>;
  file_uploads?: string;
  related_kb_ids?: string;
  updated_at?: string;
}

// AI Agent Types - Updated to match actual database schema
export interface AIAgent {
  id: string;
  created_at?: string;
  updated_at?: string;
  name: string;
  type: AgentType; // Changed to AgentType to match types interface
  user_id: string;
  description?: string;
  system_prompt: string; // Fixed: matches DB schema exactly [[memory:1067321682563687240]]
  configuration?: Record<string, any>;
  knowledge_base_ids?: string[]; // Fixed: array type to match database schema [[memory:1067321682563687240]]
  is_active?: boolean;
  metadata?: Record<string, any>;
  data?: Record<string, any>;
}

export interface AIAgentInsert {
  id?: string;
  name: string;
  type: AgentType; // Changed to AgentType to match types interface
  user_id: string;
  description?: string;
  system_prompt?: string; // Made optional to match types interface
  configuration?: Record<string, any>;
  knowledge_base_ids?: string[]; // Fixed: array type to match database schema [[memory:1067321682563687240]]
  is_active?: boolean;
  metadata?: Record<string, any>;
  data?: Record<string, any>;
}

export interface AIAgentUpdate {
  name?: string;
  type?: AgentType; // Changed to AgentType to match types interface
  description?: string;
  system_prompt?: string;
  configuration?: Record<string, any>;
  knowledge_base_ids?: string[]; // Fixed: array type to match database schema [[memory:1067321682563687240]]
  is_active?: boolean;
  metadata?: Record<string, any>;
  data?: Record<string, any>;
  updated_at?: string;
  channels?: Record<string, { enabled: boolean; settings?: any }>;
}

// Knowledge Base Type Settings
export const KB_SETTINGS = {
  // Primary conversation knowledge base (one per conversation)
  KB_CONVERSATION: {
    type: 1,
    name: "Conversation",
    description: "Primary conversation context and history",
    icon: "MessageSquare",
    isPrimary: true,
    autoCreated: true,
  },

  // Custom knowledge bases (user created)
  KB_FILE_UPLOAD: {
    type: 2,
    name: "File Upload",
    description: "Documents, PDFs, text files",
    icon: "FileText",
    isPrimary: false,
    autoCreated: false,
    supportedFormats: ["pdf", "doc", "docx", "txt"],
  },

  KB_FAQ: {
    type: 3,
    name: "FAQ",
    description: "Frequently asked questions and answers",
    icon: "HelpCircle",
    isPrimary: false,
    autoCreated: false,
  },

  KB_WEB_SCRAPER: {
    type: 4,
    name: "Web Scraper",
    description: "Content scraped from websites",
    icon: "Globe",
    isPrimary: false,
    autoCreated: false,
  },
} as const;

// Agent type constants aligned with FastAPI - Updated for generic agent system
export const AGENT_TYPES = {
  GENERIC: 1,
  QUERY: 2,
  SUGGESTIONS: 3,
  AUTOPILOT: 4,
  CUSTOM: 99,
} as const;

// Default agent configurations that mirror FastAPI defaults
export interface DefaultAgentTemplate {
  name: string;
  type: number;
  description: string;
  agentType: string;
  personality: string;
  intent: string;
  additionalInformation: string;
  system_prompt: string;
  configuration: Record<string, any>;
  metadata: Record<string, any>;
}

export const DEFAULT_AGENT_TEMPLATES: DefaultAgentTemplate[] = [
  {
    name: "Default Query Agent",
    type: AGENT_TYPES.QUERY,
    description: "Default agent for answering customer queries",
    agentType: "query",
    personality:
      "You are a helpful AI assistant responding directly to customers.",
    intent:
      "Your goal is to provide helpful, accurate responses based on the conversation context.",
    additionalInformation:
      "Be conversational, empathetic, and specific to their situation.",
    system_prompt:
      'You are a helpful AI assistant responding directly to customers. \n\nCONVERSATION CONTEXT:\n{context}\n\nCUSTOMER\'S QUESTION:\n"{query}"\n\nProvide a helpful, accurate response based on the conversation context. Be conversational, empathetic, and specific to their situation.',
    configuration: {
      max_tokens: 500,
      temperature: 0.7,
    },
    metadata: {
      is_default: true,
      created_from: "system_template",
    },
  },
  {
    name: "Default Suggestions Agent",
    type: AGENT_TYPES.SUGGESTIONS,
    description: "Default agent for generating follow-up suggestions",
    agentType: "suggestions",
    personality:
      "You're a customer service expert helping generate follow-up messages.",
    intent:
      "Your goal is to generate exactly 3 follow-up suggestions to continue conversations helpfully.",
    additionalInformation:
      "Each suggestion should be specific to the conversation, show you've been listening, offer genuine help, and sound natural and caring.",
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
    configuration: {
      max_suggestions: 3,
      temperature: 0.8,
    },
    metadata: {
      is_default: true,
      created_from: "system_template",
    },
  },
  {
    name: "Default Response Agent",
    type: AGENT_TYPES.AUTOPILOT,
    description: "Default agent for generating responses to customer messages",
    agentType: "response",
    personality:
      "You're a customer service representative responding to a customer.",
    intent:
      "Your goal is to write helpful, professional responses that address customer concerns.",
    additionalInformation:
      "Show empathy and understanding, address their specific concern, offer practical help, and sound natural and caring.",
    system_prompt:
      "You're a customer service representative responding to a customer.\n\nCONVERSATION CONTEXT:\n{context}\n\nCUSTOMER'S MESSAGE:\n\"{last_customer_message}\"\n\nWrite a helpful, professional response that:\n- Shows empathy and understanding\n- Addresses their specific concern\n- Offers practical help\n- Sounds natural and caring\n\nWrite one direct response to send to this customer:",
    configuration: {
      max_tokens: 300,
      temperature: 0.7,
    },
    metadata: {
      is_default: true,
      created_from: "system_template",
    },
  },
];

// Query History for Conversations (stored in conversation data)
export interface QueryMessage {
  id: string;
  query: string;
  response: string;
  timestamp: string;
  user_id: string;
  metadata?: Record<string, any>;
}

// API Response Types
export interface KnowledgeBaseResponse {
  success: boolean;
  data?: KnowledgeBase;
  error?: string;
}

export interface KnowledgeBasesResponse {
  success: boolean;
  data?: KnowledgeBase[];
  total?: number;
  error?: string;
}

export interface AIAgentResponse {
  success: boolean;
  data?: AIAgent;
  error?: string;
}

export interface AIAgentsResponse {
  success: boolean;
  data?: AIAgent[];
  total?: number;
  error?: string;
}

export interface QueryHistoryResponse {
  success: boolean;
  data?: QueryMessage[];
  total?: number;
  error?: string;
}

// Utility Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface FilterParams {
  type?: number;
  user_id?: string;
  search?: string;
  created_after?: string;
  created_before?: string;
}

export interface KnowledgeBaseFilters extends FilterParams {
  provider_type?: number;
  has_summary?: boolean;
  has_faqs?: boolean;
}

export interface AgentFilters extends FilterParams {
  has_kb?: boolean;
  is_active?: boolean;
  active_only?: boolean;
}

// Training Status Types
export interface TrainingStatus {
  is_trained: boolean;
  last_updated?: string;
  message_count?: number;
  vector_count?: number;
  status: "pending" | "training" | "completed" | "failed";
}

// File Upload Types
export interface FileUpload {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  uploaded_at: string;
  processed: boolean;
  metadata?: Record<string, any>;
}

// Web Scraper Types
export interface WebScrapedData {
  url: string;
  title?: string;
  content: string;
  scraped_at: string;
  metadata?: {
    word_count?: number;
    links?: string[];
    images?: string[];
    [key: string]: any;
  };
}

// FAQ Types
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
  confidence?: number;
  created_at: string;
  updated_at: string;
}

export interface FAQInsert {
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
  confidence?: number;
}

// Conversation Summary Types
export interface ConversationSummary {
  conversation_id: string;
  summary: string;
  key_points: string[];
  sentiment: "positive" | "negative" | "neutral";
  topics: string[];
  action_items?: string[];
  created_at: string;
  message_count: number;
}

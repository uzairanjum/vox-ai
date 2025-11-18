// AI Configuration Settings - Enhanced for Autopilot
export interface AIConfig {
  model: string;
  temperature: number;
  humanlikeBehavior: boolean;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  // Enhanced autopilot-specific settings
  responseDelay?: number; // minutes
  maxResponsesPerDay?: number;
  operatingHours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  responseStyle?: 'professional' | 'friendly' | 'casual' | 'formal';
  contextWindow?: number; // number of previous messages to consider
  confidenceThreshold?: number; // 0-1, minimum confidence to send response
  escalationKeywords?: string[]; // keywords that trigger human handoff
  customInstructions?: string; // specific instructions for this configuration
}

// Available AI Models - Updated with correct OpenAI API model names
export const AI_MODELS = {
  // OpenAI GPT-4o Series (Latest Flagship Models)
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
  
  // OpenAI GPT-4 Series (Current Generation)
  GPT_4_TURBO: 'gpt-4-turbo-2024-04-09',
  GPT_4: 'gpt-4',
  
  // OpenAI GPT-3.5 Series (Legacy but Still Supported)
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
} as const;

export type AIModel = typeof AI_MODELS[keyof typeof AI_MODELS];

// Temperature Presets
export const TEMPERATURE_PRESETS = {
  VERY_FOCUSED: 0.0,     // Deterministic, consistent responses
  FOCUSED: 0.1,          // Minimal creativity, high consistency
  BALANCED: 0.3,         // Good balance of consistency and creativity
  CREATIVE: 0.7,         // More creative responses
  VERY_CREATIVE: 0.9,    // Highly creative, less predictable
  MAXIMUM: 1.0,          // Maximum creativity
} as const;

// Response Style Configurations
export const RESPONSE_STYLES = {
  professional: {
    name: 'Professional',
    description: 'Formal, business-appropriate tone',
    instructions: 'Use professional language, proper grammar, and maintain a business-appropriate tone.'
  },
  friendly: {
    name: 'Friendly',
    description: 'Warm and approachable',
    instructions: 'Be warm, friendly, and approachable while maintaining professionalism.'
  },
  casual: {
    name: 'Casual',
    description: 'Relaxed and conversational',
    instructions: 'Use a casual, conversational tone that feels natural and relaxed.'
  },
  formal: {
    name: 'Formal',
    description: 'Very formal and structured',
    instructions: 'Use very formal language, complete sentences, and structured responses.'
  }
} as const;

// Autopilot Preset Configurations
export const AUTOPILOT_PRESETS = {
  conservative: {
    name: 'Conservative',
    description: 'Careful responses, higher human oversight',
    config: {
      temperature: TEMPERATURE_PRESETS.FOCUSED,
      responseDelay: 10,
      maxResponsesPerDay: 20,
      confidenceThreshold: 0.8,
      responseStyle: 'professional' as const
    }
  },
  balanced: {
    name: 'Balanced',
    description: 'Good balance of automation and oversight',
    config: {
      temperature: TEMPERATURE_PRESETS.BALANCED,
      responseDelay: 5,
      maxResponsesPerDay: 50,
      confidenceThreshold: 0.7,
      responseStyle: 'friendly' as const
    }
  },
  aggressive: {
    name: 'Aggressive',
    description: 'More automated responses, less oversight',
    config: {
      temperature: TEMPERATURE_PRESETS.CREATIVE,
      responseDelay: 2,
      maxResponsesPerDay: 100,
      confidenceThreshold: 0.6,
      responseStyle: 'friendly' as const
    }
  }
} as const;

// Default AI Configuration - Enhanced
export const DEFAULT_AI_CONFIG: AIConfig = {
  model: AI_MODELS.GPT_4O_MINI,
  temperature: TEMPERATURE_PRESETS.BALANCED,
  humanlikeBehavior: true,
  maxTokens: 1000,
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  responseDelay: 5,
  maxResponsesPerDay: 50,
  operatingHours: {
    enabled: true,
    start: '09:00',
    end: '17:00',
    timezone: 'America/New_York'
  },
  responseStyle: 'professional',
  contextWindow: 10,
  confidenceThreshold: 0.7,
  escalationKeywords: ['urgent', 'complaint', 'cancel', 'refund'],
  customInstructions: ''
};

// Enhanced Feature-specific configurations
export const FEATURE_AI_CONFIGS: Record<string, Partial<AIConfig>> = {
  query: {
    model: AI_MODELS.GPT_4O_MINI,
    temperature: TEMPERATURE_PRESETS.FOCUSED,
    humanlikeBehavior: true,
    maxTokens: 1000,
    contextWindow: 10
  },
  suggestions: {
    model: AI_MODELS.GPT_4O_MINI,
    temperature: TEMPERATURE_PRESETS.CREATIVE,
    humanlikeBehavior: true,
    maxTokens: 800,
    contextWindow: 5
  },
  autopilot: {
    model: AI_MODELS.GPT_4O,
    temperature: TEMPERATURE_PRESETS.BALANCED,
    humanlikeBehavior: true,
    maxTokens: 1200,
    responseDelay: 5, // 5 minutes default
    maxResponsesPerDay: 50,
    operatingHours: {
      enabled: true,
      start: '09:00',
      end: '17:00',
      timezone: 'America/New_York'
    },
    responseStyle: 'professional',
    contextWindow: 15,
    confidenceThreshold: 0.7,
    escalationKeywords: ['urgent', 'complaint', 'cancel', 'refund', 'angry', 'frustrated'],
    customInstructions: 'You are a helpful customer service assistant. Always be polite, professional, and helpful. If you cannot help with something, politely suggest they contact a human agent.'
  },
  summary: {
    model: AI_MODELS.GPT_4O_MINI,
    temperature: TEMPERATURE_PRESETS.VERY_FOCUSED,
    humanlikeBehavior: false,
    maxTokens: 500,
    contextWindow: 50
  },
  training: {
    model: AI_MODELS.GPT_4O_MINI,
    temperature: TEMPERATURE_PRESETS.VERY_FOCUSED,
    humanlikeBehavior: false,
    maxTokens: 2000,
    contextWindow: 100
  }
};

// Model Information - Updated with correct models and accurate information
export const MODEL_INFO: Record<AIModel, {
  name: string;
  provider: string;
  description: string;
  maxTokens: number;
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  capabilities: string[];
}> = {
  // GPT-4o Series - Latest Flagship Models
  [AI_MODELS.GPT_4O]: {
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'OpenAI\'s flagship multimodal model (text, image, audio). Excellent for a wide range of tasks.',
    maxTokens: 128000,
    inputCostPer1kTokens: 0.0025,  // $2.50 per 1M tokens
    outputCostPer1kTokens: 0.010,  // $10 per 1M tokens
    capabilities: ['text', 'images', 'audio', 'multimodal', 'function-calling', 'json-mode']
  },
  [AI_MODELS.GPT_4O_MINI]: {
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Compact version of GPT-4o, suitable for general tasks.',
    maxTokens: 128000,
    inputCostPer1kTokens: 0.00015, // $0.15 per 1M tokens
    outputCostPer1kTokens: 0.0006, // $0.60 per 1M tokens
    capabilities: ['text', 'images', 'multimodal', 'function-calling', 'json-mode']
  },
  
  // GPT-4 Series - Current Generation
  [AI_MODELS.GPT_4_TURBO]: {
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    description: 'A capable model that was a common choice before GPT-4o, and may still be preferred for certain tasks.',
    maxTokens: 128000,
    inputCostPer1kTokens: 0.01,    // $10 per 1M tokens
    outputCostPer1kTokens: 0.03,   // $30 per 1M tokens
    capabilities: ['text', 'images', 'function-calling', 'json-mode', 'vision']
  },
  [AI_MODELS.GPT_4]: {
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'Original GPT-4 model with excellent reasoning capabilities.',
    maxTokens: 8192,
    inputCostPer1kTokens: 0.03,    // $30 per 1M tokens
    outputCostPer1kTokens: 0.06,   // $60 per 1M tokens
    capabilities: ['text', 'function-calling', 'reasoning']
  },
  
  // GPT-3.5 Series - Legacy but Still Supported
  [AI_MODELS.GPT_3_5_TURBO]: {
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'Reliable model for general text tasks and applications.',
    maxTokens: 16385,
    inputCostPer1kTokens: 0.0005,  // $0.50 per 1M tokens
    outputCostPer1kTokens: 0.0015, // $1.50 per 1M tokens
    capabilities: ['text', 'function-calling']
  }
};

// Model Groups for UI organization
export const MODEL_GROUPS = {
  openai: {
    name: 'OpenAI',
    color: 'emerald',
    models: [
      AI_MODELS.GPT_4O,
      AI_MODELS.GPT_4O_MINI,
      AI_MODELS.GPT_4_TURBO,
      AI_MODELS.GPT_4,
      AI_MODELS.GPT_3_5_TURBO
    ]
  }
};

// Provider Information
export const PROVIDER_INFO = {
  openai: {
    name: 'OpenAI',
    key: 'openai',
    color: 'emerald'
  }
};

// Temperature descriptions
export const TEMPERATURE_DESCRIPTIONS = {
  [TEMPERATURE_PRESETS.VERY_FOCUSED]: 'Very Focused - Deterministic, consistent responses',
  [TEMPERATURE_PRESETS.FOCUSED]: 'Focused - Minimal creativity, high consistency',
  [TEMPERATURE_PRESETS.BALANCED]: 'Balanced - Good balance of consistency and creativity',
  [TEMPERATURE_PRESETS.CREATIVE]: 'Creative - More creative responses',
  [TEMPERATURE_PRESETS.VERY_CREATIVE]: 'Very Creative - Highly creative, less predictable',
  [TEMPERATURE_PRESETS.MAXIMUM]: 'Maximum - Maximum creativity and randomness'
} as const;

export function isValidModel(model: string): model is AIModel {
  return Object.values(AI_MODELS).includes(model as AIModel);
}

export function validateAIConfig(config: Partial<AIConfig>): AIConfig {
  const validated: AIConfig = { ...DEFAULT_AI_CONFIG };

  if (config.model && isValidModel(config.model)) {
    validated.model = config.model;
  }

  if (config.temperature !== undefined && config.temperature >= 0 && config.temperature <= 1) {
    validated.temperature = config.temperature;
  }

  if (config.humanlikeBehavior !== undefined) {
    validated.humanlikeBehavior = config.humanlikeBehavior;
  }

  if (config.maxTokens && config.maxTokens > 0) {
    const modelInfo = MODEL_INFO[validated.model as AIModel];
    validated.maxTokens = Math.min(config.maxTokens, modelInfo.maxTokens);
  }

  if (config.topP !== undefined && config.topP >= 0 && config.topP <= 1) {
    validated.topP = config.topP;
  }

  if (config.frequencyPenalty !== undefined && config.frequencyPenalty >= -2 && config.frequencyPenalty <= 2) {
    validated.frequencyPenalty = config.frequencyPenalty;
  }

  if (config.presencePenalty !== undefined && config.presencePenalty >= -2 && config.presencePenalty <= 2) {
    validated.presencePenalty = config.presencePenalty;
  }

  if (config.responseDelay !== undefined && config.responseDelay >= 0 && config.responseDelay <= 120) {
    validated.responseDelay = config.responseDelay;
  }

  if (config.maxResponsesPerDay !== undefined && config.maxResponsesPerDay >= 0 && config.maxResponsesPerDay <= 100) {
    validated.maxResponsesPerDay = config.maxResponsesPerDay;
  }

  if (config.operatingHours !== undefined) {
    validated.operatingHours = config.operatingHours;
  }

  if (config.responseStyle !== undefined && RESPONSE_STYLES.hasOwnProperty(config.responseStyle)) {
    validated.responseStyle = config.responseStyle;
  }

  if (config.contextWindow !== undefined && config.contextWindow >= 0 && config.contextWindow <= 100) {
    validated.contextWindow = config.contextWindow;
  }

  if (config.confidenceThreshold !== undefined && config.confidenceThreshold >= 0 && config.confidenceThreshold <= 1) {
    validated.confidenceThreshold = config.confidenceThreshold;
  }

  if (config.escalationKeywords !== undefined && Array.isArray(config.escalationKeywords)) {
    validated.escalationKeywords = config.escalationKeywords;
  }

  if (config.customInstructions !== undefined && typeof config.customInstructions === 'string') {
    validated.customInstructions = config.customInstructions;
  }

  return validated;
}

// Get feature-specific configuration
export function getFeatureAIConfig(feature: keyof typeof FEATURE_AI_CONFIGS, customConfig?: Partial<AIConfig>): AIConfig {
  const baseConfig = { ...DEFAULT_AI_CONFIG };
  const featureConfig = FEATURE_AI_CONFIGS[feature] || {};
  const finalConfig = { ...baseConfig, ...featureConfig, ...customConfig };
  return validateAIConfig(finalConfig);
}

// Get model display information with pricing
export function getModelDisplayInfo(model: AIModel) {
  const info = MODEL_INFO[model];
  return {
    ...info,
    inputCost: `$${info.inputCostPer1kTokens.toFixed(6)}/1k`,
    outputCost: `$${info.outputCostPer1kTokens.toFixed(6)}/1k`,
    costRange: `$${info.inputCostPer1kTokens.toFixed(6)}-${info.outputCostPer1kTokens.toFixed(6)}/1k`
  };
}

// Get temperature display name
export function getTemperatureDisplayName(temperature: number): string {
  // Find the closest preset
  const presets = Object.entries(TEMPERATURE_PRESETS);
  const closest = presets.reduce((prev, curr) => {
    return Math.abs(curr[1] - temperature) < Math.abs(prev[1] - temperature) ? curr : prev;
  });

  if (closest[1] === temperature) {
    return TEMPERATURE_DESCRIPTIONS[closest[1] as keyof typeof TEMPERATURE_DESCRIPTIONS].split(' - ')[0];
  }

  return `Custom`;
}

// Get provider information by model
export function getProviderByModel(model: AIModel) {
  return PROVIDER_INFO.openai;
} 
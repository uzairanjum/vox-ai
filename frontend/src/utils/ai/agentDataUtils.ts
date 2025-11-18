import {
  AgentDataSchema,
  AgentType,
  AGENT_TYPES,
  AGENT_TYPE_CONFIGS,
  AgentFormData,
  AIAgent,
  AIAgentInsert,
  AGENT_VALIDATION_RULES,
} from "@/types/aiAgent";

/**
 * Create default agent data based on type
 */
export function createDefaultAgentData(type: AgentType): AgentDataSchema {
  const config = AGENT_TYPE_CONFIGS[type];

  return {
    // Core Properties
    personality: "",
    intent: "",
    model: "",
    tag: "", 
    additionalInformation: '',

    // Behavior Configuration
    behavior: {
      responseStyle: config.defaultBehavior.responseStyle || "professional",
      tone: config.defaultBehavior.tone || "helpful",
      verbosity: config.defaultBehavior.verbosity || "balanced",
      creativity: config.defaultBehavior.creativity || 70,
    },

    // Capabilities
    capabilities: {
      canHandleComplexQueries:
        config.defaultCapabilities.canHandleComplexQueries || true,
      canAccessKnowledgeBase:
        config.defaultCapabilities.canAccessKnowledgeBase || true,
      canGenerateSuggestions:
        config.defaultCapabilities.canGenerateSuggestions || false,
      canEscalateToHuman: config.defaultCapabilities.canEscalateToHuman || true,
      canRememberContext: config.defaultCapabilities.canRememberContext || true,
      maxContextLength: config.defaultCapabilities.maxContextLength || 4000,
    },

    // Response Configuration
    responseConfig: {
      maxTokens: config.defaultResponseConfig.maxTokens || 500,
      temperature: config.defaultResponseConfig.temperature || 0.7,
      topP: config.defaultResponseConfig.topP || 1.0,
      frequencyPenalty: config.defaultResponseConfig.frequencyPenalty || 0.0,
      presencePenalty: config.defaultResponseConfig.presencePenalty || 0.0,
      stopSequences: [],
    },

    // Variables
    variables: {},
    contextVariables: {
      businessName: "",
      businessType: "",
      location: "",
      workingHours: "",
      contactInfo: "",
      specialOffers: "",
      commonPolicies: "",
    },

    // Prompts
    prompts: {
      systemPrompt: "",
      customInstructions: "",
      exampleInteractions: [],
      fallbackResponses: [
        "I'm sorry, I don't have enough information to help with that. Let me connect you with someone who can assist you better.",
        "I want to make sure I give you the most accurate information. Could you provide a bit more detail about what you're looking for?",
        "That's a great question! While I work on finding the best answer for you, is there anything else I can help you with in the meantime?",
      ],
    },

    // Knowledge Base
    knowledgeBase: {
      preferredSources: [],
      searchStrategy: "hybrid",
      confidenceThreshold: 0.7,
      maxSources: 3,
      citeSources: false,
    },

    // Conversation Flow
    conversationFlow: {
      canInitiateConversation: false,
      shouldAskFollowUp: type === AGENT_TYPES.SUGGESTIONS,
      maxConsecutiveResponses: 3,
      escalationTriggers: [
        "speak to human",
        "manager",
        "complaint",
        "refund",
        "cancel",
      ],
      endConversationPhrases: ["goodbye", "thanks", "thank you", "bye", "done"],
    },

    // Performance
    performance: {
      successRate: 0,
      averageResponseTime: 0,
      userSatisfactionScore: 0,
      totalInteractions: 0,
      lastOptimized: new Date().toISOString(),
    },

    // Safety
    safety: {
      contentFiltering: true,
      blockedTopics: ["illegal", "harmful", "inappropriate"],
      allowedLanguages: ["en"],
      requireHumanApproval: false,
      sensitivityLevel: "medium",
    },

    // Integrations
    integrations: {
      ghlSettings: {
        autoRespond: false,
        delayMinutes: 5,
        maxRepliesPerDay: 10,
        operatingHours: {
          enabled: false,
          timezone: "UTC",
          schedule: {
            monday: { start: "09:00", end: "17:00" },
            tuesday: { start: "09:00", end: "17:00" },
            wednesday: { start: "09:00", end: "17:00" },
            thursday: { start: "09:00", end: "17:00" },
            friday: { start: "09:00", end: "17:00" },
            saturday: { start: "10:00", end: "16:00" },
            sunday: { start: "10:00", end: "16:00" },
          },
        },
      },
      webhooks: [],
      apiKeys: {},
    },

    // Metadata
    metadata: {
      version: "1.0.0",
      createdBy: "system",
      lastModifiedBy: "system",
      tags: [],
      category: config.name,
      isActive: true,
      isDefault: false,
      isPublic: false,
    },

    // Extensions
    extensions: {},
  };
}

/**
 * Validate agent data according to type requirements
 */
export function validateAgentData(
  data: Partial<AgentDataSchema>,
  type: AgentType
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config = AGENT_TYPE_CONFIGS[type];

  // Check required fields
  config.requiredFields.forEach((field) => {
    if (
      !data[field] ||
      (typeof data[field] === "string" && data[field].trim() === "")
    ) {
      errors.push(`${field} is required for ${config.name}`);
    }
  });

  // Validate specific fields
  if (data.personality) {
    if (
      data.personality.length < AGENT_VALIDATION_RULES.personality.minLength
    ) {
      errors.push(
        `Personality must be at least ${AGENT_VALIDATION_RULES.personality.minLength} characters`
      );
    }
    if (
      data.personality.length > AGENT_VALIDATION_RULES.personality.maxLength
    ) {
      errors.push(
        `Personality must be less than ${AGENT_VALIDATION_RULES.personality.maxLength} characters`
      );
    }
  }

  if (data.intent) {
    if (data.intent.length < AGENT_VALIDATION_RULES.intent.minLength) {
      errors.push(
        `Intent must be at least ${AGENT_VALIDATION_RULES.intent.minLength} characters`
      );
    }
    if (data.intent.length > AGENT_VALIDATION_RULES.intent.maxLength) {
      errors.push(
        `Intent must be less than ${AGENT_VALIDATION_RULES.intent.maxLength} characters`
      );
    }
  }

  // if (data.additionalInformation && data.additionalInformation.length > AGENT_VALIDATION_RULES.additionalInformation.maxLength) {
  //   errors.push(`Additional information must be less than ${AGENT_VALIDATION_RULES.additionalInformation.maxLength} characters`);
  // }

  // Validate behavior settings
  if (data.behavior?.creativity !== undefined) {
    if (data.behavior.creativity < 0 || data.behavior.creativity > 100) {
      errors.push("Creativity must be between 0 and 100");
    }
  }

  // Validate response config
  if (data.responseConfig) {
    if (data.responseConfig.temperature !== undefined) {
      if (
        data.responseConfig.temperature < 0 ||
        data.responseConfig.temperature > 2
      ) {
        errors.push("Temperature must be between 0 and 2");
      }
    }
    if (data.responseConfig.topP !== undefined) {
      if (data.responseConfig.topP < 0 || data.responseConfig.topP > 1) {
        errors.push("Top P must be between 0 and 1");
      }
    }
    if (data.responseConfig.maxTokens !== undefined) {
      if (
        data.responseConfig.maxTokens < 50 ||
        data.responseConfig.maxTokens > 4000
      ) {
        warnings.push("Max tokens should typically be between 50 and 4000");
      }
    }
  }

  // Type-specific validations
  if (type === AGENT_TYPES.SUGGESTIONS) {
    if (data.capabilities?.canGenerateSuggestions === false) {
      warnings.push(
        "Suggestions agents should typically have canGenerateSuggestions enabled"
      );
    }
  }

  if (type === AGENT_TYPES.QUERY) {
    if (data.capabilities?.canHandleComplexQueries === false) {
      warnings.push(
        "Query agents should typically have canHandleComplexQueries enabled"
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convert form data to agent data schema
 */
export function formDataToAgentData(
  formData: AgentFormData,
  existingData?: Partial<AgentDataSchema>
): AgentDataSchema {
  const defaultData = createDefaultAgentData(formData.type);
  const baseData = existingData || {};

  return {
    ...defaultData,
    ...baseData,

    // Core fields from form
    personality: formData.personality,
    intent: formData.intent,
    additionalInformation: formData.additionalInformation,

    // Merge advanced settings
    behavior: {
      ...defaultData.behavior,
      ...baseData.behavior,
      ...formData.behavior,
    },

    capabilities: {
      ...defaultData.capabilities,
      ...baseData.capabilities,
      ...formData.capabilities,
    },

    responseConfig: {
      ...defaultData.responseConfig,
      ...baseData.responseConfig,
      ...formData.responseConfig,
    },

    variables: {
      ...defaultData.variables,
      ...baseData.variables,
      ...formData.variables,
    },

    contextVariables: {
      ...defaultData.contextVariables,
      ...baseData.contextVariables,
      ...formData.contextVariables,
    },

    knowledgeBase: {
      ...defaultData.knowledgeBase,
      ...baseData.knowledgeBase,
      ...formData.knowledgeBase,
    },

    conversationFlow: {
      ...defaultData.conversationFlow,
      ...baseData.conversationFlow,
      ...formData.conversationFlow,
    },

    safety: {
      ...defaultData.safety,
      ...baseData.safety,
      ...formData.safety,
    },

    integrations: {
      ...defaultData.integrations,
      ...baseData.integrations,
      ...formData.integrations,
    },

    metadata: {
      ...defaultData.metadata,
      ...baseData.metadata,
      lastModifiedBy: "user",
      version: incrementVersion(baseData.metadata?.version || "1.0.0"),
    },
  };
}

/**
 * Convert agent data to form data
 */
export function agentDataToFormData(agent: AIAgent): AgentFormData {
  const agentData = agent.data || {};

  return {
    name: agent.name,
    description: agent.description || "",
    type: agent.type,
    personality: agentData.personality || "",
    intent: agentData.intent || "",
    additionalInformation: agentData.additionalInformation || '',
    behavior: agentData.behavior,
    capabilities: agentData.capabilities,
    responseConfig: agentData.responseConfig,
    variables: agentData.variables,
    contextVariables: agentData.contextVariables,
    knowledgeBase: agentData.knowledgeBase,
    conversationFlow: agentData.conversationFlow,
    safety: agentData.safety,
    integrations: agentData.integrations,
  };
}

/**
 * Generate system prompt from agent data
 */
export function generateSystemPrompt(
  data: AgentDataSchema,
  agentName: string
): string {
  // const { personality, intent, behavior, contextVariables } = data;
  const { personality, intent, additionalInformation, behavior, contextVariables } = data;

  let prompt = `You are ${agentName}, an AI assistant with the following characteristics:\n\n`;

  // Add personality
  prompt += `PERSONALITY:\n${personality}\n\n`;

  // Add intent
  prompt += `YOUR MAIN GOAL:\n${intent}\n\n`;

  // Add behavior configuration
  prompt += `COMMUNICATION STYLE:\n`;
  prompt += `- Response Style: ${behavior.responseStyle}\n`;
  prompt += `- Tone: ${behavior.tone}\n`;
  prompt += `- Verbosity: ${behavior.verbosity}\n`;
  prompt += `- Creativity Level: ${behavior.creativity}/100\n\n`;

  // Add context variables if available
  if (contextVariables && Object.values(contextVariables).some((v) => v)) {
    prompt += `BUSINESS CONTEXT:\n`;
    if (contextVariables.businessName)
      prompt += `- Business: ${contextVariables.businessName}\n`;
    if (contextVariables.businessType)
      prompt += `- Type: ${contextVariables.businessType}\n`;
    if (contextVariables.location)
      prompt += `- Location: ${contextVariables.location}\n`;
    if (contextVariables.workingHours)
      prompt += `- Hours: ${contextVariables.workingHours}\n`;
    if (contextVariables.contactInfo)
      prompt += `- Contact: ${contextVariables.contactInfo}\n`;
    if (contextVariables.specialOffers)
      prompt += `- Special Offers: ${contextVariables.specialOffers}\n`;
    if (contextVariables.commonPolicies)
      prompt += `- Policies: ${contextVariables.commonPolicies}\n`;
    prompt += "\n";
  }

  // Add additional information
  if (additionalInformation) {
    prompt += `ADDITIONAL INSTRUCTIONS:\n${additionalInformation}\n\n`;
  }

  // Add custom instructions from prompts
  if (data.prompts?.customInstructions) {
    prompt += `CUSTOM INSTRUCTIONS:\n${data.prompts.customInstructions}\n\n`;
  }

  // Add conversation flow rules
  if (data.conversationFlow) {
    prompt += `CONVERSATION GUIDELINES:\n`;
    if (data.conversationFlow.shouldAskFollowUp) {
      prompt += `- Ask relevant follow-up questions when appropriate\n`;
    }
    if (data.conversationFlow.escalationTriggers?.length > 0) {
      prompt += `- Escalate to human if customer mentions: ${data.conversationFlow.escalationTriggers.join(
        ", "
      )}\n`;
    }
    if (data.conversationFlow.maxConsecutiveResponses > 0) {
      prompt += `- Maximum consecutive responses: ${data.conversationFlow.maxConsecutiveResponses}\n`;
    }
    prompt += "\n";
  }

  // Add safety guidelines
  if (data.safety?.blockedTopics?.length > 0) {
    prompt += `SAFETY GUIDELINES:\n`;
    prompt += `- Do not discuss: ${data.safety.blockedTopics.join(", ")}\n`;
    prompt += `- Maintain ${data.safety.sensitivityLevel} sensitivity level\n\n`;
  }

  prompt += `Always be helpful, accurate, and aligned with the business goals while maintaining your defined personality and communication style.`;

  return prompt;
}

/**
 * Merge agent data with updates
 */
export function mergeAgentData(
  existing: AgentDataSchema,
  updates: Partial<AgentDataSchema>
): AgentDataSchema {
  return {
    ...existing,
    ...updates,

    // Deep merge nested objects
    behavior: { ...existing.behavior, ...updates.behavior },
    capabilities: { ...existing.capabilities, ...updates.capabilities },
    responseConfig: { ...existing.responseConfig, ...updates.responseConfig },
    variables: { ...existing.variables, ...updates.variables },
    contextVariables: {
      ...existing.contextVariables,
      ...updates.contextVariables,
    },
    prompts: { ...existing.prompts, ...updates.prompts },
    knowledgeBase: { ...existing.knowledgeBase, ...updates.knowledgeBase },
    conversationFlow: {
      ...existing.conversationFlow,
      ...updates.conversationFlow,
    },
    performance: { ...existing.performance, ...updates.performance },
    safety: { ...existing.safety, ...updates.safety },
    integrations: {
      ...existing.integrations,
      ...updates.integrations,
      ghlSettings: updates.integrations?.ghlSettings
        ? {
            autoRespond:
              updates.integrations.ghlSettings.autoRespond ??
              existing.integrations.ghlSettings?.autoRespond ??
              false,
            delayMinutes:
              updates.integrations.ghlSettings.delayMinutes ??
              existing.integrations.ghlSettings?.delayMinutes ??
              5,
            maxRepliesPerDay:
              updates.integrations.ghlSettings.maxRepliesPerDay ??
              existing.integrations.ghlSettings?.maxRepliesPerDay ??
              10,
            operatingHours: {
              enabled:
                updates.integrations.ghlSettings.operatingHours?.enabled ??
                existing.integrations.ghlSettings?.operatingHours?.enabled ??
                false,
              timezone:
                updates.integrations.ghlSettings.operatingHours?.timezone ??
                existing.integrations.ghlSettings?.operatingHours?.timezone ??
                "America/New_York",
              schedule:
                updates.integrations.ghlSettings.operatingHours?.schedule ??
                existing.integrations.ghlSettings?.operatingHours?.schedule ??
                {},
            },
          }
        : existing.integrations.ghlSettings,
    },
    metadata: {
      ...existing.metadata,
      ...updates.metadata,
      lastModifiedBy: "user",
      version: incrementVersion(existing.metadata.version),
    },
    extensions: { ...existing.extensions, ...updates.extensions },
  };
}

/**
 * Extract API payload from agent data
 */
export function extractApiPayload(data: AgentDataSchema) {
  return {
    personality: data.personality,
    intent: data.intent,
    additionalInformation: data.additionalInformation,
    variables: data.variables,
    knowledgeBaseIds: data.knowledgeBase.preferredSources,
    modelConfig: {
      model: "gpt-4o-mini", // Default model
      temperature: data.responseConfig.temperature,
      maxTokens: data.responseConfig.maxTokens,
      topP: data.responseConfig.topP,
      frequencyPenalty: data.responseConfig.frequencyPenalty,
      presencePenalty: data.responseConfig.presencePenalty,
    },
  };
}

/**
 * Utility function to increment version
 */
function incrementVersion(version: string): string {
  const parts = version.split(".");
  const patch = parseInt(parts[2] || "0") + 1;
  return `${parts[0] || "1"}.${parts[1] || "0"}.${patch}`;
}

/**
 * Get agent capabilities summary
 */
export function getAgentCapabilitiesSummary(data: AgentDataSchema): string[] {
  const capabilities: string[] = [];

  if (data.capabilities.canHandleComplexQueries)
    capabilities.push("Complex Queries");
  if (data.capabilities.canAccessKnowledgeBase)
    capabilities.push("Knowledge Base Access");
  if (data.capabilities.canGenerateSuggestions)
    capabilities.push("Generate Suggestions");
  if (data.capabilities.canEscalateToHuman)
    capabilities.push("Human Escalation");
  if (data.capabilities.canRememberContext) capabilities.push("Context Memory");

  return capabilities;
}

/**
 * Update agent integrations
 */
export function updateAgentIntegrations(
  existing: AgentDataSchema,
  updates: Partial<AgentDataSchema>
): AgentDataSchema {
  const updatedGhlSettings = updates.integrations?.ghlSettings;
  const existingGhlSettings = existing.integrations.ghlSettings;

  return {
    ...existing,
    integrations: {
      ...existing.integrations,
      ghlSettings: updatedGhlSettings
        ? {
            autoRespond:
              updatedGhlSettings.autoRespond !== undefined
                ? updatedGhlSettings.autoRespond
                : existingGhlSettings?.autoRespond ?? false,
            delayMinutes:
              updatedGhlSettings.delayMinutes !== undefined
                ? updatedGhlSettings.delayMinutes
                : existingGhlSettings?.delayMinutes ?? 5,
            maxRepliesPerDay:
              updatedGhlSettings.maxRepliesPerDay !== undefined
                ? updatedGhlSettings.maxRepliesPerDay
                : existingGhlSettings?.maxRepliesPerDay ?? 10,
            operatingHours: {
              enabled:
                updatedGhlSettings.operatingHours?.enabled !== undefined
                  ? updatedGhlSettings.operatingHours.enabled
                  : existingGhlSettings?.operatingHours?.enabled ?? false,
              timezone:
                updatedGhlSettings.operatingHours?.timezone ||
                existingGhlSettings?.operatingHours?.timezone ||
                "America/New_York",
              schedule:
                updatedGhlSettings.operatingHours?.schedule ||
                existingGhlSettings?.operatingHours?.schedule ||
                {},
            },
          }
        : existingGhlSettings,
      webhooks:
        updates.integrations?.webhooks ?? existing.integrations.webhooks,
      apiKeys: updates.integrations?.apiKeys ?? existing.integrations.apiKeys,
    },
  };
}

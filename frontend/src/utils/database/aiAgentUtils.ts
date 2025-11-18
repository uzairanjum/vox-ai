// @ts-nocheck
import { getSupabase } from "@/utils/supabase/getSupabase";

import {
  AIAgent,
  AIAgentInsert,
  AIAgentUpdate,
  AgentDataSchema,
  AgentType,
  AGENT_TYPES,
} from "@/types/aiAgent";
import {
  createDefaultAgentData,
  validateAgentData,
  generateSystemPrompt,
  mergeAgentData,
} from "@/utils/ai/agentDataUtils";

interface ErrorResponse {
  success: false;
  error: string;
}

interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

type AgentResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Create default agents for a user based on templates - DISABLED
 */
export async function createDefaultAgentsForUser(
  userId: string
): Promise<AgentResponse<AIAgent[]>> {
  // DISABLED: Users create their own agents

  return { success: true, data: [] };
}

/**
 * Clean up duplicate default agents (keep the newest one for each type)
 */
async function cleanupDuplicateDefaultAgents(
  userId: string,
  defaultAgents: any[]
): Promise<void> {
  try {
    const supabase = await getSupabase();

    // Group by type
    const agentsByType = defaultAgents.reduce((acc, agent) => {
      if (!acc[agent.type]) acc[agent.type] = [];
      acc[agent.type].push(agent);
      return acc;
    }, {} as Record<number, any[]>);

    // Find duplicates and mark older ones for deletion
    const agentsToDelete: string[] = [];

    Object.keys(agentsByType).forEach((typeStr) => {
      const type = parseInt(typeStr);
      const agents = agentsByType[type];

      if (agents && agents.length > 1) {
        console.log(
          `Found ${agents.length} default agents of type ${type}, cleaning up duplicates`
        );

        // Sort by creation date (newest first) and keep the first one
        agents.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const agentsToRemove = agents.slice(1); // Remove all but the newest

        agentsToDelete.push(...agentsToRemove.map((agent: any) => agent.id));
      }
    });

    // Delete duplicate agents
    if (agentsToDelete.length > 0) {
      console.log(
        `Deleting ${agentsToDelete.length} duplicate default agents:`,
        agentsToDelete
      );

      const { error: deleteError } = await supabase
        .from("ai_agents")
        .delete()
        .eq("user_id", userId)
        .in("id", agentsToDelete);

      if (deleteError) {
        console.error("Error deleting duplicate agents:", deleteError);
      } else {
        console.log("Successfully cleaned up duplicate default agents");
      }
    }
  } catch (error) {
    console.error("Error cleaning up duplicate default agents:", error);
  }
}

/**
 * Get all agents for a user
 */
export async function getUserAgents(
  userId: string,
  filters?: {
    type?: number;
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<AgentResponse<{ agents: AIAgent[]; total: number }>> {
  try {
    const supabase = await getSupabase();

    let query = supabase
      .from("ai_agents")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.type !== undefined) {
      query = query.eq("type", filters.type);
    }

    if (filters?.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    if (filters?.is_active !== undefined) {
      // Filter by the top-level is_active column, not data column
      query = query.eq("is_active", filters.is_active);
    }

    // Apply pagination
    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit;
      query = query.range(offset, offset + filters.limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching user agents:", error);
      return { success: false, error: "Failed to fetch agents" };
    }

    return {
      success: true,
      data: {
        agents: data || [],
        total: count || 0,
      },
    };
  } catch (error) {
    console.error("Error in getUserAgents:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error fetching agents",
    };
  }
}

/**
 * Get a single agent by ID along with its linked knowledge bases
 */
export async function getAgentById(
  agentId: string,
  userId: string
): Promise<AgentResponse<AIAgent & { knowledge_bases?: any[] }>> {
  try {
    const supabase = await getSupabase();

    const { data: agentData, error: agentError }: any = await supabase
      .from("ai_agents")
      .select("*")
      .eq("id", agentId)
      .eq("user_id", userId)
      .single();

    if (agentError) {
      if (agentError.code === "PGRST116") {
        console.warn("⚠️ Agent not found for user:", userId);
        return { success: false, error: "Agent not found" };
      }
      console.error("❌ Error fetching agent:", agentError);
      return { success: false, error: "Failed to fetch agent" };
    }

    if (!agentData) {
      console.warn("⚠️ No agent data returned");
      return { success: false, error: "Agent not found" };
    }

    // Handle knowledge_base_ids (can be string or array)
    let kbIds: string[] = [];

    if (Array.isArray(agentData.knowledge_base_ids)) {
      kbIds = agentData.knowledge_base_ids.filter(Boolean);
    } else if (typeof agentData.knowledge_base_ids === "string") {
      kbIds = agentData.knowledge_base_ids
        .split(",")
        .map((id: string) => id.trim())
        .filter(Boolean);
    }

    let knowledgeBases: any[] = [];
    if (kbIds.length > 0) {
      const { data: kbData, error: kbError } = await supabase
        .from("kb")
        .select("*")
        .eq("user_id", userId)
        .in("id", kbIds);

      if (kbError) {
        console.error("❌ Error fetching knowledge bases:", kbError);
        return {
          success: false,
          error: "Failed to fetch knowledge bases",
        };
      }

      knowledgeBases = kbData || [];
    }

    // Safely merge agent and knowledge bases
    const agentWithKBs: AIAgent & { knowledge_bases: any[] } = {
      ...(agentData as AIAgent),
      knowledge_bases: knowledgeBases,
    };

    return { success: true, data: agentWithKBs };
  } catch (error) {
    console.error("❌ Error in getAgentById:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error fetching agent",
    };
  }
}

/**
 * Create a new agent with full data schema support
 */
export async function createAgent(
  agentData: AIAgentInsert
): Promise<AgentResponse<AIAgent>> {
  try {
    const supabase = await getSupabase();

    // Ensure required fields
    if (!agentData.name || !agentData.type || !agentData.user_id) {
      return {
        success: false,
        error: "Missing required fields: name, type, user_id",
      };
    }

    // Check if tag already exists (must be unique)
    if (agentData.tag) {
      const { data: existingTag, error: tagCheckError } = await supabase
        .from("ai_agents")
        .select("id")
        .eq("tag", agentData.tag)
        .maybeSingle();

      if (tagCheckError) {
        return { success: false, error: "Failed to validate tag uniqueness" };
      }

      if (existingTag) {
        return {
          success: false,
          error: `Tag '${agentData.tag}' already exists. Please choose another one.`,
        };
      }
    }

    // Create default data structure if not provided
    let fullData: AgentDataSchema;

    if (agentData.data && Object.keys(agentData.data).length > 0) {
      // Merge provided data with defaults
      const defaultData = createDefaultAgentData(agentData.type);
      fullData = mergeAgentData(
        defaultData,
        agentData.data as Partial<AgentDataSchema>
      );
    } else {
      // Use full default structure
      fullData = createDefaultAgentData(agentData.type);
      // Set basic fields if provided in legacy format
      if (agentData.description)
        fullData.additionalInformation = agentData.description;
    }

    // Validate the data
    const validation = validateAgentData(fullData, agentData.type);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(", ")}`,
      };
    }

    // Generate system prompt if not provided
    const systemPrompt =
      agentData.system_prompt || generateSystemPrompt(fullData, agentData.name);

    // Prepare insert data
    const insertData = {
      name: agentData.name,
      type: agentData.type,
      user_id: agentData.user_id,
      system_prompt: systemPrompt,
      knowledge_base_ids:
        agentData.knowledge_base_ids || fullData.knowledgeBase.preferredSources,
      description: agentData.description || fullData.additionalInformation,
      data: fullData,
      is_active: agentData.is_active,
      configuration: agentData.configuration || {},
      metadata: agentData.metadata || {},
      channels: agentData.channels || {}, // Add channels support
      tag: agentData.tag || "", // Add tag support
      model: agentData.data?.model || "gpt-4o-mini", // Add model support
    };

    const { data, error } = await supabase
      .from("ai_agents")
      .insert(insertData as any)
      .select()
      .single();

    if (error) {
      console.error("Error creating agent:", error);
      return { success: false, error: "Failed to create agent" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in createAgent:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error creating agent",
    };
  }
}

/**
 * Update an agent with data schema support
 */
export async function updateAgent(
  agentId: string,
  userId: string,
  updates: AIAgentUpdate
): Promise<AgentResponse<AIAgent>> {
  try {
    const supabase = await getSupabase();

    // Get existing agent first
    const { data: existingAgent, error: fetchError } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("id", agentId)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return { success: false, error: "Agent not found" };
      }
      console.error("Error fetching existing agent:", fetchError);
      return { success: false, error: "Failed to fetch existing agent" };
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Handle basic field updates
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.is_active !== undefined)
      updateData.is_active = updates.is_active;
    if (updates.knowledge_base_ids !== undefined)
      updateData.knowledge_base_ids = updates.knowledge_base_ids;
    if (updates.configuration !== undefined)
      updateData.configuration = updates.configuration;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    // Handle channels field updates
    if (updates.channels !== undefined) {
      console.log(
        "Processing channels update in updateAgent:",
        updates.channels
      );
      updateData.channels = updates.channels;
    }

    // Handle data field updates
    if (updates.data) {
      const existingData = existingAgent.data as AgentDataSchema;
      const mergedData = mergeAgentData(existingData, updates.data);

      // Validate merged data
      const validation = validateAgentData(
        mergedData,
        updates.type || existingAgent.type
      );
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(", ")}`,
        };
      }

      updateData.data = mergedData;

      // Regenerate system prompt if data changed
      if (updates.system_prompt === undefined) {
        updateData.system_prompt = generateSystemPrompt(
          mergedData,
          updates.name || existingAgent.name
        );
      }
    }

    // Handle system prompt update
    if (updates.system_prompt !== undefined) {
      updateData.system_prompt = updates.system_prompt;
    }

    const { data, error } = await supabase
      .from("ai_agents")
      .update(updateData)
      .eq("id", agentId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating agent:", error);
      return { success: false, error: "Failed to update agent" };
    }

    console.log("Successfully updated agent:", agentId);
    return { success: true, data };
  } catch (error) {
    console.error("Error in updateAgent:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error updating agent",
    };
  }
}

/**
 * Delete an agent
 */
export async function deleteAgent(
  agentId: string,
  userId: string
): Promise<AgentResponse<null>> {
  try {
    const supabase = await getSupabase();

    const { error } = await supabase
      .from("ai_agents")
      .delete()
      .eq("id", agentId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting agent:", error);
      return { success: false, error: "Failed to delete agent" };
    }

    console.log("Successfully deleted agent:", agentId);
    return { success: true, data: null };
  } catch (error) {
    console.error("Error in deleteAgent:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error deleting agent",
    };
  }
}

/**
 * Get default agent for a specific type
 */
export async function getDefaultAgentForType(
  userId: string,
  agentType: number
): Promise<AgentResponse<AIAgent | null>> {
  try {
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("user_id", userId)
      .eq("type", agentType)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No agent found, try to create default
        console.log(
          `No default agent found for type ${agentType}, creating...`
        );
        const createResult = await createDefaultAgentsForUser(userId);
        if (createResult.success) {
          // Try again after creating defaults
          const { data: newData, error: newError } = await supabase
            .from("ai_agents")
            .select("*")
            .eq("user_id", userId)
            .eq("type", agentType)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (newError) {
            return { success: true, data: null };
          }
          return { success: true, data: newData };
        }
        return { success: true, data: null };
      }
      console.error("Error fetching default agent:", error);
      return { success: false, error: "Failed to fetch default agent" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in getDefaultAgentForType:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error fetching default agent",
    };
  }
}

/**
 * Convert FastAPI agent format to database format with new schema
 */
export function convertFastAPIAgentToDatabase(
  fastApiAgent: any,
  userId: string
): AIAgentInsert {
  // Determine type from agentType
  const agentTypeMap = {
    generic: AGENT_TYPES.GENERIC,
    query: AGENT_TYPES.QUERY,
    suggestions: AGENT_TYPES.SUGGESTIONS,
    response: AGENT_TYPES.AUTOPILOT,
    autopilot: AGENT_TYPES.AUTOPILOT,
  };

  const type =
    agentTypeMap[fastApiAgent.agentType as keyof typeof agentTypeMap] ||
    AGENT_TYPES.CUSTOM;

  // Create structured data using new schema
  const agentData = createDefaultAgentData(type);

  // Map FastAPI data to new schema
  agentData.personality = fastApiAgent.personality || "";
  agentData.intent = fastApiAgent.intent || "";
  agentData.additionalInformation = fastApiAgent.additionalInformation || "";
  agentData.variables = fastApiAgent.variables || {};
  agentData.tag = fastApiAgent.tag || "";
  agentData.model = fastApiAgent.model || "gpt-4o-mini";

  // Map model config to response config (handle both 'modelConfig' and 'configuration' from frontend)
  const modelConfig = fastApiAgent.modelConfig || fastApiAgent.configuration;
  if (modelConfig) {
    agentData.responseConfig = {
      ...agentData.responseConfig,
      maxTokens: modelConfig.maxTokens || agentData.responseConfig.maxTokens,
      temperature:
        modelConfig.temperature || agentData.responseConfig.temperature,
      topP: modelConfig.topP || agentData.responseConfig.topP,
      frequencyPenalty:
        modelConfig.frequencyPenalty ||
        agentData.responseConfig.frequencyPenalty,
      presencePenalty:
        modelConfig.presencePenalty || agentData.responseConfig.presencePenalty,
    };
  }

  // Handle humanlikeBehavior setting from frontend configuration
  if (fastApiAgent.configuration?.humanlikeBehavior !== undefined) {
    agentData.behavior = {
      ...agentData.behavior,
      responseStyle: fastApiAgent.configuration.humanlikeBehavior
        ? "friendly"
        : "professional",
      creativity: fastApiAgent.configuration.humanlikeBehavior ? 85 : 70,
    };
  }

  // Set knowledge base preferences
  if (fastApiAgent.knowledgeBaseIds) {
    agentData.knowledgeBase.preferredSources = fastApiAgent.knowledgeBaseIds;
  }

  // Handle channels if provided
  let channels: Record<string, { enabled: boolean; settings?: any }> = {};
  if (fastApiAgent.channels) {
    if (Array.isArray(fastApiAgent.channels)) {
      // Convert array format to object format
      const allPossibleChannels = [
        "sms",
        "facebook",
        "instagram",
        "web",
        "whatsapp",
        "email",
      ];
      allPossibleChannels.forEach((channel) => {
        channels[channel] = {
          enabled: fastApiAgent.channels.includes(channel),
          settings: {},
        };
      });
    } else if (typeof fastApiAgent.channels === "object") {
      channels = fastApiAgent.channels;
    }
  }

  // Set metadata
  agentData.metadata = {
    ...agentData.metadata,
    isDefault: false,
    createdBy: "api",
    category: fastApiAgent.agentType || "custom",
    version: "1.0.0",
  };

  // Set custom properties in extensions
  agentData.extensions = {
    ...agentData.extensions,
    source: "frontend_form",
  };

  // Generate system prompt
  const systemPrompt =
    fastApiAgent.customPrompt ||
    generateSystemPrompt(agentData, fastApiAgent.name || "AI Agent");

  return {
    name: fastApiAgent.name,
    type,
    user_id: userId,
    system_prompt: systemPrompt,
    knowledge_base_ids: fastApiAgent.knowledgeBaseIds,
    description: fastApiAgent.description || agentData.additionalInformation,
    data: agentData,
    channels: channels, // Add channels support
    configuration: fastApiAgent.configuration || fastApiAgent.modelConfig || {},
    is_active: fastApiAgent.isActive,
    tag: fastApiAgent.tag ?? agentData.tag ?? "",
    model: fastApiAgent.model ?? agentData.model ?? "gpt-4o-mini",
  };
}

/**
 * Convert database agent to FastAPI format
 */
export function convertDatabaseAgentToFastAPI(dbAgent: AIAgent): any {
  const data = (dbAgent.data as AgentDataSchema) || {};

  // Safely access metadata with fallbacks
  const metadata = data.metadata || {};
  const agentType = metadata.category || getAgentTypeString(dbAgent.type);

  // Convert channels object to array for frontend
  const channelsArray = dbAgent.channels
    ? Object.entries(dbAgent.channels)
        .filter(([_, config]) => config.enabled)
        .map(([channel]) => channel)
    : [];

  return {
    id: dbAgent.id,
    name: dbAgent.name,
    description: dbAgent.description,
    agentType: agentType,
    personality: data.personality || "",
    intent: data.intent || "",
    additionalInformation: data.additionalInformation || "",
    variables: data.variables || {},
    customPrompt: dbAgent.system_prompt || "",
    isActive: dbAgent.is_active !== undefined ? dbAgent.is_active : true,
    createdAt: dbAgent.created_at,
    updatedAt: dbAgent.updated_at,
    knowledgeBaseIds:
      data.knowledgeBase?.preferredSources || dbAgent.knowledge_base_ids || [],
    channels: channelsArray, // Add channels to response
    modelConfig: {
      model: "gpt-4o-mini",
      temperature: data.responseConfig?.temperature || 0.7,
      maxTokens: data.responseConfig?.maxTokens || 500,
      topP: data.responseConfig?.topP || 1.0,
      frequencyPenalty: data.responseConfig?.frequencyPenalty || 0.0,
      presencePenalty: data.responseConfig?.presencePenalty || 0.0,
    },
    capabilities: data.capabilities || {},
    behavior: data.behavior || {},
    performance: data.performance || {},
  };
}

/**
 * Helper function to get agent type string
 */
function getAgentTypeString(type: AgentType): string {
  switch (type) {
    case AGENT_TYPES.GENERIC:
      return "generic";
    case AGENT_TYPES.QUERY:
      return "query";
    case AGENT_TYPES.SUGGESTIONS:
      return "suggestions";
    case AGENT_TYPES.AUTOPILOT:
      return "autopilot";
    default:
      return "custom";
  }
}

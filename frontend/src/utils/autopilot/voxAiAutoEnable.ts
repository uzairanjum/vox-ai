import { Conversation } from "@/lib/leadconnector/types/conversationTypes";

/**
 * Automatically enables autopilot for conversations with the 'vox-ai' tag
 * This is a crucial feature for the vox-ai system
 */
export async function autoEnableVoxAiAutopilot(
  conversations: Conversation[],
  locationId: string
): Promise<void> {
  if (!conversations || conversations.length === 0) {
    return;
  }

  const voxAiConversations = conversations.filter((conversation) =>
    conversation.tags?.includes("vox-ai")
  );

  if (voxAiConversations.length === 0) {
    return;
  }

  // Process each vox-ai conversation
  for (const conversation of voxAiConversations) {
    try {
      await enableAutopilotForConversation(
        conversation.id,
        locationId,
        conversation
      );
    } catch (error) {
      console.error(
        `❌ Failed to auto-enable autopilot for conversation ${conversation.id}:`,
        error
      );
    }
  }
}

/**
 * Enables autopilot for a single conversation
 */
async function enableAutopilotForConversation(
  conversationId: string,
  locationId: string,
  conversation: Conversation
): Promise<void> {
  // Check if autopilot is already enabled
  const isAlreadyEnabled = await checkAutopilotStatus(conversationId);
  if (isAlreadyEnabled) {
    return;
  }

  // Get the default vox-ai agent or the first active response agent
  const agentId = await getVoxAiAgentId();

  // Prepare autopilot configuration for vox-ai
  const autopilotConfig = {
    conversationId,
    locationId,
    isEnabled: true,
    replyDelayMinutes: 2, // Quick response for vox-ai
    maxRepliesPerConversation: 10, // More replies for vox-ai
    maxRepliesPerDay: 50, // Higher daily limit
    operatingHours: {
      enabled: false, // Always on for vox-ai
      start: "00:00",
      end: "23:59",
      timezone: "UTC",
      days: [1, 2, 3, 4, 5, 6, 7], // All days
    },
    aiAgentId: agentId,
    aiModel: "gpt-4o-mini",
    aiTemperature: 0.7,
    aiMaxTokens: 500,
    fallbackMessage:
      "Thank you for contacting us. Our AI assistant will help you shortly.",
    cancelOnUserReply: false, // Keep autopilot active even after user replies
    requireHumanKeywords: [],
    excludeKeywords: [],
    messageType: conversation.type?.replace("CONVERSATION_", "") || "SMS",
    preferConversationType: true,
    // Store vox-ai specific metadata
    conversationMetadata: {
      isVoxAi: true,
      autoEnabledAt: new Date().toISOString(),
      originalTags: conversation.tags,
      contactName: conversation.fullName || conversation.contactName,
      source: "vox-ai-auto-enable",
    },
    contactMetadata: {
      name: conversation.fullName || conversation.contactName,
      email: conversation.email,
      phone: conversation.phone,
      tags: conversation.tags,
    },
  };

  // Call the autopilot config API
  const response = await fetch("/api/autopilot/config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(autopilotConfig),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to enable autopilot: ${errorData.error || response.statusText}`
    );
  }

  const result = await response.json();
}

/**
 * Check if autopilot is already enabled for a conversation
 */
async function checkAutopilotStatus(conversationId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/autopilot/config?conversationId=${conversationId}`
    );
    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.config?.is_enabled === true;
  } catch (error) {
    console.warn(
      `⚠️ Could not check autopilot status for ${conversationId}:`,
      error
    );
    return false;
  }
}

/**
 * Get the appropriate AI agent for vox-ai autopilot
 */
async function getVoxAiAgentId(): Promise<string | null> {
  try {
    // Try to get an active response agent (type 4) or AI agent (type 1)
    const response = await fetch("/api/ai/agents?is_active=true");
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const agents = data.agents || data.data?.agents || [];

    // Prefer response agents (type 4), then AI agents (type 1)
    const responseAgent = agents.find((agent: any) => agent.type === 4);
    if (responseAgent) {
      return responseAgent.id;
    }

    const aiAgent = agents.find((agent: any) => agent.type === 1);
    if (aiAgent) {
      return aiAgent.id;
    }

    // Fallback to first active agent
    if (agents.length > 0) {
      return agents[0].id;
    }

    return null;
  } catch (error) {
    console.error("❌ Failed to get vox-ai agent:", error);
    return null;
  }
}

/**
 * Check if a conversation has the vox-ai tag
 */
export function isVoxAiConversation(conversation: Conversation): boolean {
  return conversation.tags?.includes("vox-ai") === true;
}

/**
 * Auto-enable autopilot for a single conversation if it has vox-ai tag
 */
export async function autoEnableForSingleConversation(
  conversation: Conversation,
  locationId: string
): Promise<void> {
  if (isVoxAiConversation(conversation)) {
    await autoEnableVoxAiAutopilot([conversation], locationId);
  }
}

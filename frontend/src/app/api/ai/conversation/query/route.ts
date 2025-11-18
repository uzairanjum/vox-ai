// @ts-nocheck

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/utils/auth/user";
import { validateAIConfig } from "@/utils/ai/config/aiSettings";
import { getSupabase } from "@/utils/supabase/getSupabase";
import { KB_SETTINGS } from "@/utils/ai/knowledgebaseSettings";
import { postFastAPI } from "@/lib/fastapi-utils";
import { cache } from "react";
import {
  selectAgentForFeature,
  getAgentSelectionSummary,
} from "@/utils/ai/agentSelection";

interface QueryRequestBody {
  userId?: string;
  conversationId: string;
  query: string;
  knowledgebaseId?: string;
  locationId?: string;
  limit?: number;
  filters?: {
    [key: string]: any;
  };
  // New AI configuration parameters
  temperature?: number;
  model?: string;
  humanlikeBehavior?: boolean;
  systemPrompt?: string;
  maxTokens?: number;
}

interface QueryMessage {
  id: string;
  query: string;
  response: string;
  timestamp: string;
  user_id: string;
  metadata: {
    message_count: number;
    total_results: number;
    ai_config: {
      model: string;
      temperature: number;
      humanlikeBehavior: boolean;
    };
  };
}

interface Message {
  id: string;
  body: string;
  score?: number;
  dateAdded: string;
  direction: "unknown" | "inbound" | "outbound";
  role: "unknown" | "user" | "assistant";
  messageType:
    | "unknown"
    | "TYPE_SMS"
    | "TYPE_WEBCHAT"
    | "TYPE_ACTIVITY_OPPORTUNITY";
  type: "conversation";
  contentType: "text/plain";
  source: "conversation";
}

interface QueryResponse {
  messages: Message[];
  total: number;
  query: string;
  answer: string;
  suggestions?: string[];
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

const FASTAPI_URL =
  process.env.FASTAPI_URL ||
  process.env.NEXT_PUBLIC_FASTAPI_URL ||
  "http://localhost:8000";
// Remove hardcoded fallback user ID for production readiness
const FALLBACK_USER_ID = "ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21";

// Implement caching for global AI settings to reduce database queries
const getCachedGlobalSettings = cache(async (userId: string) => {
  const supabase = await getSupabase();
  console.log("Fetching global AI settings from database");
  const { data: globalSettings, error: globalSettingsError } = await supabase
    .from("ai_global_settings")
    .select("settings")
    .eq("user_id", userId)
    .single();

  if (globalSettingsError) {
    console.error("Error fetching global AI settings:", globalSettingsError);
    return null;
  }
  return globalSettings;
});

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Enforce proper authentication for production readiness
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json(
        {
          success: false,
          error: "Authentication required",
        } satisfies ErrorResponse,
        { status: 401 }
      );
    }
    const userId = user.id;

    // Parse and validate request body
    const body = (await req.json()) as QueryRequestBody;

    if (!body.conversationId || !body.query) {
      return Response.json(
        {
          success: false,
          error: "Missing required fields: conversationId and query",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // Validate and merge AI configuration
    const aiConfig = validateAIConfig({
      model: body.model,
      temperature: body.temperature,
      humanlikeBehavior: body.humanlikeBehavior,
      maxTokens: body.maxTokens,
    });

    console.log("🤖 Query AI Configuration:", {
      conversationId: body.conversationId,
      query: body.query.substring(0, 100) + "...",
      aiConfig: {
        model: aiConfig.model,
        temperature: aiConfig.temperature,
        humanlikeBehavior: aiConfig.humanlikeBehavior,
      },
    });

    // NEW: Enhanced agent selection with hierarchy
    let selectedAgentId = null;
    let additionalKnowledgebaseIds = [];

    try {
      console.log("🔍 Loading settings for NEW agent selection...");
      const supabase = await getSupabase();

      // Load global settings
      const { data: globalSettings, error: globalError } = await supabase
        .from("ai_settings")
        .select("data")
        .eq("user_id", userId)
        .eq("scope", "global")
        .single();

      const globalAISettings = globalSettings?.data || null;
      console.log(
        "📋 Global settings loaded:",
        globalAISettings ? "Yes" : "No"
      );

      // Load conversation settings
      const { data: convMeta, error: convMetaError } = await supabase
        .from("conversation_meta_data")
        .select("data")
        .eq("conversation_id", body.conversationId)
        .single();

      const conversationSettings = convMeta?.data || null;
      console.log(
        "💬 Conversation settings loaded:",
        conversationSettings ? "Yes" : "No"
      );

      // Load available agents for fallback
      const { data: agents, error: agentsError } = await supabase
        .from("ai_agents")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true);

      const availableAgents = agents?.map((a) => a.id) || [];
      console.log(`🤖 Found ${availableAgents.length} available agents`);

      // NEW: Use agent selection utility
      selectedAgentId = selectAgentForFeature(
        "query",
        globalAISettings,
        conversationSettings,
        availableAgents
      );

      const selectionSummary = getAgentSelectionSummary(
        "query",
        selectedAgentId,
        globalAISettings,
        conversationSettings
      );
      console.log(`🎯 Agent selection result: ${selectionSummary}`);

      // Legacy fallback for AI config
      let aiSettings = {
        model: "gpt-4o-mini",
        temperature: 0.7,
        humanlikeBehavior: true,
        aiAgentId: selectedAgentId,
      };

      if (globalAISettings) {
        aiSettings = {
          ...aiSettings,
          ...globalAISettings,
          aiAgentId: selectedAgentId, // Override with selected agent
        };
      }

      // Check for conversation metadata to override global settings if available
      const { data: conversationMeta, error: metaError } = await supabase
        .from("conversation_meta_data")
        .select("data")
        .eq("conv_id", body.conversationId)
        .eq("user_id", userId)
        .single();

      if (
        metaError ||
        !conversationMeta ||
        !conversationMeta.data?.ai_settings
      ) {
        console.warn(
          "⚠️ No conversation metadata found or no AI settings:",
          metaError?.message || "No data"
        );
        // Use global settings as determined above
      } else {
        console.log("Found conversation-specific AI settings");
        const convSettings = conversationMeta.data.ai_settings;
        aiSettings = {
          model: convSettings.model || aiSettings.model,
          temperature: convSettings.temperature ?? aiSettings.temperature,
          humanlikeBehavior:
            convSettings.humanlikeBehavior ?? aiSettings.humanlikeBehavior,
          aiAgentId: convSettings.agentId || aiSettings.aiAgentId,
        };
      }

      // Set the selected agent ID for the query
      selectedAgentId = aiSettings.aiAgentId;

      // Get additional knowledge base IDs from conversation settings
      if (
        conversationMeta?.data?.ai_settings?.knowledgeBaseIds &&
        Array.isArray(conversationMeta.data.ai_settings.knowledgeBaseIds)
      ) {
        additionalKnowledgebaseIds =
          conversationMeta.data.ai_settings.knowledgeBaseIds.filter(
            (id: string) => id !== body.conversationId
          );
        console.log(
          "📚 Found additional knowledge bases:",
          additionalKnowledgebaseIds
        );
      }
    } catch (error) {
      console.log(
        "⚠️ Could not load conversation settings for query agent:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    // Streamline payload to FastAPI by removing unnecessary fields
    const payload = {
      userId,
      conversationId: body.conversationId,
      query: body.query,
      knowledgebaseId: body.conversationId,
      temperature: aiConfig.temperature,
      model: aiConfig.model,
      humanlikeBehavior: aiConfig.humanlikeBehavior,
      aiAgentId: selectedAgentId,
    };

    console.log("🚀 Calling FastAPI: /ai/conversation/query");
    console.log("📤 FastAPI payload:", payload);

    // Add performance logging for monitoring API response times
    const startTime = Date.now();
    console.log(
      "🚀 Starting FastAPI call for query at:",
      new Date().toISOString()
    );
    const data: QueryResponse = await postFastAPI(
      "/ai/conversation/query",
      payload,
      {
        userId: userId,
      }
    );
    const endTime = Date.now();
    console.log("🏁 FastAPI call completed in", endTime - startTime, "ms");

    console.log("Query response:", JSON.stringify(data, null, 2));

    // Validate response has expected fields
    if (!data.answer) {
      throw new Error(
        "Invalid response format from server - missing answer field"
      );
    }

    // Messages array can be empty, that's fine
    if (!data.messages || !Array.isArray(data.messages)) {
      console.warn(
        "⚠️ No messages returned, but that's okay for query responses"
      );
      data.messages = []; // Ensure it's an empty array
    }

    console.log(
      `✅ Query processed successfully. Answer length: ${
        data.answer.length
      }, Messages: ${data.messages.length}, Suggestions: ${
        data.suggestions?.length || 0
      }`
    );

    // Store query history in knowledge base
    try {
      const supabase = await getSupabase();

      // Find the conversation knowledge base
      const { data: kbData, error: kbError } = await supabase
        .from("knowledge_bases")
        .select("*")
        .eq("user_id", userId)
        .eq("type", KB_SETTINGS.KB_CONVERSATION.type)
        .eq("provider_type_sub_id", body.conversationId)
        .single();

      if (!kbError && kbData) {
        // Create query message with AI configuration metadata
        const queryMessage: QueryMessage = {
          id: crypto.randomUUID(),
          query: body.query,
          response: data.answer,
          timestamp: new Date().toISOString(),
          user_id: userId,
          metadata: {
            message_count: data.messages.length,
            total_results: data.total,
            ai_config: {
              model: aiConfig.model,
              temperature: aiConfig.temperature,
              humanlikeBehavior: aiConfig.humanlikeBehavior,
            },
          },
        };

        // Update knowledge base with new query history
        const existingQueries = kbData.data?.query_history || [];
        const updatedQueries = [...existingQueries, queryMessage];

        await supabase
          .from("knowledge_bases")
          .update({
            data: {
              ...kbData.data,
              query_history: updatedQueries,
              last_queried_at: new Date().toISOString(),
              last_ai_config: {
                model: aiConfig.model,
                temperature: aiConfig.temperature,
                humanlikeBehavior: aiConfig.humanlikeBehavior,
              },
            },
          })
          .eq("id", kbData.id);

        console.log(
          "Query history updated for conversation:",
          body.conversationId
        );
      }
    } catch (historyError) {
      console.error("Error updating query history:", historyError);
      // Don't fail the query if history update fails
    }

    // Return response in expected format with success wrapper
    return Response.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error in conversation query:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

// @ts-nocheck

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/utils/auth/user";
import { getSupabase } from "@/utils/supabase/getSupabase";
import { KB_SETTINGS } from "@/utils/ai/knowledgebaseSettings";
import { postFastAPI } from "@/lib/fastapi-utils";

interface ConversationAIRequest {
  conversationId: string;
  agentId?: string;
  query: string;
  context?: string;
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    contactId?: string;
  };
  recentMessages?: Array<any>;
  mode: "query" | "suggestions" | "response" | "autopilot";
  limit?: number;
  type: number;
}

interface ErrorResponse {
  success: false;
  error: string;
}

const FASTAPI_URL =
  process.env.FASTAPI_URL ||
  process.env.NEXT_PUBLIC_FASTAPI_URL ||
  "http://localhost:8000";

// POST - Handle AI conversation requests through agents with knowledge base integration
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json(
        {
          success: false,
          error: "Unauthorized",
        } satisfies ErrorResponse,
        { status: 401 }
      );
    }

    const body = (await req.json()) as ConversationAIRequest;

    if (!body.conversationId || !body.query || !body.mode) {
      return Response.json(
        {
          success: false,
          error: "Missing required fields: conversationId, query, mode",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    const supabase = await getSupabase();

    // console.log("body ----- ", body);

    // Get or create default agent for user
    let agent: any;
    if (body.agentId) {
      const { data: agentData, error: agentError } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("id", body.agentId)
        .eq("user_id", user.id)
        .single();

      if (agentError || !agentData) {
        return Response.json(
          {
            success: false,
            error: "AI agent not found",
          } satisfies ErrorResponse,
          { status: 404 }
        );
      }
      agent = agentData;
    }

    //  else {
    //   // Get the most recent active agent for this user
    //   const { data: activeAgent, error: agentError } = await supabase
    //     .from("ai_agents")
    //     .select("*")
    //     .eq("user_id", user.id)
    //     .eq("is_active", true)
    //     .order("created_at", { ascending: false })
    //     .limit(1)
    //     .single();

    //   if (agentError && agentError.code === "PGRST116") {
    //     // No active agents found - return error asking user to create one
    //     return Response.json(
    //       {
    //         success: false,
    //         error:
    //           "No active AI agents found. Please create an AI agent first.",
    //       } satisfies ErrorResponse,
    //       { status: 404 }
    //     );
    //   } else if (agentError) {
    //     console.error("Error fetching active agent:", agentError);
    //     return Response.json(
    //       {
    //         success: false,
    //         error: "Failed to fetch AI agent",
    //       } satisfies ErrorResponse,
    //       { status: 500 }
    //     );
    //   } else {
    //     agent = activeAgent;
    //   }
    // }

    // Get conversation knowledge base (primary context)
    const { data: conversationKB } = await supabase
      .from("knowledge_bases")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", body.type)
      .eq("provider_type_sub_id", body.conversationId)
      .single();

    // Get custom knowledge bases assigned to this agent
    let customKBs: any = [];
    if (agent.knowledge_base_ids) {
      // Handle both string and array formats for knowledge_base_ids
      let kbIds: string[] = [];

      if (Array.isArray(agent.knowledge_base_ids)) {
        // Already an array
        kbIds = agent.knowledge_base_ids.filter(Boolean);
      } else if (typeof agent.knowledge_base_ids === "string") {
        // String format (comma-separated)
        kbIds = agent.knowledge_base_ids
          .split(",")
          .map((id: string) => id.trim())
          .filter(Boolean);
      }

      if (kbIds.length > 0) {
        const { data: customKBData } = await supabase
          .from("knowledge_bases")
          .select("*")
          .eq("user_id", user.id)
          .in("id", kbIds);

        if (customKBData) {
          customKBs = customKBData;
        }
      }
    }

    // Prepare knowledge sources info
    const knowledgeSources = [];
    if (conversationKB) {
      knowledgeSources.push({
        type: "conversation",
        name: conversationKB.name,
        relevance_score: 1.0,
      });
    }

    customKBs.forEach((kb) => {
      const kbType =
        kb.type === KB_SETTINGS.KB_FILE_UPLOAD.type
          ? "file"
          : kb.type === KB_SETTINGS.KB_FAQ.type
          ? "faq"
          : kb.type === KB_SETTINGS.KB_WEB_SCRAPER.type
          ? "web"
          : "file";
      knowledgeSources.push({
        type: kbType,
        name: kb.name,
        relevance_score: 0.8,
      });
    });

    // Prepare FastAPI request
    let fastApiEndpoint = "";
    let requestPayload: any = {
      userId: user.id,
      conversationId: body.conversationId,
      query: body.query,
      context: body.context || "",
      customerInfo: body.customerInfo || {},
      recentMessages: body.recentMessages || [],
      agentInfo: {
        id: agent.id,
        name: agent.name,
        prompt:
          agent.prompt ||
          agent.system_prompt ||
          "You are a helpful AI assistant.",
        type: agent.type,
      },
      knowledgebaseIds: [
        ...(conversationKB ? [conversationKB.id] : []),
        ...customKBs.map((kb) => kb.id),
      ],
    };

    switch (body.mode) {
      case "query":
        // fastApiEndpoint = "/ai/conversation/knowledgebase/query";
        fastApiEndpoint = "/ai/conversation/query";
        requestPayload.knowledgebaseId = body.conversationId;
        requestPayload.limit = body.limit || 5;
        requestPayload.additionalKnowledgebaseIds = customKBs.map(
          (kb) => kb.id
        );
        requestPayload.aiAgentId = agent.id;
        // Include agent prompt directly in the query for context
        requestPayload.systemPrompt =
          agent.prompt || "You are a helpful AI assistant.";
        requestPayload.agentName = agent.name;
        break;

      case "suggestions":
        fastApiEndpoint = "/ai/conversation/suggestions/enhanced";
        requestPayload.knowledgebaseId = body.conversationId;
        requestPayload.limit = body.limit || 3;
        requestPayload.additionalKnowledgebaseIds = customKBs.map(
          (kb) => kb.id
        );
        requestPayload.aiAgentId = agent.id;
        requestPayload.systemPrompt =
          agent.prompt || "You are a helpful AI assistant.";
        requestPayload.agentName = agent.name;
        break;

      case "response":
      case "autopilot":
        fastApiEndpoint = "/ai/conversation/response-suggestions/enhanced";
        requestPayload.knowledgebaseId = body.conversationId;
        requestPayload.lastCustomerMessage = body.query;
        requestPayload.autopilot = body.mode === "autopilot";
        requestPayload.additionalKnowledgebaseIds = customKBs.map(
          (kb) => kb.id
        );
        requestPayload.aiAgentId = agent.id;
        requestPayload.systemPrompt =
          agent.prompt || "You are a helpful AI assistant.";
        requestPayload.agentName = agent.name;
        break;

      default:
        return Response.json(
          {
            success: false,
            error:
              "Invalid mode. Must be: query, suggestions, response, or autopilot",
          } satisfies ErrorResponse,
          { status: 400 }
        );
    }

    // Forward to FastAPI backend
    const data = await postFastAPI(fastApiEndpoint, requestPayload, {
      userId: user.id,
    });

    // Format response
    let responseData: any = {
      knowledge_sources: knowledgeSources,
      agent_info: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
      },
    };

    switch (body.mode) {
      case "query":
        responseData.answer = data.answer;
        responseData.messages = data.messages;
        break;

      case "suggestions":
        responseData.suggestions = data.suggestions;
        break;

      case "response":
      case "autopilot":
        responseData.response =
          data.data?.response_suggestion || data.data?.autopilot_response;
        responseData.confidence_score = data.data?.confidence_score;
        break;
    }

    return Response.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error in AI agent conversation:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

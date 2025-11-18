import { NextRequest } from "next/server";
import { getCurrentUser } from "@/utils/auth/user";
import {
  getUserAgents,
  createAgent,
  convertFastAPIAgentToDatabase,
} from "@/utils/database/aiAgentUtils";
import { AIAgent, AIAgentInsert, AgentListResponse } from "@/types/aiAgent";
import { AgentFilters, PaginationParams } from "@/utils/database/knowledgebase";

interface ErrorResponse {
  success: false;
  error: string;
}

interface CompatibleAgentListResponse extends AgentListResponse {
  agents?: AIAgent[];
  total?: number;
  agentTypes?: Array<{
    id: string;
    type: string;
    name: string;
  }>;
}

// GET - List AI agents with filtering and pagination
export async function GET(req: NextRequest): Promise<Response> {
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

    const { searchParams } = new URL(req.url);

    // Parse pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // Parse filter parameters
    const typeFilter = searchParams.get("type");
    const searchQuery = searchParams.get("search");
    const isActiveFilter = searchParams.get("is_active");
    const activeOnlyFilter = searchParams.get("active_only"); // NEW: Filter for only active agents

    const pagination: PaginationParams = {
      page,
      limit,
    };

    const filters: AgentFilters = {
      ...pagination,
      type: typeFilter ? parseInt(typeFilter) : undefined,
      search: searchQuery || undefined,
      is_active: isActiveFilter ? isActiveFilter === "true" : undefined,
      active_only: activeOnlyFilter === "true", // NEW: Only return active agents
    };

    console.log("AI agents list request:", {
      userId: user.id,
      filters,
    });

    // Get user's agents from database
    const result = await getUserAgents(user.id, filters);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.error,
        } satisfies ErrorResponse,
        { status: 500 }
      );
    }

    // Create agent types for compatibility
    const agentTypes = result.data.agents.map((agent) => ({
      id: agent.id,
      type: getAgentTypeString(agent.type),
      name: agent.name,
    }));

    // Return compatible response format
    const response: CompatibleAgentListResponse = {
      success: true,
      data: {
        agents: result.data.agents,
        total: result.data.total,
      },
      // Legacy format for backward compatibility
      agents: result.data.agents,
      total: result.data.total,
      agentTypes,
    };

    return Response.json(response);
  } catch (error) {
    console.error("Error in AI agents list:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

// POST - Create new AI agent
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

    const body = await req.json();

    // Validate required fields based on FastAPI schema
    if (!body.name || !body.agentType) {
      return Response.json(
        {
          success: false,
          error: "Missing required fields: name, agentType",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // Validate personality and intent for structured agents (FastAPI format)
    if (body.agentType && body.agentType !== "custom") {
      if (!body.personality) {
        return Response.json(
          {
            success: false,
            error:
              "Validation failed: personality is required for structured agents",
          } satisfies ErrorResponse,
          { status: 400 }
        );
      }
      if (!body.intent) {
        return Response.json(
          {
            success: false,
            error:
              "Validation failed: intent is required for structured agents",
          } satisfies ErrorResponse,
          { status: 400 }
        );
      }
    }

    // Support both FastAPI format and direct database format
    let agentData: AIAgentInsert;

    if (body.agentType && body.personality && body.intent) {
      // Convert from FastAPI format to database format
      agentData = convertFastAPIAgentToDatabase(body, user.id);
    } else {
      // Direct database format
      agentData = {
        ...body,
        user_id: user.id,
      } as AIAgentInsert;
    }

    const result = await createAgent(agentData);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.error,
        } satisfies ErrorResponse,
        { status: 500 }
      );
    }

    // Return in compatible format
    return Response.json({
      success: true,
      data: result.data,
      agent: result.data, // Legacy format
      message: "Agent created successfully",
    });
  } catch (error) {
    console.error("Error in AI agent creation:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

// Helper function to convert agent type number to string
function getAgentTypeString(type: number): string {
  switch (type) {
    case 1:
      return "generic"; // AGENT_TYPES.GENERIC
    case 2:
      return "query"; // AGENT_TYPES.QUERY
    case 3:
      return "suggestions"; // AGENT_TYPES.SUGGESTIONS
    case 4:
      return "autopilot"; // AGENT_TYPES.AUTOPILOT (Response Agent)
    case 99:
      return "custom"; // AGENT_TYPES.CUSTOM
    default:
      return "generic";
  }
}

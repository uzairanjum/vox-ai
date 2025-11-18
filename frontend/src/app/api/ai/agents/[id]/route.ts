// @ts-nocheck

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/utils/auth/user";
import {
  getAgentById,
  updateAgent,
  deleteAgent,
  convertFastAPIAgentToDatabase,
} from "@/utils/database/aiAgentUtils";
import {
  AIAgent,
  AIAgentUpdate,
  AIAgentResponse,
} from "@/utils/database/knowledgebase";
import { validateUUID } from "@/lib/utils";

interface ErrorResponse {
  success: false;
  error: string;
}

// GET - Get single AI agent
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
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

    const { id } = await params;
    if (!id) {
      return Response.json(
        {
          success: false,
          error: "AI agent ID is required",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // Validate that the ID is a valid UUID
    try {
      validateUUID(id, "Agent ID");
    } catch (error) {
      console.log("Invalid agent ID format:", id);
      return Response.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Invalid agent ID format",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    const result = await getAgentById(id, user.id);

    if (!result.success) {
      const status = result.error === "Agent not found" ? 404 : 500;
      return Response.json(
        {
          success: false,
          error: result.error,
        } satisfies ErrorResponse,
        { status }
      );
    }

    return Response.json({
      success: true,
      data: result.data,
    } satisfies AIAgentResponse);
  } catch (error) {
    console.error("Error in AI agent get:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

// PUT - Update AI agent
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
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

    const { id } = await params;
    if (!id) {
      return Response.json(
        {
          success: false,
          error: "AI agent ID is required",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // Validate that the ID is a valid UUID
    try {
      validateUUID(id, "Agent ID");
    } catch (error) {
      console.log("Invalid agent ID format:", id);
      return Response.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Invalid agent ID format",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    const body = await req.json();

    // Handle both FastAPI format and direct database format
    let updateData: AIAgentUpdate;

    if (body.agentType || body.personality || body.intent) {
      // Convert from FastAPI format
      const converted = convertFastAPIAgentToDatabase(body, user.id);

      updateData = {
        name: converted.name,
        type: converted.type,
        description: converted.description,
        system_prompt: converted.system_prompt,
        configuration: converted.configuration,
        knowledge_base_ids: converted.knowledge_base_ids,
        is_active: converted.is_active,
        metadata: converted.metadata,
        data: converted.data,
        channels: converted.channels,
      };
    } else {
      // Direct database format - handle channels conversion
      updateData = { ...body } as AIAgentUpdate;

      // Convert channels from array format to object format if needed
      if (body.channels !== undefined) {
        if (Array.isArray(body.channels)) {
          // Convert array format to object format
          console.log(
            "Converting channels array to object format:",
            body.channels
          );

          const channelsObject: Record<string, any> = {};
          const allPossibleChannels = [
            "sms",
            "facebook",
            "instagram",
            "web",
            "whatsapp",
            "email",
          ];

          allPossibleChannels.forEach((channel) => {
            channelsObject[channel] = {
              enabled: body.channels.includes(channel),
              settings: {},
            };
          });

          updateData.channels = channelsObject;
        } else if (
          typeof body.channels === "object" &&
          body.channels !== null
        ) {
          // Already in object format, use as-is
          updateData.channels = body.channels;
        } else {
          // Invalid format, set to empty object
          console.warn("Invalid channels format, setting to empty object");
          updateData.channels = {};
        }
      }
    }

    const result = await updateAgent(id, user.id, updateData);

    if (!result.success) {
      const status = result.error === "Agent not found" ? 404 : 500;
      return Response.json(
        {
          success: false,
          error: result.error,
        } satisfies ErrorResponse,
        { status }
      );
    }

    return Response.json({
      success: true,
      data: result.data,
    } satisfies AIAgentResponse);
  } catch (error) {
    console.error("Error in AI agent update:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

// PATCH - Quick status toggle for AI agent
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
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

    const { id } = await params;
    if (!id) {
      return Response.json(
        {
          success: false,
          error: "AI agent ID is required",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // Validate that the ID is a valid UUID
    try {
      validateUUID(id, "Agent ID");
    } catch (error) {
      console.log("Invalid agent ID format:", id);
      return Response.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Invalid agent ID format",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    const body = await req.json();
    const { is_active } = body;

    if (typeof is_active !== "boolean") {
      return Response.json(
        {
          success: false,
          error: "is_active must be a boolean value",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    console.log("AI agent status toggle:", {
      userId: user.id,
      agentId: id,
      newStatus: is_active,
    });

    // If activating an agent, check for existing active agents of the same type
    if (is_active) {
      const { getSupabase } = await import("@/utils/supabase/getSupabase");
      const supabase = await getSupabase();

      // Get the agent's type first
      const { data: agentData, error: agentError } = await supabase
        .from("ai_agents")
        .select("type")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (agentError || !agentData) {
        return Response.json(
          {
            success: false,
            error: "Agent not found",
          } satisfies ErrorResponse,
          { status: 404 }
        );
      }

      // For non-general agents (type !== 1), deactivate other agents of the same type
      if (agentData.type !== 1) {
        const { error: deactivateError } = await supabase
          .from("ai_agents")
          .update({ is_active: false })
          .eq("user_id", user.id)
          .eq("type", agentData.type)
          .neq("id", id)
          .eq("is_active", true);

        if (deactivateError) {
          console.error("Error deactivating other agents:", deactivateError);
          // Continue anyway, don't fail the operation
        }
      }
    }

    const result = await updateAgent(id, user.id, { is_active });

    if (!result.success) {
      const status = result.error === "Agent not found" ? 404 : 500;
      return Response.json(
        {
          success: false,
          error: result.error,
        } satisfies ErrorResponse,
        { status }
      );
    }

    return Response.json({
      success: true,
      data: result.data,
    } satisfies AIAgentResponse);
  } catch (error) {
    console.error("Error in AI agent status toggle:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

// DELETE - Delete AI agent
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
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

    const { id } = await params;
    if (!id) {
      return Response.json(
        {
          success: false,
          error: "AI agent ID is required",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // Validate that the ID is a valid UUID
    try {
      validateUUID(id, "Agent ID");
    } catch (error) {
      console.log("Invalid agent ID format:", id);
      return Response.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Invalid agent ID format",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    console.log("AI agent delete request:", {
      userId: user.id,
      agentId: id,
    });

    const result = await deleteAgent(id, user.id);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.error,
        } satisfies ErrorResponse,
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error("Error in AI agent delete:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/utils/auth/user";
import { getSupabase } from "@/utils/supabase/getSupabase";

interface ErrorResponse {
  success: false;
  error: string;
}

interface StartTrainingResponse {
  success: true;
  jobId: string;
}

const FASTAPI_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

// POST - Start training job
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
    const { knowledgebaseId } = body;

    if (!knowledgebaseId) {
      return Response.json(
        {
          success: false,
          error: "Knowledge base ID is required",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    const supabase = await getSupabase();

    // 🔍 Check that this KB belongs to the user
    const { data: kbData, error: kbError } = await supabase
      .from("knowledge_bases")
      .select("*")
      .eq("id", knowledgebaseId)
      .eq("user_id", user.id)
      .single();

    if (kbError || !kbData) {
      return Response.json(
        {
          success: false,
          error: "Knowledge base not found or access denied",
        } satisfies ErrorResponse,
        { status: 404 }
      );
    }

    console.log("Starting training for knowledge base:", knowledgebaseId);

    // 🟢 Call FastAPI to start training
    const fastApiRes = await fetch(
      `${FASTAPI_URL}/ai/conversation/training/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          knowledgebaseId,
          // optionally pass documents or metadata
        }),
      }
    );

    if (!fastApiRes.ok) {
      const errorText = await fastApiRes.text();
      console.error("FastAPI training start failed:", errorText);
      return Response.json(
        {
          success: false,
          error: `FastAPI error: ${errorText}`,
        } satisfies ErrorResponse,
        { status: fastApiRes.status }
      );
    }

    const fastApiData = await fastApiRes.json();

    if (!fastApiData.jobId) {
      return Response.json(
        {
          success: false,
          error: "FastAPI did not return a jobId",
        } satisfies ErrorResponse,
        { status: 500 }
      );
    }

    // ✅ Return jobId so frontend can poll status
    return Response.json(
      {
        success: true,
        jobId: fastApiData.jobId,
      } satisfies StartTrainingResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error starting training job:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

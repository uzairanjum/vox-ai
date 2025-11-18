import { NextRequest } from "next/server";
import { getCurrentUser } from "@/utils/auth/user";
import { getSupabase } from "@/utils/supabase/getSupabase";

interface ErrorResponse {
  success: false;
  error: string;
}

export async function POST(req: NextRequest) {
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

    // read raw body
    const body = await req.json();

    const { agentId, query } = body;

    if (!agentId || !query) {
      return Response.json(
        { success: false, error: "agentId and query required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabase();

    // 1. verify agent exists and belongs to user
    const { data: agent, error: agentErr }: any = await supabase
      .from("ai_agents")
      .select("*")
      .eq("id", agentId)
      .eq("user_id", user.id)
      .single();

    if (agentErr || !agent) {
      return Response.json(
        { success: false, error: "Agent not found or not yours" },
        { status: 404 }
      );
    }

    // embed user question
    const queryResp = await fetch(
      `${process.env.NEXT_PUBLIC_VOX_API_URL}/ai/conversation/kb/query`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: query,
          model: "text-embedding-ada-002",
          kbIds: agent.knowledge_base_ids,
        }),
      }
    );

    if (!queryResp.ok) throw new Error("Embedding failed");

    const queryRes = await queryResp.json();

    // 3. quick 200 (we’ll plug FastAPI next)
    return Response.json({
      success: true,
      data: {
        answer: queryRes.reply,
      },
    });
  } catch (e: any) {
    console.error("❌ Chat error:", e);
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}

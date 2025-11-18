// @ts-nocheck

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/utils/auth/user";
import { getSupabase } from "@/utils/supabase/getSupabase";
import {
  KnowledgeBase,
  KnowledgeBaseUpdate,
  KnowledgeBaseResponse,
} from "@/utils/database/knowledgebase";

interface ErrorResponse {
  success: false;
  error: string;
}

// GET - Get single knowledge base
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
          error: "Knowledge base ID is required",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("kb")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return Response.json(
          {
            success: false,
            error: "Knowledge base not found",
          } satisfies ErrorResponse,
          { status: 404 }
        );
      }

      console.error("Error fetching knowledge base:", error);
      return Response.json(
        {
          success: false,
          error: "Failed to fetch knowledge base",
        } satisfies ErrorResponse,
        { status: 500 }
      );
    }

    // --- Fetch related sources ---
    const { data: sources, error: sourceError } = await supabase
      .from("kb_source")
      .select("*")
      .eq("kb_id", data.id);

    if (sourceError) {
      console.error("Error fetching kb sources:", sourceError);
      return Response.json(
        {
          success: false,
          error: "Failed to fetch KB sources",
        } satisfies ErrorResponse,
        { status: 500 }
      );
    }

    // --- Group sources by type ---
    const files = sources?.filter((s) => s.type === "file") ?? [];
    const webUrls = sources?.filter((s) => s.type === "web") ?? [];
    const faqs = sources?.filter((s) => s.type === "faq") ?? [];

    const result = {
      ...data,
      sources: {
        files: {
          count: files.length,
          data: files,
        },
        webUrls: {
          count: webUrls.length,
          data: webUrls,
        },
        faqs: {
          count: faqs.length,
          data: faqs,
        },
      },
    };

    return Response.json({
      success: true,
      data: result as KnowledgeBase,
    } satisfies KnowledgeBaseResponse);
  } catch (error) {
    console.error("Error in knowledge base get:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

// PUT - Update knowledge base
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
          error: "Knowledge base ID is required",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    const body = (await req.json()) as KnowledgeBaseUpdate;

    console.log("Knowledge base update request:", {
      userId: user.id,
      knowledgeBaseId: id,
      updates: Object.keys(body),
    });

    const supabase = await getSupabase();

    // Add updated_at timestamp
    const updateData: KnowledgeBaseUpdate = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("knowledge_bases")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return Response.json(
          {
            success: false,
            error: "Knowledge base not found",
          } satisfies ErrorResponse,
          { status: 404 }
        );
      }

      console.error("Error updating knowledge base:", error);
      return Response.json(
        {
          success: false,
          error: "Failed to update knowledge base",
        } satisfies ErrorResponse,
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data: data as KnowledgeBase,
    } satisfies KnowledgeBaseResponse);
  } catch (error) {
    console.error("Error in knowledge base update:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const SOFT_DELETE = false; // << flip to false for hard delete

  try {
    const user = await getCurrentUser();
    if (!user?.id)
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    const supabase = await getSupabase();
    const { id: kbId } = params;

    // 1. verify ownership
    const { data: kb } = await supabase
      .from("kb")
      .select("id, user_id")
      .eq("id", kbId)
      .single();
    if (!kb || kb.user_id !== user.id)
      return Response.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );

    // 2. (optional) detach from agents
    // await supabase
    //   .from("agents")
    //   .update({ kb_id: null })
    //   .eq("kb_id", kbId)
    //   .eq("user_id", user.id);

    // 3. delete sources (cascade ok)
    await supabase.from("kb_source").delete().eq("kb_id", kbId);

    // 4. delete KB (or soft)
    if (SOFT_DELETE) {
      await supabase.from("kb").update({ status: "archived" }).eq("id", kbId);
    } else {
      await supabase.from("kb").delete().eq("id", kbId);
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (e: any) {
    console.error("Delete KB error:", e);
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}

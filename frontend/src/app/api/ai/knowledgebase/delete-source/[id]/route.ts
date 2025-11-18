//@ts-nocheck

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/utils/auth/user";
import { getSupabase } from "@/utils/supabase/getSupabase";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const SOFT_DELETE = false;

  try {
    // --- 1. Validate user ---
    const user = await getCurrentUser();

    if (!user?.id) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Extract params
    const srcId = params.id;

    // Parse body (may fail if no body)
    const body = await req.json().catch((err) => {
      return null;
    });

    const kbId = body?.kbId;

    if (!kbId) {
      return Response.json(
        { success: false, error: "Knowledge base ID (kbId) is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabase();

    // --- 2. Verify source belongs to this KB and user ---
    const { data: source, error: findError } = await supabase
      .from("kb_source")
      .select("id, kb_id")
      .eq("id", srcId)
      .eq("kb_id", kbId)
      .single();

    if (findError) console.error("❌ Supabase findError:", findError);

    if (findError || !source) {
      return Response.json(
        { success: false, error: "Source not found or access denied" },
        { status: 404 }
      );
    }

    // --- 3. Perform deletion ---
    if (SOFT_DELETE) {
      const { error: updateError } = await supabase
        .from("kb_source")
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq("id", srcId)
        .eq("kb_id", kbId);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: deleteError } = await supabase
        .from("kb_source")
        .delete()
        .eq("id", srcId)
        .eq("kb_id", kbId);

      if (deleteError) {
        throw deleteError;
      }
    }

    // --- 4. Return success response ---
    return Response.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/utils/auth/user";
import { getSupabase } from "@/utils/supabase/getSupabase";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id)
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    const formData = await req.formData();
    const name = formData.get("name")?.toString().trim();
    const description = formData.get("description")?.toString().trim();

    if (!name)
      return Response.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );

    const supabase = await getSupabase();

    // Create KB
    const { data: kb, error } = await supabase
      .from("kb")
      .insert([
        { name, description, user_id: user.id, status: "pending" },
      ] as any)
      .select("id,name,description,status")
      .single();

    if (error) throw error;

    return Response.json({ success: true, data: kb });
  } catch (e: any) {
    console.error("❌ KB creation error:", e);
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}

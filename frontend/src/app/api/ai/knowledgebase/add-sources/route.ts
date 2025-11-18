// /app/api/kb/add-sources/route.ts
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
    const kbId = formData.get("kbId")?.toString().trim();
    if (!kbId)
      return Response.json(
        { success: false, error: "Knowledge base ID is required" },
        { status: 400 }
      );

    const supabase = await getSupabase();

    // Verify KB ownership
    const { data: existingKb, error: kbError } = await supabase
      .from("kb")
      .select("id")
      .eq("id", kbId)
      .eq("user_id", user.id)
      .single();

    if (kbError || !existingKb)
      return Response.json(
        { success: false, error: "Knowledge base not found" },
        { status: 404 }
      );

    const urls = formData.get("urls")
      ? JSON.parse(formData.get("urls")!.toString())
      : [];
    const faqs = formData.get("faqs")
      ? JSON.parse(formData.get("faqs")!.toString())
      : [];
    const files = formData.getAll("files") as File[];

    // --- File Sources ---
    for (const file of files) {
      const storagePath = `${kbId}/raw/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("kb-uploads")
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("kb-uploads")
        .getPublicUrl(storagePath);

      await supabase.from("kb_source").insert([
        {
          kb_id: kbId,
          type: "file",
          data: {
            fileName: file.name,
            path: storagePath,
            size: file.size,
            type: file.type,
            url: publicUrlData.publicUrl,
          },
          status: "pending",
        },
      ] as any);

      // Notify FastAPI
      await fetch(
        `${process.env.NEXT_PUBLIC_VOX_API_URL}/ai/conversation/kb/add-files`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.id}`,
          },
          body: JSON.stringify({
            userId: user.id,
            knowledgebaseId: kbId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileUrl: publicUrlData.publicUrl,
            supabaseBucket: "kb-uploads",
            storagePath,
          }),
        }
      );
    }

    // --- Web Sources ---
    for (const url of urls) {
      await supabase
        .from("kb_source")
        .insert([
          { kb_id: kbId, type: "web", data: { url }, status: "pending" },
        ] as any);

      await fetch(
        `${process.env.NEXT_PUBLIC_VOX_API_URL}/ai/conversation/kb/add-web`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.id}`,
          },
          body: JSON.stringify({ userId: user.id, knowledgebaseId: kbId, url }),
        }
      );
    }

    // --- FAQ Sources ---
    for (const { question, answer } of faqs) {
      await supabase.from("kb_source").insert([
        {
          kb_id: kbId,
          type: "faq",
          data: { q: question, a: answer },
          status: "pending",
        },
      ] as any);
    }

    if (faqs.length) {
      await fetch(
        `${process.env.NEXT_PUBLIC_VOX_API_URL}/ai/conversation/kb/add-faqs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.id}`,
          },
          body: JSON.stringify({
            userId: user.id,
            knowledgebaseId: kbId,
            faqs,
          }),
        }
      );
    }

    return Response.json({
      success: true,
      data: {
        kbId,
        sources: { files: files.length, urls: urls.length, faqs: faqs.length },
      },
    });
  } catch (e: any) {
    console.error("❌ add-sources error:", e);
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}

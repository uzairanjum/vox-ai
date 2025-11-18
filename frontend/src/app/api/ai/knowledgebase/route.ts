// @ts-nocheck
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/utils/auth/user";
import { getSupabase } from "@/utils/supabase/getSupabase";
import { KnowledgeBasesResponse } from "@/utils/database/knowledgebase";
import { KnowledgeBaseRow } from "@/types/kb";

interface ErrorResponse {
  success: false;
  error: string;
}

// GET
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
    const offset = (page - 1) * limit;

    // ---- filters ----
    const search = searchParams.get("search")?.trim() || undefined;
    const created_after = searchParams.get("created_after") || undefined;
    const created_before = searchParams.get("created_before") || undefined;
    const excludeConv = searchParams.get("exclude_conversations") === "true";
    const conversationId = searchParams.get("conversationId");
    const providerSubId =
      searchParams.get("provider_type_sub_id") || conversationId;

    const supabase = await getSupabase();

    // ---- 1. base query on NEW table ----
    let kbQuery = supabase
      .from("kb")
      // .select("id, name, user_id, status, created_at, updated_at", {
      //   count: "exact",
      // })
      .select("id, name, user_id, status, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // ---- 2. apply same filters ----
    if (search) kbQuery = kbQuery.ilike("name", `%${search}%`);
    if (created_after) kbQuery = kbQuery.gte("created_at", created_after);
    if (created_before) kbQuery = kbQuery.lte("created_at", created_before);
    if (excludeConv) kbQuery = kbQuery.neq("type", 4); // if you still use type=4 for conv
    if (providerSubId)
      kbQuery = kbQuery.eq("provider_type_sub_id", providerSubId);

    // ---- 3. pagination ----
    kbQuery = kbQuery.range(offset, offset + limit - 1);

    const { data: kbRows, error, count } = await kbQuery;
    if (error) throw error;

    // ---- 4. enrich each KB ----
    // ---- enrich counts per KB ----
    const enriched: KnowledgeBaseRow[] = await Promise.all(
      kbRows.map(async (kb) => {
        const { data: sources } = await supabase
          .from("kb_source")
          .select("type")
          .eq("kb_id", kb.id);

        const counts = { faq: 0, file: 0, web: 0 };
        (sources || []).forEach((s) => {
          if (s.type === "faq") counts.faq += 1;
          if (s.type === "file") counts.file += 1;
          if (s.type === "web") counts.web += 1;
        });

        return {
          ...kb,
          faq_count: counts.faq,
          file_count: counts.file,
          web_count: counts.web,
        };
      })
    );

    return Response.json({
      success: true,
      data: enriched,
      total: count || 0,
    } satisfies KnowledgeBasesResponse);
  } catch (e: any) {
    console.error("KB list error:", e);
    return Response.json(
      { success: false, error: e.message || "Internal error" },
      { status: 500 }
    );
  }
}



// GET - List knowledge bases with filtering and pagination
// export async function GET(req: NextRequest): Promise<Response> {
//   try {
//     const user = await getCurrentUser();
//     if (!user?.id) {
//       return Response.json(
//         {
//           success: false,
//           error: "Unauthorized",
//         } satisfies ErrorResponse,
//         { status: 401 }
//       );
//     }

//     const { searchParams } = new URL(req.url);

//     // Parse pagination parameters
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
//     const offset = (page - 1) * limit;

//     // Parse filter parameters
//     const filters: KnowledgeBaseFilters = {
//       type: searchParams.get("type")
//         ? parseInt(searchParams.get("type")!)
//         : undefined,
//       provider_type: searchParams.get("provider_type")
//         ? parseInt(searchParams.get("provider_type")!)
//         : undefined,
//       search: searchParams.get("search") || undefined,
//       created_after: searchParams.get("created_after") || undefined,
//       created_before: searchParams.get("created_before") || undefined,
//       has_summary:
//         searchParams.get("has_summary") === "true" ? true : undefined,
//       has_faqs: searchParams.get("has_faqs") === "true" ? true : undefined,
//     };

//     // Support for excluding conversation knowledge bases
//     const excludeConversations =
//       searchParams.get("exclude_conversations") === "true";

//     // Add conversationId support for query history loading
//     const conversationId = searchParams.get("conversationId");
//     const provider_type_sub_id =
//       searchParams.get("provider_type_sub_id") || conversationId;

//     console.log("Knowledge base list request:", {
//       userId: user.id,
//       page,
//       limit,
//       offset,
//       filters,
//     });

//     const supabase = await getSupabase();

//     // Build query
//     let query = supabase
//       .from("knowledge_bases")
//       .select("*", { count: "exact" })
//       .eq("user_id", user.id)
//       .order("created_at", { ascending: false });

//     // Apply filters
//     if (filters.type) {
//       query = query.eq("type", filters.type);
//     }
//     if (filters.provider_type) {
//       query = query.eq("provider_type", filters.provider_type);
//     }
//     if (provider_type_sub_id) {
//       query = query.eq("provider_type_sub_id", provider_type_sub_id);
//     }
//     if (filters.search) {
//       query = query.ilike("name", `%${filters.search}%`);
//     }
//     if (filters.created_after) {
//       query = query.gte("created_at", filters.created_after);
//     }
//     if (filters.created_before) {
//       query = query.lte("created_at", filters.created_before);
//     }
//     if (filters.has_summary) {
//       query = query.not("summary", "is", null);
//     }
//     if (filters.has_faqs) {
//       query = query.not("faq", "is", null);
//     }

//     // Exclude conversation knowledge bases if requested (type 4 = conversations)
//     if (excludeConversations) {
//       query = query.neq("type", 4);
//     }

//     // Apply pagination
//     query = query.range(offset, offset + limit - 1);

//     const { data, error, count } = await query;

//     if (error) {
//       console.error("Error fetching knowledge bases:", error);
//       return Response.json(
//         {
//           success: false,
//           error: "Failed to fetch knowledge bases",
//         } satisfies ErrorResponse,
//         { status: 500 }
//       );
//     }

//     return Response.json({
//       success: true,
//       data: data as KnowledgeBase[],
//       total: count || 0,
//     } satisfies KnowledgeBasesResponse);
//   } catch (error) {
//     console.error("Error in knowledge base list:", error);
//     return Response.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : "Internal server error",
//       } satisfies ErrorResponse,
//       { status: 500 }
//     );
//   }
// }

// POST - Create new knowledge base
// export async function POST(req: NextRequest): Promise<Response> {
//   try {
//     const user = await getCurrentUser();
//     if (!user?.id) {
//       return Response.json(
//         {
//           success: false,
//           error: "Unauthorized",
//         } satisfies ErrorResponse,
//         { status: 401 }
//       );
//     }

//     const body = (await req.json()) as KnowledgeBaseInsert;

//     // Validate required fields
//     if (!body.name || !body.type || !body.provider_type) {
//       return Response.json(
//         {
//           success: false,
//           error: "Missing required fields: name, type, provider_type",
//         } satisfies ErrorResponse,
//         { status: 400 }
//       );
//     }

//     console.log("Knowledge base creation request:", {
//       userId: user.id,
//       name: body.name,
//       type: body.type,
//       provider_type: body.provider_type,
//     });

//     const supabase = await getSupabase();

//     // Prepare insert data
//     const insertData: KnowledgeBaseInsert = {
//       ...body,
//       user_id: user.id,
//       data: body.data || {},
//       faq: body.faq || [],
//     };

//     const { data, error } = await supabase
//       .from("knowledge_bases")
//       .insert(insertData)
//       .select()
//       .single();

//     if (error) {
//       console.error("Error creating knowledge base:", error);
//       return Response.json(
//         {
//           success: false,
//           error: "Failed to create knowledge base",
//         } satisfies ErrorResponse,
//         { status: 500 }
//       );
//     }

//     return Response.json({
//       success: true,
//       data: data as KnowledgeBase,
//     } satisfies KnowledgeBaseResponse);
//   } catch (error) {
//     console.error("Error in knowledge base creation:", error);
//     return Response.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : "Internal server error",
//       } satisfies ErrorResponse,
//       { status: 500 }
//     );
//   }
// }

// @ts-nocheck
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/utils/auth/user";
import { getSupabase } from "@/utils/supabase/getSupabase";
import { postFastAPI } from "@/lib/fastapi-utils";
import {
  KnowledgeBase,
  KnowledgeBaseInsert,
  KnowledgeBaseResponse,
  FileUpload,
} from "@/utils/database/knowledgebase";
import { KB_SETTINGS } from "@/utils/ai/knowledgebaseSettings";
import { PROVIDER_TYPE } from "@/utils/config/providerTypes";

interface ErrorResponse {
  success: false;
  error: string;
}

interface FileUploadRequest {
  fileName: string;
  fileContent: string; // Base64 encoded content or file data
  mimeType: string;
  size: number;
  metadata?: Record<string, any>;
}

const BUCKET_NAME =
  process.env.SUPABASE_STORAGE_BUCKET || "knowledge-base-files";

export async function POST(req: NextRequest): Promise<Response> {
  console.log("🟩 [API] File upload route triggered");

  try {
    const user = await getCurrentUser();
    console.log("👤 [Auth] Current user:", user);

    if (!user?.id) {
      console.error("❌ [Auth] Unauthorized access attempt");
      return Response.json(
        { success: false, error: "Unauthorized" } satisfies ErrorResponse,
        { status: 401 }
      );
    }

    const body = (await req.json()) as FileUploadRequest;
    console.log("📦 [Request Body] Received:", body);

    // Validate required fields
    if (!body.fileName || !body.fileContent || !body.mimeType) {
      console.error("❌ [Validation] Missing required fields");
      return Response.json(
        {
          success: false,
          error: "Missing required fields: fileName, fileContent, mimeType",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (body.size > maxSize) {
      console.error("❌ [Validation] File too large:", body.size);
      return Response.json(
        {
          success: false,
          error: "File size exceeds maximum limit of 10MB",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "text/plain",
      "text/csv",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/json",
    ];

    if (!allowedTypes.includes(body.mimeType)) {
      console.error("❌ [Validation] Unsupported file type:", body.mimeType);
      return Response.json(
        {
          success: false,
          error:
            "Unsupported file type. Allowed types: TXT, CSV, PDF, DOC, DOCX, JSON",
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    console.log("✅ [Validation] File is valid. Preparing for upload...");

    const supabase = await getSupabase();
    console.log("🔗 [Supabase] Connection established");

    // Generate file info
    const fileId = crypto.randomUUID();
    const uploadedAt = new Date().toISOString();
    const timestamp = new Date().toISOString().split("T")[0];

    const fileExtension = body.fileName.split(".").pop() || "";
    const sanitizedFileName = body.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${user.id}/kb_files/${timestamp}/${fileId}_${sanitizedFileName}`;

    console.log("📁 [File Info]", {
      fileId,
      filePath,
      fileExtension,
      sanitizedFileName,
    });

    const fileBuffer = Buffer.from(body.fileContent, "base64");

    console.log("⬆️ [Upload] Uploading file to Supabase Storage...");
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: body.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ [Upload Error]", uploadError);
      return Response.json(
        {
          success: false,
          error: `Failed to upload file: ${uploadError.message}`,
        } satisfies ErrorResponse,
        { status: 500 }
      );
    }

    console.log("✅ [Upload] File uploaded successfully:", uploadData);

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    console.log("🌐 [URL] Public URL generated:", urlData.publicUrl);

    const fileData: FileUpload = {
      id: fileId,
      filename: sanitizedFileName,
      original_name: body.fileName,
      mime_type: body.mimeType,
      size: body.size,
      url: urlData.publicUrl,
      uploaded_at: uploadedAt,
      processed: false,
      metadata: {
        ...body.metadata,
        storage_path: filePath,
        bucket_name: BUCKET_NAME,
        file_extension: fileExtension,
      },
    };

    console.log("🧠 [Knowledge Base] Creating knowledge base entry...");
    const insertData: KnowledgeBaseInsert = {
      name: `File: ${body.fileName}`,
      type: KB_SETTINGS.KB_FILE_UPLOAD.type,
      user_id: user.id,
      provider_type: PROVIDER_TYPE.GHL_LOCATION,
      provider_type_sub_id: fileId,
      data: {
        file: fileData,
        upload_date: uploadedAt,
        processing_status: "pending",
        extracted_text: "",
        file_ids: [fileId],
        storage_info: {
          bucket: BUCKET_NAME,
          path: filePath,
          public_url: urlData.publicUrl,
        },
        metadata: {
          ...body.metadata,
          uploaded_by: user.id,
          upload_method: "api",
          file_type: KB_SETTINGS.KB_FILE_UPLOAD.name,
          mime_type: body.mimeType,
          original_size: body.size,
        },
      },
      faq: [],
      file_uploads: fileId,
    };

    const { data, error } = await supabase
      .from("knowledge_bases")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("❌ [DB] Failed to create knowledge base record:", error);
      return Response.json(
        {
          success: false,
          error: "Failed to create file knowledge base",
        } satisfies ErrorResponse,
        { status: 500 }
      );
    }

    console.log("✅ [DB] Knowledge base record created:", data.id);

    // Start FastAPI training
    console.log("🚀 [Training] Sending request to FastAPI backend...");
    try {
      const trainingResponse = await postFastAPI(
        "/ai/conversation/training/supabase-file",
        {
          userId: user.id,
          knowledgebaseId: data.id,
          supabaseBucket: BUCKET_NAME,
          fileId: filePath,
          fileName: body.fileName,
          fileType: body.mimeType,
          metadata: {
            source: "file_upload",
            uploadedAt: new Date().toISOString(),
            fileSize: body.size,
          },
        },
        { userId: user.id }
      );

      console.log("📡 [Training] FastAPI response status:", trainingResponse);

      if (trainingResponse.success) {
        await supabase
          .from("knowledge_bases")
          .update({
            data: {
              ...data.data,
              processing_status: "completed",
              documents_processed: trainingResponse.documentsProcessed || 1,
              vectors_created: trainingResponse.vectorsCreated || 0,
              training_completed_at:
                trainingResponse.timestamp || new Date().toISOString(),
              extracted_text: trainingResponse.extractedText || "",
              training_results: trainingResponse,
            },
          })
          .eq("id", data.id);

        console.log("🧾 [DB] Knowledge base updated with training results");
      } else {
        const errorText = await trainingResponse.text();
        console.error("❌ [Training] FastAPI failed:", errorText);

        await supabase
          .from("knowledge_bases")
          .update({
            data: {
              ...data.data,
              processing_status: "failed",
              training_error: errorText,
            },
          })
          .eq("id", data.id);
      }
    } catch (trainingError) {
      console.error("💥 [Training] Error sending to FastAPI:", trainingError);

      await supabase
        .from("knowledge_bases")
        .update({
          data: {
            ...data.data,
            processing_status: "failed",
            training_error:
              trainingError instanceof Error
                ? trainingError.message
                : "Unknown error",
          },
        })
        .eq("id", data.id);
    }

    console.log("🎉 [Success] File upload + training complete:", {
      knowledgeBaseId: data.id,
      fileId,
      fileName: body.fileName,
    });

    return Response.json({
      success: true,
      data: data as KnowledgeBase,
    } satisfies KnowledgeBaseResponse);
  } catch (error) {
    console.error("💥 [Unhandled Error in POST /file-upload]:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

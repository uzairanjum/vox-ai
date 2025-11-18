// @ts-nocheck

// import { NextRequest } from 'next/server';
// import { getCurrentUser } from '@/utils/auth/user';
// import { getSupabase } from '@/utils/supabase/getSupabase';

// interface ErrorResponse {
//   success: false;
//   error: string;
// }

// interface TrainingJobStatus {
//   jobId: string;
//   status: 'pending' | 'training' | 'completed' | 'failed';
//   progress?: number;
//   documentsProcessed?: number;
//   vectorsCreated?: number;
//   completedAt?: string;
//   error?: string;
//   knowledgebaseId?: string;
// }

// const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

// // GET - Check training job status
// export async function GET(
//   req: NextRequest,
//   { params }: { params: Promise<{ jobId: string }> }
// ): Promise<Response> {
//   try {
//     const user = await getCurrentUser();
//     if (!user?.id) {
//       return Response.json({ 
//         success: false,
//         error: 'Unauthorized'
//       } satisfies ErrorResponse, { status: 401 });
//     }

//     const resolvedParams = await params;
//     const { jobId } = resolvedParams;
//     if (!jobId) {
//       return Response.json({
//         success: false,
//         error: 'Job ID is required'
//       } satisfies ErrorResponse, { status: 400 });
//     }

//     console.log('Training job status request:', {
//       userId: user.id,
//       jobId: jobId
//     });

//     // Check job status with FastAPI
//     const statusResponse = await fetch(`${FASTAPI_URL}/ai/conversation/training/job/${jobId}/status`, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${user.id}`
//       }
//     });

//     if (!statusResponse.ok) {
//       const errorText = await statusResponse.text();
//       console.error('FastAPI job status check failed:', errorText);
      
//       return Response.json({
//         success: false,
//         error: `Failed to check job status: ${errorText}`
//       } satisfies ErrorResponse, { status: statusResponse.status });
//     }

//     const jobStatus = await statusResponse.json() as TrainingJobStatus;
//     console.log('Training job status:', jobStatus);

//     // If job is completed or failed, update the knowledge base
//     if (jobStatus.knowledgebaseId && (jobStatus.status === 'completed' || jobStatus.status === 'failed')) {
//       const supabase = await getSupabase();
      
//       // Verify knowledge base belongs to user
//       const { data: kbData, error: kbError } = await supabase
//         .from('knowledge_bases')
//         .select('*')
//         .eq('id', jobStatus.knowledgebaseId)
//         .eq('user_id', user.id)
//         .single();

//       if (!kbError && kbData) {
//         const updateData = {
//           ...kbData.data,
//           processing_status: jobStatus.status,
//           training_progress: jobStatus.progress || 100,
//           documents_processed: jobStatus.documentsProcessed,
//           vectors_created: jobStatus.vectorsCreated,
//           training_completed_at: jobStatus.completedAt || new Date().toISOString()
//         };

//         if (jobStatus.status === 'failed' && jobStatus.error) {
//           updateData.training_error = jobStatus.error;
//         }

//         await supabase
//           .from('knowledge_bases')
//           .update({ data: updateData })
//           .eq('id', jobStatus.knowledgebaseId);

//         console.log('Updated knowledge base with job status:', jobStatus.knowledgebaseId);
//       }
//     }

//     return Response.json({
//       success: true,
//       data: jobStatus
//     });

//   } catch (error) {
//     console.error('Error checking training job status:', error);
//     return Response.json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Internal server error'
//     } satisfies ErrorResponse, { status: 500 });
//   }
// } 
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getSupabase } from '@/utils/supabase/getSupabase';

interface ErrorResponse {
  success: false;
  error: string;
  details?: any; 
}

interface SuccessResponse {
  success: true;
  data: any;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    // For FormData, we need to use req.formData() instead of req.json()
    const formData = await req.formData();
    
    // Validate required fields
    const userId = formData.get('userId');
    const knowledgebaseId = formData.get('knowledgebaseId');
    const files = formData.getAll('files');

    if (!userId || !knowledgebaseId || files.length === 0) {
      return Response.json({
        success: false,
        error: 'Missing required fields: userId, knowledgebaseId, or files'
      } satisfies ErrorResponse, { status: 400 });
    }

    console.log('File upload request:', {
      userId: userId.toString(),
      knowledgebaseId: knowledgebaseId.toString(),
      fileCount: files.length
    });

    const supabase = await getSupabase();

    // Verify knowledge base exists and belongs to user
    const { data: kbData, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('id', knowledgebaseId.toString())
      .eq('user_id', user.id)
      .single();

    if (kbError || !kbData) {
      return Response.json({
        success: false,
        error: 'Knowledge base not found'
      } satisfies ErrorResponse, { status: 404 });
    }

    // Process each file
    const uploadResults = [];
    
    for (const file of files) {
      if (file instanceof File) {
        try {
          // Generate unique file ID
          const fileId = crypto.randomUUID();
          const fileName = file.name;
          const fileExtension = fileName.split('.').pop() || '';
          const fileSize = file.size;
          const mimeType = file.type;

          // Upload to Supabase Storage
          const storagePath = `${user.id}/kb_files/${new Date().toISOString().split('T')[0]}/${fileId}_${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('voxflow-bucket') // Replace with your actual bucket name
            .upload(storagePath, file);

          if (uploadError) {
            console.error('Supabase storage upload error:', uploadError);
            uploadResults.push({
              fileName,
              success: false,
              error: uploadError.message
            });
            continue;
          }

          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('voxflow-bucket')
            .getPublicUrl(storagePath);

          // Create file record in database
          const fileRecord = {
            id: fileId,
            url: publicUrlData.publicUrl,
            size: fileSize,
            filename: fileName,
            metadata: {
              source: 'user_upload',
              bucket_name: 'voxflow-bucket',
              storage_path: storagePath,
              file_extension: fileExtension,
              uploaded_by: user.id,
              original_name: fileName
            },
            mime_type: mimeType,
            processed: false,
            uploaded_at: new Date().toISOString(),
            original_name: fileName
          };

          // Insert file record (adjust table name as needed)
          const { data: dbData, error: dbError } = await supabase
            .from('files') // Replace with your actual files table name
            .insert(fileRecord)
            .select()
            .single();

          if (dbError) {
            console.error('Database insert error:', dbError);
            uploadResults.push({
              fileName,
              success: false,
              error: dbError.message
            });
            continue;
          }

          uploadResults.push({
            fileName,
            success: true,
            data: {
              fileId: fileId,
              fileName: fileName,
              fileType: mimeType,
              fileSize: fileSize,
              supabaseBucket: 'voxflow-bucket',
              storagePath: storagePath,
              publicUrl: publicUrlData.publicUrl,
              databaseRecord: dbData
            }
          });

        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          uploadResults.push({
            fileName: file.name,
            success: false,
            error: fileError instanceof Error ? fileError.message : 'Unknown error'
          });
        }
      }
    }

    // Check if any uploads failed
    const failedUploads = uploadResults.filter(result => !result.success);
    
    if (failedUploads.length > 0) {
      return Response.json({
        success: false,
        error: `${failedUploads.length} file(s) failed to upload`,
        details: failedUploads
      } satisfies ErrorResponse, { status: 500 });
    }

    return Response.json({
      success: true,
      data: {
        message: `Successfully uploaded ${uploadResults.length} file(s)`,
        results: uploadResults
      }
    } satisfies SuccessResponse);

  } catch (error) {
    console.error('Error in file upload:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}
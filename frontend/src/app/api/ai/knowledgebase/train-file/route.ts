// @ts-nocheck

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getSupabase } from '@/utils/supabase/getSupabase';

interface AsyncFileTrainingRequest {
  knowledgebaseId: string;
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  supabaseBucket: string;
  storagePath: string;
  publicUrl: string;
  metadata?: Record<string, any>;
}

interface ErrorResponse {
  success: false;
  error: string;
}

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

// POST - Start async file training job
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const body = await req.json() as AsyncFileTrainingRequest;
    
    // Validate required fields
    if (!body.knowledgebaseId || !body.fileId || !body.fileName) {
      return Response.json({
        success: false,
        error: 'Missing required fields: knowledgebaseId, fileId, fileName'
      } satisfies ErrorResponse, { status: 400 });
    }

    console.log('Async file training request:', {
      userId: user.id,
      knowledgebaseId: body.knowledgebaseId,
      fileId: body.fileId,
      fileName: body.fileName
    });

    const supabase = await getSupabase();
    
    // Verify knowledge base exists and belongs to user
    const { data: kbData, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('id', body.knowledgebaseId)
      .eq('user_id', user.id)
      .single();

    if (kbError || !kbData) {
      return Response.json({
        success: false,
        error: 'Knowledge base not found'
      } satisfies ErrorResponse, { status: 404 });
    }

    // Start async training job with FastAPI
    const trainingResponse = await fetch(`${FASTAPI_URL}/ai/conversation/training/supabase-file/async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.id}`
      },
      body: JSON.stringify({
        userId: user.id,
        knowledgebaseId: body.knowledgebaseId,
        fileId: body.fileId,
        fileName: body.fileName,
        fileType: body.fileType,
        fileSize: body.fileSize,
        supabaseBucket: body.supabaseBucket,
        storagePath: body.storagePath,
        publicUrl: body.publicUrl,
        metadata: body.metadata || {}
      })
    });

    if (!trainingResponse.ok) {
      const errorText = await trainingResponse.text();
      console.error('FastAPI async training failed:', errorText);
      
      // Update knowledge base with error status
      await supabase
        .from('knowledge_bases')
        .update({
          data: {
            ...kbData.data,
            processing_status: 'failed',
            training_error: errorText
          }
        })
        .eq('id', body.knowledgebaseId);

      return Response.json({
        success: false,
        error: `Training job failed: ${errorText}`
      } satisfies ErrorResponse, { status: 500 });
    }

    const trainingData = await trainingResponse.json();
    console.log('Async training job started:', trainingData);

    // Update knowledge base with job info
    await supabase
      .from('knowledge_bases')
      .update({
        data: {
          ...kbData.data,
          processing_status: 'training',
          training_job_id: trainingData.jobId,
          training_started_at: new Date().toISOString()
        }
      })
      .eq('id', body.knowledgebaseId);

    return Response.json({
      success: true,
      data: {
        jobId: trainingData.jobId,
        knowledgebaseId: body.knowledgebaseId,
        status: 'training',
        message: 'Async training job started successfully'
      }
    });

  } catch (error) {
    console.error('Error starting async file training:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
} 
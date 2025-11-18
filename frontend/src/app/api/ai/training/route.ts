// app/api/ai/knowledgebase/training/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';

export async function POST(request: NextRequest) {
  try {
    console.log('=== AI KNOWLEDGEBASE TRAINING API CALLED ===');
    
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fileId } = body;

    console.log('AI Knowledgebase training request:', { userId: user.id, fileId });

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Forward to the main training endpoint
    const trainingResponse = await fetch(`${request.nextUrl.origin}/api/training`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileId }),
    });

    if (!trainingResponse.ok) {
      const errorText = await trainingResponse.text();
      return NextResponse.json(
        { success: false, error: errorText },
        { status: trainingResponse.status }
      );
    }

    const result = await trainingResponse.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('AI Knowledgebase training error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
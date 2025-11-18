import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getSupabase } from '@/utils/supabase/getSupabase';
import { postFastAPI } from '@/lib/fastapi-utils';

interface FAQ {
  question: string;
  answer: string;
  metadata?: {
    category?: string;
    tags?: string[];
    source?: string;
    lastUpdated?: string;
  };
}

interface AddFaqsRequestBody {
  faqs: FAQ[];
}

interface AddFaqsResponse {
  addedCount: number;
  faqs: FAQ[];
  metadata?: {
    processingTime?: number;
    duplicatesSkipped?: number;
    errors?: string[];
  };
}

interface ErrorResponse {
  success: false;
  error: string;
}

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json() as AddFaqsRequestBody;
    
    if (!Array.isArray(body.faqs) || body.faqs.length === 0) {
      return Response.json({
        success: false,
        error: 'No FAQs provided'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Validate FAQ format
    const invalidFaqs = body.faqs.filter(
      faq => !faq.question || !faq.answer
    );

    if (invalidFaqs.length > 0) {
      return Response.json({
        success: false,
        error: 'All FAQs must have both question and answer'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Log request for debugging
    console.log('Add FAQs request:', JSON.stringify({
      userId: user.id,
      faqCount: body.faqs.length,
      sampleFaq: body.faqs[0]
    }, null, 2));

    // Forward to FastAPI backend using correct endpoint from official docs
    const data = await postFastAPI('/ai/conversation/training/faq', {
      userId: user.id,
      faqs: body.faqs
    }, { userId: user.id });

    // Validate response has required fields
    if (typeof data.addedCount !== 'number' || !Array.isArray(data.faqs)) {
      throw new Error('Invalid response format from server');
    }

    return Response.json(data);

  } catch (error) {
    console.error('Error adding FAQs:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}
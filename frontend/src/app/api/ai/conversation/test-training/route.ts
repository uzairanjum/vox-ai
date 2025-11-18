import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { postFastAPI } from '@/lib/fastapi-utils';

interface TestTrainingRequest {
  conversationId: string;
  locationId: string;
  testMode?: 'simple' | 'full';
}

interface TestTrainingResponse {
  success: boolean;
  fastapi_connection: boolean;
  training_endpoint: boolean;
  error?: string;
  details?: any;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const body = await req.json() as TestTrainingRequest;
    
    if (!body.conversationId || !body.locationId) {
      return Response.json({
        success: false,
        error: 'Missing required fields: conversationId, locationId'
      }, { status: 400 });
    }

    const response: TestTrainingResponse = {
      success: false,
      fastapi_connection: false,
      training_endpoint: false
    };

    // Test 1: Check FastAPI connection
    try {
      console.log('🧪 Testing FastAPI connection...');
      const healthResponse = await fetch('/api/ai/health');
      const healthData = await healthResponse.json();
      
      response.fastapi_connection = healthData.fastapi?.online || false;
      console.log('✅ FastAPI connection test:', response.fastapi_connection);
    } catch (error) {
      console.error('❌ FastAPI connection test failed:', error);
      response.error = 'FastAPI connection failed';
    }

    // Test 2: Test training endpoint with minimal data
    if (response.fastapi_connection) {
      try {
        console.log('🧪 Testing training endpoint...');
        
        const testPayload = {
          userId: user.id,
          conversationId: body.conversationId,
          messages: body.testMode === 'simple' ? [] : [
            {
              id: 'test-message-1',
              body: 'Hello, this is a test message for training.',
              direction: 'inbound',
              dateAdded: new Date().toISOString(),
              messageType: 'TYPE_SMS',
              contentType: 'text/plain',
              status: 'delivered',
              type: 1,
              role: 'user',
              conversationId: body.conversationId,
              locationId: body.locationId,
              contactId: 'test-contact',
              source: 'test',
              contactName: 'Test Contact'
            }
          ],
          messageCount: body.testMode === 'simple' ? 0 : 1,
          locationId: body.locationId,
          knowledgebaseId: body.conversationId,
          generateSummary: true,
          contactInfo: {
            name: 'Test Contact',
            email: 'test@example.com',
            phone: '+1234567890'
          },
          conversationMetadata: {
            conversationType: 'TYPE_SMS'
          }
        };

        const trainingResponse = await postFastAPI('/ai/conversation/train', testPayload, {
          userId: user.id
        });

        response.training_endpoint = true;
        response.details = {
          training_response: trainingResponse,
          test_payload: testPayload
        };
        
        console.log('✅ Training endpoint test successful');
      } catch (error) {
        console.error('❌ Training endpoint test failed:', error);
        response.error = `Training endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    // Overall success
    response.success = response.fastapi_connection && response.training_endpoint;

    return Response.json(response);

  } catch (error) {
    console.error('Test training failed:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test training failed',
      fastapi_connection: false,
      training_endpoint: false
    }, { status: 500 });
  }
} 
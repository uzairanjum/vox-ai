import { NextRequest } from 'next/server';
import { 
  getUserAgents, 
  createAgent, 
  // Removed automatic default agent creation,
  convertFastAPIAgentToDatabase,
  getAgentById,
  updateAgent,
  deleteAgent 
} from '@/utils/database/aiAgentUtils';

interface ErrorResponse {
  success: false;
  error: string;
}

const TEST_USER_ID = 'ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21';

// POST - Test CRUD operations without authentication
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const { operation, data } = body;

    console.log('Test CRUD operation:', operation);

    switch (operation) {
      case 'create':
        // Convert from FastAPI format and create
        console.log('Converting agent data:', data);
        const agentData = convertFastAPIAgentToDatabase(data, TEST_USER_ID);
        console.log('Converted agent data:', agentData);
        
        const createResult = await createAgent(agentData);
        console.log('Create result:', createResult);
        
        return Response.json({
          success: createResult.success,
          data: createResult.success ? createResult.data : null,
          error: createResult.success ? null : createResult.error
        });

      case 'list':
        // List all agents for test user
        const listResult = await getUserAgents(TEST_USER_ID);
        
        return Response.json({
          success: listResult.success,
          data: listResult.success ? listResult.data : null,
          error: listResult.success ? null : listResult.error
        });

      case 'get':
        // Get specific agent
        const getResult = await getAgentById(data.id, TEST_USER_ID);
        
        return Response.json({
          success: getResult.success,
          data: getResult.success ? getResult.data : null,
          error: getResult.success ? null : getResult.error
        });

      case 'update':
        // Update agent
        const updateData = convertFastAPIAgentToDatabase(data.updates, TEST_USER_ID);
        const updateResult = await updateAgent(data.id, TEST_USER_ID, updateData);
        
        return Response.json({
          success: updateResult.success,
          data: updateResult.success ? updateResult.data : null,
          error: updateResult.success ? null : updateResult.error
        });

      case 'delete':
        // Delete agent
        const deleteResult = await deleteAgent(data.id, TEST_USER_ID);
        
        return Response.json({
          success: deleteResult.success,
          data: deleteResult.success ? deleteResult.data : null,
          error: deleteResult.success ? null : deleteResult.error
        });

      case 'ensure_defaults':
        // Default agent creation disabled - users create their own agents
        return Response.json({
          success: true,
          data: { message: 'Default agent creation disabled - users create their own agents' },
          error: null
        });

      default:
        return Response.json({
          success: false,
          error: 'Invalid operation. Use: create, list, get, update, delete, ensure_defaults'
        } satisfies ErrorResponse, { status: 400 });
    }

  } catch (error) {
    console.error('Error in test CRUD:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

// GET - Get test info
export async function GET(): Promise<Response> {
  return Response.json({
    success: true,
    message: 'AI Agents Test CRUD Endpoint',
    testUserId: TEST_USER_ID,
    operations: ['create', 'list', 'get', 'update', 'delete', 'ensure_defaults'],
    example: {
      create: {
        operation: 'create',
        data: {
          name: 'Test Agent',
          description: 'A test agent',
          agentType: 'query',
          personality: 'Helpful assistant',
          intent: 'To help users',
          additionalInformation: 'Test information',
          variables: { test: 'value' }
        }
      }
    }
  });
} 
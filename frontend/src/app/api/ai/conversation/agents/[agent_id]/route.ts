import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';

interface UpdateAgentRequest {
  name?: string;
  description?: string;
  personality?: string;
  intent?: string;
  additionalInformation?: string;
  variables?: Record<string, string>;
  isActive?: boolean;
}

interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string;
  agentType: string;
  personality: string;
  intent: string;
  additionalInformation: string;
  variables: Record<string, string>;
  customPrompt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AgentResponse {
  success: boolean;
  message?: string;
  agent?: Agent;
  error?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
const FALLBACK_USER_ID = 'ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21';

// GET - Get single agent
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agent_id: string }> }
): Promise<Response> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || FALLBACK_USER_ID;

    const { agent_id } = await params;
    if (!agent_id) {
      return Response.json({
        success: false,
        error: 'Agent ID is required'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const requestUserId = searchParams.get('userId') || userId;

    console.log('Get agent request:', {
      agentId: agent_id,
      userId: requestUserId
    });

    // Forward to FastAPI backend
    const response = await fetch(`${FASTAPI_URL}/ai/conversation/agents/${agent_id}?userId=${requestUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${requestUserId}`
      }
    });

    let data: AgentResponse;
    try {
      const textResponse = await response.text();
      data = JSON.parse(textResponse);
      console.log('Get agent response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      const errorMsg = response.status === 404
        ? 'Agent not found'
        : response.status === 422
          ? 'Invalid request parameters'
          : response.status === 500
            ? 'Internal server error'
            : 'Failed to get agent';
      throw new Error(errorMsg);
    }

    // Validate response has expected fields
    if (!data.success || !data.agent) {
      throw new Error('Invalid response format from server');
    }

    // Return response in expected format
    return Response.json({
      success: true,
      agent: data.agent,
      message: data.message
    });

  } catch (error) {
    console.error('Error getting agent:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

// PUT - Update agent
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ agent_id: string }> }
): Promise<Response> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || FALLBACK_USER_ID;

    const { agent_id } = await params;
    if (!agent_id) {
      return Response.json({
        success: false,
        error: 'Agent ID is required'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const requestUserId = searchParams.get('userId') || userId;

    // Parse and validate request body
    const body = await req.json() as UpdateAgentRequest;
    
    console.log('Update agent request:', {
      agentId: agent_id,
      userId: requestUserId,
      updates: Object.keys(body)
    });

    // Forward to FastAPI backend
    const response = await fetch(`${FASTAPI_URL}/ai/conversation/agents/${agent_id}?userId=${requestUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${requestUserId}`
      },
      body: JSON.stringify(body)
    });

    let data: AgentResponse;
    try {
      const textResponse = await response.text();
      data = JSON.parse(textResponse);
      console.log('Update agent response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      const errorMsg = response.status === 404
        ? 'Agent not found'
        : response.status === 422
          ? 'Invalid update data'
          : response.status === 500
            ? 'Internal server error'
            : 'Failed to update agent';
      throw new Error(errorMsg);
    }

    // Validate response has expected fields
    if (!data.success || !data.agent) {
      throw new Error('Invalid response format from server');
    }

    // Return response in expected format
    return Response.json({
      success: true,
      agent: data.agent,
      message: data.message || 'Agent updated successfully'
    });

  } catch (error) {
    console.error('Error updating agent:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

// DELETE - Delete agent
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ agent_id: string }> }
): Promise<Response> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || FALLBACK_USER_ID;

    const { agent_id } = await params;
    if (!agent_id) {
      return Response.json({
        success: false,
        error: 'Agent ID is required'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const requestUserId = searchParams.get('userId') || userId;

    console.log('Delete agent request:', {
      agentId: agent_id,
      userId: requestUserId
    });

    // Forward to FastAPI backend
    const response = await fetch(`${FASTAPI_URL}/ai/conversation/agents/${agent_id}?userId=${requestUserId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${requestUserId}`
      }
    });

    let data: string;
    try {
      data = await response.text();
      console.log('Delete agent response:', data);
    } catch (e) {
      console.error('Failed to read response:', e);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      const errorMsg = response.status === 404
        ? 'Agent not found'
        : response.status === 422
          ? 'Invalid request parameters'
          : response.status === 500
            ? 'Internal server error'
            : 'Failed to delete agent';
      throw new Error(errorMsg);
    }

    // Return success response
    return Response.json({
      success: true,
      message: 'Agent deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting agent:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
} 
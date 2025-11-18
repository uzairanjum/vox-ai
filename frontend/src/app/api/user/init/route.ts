import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';

interface ErrorResponse {
  success: false;
  error: string;
}

interface SuccessResponse {
  success: true;
  message: string;
  data?: any;
}

// POST - Initialize user data (create default agents, cleanup duplicates)
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    console.log('Initializing user data for:', user.id);

    // User initialization complete - no automatic agent creation
      return Response.json({
        success: true,
      message: 'User data initialized successfully',
        data: { userId: user.id }
      } satisfies SuccessResponse);

  } catch (error) {
    console.error('Error in user initialization:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

// GET - Check user initialization status
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    // For now, just return success - could add checks for default agents existence
    return Response.json({
      success: true,
      message: 'User initialization status',
      data: { 
        userId: user.id,
        initialized: true // Could check actual status here
      }
    } satisfies SuccessResponse);

  } catch (error) {
    console.error('Error checking user initialization:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

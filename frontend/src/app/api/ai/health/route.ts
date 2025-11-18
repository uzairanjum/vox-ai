import { NextRequest } from 'next/server';
import { getFastAPI } from '@/lib/fastapi-utils';

interface HealthResponse {
  success: boolean;
  fastapi: {
    online: boolean;
    url: string;
    error?: string;
  };
  database: {
    online: boolean;
    error?: string;
  };
  timestamp: string;
}

export async function GET(req: NextRequest): Promise<Response> {
  const health: HealthResponse = {
    success: true,
    fastapi: {
      online: false,
      url: process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'
    },
    database: {
      online: false
    },
    timestamp: new Date().toISOString()
  };

  try {
    // Test FastAPI connection
    try {
      const fastApiResponse = await getFastAPI('/health');
      health.fastapi.online = true;
      console.log('✅ FastAPI is online:', fastApiResponse);
    } catch (fastApiError) {
      health.fastapi.online = false;
      health.fastapi.error = fastApiError instanceof Error ? fastApiError.message : 'Unknown error';
      console.error('❌ FastAPI is offline:', fastApiError);
    }

    // Test database connection
    try {
      const { getSupabase } = await import('@/utils/supabase/getSupabase');
      const supabase = await getSupabase();
      const { data, error } = await supabase.from('user_profile').select('count').limit(1);
      
      if (error) {
        health.database.online = false;
        health.database.error = error.message;
      } else {
        health.database.online = true;
      }
    } catch (dbError) {
      health.database.online = false;
      health.database.error = dbError instanceof Error ? dbError.message : 'Unknown error';
    }

    // Overall success depends on both services
    health.success = health.fastapi.online && health.database.online;

    return Response.json(health);

  } catch (error) {
    console.error('Health check failed:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
import { NextRequest } from 'next/server';
import { getSupabase } from '@/utils/supabase/getSupabase';

export async function GET(req: NextRequest) {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        database: { status: 'unknown', message: '' },
        agents: { status: 'unknown', count: 0 },
        knowledgeBase: { status: 'unknown', message: '' }
      }
    };

    // Test Database Connection
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('ai_agents')
        .select('count')
        .limit(1);
      
      if (error) {
        checks.services.database = { status: 'error', message: error.message };
      } else {
        checks.services.database = { status: 'healthy', message: 'Connected' };
      }
    } catch (error) {
      checks.services.database = { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Database connection failed' 
      };
    }

    // Test Agents
    try {
      const supabase = await getSupabase();
      const { data, error, count } = await supabase
        .from('ai_agents')
        .select('*', { count: 'exact' })
        .eq('user_id', 'ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21');
      
      if (error) {
        checks.services.agents = { status: 'error', count: 0 };
      } else {
        checks.services.agents = { 
          status: count && count > 0 ? 'healthy' : 'warning', 
          count: count || 0 
        };
      }
    } catch (error) {
      checks.services.agents = { status: 'error', count: 0 };
    }

    // Test Knowledge Base
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('knowledge_bases')
        .select('count')
        .limit(1);
      
      if (error) {
        checks.services.knowledgeBase = { status: 'error', message: error.message };
      } else {
        checks.services.knowledgeBase = { status: 'healthy', message: 'Available' };
      }
    } catch (error) {
      checks.services.knowledgeBase = { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Knowledge base check failed' 
      };
    }

    // Overall status
    const hasErrors = Object.values(checks.services).some(service => service.status === 'error');
    checks.status = hasErrors ? 'unhealthy' : 'healthy';

    return Response.json(checks);

  } catch (error) {
    return Response.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      message: error instanceof Error ? error.message : 'Health check failed'
    }, { status: 500 });
  }
} 
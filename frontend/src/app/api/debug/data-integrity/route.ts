// @ts-nocheck

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getSupabase } from '@/utils/supabase/getSupabase';

interface ErrorResponse {
  success: false;
  error: string;
}

interface DiagnosticResponse {
  success: true;
  data: {
    agents: {
      total: number;
      withValidTypes: number;
      invalidEntries: any[];
    };
    knowledgeBases: {
      total: number;
      withValidTypes: number;
      invalidEntries: any[];
    };
    potentialIssues: string[];
    recommendations: string[];
  };
}

// GET - Diagnose data integrity issues
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const supabase = await getSupabase();
    
    // Get all agents
    const { data: agents, error: agentsError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('user_id', user.id);

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      return Response.json({
        success: false,
        error: 'Failed to fetch agents'
      } satisfies ErrorResponse, { status: 500 });
    }

    // Get all knowledge bases
    const { data: knowledgeBases, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('user_id', user.id);

    if (kbError) {
      console.error('Error fetching knowledge bases:', kbError);
      return Response.json({
        success: false,
        error: 'Failed to fetch knowledge bases'
      } satisfies ErrorResponse, { status: 500 });
    }

    // Valid agent types (1, 2, 3, 99)
    const validAgentTypes = [1, 2, 3, 99];
    // Valid KB types (1, 2, 3, 4)
    const validKBTypes = [1, 2, 3, 4];

    // Analyze agents
    const invalidAgents = (agents || []).filter(agent => 
      !validAgentTypes.includes(agent.type) || 
      !agent.name || 
      !agent.system_prompt
    );

    // Analyze knowledge bases  
    const invalidKBs = (knowledgeBases || []).filter(kb => 
      !validKBTypes.includes(kb.type) || 
      !kb.name
    );

    // Check for potential issues
    const potentialIssues: string[] = [];
    const recommendations: string[] = [];

    // Check if any KB entries have agent-like properties
    const suspiciousKBs = (knowledgeBases || []).filter(kb => 
      kb.system_prompt || // KBs shouldn't have system_prompt
      (kb.type && validAgentTypes.includes(kb.type) && !validKBTypes.includes(kb.type))
    );

    // Check if any agent entries have KB-like properties
    const suspiciousAgents = (agents || []).filter(agent => 
      agent.summary || // Agents typically don't have summary field
      agent.faq || // Agents shouldn't have FAQ
      (agent.type && validKBTypes.includes(agent.type) && !validAgentTypes.includes(agent.type))
    );

    if (suspiciousKBs.length > 0) {
      potentialIssues.push(`Found ${suspiciousKBs.length} knowledge bases with agent-like properties`);
      recommendations.push('Review knowledge bases that may have been created in the wrong table');
    }

    if (suspiciousAgents.length > 0) {
      potentialIssues.push(`Found ${suspiciousAgents.length} agents with knowledge base-like properties`);
      recommendations.push('Review agents that may have been created in the wrong table');
    }

    if (invalidAgents.length > 0) {
      potentialIssues.push(`Found ${invalidAgents.length} agents with invalid data`);
      recommendations.push('Clean up or fix invalid agent entries');
    }

    if (invalidKBs.length > 0) {
      potentialIssues.push(`Found ${invalidKBs.length} knowledge bases with invalid data`);
      recommendations.push('Clean up or fix invalid knowledge base entries');
    }

    // Check for schema field mismatches
    const agentsWithOldSchema = (agents || []).filter(agent => 
      agent.kb_ids || // Old field name
      agent.prompt // Old field name
    );

    if (agentsWithOldSchema.length > 0) {
      potentialIssues.push(`Found ${agentsWithOldSchema.length} agents using old schema field names`);
      recommendations.push('Migrate agents to use new schema (knowledge_base_ids, system_prompt)');
    }

    return Response.json({
      success: true,
      data: {
        agents: {
          total: agents?.length || 0,
          withValidTypes: (agents || []).filter(a => validAgentTypes.includes(a.type)).length,
          invalidEntries: invalidAgents.map(a => ({
            id: a.id,
            name: a.name,
            type: a.type,
            issues: [
              !validAgentTypes.includes(a.type) && 'Invalid type',
              !a.name && 'Missing name',
              !a.system_prompt && 'Missing system_prompt'
            ].filter(Boolean)
          }))
        },
        knowledgeBases: {
          total: knowledgeBases?.length || 0,
          withValidTypes: (knowledgeBases || []).filter(kb => validKBTypes.includes(kb.type)).length,
          invalidEntries: invalidKBs.map(kb => ({
            id: kb.id,
            name: kb.name,
            type: kb.type,
            issues: [
              !validKBTypes.includes(kb.type) && 'Invalid type',
              !kb.name && 'Missing name'
            ].filter(Boolean)
          }))
        },
        potentialIssues,
        recommendations
      }
    } satisfies DiagnosticResponse);

  } catch (error) {
    console.error('Error in data integrity check:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
} 
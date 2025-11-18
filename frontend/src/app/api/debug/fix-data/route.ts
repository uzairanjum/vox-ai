import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/utils/supabase/getSupabase';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    const supabase = await getSupabase();
    
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = userData.user.id;
    
    if (action === 'cleanup_default_agents') {
      // Delete all default agents that have is_default metadata
      const { data: deletedAgents, error: deleteError } = await supabase
        .from('ai_agents')
        .delete()
        .eq('user_id', userId)
        .or('metadata->>is_default.eq.true,data->>is_default.eq.true')
        .select('id, name');
      
      if (deleteError) {
        console.error('Error deleting default agents:', deleteError);
        return NextResponse.json({ 
          success: false, 
          error: deleteError.message 
        }, { status: 500 });
      }
      
      console.log('✅ Deleted default agents:', deletedAgents);
      
      return NextResponse.json({ 
        success: true, 
        message: `Deleted ${deletedAgents?.length || 0} default agents`,
        deletedAgents 
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Unknown action. Use action: "cleanup_default_agents"' 
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error in fix-data API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
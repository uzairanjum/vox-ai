// @ts-nocheck

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getSupabase } from '@/utils/supabase/getSupabase';

interface GlobalAISettings {
  default_agent_id?: string; // ✅ NEW: Global agent for all features
  query_agent_id?: string;
  suggestions_agent_id?: string;
  autopilot_agent_id?: string;
  use_global_agents: boolean;
  conversation_starters_enabled: boolean;
  new_conversation_behavior: 'greeting' | 'question' | 'professional';
}

interface ErrorResponse {
  success: false;
  error: string;
}

interface SuccessResponse {
  success: true;
  data: GlobalAISettings;
}

// GET - Fetch global AI settings
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
    
    // Get user's global AI settings - handle missing preferences column gracefully
    const { data: settings, error } = await supabase
      .from('user_profile')
      .select('preferences')
      .eq('user_id_auth', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching global AI settings:', error);
      
      // If preferences column doesn't exist, return default settings
      if (error.message?.includes('column') && error.message?.includes('preferences')) {
        console.log('Preferences column does not exist, returning default settings');
        const defaultSettings: GlobalAISettings = {
          default_agent_id: undefined, // ✅ No global agent set by default
          use_global_agents: false,
          conversation_starters_enabled: true,
          new_conversation_behavior: 'greeting' as const
        };
        
        return Response.json({
          success: true,
          data: defaultSettings
        } satisfies SuccessResponse);
      }
      
      return Response.json({
        success: false,
        error: 'Failed to fetch global AI settings'
      } satisfies ErrorResponse, { status: 500 });
    }

    // Extract AI settings from preferences
    const aiSettings = settings?.preferences?.ai_global_settings || {
      default_agent_id: undefined, // ✅ No global agent set by default
      use_global_agents: false,
      conversation_starters_enabled: true,
      new_conversation_behavior: 'greeting'
    };

    return Response.json({
      success: true,
      data: aiSettings
    } satisfies SuccessResponse);

  } catch (error) {
    console.error('Error in global AI settings GET:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

// POST - Save global AI settings
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const body = await req.json() as GlobalAISettings;
    
    // Validate the settings
    if (typeof body.use_global_agents !== 'boolean' || 
        typeof body.conversation_starters_enabled !== 'boolean') {
      return Response.json({
        success: false,
        error: 'Invalid settings format'
      } satisfies ErrorResponse, { status: 400 });
    }

    const supabase = await getSupabase();
    
    // Get current user preferences
    const { data: currentProfile, error: fetchError } = await supabase
      .from('user_profile')
      .select('preferences')
      .eq('user_id_auth', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', fetchError);
      return Response.json({
        success: false,
        error: 'Failed to fetch user profile'
      } satisfies ErrorResponse, { status: 500 });
    }

    // Merge with existing preferences
    const currentPreferences = currentProfile?.preferences || {};
    const updatedPreferences = {
      ...currentPreferences,
      ai_global_settings: {
        query_agent_id: body.query_agent_id || null,
        suggestions_agent_id: body.suggestions_agent_id || null,
        autopilot_agent_id: body.autopilot_agent_id || null,
        use_global_agents: body.use_global_agents,
        conversation_starters_enabled: body.conversation_starters_enabled,
        new_conversation_behavior: body.new_conversation_behavior || 'greeting',
        updated_at: new Date().toISOString()
      }
    };

    // Update or insert user profile preferences
    const { error: updateError } = await supabase
      .from('user_profile')
      .upsert({
        user_id_auth: user.id,
        preferences: updatedPreferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id_auth'
      });

    if (updateError) {
      console.error('Error updating global AI settings:', updateError);
      return Response.json({
        success: false,
        error: 'Failed to save global AI settings'
      } satisfies ErrorResponse, { status: 500 });
    }

    console.log('Global AI settings saved successfully:', {
      userId: user.id,
      settings: updatedPreferences.ai_global_settings
    });

    return Response.json({
      success: true,
      data: updatedPreferences.ai_global_settings
    } satisfies SuccessResponse);

  } catch (error) {
    console.error('Error in global AI settings POST:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

// ✅ NEW: PATCH - Update specific global AI settings (like default_agent_id)
export async function PATCH(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const body = await req.json();
    const supabase = await getSupabase();

    // Get current preferences or create empty object
    const { data: currentProfile } = await supabase
      .from('user_profile')
      .select('preferences')
      .eq('user_id_auth', user.id)
      .single();

    const currentPreferences = currentProfile?.preferences || {};
    const currentAISettings = currentPreferences.ai_global_settings || {
      default_agent_id: undefined,
      use_global_agents: false,
      conversation_starters_enabled: true,
      new_conversation_behavior: 'greeting'
    };

    // Update only the provided fields
    const updatedAISettings = {
      ...currentAISettings,
      ...body
    };

    const updatedPreferences = {
      ...currentPreferences,
      ai_global_settings: updatedAISettings
    };

    // Update the preferences in the database
    const { error } = await supabase
      .from('user_profile')
      .update({ preferences: updatedPreferences })
      .eq('user_id_auth', user.id);

    if (error) {
      console.error('Error updating global AI settings:', error);
      
      // If preferences column doesn't exist, we can't update it
      if (error.message?.includes('column') && error.message?.includes('preferences')) {
        return Response.json({
          success: false,
          error: 'Database schema does not support preferences storage. Contact support.'
        } satisfies ErrorResponse, { status: 500 });
      }
      
      throw error;
    }

    console.log('Global AI settings updated successfully:', updatedAISettings);

    return Response.json({
      success: true,
      data: updatedAISettings,
      settings: updatedAISettings // ✅ Add settings field for compatibility
    } satisfies SuccessResponse & { settings: GlobalAISettings });

  } catch (error) {
    console.error('Error in global AI settings PATCH:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
} 
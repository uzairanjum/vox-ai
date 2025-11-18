// @ts-nocheck

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getSupabase } from '@/utils/supabase/getSupabase';
import { 
  ConversationMetaData, 
  ConversationMetaInsert,
  ConversationMetaListResponse,
  ConversationMetaResponse,
  CONVERSATION_DATA_TYPES 
} from '@/utils/database/conversationMeta';

interface ErrorResponse {
  success: false;
  error: string;
}

// GET - Get conversation metadata
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const locationId = searchParams.get('locationId');

    const supabase = await getSupabase();

    if (conversationId) {
      // Get specific conversation metadata - FIXED: using correct table name
      const { data, error } = await supabase
        .from('conversation_meta_data')
        .select('*')
        .eq('conv_id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching conversation metadata:', error);
        return Response.json({
          success: false,
          error: 'Failed to fetch conversation metadata'
        } satisfies ErrorResponse, { status: 500 });
      }

      return Response.json({
        success: true,
        data: data || undefined
      } satisfies ConversationMetaResponse);
    } else {
      // Get all conversation metadata for user - FIXED: using correct table name
      let query = supabase
        .from('conversation_meta_data')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching conversation metadata list:', error);
        return Response.json({
          success: false,
          error: 'Failed to fetch conversation metadata'
        } satisfies ErrorResponse, { status: 500 });
      }

      return Response.json({
        success: true,
        data: data as ConversationMetaData[],
        total: data?.length || 0
      } satisfies ConversationMetaListResponse);
    }

  } catch (error) {
    console.error('Error in conversation metadata GET:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

// POST - Create or update conversation metadata
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const body = await req.json();
    console.log('📝 Conversation metadata save request:', {
      userId: user.id,
      requestBody: body
    });
    
    // Handle both old and new request formats
    let conv_id: string;
    let location_id: string | undefined;
    let data: any;
    let name: string;
    let data_type: number;

    if (body.conv_id) {
      // New format
      conv_id = body.conv_id;
      location_id = body.location_id;
      data = body.data;
      name = body.name || `Conversation ${conv_id.substring(0, 8)}`;
      data_type = body.data_type || CONVERSATION_DATA_TYPES.GENERAL;
    } else if (body.conversationId) {
      // Old format - backward compatibility
      conv_id = body.conversationId;
      location_id = body.locationId;
      data = { ai_settings: body.ai_settings || body.settings };
      name = `Conversation AI Settings`;
      data_type = CONVERSATION_DATA_TYPES.AI_SETTINGS;
      
      console.log('🤖 AI Settings save detected:', {
        conversationId: conv_id,
        locationId: location_id,
        aiSettings: data.ai_settings
      });
    } else {
      return Response.json({
        success: false,
        error: 'Missing required field: conv_id or conversationId'
      } satisfies ErrorResponse, { status: 400 });
    }
    
    if (!conv_id) {
      return Response.json({
        success: false,
        error: 'Missing required field: conv_id'
      } satisfies ErrorResponse, { status: 400 });
    }

    const supabase = await getSupabase();

    // Check if conversation metadata already exists - FIXED: using correct table name
    const { data: existing } = await supabase
      .from('conversation_meta_data')
      .select('id')
      .eq('conv_id', conv_id)
      .eq('user_id', user.id)
      .single();

    const metaData: ConversationMetaInsert = {
      conv_id,
      location_id,
      name,
      user_id: user.id,
      data_type,
      data: data || {},
      lastmessageid: body.lastMessageId || body.lastmessageid || undefined
    };

    console.log('💾 Saving conversation metadata:', {
      existingRecord: !!existing,
      metaData: {
        ...metaData,
        data: metaData.data ? '[OBJECT]' : null
      }
    });

    if (existing) {
      // Update existing metadata - FIXED: using correct table name
      const { data: updatedData, error } = await supabase
        .from('conversation_meta_data')
        .update(metaData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('💥 Error updating conversation metadata:', error);
        return Response.json({
          success: false,
          error: 'Failed to update conversation metadata'
        } satisfies ErrorResponse, { status: 500 });
      }

      console.log('✅ Conversation metadata updated successfully:', {
        id: updatedData.id,
        conv_id: updatedData.conv_id,
        data_type: updatedData.data_type
      });

      return Response.json({
        success: true,
        data: updatedData as ConversationMetaData
      } satisfies ConversationMetaResponse);
    } else {
      // Create new metadata - FIXED: using correct table name
      const { data: createdData, error } = await supabase
        .from('conversation_meta_data')
        .insert(metaData)
        .select()
        .single();

      if (error) {
        console.error('💥 Error creating conversation metadata:', error);
        return Response.json({
          success: false,
          error: 'Failed to create conversation metadata'
        } satisfies ErrorResponse, { status: 500 });
      }

      console.log('✅ New conversation metadata created:', {
        id: createdData.id,
        conv_id: createdData.conv_id,
        data_type: createdData.data_type
      });

      return Response.json({
        success: true,
        data: createdData as ConversationMetaData
      } satisfies ConversationMetaResponse);
    }

  } catch (error) {
    console.error('💥 Error in conversation metadata POST:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
} 

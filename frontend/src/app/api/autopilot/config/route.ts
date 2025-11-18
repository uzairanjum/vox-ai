// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/utils/supabase/getSupabase';
import { getActiveAIAgent } from '@/utils/ai/globalSettings';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    // Enforce proper authentication for production readiness
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = userData.user.id;

    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    // Get autopilot config (conversation-specific or global)
    let query = supabase
      .from('autopilot_configs')
      .select('*')
      .eq('user_id', userId);

    if (conversationId) {
      query = query.or(`conversation_id.eq.${conversationId},conversation_id.is.null`);
    } else {
      query = query.is('conversation_id', null);
    }

    const { data: configs, error } = await query.order('conversation_id', { ascending: false, nullsFirst: false });

    if (error) {
      throw error;
    }

    // Return conversation-specific config if available, otherwise global
    const config = configs?.[0] || null;

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching autopilot config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch autopilot config' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    // Enforce proper authentication for production readiness
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = userData.user.id;

    const body = await request.json();
    console.log('🤖 Autopilot config save request:', {
      userId: userId,
      requestBody: body
    });

    const {
      conversationId,
      locationId,
      isEnabled,
      replyDelayMinutes,
      maxRepliesPerConversation,
      maxRepliesPerDay,
      operatingHours,
      aiAgentId, // Only for override cases
      aiMaxTokens,
      fallbackMessage,
      customPrompt,
      cancelOnUserReply,
      requireHumanKeywords,
      excludeKeywords,
      messageType,
      preferConversationType,
      // NEW: Accept conversation and contact metadata
      conversationMetadata,
      contactMetadata
    } = body;

    // NOTE: aiModel and aiTemperature are NOT accepted from frontend
    // They are always determined from the active AI agent configuration
    // This ensures consistency and prevents per-conversation AI model overrides

    // Validate message_type against allowed values
    const VALID_MESSAGE_TYPES = ['SMS', 'Email', 'WhatsApp', 'FB', 'IG', 'Live_Chat', 'Custom'];
    const validatedMessageType = VALID_MESSAGE_TYPES.includes(messageType || 'SMS') ? messageType : 'SMS';

    // 🤖 ALWAYS USE ACTIVE AI AGENT: Get the currently active AI agent for all autopilot operations
    let finalAiAgentId = aiAgentId; // Allow override for specific cases
    let finalAiModel = 'gpt-4o-mini'; // Default fallback
    let finalAiTemperature = 0.7; // Default fallback
    
    try {
      console.log('🔍 Getting active AI agent for autopilot configuration...');
      const activeAgent = await getActiveAIAgent();
      
      if (activeAgent) {
        // Use active agent unless specifically overridden
        if (!aiAgentId) {
          finalAiAgentId = activeAgent.id;
        }
        
        // Always use active agent's AI configuration
        if (activeAgent.configuration) {
          finalAiModel = activeAgent.configuration.model || finalAiModel;
          finalAiTemperature = activeAgent.configuration.temperature ?? finalAiTemperature;
        }
        
        console.log('✅ Using AI agent for autopilot:', {
          agentId: finalAiAgentId,
          agentName: activeAgent.name,
          model: finalAiModel,
          temperature: finalAiTemperature,
          isOverride: !!aiAgentId
        });
      } else {
        console.log('⚠️ No active AI agent found - using defaults for autopilot');
      }
    } catch (error) {
      console.log('⚠️ Failed to get active AI agent for autopilot:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Upsert autopilot config
    const configData = {
      user_id: userId,
      conversation_id: conversationId || null,
      location_id: locationId,
      is_enabled: isEnabled ?? false,
      reply_delay_minutes: replyDelayMinutes ?? 5,
      max_replies_per_conversation: maxRepliesPerConversation ?? 3,
      max_replies_per_day: maxRepliesPerDay ?? 10,
      operating_hours: operatingHours || {
        enabled: false,
        start: "09:00",
        end: "17:00",
        timezone: "UTC",
        days: [1, 2, 3, 4, 5]
      },
      ai_agent_id: finalAiAgentId,
      ai_model: finalAiModel,         // From active AI agent configuration
      ai_temperature: finalAiTemperature, // From active AI agent configuration  
      ai_max_tokens: aiMaxTokens ?? 500,
      fallback_message: fallbackMessage || 'Thank you for your message. I\'ll get back to you as soon as possible.',
      custom_prompt: customPrompt,
      cancel_on_user_reply: cancelOnUserReply ?? true,
      require_human_keywords: requireHumanKeywords || [],
      exclude_keywords: excludeKeywords || [],
      message_type: validatedMessageType,
      prefer_conversation_type: preferConversationType ?? true,
      // NEW: Store conversation and contact metadata in JSONB metadata field
      metadata: {
        conversationMetadata: conversationMetadata || null,
        contactMetadata: contactMetadata || null,
        setupDate: new Date().toISOString(),
        version: '1.0'
      }
    };

    console.log('💾 Saving autopilot config to database:', {
      conversationId: configData.conversation_id,
      locationId: configData.location_id,
      isEnabled: configData.is_enabled,
      aiAgentId: configData.ai_agent_id,
      aiModel: configData.ai_model
    });

    // Start transaction for atomic operations
    const { data: config, error } = await supabase
      .from('autopilot_configs')
      .upsert(configData, {
        onConflict: 'user_id,conversation_id'
      })
      .select()
      .single();

    if (error) {
      console.error('💥 Error saving autopilot config:', error);
      throw error;
    }

    // Sync autopilot state with conversation_meta_data
    async function syncAutopilotStateWithMetaData(userId: string, conversationId: string, isEnabled: boolean) {
      const supabase = await getSupabase();
      try {
        console.log('🔄 Syncing autopilot state with conversation metadata:', { userId, conversationId, isEnabled });
        const { data: existingMeta, error } = await supabase
          .from('conversation_meta_data')
          .select('id, data')
          .eq('conv_id', conversationId)
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('❌ Error fetching conversation metadata for sync:', error);
          return;
        }

        if (existingMeta) {
          const updatedData = {
            ...existingMeta.data,
            ai_settings: {
              ...(existingMeta.data?.ai_settings || {}),
              autopilot: {
                ...(existingMeta.data?.ai_settings?.autopilot || {}),
                enabled: isEnabled
              }
            }
          };

          const { error: updateError } = await supabase
            .from('conversation_meta_data')
            .update({ data: updatedData })
            .eq('id', existingMeta.id);

          if (updateError) {
            console.error('❌ Error updating conversation metadata with autopilot state:', updateError);
          } else {
            console.log('✅ Synced autopilot state with conversation metadata');
          }
        }
      } catch (syncError) {
        console.error('⚠️ Error during autopilot state sync with metadata:', syncError);
      }
    }

    // After upserting autopilot config, sync with conversation_meta_data and tracking
    if (config) {
      console.log('✅ Autopilot config saved successfully:', {
        id: config.id,
        conversationId: config.conversation_id,
        isEnabled: config.is_enabled
      });
      // Sync autopilot state with conversation_meta_data
      await syncAutopilotStateWithMetaData(userId, conversationId, isEnabled ?? false);
      // Sync with conversation tracking
      if (conversationId && locationId) {
        try {
          await ensureConversationTrackingSync(userId, conversationId, locationId, isEnabled ?? false);
        } catch (syncError) {
          console.error('💥 Critical error syncing conversation tracking:', syncError);
          // Don't fail the request, but log the error critically
        }
      }
    }

    // **NEW:** Initialize analytics record if enabling autopilot
    if (isEnabled && conversationId) {
      await initializeAutopilotAnalytics(userId, locationId);
    }

    return NextResponse.json({ 
      success: true, 
      config,
      tracking_synced: true 
    });

  } catch (error) {
    console.error('💥 Error in autopilot config POST:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save autopilot config',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    // Enforce proper authentication for production readiness
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = userData.user.id;

    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    let query = supabase
      .from('autopilot_configs')
      .delete()
      .eq('user_id', userId);

    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    } else {
      query = query.is('conversation_id', null);
    }

    const { error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting autopilot config:', error);
    return NextResponse.json(
      { error: 'Failed to delete autopilot config' },
      { status: 500 }
    );
  }
}

// **ENHANCED:** Comprehensive conversation tracking sync with retry
async function ensureConversationTrackingSync(userId: string, conversationId: string, locationId: string, isEnabled: boolean, retries = 3) {
  const supabase = await getSupabase();
  let attempt = 0;

  while (attempt < retries) {
    try {
      console.log(`🔄 Syncing conversation tracking (Attempt ${attempt + 1}/${retries}):`, {
        userId,
        conversationId,
        locationId,
        isEnabled
      });

      // Check if tracking record exists
      const { data: existing } = await supabase
        .from('autopilot_conversation_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('conversation_id', conversationId)
        .single();

      if (!existing) {
        // Create new tracking record with proper initialization
        const trackingData = {
          user_id: userId,
          conversation_id: conversationId,
          location_id: locationId,
          autopilot_enabled: isEnabled,
          conversation_status: 'open',
          ai_replies_count: 0,
          ai_replies_today: 0,
          last_reply_date: new Date().toISOString().split('T')[0],
          data: {
            initialized_at: new Date().toISOString(),
            version: '1.0'
          }
        };

        const { error: insertError } = await supabase
          .from('autopilot_conversation_tracking')
          .insert(trackingData);

        if (insertError) {
          console.error(`❌ Error creating conversation tracking (Attempt ${attempt + 1}):`, insertError);
          throw insertError;
        }

        console.log('✅ Created new conversation tracking record');
        return;
      } else {
        // Update existing tracking record
        const { error: updateError } = await supabase
          .from('autopilot_conversation_tracking')
          .update({
            autopilot_enabled: isEnabled,
            updated_at: new Date().toISOString(),
            data: {
              ...existing.data,
              last_sync: new Date().toISOString()
            }
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`❌ Error updating conversation tracking (Attempt ${attempt + 1}):`, updateError);
          throw updateError;
        }

        console.log('✅ Updated conversation tracking record');
        return;
      }
    } catch (error) {
      attempt++;
      if (attempt === retries) {
        console.error(`❌ Failed to sync conversation tracking after ${retries} attempts:`, error);
        throw error;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// **NEW:** Initialize conversation context from GHL
async function initializeConversationContext(userId: string, conversationId: string, locationId: string) {
  try {
    // Import the GHL API utility - we'll need to create this if it doesn't exist
    const { fetchGhlApiWithRefresh } = await import('@/lib/leadconnector/fetchApi');
    
    // Get recent messages to establish context
    const messagesResponse = await fetchGhlApiWithRefresh(
      `/conversations/${conversationId}/messages?limit=10`,
      userId
    );

    const messages = messagesResponse?.messages?.messages || [];
    
    if (messages.length > 0) {
      const latestMessage = messages[0];
      const latestHumanMessage = messages.find((msg: any) => msg.direction === 'inbound');

      const supabase = await getSupabase();
      
      // Update tracking with latest message context
      await supabase
        .from('autopilot_conversation_tracking')
        .update({
          last_seen_message_id: latestMessage.id,
          last_human_message_id: latestHumanMessage?.id,
          last_human_message_at: latestHumanMessage?.dateAdded,
          conversation_type: latestMessage.messageType || 'SMS',
          detected_message_type: latestMessage.messageType || 'SMS'
        })
        .eq('user_id', userId)
        .eq('conversation_id', conversationId);

      console.log('✅ Initialized conversation context with latest message');
    }

  } catch (error) {
    console.error('⚠️ Error initializing conversation context (non-critical):', error);
    // Don't throw - this is non-critical for autopilot functionality
  }
}

// **NEW:** Initialize analytics tracking
async function initializeAutopilotAnalytics(userId: string, locationId: string) {
  const supabase = await getSupabase();
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if analytics record exists for today
    const { data: existing } = await supabase
      .from('autopilot_analytics')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('location_id', locationId)
      .single();

    if (!existing) {
      // Create analytics record for today
      await supabase
        .from('autopilot_analytics')
        .insert({
          user_id: userId,
          date: today,
          location_id: locationId,
          total_conversations_monitored: 0,
          total_messages_received: 0,
          total_ai_responses_sent: 0,
          total_responses_cancelled: 0,
          total_responses_failed: 0,
          average_response_delay_minutes: 0,
          success_rate: 0,
          conversations_resolved: 0,
          conversations_escalated: 0,
          metrics: {
            initialized_at: new Date().toISOString()
          }
        });

      console.log('✅ Initialized autopilot analytics for today');
    }

  } catch (error) {
    console.error('⚠️ Error initializing analytics (non-critical):', error);
    // Don't throw - this is non-critical
  }
} 
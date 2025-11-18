// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/utils/supabase/getSupabase';
import { fetchGhlApiWithRefresh } from '@/lib/leadconnector/fetchApi';
import { getActiveAIAgent } from '@/utils/ai/globalSettings';

// Message type mapping between internal types and GHL API types
const MESSAGE_TYPE_MAPPING = [
  { internal: 'TYPE_SMS', ghl: 'SMS' },
  { internal: 'TYPE_EMAIL', ghl: 'Email' },
  { internal: 'TYPE_WHATSAPP', ghl: 'WhatsApp' },
  { internal: 'TYPE_FACEBOOK', ghl: 'FB' },
  { internal: 'TYPE_INSTAGRAM', ghl: 'IG' },
  { internal: 'TYPE_WEBCHAT', ghl: 'Live_Chat' },
  { internal: 'TYPE_LIVE_CHAT', ghl: 'Live_Chat' },
  { internal: 'TYPE_GMB', ghl: 'Custom' }
];

const mapInternalToGHLType = (internalType: string): string => {
  const mapping = MESSAGE_TYPE_MAPPING.find(m => m.internal === internalType);
  return mapping?.ghl || 'SMS';
};

const mapGHLToInternalType = (ghlType: string): string => {
  const mapping = MESSAGE_TYPE_MAPPING.find(m => m.ghl === ghlType);
  return mapping?.internal || 'TYPE_SMS';
};
import { getCurrentUserProviderData } from '@/utils/providers/providerUtils';
import { PROVIDER_TYPE } from '@/utils/config/providerTypes';

interface AutopilotPollResponse {
  success: boolean;
  processed: number;
  scheduled: number;
  cancelled: number;
  errors: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse<AutopilotPollResponse>> {
  const supabase = await getSupabase();
  let processed = 0;
  let scheduled = 0;
  let cancelled = 0;
  const errors: string[] = [];

  try {
    console.log('Autopilot poll started at:', new Date().toISOString());

    // **ENHANCED:** Get conversations with autopilot enabled from BOTH tables
    const { data: enabledConfigs, error: configError } = await supabase
      .from('autopilot_configs')
      .select(`
        *,
        autopilot_conversation_tracking(*)
      `)
      .eq('is_enabled', true);

    if (configError) {
      throw new Error(`Failed to fetch autopilot configs: ${configError.message}`);
    }

    console.log(`📊 Found ${enabledConfigs?.length || 0} enabled autopilot configurations`);

    // **ENHANCED:** Update analytics at start of poll
    await updateAnalyticsStart(enabledConfigs || []);

    for (const config of enabledConfigs || []) {
      try {
        processed++;
        
        // Get or create tracking record for this conversation
        let tracking = config.autopilot_conversation_tracking?.[0];
        
        if (!tracking) {
          console.log(`Creating missing tracking record for conversation ${config.conversation_id}`);
          tracking = await createMissingTrackingRecord(config);
        }

        // Check if autopilot is paused
        if (tracking.autopilot_paused_until && new Date(tracking.autopilot_paused_until) > new Date()) {
          console.log(`⏸️ Autopilot paused for conversation ${tracking.conversation_id} until ${tracking.autopilot_paused_until}`);
          continue;
        }

        // **ENHANCED:** Check for new messages with better error handling
        const newMessages = await checkForNewMessages(tracking);
        
        if (newMessages.length === 0) {
          // Update last checked time even if no new messages
          await updateLastCheckedTime(tracking.id);
          continue;
        }

        console.log(`📨 Found ${newMessages.length} new messages for conversation ${tracking.conversation_id}`);

        // **ENHANCED:** Update analytics - increment messages received
        await incrementMessagesReceived(config.user_id, config.location_id, newMessages.length);

        // Process each new message
        for (const message of newMessages) {
          // Skip if message is from AI/system
          if (message.direction === 'outbound' && message.source === 'api') {
            continue;
          }

          // Check if we should respond to this message
          const shouldRespond = await shouldScheduleResponse(tracking, message, config);
          
          if (shouldRespond.should) {
            const responseId = await scheduleResponse(tracking, message, config);
            if (responseId) {
              scheduled++;
              console.log(`⏰ Scheduled response ${responseId} for conversation ${tracking.conversation_id}`);
            }
          } else {
            console.log(`🚫 Skipping response for conversation ${tracking.conversation_id}: ${shouldRespond.reason}`);
            
            // **NEW:** Log cancellation reasons for analytics
            if (shouldRespond.reason && shouldRespond.reason.includes('limit')) {
              await incrementResponsesCancelled(config.user_id, config.location_id);
            }
          }
        }

        // **ENHANCED:** Update tracking with latest message info and analytics
        await updateConversationTracking(tracking, newMessages);

      } catch (error) {
        const errorMsg = `Error processing conversation ${config.conversation_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        
        // **NEW:** Log error in analytics
        await incrementResponsesFailed(config.user_id, config.location_id);
      }
    }

    // **ENHANCED:** Process scheduled responses with analytics
    const responsesProcessed = await processScheduledResponses();
    scheduled += responsesProcessed.sent;
    cancelled += responsesProcessed.cancelled;

    // **NEW:** Update final analytics
    await updateAnalyticsEnd(enabledConfigs || [], processed, scheduled, cancelled);

    console.log(`Autopilot poll completed: ${processed} processed, ${scheduled} scheduled, ${cancelled} cancelled`);

    return NextResponse.json({
      success: true,
      processed,
      scheduled,
      cancelled,
      errors,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Autopilot poll failed:', error);
    return NextResponse.json({
      success: false,
      processed,
      scheduled,
      cancelled,
      errors: [...errors, error instanceof Error ? error.message : 'Unknown error'],
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function checkForNewMessages(tracking: any) {
  try {
    // Get messages since last seen message (respect 100 message limit)
    const messagesResponse = await fetchGhlApiWithRefresh(
      `/conversations/${tracking.conversation_id}/messages?limit=100${tracking.last_seen_message_id ? `&lastMessageId=${tracking.last_seen_message_id}` : ''}`,
      tracking.user_id
    );

    const messages = messagesResponse?.messages?.messages || [];
    
    // Filter to only new messages (after last_seen_message_id)
    let newMessages;
    if (tracking.last_seen_message_id && tracking.last_seen_message_at) {
      // Filter messages that are newer than our last seen message
      newMessages = messages.filter((msg: any) => {
        const msgDate = new Date(msg.dateAdded);
        const lastSeenDate = new Date(tracking.last_seen_message_at);
        return msgDate > lastSeenDate;
      });
    } else {
      // If no tracking, only get the most recent 5 messages to avoid overwhelming
      newMessages = messages.slice(0, 5);
    }

    console.log(`📨 Found ${newMessages.length} new messages out of ${messages.length} total for conversation ${tracking.conversation_id}`);
    return newMessages;
  } catch (error) {
    console.error(`Failed to fetch messages for conversation ${tracking.conversation_id}:`, error);
    return [];
  }
}

async function shouldScheduleResponse(tracking: any, message: any, config: any) {
  const supabase = await getSupabase();
  
  try {
    // Get autopilot config for this conversation
    const { data: config } = await supabase
      .from('autopilot_configs')
      .select('*')
      .eq('user_id', tracking.user_id)
      .or(`conversation_id.eq.${tracking.conversation_id},conversation_id.is.null`)
      .order('conversation_id', { ascending: false, nullsFirst: false })
      .limit(1)
      .single();

    if (!config?.is_enabled) {
      return { should: false, reason: 'Autopilot not enabled' };
    }

    // Check daily limits
    if (tracking.ai_replies_today >= config.max_replies_per_day) {
      return { should: false, reason: 'Daily reply limit reached' };
    }

    // Check conversation limits
    if (tracking.ai_replies_count >= config.max_replies_per_conversation) {
      return { should: false, reason: 'Conversation reply limit reached' };
    }

    // Check operating hours
    if (config.operating_hours?.enabled) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const operatingHours = config.operating_hours;
      const startHour = parseInt(operatingHours.start?.split(':')[0] || '9');
      const endHour = parseInt(operatingHours.end?.split(':')[0] || '17');
      const operatingDays = operatingHours.days || [1, 2, 3, 4, 5];

      if (!operatingDays.includes(currentDay) || currentHour < startHour || currentHour >= endHour) {
        return { should: false, reason: 'Outside operating hours' };
      }
    }

    // Check exclude keywords
    if (config.exclude_keywords?.length) {
      const messageText = message.body?.toLowerCase() || '';
      const hasExcludeKeyword = config.exclude_keywords.some((keyword: string) => 
        messageText.includes(keyword.toLowerCase())
      );
      
      if (hasExcludeKeyword) {
        return { should: false, reason: 'Message contains exclude keyword' };
      }
    }

    // Check require human keywords
    if (config.require_human_keywords?.length) {
      const messageText = message.body?.toLowerCase() || '';
      const hasHumanKeyword = config.require_human_keywords.some((keyword: string) => 
        messageText.includes(keyword.toLowerCase())
      );
      
      if (hasHumanKeyword) {
        return { should: false, reason: 'Message requires human intervention' };
      }
    }

    // Check if there's already a pending response for this conversation
    const { data: pendingResponse } = await supabase
      .from('autopilot_scheduled_responses')
      .select('id')
      .eq('conversation_id', tracking.conversation_id)
      .eq('status', 'pending')
      .limit(1)
      .single();

    if (pendingResponse) {
      return { should: false, reason: 'Response already scheduled' };
    }

    return { should: true, config };
  } catch (error) {
    console.error('Error checking if should respond:', error);
    return { should: false, reason: 'Error checking conditions' };
  }
}

async function scheduleResponse(tracking: any, message: any, config: any) {
  const supabase = await getSupabase();
  
  try {
    const scheduledAt = new Date(Date.now() + (config.reply_delay_minutes * 60 * 1000));
    
    // Determine message type based on config
    let messageType = config.message_type || 'TYPE_SMS';
    
    // Auto-detect from conversation if prefer_conversation_type is enabled
    if (config.prefer_conversation_type) {
      const detectedType = await detectMessageTypeFromConversation(tracking.conversation_id, tracking.user_id);
      if (detectedType) {
        messageType = detectedType;
      }
    }
    
    // Convert internal type to GHL API type
    const ghlMessageType = mapInternalToGHLType(messageType);
    
    const { data: response, error } = await supabase
      .from('autopilot_scheduled_responses')
      .insert({
        conversation_id: tracking.conversation_id,
        user_id: tracking.user_id,
        trigger_message_id: message.id,
        scheduled_at: scheduledAt.toISOString(),
        message_type: messageType,
        ai_agent_id: config.ai_agent_id,
        ai_config: {
          model: config.ai_model,
          temperature: config.ai_temperature,
          max_tokens: config.ai_max_tokens
        },
        custom_prompt: config.custom_prompt,
        metadata: {
          trigger_message: {
            id: message.id,
            body: message.body,
            direction: message.direction,
            dateAdded: message.dateAdded,
            messageType: message.messageType
          }
        }
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    // Update conversation tracking with detected message type
    if (messageType && config.prefer_conversation_type) {
      await supabase
        .from('autopilot_conversation_tracking')
        .update({ detected_message_type: messageType })
        .eq('conversation_id', tracking.conversation_id)
        .eq('user_id', tracking.user_id);
    }

    return response?.id;
  } catch (error) {
    console.error('Error scheduling response:', error);
    return null;
  }
}

async function updateConversationTracking(tracking: any, newMessages: any[]) {
  const supabase = await getSupabase();
  
  if (newMessages.length === 0) return;

  try {
    const latestMessage = newMessages[0]; // Messages are typically in reverse chronological order
    const latestHumanMessage = newMessages.find(msg => msg.direction === 'inbound');

    const updates: any = {
      last_seen_message_id: latestMessage.id,
      updated_at: new Date().toISOString()
    };

    if (latestHumanMessage) {
      updates.last_human_message_id = latestHumanMessage.id;
      updates.last_human_message_at = latestHumanMessage.dateAdded;
    }

    await supabase
      .from('autopilot_conversation_tracking')
      .update(updates)
      .eq('id', tracking.id);

    // 🔄 SYNC: Also update conversation metadata with latest message ID
    await syncMessageTrackingData(tracking.conversation_id, tracking.user_id, latestMessage.id);

  } catch (error) {
    console.error('Error updating conversation tracking:', error);
  }
}

async function processScheduledResponses() {
  const supabase = await getSupabase();
  
  try {
    // Get responses that are due to be sent
    const { data: dueResponses, error } = await supabase
      .from('autopilot_scheduled_responses')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50);

    if (error) {
      throw error;
    }

    console.log(`📤 Processing ${dueResponses?.length || 0} due responses`);

    let sent = 0;
    let cancelled = 0;

    for (const response of dueResponses || []) {
      try {
        await processScheduledResponse(response);
        sent++;
      } catch (error) {
        console.error(`Error processing scheduled response ${response.id}:`, error);
        
        // Update retry count and status
        await supabase
          .from('autopilot_scheduled_responses')
          .update({
            retry_count: response.retry_count + 1,
            last_error: error instanceof Error ? error.message : 'Unknown error',
            status: response.retry_count >= response.max_retries ? 'failed' : 'pending'
          })
          .eq('id', response.id);
        cancelled++;
      }
    }

    return { sent, cancelled };
  } catch (error) {
    console.error('Error processing scheduled responses:', error);
    return { sent: 0, cancelled: 0 };
  }
}

async function processScheduledResponse(response: any) {
  const supabase = await getSupabase();
  
  try {
    // Check if user has responded since this was scheduled (cancel if so)
    if (response.ai_config?.cancel_on_user_reply !== false) {
      const { data: recentMessages } = await supabase
        .from('autopilot_conversation_tracking')
        .select('last_human_message_at')
        .eq('conversation_id', response.conversation_id)
        .eq('user_id', response.user_id)
        .single();

      if (recentMessages?.last_human_message_at && 
          new Date(recentMessages.last_human_message_at) > new Date(response.created_at)) {
        // User responded after this was scheduled, cancel it
        await supabase
          .from('autopilot_scheduled_responses')
          .update({ status: 'cancelled' })
          .eq('id', response.id);
        
        console.log(`🚫 Cancelled response ${response.id} - user responded`);
        return;
      }
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(response);
    
    if (!aiResponse) {
      throw new Error('Failed to generate AI response');
    }

    // Send response via GHL API using the configured message type
    const messageType = response.message_type || 'TYPE_SMS';
    const sentMessage = await sendGHLMessage(response.conversation_id, response.user_id, aiResponse, messageType);
    
    // Update response record
    await supabase
      .from('autopilot_scheduled_responses')
      .update({
        status: 'sent',
        generated_response: aiResponse,
        generated_at: new Date().toISOString(),
        sent_at: new Date().toISOString()
      })
      .eq('id', response.id);

    // Update conversation tracking - get current counts first
    const { data: currentTracking } = await supabase
      .from('autopilot_conversation_tracking')
      .select('ai_replies_count, ai_replies_today')
      .eq('conversation_id', response.conversation_id)
      .eq('user_id', response.user_id)
      .single();

    await supabase
      .from('autopilot_conversation_tracking')
      .update({
        last_ai_message_id: sentMessage.id,
        last_ai_message_at: new Date().toISOString(),
        ai_replies_count: (currentTracking?.ai_replies_count || 0) + 1,
        ai_replies_today: (currentTracking?.ai_replies_today || 0) + 1
      })
      .eq('conversation_id', response.conversation_id)
      .eq('user_id', response.user_id);

    // Log to response history
    await supabase
      .from('autopilot_response_history')
      .insert({
        conversation_id: response.conversation_id,
        user_id: response.user_id,
        scheduled_response_id: response.id,
        trigger_message_id: response.trigger_message_id,
        response_message_id: sentMessage.id,
        trigger_received_at: response.created_at,
        response_scheduled_at: response.scheduled_at,
        response_sent_at: new Date().toISOString(),
        delay_minutes: Math.round((Date.now() - new Date(response.created_at).getTime()) / 60000),
        response_content: aiResponse,
        ai_agent_id: response.ai_agent_id,
        ai_config: response.ai_config,
        was_successful: true
      });

    console.log(`Sent AI response for conversation ${response.conversation_id}`);

    // AUTO-TRAIN: Train the conversation after sending autopilot AI response
    try {
      console.log(`AUTO-TRAIN: Training conversation ${response.conversation_id} after autopilot response...`);
      await trainConversationAfterAutopilotResponse(response);
    } catch (trainError) {
      console.warn(`Background training failed for conversation ${response.conversation_id}:`, trainError);
      // Don't fail the response if training fails
    }

  } catch (error) {
    console.error(`Failed to process response ${response.id}:`, error);
    throw error;
  }
}

async function generateAIResponse(response: any): Promise<string | null> {
  try {
    // Import here to avoid circular dependencies
    const { postFastAPI } = await import('@/lib/fastapi-utils');
    
    // Get the currently active AI agent instead of hardcoded selection
    let agentData = null;
    let agentPrompt = 'You are a helpful AI assistant.';
    let agentName = 'Default Assistant';
    let aiConfig = {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      humanlikeBehavior: true
    };
    
    try {
      // Use the active AI agent system
      agentData = await getActiveAIAgent();
      
      if (agentData) {
        // Extract agent configuration using new data structure
        const agentConfiguration = agentData.configuration || {};
        const agentDataFields = agentData.data || {};
        
        // Build system prompt from personality + intent + additional info
        const personality = agentDataFields.personality || '';
        const intent = agentDataFields.intent || '';
        const additionalInfo = agentDataFields.additionalInformation || '';
        
        if (personality || intent) {
          agentPrompt = [
            personality && `Personality: ${personality}`,
            intent && `Intent: ${intent}`,
            additionalInfo && `Additional Information: ${additionalInfo}`
          ].filter(Boolean).join('\n\n');
        }
        
        agentName = agentData.name || 'AI Agent';
        
        // Use agent's AI configuration
        aiConfig = {
          model: agentConfiguration.model || 'gpt-4o-mini',
          temperature: agentConfiguration.temperature || 0.7,
          humanlikeBehavior: agentConfiguration.humanlikeBehavior !== false
        };
        
        console.log('Autopilot using active agent:', { 
          agentId: agentData.id, 
          agentName, 
          model: aiConfig.model,
          temperature: aiConfig.temperature,
          promptLength: agentPrompt.length 
        });
      }
    } catch (agentError) {
      console.log('Could not fetch active AI agent for autopilot, using defaults:', agentError instanceof Error ? agentError.message : 'Unknown error');
    }
    
    const data = await postFastAPI('/ai/conversation/response-suggestions/enhanced', {
      userId: response.user_id,
      conversationId: response.conversation_id,
      autopilot: true,
      context: response.context || '',
      lastCustomerMessage: response.last_customer_message,
      recentMessages: response.recent_messages || [],
      knowledgebaseId: response.conversation_id,
      additionalKnowledgebaseIds: response.additional_kb_ids || [],
      // Use active agent ID or fallback to 'default'
      aiAgentId: agentData?.id || 'default',
      // Include required fields for enhanced endpoint
      systemPrompt: agentPrompt,
      agentName: agentName,
      // Include AI configuration from active agent
      temperature: aiConfig.temperature,
      model: aiConfig.model,
      humanlikeBehavior: aiConfig.humanlikeBehavior
    }, {
      userId: response.user_id
    });

    return data.response_suggestion || data.autopilot_response || null;

  } catch (error) {
    console.error('Error generating AI response:', error);
    return null;
  }
}

async function detectMessageTypeFromConversation(conversationId: string, userId: string) {
  try {
    // Get recent messages to detect conversation type
    const messagesResponse = await fetchGhlApiWithRefresh(
      `/conversations/${conversationId}/messages?limit=20`,
      userId
    );

    const messages = messagesResponse?.messages?.messages || [];
    
    // Count message types to determine most common
    const typeCounts: Record<string, number> = {};
    for (const msg of messages) {
      if (msg.messageType) {
        typeCounts[msg.messageType] = (typeCounts[msg.messageType] || 0) + 1;
      }
    }

    // Return most common type (internal format)
    const validInternalTypes = MESSAGE_TYPE_MAPPING.map(m => m.internal);
    let mostCommonType = 'TYPE_SMS';
    let maxCount = 0;

    for (const [type, count] of Object.entries(typeCounts)) {
      // Convert GHL type back to internal type if needed
      const internalType = validInternalTypes.includes(type) ? type : mapGHLToInternalType(type);
      
      if (validInternalTypes.includes(internalType) && count > maxCount) {
        mostCommonType = internalType;
        maxCount = count;
      }
    }

    console.log(`🔍 Detected message type for conversation ${conversationId}: ${mostCommonType} (${maxCount} messages)`);
    return mostCommonType;
  } catch (error) {
    console.error(`Error detecting message type for conversation ${conversationId}:`, error);
    return null;
  }
}

async function sendGHLMessage(conversationId: string, userId: string, message: string, messageType: string = 'TYPE_SMS', contactId?: string) {
  try {
    // Convert internal type to GHL API type
    const ghlType = mapInternalToGHLType(messageType);
    
    console.log(`📤 Sending ${ghlType} message to conversation ${conversationId}:`, message.substring(0, 100) + '...');
    
    // Get contact ID from conversation if not provided
    let finalContactId = contactId;
    if (!finalContactId) {
      try {
        const conversationResponse = await fetchGhlApiWithRefresh(
          `/conversations/${conversationId}`,
          userId
        );
        finalContactId = conversationResponse?.contactId;
      } catch (error) {
        console.error('Error getting contact ID from conversation:', error);
        throw new Error('Could not determine contact ID for message sending');
      }
    }

    if (!finalContactId) {
      throw new Error('Contact ID is required for sending messages');
    }

    // Use the new GHL Messages API format
    const response = await fetchGhlApiWithRefresh(
      '/conversations/messages',
      userId,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Version': '2021-04-15'
        },
        body: JSON.stringify({
          type: ghlType,
          message: message,
          contactId: finalContactId
        })
      }
    );

    console.log(`✅ Message sent successfully via LeadConnector Messages API:`, {
      conversationId: response?.conversationId,
      messageId: response?.messageId,
      type: ghlType
    });

    return response;
  } catch (error) {
    console.error('Error sending LeadConnector message:', error);
    throw error;
  }
} 

// **NEW:** Create missing tracking record
async function createMissingTrackingRecord(config: any) {
  const supabase = await getSupabase();
  
  const trackingData = {
    user_id: config.user_id,
    conversation_id: config.conversation_id,
    location_id: config.location_id,
    autopilot_enabled: true,
    conversation_status: 'open',
    ai_replies_count: 0,
    ai_replies_today: 0,
    last_reply_date: new Date().toISOString().split('T')[0],
    data: {
      created_from_poll: true,
      created_at: new Date().toISOString()
    }
  };

  const { data, error } = await supabase
    .from('autopilot_conversation_tracking')
    .insert(trackingData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create tracking record: ${error.message}`);
  }

  return data;
}

// **NEW:** Update last checked time
async function updateLastCheckedTime(trackingId: string) {
  const supabase = await getSupabase();
  
  await supabase
    .from('autopilot_conversation_tracking')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', trackingId);
}

// **ENHANCED:** Analytics functions
async function updateAnalyticsStart(configs: any[]) {
  const supabase = await getSupabase();
  const today = new Date().toISOString().split('T')[0];
  
  // Group by user and location
  const userLocations = new Map();
  configs.forEach(config => {
    const key = `${config.user_id}:${config.location_id}`;
    if (!userLocations.has(key)) {
      userLocations.set(key, { user_id: config.user_id, location_id: config.location_id, count: 0 });
    }
    userLocations.get(key).count++;
  });

  for (const [key, data] of userLocations) {
    await supabase
      .from('autopilot_analytics')
      .upsert({
        user_id: data.user_id,
        date: today,
        location_id: data.location_id,
        total_conversations_monitored: data.count
      }, {
        onConflict: 'user_id,date,location_id'
      });
  }
}

async function incrementMessagesReceived(userId: string, locationId: string, count: number) {
  const supabase = await getSupabase();
  const today = new Date().toISOString().split('T')[0];
  
  await supabase.rpc('increment_autopilot_metric', {
    p_user_id: userId,
    p_date: today,
    p_location_id: locationId,
    p_metric: 'total_messages_received',
    p_increment: count
  });
}

async function incrementResponsesCancelled(userId: string, locationId: string) {
  const supabase = await getSupabase();
  const today = new Date().toISOString().split('T')[0];
  
  await supabase.rpc('increment_autopilot_metric', {
    p_user_id: userId,
    p_date: today,
    p_location_id: locationId,
    p_metric: 'total_responses_cancelled',
    p_increment: 1
  });
}

async function incrementResponsesFailed(userId: string, locationId: string) {
  const supabase = await getSupabase();
  const today = new Date().toISOString().split('T')[0];
  
  await supabase.rpc('increment_autopilot_metric', {
    p_user_id: userId,
    p_date: today,
    p_location_id: locationId,
    p_metric: 'total_responses_failed',
    p_increment: 1
  });
}

async function updateAnalyticsEnd(configs: any[], processed: number, scheduled: number, cancelled: number) {
  const supabase = await getSupabase();
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate success rate
  const total = scheduled + cancelled;
  const successRate = total > 0 ? (scheduled / total) * 100 : 0;
  
  // Update success rate for all active locations
  const locations = [...new Set(configs.map(c => ({ user_id: c.user_id, location_id: c.location_id })))];
  
  for (const location of locations) {
    await supabase
      .from('autopilot_analytics')
      .update({
        success_rate: successRate,
        metrics: {
          last_poll_at: new Date().toISOString(),
          last_poll_processed: processed,
          last_poll_scheduled: scheduled,
          last_poll_cancelled: cancelled
        }
      })
      .eq('user_id', location.user_id)
      .eq('date', today)
      .eq('location_id', location.location_id);
  }
} 

// Auto-training function for autopilot responses
async function trainConversationAfterAutopilotResponse(response: any) {
  try {
    console.log('📥 AUTO-TRAIN: Fetching messages for training...');
    
    // Fetch messages for training
    const messagesResponse = await fetchGhlApiWithRefresh(
      `/conversations/${response.conversation_id}/messages?limit=100`,
      response.user_id
    );

    if (!messagesResponse?.messages?.messages?.length) {
      console.warn('No messages found for training');
      return;
    }

    const messages = messagesResponse.messages.messages;
    console.log(`🔄 AUTO-TRAIN: Training with ${messages.length} messages`);

    // Call the internal training API
    const trainResponse = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'}/api/ai/conversation/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        conversationId: response.conversation_id,
        locationId: response.location_id || 'autopilot',
        messages,
        temperature: response.ai_config?.temperature || 0.7,
        model: response.ai_config?.model || 'gpt-4o-mini',
        humanlikeBehavior: response.ai_config?.humanlikeBehavior || true,
        silent: true // Background training flag
      })
    });
    
    const trainData = await trainResponse.json();
    
    if (trainData?.success) {
      console.log('✅ AUTO-TRAIN: Autopilot background training completed successfully');
    } else {
      console.warn('Autopilot background training failed:', trainData?.error);
    }
  } catch (error) {
    console.error('Error in autopilot background training:', error);
    throw error;
  }
}

// 🔄 SYNC: Message tracking between autopilot and conversation metadata
async function syncMessageTrackingData(conversationId: string, userId: string, lastMessageId: string) {
  const supabase = await getSupabase();
  
  try {
    // Update autopilot tracking
    await supabase
      .from('autopilot_conversation_tracking')
      .update({
        last_seen_message_id: lastMessageId,
        updated_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    // Update conversation metadata
    await supabase
      .from('conversation_meta_data')
      .update({
        lastmessageid: lastMessageId,
        updated_at: new Date().toISOString()
      })
      .eq('conv_id', conversationId)
      .eq('user_id', userId);

    console.log(`🔄 SYNC: Message tracking updated for conversation ${conversationId}`);
  } catch (error) {
    console.error('Error syncing message tracking data:', error);
  }
}
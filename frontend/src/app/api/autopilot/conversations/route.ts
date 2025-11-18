import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const supabase = await createClient();

    // Query the correct autopilot_configs table for enabled autopilot conversations
    const { data: autopilotConfigs, error: configError } = await supabase
      .from('autopilot_configs')
      .select(`
        id,
        conversation_id,
        location_id,
        is_enabled,
        reply_delay_minutes,
        max_replies_per_conversation,
        max_replies_per_day,
        message_type,
        ai_agent_id,
        metadata,
        created_at,
        updated_at,
        ai_agents!left(id, name)
      `)
      .eq('user_id', user.id);

    if (configError) {
      console.error('Error fetching autopilot configs:', configError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch autopilot configurations'
      }, { status: 500 });
    }

    // Also get conversation tracking data for additional metrics
    const { data: trackingData, error: trackingError } = await supabase
      .from('autopilot_conversation_tracking')
      .select(`
        conversation_id,
        contact_name,
        contact_phone,
        contact_email,
        ai_replies_count,
        ai_replies_today,
        last_human_message_at,
        last_ai_message_at,
        conversation_status
      `)
      .eq('user_id', user.id);

    if (trackingError) {
      console.warn('Warning: Could not fetch tracking data:', trackingError);
    }

    // Create a map of tracking data for quick lookup
    const trackingMap = new Map();
    if (trackingData) {
      trackingData.forEach(track => {
        trackingMap.set(track.conversation_id, track);
      });
    }

    // Transform the data for the frontend
    const conversations = (autopilotConfigs || []).map(config => {
      const tracking = trackingMap.get(config.conversation_id);
      
      // Extract contact info from multiple sources with priority order
      const contactMetadata = config.metadata?.contactMetadata;
      const conversationMetadata = config.metadata?.conversationMetadata;
      
      // NEW: Check for enhanced contact info from conversation metadata
      const enhancedContactInfo = config.metadata?.contactInfo;
      
      // Prioritize enhanced contact info, then metadata, then tracking data
      const contactName = enhancedContactInfo?.name ||
                         contactMetadata?.fullName || 
                         contactMetadata?.firstName || 
                         tracking?.contact_name || 
                         `Conversation ${config.conversation_id.slice(0, 8)}`;
      
      const contactEmail = enhancedContactInfo?.email ||
                          contactMetadata?.email || 
                          tracking?.contact_email || '';
      
      const contactPhone = enhancedContactInfo?.phone ||
                          contactMetadata?.phone || 
                          tracking?.contact_phone || '';
      
      // Use conversation metadata for better display - prioritize tracking data, then enhanced contact-based names
      const conversationName = tracking?.data?.conversationName ||
                              conversationMetadata?.conversationName ||
                              (contactName && contactName !== 'Unknown Contact' && !contactName.startsWith('Conversation ') 
                                ? `${contactName} Conversation` 
                                : `Conversation ${config.conversation_id.slice(0, 8)}`);
      
      return {
        conversationId: config.conversation_id,
        locationId: config.location_id,
        isActive: config.is_enabled,
        responsesToday: tracking?.ai_replies_today || 0,
        totalResponses: tracking?.ai_replies_count || 0,
        agentName: (config.ai_agents as any)?.[0]?.name || `Agent ${config.ai_agent_id?.slice(0, 8) || 'Default'}`,
        contactName: contactName,
        contactPhone: contactPhone,
        contactEmail: contactEmail,
        conversationName: conversationName,
        lastActivity: tracking?.last_human_message_at || tracking?.last_ai_message_at || config.updated_at,
        conversationStatus: tracking?.conversation_status || conversationMetadata?.status || 'open',
        createdAt: config.created_at,
        updatedAt: config.updated_at,
        // Enhanced metadata for UI display
        metadata: {
          hasContactInfo: !!(enhancedContactInfo?.name || contactMetadata?.firstName || contactMetadata?.email),
          hasConversationInfo: !!conversationMetadata?.conversationName,
          setupDate: config.metadata?.setupDate || config.created_at,
          contactSource: enhancedContactInfo?.source || contactMetadata?.source || 'unknown',
          dataQuality: {
            hasUrlContactInfo: !!enhancedContactInfo?.name,
            hasApiContactInfo: !!contactMetadata?.firstName,
            hasTrackingInfo: !!tracking?.contact_name,
            contactInfoSource: enhancedContactInfo?.source || contactMetadata?.source || 'tracking'
          }
        },
        settings: {
          replyDelayMinutes: config.reply_delay_minutes,
          maxRepliesPerConversation: config.max_replies_per_conversation,
          maxRepliesPerDay: config.max_replies_per_day,
          messageType: config.message_type,
          agentId: config.ai_agent_id
        }
      };
    });

    // Sort by most recently updated
    conversations.sort((a, b) => 
      new Date(b.lastActivity || b.updatedAt).getTime() - 
      new Date(a.lastActivity || a.updatedAt).getTime()
    );

    const activeCount = conversations.filter(c => c.isActive).length;
    const totalResponsesToday = conversations.reduce((sum, c) => sum + c.responsesToday, 0);

    return NextResponse.json({
      success: true,
      conversations,
      stats: {
        total: conversations.length,
        active: activeCount,
        inactive: conversations.length - activeCount,
        responsesToday: totalResponsesToday
      },
      message: `Found ${conversations.length} autopilot configurations (${activeCount} active)`
    });

  } catch (error) {
    console.error('Error fetching autopilot conversations:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 

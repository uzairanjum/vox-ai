import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const body = await req.json();
    const {
      conversationId,
      locationId,
      contactName,
      contactPhone,
      contactEmail,
      conversationStatus,
      conversationType,
      conversationName,
      autopilotEnabled,
      lastSeen
    } = body;

    if (!conversationId || !locationId) {
      return NextResponse.json({
        success: false,
        error: 'conversationId and locationId are required'
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Upsert autopilot conversation tracking data
    const trackingData = {
      user_id: user.id,
      conversation_id: conversationId,
      location_id: locationId,
      contact_name: contactName || 'Unknown Contact',
      contact_phone: contactPhone || '',
      contact_email: contactEmail || '',
      conversation_status: conversationStatus || 'open',
      conversation_type: conversationType || 'SMS',
      autopilot_enabled: autopilotEnabled !== false,
      last_seen_message_id: null, // Will be updated by cron job
      last_human_message_at: null, // Will be updated by cron job
      last_ai_message_at: null, // Will be updated by cron job
      ai_replies_count: 0,
      ai_replies_today: 0,
      last_reply_date: new Date().toISOString().split('T')[0], // Current date
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      data: {
        setupDate: lastSeen || new Date().toISOString(),
        initialContactName: contactName,
        conversationName: conversationName || `Conversation ${conversationId.slice(0, 8)}`,
        source: 'manual_toggle'
      }
    };

    console.log('💾 Creating autopilot conversation tracking:', {
      conversationId: trackingData.conversation_id,
      contactName: trackingData.contact_name,
      contactEmail: trackingData.contact_email,
      contactPhone: trackingData.contact_phone,
      conversationType: trackingData.conversation_type
    });

    const { data: tracking, error } = await supabase
      .from('autopilot_conversation_tracking')
      .upsert(trackingData, {
        onConflict: 'conversation_id,user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('💥 Error creating autopilot tracking:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create autopilot conversation tracking'
      }, { status: 500 });
    }

    console.log('✅ Autopilot conversation tracking created successfully:', {
      id: tracking.id,
      conversationId: tracking.conversation_id,
      contactName: tracking.contact_name
    });

    return NextResponse.json({
      success: true,
      message: 'Autopilot conversation tracking created successfully',
      data: {
        id: tracking.id,
        conversationId: tracking.conversation_id,
        contactName: tracking.contact_name,
        contactEmail: tracking.contact_email,
        contactPhone: tracking.contact_phone,
        conversationType: tracking.conversation_type,
        autopilotEnabled: tracking.autopilot_enabled
      }
    });

  } catch (error) {
    console.error('Error creating autopilot tracking:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

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

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    const supabase = await createClient();

    let query = supabase
      .from('autopilot_conversation_tracking')
      .select('*')
      .eq('user_id', user.id);

    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }

    const { data: tracking, error } = await query;

    if (error) {
      console.error('Error fetching autopilot tracking:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch autopilot tracking data'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: tracking,
      count: tracking?.length || 0
    });

  } catch (error) {
    console.error('Error fetching autopilot tracking:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 
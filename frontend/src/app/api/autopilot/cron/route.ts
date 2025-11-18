import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🕐 Autopilot cron job triggered');

    // Get the base URL from the request
    const baseUrl = new URL(request.url).origin;
    
    // Call the autopilot poll endpoint
    const pollResponse = await fetch(`${baseUrl}/api/autopilot/poll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Autopilot-Cron'
      }
    });

    const pollData = await pollResponse.json();

    if (!pollResponse.ok) {
      throw new Error(`Poll failed: ${pollData.error || 'Unknown error'}`);
    }

    console.log('✅ Autopilot cron completed:', pollData);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      poll_result: pollData
    });

  } catch (error) {
    console.error('❌ Autopilot cron failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Allow POST requests as well for flexibility
  return GET(request);
} 
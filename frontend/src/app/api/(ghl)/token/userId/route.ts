// app/api/token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from '@/utils/auth/user';
import { getValidGhlTokens, refreshGhlTokens } from '@/_components/actions/ghl/tokens';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get valid tokens
    const tokens = await getValidGhlTokens(user.id);
    
    if (!tokens.accessToken) {
      // Try to refresh if we have a refresh token
      if (tokens.refreshToken) {
        const refreshed = await refreshGhlTokens(user.id, tokens.refreshToken);
        if (refreshed.accessToken) {
          return NextResponse.json({ 
            token: refreshed.accessToken,
            expiresIn: 300 // 5 minutes
          });
        }
      }
      
      return NextResponse.json(
        { error: "No valid LeadConnector access token. Please re-authenticate." },
        { status: 401 }
      );
    }

    // Return the valid token
    return NextResponse.json({ 
      token: tokens.accessToken,
      expiresIn: 300 // 5 minutes
    });

  } catch (error) {
    console.error("Token API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get token" },
      { status: 500 }
    );
  }
}
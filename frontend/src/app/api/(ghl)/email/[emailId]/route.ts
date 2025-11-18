// // app/api/ghl/email/[id]/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { getSupabase } from "@/utils/supabase/getSupabase";

// const GHL_API_BASE = "https://services.leadconnectorhq.com";

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const supabase = await getSupabase();
//     const { data: userData } = await supabase.auth.getUser();

//     if (!userData?.user) {
//       console.log("❌ No authenticated user");
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // 🔍 Get stored GHL provider data
//     const { data: provider, error } = await supabase
//       .from("provider_data")
//       .select("token, refresh, expires")
//       .eq("auth_provider_id", userData.user.id)
//       .eq("type", "GHL_LOCATION")
//       .single();

//     if (error) {
//       console.error("❌ Error fetching provider data:", error);
//     }

//     if (!provider?.token) {
//       console.log("❌ No GHL token found for user:", userData.user.id);
//       return NextResponse.json({ error: "No GHL token found" }, { status: 401 });
//     }

//     // ✅ Debug log: print the token
//     console.log("🔑 Using GHL token:", provider.token);

//     // TODO: (optional) if expired, refresh using provider.refresh

//     // 🔐 Call GHL API
//     const ghlRes = await fetch(
//       `${GHL_API_BASE}/conversations/messages/email/${params.id}`,
//       {
//         headers: {
//           Authorization: `Bearer ${provider.token}`,
//           "Content-Type": "application/json",
//           Version: "2021-07-28",
//         },
//       }
//     );

//     if (!ghlRes.ok) {
//       console.error("❌ GHL API error:", ghlRes.status, ghlRes.statusText);
//       return NextResponse.json(
//         { error: `Failed to fetch email: ${ghlRes.statusText}` },
//         { status: ghlRes.status }
//       );
//     }

//     const data = await ghlRes.json();
//     console.log("📩 GHL API response:", data);
//     return NextResponse.json(data);
//   } catch (err: any) {
//     console.error("❌ Server error:", err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }
import { fetchGhlApiWithRefresh } from '@/lib/leadconnector/fetchApi';
import { PROVIDER_TYPE } from '@/utils/config/providerTypes';
import { getCurrentUser } from '@/utils/auth/user';
import { getCurrentUserProviderData } from '@/utils/providers/providerUtils';
import { NextRequest } from 'next/server';

interface ErrorResponse {
  success: false;
  error: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ emailId: string }> }
) {
  try {
    console.log('GET /api/(ghl)/email/[emailId] - Starting');
    
    // Get current user
    const user = await getCurrentUser();
    if (!user?.id) {
      console.log('User authentication failed');
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    // Get conversation ID and validate
    const { emailId } = await params;
    if (!emailId) {
      return Response.json({
        success: false,
        error: 'Missing conversation ID'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Get provider data
    const providerData = await getCurrentUserProviderData(PROVIDER_TYPE.GHL_LOCATION);
    if (!providerData?.token || !providerData.data?.location_id) {
      return Response.json({
        success: false,
        error: 'Provider authentication failed'
      } satisfies ErrorResponse, { status: 401 });
    }

    // Make API request with auto token refresh
    const data = await fetchGhlApiWithRefresh(
      `/conversations/messages/email/${emailId}`,
      user.id
    );

    // Return successful response
    return Response.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

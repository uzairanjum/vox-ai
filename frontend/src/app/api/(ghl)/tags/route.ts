// // // app/api/tags/route.ts
// // import { NextRequest } from "next/server";
// // import { fetchGhlApi } from "@/lib/leadconnector/fetchApi";
// // import { getCurrentUserFromRequest } from "@/utils/supabase/route-handler-client";

// // export async function GET(request: NextRequest) {
// //   try {
// //     const user = await getCurrentUserFromRequest();

// //     console.log('🔍 API Route User:', user); // Add this log

// //     if (!user?.id) {
// //       return Response.json(
// //         { success: false, error: "Unauthorized" },
// //         { status: 401 }
// //       );
// //     }

// //     const locationId = request.headers.get("x-location-id");
// //     if (!locationId) {
// //       return Response.json(
// //         { success: false, error: "Location ID is required" },
// //         { status: 400 }
// //       );
// //     }

// //     const data = await fetchGhlApi(`/locations/${locationId}/tags`, user.id, {
// //       method: "GET",
// //     });

// //     return Response.json({ success: true, data }, { status: 200 });
// //   } catch (error) {
// //     console.error("❌ Error fetching GHL tags:", error);
// //     return Response.json(
// //       { success: false, error: error instanceof Error ? error.message : "Internal server error" },
// //       { status: 500 }
// //     );
// //   }
// // }
// import { fetchGhlApi } from '@/lib/leadconnector/fetchApi';
// import { PROVIDER_INFO, PROVIDER_TYPE } from '@/utils/config/provider_settings';
// import { getProviderData } from '@/utils/supabase/locationTokenUtils';
// import { NextRequest } from 'next/server';

// interface ErrorResponse {
//   success: false;
//   error: string;
// }

// export async function GET(request: NextRequest) {
//   try {
//     const locationId = request.headers.get('x-location-id');

//     if (!locationId) {
//       return Response.json({
//         success: false,
//         error: 'Location ID is required'
//       } satisfies ErrorResponse, { status: 400 });
//     }

//     const providerData = await getProviderData(PROVIDER_INFO[PROVIDER_TYPE.GHL_LOCATION].name);

//     if (!providerData?.token) {
//       return Response.json({
//         success: false,
//         error: 'No access token found'
//       } satisfies ErrorResponse, { status: 401 });
//     }

//     const data = await fetchGhlApi(
//       `/locations/${locationId}`, providerData.token
//     );
// //
//     return Response.json({
//       success: true,
//       data
//     });
//   } catch (error) {
//     console.error('Error fetching location:', error);
//     return Response.json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Internal server error'
//     } satisfies ErrorResponse, { status: 500 });
//   }
// }

// app/api/tags/route.ts - ALTERNATIVE APPROACH
// app/api/tags/route.ts - Simpler version
// app/api/tags/route.ts - Debug version
// app/api/tags/route.ts
// app/api/tags/route.ts
// app/api/tags/route.ts - Use GHL token directly
import { NextRequest } from "next/server";
import { fetchGhlApi } from "@/lib/leadconnector/fetchApi";

interface GhlTokenPayload {
  authClass?: string;
  authClassId?: string;
  source?: string;
  sourceId?: string;
  channel?: string;
  primaryAuthClassId?: string;
}

function extractUserIdFromGhlToken(token: string): string | null {
  try {
    // For now, use the hardcoded user ID since GHL tokens don't contain Supabase user info
    return "501202fd-61d8-43f1-ad74-34af48f92e3c";
  } catch (error) {
    console.error("Error extracting user ID from token:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json(
        { success: false, error: "Missing or invalid authorization" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    if (!token) return;

    // Extract user ID from GHL token or use default
    const userId = extractUserIdFromGhlToken(token) || "";

    const locationId = request.headers.get("x-location-id");

    if (!locationId) {
      return Response.json(
        { success: false, error: "Location ID is required" },
        { status: 400 }
      );
    }

    const data = await fetchGhlApi(`/locations/${locationId}/tags`, userId, {
      method: "GET",
    });

    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
    // console.error("❌ Error fetching GHL tags:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

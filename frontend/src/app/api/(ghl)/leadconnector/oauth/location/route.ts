import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/utils/supabase/getSupabase";
import { saveLocationToken } from "@/utils/supabase/locationTokenUtils";
import { ROUTES } from "@/utils/auth/supabase-auth";

const GHL_LOCATION_STATE = "ghl-oauth-location-state";

export async function GET(request: NextRequest) {
    const baseUrl = new URL(request.url).origin;
    
    try {
        // 🔍 Get URL parameters
        const searchParams = request.nextUrl.searchParams;
        const companyId = searchParams.get("companyId");
        const locationId = searchParams.get("locationId");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        const error_description = searchParams.get("error_description");

        // ❌ Handle errors
        if (error || error_description) {
            console.error("OAuth error:", error, error_description);
            return NextResponse.redirect(`${baseUrl}${ROUTES.error}`);
        }

        if (!companyId || !locationId || !state) {
            console.error("Missing required parameters");
            return NextResponse.redirect(`${baseUrl}${ROUTES.error}`);
        }

        if (state !== GHL_LOCATION_STATE) {
            console.error("Invalid state parameter");
            return NextResponse.redirect(`${baseUrl}${ROUTES.error}`);
        }

        // 🔐 Get access token for location
        const tokenResponse = await fetch("https://services.leadconnectorhq.com/oauth/locationToken", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.GHL_CLIENT_ID!,
                client_secret: process.env.GHL_CLIENT_SECRET!,
                location_id: locationId,
                company_id: companyId,
            }),
        });

        if (!tokenResponse.ok) {
            throw new Error(`Token request failed: ${tokenResponse.statusText}`);
        }

        const tokenData = await tokenResponse.json();

        // 🛡️ Authenticate user via Supabase
        const supabase = await getSupabase();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
            throw new Error("User authentication failed");
        }

        // 💾 Save location token
        const locationToken = {
            location_id: locationId,
            token: tokenData.access_token,
            provider_name: 'ghl',
            company_id: companyId,
            user_type: tokenData.userType || 'Location'
        };

        await saveLocationToken(locationToken, userData.user.id);

        // ✅ Redirect to success page
        return NextResponse.redirect(`${new URL(request.url).origin}${ROUTES.dashboard}`);
    } catch (error) {
        console.error("Location OAuth error:", error);
        return NextResponse.redirect(`${baseUrl}${ROUTES.error}`);
    }
}

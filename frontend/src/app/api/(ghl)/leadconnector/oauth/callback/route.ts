// @ts-nocheck

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/utils/supabase/getSupabase";
import { ROUTES } from "@/utils/auth/supabase-auth";
import { updateProfile } from "@/app/profile/actions/profile";
import { GHL_OAUTH_STATE } from "@/_components/ghl/constants";
import { PROVIDER_TYPE } from "@/utils/config/providerTypes";

const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID;
const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;

export async function GET(request: NextRequest) {
    const baseUrl = new URL(request.url).origin;
    
    try {
        // 🔍 Get URL parameters
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        const error_description = searchParams.get("error_description");

        // ❌ Handle errors
        if (error || error_description) {
            console.error("OAuth error:", error, error_description);
            return NextResponse.redirect(`${baseUrl}${ROUTES.error}`);
        }

        if (!code) {
            console.error("Missing authorization code");
            return NextResponse.redirect(`${baseUrl}${ROUTES.error}`);
        }

        // Verify state parameter
        if (state !== GHL_OAUTH_STATE) {
            console.error("Invalid OAuth state");
            return NextResponse.redirect(`${baseUrl}${ROUTES.error}`);
        }

        // 🔐 Exchange code for token
        const tokenResponse = await fetch("https://services.leadconnectorhq.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: GHL_CLIENT_ID!,
                client_secret: GHL_CLIENT_SECRET!,
                grant_type: "authorization_code",
                code,
            }),
        });

        if (!tokenResponse.ok) {
            console.error("Token exchange failed:", await tokenResponse.text());
            throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('Token data received:', tokenData);

        // 🛡️ Authenticate User via Supabase
        const supabase = await getSupabase();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
            throw new Error("User authentication failed");
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profile')
            .select('id')
            .eq('user_id_auth', userData.user.id)
            .single();

        if (profileError || !profile?.id) {
            console.error('Error fetching user profile:', profileError);
            throw new Error('User profile not found');
        }

        // Prepare provider data
        const providerData = {
            name: 'leadconnector',
            type: PROVIDER_TYPE.GHL_LOCATION,
            auth_provider_id: userData.user.id,
            provider_id_ref: profile.id,
            token: tokenData.access_token,
            refresh: tokenData.refresh_token || null,
            expires: tokenData.expires_in ? 
                new Date(Date.now() + tokenData.expires_in * 1000).toISOString() :
                null,
            data: {
                location_id: tokenData.locationId,
                user_type: tokenData.userType,
                company_id: tokenData.companyId,
                user_id: tokenData.userId,
                company_name: tokenData.companyName,
                location_name: tokenData.locationName
            }
        };

        console.log('Saving provider data:', providerData);

        // Try to update existing provider data first
        const { data: existingProvider } = await supabase
            .from('provider_data')
            .select('id')
            .eq('auth_provider_id', userData.user.id)
            .eq('type', PROVIDER_TYPE.GHL_LOCATION)
            .single();

        let saveError;
        if (existingProvider) {
            const { error } = await supabase
                .from('provider_data')
                .update(providerData)
                .eq('id', existingProvider.id);
            saveError = error;
        } else {
            const { error } = await supabase
                .from('provider_data')
                .insert([providerData]);
            saveError = error;
        }

        if (saveError) {
            console.error('Error saving provider data:', saveError);
            throw saveError;
        }

        console.log('Provider data saved successfully');

        // Update username from GHL data
        const username = tokenData.companyName || tokenData.locationName || "GHL User";
        const formData = new FormData();
        formData.append('username', username);
        await updateProfile(formData);

        // ✅ Redirect to success page
        return NextResponse.redirect(`${baseUrl}${ROUTES.dashboard}`);
    } catch (error) {
        console.error("OAuth callback error:", error);
        return NextResponse.redirect(`${baseUrl}${ROUTES.error}`);
    }
}

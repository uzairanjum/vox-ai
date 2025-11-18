"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GHL_AUTH_URL, DEFAULT_SCOPE, GHL_OAUTH_STATE } from "../constants";

export async function startGhlAuth() {
  const clientId = process.env.GHL_CLIENT_ID;
  const redirectUri = process.env.GHL_REDIRECT_URI;
  const scope = process.env.GHL_SCOPES || DEFAULT_SCOPE;
  if (!clientId || !redirectUri) {
    console.error("Missing environment variables:", { clientId, redirectUri });
    throw new Error("Missing required OAuth environment variables: GHL_CLIENT_ID or GHL_REDIRECT_URI");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope.trim(),
    state: GHL_OAUTH_STATE // Add state parameter for security
  });
  const authUrl = `${GHL_AUTH_URL}?${params.toString()}`;
console.log(`clientId: ${clientId},redirectUri:${redirectUri},scope:${scope},params:${params},authUrl:${authUrl}`)

  return redirect(authUrl);
}

export async function getGhlAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("ghl_agency_access_token")?.value;
  return token || null;
}
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const client_id = searchParams.get("client_id");
    const redirect_uri = searchParams.get("redirect_uri");
    const scope = searchParams.get("scope");

    // Log received parameters
    // console.log("Received client_id:", client_id);
    // console.log("Received redirect_uri:", redirect_uri);
    // console.log("Received scope:", scope);

    // Validate required parameters
    if (!client_id || !redirect_uri || !scope) {
      console.error("Missing required parameters");
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Construct the authorization URL
    const authorizeUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}`;
    // console.log("Constructed authorize URL:", authorizeUrl);

    // Return a JSON response with the redirect URL (since we can't modify redirect headers)
    return NextResponse.json(
      { redirect_url: authorizeUrl },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error in GET request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle CORS for preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 204, headers: corsHeaders });
}

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

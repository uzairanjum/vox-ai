// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

interface AutopilotRequest {
  userId: string;
  conversationId: string;
  lastCustomerMessage: string;
  systemPrompt?: string;
  temperature?: number;
  model?: string;
  autopilot?: boolean;
  recentMessages?: Array<any>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      conversationId,
      lastCustomerMessage,
      systemPrompt,
      temperature = 0.7,
      model = "gpt-4o-mini",
      recentMessages = [],
    }: AutopilotRequest = await req.json();

    // Validate
    if (!lastCustomerMessage || !conversationId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build messages for OpenAI
    const messages = [
      {
        role: "system",
        content:
          systemPrompt ||
          "You are a helpful customer service assistant. Be professional, concise (50-150 words), and helpful.",
      },
    ];

    // Add recent messages (last 3 for context)
    recentMessages.slice(-3).forEach((msg: any) => {
      messages.push({
        role: msg.direction === "inbound" ? "user" : "assistant",
        content: msg.body || msg.message || "",
      });
    });

    // Add current message
    messages.push({
      role: "user",
      content: lastCustomerMessage,
    });

    // Call OpenAI
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: 300,
        }),
      }
    );

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const aiResponse = data.choices[0].message.content.trim();

    // Simple confidence score
    const confidenceScore =
      aiResponse.length > 20 && aiResponse.length < 300 ? 0.8 : 0.6;

    // Return response
    const response = {
      response_suggestion: aiResponse,
      autopilot_response: aiResponse,
      confidence_score: confidenceScore,
      conversationId,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Autopilot Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to generate response",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

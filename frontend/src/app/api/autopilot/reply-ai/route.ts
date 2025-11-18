// @ts-nocheck

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/utils/supabase/getSupabase";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";

import { generateText } from "ai";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { message, messageId, model } = await request.json();
    console.log("model------ should --- work --- now", model);
    if (!message || !messageId) {
      return NextResponse.json(
        { error: "Message and messageId are required" },
        { status: 400 }
      );
    }

    // ✅ Check deduplication in Supabase
    const { data: existing } = await supabase
      .from("processed_messages")
      .select("message_id")
      .eq("message_id", messageId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ skipped: true }, { status: 200 });
    }

    await supabase.from("processed_messages").insert({ message_id: messageId });

    // ✅ Call Groq AI model
    const { text: aiReply } = await generateText({
      model: openai(model), // 👈 Pass model like "gpt-4o-mini", "gpt-4", "gpt-3.5-turbo"
      prompt: `You are a helpful assistant that replies clearly and politely to customer messages. Message: "${message}"`,
    });

    // const { text: aiReply } = await generateText({
    //   model: groq(model),
    //   prompt: `You are a helpful assistant that replies clearly and politely to customer messages. Message: "${message}"`,
    // });

    if (!aiReply) {
      throw new Error("Groq returned empty reply");
    }

    return NextResponse.json({ reply: aiReply }, { status: 200 });
  } catch (error) {
    console.error("💥 Error in AI Reply API:", error);
    return NextResponse.json(
      {
        error: "Failed to generate AI reply",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
